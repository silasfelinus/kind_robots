// /server/api/conductor/art-request.post.ts
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '@/server/utils/error'
import { userIsAdmin } from '@/server/utils/authUser'
import { validateApiKey } from '@/server/utils/validateKey'
import { buildContextualArtPrompt } from '@/server/utils/conductorArtPrompt'
import { type ArtQueueEntry, type ArtVariant, appendRequest } from '@/server/utils/artRequestYaml'

const GITHUB_API = 'https://api.github.com'
const KIND_ROBOTS_REPO = 'silasfelinus/kind_robots'
const CONDUCTOR_REPO = 'silasfelinus/conductor'
const ART_PROMPTS_PATH = 'projects/art-prompts.yaml'
const DEFAULT_BRANCH = 'main'
const IMAGE_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg'])
const VARIANT_SIZES: Record<ArtVariant, string> = {
  icon: '256x256',
  card: '512x768',
  hero: '1280x720',
  image: '',
}

type MissingArtRequestBody = {
  src?: string
  imagePath?: string
  sourceUrl?: string
  pageUrl?: string
  alt?: string
  label?: string
  variant?: string
  size?: string
  prompt?: string
  pageTitle?: string
  pageDescription?: string
  nearestHeading?: string
  nearbyText?: string
  imageClass?: string
}

type GitHubFile = {
  content: string
  sha: string
  encoding: string
}

type ImageTarget = {
  sourceUrl: string
  targetRepo: string
  targetRef: string
  imagePath: string
  publicPath: string
  variant: ArtVariant
  size: string
  slug: string
}

function getGithubToken(): string {
  return String(process.env.CONDUCTOR_GITHUB_TOKEN || process.env.GITHUB_TOKEN || '').trim()
}

