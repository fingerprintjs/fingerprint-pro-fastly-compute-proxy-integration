import { plugins } from './registerPlugin'
import { unsealData } from './unsealData'
import { cloneFastlyResponse } from './cloneFastlyResponse'
import { getDecryptionKey, IntegrationEnv } from '../env'

type FingerprintSealedIngressResponseBody = {
  sealedResult: string
}

export async function processOpenClientResponse(
  bodyBytes: ArrayBuffer,
  response: Response,
  env: IntegrationEnv
): Promise<void> {
  let responseBody: string | null = null
  try {
    responseBody = new TextDecoder('utf-8').decode(bodyBytes)
  } catch (e) {
    console.log(`Error occurred when decoding response to UTF-8: ${e}.`)
  }

  if (responseBody == null) {
    console.log('responseBody is null. Skipping plugins and returning the response.')
    return
  }

  const decryptionKey = getDecryptionKey(env)
  if (!decryptionKey) {
    throw new Error('Decryption key not found in secret store')
  }
  const parsedText = JSON.parse(responseBody) as FingerprintSealedIngressResponseBody
  const event = unsealData(parsedText.sealedResult, decryptionKey)
  const filteredPlugins = plugins.filter((t) => t.type === 'processOpenClientResponse')
  for (const filteredPlugin of filteredPlugins) {
    try {
      const clonedHttpResponse = cloneFastlyResponse(bodyBytes, response)
      await filteredPlugin.callback({ event, httpResponse: clonedHttpResponse })
    } catch (e: unknown) {
      console.error(`Plugin[${filteredPlugin.name}]`, e)
    }
  }
}
