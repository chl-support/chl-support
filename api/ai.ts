import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { aiModel, openaiKey } from './_lib/env.js'
import { fail, methodNotAllowed } from './_lib/http.js'

const SYSTEM = `Anda asisten untuk Harmoni Command Center, aplikasi internal PT Cipta Harmoni Lestari
untuk memantau kewajiban, perizinan, dokumen, tenggat, dan biaya awal proyek perumahan.
Jawab dalam Bahasa Indonesia, ringkas, dan fokus pada tindakan (mis. apa yang harus dikejar,
risiko tenggat, urutan perizinan LSD→KKPR→…→PSU). Jika diberi konteks item/proyek, gunakan itu.`

/**
 * POST /api/ai  { prompt: string, context?: object }
 * Thin wrapper over the OpenAI Chat Completions API for the in-app assistant.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  const key = openaiKey()
  if (!key) {
    return fail(res, 503, 'Fitur AI belum aktif — set OPENAI_API_KEY di Environment Variables Vercel.')
  }

  try {
    const b = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {}
    const prompt: string = (b.prompt ?? '').toString().trim()
    if (!prompt) return fail(res, 400, 'Kirim field "prompt".')

    const userContent = b.context
      ? `Konteks (JSON):\n${JSON.stringify(b.context).slice(0, 6000)}\n\nPertanyaan: ${prompt}`
      : prompt

    const client = new OpenAI({ apiKey: key })
    const completion = await client.chat.completions.create({
      model: aiModel(),
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userContent },
      ],
    })

    const text = (completion.choices[0]?.message?.content ?? '').trim()
    res.status(200).json({ ok: true, text, model: aiModel() })
  } catch (e) {
    const err = e as { status?: number; message?: string }
    fail(res, err.status && err.status >= 400 && err.status < 600 ? err.status : 500,
      'Panggilan AI gagal.', err.message)
  }
}
