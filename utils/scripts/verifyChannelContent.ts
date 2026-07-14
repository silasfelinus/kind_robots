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
  requiredRole: string
  requiredPermission: string
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
const allowedRoles = new Set([
  'SYSTEM',
  'USER',
  'ASSISTANT',
  'ADMIN',
  'GUEST',
  'BOT',
  'DESIGNER',
  'CHILD',
  'FAMILY',
])
const allowedPermissions = new Set([
  'authenticated',
  'member',
  'family',
  'mature',
  'admin',
])
const navigationKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const contentDirectory = resolve(repositoryRoot, 'content')
const channelsDirectory = resolve(contentDirectory, 'channels')

function cleanValue(value: string): string {
  const trimmed = value.trim()
  const quote = trimmed[0]
  return (quote === "'" || quote === '"') && trimmed.endsWith(quote)
    ? trimmed.slice(1, -1)
    : trimmed
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

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const path = resolve(directory, entry.name)
        if (entry.isDirectory()) return markdownFiles(path)
        return entry.isFile() && entry.name.endsWith('.md') ? [path] : []
      }),
    )
  ).flat()
}

async function readDocument(file: string): Promise<NavigationDocument> {
  const frontMatter = parseFrontMatter(await readFile(file, 'utf8'))
  return {
    file: relative(repositoryRoot, file),
    contentType: frontMatter.contentType ?? '',
    channelKey: frontMatter.channelKey ?? '',
    tabKey: frontMatter.tabKey ?? '',
    defaultTab: frontMatter.defaultTab ?? '',
    route: frontMatter.route ?? '',
    requiredRole: (frontMatter.requiredRole ?? '').toUpperCase(),
    requiredPermission: (frontMatter.requiredPermission ?? '').toLowerCase(),
  }
}

function addError(
  errors: string[],
  document: NavigationDocument,
  message: string,
): void {
  errors.push(`${document.file}: ${message}`)
}

function validateAccess(
  errors: string[],
  document: NavigationDocument,
): void {
  if (document.requiredRole && !allowedRoles.has(document.requiredRole)) {
    addError(errors, document, `unknown requiredRole ${document.requiredRole}`)
  }
  if (
    document.requiredPermission &&
    !allowedPermissions.has(document.requiredPermission)
  ) {
    addError(
      errors,
      document,
      `unknown requiredPermission ${document.requiredPermission}`,
    )
  }
}

function validateKey(
  errors: string[],
  document: NavigationDocument,
  label: string,
  value: string,
): void {
  if (value && !navigationKeyPattern.test(value)) {
    addError(errors, document, `${label} must use lowercase kebab-case`)
  }
}

function validateChannelDocument(
  errors: string[],
  document: NavigationDocument,
): void {
  if (!document.contentType) addError(errors, document, 'missing contentType')
  if (!document.channelKey) addError(errors, document, 'missing channelKey')
  if (!['channel', 'tab'].includes(document.contentType)) {
    addError(errors, document, `invalid contentType ${document.contentType}`)
  }
  validateKey(errors, document, 'channelKey', document.channelKey)
  validateKey(errors, document, 'tabKey', document.tabKey)
  validateKey(errors, document, 'defaultTab', document.defaultTab)
  validateAccess(errors, document)
}

function validatePageDocument(
  errors: string[],
  document: NavigationDocument,
): void {
  if (document.contentType && document.contentType !== 'page') {
    addError(errors, document, `unexpected page contentType ${document.contentType}`)
  }
  validateKey(errors, document, 'channelKey', document.channelKey)
  validateKey(errors, document, 'tabKey', document.tabKey)
  validateAccess(errors, document)
}

async function main(): Promise<void> {
  const documents = await Promise.all(
    (await markdownFiles(channelsDirectory)).map(readDocument),
  )
  const errors: string[] = []
  const channels = documents.filter((item) => item.contentType === 'channel')
  const tabs = documents.filter((item) => item.contentType === 'tab')
  const channelsByKey = new Map(
    channels.map((channel) => [channel.channelKey, channel]),
  )
  const tabsByLocation = new Map<string, NavigationDocument>()
  const tabsByChannelRoute = new Map<string, NavigationDocument[]>()

  for (const document of documents) validateChannelDocument(errors, document)

  for (const channel of channels) {
    if (!channel.defaultTab) addError(errors, channel, 'missing defaultTab')
    if (!channel.route.startsWith('/')) {
      addError(errors, channel, 'route must start with /')
    }
    if (!expectedChannels.includes(channel.channelKey)) {
      addError(errors, channel, `unexpected top-level channel ${channel.channelKey}`)
    }
  }
  for (const expected of expectedChannels) {
    if (!channelsByKey.has(expected)) errors.push(`missing required channel ${expected}`)
  }

  for (const tab of tabs) {
    if (!tab.tabKey) {
      addError(errors, tab, 'missing tabKey')
      continue
    }
    if (!channelsByKey.has(tab.channelKey)) {
      addError(errors, tab, `unknown parent channel ${tab.channelKey}`)
    }
    if (!tab.route.startsWith('/')) addError(errors, tab, 'route must start with /')

    const location = `${tab.channelKey}/${tab.tabKey}`
    const duplicate = tabsByLocation.get(location)
    if (duplicate) {
      errors.push(`${tab.file}: duplicates ${location} from ${duplicate.file}`)
    } else {
      tabsByLocation.set(location, tab)
    }

    const routeLocation = `${tab.channelKey}:${tab.route}`
    const routeTabs = tabsByChannelRoute.get(routeLocation) ?? []
    routeTabs.push(tab)
    tabsByChannelRoute.set(routeLocation, routeTabs)
  }

  for (const channel of channels) {
    const location = `${channel.channelKey}/${channel.defaultTab}`
    if (channel.defaultTab && !tabsByLocation.has(location)) {
      addError(errors, channel, `defaultTab does not exist: ${location}`)
    }
  }

  for (const [slug, placement] of Object.entries(PROJECT_PLACEMENTS)) {
    if (!channelsByKey.has(placement.channelKey)) {
      errors.push(`${slug}: unknown placement channel ${placement.channelKey}`)
    }
    const location = `${placement.channelKey}/${placement.tabKey}`
    if (!tabsByLocation.has(location)) {
      errors.push(`${slug}: unknown placement tab ${location}`)
    }
  }

  const pageFiles = (await markdownFiles(contentDirectory)).filter(
    (file) => !file.startsWith(channelsDirectory),
  )
  const pageDocuments = await Promise.all(pageFiles.map(readDocument))
  let placedPages = 0
  for (const page of pageDocuments) {
    validatePageDocument(errors, page)
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

  const sharedRouteGroups = Array.from(tabsByChannelRoute.values()).filter(
    (routeTabs) => routeTabs.length > 1,
  )
  console.log(
    `Channel content contract passed: ${channels.length} channels, ${tabs.length} tabs, ${placedPages} placed pages, ${Object.keys(PROJECT_PLACEMENTS).length} project placements, ${sharedRouteGroups.length} shared-route groups, ${allowedRoles.size} roles, and ${allowedPermissions.size} capabilities.`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
