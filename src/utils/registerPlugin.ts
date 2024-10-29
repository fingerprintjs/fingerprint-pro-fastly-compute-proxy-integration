import { EventResponse } from '@fingerprintjs/fingerprintjs-pro-server-api'
import loadedPlugins from '../../plugins'

export type ProcessOpenClientResponseContext = {
  event: EventResponse | null
  httpResponse: Response
}

export type ProcessUnsealedDataPluginFunction = (context: ProcessOpenClientResponseContext) => void | Promise<void>
type PluginType = 'processOpenClientResponse'

export type ProcessOpenClientResponsePlugin = {
  name: string
  type: PluginType
  callback: ProcessUnsealedDataPluginFunction
}

export type Plugin = ProcessOpenClientResponsePlugin // This type will be union of types if more plugin/hook types gets introduced
export const plugins: Plugin[] = loadedPlugins
