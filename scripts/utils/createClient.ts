import * as Fastly from 'fastly'

export type FastlyClientTypes =
  | 'version'
  | 'service'
  | 'package'
  | 'domain'
  | 'configStore'
  | 'configStoreItem'
  | 'backend'
  | 'resource'
export function createClient(api: FastlyClientTypes) {
  let client
  switch (api) {
    case 'service':
      client = new Fastly.ServiceApi()
      break
    case 'version':
      client = new Fastly.VersionApi()
      break
    case 'package':
      client = new Fastly.PackageApi()
      break
    case 'domain':
      client = new Fastly.DomainApi()
      break
    case 'configStore':
      client = new Fastly.ConfigStoreApi()
      break
    case 'configStoreItem':
      client = new Fastly.ConfigStoreItemApi()
      break
    case 'backend':
      client = new Fastly.BackendApi()
      break
    case 'resource':
      client = new Fastly.ResourceApi()
      break
  }
  Fastly.ApiClient.instance.authenticate(process.env.FASTLY_API_TOKEN)
  return client
}
