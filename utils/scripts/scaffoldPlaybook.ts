/**
 * Start a new playbook on the Playbook Kit.
 *
 *   npm run playbook:new -- <slug> "<Title>" [--tier vignette|standard|saga]
 *
 * Writes the spec (utils/playbookKit/games/<camel>.ts), registers it in
 * utils/playbookKit/games/index.ts, and adds an admin development preview
 * (pages/admin/<slug>.vue + content/channels/admin/<slug>.md). Refuses to
 * overwrite anything. The Conductor side is `python scripts/new_playbook.py`
 * in the conductor repo; recipe in docs/playbook-kit/README.md.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import {
  TAB_ICON_CANDIDATES,
  camelCase,
  pageSource,
  registerSource,
  specSource,
  starterSpec,
  tabSource,
} from '../playbookKit/scaffold'
import { TIERS } from '../playbookKit/budget'
import type { PlaybookTier } from '../playbookKit/types'

const ROOT = process.cwd()
const args = process.argv.slice(2)
const tierAt = args.indexOf('--tier')
const tier = (tierAt >= 0 ? args[tierAt + 1] : 'vignette') as PlaybookTier
const [id, title] = args.filter(
  (_, i) => tierAt < 0 || (i !== tierAt && i !== tierAt + 1),
)

function fail(message: string): never {
  console.error(`playbook:new: ${message}`)
  process.exit(1)
}

if (!id || !title)
  fail('usage: npm run playbook:new -- <slug> "<Title>" [--tier vignette]')
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
  fail(`"${id}" is not a kebab-case slug`)
if (!TIERS.includes(tier)) fail(`tier must be one of ${TIERS.join(', ')}`)

const spec = starterSpec(id, title, tier)
const paths = {
  spec: join(ROOT, 'utils/playbookKit/games', `${camelCase(id)}.ts`),
  index: join(ROOT, 'utils/playbookKit/games/index.ts'),
  page: join(ROOT, 'pages/admin', `${id}.vue`),
  tab: join(ROOT, 'content/channels/admin', `${id}.md`),
}
for (const key of ['spec', 'page', 'tab'] as const)
  if (existsSync(paths[key])) fail(`${paths[key]} already exists`)

const adminDir = join(ROOT, 'content/channels/admin')
const tabs = readdirSync(adminDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => readFileSync(join(adminDir, file), 'utf8'))
const usedIcons = new Set(
  tabs.flatMap((text) => text.match(/^icon:\s*(\S+)/m)?.[1] ?? []),
)
const icon = TAB_ICON_CANDIDATES.find((candidate) => !usedIcons.has(candidate))
if (!icon)
  fail('every candidate tab icon is taken; add one to TAB_ICON_CANDIDATES')
const sorts = tabs
  .flatMap((text) => Number(text.match(/^sort:\s*(\d+)/m)?.[1] ?? NaN))
  .filter((n) => n < 9000)

writeFileSync(paths.spec, specSource(spec))
writeFileSync(
  paths.index,
  registerSource(readFileSync(paths.index, 'utf8'), id),
)
writeFileSync(paths.page, pageSource(spec))
writeFileSync(paths.tab, tabSource(spec, icon, Math.max(75, ...sorts) + 1))

const written = [paths.spec, paths.index, paths.page, paths.tab]
  .map((path) => relative(ROOT, path))
  .join(' ')
console.log(`Scaffolded ${title} (${tier}): ${written}
Next: npx prettier --write ${written}
      npm run test:playbook-kit
      open /admin/playbook-forge?kit=${id}`)
