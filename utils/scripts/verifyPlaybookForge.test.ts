import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  CHECKPOINT_CLASSES,
  DEFAULT_ASSUMPTIONS,
} from '../playbookForge/calibration'
import {
  forecast,
  heroPortraits,
  smallestTier,
} from '../playbookForge/estimate'
import { EXISTING_PLAYBOOKS, builtBlueprint } from '../playbookForge/existing'
import {
  FACTOR_ROWS,
  FORGE_TABS,
  displayValue,
  rowsFor,
  stepValue,
} from '../playbookForge/factors'
import {
  blueprintBrief,
  blueprintPitch,
  parseBlueprint,
  planDiff,
} from '../playbookForge/handoff'
import {
  GENRES,
  VIGNETTE_DEFAULTS,
  blueprintFromIdea,
} from '../playbookForge/presets'
import type { Blueprint } from '../playbookForge/types'

const fromRoot = (path: string) => new URL('../../' + path, import.meta.url)
const base = (): Blueprint => ({
  ...VIGNETTE_DEFAULTS,
  slug: 'moon-laundry',
  title: 'Moon Laundry',
})
const at = (patch: Partial<Blueprint>) => forecast({ ...base(), ...patch })

// Every factor a blueprint carries is a row the designer can reach, once.
const identity = new Set(['slug', 'title', 'idea', 'genre'])
const rowKeys = FACTOR_ROWS.map((row) => row.key)
assert.equal(new Set(rowKeys).size, rowKeys.length, 'one row per factor')
for (const key of Object.keys(VIGNETTE_DEFAULTS) as (keyof Blueprint)[])
  if (!identity.has(key))
    assert.ok(rowKeys.includes(key), `${key} has no forge row`)
for (const row of FACTOR_ROWS) {
  assert.ok(
    row.key in VIGNETTE_DEFAULTS,
    `${row.key} is not a blueprint factor`,
  )
  assert.ok(
    FORGE_TABS.some((tab) => tab.id === row.tab),
    `${row.key} sits on an unknown tab`,
  )
  assert.ok(
    row.help.length > 20,
    `${row.key} needs help text that explains its cost`,
  )
}
for (const tab of FORGE_TABS)
  assert.ok(rowsFor(tab.id, base()).length > 0, `${tab.id} is empty`)

// Stepping clamps steppers, wraps choices and flips toggles; Auto scope is null.
const endings = FACTOR_ROWS.find((r) => r.key === 'endings')!
assert.equal(stepValue(endings, { ...base(), endings: 1 }, -1), null)
assert.equal(stepValue(endings, base(), 1), base().endings + 1)
const tier = FACTOR_ROWS.find((r) => r.key === 'tier')!
assert.equal(stepValue(tier, base(), 1), 'vignette')
assert.equal(stepValue(tier, { ...base(), tier: 'vignette' }, -1), null)
assert.equal(displayValue(tier, base()), 'Auto')
const autosave = FACTOR_ROWS.find((r) => r.key === 'autosave')!
assert.equal(stepValue(autosave, base(), 1), false)

// The forecast moves the way each factor says it does.
const plain = at({})
assert.equal(smallestTier(base()), 'vignette')
assert.equal(plain.tier, 'vignette')
assert.ok(at({ endings: 8 }).totalImages > plain.totalImages)
assert.ok(at({ endings: 8 }).totalWords > plain.totalWords)
assert.ok(at({ endings: 8 }).qaRuns > plain.qaRuns)
assert.ok(
  Math.abs(at({ artStyles: 2 }).totalImages - plain.totalImages * 2) <= 1,
  'two styles double the art',
)
assert.ok(at({ checkpoint: 'flux2' }).renderSeconds > plain.renderSeconds * 20)
assert.ok(at({ checkpoint: 'distilled' }).renderSeconds < plain.renderSeconds)
assert.ok(at({ failForward: false }).totalWords < plain.totalWords)
assert.ok(
  at({ outcomes: 'five-tier' }).totalWords >
    at({ outcomes: 'pass-fail' }).totalWords,
)
assert.ok(
  at({ outcomeArt: 'both' }).totalImages >
    at({ outcomeArt: 'none' }).totalImages,
)
assert.ok(at({ saveStyle: 'ledger', undo: 'rewind' }).sessions > plain.sessions)
assert.ok(
  !at({ followers: 10 }).overBudget.includes('followers'),
  'auto tier grows to fit',
)
assert.equal(at({ followers: 10 }).tier, 'saga')
assert.ok(
  at({ followers: 20, tier: 'vignette' }).overBudget.includes('followers'),
)
assert.ok(
  at({ unreadable: 'reset' }).notes.some((n) => n.includes('overwrites')),
)

