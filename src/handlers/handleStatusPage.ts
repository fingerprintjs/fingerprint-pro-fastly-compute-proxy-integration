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
} from '../env'
import packageJson from '../../package.json'

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
  return `
  <span>
  ℹ️ Integration version: ${packageJson.version}
  </span>
  `
}

function createContactInformationElement(): string {
  return `
  <span>
  ❓Please reach out our support via <a href='mailto:support@fingerprint.com'>support@fingerprint.com</a> if you have any issues
  </span>
  `
}

type ConfigurationStatus = {
  label: string
  check: boolean
  required: boolean
  errorMessage?: string
  warningMessage?: string
  value?: string | null
}
function createEnvVarsInformationElement(env: IntegrationEnv): string {
  const incorrectConfigurationMessage = 'Your integration is not working correctly.'
  const configurations: ConfigurationStatus[] = [
    {
      label: agentScriptDownloadPathVarName,
      check: isScriptDownloadPathSet(env),
      required: true,
      errorMessage: incorrectConfigurationMessage,
    },
    {
      label: getResultPathVarName,
      check: isGetResultPathSet(env),
      required: true,
      errorMessage: incorrectConfigurationMessage,
    },
    {
      label: proxySecretVarName,
      check: isProxySecretSet(env),
      required: true,
      errorMessage: incorrectConfigurationMessage,
    },
    {
      label: decryptionKeyVarName,
      check: isDecryptionKeySet(env),
      required: isOpenClientResponseEnabled(env),
      errorMessage: incorrectConfigurationMessage,
    },
    {
      label: openClientResponseVarName,
      check: isOpenClientResponseSet(env),
      required: false,
      warningMessage:
        "Your integration will work without the 'Open Client Response' feature. If you didn't set it intentionally, you can ignore this warning.",
    },
  ]

  const isAllVarsAvailable = configurations.filter((t) => t.required && !t.check).length === 0

  let result = ''
  if (isAllVarsAvailable) {
    result += `
    <span>
     ✅ All required configurations are set
    </span>
    `
  }

  result += `<span>Your integration’s configuration values</span>`

  for (const configuration of configurations) {
    result += `
      <span>
      ${configuration.check ? '✅' : '⚠️'} <strong>${configuration.label} </strong> (${configuration.required ? 'REQUIRED' : 'OPTIONAL'}) is${!configuration.check ? ' not ' : ' '}set
      ${configuration.required && !configuration.check && configuration.errorMessage ? `<span>${configuration.errorMessage}</span>` : ''}
      ${!configuration.required && !configuration.check && configuration.warningMessage ? `<span>${configuration.warningMessage}</span>` : ''}
      </span>
      `
  }

  return result
}

function buildBody(env: IntegrationEnv, styleNonce: string): string {
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
  body += createEnvVarsInformationElement(env)
  body += createContactInformationElement()

  body += `  
  </body>
  </html>
  `
  return body
}

export function handleStatusPage(request: Request, env: IntegrationEnv): Response {
  if (request.method !== 'GET') {
    return new Response(null, { status: 405 })
  }

  const styleNonce = generateNonce()
  const headers = buildHeaders(styleNonce)
  const body = buildBody(env, styleNonce)

  return new Response(body, {
    status: 200,
    statusText: 'OK',
    headers,
  })
}
