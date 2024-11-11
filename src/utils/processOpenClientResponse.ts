import { plugins } from './registerPlugin'
import { unsealData } from './unsealData'
import { cloneFastlyResponse } from './cloneFastlyResponse'
import { getDecryptionKey, IntegrationEnv } from '../env'
import { waitForMs } from './waitForMs'

type FingerprintSealedIngressResponseBody = {
  sealedResult: string
}

export async function processOpenClientResponse(
  body: string | undefined,
  response: Response,
  env: IntegrationEnv
): Promise<void> {
  await waitForMs(25, () => console.log('Hello from the plugin MANAGER!', Date.now()))
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
