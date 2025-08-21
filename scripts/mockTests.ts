import { execSync } from 'child_process'
import pkg from '../package.json'

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

async function main() {
  const apiUrl = getEnv('MOCK_API_URL')
  const agentPath = getEnv('MOCK_AGENT_PATH')
  const resultPath = getEnv('MOCK_RESULT_PATH')

  console.info('Agent download path:', agentPath)
  console.info('Get result path:', resultPath)

  console.info(`Running mock e2e tests for`, apiUrl)

  execSync(
    `npm exec -y "git+https://github.com/fingerprintjs/dx-team-mock-for-proxy-integrations-e2e-tests.git" -- --integration-url="${apiUrl}" --api-url="https://${apiUrl}" --cdn-path="${agentPath}" --ingress-path="${resultPath}" --traffic-name=fingerprint-pro-fastly-compute --integration-version=${pkg.version}`,
    {
      stdio: 'inherit',
    }
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
