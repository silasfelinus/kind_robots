import { readFileSync } from 'node:fs'

const source = readFileSync('server/api/art/queue/claim.post.ts', 'utf8')
for (const required of [
  'const queueSignal = await prisma.artJob.findFirst',
  "{ status: 'PENDING', attempts: { lt: MAX_ATTEMPTS } }",
  "{ status: 'RUNNING', claimedAt: { lt: staleBefore } }",
  'if (!queueSignal)',
  'preferredAffinity: null',
]) {
  if (!source.includes(required)) {
    throw new Error(`Art queue claim fast path is missing: ${required}`)
  }
}

console.log('Art queue claim fast path verified.')
