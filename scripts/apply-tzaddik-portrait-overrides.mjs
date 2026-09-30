import { readFile } from 'node:fs/promises'

const configPath =
  process.argv[2] || 'config/tzaddik-portrait-overrides.json'
const baseUrl = String(
  process.env.TZADDIK_BASE_URL || 'https://kindrobots.org',
).replace(/\/$/, '')
const adminToken = String(process.env.TZADDIK_ADMIN_TOKEN || '').trim()

if (!adminToken) {
  throw new Error('TZADDIK_ADMIN_TOKEN is required.')
}

const config = JSON.parse(await readFile(configPath, 'utf8'))
if (!Array.isArray(config?.portraits) || config.portraits.length === 0) {
  throw new Error(`${configPath} does not contain a non-empty portraits array.`)
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

function managedNote(portrait) {
  const marker = `[managed portrait override: ${portrait.wikipediaUrl}]`
  return [
    marker,
    `Source page: ${portrait.sourceUrl}`,
    `Image URL: ${portrait.imageUrl}`,
    `Attribution: ${portrait.attribution}`,
    `Reason: ${portrait.reason}`,
  ].join('\n')
}

function noteWithManagedPortrait(existing, portrait) {
  const current = typeof existing === 'string' ? existing.trim() : ''
  const managed = managedNote(portrait)
  const marker = `[managed portrait override: ${portrait.wikipediaUrl}]`

  if (current.includes(marker)) return current
  return [current, managed].filter(Boolean).join('\n\n')
}

async function patchOverride(candidateId, body) {
  return readJson('/api/tzaddik/override', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-beta-admin-token': adminToken,
    },
    body: JSON.stringify({ candidateId, ...body }),
  })
}

let approved = await fetchApproved()
let byWikipediaUrl = new Map(
  approved.map((candidate) => [candidate.wikipediaUrl, candidate]),
)

for (const portrait of config.portraits) {
  const candidate = byWikipediaUrl.get(portrait.wikipediaUrl)
  if (!candidate) {
    throw new Error(
      `Approved Tzaddik candidate missing for portrait override: ${portrait.displayName} (${portrait.wikipediaUrl})`,
    )
  }

  if (candidate.imageFileUrl) {
    if (candidate.imageUrlOverride === portrait.imageUrl) {
      await patchOverride(candidate.id, { imageUrlOverride: null })
      console.log(
        `source-restored: ${portrait.displayName} now has a Wikimedia portrait; cleared the managed fallback override.`,
      )
    } else {
      console.log(
        `source-present: ${portrait.displayName} already has a sourced portrait; no fallback needed.`,
      )
    }
    continue
  }

  if (
    candidate.imageUrlOverride &&
    candidate.imageUrlOverride !== portrait.imageUrl
  ) {
    console.log(
      `manual-preserved: ${portrait.displayName} already has a different explicit portrait override.`,
    )
    continue
  }

  const nextNote = noteWithManagedPortrait(candidate.overrideNote, portrait)
  if (
    candidate.imageUrlOverride === portrait.imageUrl &&
    candidate.overrideNote === nextNote
  ) {
    console.log(`already-set: ${portrait.displayName}`)
    continue
  }

  await patchOverride(candidate.id, {
    imageUrlOverride: portrait.imageUrl,
    overrideNote: nextNote,
  })
  console.log(`override-set: ${portrait.displayName}`)
}

approved = await fetchApproved()
byWikipediaUrl = new Map(
  approved.map((candidate) => [candidate.wikipediaUrl, candidate]),
)

for (const portrait of config.portraits) {
  const candidate = byWikipediaUrl.get(portrait.wikipediaUrl)
  if (!candidate) {
    throw new Error(
      `Portrait verification lost candidate: ${portrait.displayName}`,
    )
  }

  if (!candidate.imageFileUrl && !candidate.imageUrlOverride) {
    throw new Error(
      `Portrait verification failed: ${portrait.displayName} still has no sourced image or explicit override.`,
    )
  }

  const response = await fetch(
    `${baseUrl}/api/tzaddik/${candidate.id}/image?verify=${Date.now()}`,
    {
      headers: {
        'x-beta-admin-token': adminToken,
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
    },
  )
  const contentType = response.headers.get('content-type') || ''
  if (!response.ok || !contentType.toLowerCase().startsWith('image/')) {
    const text = await response.text()
    throw new Error(
      `Portrait proxy verification failed for ${portrait.displayName}: HTTP ${response.status} ${contentType} ${text.slice(0, 200)}`,
    )
  }

  console.log(
    `verified: ${portrait.displayName} portrait proxy returned ${contentType}`,
  )
}
