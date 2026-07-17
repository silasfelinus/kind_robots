// /utils/scripts/verifyDataSurfaceManifest.ts
//
// Contract test for utils/dataSurfaceManifest.ts: every registered data
// surface must either resolve to a real top-level channel/tab, or carry an
// explicit acknowledgedGap pointing at the roadmap task tracking the fix.
// A surface with neither fails CI -- the manifest can only ever record a
// gap, never hide one. See dataSurfaceManifest.ts for the full rationale.
import { readdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DATA_SURFACES } from '@/utils/dataSurfaceManifest'

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

async function loadTabLocations(): Promise<Set<string>> {
  const files = await markdownFiles(channelsDirectory)
  const locations = new Set<string>()
  for (const file of files) {
    const frontMatter = parseFrontMatter(await readFile(file, 'utf8'))
    if (frontMatter.contentType !== 'tab') continue
    if (!frontMatter.channelKey || !frontMatter.tabKey) continue
    locations.add(`${frontMatter.channelKey}/${frontMatter.tabKey}`)
  }
  return locations
}

async function main(): Promise<void> {
  const errors: string[] = []
  const seenIds = new Set<string>()

  for (const surface of DATA_SURFACES) {
    if (!surface.id) {
      errors.push('data surface entry missing id')
      continue
    }
    if (seenIds.has(surface.id)) {
      errors.push(`duplicate data surface id ${surface.id}`)
    }
    seenIds.add(surface.id)

    if (!surface.navEntry && !surface.acknowledgedGap) {
      errors.push(
        `${surface.id}: has no navEntry and no acknowledgedGap -- wire a top-level ` +
          'channel/tab or acknowledge the gap with a tracking task id',
      )
    }
  }

  const tabLocations = await loadTabLocations()
  for (const surface of DATA_SURFACES) {
    if (!surface.navEntry) continue
    const location = `${surface.navEntry.channelKey}/${surface.navEntry.tabKey}`
    if (!tabLocations.has(location)) {
      errors.push(`${surface.id}: navEntry references unknown tab ${location}`)
    }
  }

  if (errors.length) {
    console.error(
      `Data surface manifest contract failed with ${errors.length} error(s):`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  const wired = DATA_SURFACES.filter((surface) => surface.navEntry).length
  const acknowledged = DATA_SURFACES.filter(
    (surface) => surface.acknowledgedGap,
  ).length
  console.log(
    `Data surface manifest contract passed: ${DATA_SURFACES.length} surface(s), ${wired} wired, ${acknowledged} acknowledged gap(s).`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
