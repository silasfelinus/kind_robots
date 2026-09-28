// /server/utils/tzaddikSourceRefresh.ts
//
// Live Wikipedia/Wikidata/Commons refresh for a Tzaddik candidate's sourced
// provenance fields (tzaddik-gallery/t-009). recheck.post.ts's own docstring
// notes "nothing in this repo runs the actual re-fetch yet" -- this is that
// re-fetch. Living/memorial status is verified from Wikidata's P570 (date of
// death) claim rather than trusted from caller-supplied metadata or cached
// model prose, per DESIGN-BRIEF.md's ingest-time refresh requirement.
const USER_AGENT =
  'KindRobotsTzaddikGallery/1.0 (https://kindrobots.org; contact via kindrobots.org)'
const FETCH_TIMEOUT_MS = 10_000
const MAX_SNAPSHOT_BYTES = 900_000

export class TzaddikSourceFetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TzaddikSourceFetchError'
  }
}

export type TzaddikSourceResult = {
  wikipediaPageId: string | null
  wikipediaRevisionId: string | null
  biography: string | null
  lifeState: 'LIVING' | 'MEMORIAL'
  deathDate: Date | null
  imageSourceUrl: string | null
  imageFileUrl: string | null
  imageLicense: string | null
  imageAttribution: string | null
  imageRevisionId: string | null
  sourceSnapshotJson: string
  sourceCheckedAt: Date
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

function wikipediaTitleFromUrl(wikipediaUrl: string): {
  lang: string
  title: string
} {
  let url: URL
  try {
    url = new URL(wikipediaUrl)
  } catch {
    throw new TzaddikSourceFetchError(`Not a valid URL: ${wikipediaUrl}`)
  }

  const match = /^([a-z-]+)\.wikipedia\.org$/i.exec(url.hostname)
  const lang = match?.[1]
  if (!lang) {
    throw new TzaddikSourceFetchError(
      `Not a wikipedia.org URL: ${wikipediaUrl}`,
    )
  }

  const path = url.pathname.replace(/^\/wiki\//, '')
  if (!path) {
    throw new TzaddikSourceFetchError(
      `No article title in URL: ${wikipediaUrl}`,
    )
  }

  return { lang: lang.toLowerCase(), title: decodeURIComponent(path) }
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new TzaddikSourceFetchError(`${url} -> HTTP ${res.status}`)
    }
    return await res.json()
  } catch (error) {
    if (error instanceof TzaddikSourceFetchError) throw error
    throw new TzaddikSourceFetchError(
      `Request failed for ${url}: ${error instanceof Error ? error.message : String(error)}`,
    )
  } finally {
    clearTimeout(timer)
  }
}

/** Wikidata's own date format is `+2026-08-25T00:00:00Z` (a leading sign,
 * variable precision). Only day-precision (`precision: 11`) or finer is
 * treated as an actual date; year/century-precision claims are ignored. */
