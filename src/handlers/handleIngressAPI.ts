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
import { Backend } from 'fastly:backend'

async function makeIngressRequest(receivedRequest: Request, env: IntegrationEnv) {
  if (!isProxySecretSet) {
    console.log("PROXY_SECRET is not set in the integration's Secret store, your integration is not working correctly")
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

  const apiBackend = getIngressBackendByRegion(url)
  if (!Backend.exists(apiBackend)) {
    console.log(`Requested backend '${apiBackend}' does not exist. Check your Compute service Hosts configuration.`)
  }

  console.log(`sending ingress request to ${url.toString()}...`)
  const response = await fetch(request, { backend: apiBackend })

  if (!isOpenClientResponseEnabled(env)) {
    console.log(
      "Open client response plugins are disabled. Set OPEN_CLIENT_RESPONSE_PLUGINS_ENABLED to `true` in your proxy integration's Config store to enable them."
    )
    return response
  }

  console.log('Plugin system for Open Client Response is enabled')
  if (response.status >= 200 && response.status < 300) {
    const responseBody = await response.text()
    Promise.resolve().then(() => {
      processOpenClientResponse(responseBody, response, env).catch((e) =>
        console.error('Processing open client response failed: ', e)
      )
    })
    return cloneFastlyResponse(responseBody, response)
  }

  return response
}

function makeCacheEndpointRequest(receivedRequest: Request, routeMatches: RegExpMatchArray | undefined) {
  const url = new URL(receivedRequest.url)
  const pathname = routeMatches ? routeMatches[1] : undefined
  url.pathname = pathname ?? ''

  const request = new Request(url, receivedRequest as RequestInit)
  request.headers.delete('Cookie')

  const apiBackend = getIngressBackendByRegion(url)
  if (!Backend.exists(apiBackend)) {
    console.log(`Requested backend '${apiBackend}' does not exist. Check your Compute service Hosts configuration.`)
  }

  console.log(`sending cache request to ${url}...`)
  return fetch(request, { backend: apiBackend, cacheOverride: new CacheOverride('pass') })
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
      return createFallbackErrorResponse(e)
    }
  }

  try {
    return await makeIngressRequest(request, env)
  } catch (e) {
    return createErrorResponseForIngress(request, e)
  }
}
