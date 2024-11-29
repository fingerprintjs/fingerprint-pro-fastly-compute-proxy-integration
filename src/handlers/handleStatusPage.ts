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
  getDecryptionKey,
} from '../env'
import packageJson from '../../package.json'
import { env } from 'fastly:env'
import { getBuiltinKVStore, getNamesForStores } from '../utils/getStore'
import { Backend } from 'fastly:backend'

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
  let result = ''
  result += '<ul>'
  result += `
    <li>
    ℹ️ Integration version: <strong>${packageJson.version}</strong>
    </li>
    <li>
    ℹ️ Fastly Compute Service version: <strong>${fastlyServiceVersion}</strong>
    </li>
  `

  result += getBackendsInformation()
  result += '</ul>'

  return result
}

function getBackendsInformation(): string {
  let information = ''
  if (!Backend.exists('fpcdn.io')) {
    information += '<li>⚠️ Your integration is missing "fpcdn.io" backend host.</li>'
  }

  const usResultBackend = Backend.exists('api.fpjs.io')
  const euResultBackend = Backend.exists('eu.api.fpjs.io')
  const apResultBackend = Backend.exists('ap.api.fpjs.io')
  const supportedRegions = []
  if (usResultBackend) {
    supportedRegions.push('US')
  }
  if (euResultBackend) {
    supportedRegions.push('EU')
  }
  if (apResultBackend) {
    supportedRegions.push('AP')
  }
  if (supportedRegions.length === 0) {
    information +=
      '<li>⚠️ Your integration is missing backend hosts for region support. Please add at least one of the backends "api.fpjs.io", "eu.api.fpjs.io", or "ap.api.fpjs.io"</li>'
  } else {
    information += `<li>ℹ️ Integration is configured for these regions: <strong>${supportedRegions.join(' ,')}</strong></li>`
  }

  return information
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
  <p>
  ❓Please reach out our support via <a href='mailto:support@fingerprint.com'>support@fingerprint.com</a> if you have any issues.
  </p>
  `
}

function buildConfigurationMessage(config: ConfigurationStatus, env: IntegrationEnv): string {
  const { isSet, label, required, value, showValue } = config

  let message = isSet ? '' : config.message
  if (label === decryptionKeyVarName && isSet) {
    const isDecryptionKeyAValidBase64 = isValidBase64(getDecryptionKey(env))
    if (!isDecryptionKeyAValidBase64) {
      message += `Invalid value provided ⚠️. Please copy and paste the correct value from the dashboard.`
    }
  }

  return `<li><code>${label}</code> (${required ? 'Required' : 'Optional'}) is ${isSet ? `${showValue ? `<code>${value}</code>` : 'set'} ✅` : `${required ? 'missing ❌' : 'not set ⚠️'}`}. ${message ?? ''}</li>`
}

async function buildKVStoreCheckMessage(): Promise<string> {
  const isKVStoreAvailable = await checkKVStoreAvailability()
  if (isKVStoreAvailable) {
    return ''
  }

  const { kvStoreName } = getNamesForStores()
  return `⚠️You have <code>${saveToKvStorePluginEnabledVarName}</code> enabled, but we couldn't reach your KVStore named <code>${kvStoreName}</code>. <code>${saveToKvStorePluginEnabledVarName}</code> related plugin is not working correctly.`
}

type ConfigurationStatus = {
  label: string
  isSet: boolean
  required: boolean
  message?: string
  value?: string | null
  showValue?: boolean
}
function createEnvVarsInformationElement(env: IntegrationEnv): string {
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
  ]

  let result = ''
  result += '<p>🛠️ Your integration’s configuration values:</p>'

  result += '<ul>'
  for (const config of configurations) {
    result += buildConfigurationMessage(config, env)
  }
  result += '</ul>'

  return result
}

async function createOpenClientResponseInformationElement(env: IntegrationEnv): Promise<string> {
  const configurations: ConfigurationStatus[] = [
    {
      label: openClientResponseVarName,
      isSet: isOpenClientResponseSet(env),
      required: false,
      value: env.OPEN_CLIENT_RESPONSE_PLUGINS_ENABLED,
      showValue: true,
      message: 'Open client response plugins are disabled.',
    },
    {
      label: decryptionKeyVarName,
      isSet: isDecryptionKeySet(env),
      required: false,
      message:
        'Open client response plugins are not working correctly. This is required if you want to use Open client response plugins.',
    },
    {
      label: saveToKvStorePluginEnabledVarName,
      isSet: isSaveToKvStorePluginEnabledSet(env),
      required: false,
      value: env.SAVE_TO_KV_STORE_PLUGIN_ENABLED,
      showValue: true,
    },
  ]

  let result = ''
  result += `<p style="display: block">🔌 Open client response configuration values:<br>(Optional, only relevant if you are using Open client response plugins)</p>`

  result += '<ul>'
  for (const config of configurations) {
    result += buildConfigurationMessage(config, env)
  }

  if (isOpenClientResponseEnabled(env) && isSaveToKvStorePluginEnabled(env)) {
    const errorMessage = await buildKVStoreCheckMessage()
    if (errorMessage) {
      result += `<li>${errorMessage}</li>`
    }
  }
  result += '</ul>'

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
      body {
        display: flex;
        flex-direction: column;
        align-items: center;     
      }
      div {
        width: 60%;
        max-width: 800px;
      }
      h1 {
        display: block;
        padding-top: 1em;
        padding-bottom: 1em;
      }
      p {
        padding-top: 1em;
      }
      code {
        background:rgba(135,131,120,.15);
        color:#EB5757;
        border-radius:4px;
        font-size:85%;
        padding:0.2em 0.4em
      }
    </style>
  </head>
  <body>
  <div>
    <h1>Fingerprint Pro Fastly Compute Integration</h1>
  `

  body += `<p>🎉 Your Fastly Integration is deployed!</p>`

  body += createVersionElement()
  body += createEnvVarsInformationElement(env)
  body += createContactInformationElement()
  body += await createOpenClientResponseInformationElement(env)

  body += `
  </div>  
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
