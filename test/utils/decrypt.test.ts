import { describe, expect, it, jest, beforeAll, afterAll } from '@jest/globals'
import { decrypt } from '../../src/utils/decrypt'
import { gcm } from '@noble/ciphers/aes'
import { inflateRaw } from 'pako'

jest.mock('@noble/ciphers/aes')
jest.mock('pako')

describe('decrypt', () => {
  const SEALED_HEADER = new Uint8Array([0x9e, 0x85, 0xdc, 0xed])

  let originalTextDecoder: typeof TextDecoder

  beforeAll(() => {
    originalTextDecoder = TextDecoder
  })

  afterAll(() => {
    // @ts-ignore
    TextDecoder = originalTextDecoder
  })

  it('should correctly decrypt and decompress the data', () => {
    const mockDecryptedData = new Uint8Array([1, 2, 3, 4])
    const mockDecompressedData = new Uint8Array([5, 6, 7, 8])
    const mockDecryptedText = 'Decrypted Text'

    const mockDecrypt = jest.fn().mockReturnValue(mockDecryptedData)
    const mockGcm = jest.mocked(gcm)
    mockGcm.mockReturnValue({ decrypt: mockDecrypt } as any)

    jest.mocked(inflateRaw).mockReturnValue(mockDecompressedData)

    const sealedData = new Uint8Array([...SEALED_HEADER, ...new Uint8Array(12), ...new Uint8Array(20)])
    const decryptionKey = new Uint8Array(32)

    class MockTextDecoder {
      decode() {
        return mockDecryptedText
      }
    }
    // @ts-ignore
    TextDecoder = MockTextDecoder

    const result = decrypt(sealedData, decryptionKey)

    expect(mockGcm).toHaveBeenCalledWith(decryptionKey, expect.any(Uint8Array))
    expect(mockDecrypt).toHaveBeenCalledWith(expect.any(Uint8Array))
    expect(inflateRaw).toHaveBeenCalledWith(mockDecryptedData)
    expect(result).toBe(mockDecryptedText)
  })

  it('should throw an error if decryption fails', () => {
    const mockDecrypt = jest.fn().mockImplementation(() => {
      throw new Error('Decryption failed')
    })
    const mockGcm = jest.mocked(gcm)
    mockGcm.mockReturnValue({ decrypt: mockDecrypt } as any)

    const sealedData = new Uint8Array([...SEALED_HEADER, ...new Uint8Array(12), ...new Uint8Array(20)])
    const decryptionKey = new Uint8Array(32)

    expect(() => decrypt(sealedData, decryptionKey)).toThrow('Decryption failed')
  })

  it('should throw an error if decompression fails', () => {
    const mockDecryptedData = new Uint8Array([1, 2, 3, 4])
    const mockDecrypt = jest.fn().mockReturnValue(mockDecryptedData)
    const mockGcm = jest.mocked(gcm)
    mockGcm.mockReturnValue({ decrypt: mockDecrypt } as any)

    jest.mocked(inflateRaw).mockImplementation(() => {
      throw new Error('Decompression failed')
    })

    const sealedData = new Uint8Array([...SEALED_HEADER, ...new Uint8Array(12), ...new Uint8Array(20)])
    const decryptionKey = new Uint8Array(32)

    expect(() => decrypt(sealedData, decryptionKey)).toThrow('Decompression failed')
  })
})
