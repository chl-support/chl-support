import type { VercelRequest, VercelResponse } from '@vercel/node'

/** Reads the raw request body into a Buffer (for binary uploads). */
export async function readRawBody(req: VercelRequest): Promise<Buffer> {
  // Vercel may already expose a parsed Buffer for unknown content types.
  if (Buffer.isBuffer(req.body)) return req.body
  if (typeof req.body === 'string') return Buffer.from(req.body)
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

/** Streams a base64-stored file back to the browser with the right headers. */
export function sendFile(
  res: VercelResponse,
  file: { data: string; filename: string; contentType: string },
) {
  const buf = Buffer.from(file.data, 'base64')
  res.setHeader('Content-Type', file.contentType || 'application/octet-stream')
  res.setHeader('Content-Length', buf.length)
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${file.filename.replace(/"/g, '')}"`,
  )
  res.setHeader('Cache-Control', 'private, max-age=3600')
  res.status(200).send(buf)
}

export function fail(res: VercelResponse, status: number, message: string, extra?: unknown) {
  res.status(status).json({ ok: false, error: message, ...(extra ? { detail: extra } : {}) })
}

export function methodNotAllowed(res: VercelResponse, allow: string[]) {
  res.setHeader('Allow', allow.join(', '))
  fail(res, 405, `Metode tidak diizinkan. Gunakan ${allow.join(' / ')}.`)
}
