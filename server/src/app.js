// Express app: middleware, 7 routes, static client. Imported by src/index.js (local, Docker)
// and api/index.js (Vercel), so every host runs the same code.
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { config } from './config.js'
import { applicationIdSchema, applicationsSchema, filtersSchema } from './schemas.js'
import { errorHandler, notFound } from './middleware/errors.js'
import { cache, createReports } from './services/reports.js'

export function createApp({ reports = createReports() } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  }))
  app.use(cors({ origin: config.corsOrigins.length ? config.corsOrigins : false }))
  app.use(compression())
  app.use('/api', rateLimit({ ...config.rateLimit, standardHeaders: 'draft-7', legacyHeaders: false,
    message: { error: { code: 'rate_limited', message: 'Too many requests. Try again in a minute.' } } }))

  const api = express.Router()
  api.get('/health', async (_req, res) => res.json({ status: 'ok', ...(await reports.status()) }))
  api.get('/meta', async (_req, res) => res.json(await reports.meta()))
  api.get('/report', async (req, res) => res.json(await reports.report(filtersSchema.parse(req.query))))
  api.get('/applications', async (req, res) => res.json(await reports.applications(applicationsSchema.parse(req.query))))
  api.get('/applications/:id/events', async (req, res) => res.json(await reports.timeline(applicationIdSchema.parse(req.params.id))))
  api.get('/jobs', async (_req, res) => res.json(await reports.jobs()))
  api.get('/stats', (_req, res) => res.json({ cache: cache.stats(), uptimeSeconds: Math.round(process.uptime()) }))
  app.use('/api', api)
  app.use('/api', notFound)

  // Serve the built client when it exists (Docker / single-process deploys).
  if (existsSync(config.clientDist)) {
    app.use(express.static(config.clientDist, { maxAge: '1h', index: false }))
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(config.clientDist, 'index.html')))
  }

  app.use(notFound)
  app.use(errorHandler)
  return app
}

export default createApp()
