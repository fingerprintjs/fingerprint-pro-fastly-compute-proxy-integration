import { gcm } from '@noble/ciphers/aes'
import { inflateRaw } from 'pako'

const SEALED_HEADER = new Uint8Array([0x9e, 0x85, 0xdc, 0xed])

// Decrypts data using "@noble/ciphers/aes" package, because default node encryption API is not available in edge runtime
export function decrypt(sealedData: Uint8Array, decryptionKey: Uint8Array) {
  const nonceLength = 12
  const nonce = sealedData.slice(SEALED_HEADER.length, SEALED_HEADER.length + nonceLength)
  const ciphertext = sealedData.slice(SEALED_HEADER.length + nonceLength)

  const aes = gcm(decryptionKey, nonce)
  const data = aes.decrypt(ciphertext)
  const decompressed = inflateRaw(data)

  return new TextDecoder().decode(decompressed)
}
