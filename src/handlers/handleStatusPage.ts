import {
  IntegrationEnv,
  isScriptDownloadPathSet,
  isGetResultPathSet,
  isProxySecretSet,
  agentScriptDownloadPathVarName,
  getResultPathVarName,
  proxySecretVarName,
  isOpenClientResponseSet,
  openClientResponseVarName,
  decryptionKeyVarName,
  isOpenClientResponseEnabled,
  isDecryptionKeySet,
  saveToKvStorePluginEnabledVarName,
  isSaveToKvStorePluginEnabled,
  isSaveToKvStorePluginEnabledSet,
} from '../env'
import packageJson from '../../package.json'
import { env } from 'fastly:env'
import { getBuiltinKVStore } from '../utils/getStore'

function generateNonce() {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const indices = crypto.getRandomValues(new Uint8Array(24))
  for (const index of indices) {
    result += characters[index % characters.length]
  }
  return btoa(result)
}

function buildHeaders(styleNonce: string): Headers {
  const headers = new Headers()
  headers.append('Content-Type', 'text/html')
  headers.append(
    'Content-Security-Policy',
    `default-src 'none'; img-src https://fingerprint.com; style-src 'nonce-${styleNonce}'`
  )
  return headers
}

function createVersionElement(): string {
  const fastlyServiceVersion = env('FASTLY_SERVICE_VERSION')
  return `
  <span>
  ℹ️ Integration version: ${packageJson.version}
  </span>
  <span>
  ℹ️ Fastly Compute Service version: ${fastlyServiceVersion}
  </span>
  `
}

function isValidBase64(str: string | null | undefined): boolean {
  // Check if the string matches the base64 pattern
  const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/

  if (!str) {
    return false
  }

  // Validate the string length (should be a multiple of 4)
  if (str.length % 4 !== 0) {
    return false
  }

  // Test against the Base64 pattern
  return base64Pattern.test(str)
}

async function checkKVStoreAvailability() {
  try {
    const kvStore = getBuiltinKVStore()
    const testKeyName = 'kvStoreCheck'
    await kvStore.put(testKeyName, 'true')
    const entry = await kvStore.get(testKeyName)
    const value = await entry?.text()
    await kvStore.delete(testKeyName)
    return value === 'true'
  } catch (_) {
    return false
  }
}

function createContactInformationElement(): string {
  return `
  <span>
  ❓Please reach out our support via <a href='mailto:support@fingerprint.com'>support@fingerprint.com</a> if you have any issues
  </span>
  `
}

function buildConfigurationMessage(config: ConfigurationStatus, env: IntegrationEnv): string {
  const isDecryptionKeyAValidBase64 = isValidBase64(env.DECRYPTION_KEY)
  const { isSet, label, required, value } = config

  let result = `<span>${isSet ? '✅' : '⚠️'} <strong>${label}</strong> (${required ? 'REQUIRED' : 'OPTIONAL'}) is ${isSet ? '' : 'not '}set.</span>`

  if (required && !isSet && config.message) {
    result += `<span>${config.message}</span>`
  }

  if (label === openClientResponseVarName) {
    result +=
      value === 'false'
        ? '<span>Open Client Response feature is <b>not</b> expected to work for your integration.</span>'
        : ''
  }

  if (label === decryptionKeyVarName && isSet && !isDecryptionKeyAValidBase64) {
    result += `<span>⚠️Your ${decryptionKeyVarName} is invalid. Please copy and paste the correct ${decryptionKeyVarName} from the dashboard.</span>`
  }

  if (
    label === saveToKvStorePluginEnabledVarName &&
    isSaveToKvStorePluginEnabled(env) &&
    !isDecryptionKeyAValidBase64
  ) {
    result += `<span>⚠️Your ${saveToKvStorePluginEnabledVarName} is set & enabled but decryption is not correct, requests will not be saved in your KV Store</span>`
  }

  if (
    label === saveToKvStorePluginEnabledVarName &&
    isSaveToKvStorePluginEnabled(env) &&
    !isOpenClientResponseEnabled(env)
  ) {
    result += `<span>⚠️ The built-in plugin for saving results to the KV Store is enabled, but the ${openClientResponseVarName} is not set to true, so this plugin won't work.</span>`
  }

  return `<span>${result}</span>`
}

