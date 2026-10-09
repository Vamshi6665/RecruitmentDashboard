// Every setting comes from environment variables, so the same build runs on a laptop,
// in Docker or on Vercel. See .env.example for descriptions.
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
// .env in server/ wins over .env in the repo root; real environment variables win over both.
dotenv.config({ path: [path.resolve(here, '../.env'), path.resolve(here, '../../.env')], quiet: true })
const num = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v))
const list = v => (v ? v.split(',').map(s => s.trim()).filter(Boolean) : [])

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: num(process.env.PORT, 8787),

  /** athena | json | auto (try Athena, fall back to exported JSON if it can't connect) */
  dataSource: ['athena', 'json', 'auto'].includes(process.env.DATA_SOURCE) ? process.env.DATA_SOURCE : 'auto',

  athena: {
    // ATHENA_* names exist for hosts like Vercel that manage the AWS_* variables themselves.
    region: process.env.ATHENA_REGION || process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.ATHENA_ACCESS_KEY_ID && process.env.ATHENA_SECRET_ACCESS_KEY
      ? { accessKeyId: process.env.ATHENA_ACCESS_KEY_ID, secretAccessKey: process.env.ATHENA_SECRET_ACCESS_KEY }
      : undefined, // undefined = standard AWS chain (aws configure, AWS_PROFILE, IAM role)
    database: process.env.ATHENA_DATABASE ?? 'recruiting_history',
    workgroup: process.env.ATHENA_WORKGROUP ?? 'primary',
    outputLocation: process.env.ATHENA_OUTPUT_LOCATION || undefined,
    timeoutMs: num(process.env.ATHENA_TIMEOUT_MS, 60000),
    probeTimeoutMs: num(process.env.ATHENA_PROBE_TIMEOUT_MS, 20000),
    retryMs: num(process.env.ATHENA_RETRY_MINUTES, 2) * 60000,
  },

  cache: {
    maxEntries: num(process.env.CACHE_MAX_ENTRIES, 300),
    ttlMs: num(process.env.CACHE_TTL_MINUTES, 15) * 60000,
  },

  rateLimit: { windowMs: 60000, max: num(process.env.RATE_LIMIT_PER_MIN, 120) },
  corsOrigins: list(process.env.CORS_ORIGINS),

  jsonDataDir: process.env.JSON_DATA_DIR ?? path.resolve(here, '../../client/public/data'),
  clientDist: path.resolve(here, '../../client/dist'),
}
