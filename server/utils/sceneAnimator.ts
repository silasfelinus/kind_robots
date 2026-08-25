import { createHash } from 'node:crypto'
import { readdir, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import { createError } from 'h3'
import { getImageStorageRoot } from './imageStorageRoot'
import type {
  VideoEngine,
  VideoOutputFormat,
  VideoPresetId,
} from '@/utils/videoPresets'

export const SCENE_ANIMATOR_PROJECT_SLUG = 'scene-animator'

export const SCENE_ANIMATOR_PROMPT =
  'Bring this still scene naturally to life with subtle coherent motion. Preserve the subjects, composition, identity, lighting, and visual style. Add only plausible ambient movement, gentle secondary motion, and stable cinematic camera behavior. Do not introduce new characters, objects, text, or scene changes.'

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])

export type SceneAnimatorRenderConfig = {
  engine: VideoEngine
  presetId: VideoPresetId
  durationSeconds: number
  fps: number
  width: number
  height: number
  outputFormat: VideoOutputFormat
  loop: boolean
  renderScale: number
  isMature: boolean
}

export type SceneAnimatorContext = {
  sourceFolder: string
  sourceFile: string
  sourceHash: string
  configKey: string
  dedupeKey: string
}

export type SceneAnimatorSourceFile = {
  name: string
  bytes: number
  hash: string
  mime: string
}

function badPath(message = 'Invalid animation source path.') {
  return createError({ statusCode: 400, message })
}

function normalizeFolder(value: unknown): string {
  const raw = String(value ?? '').trim().replace(/\\/g, '/')
  if (!raw) return ''
  if (raw.includes('\0') || raw.startsWith('/')) throw badPath()
  const normalized = path.posix.normalize(raw).replace(/^\.\//, '')
  if (
    !normalized ||
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../')
  ) {
    throw badPath()
  }
  return normalized
}

function normalizeFile(value: unknown): string {
  const raw = String(value ?? '').trim().replace(/\\/g, '/')
  if (!raw || raw.includes('\0') || raw.includes('/') || raw === '.' || raw === '..') {
    throw badPath('Invalid animation source filename.')
  }
  const ext = path.extname(raw).toLowerCase()
  if (!IMAGE_EXTENSIONS.has(ext)) {
    throw badPath('Unsupported animation source image type.')
  }
  return raw
}

function mimeForFile(filename: string): string {
  switch (path.extname(filename).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    default:
      return 'image/png'
  }
}

export function getSceneAnimatorRoot(): string {
  const configured = process.env.ANIMATE_PATH?.trim()
  if (configured) return path.resolve(configured)

  const imageRoot = getImageStorageRoot()
  if (process.env.IMAGES_PATH?.trim()) {
    return path.resolve(imageRoot, '..', 'animate')
  }

  return path.resolve(process.cwd(), 'animate')
}

/** How `getSceneAnimatorRoot()` arrived at its answer — surfaced in health
 *  diagnostics so an operator can tell "misconfigured" from "not mounted yet"
 *  without reading source. */
export type SceneAnimatorRootSource =
  | 'ANIMATE_PATH'
  | 'IMAGES_PATH-derived'
  | 'fallback'

export function getSceneAnimatorRootSource(): SceneAnimatorRootSource {
  if (process.env.ANIMATE_PATH?.trim()) return 'ANIMATE_PATH'
  if (process.env.IMAGES_PATH?.trim()) return 'IMAGES_PATH-derived'
  return 'fallback'
}

export type SceneAnimatorRootStatus = {
  available: boolean
  root: string
  source: SceneAnimatorRootSource
  folders: Array<{ name: string; imageCount: number }>
  reason: string | null
}

/**
 * Non-throwing read of the configured source root. `listSceneAnimatorFolders()`
 * throws (a 503 "source root is unavailable" H3 error, or a raw fs error if the
 * root exists but isn't readable) the moment ANIMATE_PATH points at a mount that
 * hasn't landed yet -- exactly the operator-visible case this exists to make
 * legible instead of an opaque request failure. Single source of truth for both
 * the `/api/scene-animator` listing (which needs the folder list either way) and
 * the dedicated `/api/scene-animator/health` check (which only needs the verdict).
 */
export async function readSceneAnimatorRootStatus(): Promise<SceneAnimatorRootStatus> {
  const root = getSceneAnimatorRoot()
  const source = getSceneAnimatorRootSource()

  try {
    const folders = await listSceneAnimatorFolders()
    return { available: true, root, source, folders, reason: null }
  } catch (error) {
    return {
      available: false,
      root,
      source,
      folders: [],
      reason:
        error instanceof Error
          ? error.message
          : `Scene Animator source root is unavailable: ${root}`,
    }
  }
}

async function resolveContainedPath(folder: string, filename?: string): Promise<string> {
  const root = getSceneAnimatorRoot()
  let resolvedRoot: string
  try {
    resolvedRoot = await realpath(root)
  } catch {
    throw createError({
      statusCode: 503,
      message: `Scene Animator source root is unavailable: ${root}`,
    })
  }

  const normalizedFolder = normalizeFolder(folder)
  const candidate = filename
    ? path.resolve(resolvedRoot, normalizedFolder, normalizeFile(filename))
    : path.resolve(resolvedRoot, normalizedFolder)

  let resolvedCandidate: string
  try {
    resolvedCandidate = await realpath(candidate)
  } catch {
    throw createError({ statusCode: 404, message: 'Animation source not found.' })
  }

  if (
    resolvedCandidate !== resolvedRoot &&
    !resolvedCandidate.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw badPath('Animation source escaped the configured root.')
  }

  return resolvedCandidate
}

export async function listSceneAnimatorFolders(): Promise<
  Array<{ name: string; imageCount: number }>
> {
  const root = await resolveContainedPath('')
  const entries = await readdir(root, { withFileTypes: true })
  const folders: Array<{ name: string; imageCount: number }> = []

  const rootImages = entries.filter(
    (entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
  )
  if (rootImages.length) folders.push({ name: '', imageCount: rootImages.length })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    try {
      const directory = await resolveContainedPath(entry.name)
      const children = await readdir(directory, { withFileTypes: true })
      const imageCount = children.filter(
        (child) =>
          child.isFile() && IMAGE_EXTENSIONS.has(path.extname(child.name).toLowerCase()),
      ).length
      if (imageCount) folders.push({ name: entry.name, imageCount })
    } catch {
      // Ignore unreadable or symlink-escaping children instead of failing the whole picker.
    }
  }

  return folders.sort((left, right) => left.name.localeCompare(right.name))
}

export async function listSceneAnimatorSourceFiles(
  folder: string,
): Promise<SceneAnimatorSourceFile[]> {
  const normalizedFolder = normalizeFolder(folder)
  const directory = await resolveContainedPath(normalizedFolder)
  const entries = await readdir(directory, { withFileTypes: true })
  const files: SceneAnimatorSourceFile[] = []

  for (const entry of entries) {
    if (!entry.isFile() || !IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      continue
    }
    const source = await readSceneAnimatorSource(normalizedFolder, entry.name)
    files.push({
      name: entry.name,
      bytes: source.bytes.length,
      hash: source.hash,
      mime: source.mime,
    })
  }

  return files.sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { numeric: true }),
  )
}

