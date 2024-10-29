import { beforeAll, beforeEach, describe, expect } from '@jest/globals'
import { ConfigStore } from 'fastly:config-store'
import { makeRequest } from '../utils/makeRequest'
import { handleRequest } from '../../src'
import cookie from 'cookie'

describe('Browser Cache', () => {
  let requestHeaders: Headers

  beforeAll(() => {
    jest.spyOn(globalThis, 'fetch').mockImplementation((request, init) => {
      if (request instanceof Request) {
        requestHeaders = request.headers
      }
      return globalThis.fetch(request, init)
    })
  })
  beforeEach(() => {
    const config = new ConfigStore('Fingerprint')
    // @ts-ignore
    config.set('GET_RESULT_PATH', 'result')
    // Reset fetch spy calls between tests if needed
    jest.clearAllMocks()
    requestHeaders = new Headers()
  })

  it('should send request to backend fpjs with GET method', async () => {
    const request = makeRequest(new URL('https://test/result'))
    await handleRequest(request)

    expect(fetch).toBeCalledWith(
      expect.objectContaining({ method: 'GET' }),
      expect.objectContaining({ backend: 'api.fpjs.io', cacheOverride: expect.objectContaining({ mode: 'pass' }) })
    )
  })

  it('should delete cookie header', async () => {
    const request = makeRequest(new URL('https://test/result'), { headers: {} })
    await handleRequest(request)

    expect(requestHeaders.has('Cookie')).toBe(false)
  })
})

describe('Ingress', () => {
  let requestHeaders: Headers

  beforeAll(() => {
    jest.spyOn(globalThis, 'fetch').mockImplementation((request, init) => {
      if (request instanceof Request) {
        requestHeaders = request.headers
      }
      return globalThis.fetch(request, init)
    })
  })
  beforeEach(() => {
    const config = new ConfigStore('Fingerprint')
    // @ts-ignore
    config.set('GET_RESULT_PATH', 'result')
    // Reset fetch spy calls between tests if needed
    jest.clearAllMocks()
    requestHeaders = new Headers()
  })

  it('should call fpjs with method POST', async () => {
    const request = makeRequest(new URL('https://test/result'), { method: 'POST' })
    await handleRequest(request)

    expect(fetch).toBeCalledWith(
      expect.objectContaining({ method: 'POST' }),
      expect.objectContaining({ backend: 'api.fpjs.io' })
    )
  })

  it('should remove cookies if iidt not present', async () => {
    const request = makeRequest(new URL('https://test/result'), { method: 'POST', headers: { Cookie: 'hello=world' } })
    await handleRequest(request)

    expect(requestHeaders.has('Cookie')).toBe(false)
  })

  it('should filter cookies except iidt', async () => {
    const request = makeRequest(new URL('https://test/result'), {
      method: 'POST',
      headers: { Cookie: 'hello=world; _iidt=test' },
    })
    await handleRequest(request)

    const cookiesHeader = requestHeaders.get('Cookie')
    const cookieValue = cookie.parse(cookiesHeader ?? '')

    expect(requestHeaders.has('Cookie')).toBe(true)
    expect(cookieValue['hello']).toBe(undefined)
    expect(cookieValue['_iidt']).toBe('test')
  })

  it('should not add proxy integration headers if PROXY_SECRET env not set', async () => {
    const request = makeRequest(new URL('https://test/result'), { method: 'POST' })
    await handleRequest(request)

    expect(requestHeaders.has('FPJS-Proxy-Secret')).toBe(false)
    expect(requestHeaders.has('FPJS-Proxy-Client-IP')).toBe(false)
    expect(requestHeaders.has('FPJS-Proxy-Forwarded-Host')).toBe(false)
  })

  it('should add proxy integration headers if PROXY_SECRET is present', async () => {
    const config = new ConfigStore('Fingerprint')
    // @ts-ignore
    config.set('PROXY_SECRET', 'secret')

    const request = makeRequest(new URL('https://test/result'), { method: 'POST' })
    await handleRequest(request)

    expect(requestHeaders.has('FPJS-Proxy-Secret')).toBe(true)
    expect(requestHeaders.has('FPJS-Proxy-Client-IP')).toBe(true)
    expect(requestHeaders.has('FPJS-Proxy-Forwarded-Host')).toBe(true)
  })

  it('should set client ip if request has header Fastly-Client-IP', async () => {
    const config = new ConfigStore('Fingerprint')
    // @ts-ignore
    config.set('PROXY_SECRET', 'secret')

    const request = makeRequest(new URL('https://test/result'), {
      method: 'POST',
    })
    await handleRequest(request)

    expect(requestHeaders.get('FPJS-Proxy-Client-IP')).toBe('test')
  })
})
