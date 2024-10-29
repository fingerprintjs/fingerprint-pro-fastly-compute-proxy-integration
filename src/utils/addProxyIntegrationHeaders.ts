import { getProxySecret, IntegrationEnv } from '../env'
import { getClientIp } from './clientIp'

export function addProxyIntegrationHeaders(headers: Headers, url: string, env: IntegrationEnv) {
  const proxySecret = getProxySecret(env)
  if (proxySecret) {
    headers.set('FPJS-Proxy-Secret', proxySecret)
    headers.set('FPJS-Proxy-Client-IP', getClientIp())
    headers.set('FPJS-Proxy-Forwarded-Host', new URL(url).hostname)
  }
}
