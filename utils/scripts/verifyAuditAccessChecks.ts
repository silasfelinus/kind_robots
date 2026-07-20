import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function read(path: string): string {
  return readFileSync(resolve(root, path), 'utf8')
}

function requireText(source: string, text: string, label: string): void {
  if (!source.includes(text)) {
    throw new Error(`${label}: expected to find ${JSON.stringify(text)}`)
  }
}

// Audit fixes: routes that write global, non-user-owned content (narrator
// threads/topics) or drive another user's prompt must gate on admin/server-key
// (or ownership), not merely on a valid API key.
const threads = read('server/api/bots/threads.post.ts')
const topics = read('server/api/bots/topics.post.ts')
const promptGenerate = read('server/api/prompts/generate.post.ts')

for (const [source, name] of [
  [threads, 'narrator threads'],
  [topics, 'narrator topics'],
] as const) {
  requireText(
    source,
    "const isServerKey = auth.kind === 'server'",
    `${name} server-key check`,
  )
  requireText(
    source,
    'if (!isAdmin && !isServerKey) {',
    `${name} admin/server-key gate`,
  )
}

requireText(
  promptGenerate,
  'if (!isAdmin && !isServerKey && prompt.userId !== user.id) {',
  'prompt generate ownership gate',
)

console.log('Audit access-check contract passed.')
