export function base64StrToUint8Array(str: string) {
  const binary = atob(str)
  const data = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    data[i] = binary.charCodeAt(i)
  }

  return data
}
