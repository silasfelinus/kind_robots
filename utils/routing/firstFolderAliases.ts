// /utils/routing/firstFolderAliases.ts
//
// Every public project answers at its first-folder URL (Silas, 2026-11-14):
// kindrobots.org/arcade reaches the Arcade even though its tab lives at
// /play/arcade. Aliases are derived from the channel tab routes at build time,
// so a new Play tab gets its short URL without another hand-written rule.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export type FirstFolderAliasRules = Record<
  string,
  { redirect: { to: string; statusCode: 302 } }
>

const ALIASED_PARENTS = ['/play/']

export function readChannelTabRoutes(channelsDir: string): string[] {
  const routes: string[] = []
  for (const channel of readdirSync(channelsDir, { withFileTypes: true })) {
    if (!channel.isDirectory()) continue
    const dir = join(channelsDir, channel.name)
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.md')) continue
      const match = readFileSync(join(dir, file), 'utf8').match(
        /^route:\s*['"]?([^'"\s]+)['"]?\s*$/m,
      )
      if (match?.[1]) routes.push(match[1])
    }
  }
  return [...new Set(routes)].sort()
}

export function readRootPageFolders(pagesDir: string): string[] {
  return readdirSync(pagesDir)
    .map((entry) => entry.replace(/\.vue$/, ''))
    .filter((entry) => !entry.startsWith('['))
    .map((entry) => `/${entry}`)
}

export function firstFolderOf(route: string): string | null {
  const parent = ALIASED_PARENTS.find((prefix) => route.startsWith(prefix))
  if (!parent) return null
  const folder = route.slice(parent.length).split('/')[0]
  return folder ? `/${folder}` : null
}

export function buildFirstFolderAliases(
  routes: string[],
  taken: Iterable<string>,
): FirstFolderAliasRules {
  const occupied = new Set([...taken, ...routes])
  const rules: FirstFolderAliasRules = {}
  for (const route of [...routes].sort()) {
    const alias = firstFolderOf(route)
    if (!alias || occupied.has(alias) || rules[alias]) continue
    rules[alias] = { redirect: { to: route, statusCode: 302 } }
  }
  return rules
}

export function loadFirstFolderAliases(
  rootDir: string,
  explicitRules: Record<string, unknown> = {},
): FirstFolderAliasRules {
  return buildFirstFolderAliases(
    readChannelTabRoutes(join(rootDir, 'content/channels')),
    [
      ...readRootPageFolders(join(rootDir, 'pages')),
      ...Object.keys(explicitRules),
    ],
  )
}
