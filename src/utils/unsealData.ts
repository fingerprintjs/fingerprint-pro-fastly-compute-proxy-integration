import { EventResponse } from '@fingerprintjs/fingerprintjs-pro-server-api'
import { decrypt } from './decrypt'
import { base64StrToUint8Array } from './base64'

export function unsealData(rawSealedData: string, rawKey: string): EventResponse | null {
  const sealedData = base64StrToUint8Array(rawSealedData)
  const key = base64StrToUint8Array(rawKey)
  const result = decrypt(sealedData, key)

  return JSON.parse(result)
}
