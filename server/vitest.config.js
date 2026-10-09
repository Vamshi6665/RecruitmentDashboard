import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node', env: { DATA_SOURCE: 'json' } } })