function parseWikidataDate(claim: unknown): Date | null {
  if (!isRecord(claim)) return null
  const mainsnak = isRecord(claim.mainsnak) ? claim.mainsnak : null
  const datavalue = isRecord(mainsnak?.datavalue) ? mainsnak.datavalue : null
  const snak = isRecord(datavalue?.value) ? datavalue.value : null
  if (!snak || typeof snak.time !== 'string') return null
  if (typeof snak.precision === 'number' && snak.precision < 11) return null

  const isoDate = snak.time.replace(/^\+/, '').slice(0, 10)
  const parsed = new Date(isoDate)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

async function fetchWikidataId(
  lang: string,
  title: string,
): Promise<string | null> {
  try {
    const pageprops = await fetchJson(
      `https://${lang}.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${encodeURIComponent(
        title,
      )}&format=json&formatversion=2`,
    )
    if (!isRecord(pageprops)) return null
    const query = isRecord(pageprops.query) ? pageprops.query : null
    const pages = Array.isArray(query?.pages) ? query.pages : null
    const firstPage = isRecord(pages?.[0]) ? pages[0] : null
    const props = isRecord(firstPage?.pageprops) ? firstPage.pageprops : null
    return stringField(props?.wikibase_item)
  } catch {
    return null
  }
}

async function fetchDeathDate(
  lang: string,
  title: string,
): Promise<Date | null> {
  const wikidataId = await fetchWikidataId(lang, title)
  if (!wikidataId) return null

  try {
    const entityData = await fetchJson(
      `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`,
    )
    if (!isRecord(entityData)) return null
    const entities = isRecord(entityData.entities) ? entityData.entities : null
    const entity = isRecord(entities?.[wikidataId])
      ? entities[wikidataId]
      : null
    const claimsRoot = isRecord(entity?.claims) ? entity.claims : null
    const claims = claimsRoot?.P570
    if (!Array.isArray(claims) || claims.length === 0) return null
    for (const claim of claims) {
      const parsed = parseWikidataDate(claim)
      if (parsed) return parsed
    }
    return null
  } catch {
    return null
  }
}

type ImageProvenance = {
  imageSourceUrl: string | null
  imageLicense: string | null
  imageAttribution: string | null
  imageRevisionId: string | null
}

const EMPTY_IMAGE_PROVENANCE: ImageProvenance = {
  imageSourceUrl: null,
  imageLicense: null,
  imageAttribution: null,
  imageRevisionId: null,
}

async function fetchImageProvenance(
  thumbnailSource: string,
): Promise<ImageProvenance> {
  const fileMatch =
    /\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/.exec(
      thumbnailSource,
    )
  const fileName = fileMatch?.[1]
  if (!fileName) return EMPTY_IMAGE_PROVENANCE

  try {
    const imageInfo = await fetchJson(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        `File:${fileName}`,
      )}&prop=imageinfo&iiprop=url|extmetadata|sha1&format=json&formatversion=2`,
    )
    if (!isRecord(imageInfo)) return EMPTY_IMAGE_PROVENANCE

    const query = isRecord(imageInfo.query) ? imageInfo.query : null
    const pages = Array.isArray(query?.pages) ? query.pages : null
    const firstPage = isRecord(pages?.[0]) ? pages[0] : null
    const imageinfoList = Array.isArray(firstPage?.imageinfo)
      ? firstPage.imageinfo
      : null
    const info = isRecord(imageinfoList?.[0]) ? imageinfoList[0] : null
    if (!info) return EMPTY_IMAGE_PROVENANCE

    const meta = isRecord(info.extmetadata) ? info.extmetadata : {}
    const artistField = isRecord(meta.Artist) ? meta.Artist : null
    const creditField = isRecord(meta.Credit) ? meta.Credit : null
    const licenseShortField = isRecord(meta.LicenseShortName)
      ? meta.LicenseShortName
      : null
    const licenseField = isRecord(meta.License) ? meta.License : null

    const artist = stringField(artistField?.value)
    const credit = stringField(creditField?.value)
    const attribution = [artist, credit].filter(Boolean).join(' — ') || null

    return {
      imageSourceUrl: stringField(info.descriptionurl),
      imageLicense:
        stringField(licenseShortField?.value) ??
        stringField(licenseField?.value),
      imageAttribution: attribution,
      imageRevisionId: stringField(info.sha1),
    }
  } catch {
    return EMPTY_IMAGE_PROVENANCE
  }
}

export async function fetchTzaddikSource(
  wikipediaUrl: string,
): Promise<TzaddikSourceResult> {
  const { lang, title } = wikipediaTitleFromUrl(wikipediaUrl)

  const summaryRaw = await fetchJson(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
  )
  const summary = isRecord(summaryRaw) ? summaryRaw : {}

  const wikipediaPageId = summary.pageid != null ? String(summary.pageid) : null
  const wikipediaRevisionId =
    summary.revision != null ? String(summary.revision) : null
  const biography = stringField(summary.extract)?.slice(0, 4000) ?? null

  const deathDate = await fetchDeathDate(lang, title)
  const lifeState: 'LIVING' | 'MEMORIAL' = deathDate ? 'MEMORIAL' : 'LIVING'

  const originalImage = isRecord(summary.originalimage)
    ? summary.originalimage
    : null
  const thumbnail = isRecord(summary.thumbnail) ? summary.thumbnail : null
  const thumbnailSource =
    stringField(originalImage?.source) ?? stringField(thumbnail?.source)

  const imageProvenance = thumbnailSource
    ? await fetchImageProvenance(thumbnailSource)
    : EMPTY_IMAGE_PROVENANCE

  const sourceCheckedAt = new Date()
  const sourceSnapshotJson = JSON.stringify({
    fetchedAt: sourceCheckedAt.toISOString(),
    summary,
    deathDate: deathDate ? deathDate.toISOString() : null,
  }).slice(0, MAX_SNAPSHOT_BYTES)

  return {
    wikipediaPageId,
    wikipediaRevisionId,
    biography,
    lifeState,
    deathDate,
    imageFileUrl: thumbnailSource,
    imageSourceUrl: imageProvenance.imageSourceUrl,
    imageLicense: imageProvenance.imageLicense,
    imageAttribution: imageProvenance.imageAttribution,
    imageRevisionId: imageProvenance.imageRevisionId,
    sourceSnapshotJson,
    sourceCheckedAt,
  }
}
