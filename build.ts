import { build } from 'esbuild'

// Load environment variables from process.env
const configStoreName = process.env.CONFIG_STORE_NAME || 'Fingerprint'

build({
  entryPoints: ['./src/index.ts'],
  outdir: './build',
  bundle: true,
  format: 'cjs',
  external: ['fastly:*'],
  define: { 'process.env.CONFIG_STORE_NAME': `"${configStoreName}"` },
}).catch(() => process.exit(1))
