import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import {
  TIERS,
  TIER_BUDGETS,
  allArt,
  auditPlaybookKit,
  countDimensions,
  fitsTier,
  type BudgetDimension,
} from '../playbookKit/budget'
import { KIT_PLAYBOOKS } from '../playbookKit/games'
import { LANTERN_FERRY } from '../playbookKit/games/lanternFerry'
import {
  ENTRY_MARKER,
  IMPORT_MARKER,
  pageSource,
  registerSource,
  specSource,
  starterSpec,
  tabSource,
} from '../playbookKit/scaffold'
import {
  DEFAULT_KIT_SETTINGS,
  decodeKitSave,
  emptyKitProgress,
  parseKitSettings,
  trailerDue,
} from '../playbookKit/settings'
import type { PlaybookKitSpec } from '../playbookKit/types'
import { visibleMoments } from '../playbookKit/view'

const fromRoot = (path: string) => new URL('../../' + path, import.meta.url)
const clone = (): PlaybookKitSpec => structuredClone(LANTERN_FERRY)
const codes = (spec: PlaybookKitSpec, level = 'error') =>
  auditPlaybookKit(spec)
    .issues.filter((i) => i.level === level)
    .map((i) => i.code)

// Every registered playbook is within budget and internally consistent.
assert.ok(KIT_PLAYBOOKS.length >= 1)
assert.equal(new Set(KIT_PLAYBOOKS.map((s) => s.id)).size, KIT_PLAYBOOKS.length)
for (const spec of KIT_PLAYBOOKS) {
  const report = auditPlaybookKit(spec)
  assert.ok(
    report.ok,
    `${spec.id} breaks the kit contract:\n${report.issues
      .filter((i) => i.level === 'error')
      .map((i) => `  - ${i.message}`)
      .join('\n')}`,
  )
}

// Tiers grow monotonically, and every minimum sits under its maximum.
const dims = Object.keys(TIER_BUDGETS.vignette) as BudgetDimension[]
for (const tier of TIERS)
  for (const d of dims)
    assert.ok(
      TIER_BUDGETS[tier][d].min <= TIER_BUDGETS[tier][d].max,
      `${tier}.${d}`,
    )
for (const d of dims) {
  assert.ok(TIER_BUDGETS.vignette[d].max <= TIER_BUDGETS.standard[d].max, d)
  assert.ok(TIER_BUDGETS.standard[d].max <= TIER_BUDGETS.saga[d].max, d)
}

// The reference playbook is a complete Vignette with only rendered art to go.
const reference = auditPlaybookKit(LANTERN_FERRY)
assert.equal(reference.issues.length, 0, JSON.stringify(reference.issues))
assert.equal(fitsTier(LANTERN_FERRY), 'vignette')
assert.equal(reference.next?.id, 'art')
assert.equal(countDimensions(LANTERN_FERRY).threads, 4)

// Over a cap is an error; a written allowance turns it into a visible stretch.
{
  const spec = clone()
  spec.meters.push({ id: 'luck', label: 'Luck', min: 0, max: 3, start: 1 })
  assert.ok(codes(spec).includes('over-budget'))
  spec.allowances = [
    {
      dimension: 'meters',
      max: 4,
      reason: 'Luck is the whole joke of act two.',
    },
  ]
  assert.ok(
    codes(spec).includes('over-budget'),
    'attention is still over: allowances are per dimension',
  )
  spec.allowances.push({
    dimension: 'attention',
    max: 4,
    reason: 'Luck is the whole joke of act two.',
  })
  const report = auditPlaybookKit(spec)
  assert.ok(report.ok, JSON.stringify(report.issues))
  assert.equal(report.counts.meters.status, 'stretched')
  spec.allowances = [{ dimension: 'meters', max: 4, reason: 'because' }]
  assert.ok(codes(spec).includes('bad-allowance'))
  spec.allowances = [
    {
      dimension: 'sidequests',
      max: 4,
      reason: 'An allowance for something unknown.',
    },
  ]
  assert.ok(codes(spec).includes('bad-allowance'))
}