export async function readSceneAnimatorSource(folder: string, filename: string) {
  const normalizedFolder = normalizeFolder(folder)
  const normalizedFile = normalizeFile(filename)
  const sourcePath = await resolveContainedPath(normalizedFolder, normalizedFile)
  const bytes = await readFile(sourcePath)
  return {
    folder: normalizedFolder,
    filename: normalizedFile,
    bytes,
    mime: mimeForFile(normalizedFile),
    hash: createHash('sha256').update(bytes).digest('hex'),
  }
}

function stableNumber(value: number): string {
  return Number(value.toFixed(3)).toString()
}

export function sceneAnimatorConfigKey(config: SceneAnimatorRenderConfig): string {
  return [
    config.engine,
    config.presetId,
    `${config.width}x${config.height}`,
    `${stableNumber(config.durationSeconds)}s`,
    `${stableNumber(config.fps)}fps`,
    config.outputFormat,
    config.loop ? 'loop' : 'once',
    `scale-${stableNumber(config.renderScale)}`,
    config.isMature ? 'mature' : 'general',
  ].join('|')
}

export function sceneAnimatorDedupeKey(
  sourceHash: string,
  config: SceneAnimatorRenderConfig,
): string {
  return `scene-animator:${sourceHash}:${createHash('sha256')
    .update(sceneAnimatorConfigKey(config))
    .digest('hex')}`
}

export function parseSceneAnimatorContext(value: unknown): SceneAnimatorContext | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  const context: SceneAnimatorContext = {
    sourceFolder: String(raw.sourceFolder ?? ''),
    sourceFile: String(raw.sourceFile ?? ''),
    sourceHash: String(raw.sourceHash ?? ''),
    configKey: String(raw.configKey ?? ''),
    dedupeKey: String(raw.dedupeKey ?? ''),
  }
  return context.sourceFile && context.sourceHash && context.configKey && context.dedupeKey
    ? context
    : null
}