// The character builder's portrait math, and the warning when it explodes.
const prom: Blueprint = {
  ...base(),
  creator: 'builder',
  creatorFactors: 2,
  optionsPerFactor: 7,
  portraits: 'per-combination',
  expressions: 1,
}
assert.equal(heroPortraits(prom).count, 49 * 2)
assert.ok(forecast(prom).notes.some((n) => n.includes('every combination')))
assert.equal(heroPortraits({ ...prom, portraits: 'per-option' }).count, 14)
assert.equal(heroPortraits({ ...prom, portraits: 'on-demand' }).count, 0)
assert.equal(
  heroPortraits({ ...base(), creator: 'roster', rosterSize: 6, expressions: 2 })
    .count,
  18,
)

// Calibration stays honest about what is measured.
for (const lane of CHECKPOINT_CLASSES) {
  assert.ok(lane.secondsPerImage > 0 && lane.evidence.length > 10, lane.id)
}
assert.equal(
  CHECKPOINT_CLASSES.find((c) => c.id === 'distilled')?.measured,
  false,
)
assert.equal(DEFAULT_ASSUMPTIONS.rerollRate, 0.3)

// Genres are starting loadouts that stay inside Saga.
for (const genre of GENRES) {
  const b = blueprintFromIdea(
    'Moon Laundry',
    'A laundromat on the moon.',
    genre.id,
  )
  assert.equal(b.slug, 'moon-laundry')
  assert.ok(smallestTier(b), `${genre.id} starts over every cap`)
  assert.ok(
    existsSync(fromRoot(`public${genre.cover}`)),
    `${genre.id} cover ${genre.cover} is missing`,
  )
}

// The handoff carries the exact blueprint to Conductor and back.
const draft = blueprintFromIdea(
  'Moon Laundry',
  'Socks are portals.',
  'space-comedy',
)
const pitch = blueprintPitch(draft, forecast(draft))
assert.deepEqual(parseBlueprint(pitch), draft)
assert.match(pitch, /new_playbook\.py moon-laundry "Moon Laundry" --blueprint/)
const revised = { ...draft, endings: draft.endings + 4 }
const changes = planDiff(draft, revised)
assert.deepEqual(
  changes.map((c) => c.key),
  ['endings'],
)
assert.deepEqual(
  parseBlueprint(blueprintBrief(revised, forecast(revised), changes)),
  revised,
)
assert.equal(parseBlueprint('no markers here'), null)

// Existing playbooks: every plan is a full blueprint, every cover exists, and
// counting what is built works from code for every one of them.
await Promise.all(
  EXISTING_PLAYBOOKS.map(async (entry) => {
    assert.ok(
      existsSync(fromRoot(`public${entry.cover}`)),
      `${entry.slug} cover is missing`,
    )
    for (const key of Object.keys(VIGNETTE_DEFAULTS))
      assert.ok(key in entry.plan, `${entry.slug} plan lacks ${key}`)
    const counts = await entry.count()
    assert.ok(counts.measured.length > 0, `${entry.slug} measured nothing`)
    for (const key of counts.measured)
      assert.ok(
        key in counts.values,
        `${entry.slug} measured ${key} without a value`,
      )
    const built = forecast(builtBlueprint(entry, counts))
    assert.ok(built.totalImages > 0 && built.totalWords > 0, entry.slug)
  }),
)

// The console, its tab, and the store-only rule for storage and API calls.
const tab = readFileSync(
  fromRoot('content/channels/admin/playbook-forge.md'),
  'utf8',
)
assert.match(tab, /^route: \/admin\/playbook-forge$/m)
assert.match(tab, /^requiredRole: ADMIN$/m)
const page = readFileSync(fromRoot('pages/admin/playbook-forge.vue'), 'utf8')
assert.match(page, /data-theme="forge"/)
for (const name of [
  'console',
  'loadout',
  'hud',
  'launch',
  'idea',
  'library',
  'title',
  'assumptions',
  'prompts',
  'glyph',
]) {
  const source = readFileSync(
    fromRoot(`components/playbook-forge/playbook-forge-${name}.vue`),
    'utf8',
  )
  assert.ok(
    !/localStorage|\$fetch|performFetch/.test(source),
    `${name} reaches past the store`,
  )
}
assert.match(
  readFileSync(fromRoot('assets/css/tailwind.css'), 'utf8'),
  /name: 'forge';/,
)

console.log(
  `Playbook Forge: ${FACTOR_ROWS.length} factors across ${FORGE_TABS.length} pages, ${GENRES.length} genres and ${EXISTING_PLAYBOOKS.length} existing playbooks verified.`,
)