// Integrity: references, villains, romance, trailer spoilers, art briefs.
{
  const spec = clone()
  spec.endings[0]!.about.push('nobody')
  assert.ok(codes(spec).includes('dangling-ref'))
}
{
  const spec = clone()
  spec.moments.push({ ...spec.moments[0]!, title: 'Again' })
  assert.ok(codes(spec).includes('duplicate-id'))
}
{
  const spec = clone()
  spec.cast.find((c) => c.id === 'heron')!.role = 'villain'
  spec.cast.find((c) => c.id === 'heron')!.primary = true
  assert.ok(codes(spec).includes('primary-villain'))
}
{
  const spec = clone()
  spec.cast.find((c) => c.id === 'juno')!.romance!.moments = ['cast-off']
  assert.ok(codes(spec).includes('romance-moments'))
}
{
  const spec = clone()
  spec.trailer.beats.push({ moment: 'keystone-crack', line: 'Spoiler.' })
  assert.ok(codes(spec).includes('trailer-spoiler'))
}
{
  const spec = clone()
  spec.cast[0]!.portrait.brief = '  '
  assert.ok(codes(spec).includes('art-brief'))
}
{
  const spec = clone()
  spec.endings = spec.endings.map((e) => ({
    ...e,
    about: e.about.filter((id) => id !== 'weir'),
  }))
  assert.ok(codes(spec, 'warn').includes('flat-villain'))
  spec.endings = spec.endings.map((e) => ({ ...e, tone: 'dark' }))
  assert.ok(codes(spec, 'warn').includes('one-note-endings'))
}
{
  const spec = clone()
  spec.tier = 'standard'
  const report = auditPlaybookKit(spec)
  assert.ok(report.ok)
  assert.ok(report.issues.some((i) => i.code === 'smaller-tier'))
  assert.equal(report.counts.factions.status, 'ok')
  assert.equal(report.counts.moments.status, 'under')
  assert.equal(report.next?.id, 'endings')
}

