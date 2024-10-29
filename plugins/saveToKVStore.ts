// To enable this plugin, add an entry to `/plugins/index.ts`

import { KVStore } from 'fastly:kv-store'
import { ProcessOpenClientResponseContext } from '../src/utils/registerPlugin'
export async function saveFingerprintResultToKVStore(context: ProcessOpenClientResponseContext) {
  const requestId = context.event?.products.identification?.data?.requestId
  if (!requestId) {
    return
  }
  const store = new KVStore('FingerprintResults')
  await store.put(requestId, JSON.stringify(context.event))
}
