/**
 * Every `kind-icon:<name>` the runtime code asks for must exist in assets/icons/.
 *
 * A missing custom icon fails at RUNTIME, in the browser console, as
 * `[Icon] failed to load icon 'kind-icon:news'` -- and nowhere else. It does
 * not break the build, does not fail typecheck, and leaves a blank space
 * rather than an error, so it survives review indefinitely. Alexandria's
 * container-log triage surfaced `kind-icon:news` firing 739 times in a single
 * day (2026-09-04) against a collection that has never contained news.svg.
 *
 * That one is fixed. This finds the rest, and finds the next one before a log
 * digest has to.
 *
 * Channel content is scanned too. A tab's `icon:` frontmatter is drawn in the
 * Explore menu, and content/channels/zuzu/zuzu-pinball.md asked for a
 * `kind-icon:gamepad` that never existed, so the Pinball tab showed no icon
 * at all (found 2026-10-14). The same pass fails when two tabs of one channel
 * share an icon: Silas, 2026-10-14, "we need unique icons for each tab", after
 * Showdown, Ghost Trail and Zuzu's Lair all drew the same crossed swords.
 *
 * Usage:
 *   npm run audit:icons              # report missing icons, exit 1 if any
 *   npm run audit:icons -- --json      # machine-readable
 *   npm run test:icons-selftest        # prove the scan logic on fixtures
 *
 * The scan is deliberately literal: it matches `kind-icon:<name>` where the
 * name is a static string. An icon assembled at runtime (`kind-icon:${x}`)
 * cannot be checked this way and is not reported -- a false negative is a
 * missed warning, a false positive is a broken build, and only one of those
 * is worth risking.
 */
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const iconsDirectory = resolve(repositoryRoot, 'assets/icons')
const contentDirectory = resolve(repositoryRoot, 'content')
const channelsDirectory = resolve(contentDirectory, 'channels')

const asJson = process.argv.includes('--json')
const selfTest = process.argv.includes('--self-test')

const SCANNED_EXTENSIONS = new Set(['.vue', '.ts', '.js', '.mjs', '.tsx'])
const SKIPPED_DIRECTORIES = new Set([
  '.git',
  '.nuxt',
  '.output',
  'node_modules',
  'dist',
  'coverage',
  'abandonware',
  // Operational/test scripts contain literal icon strings as fixtures and
  // assertions. They are not bundled runtime consumers and should not force
  // decorative SVGs into the app collection.
  'scripts',
  // Cypress bodies POST arbitrary icon strings as fixture data
  // (`icon: 'kind-icon:array'`). Those are payloads under test, not icons
  // anyone wants drawn, and reporting them asks for SVGs nobody should add.
  'cypress',
])

/** `kind-icon:` followed by a literal name -- never an interpolation. */
const ICON_REFERENCE = /kind-icon:([a-zA-Z0-9_-]+)/g

export type IconReference = { name: string; location: string }

export function findIconReferences(
  source: string,
  location: string,
): IconReference[] {
  const found: IconReference[] = []
  for (const match of source.matchAll(ICON_REFERENCE)) {
    if (match[1]) found.push({ name: match[1], location })
  }
  return found
}

/** The `key: value` lines of a Markdown file's leading frontmatter block. */
export function frontmatterFields(source: string): Record<string, string> {
  const fields: Record<string, string> = {}
  const lines = source.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return fields
  for (const line of lines.slice(1)) {
    if (line.trim() === '---') break
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line)
    if (match?.[1]) {
      fields[match[1]] = (match[2] ?? '').trim().replace(/^['"]|['"]$/g, '')
    }
  }
  return fields
}

export type TabIcon = { channel: string; icon: string; location: string }

/** Icons drawn by more than one tab of one list (a channel, or a parent tab's subtabs), with every tab that draws them. */
export function duplicateTabIcons(tabs: TabIcon[]): Map<string, string[]> {
  const byKey = new Map<string, string[]>()
  for (const tab of tabs) {
    const key = `${tab.channel} ${tab.icon}`
    byKey.set(key, [...(byKey.get(key) ?? []), tab.location])
  }
  return new Map([...byKey].filter(([, locations]) => locations.length > 1))
}

export function missingIcons(
  references: IconReference[],
  available: Set<string>,
): Map<string, string[]> {
  const missing = new Map<string, string[]>()
  for (const reference of references) {
    if (available.has(reference.name)) continue
    const locations = missing.get(reference.name) ?? []
    if (!locations.includes(reference.location)) {
      locations.push(reference.location)
    }
    missing.set(reference.name, locations)
  }
  return missing
}

/* self-test -- the scan logic, provable without touching the repository tree */
if (selfTest) {
  const failures: string[] = []
  const expect = (label: string, actual: unknown, wanted: unknown) => {
    const a = JSON.stringify(actual)
    const w = JSON.stringify(wanted)
    if (a !== w) failures.push(`${label}: got ${a}, wanted ${w}`)
  }

  expect(
    'finds a plain reference',
    findIconReferences('<icon name="kind-icon:news" />', 'a.vue').map(
      (r) => r.name,
    ),
    ['news'],
  )
  expect(
    'finds several on one line',
    findIconReferences(
      `icon: definition?.icon || 'kind-icon:news', fallback: 'kind-icon:scroll'`,
      'b.ts',
    ).map((r) => r.name),
    ['news', 'scroll'],
  )
  expect(
    'keeps hyphens and digits, stops at the quote',
    findIconReferences('"kind-icon:arrow-left" "kind-icon:h2"', 'c.vue').map(
      (r) => r.name,
    ),
    ['arrow-left', 'h2'],
  )
  expect(
    'reports only what is absent',
    [
      ...missingIcons(
        [
          { name: 'news', location: 'a.vue' },
          { name: 'scroll', location: 'b.vue' },
        ],
        new Set(['scroll']),
      ).keys(),
    ],
    ['news'],
  )
  expect(
    'collects every site of one missing icon',
    missingIcons(
      [
        { name: 'news', location: 'a.vue' },
        { name: 'news', location: 'b.vue' },
        { name: 'news', location: 'a.vue' },
      ],
      new Set(),
    ).get('news'),
    ['a.vue', 'b.vue'],
  )
  // An interpolated name is unknowable statically, so it must not be claimed
  // as missing -- that would make the audit unusable the first time someone
  // builds an icon name from a variable.
  expect(
    'ignores an interpolated name',
    findIconReferences('name={`kind-icon:${slug}`}', 'd.vue').map(
      (r) => r.name,
    ),
    [],
  )

  expect(
    'reads tab frontmatter and stops at its close',
    frontmatterFields(
      "---\ncontentType: tab\nicon: 'kind-icon:ghost'\n---\nicon: kind-icon:body",
    ),
    { contentType: 'tab', icon: 'kind-icon:ghost' },
  )
  expect(
    'flags two tabs of one channel sharing an icon',
    [
      ...duplicateTabIcons([
        { channel: 'zuzu', icon: 'kind-icon:swords', location: 'a.md' },
        { channel: 'zuzu', icon: 'kind-icon:swords', location: 'b.md' },
        { channel: 'zuzu', icon: 'kind-icon:ghost', location: 'c.md' },
      ]),
    ],
    [['zuzu kind-icon:swords', ['a.md', 'b.md']]],
  )
  expect(
    'lets different channels reuse an icon',
    duplicateTabIcons([
      { channel: 'zuzu', icon: 'kind-icon:map', location: 'a.md' },
      { channel: 'admin', icon: 'kind-icon:map', location: 'b.md' },
    ]).size,
    0,
  )

  if (failures.length) {
    console.error('❌ Icon audit self-test FAILED:')
    for (const failure of failures) console.error(`   ${failure}`)
    process.exit(1)
  }
  console.log('✅ Icon audit self-test passed (9 checks).')
  process.exit(0)
}

async function collectSourceFiles(
  directory: string,
  extensions: Set<string> = SCANNED_EXTENSIONS,
): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name) || entry.name.startsWith('.')) {
        continue
      }
      files.push(...(await collectSourceFiles(full, extensions)))
      continue
    }
    const dot = entry.name.lastIndexOf('.')
    if (dot > 0 && extensions.has(entry.name.slice(dot))) {
      files.push(full)
    }
  }
  return files
}

