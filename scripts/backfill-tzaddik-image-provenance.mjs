const baseUrl = String(
  process.env.TZADDIK_BASE_URL || 'https://kindrobots.org',
).replace(/\/$/, '')
const adminToken = String(process.env.TZADDIK_ADMIN_TOKEN || '').trim()
const IMAGE_SELECTION_VERSION = 2
const BIOGRAPHY_SELECTION_VERSION = 2

if (!adminToken) {
  throw new Error('TZADDIK_ADMIN_TOKEN is required.')
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
function snapshotVersions(candidate) {
  try {
    const parsed = JSON.parse(candidate.sourceSnapshotJson || '{}')
    return {
      image: Number(parsed.imageSelectionVersion || 0),
      biography: Number(parsed.biographySelectionVersion || 0),
    }
  } catch {
    return { image: 0, biography: 0 }
  }
}

const needsSourceRefresh = before.filter((candidate) => {
  const version = snapshotVersions(candidate)
  return (
    version.image < IMAGE_SELECTION_VERSION ||
    version.biography < BIOGRAPHY_SELECTION_VERSION ||
    (String(candidate.imageFileUrl || '').includes(
      'upload.wikimedia.org/wikipedia/commons/',
    ) &&
      !candidate.imageSourceUrl)
  )
})

if (needsSourceRefresh.length) {
  console.log(
    `Refreshing ${needsSourceRefresh.length} Tzaddik profile(s) onto portrait-selection v${IMAGE_SELECTION_VERSION} and biography-selection v${BIOGRAPHY_SELECTION_VERSION}.`,
  )

  for (const candidate of needsSourceRefresh) {
    const result = await readJson('/api/tzaddik/recheck', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-beta-admin-token': adminToken,
      },
      body: JSON.stringify({ candidateId: candidate.id }),
    })
    console.log(
      `rechecked: ${candidate.displayName} — ${result.data?.status || 'unknown'}`,
    )
  }
} else {
  console.log(
    `All approved Tzaddik profiles already use portrait-selection v${IMAGE_SELECTION_VERSION} and biography-selection v${BIOGRAPHY_SELECTION_VERSION}.`,
  )
}

const after = await fetchApproved()
const remainingProvenanceGaps = after.filter(
  (candidate) =>
    String(candidate.imageFileUrl || '').includes(
      'upload.wikimedia.org/wikipedia/commons/',
    ) && !candidate.imageSourceUrl,
)

if (remainingProvenanceGaps.length) {
  throw new Error(
    `Commons provenance is still missing for: ${remainingProvenanceGaps.map((candidate) => candidate.displayName).join(', ')}`,
  )
}

const portraitRows = after.filter((candidate) => candidate.imageFileUrl)
const probeRows = portraitRows.slice(0, 5)

for (const candidate of probeRows) {
  const revision =
    candidate.imageRevisionId ||
    candidate.wikipediaRevisionId ||
    candidate.sourceCheckedAt ||
    ''
  const suffix = revision ? `?v=${encodeURIComponent(String(revision))}` : ''
  const response = await fetch(
    `${baseUrl}/api/tzaddik/${candidate.id}/image${suffix}`,
  )
  const contentType = response.headers.get('content-type') || ''
  await response.body?.cancel()

  if (!response.ok || !contentType.toLowerCase().startsWith('image/')) {
    throw new Error(
      `Portrait proxy failed for ${candidate.displayName}: HTTP ${response.status}, content-type ${contentType || '(none)'}`,
    )
  }

  console.log(`portrait proxy ok: ${candidate.displayName} — ${contentType}`)
}

const withoutPortrait = after
  .filter((candidate) => !candidate.imageFileUrl && !candidate.imageUrlOverride)
  .map((candidate) => candidate.displayName)

console.log(
  `Tzaddik portrait audit: ${portraitRows.length}/${after.length} sourced portraits available.`,
)
if (withoutPortrait.length) {
  console.log(
    `No freely sourced Wikipedia/Wikidata portrait yet for: ${withoutPortrait.join(', ')}`,
  )
}
