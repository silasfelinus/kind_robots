// utils/scripts/verifyGithubFileContents.ts
//
// Regression guard for the 2026-09-02 art-queue wipe (conductor 0e671cd).
//
// conductor's projects/art-prompts.yaml crossed 1 MB, so the GitHub Contents
// API stopped inlining its body: 200, real sha, `content: ""`,
// `encoding: "none"`. art-request.post.ts decoded that as an empty file, found
// no duplicate to skip, and PUT a two-entry file over it with the very sha
// GitHub had just handed it. 11,014 lines went, including 577 Mandarin request
// rows and three in-flight missing-image requests.
//
// These checks pin both halves of the fix: readGithubFile recovers an oversized
// body from the Blobs API and never reports a non-empty file as empty, and
// requestBlockIds gives the writer an append-only invariant to assert before it
// commits.
//
// Dependency-free on purpose: a stub fetch, no Nuxt/Prisma runtime, so it runs
// under bare `tsx` alongside the other art contract tests.
//
// Run: npm run test:github-file-contents

import { Buffer } from 'node:buffer'
import {
  type GithubFetch,
  githubPathExists,
  payloadNeedsBlobFallback,
  readGithubFile,
} from '../../server/utils/githubFileContents'
import { requestBlockIds } from '../../server/utils/artRequestYaml'

let failures = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function b64(value: string): string {
  return Buffer.from(value, 'utf-8').toString('base64')
}

function stubFetch(
  routes: Record<string, { status?: number; body: unknown }>,
  seen: string[] = [],
): GithubFetch {
  return async (url: string) => {
    seen.push(url)
    const key = Object.keys(routes).find((fragment) => url.includes(fragment))
    const route = key ? routes[key]! : { status: 404, body: {} }
    const status = route.status ?? 200
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => route.body,
    }
  }
}

