// /server/utils/tzaddikSourceRefresh.ts
//
// Live Wikipedia/Wikidata/Commons refresh for a Tzaddik candidate's sourced
// provenance fields. Wikipedia summary is the first source, MediaWiki
// pageimages is the second, and Wikidata P18/Commons is the final automatic
// image fallback. Living/memorial status is verified from Wikidata's P570.
const USER_AGENT =
  'KindRobotsTzaddikGallery/1.0 (https://kindrobots.org; contact via kindrobots.org)'
const FETCH_TIMEOUT_MS = 10_000
const MAX_SNAPSHOT_BYTES = 900_000
const COMMONS_THUMB_WIDTH = 1600

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

type ImageProvenance = {
  imageSourceUrl: string | null
  imageFileUrl: string | null
  imageLicense: string | null
  imageAttribution: string | null
  imageRevisionId: string | null
}

type WikidataSource = {
  id: string | null
  deathDate: Date | null
  imageFileName: string | null
}

const EMPTY_IMAGE_PROVENANCE: ImageProvenance = {
  imageSourceUrl: null,
  imageFileUrl: null,
  imageLicense: null,
  imageAttribution: null,
  imageRevisionId: null,
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

function wikidataStringClaim(claim: unknown): string | null {
  if (!isRecord(claim)) return null
  const mainsnak = isRecord(claim.mainsnak) ? claim.mainsnak : null
  const datavalue = isRecord(mainsnak?.datavalue) ? mainsnak.datavalue : null
  return stringField(datavalue?.value)
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

async function fetchWikidataSource(
  lang: string,
  title: string,
): Promise<WikidataSource> {
  const id = await fetchWikidataId(lang, title)
  if (!id) return { id: null, deathDate: null, imageFileName: null }

  try {
    const entityData = await fetchJson(
      `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`,
    )
    if (!isRecord(entityData)) {
      return { id, deathDate: null, imageFileName: null }
    }

    const entities = isRecord(entityData.entities) ? entityData.entities : null
    const entity = isRecord(entities?.[id]) ? entities[id] : null
    const claimsRoot = isRecord(entity?.claims) ? entity.claims : null

    let deathDate: Date | null = null
    const deathClaims = claimsRoot?.P570
    if (Array.isArray(deathClaims)) {
      for (const claim of deathClaims) {
        deathDate = parseWikidataDate(claim)
        if (deathDate) break
      }
    }

    const imageClaims = claimsRoot?.P18
    const imageFileName =
      Array.isArray(imageClaims) && imageClaims.length
        ? wikidataStringClaim(imageClaims[0])
        : null

    return { id, deathDate, imageFileName }
  } catch {
    return { id, deathDate: null, imageFileName: null }
  }
}

export function commonsFileNameFromUrl(source: string): string | null {
  try {
    const url = new URL(source)
    if (url.hostname !== 'upload.wikimedia.org') return null

    const parts = url.pathname.split('/').filter(Boolean)
    const commonsIndex = parts.indexOf('commons')
    if (commonsIndex < 0) return null

    const fileName = parts[commonsIndex + 3]
    return fileName ? decodeURIComponent(fileName) : null
  } catch {
    return null
  }
}

async function fetchCommonsImage(
  fileName: string,
): Promise<ImageProvenance> {
  try {
    const imageInfo = await fetchJson(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        `File:${fileName}`,
      )}&prop=imageinfo&iiprop=url|extmetadata|sha1&iiurlwidth=${COMMONS_THUMB_WIDTH}&format=json&formatversion=2`,
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
      imageFileUrl: stringField(info.thumburl) ?? stringField(info.url),
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

async function fetchWikipediaPageImage(
  lang: string,
  title: string,
): Promise<string | null> {
  try {
    const response = await fetchJson(
      `https://${lang}.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original|thumbnail&pithumbsize=${COMMONS_THUMB_WIDTH}&titles=${encodeURIComponent(
        title,
      )}&format=json&formatversion=2`,
    )
    if (!isRecord(response)) return null

    const query = isRecord(response.query) ? response.query : null
    const pages = Array.isArray(query?.pages) ? query.pages : null
    const firstPage = isRecord(pages?.[0]) ? pages[0] : null
    const original = isRecord(firstPage?.original) ? firstPage.original : null
    const thumbnail = isRecord(firstPage?.thumbnail)
      ? firstPage.thumbnail
      : null

    return stringField(original?.source) ?? stringField(thumbnail?.source)
  } catch {
    return null
  }
}

async function resolveImage(
  lang: string,
  title: string,
  summary: Record<string, unknown>,
  wikidata: WikidataSource,
): Promise<ImageProvenance> {
  const originalImage = isRecord(summary.originalimage)
    ? summary.originalimage
    : null
  const thumbnail = isRecord(summary.thumbnail) ? summary.thumbnail : null

  const candidates = [
    stringField(originalImage?.source),
    stringField(thumbnail?.source),
    await fetchWikipediaPageImage(lang, title),
  ].filter((value): value is string => Boolean(value))

  for (const source of candidates) {
    const commonsName = commonsFileNameFromUrl(source)
    if (commonsName) {
      const commons = await fetchCommonsImage(commonsName)
      if (commons.imageFileUrl) return commons
    }

    return {
      ...EMPTY_IMAGE_PROVENANCE,
      imageFileUrl: source,
    }
  }

  if (wikidata.imageFileName) {
    return await fetchCommonsImage(wikidata.imageFileName)
  }

  return EMPTY_IMAGE_PROVENANCE
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

  const wikidata = await fetchWikidataSource(lang, title)
  const deathDate = wikidata.deathDate
  const lifeState: 'LIVING' | 'MEMORIAL' = deathDate ? 'MEMORIAL' : 'LIVING'
  const image = await resolveImage(lang, title, summary, wikidata)

  const sourceCheckedAt = new Date()
  const sourceSnapshotJson = JSON.stringify({
    fetchedAt: sourceCheckedAt.toISOString(),
    summary,
    wikidataId: wikidata.id,
    deathDate: deathDate ? deathDate.toISOString() : null,
    imageFileName: wikidata.imageFileName,
  }).slice(0, MAX_SNAPSHOT_BYTES)

  return {
    wikipediaPageId,
    wikipediaRevisionId,
    biography,
    lifeState,
    deathDate,
    imageFileUrl: image.imageFileUrl,
    imageSourceUrl: image.imageSourceUrl,
    imageLicense: image.imageLicense,
    imageAttribution: image.imageAttribution,
    imageRevisionId: image.imageRevisionId,
    sourceSnapshotJson,
    sourceCheckedAt,
  }
}
