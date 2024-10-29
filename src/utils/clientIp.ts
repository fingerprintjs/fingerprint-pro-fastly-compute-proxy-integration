let clientIp = ''

export function setClientIp(ip: string) {
  clientIp = ip
}

export function getClientIp(): string {
  return clientIp
}
