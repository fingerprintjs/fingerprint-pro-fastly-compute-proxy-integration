import { beforeAll, beforeEach, expect } from '@jest/globals'
import { ConfigStore } from 'fastly:config-store'
import { makeRequest } from '../utils/makeRequest'
import { handleRequest } from '../../src'

describe('No Match', () => {
  beforeAll(() => {
    jest.spyOn(globalThis, 'fetch').mockImplementation((request, init) => {
      return globalThis.fetch(request, init)
    })
  })
  beforeEach(() => {
    const config = new ConfigStore('Fingerprint')
    // @ts-ignore
    config.set('GET_RESULT_PATH', 'result')
    // @ts-ignore
    config.set('AGENT_SCRIPT_DOWNLOAD_PATH', 'agent')
    // Reset fetch spy calls between tests if needed
    jest.clearAllMocks()
  })

  it('should return 404 when no route matches', async () => {
    const request = makeRequest(new URL('https://test/no-match'))
    const response = await handleRequest(request)

    expect(response.status).toBe(404)
    expect(await response.json()).toStrictEqual(expect.objectContaining({ error: 'unmatched path /no-match' }))
  })
})
