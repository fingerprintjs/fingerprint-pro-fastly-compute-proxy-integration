export function getIngressBackendByRegion(url: URL) {
  const region = url.searchParams.get('region')
  switch (region) {
    case 'eu':
      return 'eu.api.fpjs.io'
    case 'ap':
      return 'ap.api.fpjs.io'
    case 'us':
    default:
      return 'api.fpjs.io'
  }
}
