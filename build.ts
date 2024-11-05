import { build } from 'esbuild'

// Load environment variables from process.env
const configStoreNamePrefix = process.env.CONFIG_STORE_NAME_PREFIX || 'Fingerprint_Fastly_Compute_Proxy_Integration'

build({
  entryPoints: ['./src/index.ts'],
  outdir: './build',
  bundle: true,
  format: 'cjs',
  external: ['fastly:*'],
  define: { 'process.env.CONFIG_STORE_NAME_PREFIX': `"${configStoreNamePrefix}"` },
}).catch(() => process.exit(1))
