import { env } from 'fastly:env'
import { ConfigStore } from 'fastly:config-store'
import { SecretStore } from 'fastly:secret-store'

export function getNamesForStores() {
  const serviceId = env('FASTLY_SERVICE_ID')
  const storeNamePrefix = process.env.STORE_NAME_PREFIX
  const configStoreName = `${storeNamePrefix}_ConfigStore_${serviceId}`
  const secretStoreName = `${storeNamePrefix}_SecretStore_${serviceId}`

  return {
    configStoreName,
    secretStoreName,
  }
}
export function getConfigStore() {
  const { configStoreName } = getNamesForStores()
  return new ConfigStore(configStoreName)
}

export function getSecretStore() {
  const { secretStoreName } = getNamesForStores()
  return new SecretStore(secretStoreName)
}