async function buildKVStoreCheckMessage(): Promise<string> {
  const isKVStoreAvailable = await checkKVStoreAvailability()
  if (!isKVStoreAvailable) {
    return `<span>⚠️Your ${openClientResponseVarName} and ${saveToKvStorePluginEnabledVarName} variables are set and enabled, but we couldn't reach your KVStore. Your should create a KVStore with proper name and link to your service.</span>`
  }
  return ''
}

type ConfigurationStatus = {
  label: string
  isSet: boolean
  required: boolean
  message?: string
  value?: string | null
}
async function createEnvVarsInformationElement(env: IntegrationEnv): Promise<string> {
  const incorrectConfigurationMessage = 'Your integration is not working correctly.'
  const configurations: ConfigurationStatus[] = [
    {
      label: agentScriptDownloadPathVarName,
      isSet: isScriptDownloadPathSet(env),
      required: true,
      message: incorrectConfigurationMessage,
    },
    {
      label: getResultPathVarName,
      isSet: isGetResultPathSet(env),
      required: true,
      message: incorrectConfigurationMessage,
    },
    {
      label: proxySecretVarName,
      isSet: isProxySecretSet(env),
      required: true,
      message: incorrectConfigurationMessage,
    },
    {
      label: decryptionKeyVarName,
      isSet: isDecryptionKeySet(env),
      required: isOpenClientResponseEnabled(env),
      message: incorrectConfigurationMessage,
    },
    {
      label: openClientResponseVarName,
      isSet: isOpenClientResponseSet(env),
      required: false,
      value: env.OPEN_CLIENT_RESPONSE_PLUGINS_ENABLED,
      message:
        "Your integration will work without the 'Open Client Response' feature. If you didn't set it intentionally, you can ignore this warning.",
    },
    {
      label: saveToKvStorePluginEnabledVarName,
      isSet: isSaveToKvStorePluginEnabledSet(env),
      required: false,
      value: env.SAVE_TO_KV_STORE_PLUGIN_ENABLED,
      message:
        "Built-in saving requests to KV Storage plugin is not enabled. If you didn't set it intentionally, you can ignore this warning.",
    },
  ]

  const isAllVarsAvailable = configurations.every((t) => !t.required || t.isSet)

  let result = ''

  if (isAllVarsAvailable) {
    result += '<span>✅ All required configuration values are set</span>'
  }

  result += '<span>Your integration’s configuration values:</span>'

  for (const config of configurations) {
    result += buildConfigurationMessage(config, env)
  }

  if (isOpenClientResponseEnabled(env) && isSaveToKvStorePluginEnabled(env)) {
    result += await buildKVStoreCheckMessage()
  }

  return result
}

async function buildBody(env: IntegrationEnv, styleNonce: string): Promise<string> {
  let body = `
  <html lang='en-US'>
  <head>
    <meta charset='utf-8'/>
    <title>Fingerprint Pro Fastly Compute Integration</title>
    <link rel='icon' type='image/x-icon' href='https://fingerprint.com/img/favicon.ico'>
    <style nonce='${styleNonce}'>
      h1, span {
        display: block;
        padding-top: 1em;
        padding-bottom: 1em;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <h1>Fingerprint Pro Fastly Compute Integration</h1>
  `

  body += `<span>🎉 Your Fastly Integration is deployed</span>`

  body += createVersionElement()
  body += await createEnvVarsInformationElement(env)
  body += createContactInformationElement()

  body += `  
  </body>
  </html>
  `
  return body
}

export async function handleStatusPage(request: Request, env: IntegrationEnv): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(null, { status: 405 })
  }

  const styleNonce = generateNonce()
  const headers = buildHeaders(styleNonce)
  const body = await buildBody(env, styleNonce)

  return new Response(body, {
    status: 200,
    statusText: 'OK',
    headers,
  })
}
