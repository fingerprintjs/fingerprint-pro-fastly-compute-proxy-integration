import { plugins } from './registerPlugin'
import { unsealData } from './unsealData'
import { cloneFastlyResponse } from './cloneFastlyResponse'
import { getDecryptionKey, IntegrationEnv } from '../env'

type FingerprintSealedIngressResponseBody = {
  sealedResult: string
}

export async function processOpenClientResponse(
  body: string | null,
  response: Response,
  env: IntegrationEnv
): Promise<void> {
  const decryptionKey = getDecryptionKey(env)
  if (!decryptionKey) {
    throw new Error('Decryption key not found in secret store')
  }
  const parsedText = JSON.parse(body ?? '') as FingerprintSealedIngressResponseBody
  const event = unsealData(parsedText.sealedResult, decryptionKey)
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