async function main() {
  const iconFiles = await readdir(iconsDirectory)
  const available = new Set(
    iconFiles
      .filter((name) => name.endsWith('.svg'))
      .map((name) => name.slice(0, -4)),
  )

  const references: IconReference[] = []
  for (const file of await collectSourceFiles(repositoryRoot)) {
    references.push(
      ...findIconReferences(
        await readFile(file, 'utf8'),
        relative(repositoryRoot, file),
      ),
    )
  }

  const tabs: TabIcon[] = []
  for (const file of await collectSourceFiles(
    contentDirectory,
    new Set(['.md']),
  )) {
    const source = await readFile(file, 'utf8')
    const location = relative(repositoryRoot, file)
    references.push(...findIconReferences(source, location))
    if (!file.startsWith(channelsDirectory)) continue
    const fields = frontmatterFields(source)
    if (fields.contentType === 'tab' && fields.channelKey && fields.icon) {
      const list = fields.parentTabKey
        ? `${fields.channelKey}/${fields.parentTabKey}`
        : fields.channelKey
      tabs.push({ channel: list, icon: fields.icon, location })
    }
  }

  const missing = missingIcons(references, available)
  const duplicates = duplicateTabIcons(tabs)
  const distinct = new Set(references.map((r) => r.name))

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          available: available.size,
          referenced: distinct.size,
          missing: [...missing].map(([name, locations]) => ({
            name,
            locations,
          })),
          duplicateTabIcons: [...duplicates].map(([key, locations]) => ({
            key,
            locations,
          })),
        },
        null,
        2,
      ),
    )
    process.exit(missing.size || duplicates.size ? 1 : 0)
  }

  console.log(
    `Scanned ${references.length} kind-icon reference(s): ` +
      `${distinct.size} distinct, ${available.size} icons on disk.`,
  )

  if (duplicates.size) {
    console.error(
      `\n❌ ${duplicates.size} icon(s) drawn by more than one tab of a channel:\n`,
    )
    for (const [key, locations] of duplicates) {
      console.error(`  ${key}`)
      for (const location of locations) console.error(`      ${location}`)
    }
    console.error(
      '\nThe Explore menu tells tabs apart by icon; give each tab its own.',
    )
  }

  if (!missing.size) {
    if (duplicates.size) process.exit(1)
    console.log(
      '✅ Every referenced icon exists, and no channel repeats a tab icon.',
    )
    process.exit(0)
  }

  console.error(`\n❌ ${missing.size} referenced icon(s) do not exist:\n`)
  for (const [name, locations] of [...missing].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    console.error(`  kind-icon:${name}`)
    for (const location of locations.slice(0, 4)) {
      console.error(`      ${location}`)
    }
    if (locations.length > 4) {
      console.error(`      ...and ${locations.length - 4} more`)
    }
  }
  console.error(
    '\nEach of these fails silently in the browser and renders nothing.\n' +
      `Add the missing SVG to assets/icons/, or point the reference at an\n` +
      'icon that exists. Prefer fill="currentColor" so the icon inherits\n' +
      'text colour classes the way scroll.svg and book.svg do.',
  )
  process.exit(1)
}

main().catch((error) => {
  console.error('Icon audit could not run:', error)
  process.exit(1)
})
