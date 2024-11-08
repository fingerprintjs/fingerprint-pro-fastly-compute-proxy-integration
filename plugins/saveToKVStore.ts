// To enable this plugin, add an entry to `/plugins/index.ts`

import { KVStore } from 'fastly:kv-store'
import { ProcessOpenClientResponseContext } from '../src/utils/registerPlugin'
import { getConfigStore } from '../src/utils/getStore'
export async function saveFingerprintResultToKVStore(context: ProcessOpenClientResponseContext) {
  const configStore = getConfigStore()
  const isPluginEnabled = configStore?.get('SAVE_TO_KV_STORE_PLUGIN_ENABLED') === 'true'

  if (isPluginEnabled) {
    const requestId = context.event?.products.identification?.data?.requestId
    if (!requestId) {
      return
    }
    const store = new KVStore('FingerprintResults')
    await store.put(requestId, JSON.stringify(context.event))
  }
}
