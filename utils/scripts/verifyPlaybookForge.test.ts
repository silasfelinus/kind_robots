import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  CHECKPOINT_CLASSES,
  DEFAULT_ASSUMPTIONS,
} from '../playbookForge/calibration'
import {
  forecast,
  openingCombos,
  heroPortraits,
  smallestTier,
  formatDuration,
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
import {
  adjustmentComment,
  applyPlanEdit,
  planChanges,
  readAdjustment,
} from '../playbookForge/adjust'
import {
  buildLedger,
  laneClass,
  nodeArtPrompt,
  nodeShape,
  planGaps,
  projectJobs,
  unitsToPaint,
  unitsToWrite,
  writingBrief,
  type LedgerJob,
} from '../playbookForge/ledger'
import { blankNode, type PlaybookNode } from '../playbook/types'
import { PLAYBOOK_GAMES, buildPlaybook } from '../playbook/games'

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

// The production ledger: every beat's art moves missing → queued → rendered →
// delivered; a section stars only when all of it is delivered and written.
const beat = (
  key: string,
  kind: PlaybookNode['kind'],
  patch: Partial<PlaybookNode> = {},
): PlaybookNode => ({
  ...blankNode(key, kind, `Beat ${key}`),
  place: 'the pier',
  body: ['Fog rolls in. The bell rings.'],
  needsArt: true,
  ...patch,
})
const job = (
  id: number,
  status: LedgerJob['status'],
  renderSeconds: number | null = null,
): LedgerJob => ({ id, status, engine: 'KREA2', renderSeconds, error: null })
const checked = {
  id: 'climb',
  label: 'Climb',
  tags: [],
  check: { skill: 'nerve', target: 3 },
  success: { text: 'You reach the top.' },
  failure: { text: '' },
}
const nodes = {
  a: beat('a', 'encounter', { artUrl: '/a.webp' }),
  b: beat('b', 'encounter'),
  c: beat('c', 'encounter', { choices: [checked] }),
  d: beat('d', 'encounter', { body: [] }),
  e: beat('e', 'encounter'),
  f: beat('f', 'follower', { artUrl: '/f.webp' }),
  g: beat('g', 'ending', { needsArt: false }),
}
const book = { order: Object.keys(nodes), nodes }
const relay = {
  b: [job(1, 'FAILED'), job(2, 'DONE', 80)],
  c: [job(3, 'RUNNING')],
  d: [job(4, 'FAILED')],
}
const ledger = buildLedger(book, relay, {
  laneKey: 'krea2',
  assumptions: DEFAULT_ASSUMPTIONS,
})
const encounters = ledger.sections.find((s) => s.id === 'encounter')!
assert.deepEqual(
  encounters.units.map((u) => u.art),
  ['delivered', 'rendered', 'queued', 'failed', 'missing'],
  'art moves missing → queued → rendered → delivered, and a later DONE beats an earlier FAILED',
)
assert.equal(encounters.takenSeconds, 80, 'only DONE jobs count as spend')
assert.equal(encounters.unwritten, 1)
assert.deepEqual(encounters.outcomes, { written: 1, expected: 2 })
assert.equal(
  encounters.remainingSeconds,
  Math.round(2 * 82 * (1 + DEFAULT_ASSUMPTIONS.rerollRate)),
  'failed and missing beats repaint at the lane median plus rerolls',
)
assert.equal(
  encounters.remainingWords,
  DEFAULT_ASSUMPTIONS.words.encounterBody +
    DEFAULT_ASSUMPTIONS.words.outcomeText,
)
assert.equal(encounters.starred, false)
assert.deepEqual(
  unitsToPaint(encounters).map((u) => u.key),
  ['d', 'e'],
  'queued and rendered art is never re-sent',
)
assert.deepEqual(
  unitsToWrite(encounters).map((u) => u.key),
  ['c', 'd'],
)
const brief = writingBrief('ecotone', 'Ecotone', encounters)
assert.match(brief, /- c "Beat c": 1 outcome text/)
assert.match(brief, /- d "Beat d": scene text/)
assert.ok(ledger.sections.find((s) => s.id === 'follower')!.starred)
assert.ok(ledger.sections.find((s) => s.id === 'ending')!.starred)
assert.equal(ledger.shine, 'star')
assert.ok(ledger.discrepancies.some((d) => /rendered but not wired/.test(d)))
assert.ok(ledger.discrepancies.some((d) => /only ever failed/.test(d)))
assert.equal(ledger.progress, 3 / 7)

const finished = buildLedger(
  {
    order: ['a', 'f', 'g'],
    nodes: { a: nodes.a, f: nodes.f, g: nodes.g },
  },
  {},
  { laneKey: 'arthemy', assumptions: DEFAULT_ASSUMPTIONS },
)
assert.equal(finished.shine, 'super', 'all starred and the plan met')
assert.equal(finished.discrepancies.length, 0)
const shortOfPlan = buildLedger(
  { order: ['a'], nodes: { a: nodes.a } },
  {},
  {
    laneKey: 'arthemy',
    assumptions: DEFAULT_ASSUMPTIONS,
    gaps: [{ label: 'Endings', built: 4, planned: 16 }],
  },
)
assert.equal(shortOfPlan.shine, 'star', 'a plan gap holds back super shiny')
assert.match(shortOfPlan.discrepancies.join(' '), /Endings: 4 built of 16/)
assert.equal(
  buildLedger(
    { order: [], nodes: {} },
    {},
    {
      laneKey: 'krea2',
      assumptions: DEFAULT_ASSUMPTIONS,
    },
  ).shine,
  'none',
  'an empty ledger is never shiny',
)

assert.equal(laneClass('arthemy'), 'illustrious')
assert.equal(laneClass('novacomic'), 'illustrious')
assert.equal(laneClass('flux2'), 'flux2')
assert.equal(
  nodeArtPrompt(beat('p', 'encounter')),
  'Beat p, the pier. Fog rolls in.',
  'the same prompt Playbook Studio offers',
)
assert.equal(nodeShape(beat('p', 'follower')), 'portrait')
assert.equal(nodeShape(beat('p', 'boss')), 'scene')

const rollup = projectJobs('weird-humboldt', [
  { ...job(1, 'DONE', 20), createdAt: '2026-10-01T00:00:00Z' },
  { ...job(2, 'DONE', 40), createdAt: '2026-10-02T00:00:00Z' },
  { ...job(3, 'FAILED'), createdAt: '2026-10-03T00:00:00Z' },
  { ...job(4, 'PENDING'), createdAt: '2026-10-04T00:00:00Z' },
])
assert.equal(rollup.renderSeconds, 60)
assert.equal(rollup.medianSeconds, 30)
assert.deepEqual(rollup.counts, {
  PENDING: 1,
  RUNNING: 0,
  DONE: 2,
  FAILED: 1,
  CANCELLED: 0,
})
assert.deepEqual(rollup.byEngine, [{ engine: 'KREA2', count: 2, seconds: 60 }])
assert.equal(rollup.failures[0]?.error, 'No error recorded.')

const warp = EXISTING_PLAYBOOKS.find((e) => e.slug === 'game-of-captains')!
const warpBuilt = await warp.count()
const gaps = planGaps(warp.plan, warpBuilt)
for (const gap of gaps) assert.ok(gap.built < gap.planned)
assert.ok(
  gaps.every((gap) => FACTOR_ROWS.some((row) => row.label === gap.label)),
)

// Every Playbook Studio game opens as a ledger with each beat counted once.
for (const game of PLAYBOOK_GAMES) {
  const studio = buildPlaybook(game.id)
  const opened = buildLedger(
    studio,
    {},
    {
      laneKey: studio.artLanes[0] ?? 'krea2',
      assumptions: DEFAULT_ASSUMPTIONS,
    },
  )
  assert.equal(
    opened.units,
    studio.order.filter((key) => studio.nodes[key]).length,
    `${game.id}: every beat in the ledger once`,
  )
  assert.ok(
    EXISTING_PLAYBOOKS.some((entry) => entry.studio === game.id),
    `${game.id} has a forge entry to load its ledger from`,
  )
}

assert.deepEqual(
  buildLedger(
    {
      order: ['branch'],
      nodes: {
        branch: beat('branch', 'encounter', {
          artUrl: '/b.webp',
          choices: [{ ...checked, success: undefined, failure: undefined }],
        }),
      },
    },
    {},
    { laneKey: 'krea2', assumptions: DEFAULT_ASSUMPTIONS },
  ).outcomes,
  { written: 0, expected: 0 },
  'a check that branches to other beats expects no outcome text',
)
assert.equal(formatDuration(60 * 3600), '2d 12h', 'days round down')

// Openings fan out into endings: the party adds epilogue lines, the hero
// multiplies the written endings.
{
  const couch = EXISTING_PLAYBOOKS.find((e) => e.slug === 'game-of-captains')!
  const combos = openingCombos(couch.plan)
  assert.equal(combos.heroes, 6, 'six captains')
  assert.equal(combos.parties, 560, '16 crew choose 3')
  assert.equal(combos.openings, 3360)
  assert.equal(combos.endingVersions, 96, '16 endings × 6 captains')
  assert.equal(combos.epilogueLines, 96 * 16)
  const one = openingCombos({ ...couch.plan, endingVersions: 'one' })
  assert.equal(one.endingVersions, 16, 'one version each ignores the hero')
  const f1 = forecast({ ...couch.plan, endingVersions: 'one' })
  const f6 = forecast(couch.plan)
  assert.ok(
    f6.totalImages > f1.totalImages && f6.totalWords > f1.totalWords,
    'per-hero endings cost pictures and words',
  )
  assert.ok(
    f6.notes.some((note) => note.includes('3360 openings')),
    'the forecast explains the fan-out',
  )
  assert.ok(
    couch.plan.villainPerRun && couch.plan.followerQuestSteps > 0,
    'Space Couch plans a nemesis per run and crew quests',
  )

  // Ledger adjustments: overrides and added elements make the working plan.
  const edited = applyPlanEdit(couch.plan, {
    overrides: { followers: 20 },
    additions: [
      { id: 'a', kind: 'follower', title: 'A depressed toaster', note: '' },
      { id: 'b', kind: 'place', title: 'The Customs Moon', note: '' },
      { id: 'c', kind: 'other', title: 'A theme song', note: '' },
    ],
    note: '',
    posts: [],
  })
  assert.equal(edited.followers, 21, 'override plus one added follower')
  assert.equal(edited.locations, couch.plan.locations + 1)
  assert.deepEqual(planChanges(couch.plan, { followers: 20 }), [
    { label: 'Followers', from: '16', to: '20' },
  ])
  assert.equal(
    typeof readAdjustment({ slug: 'game-of-captains', title: 'Space Couch' }),
    'string',
    'an empty adjustment is refused',
  )
  assert.equal(
    typeof readAdjustment({ slug: '../etc', title: 'x', note: 'y' }),
    'string',
    'a bad slug is refused',
  )
  const post = readAdjustment({
    slug: 'game-of-captains',
    title: 'Space Couch',
    note: 'Make the nemesis a tax auditor.',
    changes: [{ label: 'Followers', from: '16', to: '20' }],
    additions: [{ kind: 'follower', title: 'A depressed toaster', note: '' }],
    combos: 'line',
  })
  assert.ok(typeof post !== 'string')
  const comment = adjustmentComment(post, 'silas')
  assert.match(comment, /tax auditor/)
  assert.match(comment, /\| Followers \| 16 \| 20 \|/)
  assert.match(comment, /Follower: A depressed toaster/)
}

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
  'ledger',
  'ledger-detail',
  'adjust',
  'relay',
  'beats',
  'beat',
  'kit',
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
