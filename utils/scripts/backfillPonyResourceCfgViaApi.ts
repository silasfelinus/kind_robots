// /utils/scripts/backfillPonyResourceCfgViaApi.ts
//
// kind-robots/t-108: backfill Resource.recommendedCfg for active LORA/LYCORIS
// rows whose checkpoint is Pony-family, using the clipping measured in their
// own t-105 preview batch image.
//
// THE SHAPE (from t-107, which opened the write path but deliberately left
// this slice unrun): for every active LORA/LYCORIS Resource with a preview
// ArtImage rendered against a Pony-family checkpoint and no recommendedCfg
// yet, compute that preview's clipped-pixel fraction, feed it through
// ponyCfgFromClipping() (utils/loraCfg.ts) to interpolate the measured
// realcartoonPony_v1/AsheLoLXL cfg<->clipping curve, clamp to the curve's
// range (3-13), and PATCH the Resource via the existing authenticated route.
// Every non-Pony LoRA is left untouched -- illustrious/sdxl/sd15/distilled
// have no measured curve (checkpointProfiles.ts marks them PROVISIONAL) and
// inventing one is explicitly out of scope.
//
// CLIPPING METHODOLOGY, verified against the two hand-measured reference
// points before trusting it catalog-wide (t-107's own verification ask):
// the curve's numbers were measured as the fraction of RGB CHANNEL SAMPLES
// (not greyscale luminance, not whole-pixel) at 0 or 255. Re-deriving it
// against AsheLoLXL's own t-105 preview (rendered at the family's cfg 10,
// same as every other candidate here) landed at 3.31% against the recorded
// 3.48% cfg-10 sweep point -- close enough, given the sweep and the t-105
// preview are different renders (different prompt/seed) of the same LoRA,
// to trust the method. A per-pixel or greyscale definition measured roughly
// 4x low on the same image and did not pass this check.
//
// Runs entirely over the live HTTPS API (KR_API_TOKEN), like
// enqueuePageBackdropArtViaApi.ts -- this repo checkout has no reachable
// database in every environment that needs to run this.
//
//   npx tsx utils/scripts/backfillPonyResourceCfgViaApi.ts                # dry run
//   npx tsx utils/scripts/backfillPonyResourceCfgViaApi.ts --apply
//   npx tsx utils/scripts/backfillPonyResourceCfgViaApi.ts --apply --limit 20
import 'dotenv/config'
import sharp from 'sharp'
import { checkpointFamily } from './../checkpointProfiles'
import { ponyCfgFromClipping } from './../loraCfg'

const BASE = (process.env.KR_API_BASE || 'https://kindrobots.org').replace(
  /\/+$/,
  '',
)
const TOKEN = process.env.KR_API_TOKEN?.trim() || ''

const APPLY = process.argv.includes('--apply')

function flag(name: string): string | null {
  const index = process.argv.indexOf(name)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

const LIMIT = Number(flag('--limit') || 0)
const DETAIL_CONCURRENCY = 8
const CFG_MIN = 3
const CFG_MAX = 13

type ResourceListRow = {
  id: number
  name: string
  resourceType: string
  ArtImage: { id: number } | null
}

type ResourceDetail = {
  id: number
  recommendedCfg: number | null
  artImageId: number | null
  localPath: string | null
}

type ArtImageRow = {
  id: number
  checkpointResourceId: number | null
  imagePath: string | null
  path: string | null
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { authorization: `Bearer ${TOKEN}` },
  })
  const body = (await response.json().catch(() => null)) as {
    success?: boolean
    data?: T
    message?: string
  } | null
  if (!response.ok || !body?.success) {
    throw new Error(
      `GET ${path} -> HTTP ${response.status} ${body?.message || ''}`.trim(),
    )
  }
  return body.data as T
}

async function apiPostJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(payload),
  })
  const body = (await response.json().catch(() => null)) as {
    success?: boolean
    data?: T
    message?: string
  } | null
  if (!response.ok || !body?.success) {
    throw new Error(
      `POST ${path} -> HTTP ${response.status} ${body?.message || ''}`.trim(),
    )
  }
  return body.data as T
}

