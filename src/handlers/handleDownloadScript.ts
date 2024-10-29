import { addTrafficMonitoringSearchParamsForProCDN, createFallbackErrorResponse, getAgentScriptPath } from '../utils'
import { CacheOverride } from 'fastly:cache-override'

function makeDownloadScriptRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  url.pathname = getAgentScriptPath(url.searchParams)
  addTrafficMonitoringSearchParamsForProCDN(url)

  const newRequest = new Request(url.toString(), request as RequestInit)
  newRequest.headers.delete('Cookie')

  console.log(`Downloading script from cdnEndpoint ${url.toString()}...`)
  const cache = new CacheOverride('override', { ttl: 60 }) // Caches sub-request by 60 seconds for agent download script
  return fetch(newRequest, { backend: 'fpcdn.io', cacheOverride: cache })
}

export async function handleDownloadScript(request: Request): Promise<Response> {
  try {
    return await makeDownloadScriptRequest(request)
  } catch (e) {
    return createFallbackErrorResponse(e)
  }
}
