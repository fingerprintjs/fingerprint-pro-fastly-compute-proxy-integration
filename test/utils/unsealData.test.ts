import { describe, expect, it, jest } from '@jest/globals'
import { unsealData } from '../../src/utils/unsealData'
import { base64StrToUint8Array } from '../../src/utils/base64'
import { decrypt } from '../../src/utils/decrypt'

jest.mock('../../src/utils/base64')
jest.mock('../../src/utils/decrypt')

describe('unsealData', () => {
  it('should correctly unseal and parse the data', () => {
    const mockRawSealedData = 'base64EncodedSealedData'
    const mockRawKey = 'base64EncodedKey'
    const mockSealedData = new Uint8Array([1, 2, 3, 4])
    const mockKey = new Uint8Array([5, 6, 7, 8])
    const mockDecryptedResult = '{"key": "value"}'
    const expectedParsedResult = { key: 'value' }

    jest.mocked(base64StrToUint8Array).mockImplementation((input: string) => {
      if (input === mockRawSealedData) {
        return mockSealedData
      }
      if (input === mockRawKey) {
        return mockKey
      }
      throw new Error('Unexpected input')
    })

    jest.mocked(decrypt).mockReturnValue(mockDecryptedResult)

    const result = unsealData(mockRawSealedData, mockRawKey)

    expect(base64StrToUint8Array).toHaveBeenCalledWith(mockRawSealedData)
    expect(base64StrToUint8Array).toHaveBeenCalledWith(mockRawKey)
    expect(decrypt).toHaveBeenCalledWith(mockSealedData, mockKey)
    expect(result).toEqual(expectedParsedResult)
  })

  it('should throw an error if decryption fails', () => {
    const mockRawSealedData = 'base64EncodedSealedData'
    const mockRawKey = 'base64EncodedKey'
    const mockSealedData = new Uint8Array([1, 2, 3, 4])
    const mockKey = new Uint8Array([5, 6, 7, 8])

    jest.mocked(base64StrToUint8Array).mockImplementation((input: string) => {
      if (input === mockRawSealedData) {
        return mockSealedData
      }
      if (input === mockRawKey) {
        return mockKey
      }
      throw new Error('Unexpected input')
    })

    jest.mocked(decrypt).mockImplementation(() => {
      throw new Error('Decryption failed')
    })

    expect(() => unsealData(mockRawSealedData, mockRawKey)).toThrow('Decryption failed')
  })

  it('should throw an error if JSON parsing fails', () => {
    const mockRawSealedData = 'base64EncodedSealedData'
    const mockRawKey = 'base64EncodedKey'
    const mockSealedData = new Uint8Array([1, 2, 3, 4])
    const mockKey = new Uint8Array([5, 6, 7, 8])
    const mockDecryptedResult = 'Invalid JSON'

    jest.mocked(base64StrToUint8Array).mockImplementation((input: string) => {
      if (input === mockRawSealedData) {
        return mockSealedData
      }
      if (input === mockRawKey) {
        return mockKey
      }
      throw new Error('Unexpected input')
    })

    jest.mocked(decrypt).mockReturnValue(mockDecryptedResult)

    expect(() => unsealData(mockRawSealedData, mockRawKey)).toThrow(SyntaxError)
  })
})