async function expectThrow(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn()
    return null
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

const QUEUE = 'requests:\n- id: "keep-me-0001"\n  status: "pending"\n'

// --- small file: plain Contents API decode ---------------------------------
console.log('readGithubFile on a file GitHub inlines')
{
  const seen: string[] = []
  const fetchImpl = stubFetch(
    {
      '/contents/': {
        body: {
          sha: 'sha-small',
          size: QUEUE.length,
          encoding: 'base64',
          content: b64(QUEUE),
        },
      },
    },
    seen,
  )
  const file = await readGithubFile('o/r', 'a/b.yaml', 't', 'main', fetchImpl)

  check('returns the decoded body', file?.content === QUEUE)
  check('returns the blob sha', file?.sha === 'sha-small')
  check(
    'does not reach for the Blobs API',
    !seen.some((url) => url.includes('/git/blobs/')),
  )
}

// --- oversized file: Blobs API fallback ------------------------------------
console.log('')
console.log('readGithubFile on a file over the 1 MB inline limit')
{
  const big = `${QUEUE}${'# padding\n'.repeat(4000)}`
  const seen: string[] = []
  const fetchImpl = stubFetch(
    {
      '/contents/': {
        body: { sha: 'sha-big', size: big.length, encoding: 'none', content: '' },
      },
      '/git/blobs/': {
        body: { sha: 'sha-big', encoding: 'base64', content: b64(big) },
      },
    },
    seen,
  )
  const file = await readGithubFile('o/r', 'a/b.yaml', 't', 'main', fetchImpl)

  check('recovers the withheld body from the Blobs API', file?.content === big)
  check('keeps the sha the Contents API reported', file?.sha === 'sha-big')
  check(
    'asks the Blobs API for exactly that sha',
    seen.some((url) => url.endsWith('/git/blobs/sha-big')),
  )
  check(
    'the recovered body still holds the existing requests',
    requestBlockIds(file?.content ?? '').includes('keep-me-0001'),
  )
}

// --- the shape that caused the wipe ----------------------------------------
console.log('')
console.log('an unrecoverable body fails loudly instead of reading as empty')
{
  const fetchImpl = stubFetch({
    '/contents/': {
      body: { sha: 'sha-big', size: 1424189, encoding: 'none', content: '' },
    },
    '/git/blobs/': {
      body: { sha: 'sha-big', encoding: 'base64', content: '' },
    },
  })
  const message = await expectThrow(() =>
    readGithubFile('o/r', 'a/b.yaml', 't', 'main', fetchImpl),
  )

  check('throws rather than returning ""', message !== null)
  check(
    'says the file was unreadable, not empty',
    (message ?? '').includes('Refusing to treat an unreadable file as empty'),
  )
}

// --- a genuinely empty file is still readable ------------------------------
console.log('')
console.log('a genuinely empty file reads as empty')
{
  const fetchImpl = stubFetch({
    '/contents/': {
      body: { sha: 'sha-empty', size: 0, encoding: 'base64', content: '' },
    },
  })
  const file = await readGithubFile('o/r', 'a/b.yaml', 't', 'main', fetchImpl)

  check('returns an empty body without throwing', file?.content === '')
  check('reports size 0', file?.size === 0)
}

// --- 404 still means "no such file" ----------------------------------------
console.log('')
console.log('a missing path returns null')
{
  const fetchImpl = stubFetch({ '/contents/': { status: 404, body: {} } })
  const file = await readGithubFile('o/r', 'gone.yaml', 't', 'main', fetchImpl)
  check('returns null for 404', file === null)
}

// --- payloadNeedsBlobFallback ----------------------------------------------
console.log('')
console.log('payloadNeedsBlobFallback')
{
  check(
    'inlined base64 needs no fallback',
    !payloadNeedsBlobFallback({
      encoding: 'base64',
      content: b64('x'),
      size: 1,
    }),
  )
  check(
    'encoding "none" needs the fallback',
    payloadNeedsBlobFallback({ encoding: 'none', content: '', size: 1424189 }),
  )
  check(
    'empty content for a non-empty file needs the fallback',
    payloadNeedsBlobFallback({ encoding: '', content: '', size: 1424189 }),
  )
  check(
    'an empty file needs no fallback',
    !payloadNeedsBlobFallback({ encoding: 'base64', content: '', size: 0 }),
  )
}

// --- existence probes stay cheap -------------------------------------------
console.log('')
console.log('githubPathExists does not download a body')
{
  const seen: string[] = []
  const fetchImpl = stubFetch(
    {
      '/contents/': {
        body: { sha: 'sha-huge', size: 9_000_000, encoding: 'none', content: '' },
      },
    },
    seen,
  )
  const exists = await githubPathExists('o/r', 'big.webp', 't', 'main', fetchImpl)

  check('reports an oversized file as present', exists === true)
  check(
    'never reaches the Blobs API for a mere existence check',
    !seen.some((url) => url.includes('/git/blobs/')),
  )

  const missing = await githubPathExists(
    'o/r',
    'gone.webp',
    't',
    'main',
    stubFetch({ '/contents/': { status: 404, body: {} } }),
  )
  check('reports a 404 as absent', missing === false)
}

// --- the append-only invariant the writer asserts --------------------------
console.log('')
console.log('requestBlockIds gives the writer an append-only invariant')
{
  const before = requestBlockIds(QUEUE)
  const appended = `${QUEUE}- id: "new-0002"\n  status: "pending"\n`
  const truncated = 'requests:\n- id: "new-0002"\n  status: "pending"\n'

  check('lists the ids present', before.join(',') === 'keep-me-0001')
  check(
    'an append keeps every prior id',
    before.every((id) => requestBlockIds(appended).includes(id)),
  )
  check(
    'the wipe shape drops a prior id',
    before.some((id) => !requestBlockIds(truncated).includes(id)),
  )
}

console.log('')
if (failures > 0) {
  console.error(`GitHub file-read contract: ${failures} check(s) FAILED`)
  process.exit(1)
}
console.log('GitHub file-read contract: all checks passed')
