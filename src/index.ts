/// <reference types="@fastly/js-compute" />
import { handleReq } from './handler'
import {
  agentScriptDownloadPathVarName,
  decryptionKeyVarName,
  getResultPathVarName,
  IntegrationEnv,
  openClientResponseVarName,
  proxySecretVarName,
} from './env'
import { ConfigStore } from 'fastly:config-store'
import { returnHttpResponse } from './utils/returnHttpResponse'
import { createFallbackErrorResponse } from './utils'
import { setClientIp } from './utils/clientIp'
import { env } from 'fastly:env'
import { SecretStore } from 'fastly:secret-store'

addEventListener('fetch', (event) => event.respondWith(handleRequest(event)))

export async function handleRequest(event: FetchEvent): Promise<Response> {
  setClientIp(event.client.address)
  try {
    const request = event.request
    const envObj = await getEnvObject()
    return handleReq(request, envObj).then(returnHttpResponse)
  } catch (e) {
    console.error(e)
    return createFallbackErrorResponse('something went wrong')
  }
}

async function getEnvObject(): Promise<IntegrationEnv> {
  const serviceId = env('FASTLY_SERVICE_ID')
  const storeNamePrefix = process.env.STORE_NAME_PREFIX
  const configStoreName = `${storeNamePrefix}_ConfigStore_${serviceId}`
  const secretStoreName = `${storeNamePrefix}_SecretStore_${serviceId}`
  let configStore
  let secretStore
  try {
    configStore = new ConfigStore(configStoreName)
    secretStore = new SecretStore(secretStoreName)
  } catch (e) {
    console.error(e)
  }

  return {
    AGENT_SCRIPT_DOWNLOAD_PATH: configStore?.get(agentScriptDownloadPathVarName) ?? null,
    GET_RESULT_PATH: configStore?.get(getResultPathVarName) ?? null,
    OPEN_CLIENT_RESPONSE_ENABLED: configStore?.get(openClientResponseVarName) ?? null,
    PROXY_SECRET: (await secretStore?.get(proxySecretVarName))?.plaintext() ?? null,
    DECRYPTION_KEY: (await secretStore?.get(decryptionKeyVarName))?.plaintext() ?? null,
  }
}
