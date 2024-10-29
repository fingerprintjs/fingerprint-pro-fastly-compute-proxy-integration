import { beforeAll, beforeEach, describe, expect } from '@jest/globals'
import { ConfigStore } from 'fastly:config-store'
import { makeRequest } from '../utils/makeRequest'
import { handleRequest } from '../../src'
import packageJson from '../../package.json'

describe('Download Script', () => {
  let receivedUrl: string
  let requestHeaders: Headers

  beforeAll(() => {
    jest.spyOn(globalThis, 'fetch').mockImplementation((request, init) => {
      if (request instanceof Request) {
        receivedUrl = request.url.toString()
        requestHeaders = request.headers
      }
      return globalThis.fetch(request, init)
    })
  })
  beforeEach(() => {
    const config = new ConfigStore('Fingerprint')
    // @ts-ignore
    config.set('AGENT_SCRIPT_DOWNLOAD_PATH', 'download')
    // Reset fetch spy calls between tests if needed
    jest.clearAllMocks()
    receivedUrl = ''
    requestHeaders = new Headers()
  })

  it('should set pathname to agentScriptPath', async () => {
    const request = makeRequest(new URL('https://test/download?apiKey=apiKey'))
    await handleRequest(request)

    const url = new URL(receivedUrl)
    expect(url.pathname).toBe('/v3/apiKey')
  })

  it('should set pathname to agentScriptPath with loaderVersion', async () => {
    const request = makeRequest(new URL('https://test/download?apiKey=apiKey&loaderVersion=3.2.1'))
    await handleRequest(request)

    const url = new URL(receivedUrl)
    expect(url.pathname).toBe('/v3/apiKey/loader_v3.2.1.js')
  })

  it('should add traffic monitoring', async () => {
    const request = makeRequest(new URL('https://test/download'))
    await handleRequest(request)

    const url = new URL(receivedUrl)
    const trafficMonitoringParam = url.searchParams.get('ii')
    const [integration, version, type] = trafficMonitoringParam?.split('/') ?? []

    expect(integration).toBe('fingerprint-pro-fastly-compute')
    expect(version).toBe(packageJson.version)
    expect(type).toBe('procdn')
  })

  it('should append when multiple traffic monitoring params', async () => {
    const request = makeRequest(new URL('https://test/download?ii=fingerprintjs-pro-react/v1.2.3'))
    await handleRequest(request)

    const url = new URL(receivedUrl)
    const iiValues = url.searchParams.getAll('ii')
    expect(iiValues.length).toBe(2)
    expect(iiValues[0]).toBe('fingerprintjs-pro-react/v1.2.3')
    expect(iiValues[1]).toBe(`fingerprint-pro-fastly-compute/${packageJson.version}/procdn`)
  })

  it('should delete cookie header', async () => {
    const request = makeRequest(new URL('https://test/download'), { headers: { Cookie: 'hello=world' } })
    await handleRequest(request)

    expect(requestHeaders.has('Cookie')).toBe(false)
  })

  it('should send request to fpcdn backend', async () => {
    const request = makeRequest(new URL('https://test/download'))
    await handleRequest(request)

    expect(fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        backend: 'fpcdn.io',
        cacheOverride: expect.objectContaining({ mode: 'override', options: { ttl: 60 } }),
      })
    )
  })
})
