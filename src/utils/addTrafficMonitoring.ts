import packageJson from '../../package.json'
const INT_VERSION = packageJson.version
const PARAM_NAME = 'ii'

function getTrafficMonitoringValue(type: 'procdn' | 'ingress'): string {
  return `fingerprint-pro-fastly-compute/${INT_VERSION}/${type}`
}

export function addTrafficMonitoringSearchParamsForProCDN(url: URL) {
  url.searchParams.append(PARAM_NAME, getTrafficMonitoringValue('procdn'))
}

export function addTrafficMonitoringSearchParamsForVisitorIdRequest(url: URL) {
  url.searchParams.append(PARAM_NAME, getTrafficMonitoringValue('ingress'))
}
