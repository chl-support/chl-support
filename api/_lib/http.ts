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

export function fail(res: VercelResponse, status: number, message: string, extra?: unknown) {
  res.status(status).json({ ok: false, error: message, ...(extra ? { detail: extra } : {}) })
}

export function methodNotAllowed(res: VercelResponse, allow: string[]) {
  res.setHeader('Allow', allow.join(', '))
  fail(res, 405, `Metode tidak diizinkan. Gunakan ${allow.join(' / ')}.`)
}
