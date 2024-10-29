import { createClient } from '../utils/createClient'
import { activateVersion } from './activateVersion'
import { deployPackage } from './deployPackage'

const CONFIG_STORE_NAME = process.env.CONFIG_STORE_NAME ?? 'Fingerprint'

export async function createService(domain: string) {
  const client = createClient('service')
  try {
    const searchResponse = await client.searchService({ name: domain })
    if (searchResponse && searchResponse.id) {
      return client.getServiceDetail({ service_id: searchResponse.id })
    }
  } catch (e) {
    console.error(`Couldn't find service with name: ${domain}`, e)
  }
  console.log('Creating service', domain)
  const createResponse = await client.createService({
    name: domain,
    type: 'wasm',
  })
  await createDomain(domain, createResponse.id)
  await createOrigin(createResponse.id, domain)
  const configStore = await createConfigStore()
  console.log('config store created')
  console.log('linking config store')
  await linkConfigStore(createResponse.id, 1, configStore.id)
  console.log('config store linked')
  console.log('deploying package')
  await deployPackage(createResponse.id, 1)
  console.log('package deployed')
  console.log('configuring backends')
  await createBackends(createResponse.id, 1)
  console.log('backends configured')
  console.log('activating version 1')
  await activateVersion(createResponse.id, 1)
  console.log('Version 1 activated, Service created!')
  return client.getServiceDetail({ service_id: createResponse.id })
}

async function createOrigin(serviceId: string, domain: string) {
  console.log('Creating default origin')
  const client = createClient('backend')
  await client.createBackend({
    service_id: serviceId,
    version_id: 1,
    address: process.env.DEFAULT_ORIGIN,
    name: 'default-backend',
    port: 80,
    override_host: domain,
    use_ssl: false,
  })
  console.log('Default origin created')
}

async function createDomain(domain: string, serviceId: string) {
  console.log('Creating domain', domain)
  const domainClient = createClient('domain')
  await domainClient.createDomain({
    version_id: 1,
    name: domain,
    service_id: serviceId,
  })
  await domainClient.createDomain({
    version_id: 1,
    name: `fpjs-fastly-${domain.split('.')[0]}.edgecompute.app`,
    service_id: serviceId,
  })
}

async function linkConfigStore(service_id: string, version_id: number, resource_id: string) {
  return createClient('resource').createResource({
    service_id,
    version_id,
    resource_id,
    name: CONFIG_STORE_NAME,
  })
}

async function createConfigStore() {
  console.log('Creating config store')
  const configStoreClient = createClient('configStore')
  const configStoreItemClient = createClient('configStoreItem')
  let configStore
  try {
    configStore = await configStoreClient.createConfigStore({
      name: CONFIG_STORE_NAME,
    })
  } catch (_) {
    const stores = await configStoreClient.listConfigStores()
    return stores.find((t: any) => t.name === CONFIG_STORE_NAME)
  }
  await configStoreItemClient.createConfigStoreItem({
    config_store_id: configStore.id,
    item_key: 'GET_RESULT_PATH',
    item_value: process.env.GET_RESULT_PATH ?? 'result',
  })
  await configStoreItemClient.createConfigStoreItem({
    config_store_id: configStore.id,
    item_key: 'AGENT_SCRIPT_DOWNLOAD_PATH',
    item_value: process.env.AGENT_SCRIPT_DOWNLOAD_PATH ?? 'agent',
  })
  await configStoreItemClient.createConfigStoreItem({
    config_store_id: configStore.id,
    item_key: 'PROXY_SECRET',
    item_value: 'secret',
  })
  await configStoreItemClient.createConfigStoreItem({
    config_store_id: configStore.id,
    item_key: 'OPEN_CLIENT_RESPONSE_ENABLED',
    item_value: 'false',
  })

  return configStore
}

async function createBackends(service_id: string, version_id: number) {
  const client = createClient('backend')
  await client.createBackend({
    service_id,
    version_id,
    address: process.env.FPJS_BACKEND_URL ?? 'api.fpjs.io',
    override_host: process.env.FPJS_BACKEND_URL ?? 'api.fpjs.io',
    name: 'api.fpjs.io',
    port: 443,
  })
  await client.createBackend({
    service_id,
    version_id,
    address: process.env.FPJS_BACKEND_URL ? `eu.${process.env.FPJS_BACKEND_URL}` : 'eu.api.fpjs.io',
    override_host: process.env.FPJS_BACKEND_URL ? `eu.${process.env.FPJS_BACKEND_URL}` : 'eu.api.fpjs.io',
    name: 'eu.api.fpjs.io',
    port: 443,
  })
  await client.createBackend({
    service_id,
    version_id,
    address: process.env.FPJS_BACKEND_URL ? `ap.${process.env.FPJS_BACKEND_URL}` : 'ap.api.fpjs.io',
    override_host: process.env.FPJS_BACKEND_URL ? `ap.${process.env.FPJS_BACKEND_URL}` : 'ap.api.fpjs.io',
    name: 'ap.api.fpjs.io',
    port: 443,
  })
  await client.createBackend({
    service_id,
    version_id,
    address: process.env.FPCDN_URL ?? 'fpcdn.io',
    override_host: process.env.FPCDN_URL ?? 'fpcdn.io',
    name: 'fpcdn.io',
    port: 443,
  })
}
