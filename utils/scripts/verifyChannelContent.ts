// /utils/scripts/verifyChannelContent.ts
import { readdir, readFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateNavManifest, type NavManifestEntry } from '@/utils/navManifest'
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
  dashboardKey: string
  dashboardTab: string
  cardsKey: string
}

const expectedChannels = ['home', 'plan', 'build', 'play', 'sanctuary', 'admin']
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
const componentsDirectory = resolve(repositoryRoot, 'components')

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

/*
 * Every component name an MDC block in a content file may legally mount.
 *
 * nuxt.config.ts registers components with `pathPrefix: false`, so the mount
 * name is the BARE filename -- `components/navigation/navigation-health.vue`
 * mounts as `:navigation-health`, not `:navigation-navigation-health`. Getting
 * that wrong yields a component Vue silently cannot resolve, and the route
 * renders nothing at all.
 *
 * Resolved from the files on disk rather than from `.nuxt/components.d.ts`,
 * because that is a build artifact this script must not depend on -- it runs
 * standalone in CI, before any `nuxi prepare`.
 */
async function componentMountNames(): Promise<Set<string>> {
  const names = new Set<string>()
  const walk = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true })
    for (const entry of entries) {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) await walk(path)
      else if (entry.isFile() && entry.name.endsWith('.vue')) {
        names.add(entry.name.slice(0, -'.vue'.length))
      }
    }
  }
  await walk(componentsDirectory)
  return names
}

/*
 * Mount names used by a content file's MDC body.
 *
 * Same block shape verifyLayoutContract.ts already counts for its one-mdc rule
 * (a line that is nothing but `:name` or `::name`), lifted here so the two
 * scripts agree on what a mount is. That script knows which components a page
 * mounts; it just never checked they exist.
 */
function mdcMounts(source: string): string[] {
  const body = source.replace(/^---[\s\S]*?\n---\n/, '')
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^:{1,2}[a-z][a-z0-9-]*$/.test(line))
    .map((line) => line.replace(/^:{1,2}/, ''))
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
    dashboardKey: frontMatter.dashboardKey ?? '',
    dashboardTab: frontMatter.dashboardTab ?? '',
    cardsKey: frontMatter.cards ?? '',
  }
}

function addError(errors: string[], document: NavigationDocument, message: string): void {
  errors.push(`${document.file}: ${message}`)
}

function validateAccess(errors: string[], document: NavigationDocument): void {
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

function validateChannelDocument(errors: string[], document: NavigationDocument): void {
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

function validatePageDocument(errors: string[], document: NavigationDocument): void {
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
  const channelsByKey = new Map(channels.map((channel) => [channel.channelKey, channel]))
  const tabsByLocation = new Map<string, NavigationDocument>()
  const tabsByChannelRoute = new Map<string, NavigationDocument[]>()

  for (const document of documents) validateChannelDocument(errors, document)

  for (const channel of channels) {
    if (!channel.defaultTab) addError(errors, channel, 'missing defaultTab')
    if (!channel.route.startsWith('/')) addError(errors, channel, 'route must start with /')
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
    if (duplicate) errors.push(`${tab.file}: duplicates ${location} from ${duplicate.file}`)
    else tabsByLocation.set(location, tab)

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
    if (!tabsByLocation.has(location)) errors.push(`${slug}: unknown placement tab ${location}`)
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
    if (!tabsByLocation.has(location)) addError(errors, page, `references unknown tab ${location}`)
  }

  /*
   * A mount that resolves to no component renders a BLANK page, and until now
   * nothing checked it: this script and verifyNavManifest.ts both read only
   * frontmatter. That is how /navigation-health and /project-placement -- two
   * live admin tabs -- shipped mounting `:navigation-navigation-health` and
   * `:projects-project-placement-manager`, neither of which exists.
   */
  const knownComponents = await componentMountNames()
  let checkedMounts = 0
  for (const file of pageFiles) {
    const mounts = mdcMounts(await readFile(file, 'utf8'))
    for (const mount of mounts) {
      checkedMounts += 1
      if (knownComponents.has(mount)) continue
      const nearest = [...knownComponents].find(
        (name) => mount.endsWith(name) || name.endsWith(mount),
      )
      errors.push(
        `${relative(repositoryRoot, file)}: mounts :${mount}, which is not a component` +
          (nearest
            ? ` (components are registered with pathPrefix:false, so the mount is the bare filename — did you mean :${nearest}?)`
            : ''),
      )
    }
  }

  const manifestEntries: NavManifestEntry[] = tabs.map((tab) => ({
    file: tab.file,
    channelKey: tab.channelKey,
    tabKey: tab.tabKey,
    dashboardKey: tab.dashboardKey,
    dashboardTab: tab.dashboardTab,
    cardsKey: tab.cardsKey,
    route: tab.route,
  }))
  const manifestIssues = validateNavManifest(manifestEntries)
  const manifestWarnings = manifestIssues.filter((issue) => issue.severity === 'warning')
  const manifestErrors = manifestIssues.filter((issue) => issue.severity === 'error')

  for (const warning of manifestWarnings) {
    console.warn(
      `- ${warning.file} (${warning.channelKey}/${warning.tabKey}): ${warning.message}`,
    )
  }
  if (manifestWarnings.length) {
    console.warn(
      `Channel content contract: ${manifestWarnings.length} nav manifest warning(s) reported above (tracked by interface-vision/t-034, not yet CI-blocking).`,
    )
  }
  for (const error of manifestErrors) {
    errors.push(
      `${error.file} (${error.channelKey}/${error.tabKey}): ${error.message}`,
    )
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
    `Channel content contract passed: ${channels.length} channels, ${tabs.length} tabs, ${placedPages} placed pages, ${Object.keys(PROJECT_PLACEMENTS).length} project placements, ${sharedRouteGroups.length} shared-route groups, ${allowedRoles.size} roles, ${allowedPermissions.size} capabilities, ${checkedMounts} MDC mounts resolved, ${manifestWarnings.length} nav manifest warnings, and 0 nav manifest errors.`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
