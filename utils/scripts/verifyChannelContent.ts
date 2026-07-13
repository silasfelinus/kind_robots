// /utils/scripts/verifyChannelContent.ts
import { readdir, readFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROJECT_PLACEMENTS } from '@/utils/projectPlacements'

type FrontMatter = Record<string, string>

type NavigationDocument = {
  file: string
  contentType: string
  channelKey: string
  tabKey: string
  defaultTab: string
  route: string
}

const expectedChannels = [
  'home',
  'plan',
  'build',
  'play',
  'lab',
  'sanctuary',
  'admin',
]

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const contentDirectory = resolve(repositoryRoot, 'content')
const channelsDirectory = resolve(contentDirectory, 'channels')

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

    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1)
    result[key] = cleanValue(value)
  }

  return result
}

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name)

      if (entry.isDirectory()) return markdownFiles(path)
      if (entry.isFile() && entry.name.endsWith('.md')) return [path]

      return []
    }),
  )

  return nested.flat()
}

async function readDocument(file: string): Promise<NavigationDocument> {
  const source = await readFile(file, 'utf8')
  const frontMatter = parseFrontMatter(source)

  return {
    file: relative(repositoryRoot, file),
    contentType: frontMatter.contentType ?? '',
    channelKey: frontMatter.channelKey ?? '',
    tabKey: frontMatter.tabKey ?? '',
    defaultTab: frontMatter.defaultTab ?? '',
    route: frontMatter.route ?? '',
  }
}

function addError(errors: string[], document: NavigationDocument, message: string) {
  errors.push(`${document.file}: ${message}`)
}

async function main() {
  const channelFiles = await markdownFiles(channelsDirectory)
  const documents = await Promise.all(channelFiles.map(readDocument))
  const errors: string[] = []
  const channels = documents.filter(
    (document) => document.contentType === 'channel',
  )
  const tabs = documents.filter((document) => document.contentType === 'tab')
  const channelsByKey = new Map(channels.map((channel) => [channel.channelKey, channel]))
  const tabsByLocation = new Map<string, NavigationDocument>()

  for (const document of documents) {
    if (!document.contentType) {
      addError(errors, document, 'missing contentType')
    }

    if (!document.channelKey) {
      addError(errors, document, 'missing channelKey')
    }

    if (!['channel', 'tab'].includes(document.contentType)) {
      addError(errors, document, `invalid contentType ${document.contentType}`)
    }
  }

  for (const channel of channels) {
    if (!channel.defaultTab) {
      addError(errors, channel, 'missing defaultTab')
    }

    if (!channel.route.startsWith('/')) {
      addError(errors, channel, 'route must start with /')
    }
  }

  for (const expected of expectedChannels) {
    if (!channelsByKey.has(expected)) {
      errors.push(`missing required channel ${expected}`)
    }
  }

  for (const channel of channels) {
    if (!expectedChannels.includes(channel.channelKey)) {
      addError(errors, channel, `unexpected top-level channel ${channel.channelKey}`)
    }
  }

  for (const tab of tabs) {
    if (!tab.tabKey) {
      addError(errors, tab, 'missing tabKey')
      continue
    }

    if (!channelsByKey.has(tab.channelKey)) {
      addError(errors, tab, `unknown parent channel ${tab.channelKey}`)
    }

    if (!tab.route.startsWith('/')) {
      addError(errors, tab, 'route must start with /')
    }

    const location = `${tab.channelKey}/${tab.tabKey}`
    const duplicate = tabsByLocation.get(location)

    if (duplicate) {
      errors.push(`${tab.file}: duplicates ${location} from ${duplicate.file}`)
    } else {
      tabsByLocation.set(location, tab)
    }
  }

  for (const channel of channels) {
    const location = `${channel.channelKey}/${channel.defaultTab}`

    if (channel.defaultTab && !tabsByLocation.has(location)) {
      addError(errors, channel, `defaultTab does not exist: ${location}`)
    }
  }

  for (const [slug, placement] of Object.entries(PROJECT_PLACEMENTS)) {
    if (!channelsByKey.has(placement.channelKey)) {
      errors.push(`${slug}: project placement uses unknown channel ${placement.channelKey}`)
    }

    const location = `${placement.channelKey}/${placement.tabKey}`
    if (!tabsByLocation.has(location)) {
      errors.push(`${slug}: project placement uses unknown tab ${location}`)
    }
  }

  const pageFiles = (await markdownFiles(contentDirectory)).filter(
    (file) => !file.startsWith(channelsDirectory),
  )
  const pageDocuments = await Promise.all(pageFiles.map(readDocument))
  let placedPages = 0

  for (const page of pageDocuments) {
    if (!page.channelKey && !page.tabKey) continue

    placedPages += 1

    if (!page.channelKey || !page.tabKey) {
      addError(errors, page, 'channelKey and tabKey must be declared together')
      continue
    }

    const location = `${page.channelKey}/${page.tabKey}`
    if (!tabsByLocation.has(location)) {
      addError(errors, page, `references unknown tab ${location}`)
    }
  }

  if (errors.length) {
    console.error(`Channel content contract failed with ${errors.length} error(s):`)
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Channel content contract passed: ${channels.length} channels, ${tabs.length} tabs, ${placedPages} placed pages, ${Object.keys(PROJECT_PLACEMENTS).length} project placements.`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
