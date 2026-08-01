// /utils/scripts/verifyNavManifest.ts
//
// Contract test for utils/navManifest.ts: loads every content/channels tab's
// frontmatter and validates its dashboardKey/dashboardTab/cards references
// against the real dashboardConfigs and modelCards.ts vocabularies. This is
// the "every manifest route resolves and every content page's
// channelKey/dashboardKey pair is consistent" CI guard from
// interface-vision/t-012 -- catching the class of bug where a dashboardKey
// silently falls back to a default instead of failing loudly (e.g.
// dashboardKey: 'admin', a valid channelKey but not a valid dashboardKey).
import { readdir, readFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateNavManifest, type NavManifestEntry } from '@/utils/navManifest'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const channelsDirectory = resolve(repositoryRoot, 'content/channels')

function cleanValue(value: string): string {
  const trimmed = value.trim()
  const quote = trimmed[0]
  return (quote === "'" || quote === '"') && trimmed.endsWith(quote)
    ? trimmed.slice(1, -1)
    : trimmed
}

function parseFrontMatter(source: string): Record<string, string> {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match?.[1]) return {}

  const result: Record<string, string> = {}
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

async function loadNavManifestEntries(): Promise<NavManifestEntry[]> {
  const files = await markdownFiles(channelsDirectory)
  const entries: NavManifestEntry[] = []
  for (const file of files) {
    const frontMatter = parseFrontMatter(await readFile(file, 'utf8'))
    if (frontMatter.contentType !== 'tab') continue
    entries.push({
      file: relative(repositoryRoot, file),
      channelKey: frontMatter.channelKey ?? '',
      tabKey: frontMatter.tabKey ?? '',
      dashboardKey: frontMatter.dashboardKey ?? '',
      dashboardTab: frontMatter.dashboardTab ?? '',
      cardsKey: frontMatter.cards ?? '',
      route: frontMatter.route ?? '',
    })
  }
  return entries
}

async function main(): Promise<void> {
  const entries = await loadNavManifestEntries()
  const issues = validateNavManifest(entries)
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  for (const warning of warnings) {
    console.warn(
      `- ${warning.file} (${warning.channelKey}/${warning.tabKey}): ${warning.message}`,
    )
  }
  if (warnings.length) {
    console.warn(
      `Nav manifest contract: ${warnings.length} warning(s) reported above (tracked by interface-vision/t-034, not yet CI-blocking).`,
    )
  }

  if (errors.length) {
    console.error(
      `Nav manifest contract failed with ${errors.length} error(s):`,
    )
    for (const error of errors) {
      console.error(
        `- ${error.file} (${error.channelKey}/${error.tabKey}): ${error.message}`,
      )
    }
    process.exitCode = 1
    return
  }

  console.log(
    `Nav manifest contract passed: ${entries.length} tab(s) checked, ${warnings.length} warning(s), 0 errors.`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
