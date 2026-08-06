import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { aiModel, anthropicKey } from './_lib/env'
import { fail, methodNotAllowed } from './_lib/http'

const SYSTEM = `Anda asisten untuk Harmoni Command Center, aplikasi internal PT Cipta Harmoni Lestari
untuk memantau kewajiban, perizinan, dokumen, tenggat, dan biaya awal proyek perumahan.
Jawab dalam Bahasa Indonesia, ringkas, dan fokus pada tindakan (mis. apa yang harus dikejar,
risiko tenggat, urutan perizinan LSD→KKPR→…→PSU). Jika diberi konteks item/proyek, gunakan itu.`

/**
 * POST /api/ai  { prompt: string, context?: object }
 * Thin wrapper over the Anthropic Messages API for the in-app assistant.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  const key = anthropicKey()
  if (!key) {
    return fail(res, 503, 'Fitur AI belum aktif — set ANTHROPIC_API_KEY di Environment Variables Vercel.')
  }

  try {
    const b = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {}
    const prompt: string = (b.prompt ?? '').toString().trim()
    if (!prompt) return fail(res, 400, 'Kirim field "prompt".')

    const userContent = b.context
      ? `Konteks (JSON):\n${JSON.stringify(b.context).slice(0, 6000)}\n\nPertanyaan: ${prompt}`
      : prompt

    const client = new Anthropic({ apiKey: key })
    const msg = await client.messages.create({
      model: aiModel(),
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: 'user', content: userContent }],
    })

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()

    res.status(200).json({ ok: true, text, model: aiModel() })
  } catch (e) {
    const err = e as { status?: number; message?: string }
    fail(res, err.status && err.status >= 400 && err.status < 600 ? err.status : 500,
      'Panggilan AI gagal.', err.message)
  }
}
