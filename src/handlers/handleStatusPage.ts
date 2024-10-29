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

function createEnvVarsInformationElement(env: IntegrationEnv): string {
  const isScriptDownloadPathAvailable = isScriptDownloadPathSet(env)
  const isGetResultPathAvailable = isGetResultPathSet(env)
  const isProxySecretAvailable = isProxySecretSet(env)
  const isOpenClientResponseVarSet = isOpenClientResponseSet(env)
  const isAllVarsAvailable = isScriptDownloadPathAvailable && isGetResultPathAvailable && isProxySecretAvailable

  let result = ''
  if (!isAllVarsAvailable) {
    result += `
    <span>
    The following environment variables are not defined. Please reach out our support team.
    </span>
    `
    if (!isScriptDownloadPathAvailable) {
      result += `
      <span>
      ⚠️ <strong>${agentScriptDownloadPathVarName} </strong> is not set
      </span>
      `
    }
    if (!isGetResultPathAvailable) {
      result += `
      <span>
      ⚠️ <strong>${getResultPathVarName} </strong> is not set
      </span>
      `
    }
    if (!isProxySecretAvailable) {
      result += `
      <span>
      ⚠️ <strong>${proxySecretVarName} </strong> is not set
      </span>
      `
    }
  } else {
    result += `
    <span>
     ✅ All required environment variables are set
    </span>
    `
  }

  if (!isOpenClientResponseVarSet) {
    result += `
      <span>
      ⚠️ <strong>${openClientResponseVarName} </strong> optional environment variable is not set<br />
         <i>This environment variable is optional; your integration will work without the 'Open Client Response' feature. If you didn't set it intentionally, you can ignore this warning.</i>
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
    <title>Fingerprint Pro Fastly Compute@Edge Integration</title>
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
    <h1>Fingerprint Pro Fastly Compute@Edge Integration</h1>
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
