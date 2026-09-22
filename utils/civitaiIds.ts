// /utils/civitaiIds.ts
//
// Where a Resource's Civitai ids actually live.
//
// `civitaiModelId` / `civitaiModelVersionId` are the right place, and mostly
// empty: every row imported before those columns existed carries its ids only
// inside `civitaiUrl`, as
// `https://civitai.com/models/122806?modelVersionId=133805`.
//
// This has now bitten twice. The preview backfill "read 2,343 resources and
// found 0 with a version id" (see civitai-candidates.get.ts), and the LoRA
// category backfill's --fetch-tags reached 2 rows out of 1,221 on 2026-09-22 --
// not because Civitai was unreachable, but because only two rows had the
// column set. A lookup keyed on the column alone is a lookup that silently
// does nothing.
//
// scripts/backfill_civitai_previews.py already solved this with the same two
// patterns; they are mirrored here rather than invented a third time.

const VERSION_IN_URL = /[?&]modelVersionId=(\d+)/
const MODEL_IN_URL = /\/models\/(\d+)/

function positiveInt(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function firstMatch(
  pattern: RegExp,
  ...urls: Array<string | null | undefined>
) {
  for (const url of urls) {
    const match = pattern.exec(String(url ?? ''))
    const id = match ? positiveInt(match[1]) : null
    if (id) return id
  }
  return null
}

export type CivitaiIdSource = 'column' | 'url' | null

export type ResolvedCivitaiIds = {
  modelId: number | null
  versionId: number | null
  /** Where modelId came from, so a caller can report and persist recoveries. */
  modelIdSource: CivitaiIdSource
  versionIdSource: CivitaiIdSource
}

export type CivitaiIdRow = {
  civitaiModelId?: number | null
  civitaiModelVersionId?: number | null
  civitaiUrl?: string | null
  /** CivArchive link, which uses the same `/models/<id>` shape. */
  customUrl?: string | null
}

export function civitaiModelIdFromUrl(
  url: string | null | undefined,
): number | null {
  return firstMatch(MODEL_IN_URL, url)
}

export function civitaiVersionIdFromUrl(
  url: string | null | undefined,
): number | null {
  return firstMatch(VERSION_IN_URL, url)
}

/**
 * The row's Civitai ids, preferring the columns and falling back to the urls.
 *
 * Reports which source answered so a backfill can both say how many rows it
 * only reached via a url, and write those back into the columns where they
 * belong.
 */
export function resolveCivitaiIds(row: CivitaiIdRow): ResolvedCivitaiIds {
  const storedModel = positiveInt(row.civitaiModelId)
  const storedVersion = positiveInt(row.civitaiModelVersionId)

  const urlModel = storedModel
    ? null
    : firstMatch(MODEL_IN_URL, row.civitaiUrl, row.customUrl)
  const urlVersion = storedVersion
    ? null
    : firstMatch(VERSION_IN_URL, row.civitaiUrl, row.customUrl)

  return {
    modelId: storedModel ?? urlModel,
    versionId: storedVersion ?? urlVersion,
    modelIdSource: storedModel ? 'column' : urlModel ? 'url' : null,
    versionIdSource: storedVersion ? 'column' : urlVersion ? 'url' : null,
  }
}

/**
 * Civitai's model payload lists tags as plain strings, but older responses and
 * some mirrors return `{ name }` objects. Stringifying one of those yields
 * "[object Object]", which matches no category and looks exactly like a model
 * that simply has no tags -- so both shapes are read here.
 */
export function civitaiTagNames(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .map((tag) => {
      if (typeof tag === 'string') return tag
      if (tag && typeof tag === 'object' && 'name' in tag) {
        return String((tag as { name?: unknown }).name ?? '')
      }
      return ''
    })
    .map((tag) => tag.trim())
    .filter(Boolean)
}
