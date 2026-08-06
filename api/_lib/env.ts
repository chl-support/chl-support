/**
 * Central place that resolves the environment variables the backend needs.
 *
 * The names are the ones Vercel provides automatically when you connect the
 * matching resource from the dashboard:
 *
 *   - Neon Postgres  → DATABASE_URL / POSTGRES_URL (either works)
 *   - Vercel Blob    → BLOB_READ_WRITE_TOKEN
 *   - Anthropic key  → ANTHROPIC_API_KEY  (set this one manually — name it exactly)
 *
 * Nothing here throws: every endpoint degrades gracefully and reports what is
 * missing through /api/health instead of crashing the deployment.
 */

export function databaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    undefined
  )
}

export function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || undefined
}

export function anthropicKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || undefined
}

/** Model used by the in-app assistant; override with AI_MODEL if desired. */
export function aiModel(): string {
  return process.env.AI_MODEL || 'claude-sonnet-5'
}