// A freshly scaffolded playbook is green: under-built, never over budget.
for (const tier of TIERS) {
  const spec = starterSpec('moon-laundry', 'Moon Laundry', tier)
  const report = auditPlaybookKit(spec)
  assert.ok(report.ok, `${tier} starter: ${JSON.stringify(report.issues)}`)
  assert.equal(report.next?.id, tier === 'vignette' ? 'endings' : 'cast')
}
{
  const spec = starterSpec('moon-laundry', "Moon Laundry: Bob's 'Night'")
  const source = specSource(spec)
  assert.match(source, /export const MOON_LAUNDRY: PlaybookKitSpec = \{/)
  assert.match(source, /title: 'Moon Laundry: Bob\\'s \\'Night\\'',/)
  const index = readFileSync(
    fromRoot('utils/playbookKit/games/index.ts'),
    'utf8',
  )
  assert.ok(index.includes(IMPORT_MARKER) && index.includes(ENTRY_MARKER))
  const registered = registerSource(index, 'moon-laundry')
  assert.match(registered, /import \{ MOON_LAUNDRY \} from '\.\/moonLaundry'/)
  assert.match(registered, / {2}MOON_LAUNDRY,\n {2}\/\/ playbook:new entries/)
  assert.equal(registerSource(registered, 'moon-laundry'), registered)
  const page = pageSource(spec)
  assert.match(page, /data-layout="console-fixed"/)
  assert.match(page, /class="kr-surface h-full min-h-0 overflow-hidden/)
  const tab = tabSource(spec, 'kind-icon:theater', 80)
  assert.match(tab, /^requiredRole: ADMIN$/m)
  assert.match(tab, /^label: "Moon Laundry: Bob's 'Night'"$/m)
  const summary = tab.match(/^summary: "(.*)"$/m)?.[1] ?? ''
  assert.ok(
    summary && summary.length <= 40,
    'nav summaries stay at 40 characters or fewer',
  )
}

// Settings and saved progress.
assert.deepEqual(parseKitSettings({ textSize: 'huge', font: 'sans' }), {
  ...DEFAULT_KIT_SETTINGS,
  font: 'sans',
})
assert.deepEqual(decodeKitSave(null)?.settings, DEFAULT_KIT_SETTINGS)
assert.equal(
  decodeKitSave('{not json'),
  null,
  'unreadable saves are held, never reset',
)
assert.equal(decodeKitSave('{"version":2}'), null)
const saved = decodeKitSave(
  JSON.stringify({
    version: 1,
    settings: { romance: 'off' },
    progress: {
      moments: { 'cast-off': '2026-10-26T00:00:00Z', bad: 3 },
      trailerSeen: true,
    },
  }),
)!
assert.equal(saved.settings.romance, 'off')
assert.deepEqual(saved.progress.moments, { 'cast-off': '2026-10-26T00:00:00Z' })
assert.equal(trailerDue(DEFAULT_KIT_SETTINGS, emptyKitProgress()), true)
assert.equal(trailerDue(DEFAULT_KIT_SETTINGS, saved.progress), false)
assert.equal(
  trailerDue({ ...DEFAULT_KIT_SETTINGS, trailer: 'always' }, saved.progress),
  true,
)
assert.equal(
  trailerDue({ ...DEFAULT_KIT_SETTINGS, trailer: 'never' }, emptyKitProgress()),
  false,
)
assert.ok(
  !visibleMoments(LANTERN_FERRY, saved.settings).some(
    (m) => m.kind === 'romance',
  ),
)
assert.equal(
  visibleMoments(LANTERN_FERRY, DEFAULT_KIT_SETTINGS).length,
  LANTERN_FERRY.moments.length,
)

// The console, its tab and the shared shell stay wired together.
assert.ok(existsSync(fromRoot('pages/admin/playbook-kit.vue')))
const tabText = readFileSync(
  fromRoot('content/channels/admin/playbook-kit.md'),
  'utf8',
)
assert.match(tabText, /^route: \/admin\/playbook-kit$/m)
assert.match(tabText, /^requiredRole: ADMIN$/m)
const shell = readFileSync(
  fromRoot('components/playbook-kit/playbook-kit-shell.vue'),
  'utf8',
)
for (const pane of [
  'Cast',
  'Factions',
  'Secrets',
  'Scrapbook',
  'Endings',
  'Settings',
])
  assert.ok(shell.includes(`label: '${pane}'`), pane)
assert.ok(
  !/localStorage|\$fetch/.test(shell),
  'components never touch storage or the API',
)

// One console design system: the forge and the kit share playbook-console.css,
// imported from tailwind.css so Tailwind declares the layer order first. A
// component chunk that declares @layer can load before tailwind.css and put
// `components` ahead of `base`, letting the preflight reset beat every
// component style on the page; no playbook component may do that.
const tailwind = readFileSync(fromRoot('assets/css/tailwind.css'), 'utf8')
assert.match(
  tailwind,
  /@import 'tailwindcss';\n@import '\.\/playbook-console\.css';/,
)
for (const dir of ['components/playbook-kit', 'components/playbook-forge'])
  for (const file of readdirSync(fromRoot(dir)))
    assert.ok(
      !/@layer/.test(readFileSync(fromRoot(`${dir}/${file}`), 'utf8')),
      `${dir}/${file} declares a CSS layer`,
    )
assert.match(shell, /class="pf-console pk-shell/)
assert.match(
  shell,
  /<header-page-bar :console-theme="spec\.theme \?\? 'forge'">[\s\S]*?aria-label="Playbook panes"[\s\S]*?<\/header-page-bar>/,
  'the kit header rides the shared console system bar in the kit theme',
)

// The reference Vignette carries a literal Krea 2 prompt for every picture,
// faction emblems included (conductor playbook-kit t-029); the Playbook Forge
// verifier holds its unpainted beats, this holds the rest.
assert.ok(LANTERN_FERRY.artPromptsComplete)
for (const art of allArt(LANTERN_FERRY)) {
  assert.ok(art.prompt?.trim(), `${art.brief}: has a prompt`)
  assert.deepEqual(
    checkArtPromptContract({ prompt: art.prompt!, engine: 'krea2' }),
    [],
    `${art.brief}: prompt passes the enqueue contract`,
  )
}

console.log(
  `Playbook Kit: ${KIT_PLAYBOOKS.length} playbook(s) within budget; scaffold, settings and saves verified.`,
)
