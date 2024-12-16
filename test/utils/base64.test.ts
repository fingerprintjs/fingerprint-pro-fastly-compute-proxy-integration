import { describe, expect, it } from '@jest/globals'
import { base64StrToUint8Array } from '../../src/utils/base64'

describe('base64StrToUint8Array', () => {
  it('should correctly convert a base64 string to Uint8Array', () => {
    const testCases = [
      { input: 'SGVsbG8gV29ybGQ=', expected: [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100] },
      { input: 'VGVzdCBTdHJpbmc=', expected: [84, 101, 115, 116, 32, 83, 116, 114, 105, 110, 103] },
      { input: 'QmFzZTY0', expected: [66, 97, 115, 101, 54, 52] },
    ]

    testCases.forEach(({ input, expected }) => {
      const result = base64StrToUint8Array(input)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(Array.from(result)).toEqual(expected)
    })
  })

  it('should handle empty string input', () => {
    const result = base64StrToUint8Array('')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(0)
  })

  it('should handle Unicode characters correctly', () => {
    const input = 'SGVsbG8g8J+ZjA==' // "Hello 🙌" in base64
    const expected = [72, 101, 108, 108, 111, 32, 240, 159, 153, 140]

    const result = base64StrToUint8Array(input)
    expect(Array.from(result)).toEqual(expected)
  })
})
