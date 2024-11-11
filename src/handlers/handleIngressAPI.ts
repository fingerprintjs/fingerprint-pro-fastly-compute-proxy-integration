import { IntegrationEnv, isOpenClientResponseEnabled } from '../env'
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
      "Open client response plugings are disabled. Set OPEN_CLIENT_RESPONSE_PLUGINS_ENABLED to `true` in your proxy integration's Config store to enable them."
    )
    return response
  }

  console.log('Plugin system for Open Client Response is enabled')
  if (response.status >= 200 && response.status < 300) {
    console.log('Response is successful, plugins will be executed')
    const responseBody = await response.text()
    console.log('Response body parsed!')
    Promise.resolve().then(() => {
      console.log('Plugins started!')
      processOpenClientResponse(responseBody, response, env).catch((e) =>
        console.error('Processing open client response failed: ', e)
      )
    })
    console.log('Avoided waiting for plugins, returning response', Date.now())
    return cloneFastlyResponse(responseBody, response)
  }
  console.log('Plugin system did not worked because response is not successful')

  return response
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
      return createFallbackErrorResponse(e)
    }
  }

  try {
    return await makeIngressRequest(request, env)
  } catch (e) {
    return createErrorResponseForIngress(request, e)
  }
}