async function apiPatch(
  path: string,
  payload: unknown,
): Promise<{ recommendedCfg: number | null }> {
  const response = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(payload),
  })
  const body = (await response.json().catch(() => null)) as {
    success?: boolean
    data?: { recommendedCfg: number | null }
    message?: string
  } | null
  if (!response.ok || !body?.success) {
    throw new Error(
      `PATCH ${path} -> HTTP ${response.status} ${body?.message || ''}`.trim(),
    )
  }
  return body.data as { recommendedCfg: number | null }
}

/** Runs `worker` over `items` with at most `limit` in flight. Same shape as
 * verifyStoredArtPaths.ts's mapLimited -- kept local rather than shared
 * because it is a five-line closure, not a dependency worth a module. */
async function mapLimited<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      for (;;) {
        const index = cursor++
        if (index >= items.length) return
        results[index] = await worker(items[index] as T)
      }
    }),
  )

  return results
}

/** Fraction of RGB channel samples crushed to 0 or blown to 255. Matches the
 * methodology behind PONY_CFG_CLIPPING_CURVE -- see the header comment. */
async function clippedChannelFraction(imageBytes: Buffer): Promise<number> {
  const { data } = await sharp(imageBytes)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let clipped = 0
  for (let i = 0; i < data.length; i += 1) {
    const value = data[i]
    if (value === 0 || value === 255) clipped += 1
  }
  return clipped / data.length
}

