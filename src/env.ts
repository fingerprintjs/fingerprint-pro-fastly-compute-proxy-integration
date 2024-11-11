export type IntegrationEnv = {
  AGENT_SCRIPT_DOWNLOAD_PATH: string | null
  GET_RESULT_PATH: string | null
  PROXY_SECRET: string | null
  OPEN_CLIENT_RESPONSE_PLUGINS_ENABLED: string | null
  DECRYPTION_KEY: string | null
}

const Defaults: IntegrationEnv = {
  AGENT_SCRIPT_DOWNLOAD_PATH: 'agent',
  GET_RESULT_PATH: 'result',
  PROXY_SECRET: null,
  OPEN_CLIENT_RESPONSE_PLUGINS_ENABLED: 'false',
  DECRYPTION_KEY: null,
}

function getVarOrDefault(
  variable: keyof IntegrationEnv,
  defaults: IntegrationEnv
): (env: IntegrationEnv) => string | null {
  return function (env: IntegrationEnv): string | null {
    return (env[variable] || defaults[variable]) as string | null
  }
}

function isVarSet(variable: keyof IntegrationEnv): (env: IntegrationEnv) => boolean {
  return function (env: IntegrationEnv): boolean {
    return Boolean(env[variable]?.trim())
  }
}

export const agentScriptDownloadPathVarName = 'AGENT_SCRIPT_DOWNLOAD_PATH'
const getAgentPathVar = getVarOrDefault(agentScriptDownloadPathVarName, Defaults)
export const isScriptDownloadPathSet = isVarSet(agentScriptDownloadPathVarName)

export function getScriptDownloadPath(env: IntegrationEnv): string {
  const agentPathVar = getAgentPathVar(env)
  return `/${agentPathVar}`
}

export const getResultPathVarName = 'GET_RESULT_PATH'
const getGetResultPathVar = getVarOrDefault(getResultPathVarName, Defaults)
export const isGetResultPathSet = isVarSet(getResultPathVarName)

export function getGetResultPath(env: IntegrationEnv): string {
  const getResultPathVar = getGetResultPathVar(env)
  return `/${getResultPathVar}(/.*)?`
}

export const proxySecretVarName = 'PROXY_SECRET'
const getProxySecretVar = getVarOrDefault(proxySecretVarName, Defaults)
export const isProxySecretSet = isVarSet(proxySecretVarName)

export const decryptionKeyVarName = 'DECRYPTION_KEY'
const getDecryptionKeyVar = getVarOrDefault(decryptionKeyVarName, Defaults)
export const isDecryptionKeySet = isVarSet(decryptionKeyVarName)

export const openClientResponseVarName = 'OPEN_CLIENT_RESPONSE_PLUGINS_ENABLED'
export const isOpenClientResponseSet = (env: IntegrationEnv) =>
  env.OPEN_CLIENT_RESPONSE_PLUGINS_ENABLED === 'true' || env.OPEN_CLIENT_RESPONSE_PLUGINS_ENABLED === 'false'

export const isOpenClientResponseEnabled = (env: IntegrationEnv) =>
  env[openClientResponseVarName]?.toLowerCase() === 'true'

export function getProxySecret(env: IntegrationEnv): string | null {
  return getProxySecretVar(env)
}

export function getDecryptionKey(env: IntegrationEnv): string | null {
  return getDecryptionKeyVar(env)
}

export function getStatusPagePath(): string {
  return `/status`
}
