import { plugins } from './registerPlugin'
import { unsealData } from './unsealData'
import { SecretStore } from 'fastly:secret-store'
import { FingerprintDecryptionKeyName, FingerprintSecretStoreName } from '../env'
import { cloneFastlyResponse } from './cloneFastlyResponse'

type FingerprintSealedIngressResponseBody = {
  sealedResult: string
}

async function getDecryptionKey() {
  const secretStore = new SecretStore(FingerprintSecretStoreName)
  return secretStore.get(FingerprintDecryptionKeyName).then((v) => v?.plaintext())
}

export async function processOpenClientResponse(body: string | undefined, response: Response): Promise<void> {
  const decryptionKey = await getDecryptionKey()
  if (!decryptionKey) {
    throw new Error('Decryption key not found in secret store')
  }
  const parsedText = JSON.parse(body ?? '') as FingerprintSealedIngressResponseBody
  const event = await unsealData(parsedText.sealedResult, decryptionKey)
  const filteredPlugins = plugins.filter((t) => t.type === 'processOpenClientResponse')
  for (const filteredPlugin of filteredPlugins) {
    try {
      const clonedHttpResponse = cloneFastlyResponse(body, response)
      await filteredPlugin.callback({ event, httpResponse: clonedHttpResponse })
    } catch (e: unknown) {
      console.error(`Plugin[${filteredPlugin.name}]`, e)
    }
  }
}
