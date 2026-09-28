import { readFile } from 'node:fs/promises'

const seedPath = process.argv[2] || 'config/tzaddik-initial-seeds.json'
const baseUrl = String(
  process.env.TZADDIK_BASE_URL || 'https://kindrobots.org',
).replace(/\/$/, '')
const adminToken = String(process.env.TZADDIK_ADMIN_TOKEN || '').trim()

if (!adminToken) {
  throw new Error('TZADDIK_ADMIN_TOKEN is required.')
}

const payload = JSON.parse(await readFile(seedPath, 'utf8'))
if (!Array.isArray(payload?.candidates) || payload.candidates.length === 0) {
  throw new Error(`${seedPath} does not contain a non-empty candidates array.`)
}

async function readJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options)
  const text = await response.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error(
      `${options.method || 'GET'} ${path} returned non-JSON HTTP ${response.status}: ${text.slice(0, 300)}`,
    )
  }

  if (!response.ok || body?.success !== true) {
    throw new Error(
      `${options.method || 'GET'} ${path} failed with HTTP ${response.status}: ${body?.message || text.slice(0, 300)}`,
    )
  }

  return body
}

async function fetchApproved() {
  const [living, memorial] = await Promise.all([
    readJson('/api/tzaddik?lifeState=LIVING'),
    readJson('/api/tzaddik?lifeState=MEMORIAL'),
  ])

  return [...(living.data || []), ...(memorial.data || [])]
}

const before = await fetchApproved()
const approvedUrls = new Set(before.map((candidate) => candidate.wikipediaUrl))
const missing = payload.candidates.filter(
  (candidate) => !approvedUrls.has(candidate.wikipediaUrl),
)

if (missing.length === 0) {
  console.log(
    `All ${payload.candidates.length} accepted Tzaddik seeds are already approved in production.`,
  )
  process.exit(0)
}

console.log(
  `Importing ${missing.length} missing accepted Tzaddik seeds (${before.length} approved rows already visible).`,
)

const imported = await readJson('/api/tzaddik/import', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-beta-admin-token': adminToken,
  },
  body: JSON.stringify({ candidates: missing }),
})

for (const result of imported.data || []) {
  console.log(
    `${result.status}: ${result.displayName}${result.reason ? ` — ${result.reason}` : ''}`,
  )
}

const failed = (imported.data || []).filter((result) => result.status === 'failed')
if (failed.length > 0) {
  throw new Error(
    `Tzaddik seed import reported ${failed.length} failed candidate(s).`,
  )
}

const after = await fetchApproved()
const afterUrls = new Set(after.map((candidate) => candidate.wikipediaUrl))
const stillMissing = payload.candidates.filter(
  (candidate) => !afterUrls.has(candidate.wikipediaUrl),
)

if (stillMissing.length > 0) {
  throw new Error(
    `Seed verification failed; ${stillMissing.length} accepted candidate(s) are still absent from the approved gallery: ${stillMissing.map((candidate) => candidate.displayName).join(', ')}`,
  )
}

const livingCount = after.filter((candidate) => candidate.lifeState === 'LIVING').length
const memorialCount = after.filter(
  (candidate) => candidate.lifeState === 'MEMORIAL',
).length

console.log(
  `Tzaddik seed verification passed: ${livingCount} living, ${memorialCount} memorial, ${after.length} approved total.`,
)