async function main() {
  if (!TOKEN) {
    console.error('❌ KR_API_TOKEN is not set.')
    process.exitCode = 1
    return
  }

  console.log(`Target: ${BASE}`)
  console.log(`Mode: ${APPLY ? 'APPLY' : 'dry run'}${LIMIT ? ` (limit ${LIMIT})` : ''}\n`)

  const allResources = await apiGet<ResourceListRow[]>('/api/resources')
  const candidates = allResources.filter(
    (resource) =>
      (resource.resourceType === 'LORA' ||
        resource.resourceType === 'LYCORIS') &&
      resource.ArtImage?.id,
  )
  console.log(
    `${allResources.length} active resources; ${candidates.length} LORA/LYCORIS with a preview image.`,
  )

  // Batch-resolve each preview ArtImage's checkpointResourceId (100 ids/call)
  // rather than one detail fetch per candidate.
  const artImageIds = [...new Set(candidates.map((c) => c.ArtImage!.id))]
  const artImageById = new Map<number, ArtImageRow>()
  for (let i = 0; i < artImageIds.length; i += 100) {
    const chunk = artImageIds.slice(i, i + 100)
    const rows = await apiPostJson<ArtImageRow[]>('/api/art/image/by-ids', {
      ids: chunk,
    })
    for (const row of rows) artImageById.set(row.id, row)
  }

  // Resolve each distinct checkpoint Resource's family once.
  const checkpointIds = [
    ...new Set(
      [...artImageById.values()]
        .map((row) => row.checkpointResourceId)
        .filter((id): id is number => typeof id === 'number'),
    ),
  ]
  const familyByCheckpointId = new Map<number, string>()
  await mapLimited(checkpointIds, DETAIL_CONCURRENCY, async (checkpointId) => {
    try {
      const detail = await apiGet<ResourceDetail>(
        `/api/resources/${checkpointId}`,
      )
      familyByCheckpointId.set(checkpointId, checkpointFamily(detail.localPath))
    } catch (error) {
      console.warn(
        `  WARN  checkpoint ${checkpointId}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  })

  const ponyCandidates = candidates.filter((resource) => {
    const artImage = artImageById.get(resource.ArtImage!.id)
    const checkpointId = artImage?.checkpointResourceId
    return (
      typeof checkpointId === 'number' &&
      familyByCheckpointId.get(checkpointId) === 'pony'
    )
  })
  console.log(`${ponyCandidates.length} of those sit on a Pony-family checkpoint.\n`)

  const scoped = LIMIT > 0 ? ponyCandidates.slice(0, LIMIT) : ponyCandidates

  // Detail-fetch each Pony candidate to read its CURRENT recommendedCfg
  // (skip anything already set -- a prior partial run or a manual override).
  const details = await mapLimited(scoped, DETAIL_CONCURRENCY, async (resource) => {
    try {
      return await apiGet<ResourceDetail>(`/api/resources/${resource.id}`)
    } catch (error) {
      console.warn(
        `  WARN  resource ${resource.id} (${resource.name}): ${error instanceof Error ? error.message : String(error)}`,
      )
      return null
    }
  })

  type Plan = { resource: ResourceListRow; artImage: ArtImageRow; cfg: number }
  const plan: Plan[] = []
  let alreadySet = 0
  let missingArtImage = 0

  await mapLimited(
    scoped.map((resource, index) => ({ resource, detail: details[index] })),
    DETAIL_CONCURRENCY,
    async ({ resource, detail }) => {
      if (!detail) return
      if (typeof detail.recommendedCfg === 'number') {
        alreadySet += 1
        return
      }

      const artImage = artImageById.get(resource.ArtImage!.id)
      if (!artImage?.imagePath) {
        missingArtImage += 1
        console.warn(
          `  WARN  resource ${resource.id} (${resource.name}): preview ArtImage ${resource.ArtImage!.id} has no imagePath to fetch`,
        )
        return
      }

      const imageResponse = await fetch(`${BASE}${artImage.imagePath}`)
      if (!imageResponse.ok) {
        console.warn(
          `  WARN  resource ${resource.id} (${resource.name}): preview fetch HTTP ${imageResponse.status}`,
        )
        return
      }
      const imageBytes = Buffer.from(await imageResponse.arrayBuffer())
      const fraction = await clippedChannelFraction(imageBytes)
      const rawCfg = ponyCfgFromClipping(fraction)
      if (rawCfg === null) return
      const cfg = Math.min(CFG_MAX, Math.max(CFG_MIN, rawCfg))

      plan.push({ resource, artImage, cfg })
    },
  )

  plan.sort((a, b) => a.resource.id - b.resource.id)

  console.log(
    `Already had recommendedCfg: ${alreadySet}. Missing preview file: ${missingArtImage}.`,
  )
  console.log(`Proposed backfill: ${plan.length} Resource(s).\n`)

  if (plan.length) {
    const buckets = [
      { label: '3.00 (curve floor)', test: (cfg: number) => cfg <= 3 },
      { label: '3-5', test: (cfg: number) => cfg > 3 && cfg <= 5 },
      { label: '5-7', test: (cfg: number) => cfg > 5 && cfg <= 7 },
      { label: '7-9', test: (cfg: number) => cfg > 7 && cfg <= 9 },
      { label: '9-11', test: (cfg: number) => cfg > 9 && cfg <= 11 },
      { label: '11-13', test: (cfg: number) => cfg > 11 && cfg < 13 },
      { label: '13.00 (curve ceiling)', test: (cfg: number) => cfg >= 13 },
    ]
    console.log('Distribution:')
    for (const bucket of buckets) {
      const count = plan.filter((entry) => bucket.test(entry.cfg)).length
      if (count) console.log(`  ${bucket.label.padEnd(22)} ${count}`)
    }
    console.log()
  }

  for (const entry of plan.slice(0, 40)) {
    console.log(
      `  ${APPLY ? 'WRITE' : 'WOULD'}  #${entry.resource.id} ${entry.resource.name.padEnd(40)} -> recommendedCfg ${entry.cfg.toFixed(2)}`,
    )
  }
  if (plan.length > 40) console.log(`  … and ${plan.length - 40} more`)

  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply to write these values.')
    return
  }

  let written = 0
  const failures: string[] = []
  await mapLimited(plan, DETAIL_CONCURRENCY, async (entry) => {
    try {
      await apiPatch(`/api/resources/${entry.resource.id}`, {
        recommendedCfg: entry.cfg,
      })
      written += 1
    } catch (error) {
      failures.push(
        `#${entry.resource.id} ${entry.resource.name}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  })

  console.log(`\nWrote ${written}/${plan.length} recommendedCfg value(s).`)
  if (failures.length) {
    console.log(`${failures.length} failure(s):`)
    for (const failure of failures) console.log(`  - ${failure}`)
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
