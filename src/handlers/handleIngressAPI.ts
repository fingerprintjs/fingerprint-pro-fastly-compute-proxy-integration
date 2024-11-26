import { IntegrationEnv, isOpenClientResponseEnabled, isProxySecretSet } from '../env'
import {
  addProxyIntegrationHeaders,
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  createErrorResponseForIngress,
  createFallbackErrorResponse,
} from '../utils'
import { getFilteredCookies } from '../utils/cookie'
import { processOpenClientResponse } from '../utils/processOpenClientResponse'
import { cloneFastlyResponse } from '../utils/cloneFastlyResponse'
import { getIngressBackendByRegion } from '../utils/getIngressBackendByRegion'
import { CacheOverride } from 'fastly:cache-override'

async function makeIngressRequest(receivedRequest: Request, env: IntegrationEnv) {
  if (!isProxySecretSet) {
    console.log("PROXY_SECRET is not set in the integration's Secret store, your integration is not working correctly.")
  }
  const url = new URL(receivedRequest.url)
  url.pathname = ''
  addTrafficMonitoringSearchParamsForVisitorIdRequest(url)
  const oldCookieValue = receivedRequest.headers.get('cookie')
  const newCookieValue = getFilteredCookies(oldCookieValue, (key) => key === '_iidt')
  const request = new Request(url, receivedRequest as RequestInit)
  if (newCookieValue) {
    request.headers.set('cookie', newCookieValue)
  } else {
    request.headers.delete('cookie')
  }
  addProxyIntegrationHeaders(request.headers, receivedRequest.url, env)

  console.log(`sending ingress request to ${url.toString()}...`)
  const response = await fetch(request, { backend: getIngressBackendByRegion(url) })

  if (!isOpenClientResponseEnabled(env)) {
    console.log(
      "Open client response plugins are disabled. Set OPEN_CLIENT_RESPONSE_PLUGINS_ENABLED to `true` in your proxy integration's Config store to enable them."
    )
    return response
  }

  console.log('Plugin system for Open Client Response is enabled')
  if (response.status < 200 || response.status > 299) {
    console.log(
      `Response status is non-successful (HTTP ${response.status}). Skipping plugins and returning the response.`
    )
    return response
  }

  const bodyBytes = await response.arrayBuffer()
  let responseBody: string | null = null
  try {
    responseBody = new TextDecoder('utf-8').decode(bodyBytes)
  } catch (e) {
    console.log(`Error occurred when decoding response to UTF-8: ${e}.`)
  }

  if (responseBody == null) {
    return cloneFastlyResponse(bodyBytes, response)
  }

  Promise.resolve().then(() => {
    processOpenClientResponse(responseBody, response, env).catch((e) =>
      console.error('Processing open client response failed: ', e)
    )
  })

  return cloneFastlyResponse(bodyBytes, response)
}

function makeCacheEndpointRequest(receivedRequest: Request, routeMatches: RegExpMatchArray | undefined) {
  const url = new URL(receivedRequest.url)
  const pathname = routeMatches ? routeMatches[1] : undefined
  url.pathname = pathname ?? ''

  const request = new Request(url, receivedRequest as RequestInit)
  request.headers.delete('Cookie')

  console.log(`sending cache request to ${url}...`)
  return fetch(request, { backend: getIngressBackendByRegion(url), cacheOverride: new CacheOverride('pass') })
}

export async function handleIngressAPI(
  request: Request,
  env: IntegrationEnv,
  routeMatches: RegExpMatchArray | undefined
) {
  if (request.method === 'GET') {
    try {
      return await makeCacheEndpointRequest(request, routeMatches)
    } catch (e) {
      return createFallbackErrorResponse(request, e)
    }
  }

  try {
    return await makeIngressRequest(request, env)
  } catch (e) {
    return createErrorResponseForIngress(request, e)
  }
}
