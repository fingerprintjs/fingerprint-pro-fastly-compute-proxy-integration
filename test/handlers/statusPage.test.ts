import { makeRequest } from '../utils/makeRequest'
import { handleRequest } from '../../src'
import { expect } from '@jest/globals'
import { ConfigStore } from 'fastly:config-store'
import packageJson from '../../package.json'
import { SecretStore } from 'fastly:secret-store'
import {
  agentScriptDownloadPathVarName,
  decryptionKeyVarName,
  getResultPathVarName,
  openClientResponseVarName,
  proxySecretVarName,
} from '../../src/env'

describe('Status Page', () => {
  it('should return text/html with status 200', async () => {
    const request = makeRequest(new URL('https://test/status'))
    const response = await handleRequest(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html')
  })

  it('should show error for undefined required configurations', async () => {
    const config = new ConfigStore('Fingerprint')
    const secret = new SecretStore('Fingerprint')
    // @ts-ignore
    config.set(getResultPathVarName, null)
    // @ts-ignore
    config.set(agentScriptDownloadPathVarName, null)
    // @ts-ignore
    config.set(openClientResponseVarName, 'true')
    // @ts-ignore
    secret.set(proxySecretVarName, null)
    // @ts-ignore
    secret.set(decryptionKeyVarName, null)

    const request = makeRequest(new URL('https://test/status'))
    const response = await handleRequest(request)

    const responseText = await response.text()
    const isAllSet = responseText.includes('All required configurations are set')
    const agentDownloadScriptPathError = responseText.includes(
      '<strong>AGENT_SCRIPT_DOWNLOAD_PATH </strong> (REQUIRED) is not set'
    )
    const resultPathError = responseText.includes('<strong>GET_RESULT_PATH </strong> (REQUIRED) is not set')
    const proxySecretError = responseText.includes('<strong>PROXY_SECRET </strong> (REQUIRED) is not set')
    const decryptionKeyError = responseText.includes('<strong>DECRYPTION_KEY </strong> (REQUIRED) is not set')

    expect(isAllSet).toBe(false)
    expect(agentDownloadScriptPathError).toBe(true)
    expect(resultPathError).toBe(true)
    expect(proxySecretError).toBe(true)
    expect(decryptionKeyError).toBe(true)
  })

  it('should show correctly setup env', async () => {
    const config = new ConfigStore('Fingerprint')
    // @ts-ignore
    config.set('AGENT_SCRIPT_DOWNLOAD_PATH', 'download')
    // @ts-ignore
    config.set('GET_RESULT_PATH', 'result')
    // @ts-ignore
    config.set('OPEN_CLIENT_RESPONSE_ENABLED', 'true')

    const secretStore = new SecretStore('Fingerprint')
    // @ts-ignore
    secretStore.set('PROXY_SECRET', 'secret')
    // @ts-ignore
    secretStore.set('DECRYPTION_KEY', 'secret')

    const request = makeRequest(new URL('https://test/status'))
    const response = await handleRequest(request)

    const responseText = await response.text()
    const isAllSet = responseText.includes('All required configurations are set')
    console.log(responseText)

    expect(isAllSet).toBe(true)
  })

  it('should have style tag with nonce', async () => {
    const pattern = /<style nonce='(.*)'>/g

    const request = makeRequest(new URL('https://test/status'))
    const response = await handleRequest(request)

    const responseText = await response.text()
    const hasNonceTag = pattern.test(responseText)

    expect(hasNonceTag).toBe(true)
  })

  it('should show correct integration version', async () => {
    const version = packageJson.version
    const pattern = /Integration version: (.*)/g

    const request = makeRequest(new URL('https://test/status'))
    const response = await handleRequest(request)

    const responseText = await response.text()
    const matches = pattern.exec(responseText)
    const versionMatch = matches ? matches[1] : null
    expect(versionMatch).toBe(version)
  })

  it('should return 405 when method is not get', async () => {
    const request = makeRequest(new URL('https://test/status'), { method: 'POST' })
    const response = await handleRequest(request)

    expect(response.status).toBe(405)
  })
})