function getConductorBranch(): string {
  return String(
    process.env.CONDUCTOR_ART_BRANCH ||
      process.env.CONDUCTOR_BRANCH ||
      DEFAULT_BRANCH,
  ).trim()
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function extensionForPath(path: string): string {
  const match = path.toLowerCase().match(/\.[a-z0-9]+$/)
  return match?.[0] ?? ''
}

function isImagePath(path: string): boolean {
  return IMAGE_EXTENSIONS.has(extensionForPath(path))
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function inferVariant(path: string, requested?: string): ArtVariant {
  const normalized = cleanString(requested).toLowerCase()
  if (normalized === 'icon' || normalized === 'card' || normalized === 'hero') {
    return normalized
  }

  const basename = path.split('/').pop()?.toLowerCase() ?? ''
  if (/(^|-|_)icon\./.test(basename)) return 'icon'
  if (/(^|-|_)card\./.test(basename)) return 'card'
  if (/(^|-|_)hero\./.test(basename)) return 'hero'

  return 'image'
}

function stripVariantFromSlug(slug: string, variant: ArtVariant): string {
  if (variant === 'image') return slug
  return slug.replace(new RegExp(`[-_]${variant}$`), '')
}

function normalizePublicPath(pathname: string): string {
  const clean = pathname.split('?')[0]!.split('#')[0] || ''
  const ipxMatch = clean.match(/^\/_ipx\/[^/]+\/(.+)$/)
  if (ipxMatch?.[1]) return `/${ipxMatch[1]}`
  return clean.startsWith('/') ? clean : `/${clean}`
}

function normalizeSourceUrl(body: MissingArtRequestBody): string {
  return cleanString(body.imagePath || body.src || body.sourceUrl)
}

function targetFromSource(body: MissingArtRequestBody): ImageTarget {
  const sourceUrl = normalizeSourceUrl(body)

  if (!sourceUrl) {
    throw createError({ statusCode: 400, message: 'Missing image source.' })
  }

  if (/^(data|blob):/i.test(sourceUrl)) {
    throw createError({ statusCode: 400, message: 'Inline image sources are ignored.' })
  }

  let url: URL | null = null
  try {
    url = new URL(sourceUrl, 'https://kindrobots.org')
  } catch {}

  const hostname = url?.hostname.toLowerCase() ?? ''
  const rawPath = normalizePublicPath(url?.pathname || sourceUrl)

  if (rawPath.startsWith('/_nuxt/') || rawPath.includes('/node_modules/')) {
    throw createError({ statusCode: 400, message: 'Build assets are ignored.' })
  }

  if (hostname === 'raw.githubusercontent.com') {
    const parts = rawPath.split('/').filter(Boolean)
    const [owner, repo, ref, ...fileParts] = parts
    const imagePath = fileParts.join('/')

    if (!owner || !repo || !ref || !imagePath || !isImagePath(imagePath)) {
      throw createError({ statusCode: 400, message: 'Unsupported GitHub image source.' })
    }

    const variant = inferVariant(imagePath, body.variant)
    const basename = imagePath.split('/').pop() ?? imagePath
    const slug = stripVariantFromSlug(slugify(basename), variant)

    return {
      sourceUrl,
      targetRepo: `${owner}/${repo}`,
      targetRef: ref,
      imagePath,
      publicPath: sourceUrl,
      variant,
      size: cleanString(body.size) || VARIANT_SIZES[variant],
      slug,
    }
  }

  if (!isImagePath(rawPath)) {
    throw createError({ statusCode: 400, message: 'Only image paths can create art requests.' })
  }

  const imagePath = rawPath.startsWith('/public/')
    ? rawPath.slice(1)
    : `public${rawPath}`
  const variant = inferVariant(imagePath, body.variant)
  const basename = imagePath.split('/').pop() ?? imagePath
  const slug = stripVariantFromSlug(slugify(basename), variant)

  return {
    sourceUrl,
    targetRepo: KIND_ROBOTS_REPO,
    targetRef: DEFAULT_BRANCH,
    imagePath,
    publicPath: rawPath,
    variant,
    size: cleanString(body.size) || VARIANT_SIZES[variant],
    slug,
  }
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'kind-robots-art-requests/1.0',
    Authorization: `Bearer ${token}`,
  }
}

async function fetchGithubFile(
  repo: string,
  path: string,
  token: string,
  ref = DEFAULT_BRANCH,
): Promise<GitHubFile | null> {
  const url = `${GITHUB_API}/repos/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`
  const res = await fetch(url, { headers: githubHeaders(token) })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub ${res.status} while fetching ${repo}/${path}`)

  const data = (await res.json()) as GitHubFile
  return data
}

async function githubFileExists(target: ImageTarget, token: string): Promise<boolean> {
  const file = await fetchGithubFile(
    target.targetRepo,
    target.imagePath,
    token,
    target.targetRef,
  )
  return Boolean(file)
}

function decodeGithubContent(file: GitHubFile): string {
  return Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf-8')
}

function encodeGithubContent(content: string): string {
  return Buffer.from(content, 'utf-8').toString('base64')
}

function buildFallbackPrompt(body: MissingArtRequestBody, target: ImageTarget): string {
  const explicit = cleanString(body.prompt)
  if (explicit) return explicit

  const label = cleanString(body.alt || body.label) || titleFromSlug(target.slug)

  if (target.variant === 'icon') {
    return `flat minimal app icon for ${label}, bold clean vector shapes, square composition, no text`
  }

  if (target.variant === 'card') {
    return `polished portrait illustration for ${label}, centered subject, rich Kind Robots visual style, no text, 2:3 portrait composition`
  }

  if (target.variant === 'hero') {
    return `wide cinematic hero image for ${label}, expressive scene with clear atmosphere and personality, no text, 16:9 landscape composition`
  }

  return `polished web illustration for ${label}, clear subject, cohesive Kind Robots visual style, no text`
}

async function buildEntry(body: MissingArtRequestBody, target: ImageTarget): Promise<ArtQueueEntry> {
  const repoName = target.targetRepo.split('/').pop() ?? 'repo'
  const hash = createHash('sha1')
    .update(`${target.targetRepo}:${target.imagePath}:${target.sourceUrl}`)
    .digest('hex')
    .slice(0, 8)
  const id = `${slugify(`${repoName}-${target.slug}-${target.variant}`)}-${hash}`
  const fallbackPrompt = buildFallbackPrompt(body, target)
  const prompt = await buildContextualArtPrompt(body, target, fallbackPrompt)

  return {
    id,
    source: 'kind-robots-missing-image',
    status: 'pending',
    target_repo: target.targetRepo,
    image_path: target.imagePath,
    source_url: target.sourceUrl,
    page_url: cleanString(body.pageUrl),
    variant: target.variant,
    size: target.size,
    label: cleanString(body.alt || body.label) || titleFromSlug(target.slug),
    prompt,
  }
}

async function updateConductorQueue(entry: ArtQueueEntry, token: string) {
  const branch = getConductorBranch()
  const file = await fetchGithubFile(CONDUCTOR_REPO, ART_PROMPTS_PATH, token, branch)

  if (!file) {
    throw createError({
      statusCode: 404,
      message: `Could not find ${ART_PROMPTS_PATH} in ${CONDUCTOR_REPO}@${branch}.`,
    })
  }

  const current = decodeGithubContent(file)
  const next = appendRequest(current, entry)

  if (next === current) {
    return { created: false, branch }
  }

  const res = await fetch(
    `${GITHUB_API}/repos/${CONDUCTOR_REPO}/contents/${encodePath(ART_PROMPTS_PATH)}`,
    {
      method: 'PUT',
      headers: githubHeaders(token),
      body: JSON.stringify({
        message: `art: request ${entry.image_path}`,
        content: encodeGithubContent(next),
        sha: file.sha,
        branch,
      }),
    },
  )

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`GitHub ${res.status} while updating art queue: ${detail}`)
  }

  return { created: true, branch }
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
    }

    if (!userIsAdmin(user)) {
      throw createError({ statusCode: 403, message: 'Admin access required.' })
    }

    const token = getGithubToken()
    if (!token) {
      throw createError({
        statusCode: 500,
        message: 'Missing CONDUCTOR_GITHUB_TOKEN or GITHUB_TOKEN.',
      })
    }

    const body = await readBody<MissingArtRequestBody>(event)
    const target = targetFromSource(body)

    if (await githubFileExists(target, token)) {
      return {
        success: true,
        message: 'Image already exists in the target repo; no request created.',
        data: { created: false, target },
        statusCode: 200,
      }
    }

    const entry = await buildEntry(body, target)
    const result = await updateConductorQueue(entry, token)

    event.node.res.statusCode = result.created ? 201 : 200

    return {
      success: true,
      message: result.created
        ? 'Art request added to Conductor.'
        : 'Art request was already queued.',
      data: { created: result.created, branch: result.branch, entry },
      statusCode: result.created ? 201 : 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to create Conductor art request.',
      statusCode,
    }
  }
})
