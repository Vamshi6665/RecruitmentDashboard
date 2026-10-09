// Uniform error responses: { error: { code, message, details? } }
import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (message, details) => new HttpError(400, 'bad_request', message, details)

export function notFound(req, _res, next) {
  next(new HttpError(404, 'not_found', `No route for ${req.method} ${req.originalUrl.split('?')[0]}`))
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'invalid_request', message: err.issues[0]?.message ?? 'Invalid request',
        details: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })) },
    })
  }
  const status = err.status ?? 500
  if (status >= 500) console.error('[error]', err)
  res.status(status).json({
    error: {
      code: err.code ?? (status >= 500 ? 'server_error' : 'error'),
      message: status >= 500 && !err.code ? 'Something went wrong on the server.' : err.message,
      ...(err.details ? { details: err.details } : {}),
    },
  })
}
