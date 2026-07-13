import { readdir, readFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  resolveChannels,
  type ChannelContentItem,
} from '@/stores/helpers/channelContent'

type FrontMatter = Record<string, string>

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const channelsDirectory = resolve(repositoryRoot, 'content/channels')
const publicDirectory = resolve(repositoryRoot, 'public')
const strict = process.argv.includes('--strict')

function cleanValue(value: string): string {
  const trimmed = value.trim()
  const quote = trimmed[0]

  if (
    (quote === "'" || quote === '"') &&
    trimmed.length >= 2 &&
    trimmed.endsWith(quote)
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

function parseFrontMatter(source: string): FrontMatter {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match?.[1]) return {}

  const result: FrontMatter = {}

  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s/.test(line)) continue

    const separator = line.indexOf(':')
    if (separator < 1) continue

    result[line.slice(0, separator).trim()] = cleanValue(
      line.slice(separator + 1),
    )
  }

  return result
}

async function filesWithin(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name)

      if (entry.isDirectory()) return filesWithin(path)
      if (entry.isFile()) return [path]
      return []
    }),
  )

  return nested.flat()
}

async function loadChannelItems(): Promise<ChannelContentItem[]> {
  const files = (await filesWithin(channelsDirectory)).filter((file) =>
    file.endsWith('.md'),
  )

  return Promise.all(
    files.map(async (file) => {
      const source = await readFile(file, 'utf8')
      const frontMatter = parseFrontMatter(source)

      return {
        ...frontMatter,
        sort: frontMatter.sort ? Number(frontMatter.sort) : 0,
        path: relative(repositoryRoot, file),
      } as ChannelContentItem
    }),
  )
}

function publicAssetPath(image: string): string | null {
  const value = image.trim()
  if (!value || /^https?:\/\//i.test(value)) return null

  const pathname = value.split(/[?#]/)[0] ?? ''
  if (!pathname.startsWith('/')) return null

  return pathname.slice(1)
}

async function main(): Promise<void> {
  const [items, publicFiles] = await Promise.all([
    loadChannelItems(),
    filesWithin(publicDirectory),
  ])
  const assets = new Set(
    publicFiles.map((file) => relative(publicDirectory, file).replaceAll('\\', '/')),
  )
  const channels = resolveChannels(items)
  const missing: Array<{ location: string; image: string }> = []
  let checked = 0

  function inspect(location: string, image: string): void {
    const asset = publicAssetPath(image)
    if (!asset) return

    checked += 1
    if (!assets.has(asset)) missing.push({ location, image })
  }

  for (const channel of channels) {
    inspect(channel.channelKey, channel.image)

    for (const tab of channel.tabs) {
      inspect(`${channel.channelKey}/${tab.tabKey}`, tab.image)
    }
  }

  console.log(
    `Channel artwork audit checked ${checked} local image references across ${channels.length} channels.`,
  )

  if (!missing.length) {
    console.log('All resolved channel and tab artwork exists in public/.')
    return
  }

  console.warn(`Missing ${missing.length} resolved channel or tab image(s):`)
  for (const entry of missing) {
    console.warn(`- ${entry.location}: ${entry.image}`)
  }

  if (strict) process.exitCode = 1
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
