import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
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
import { blueprintFromPitch, buildGestation } from '../playbookForge/gestation'
import { withGestationNote } from '../playbookForge/gestationNotes'
import { cardsForTab, designTab } from '../playbookForge/designs'
import {
  characterItem,
  entityImage,
  facetItem,
  itemDesign,
  itemSpark,
  scenarioLocations,
} from '../playbookForge/catalog'
import { parse as parseYaml } from 'yaml'
import {
  SPARK_SLOTS,
  composeIdea,
  dealSparks,
  elementFromFacets,
  facetPool,
  presetForGenre,
  sparkLines,
  type FacetCard,
} from '../playbookForge/facets'
import {
  adjustmentComment,
  applyPlanEdit,
  planChanges,
  readAdjustment,
} from '../playbookForge/adjust'
import {
  buildLedger,
  completionPercent,
  laneClass,
  nodeArtPrompt,
  artPromptBrief,
  withPainted,
  nodeShape,
  planGaps,
  projectJobs,
  unitsToPaint,
  unitsToWrite,
  writingBrief,
  type LedgerJob,
} from '../playbookForge/ledger'
import { blankNode, type PlaybookNode } from '../playbook/types'
import {
  combinedSection,
  entryStatus,
  filterEntries,
  galleryEntry,
  galleryTiles,
  targetEntries,
  targetNoteKey,
} from '../playbookForge/gallery'
import { PLAYBOOK_GAMES, buildPlaybook } from '../playbook/games'
import { withVerifiedArt } from '../playbookForge/verifiedArt'
import { inspectPlaybookArt } from '../../server/utils/playbookArtInventory'

const fromRoot = (path: string) => new URL('../../' + path, import.meta.url)
const base = (): Blueprint => ({
  ...VIGNETTE_DEFAULTS,
  slug: 'moon-laundry',
  title: 'Moon Laundry',
})
const at = (patch: Partial<Blueprint>) => forecast({ ...base(), ...patch })

// Every factor a blueprint carries is a row the designer can reach, once.
// Sparks are design material from Facets, carried like the idea, not a factor.
const identity = new Set([
  'slug',
  'title',
  'idea',
  'genre',
  'sparks',
  'designs',
])
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
assert.equal(
  ledger.finishedShare,
  3 / 7,
  'three of seven beats written and painted',
)
assert.ok(
  ledger.progress > ledger.finishedShare,
  'progress credits written beats still waiting on art',
)
assert.equal(
  ledger.progress,
  (ledger.writtenShare + ledger.paintedShare) / 2,
  'progress is half writing, half art',
)

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
  null,
  'a beat without an authored prompt has none: titles are never assembled into one',
)
assert.equal(
  nodeArtPrompt({
    ...beat('p', 'encounter'),
    artPrompt: ' A fogbound pier at dawn. ',
  }),
  'A fogbound pier at dawn.',
)
{
  const brief = artPromptBrief(
    'ecotone',
    'Ecotone',
    'weird-humboldt',
    'Encounters',
    [beat('p', 'encounter')],
  )
  assert.match(
    brief,
    /projects\/weird-humboldt\/art\/<ROUND>\.yaml with auto_submit: true/,
  )
  assert.match(brief, /Never use the beat title, chapter title, subtitle/)
  assert.match(brief, /- p "Beat p"/)
}
{
  // Image-store art counts only when the server finds the file.
  const book = {
    order: ['m'],
    nodes: { m: { ...beat('m', 'encounter'), artPath: '/images/x/m.webp' } },
  }
  assert.equal(
    buildLedger(
      book,
      {},
      { laneKey: 'krea2', assumptions: DEFAULT_ASSUMPTIONS },
    ).art.delivered,
    0,
  )
  assert.equal(
    buildLedger(
      withPainted(book, { m: '/images/x/m.webp' }),
      {},
      {
        laneKey: 'krea2',
        assumptions: DEFAULT_ASSUMPTIONS,
      },
    ).art.delivered,
    1,
  )
}
{
  const fixture = {
    order: ['real', 'missing', 'svg'],
    nodes: {
      real: beat('real', 'opening', {
        artUrl: '/crystal-street/cover.webp',
      }),
      missing: beat('missing', 'encounter', {
        artUrl: '/crystal-street/scenes/not-a-real-scene.webp',
      }),
      svg: beat('svg', 'ending', {
        artUrl: '/crystal-street/poster.svg',
      }),
    },
    artRequirements: [
      {
        key: 'real-extra',
        title: 'Delivered',
        url: '/crystal-street/cover.webp',
      },
      {
        key: 'missing-extra',
        title: 'Missing',
        url: '/crystal-street/outcomes/not-rendered.webp',
      },
      {
        key: 'vector-extra',
        title: 'Vector filler',
        url: '/crystal-street/poster.svg',
      },
    ],
  }
  const inventory = inspectPlaybookArt(
    fixture,
    fileURLToPath(fromRoot('images-not-present')),
    [fileURLToPath(fromRoot('public'))],
  )
  assert.deepEqual(Object.keys(inventory.verified), ['real'])
  assert.equal(inventory.extras.total, 3)
  assert.equal(inventory.extras.delivered, 1)
  const inspected = buildLedger(
    withVerifiedArt(fixture, inventory.verified),
    {},
    {
      laneKey: 'krea2',
      assumptions: DEFAULT_ASSUMPTIONS,
      extraArt: inventory.extras,
    },
  )
  assert.equal(inspected.art.delivered, 2, 'one real beat and one extra image')
  assert.equal(inspected.art.missing, 4, 'missing, vector and two extra slots')
  assert.ok(inspected.paintedShare < 0.5)
  assert.ok(inspected.progress < 1, 'authored URLs cannot claim 100% delivery')
  assert.equal(inspected.extraArt.total, 3)
  assert.match(inspected.discrepancies.join(' '), /required game images/)
  assert.notEqual(
    inspected.shine,
    'super',
    'missing art prevents a full completion star',
  )
  const notAudited = withVerifiedArt(fixture, undefined)
  assert.equal(notAudited.nodes.real?.artUrl, null)
  assert.equal(notAudited.nodes.real?.needsArt, true)

  const crystal = buildPlaybook('crystal-street')
  assert.ok(
    (crystal.artRequirements?.length ?? 0) > 300,
    'Crystal Street enumerates choice outcomes, emotions, villain and item art',
  )
  const crystalAudit = inspectPlaybookArt(
    crystal,
    fileURLToPath(fromRoot('images-not-present')),
    [fileURLToPath(fromRoot('public'))],
  )
  assert.ok(crystalAudit.extras.delivered < crystalAudit.extras.total)
  const crystalLedger = buildLedger(
    withVerifiedArt(crystal, crystalAudit.verified),
    {},
    {
      laneKey: 'krea2',
      assumptions: DEFAULT_ASSUMPTIONS,
      extraArt: crystalAudit.extras,
    },
  )
  assert.ok(crystalLedger.paintedShare < 1)
  assert.ok(crystalLedger.progress < 1)
  assert.equal(crystal.order.length, Object.keys(crystal.nodes).length)
}
assert.equal(completionPercent(0.999), 99)
assert.equal(completionPercent(1), 100)
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

// Memory Dungeon is planned at the Sixteen-Realm bible's scale and counted by
// authored position, so two built worlds read as two of sixteen.
const memory = EXISTING_PLAYBOOKS.find((e) => e.slug === 'memory-dungeon')!
assert.equal(memory.plan.encounters, 16 * (64 + 36))
assert.equal(memory.plan.acts * memory.plan.chaptersPerAct, 16)
const memoryBuilt = await memory.count()
assert.equal(memoryBuilt.values.encounters, 2 * (64 + 36))
assert.equal(memoryBuilt.values.reveals, 32)
const memoryLedger = buildLedger(
  buildPlaybook('memory-dungeon'),
  {},
  {
    laneKey: 'krea2',
    assumptions: DEFAULT_ASSUMPTIONS,
    gaps: planGaps(memory.plan, memoryBuilt),
  },
)
assert.equal(memoryLedger.scope, 200 / 1600)
assert.equal(
  memoryLedger.unbuiltUnits,
  1400,
  'other fourteen worlds have no authored encounter slots',
)
assert.equal(memoryLedger.plannedUnits, memoryLedger.units + 1400)
assert.ok(
  memoryLedger.remainingSeconds > 1400 * 60,
  'missing worlds require real future renders',
)
assert.equal(
  memoryLedger.progress,
  (memoryLedger.writtenShare + memoryLedger.paintedShare) / 2,
)
assert.ok(memoryLedger.progress <= memoryLedger.scope)
assert.match(
  memoryLedger.discrepancies.join(' '),
  /Encounters: 200 built of 1600 planned\. Progress counts the unbuilt/,
)
// A plan past a stepper's range steps from where it is, not to the cap.
const encountersRow = FACTOR_ROWS.find((r) => r.key === 'encounters')!
assert.equal(stepValue(encountersRow, memory.plan, -1), 1595)
assert.equal(stepValue(encountersRow, memory.plan, 1), 1605)

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

// The gallery: every section and person as art, with an honest status per
// beat, and a person's beats submittable as one section.
for (const game of PLAYBOOK_GAMES) {
  const book = buildPlaybook(game.id)
  const ledger = buildLedger(
    book,
    {},
    { laneKey: 'krea2', assumptions: DEFAULT_ASSUMPTIONS },
  )
  const tiles = galleryTiles(book, ledger)
  assert.equal(
    tiles.sections.reduce((n, t) => n + t.count, 0),
    ledger.units,
    `${game.id}: the gallery shelves hold every beat once`,
  )
  for (const t of tiles.sections)
    assert.equal(
      targetEntries(book, ledger, t.target).length,
      t.count,
      `${game.id} ${t.label}`,
    )
  for (const t of tiles.people) {
    const keys = targetEntries(book, ledger, t.target).map((e) => e.key)
    const combined = combinedSection(t.label, ledger.sections, keys)!
    assert.equal(combined.units.length, keys.length, `${game.id} ${t.label}`)
    assert.equal(combined.label, t.label)
  }
}
const promRoster = buildPlaybook('comet-city-academy')
const identityNodes = Object.values(promRoster.nodes).filter(
  (node) => node.kind === 'follower' && node.key.startsWith('identity:'),
)
assert.ok(
  identityNodes.length >= 48,
  'every authored signature identity appears in the Forge cast',
)
const firstIdentity = galleryEntry(identityNodes[0]!)
assert.equal(
  firstIdentity.artVariants.length,
  3,
  'student, hero and villain art slots',
)
assert.ok(
  firstIdentity.body.some((line) => /Hero turn/.test(line)),
  'hero consequence visible',
)
assert.ok(
  firstIdentity.variations.some((v) => v.key === 'sidekick'),
  'sidekick branch visible',
)
assert.ok(
  firstIdentity.variations.some((v) => v.key === 'romance'),
  'romance branch visible',
)
assert.ok(
  firstIdentity.group !== 'Cast',
  'origin family is available for visual browsing',
)

const captains = buildPlaybook('game-of-captains')
const captainsLedger = buildLedger(
  captains,
  {},
  { laneKey: 'krea2', assumptions: DEFAULT_ASSUMPTIONS },
)
const crew = galleryTiles(captains, captainsLedger).people
assert.ok(crew.length >= 6, 'Space Couch crew each get a page')
assert.ok(
  crew.every((t) => t.count > 0),
  'a person page holds their beats',
)
assert.equal(
  entryStatus(
    galleryEntry(
      beat('p', 'encounter', { artPrompt: 'A lighthouse at dusk.' }),
    ),
  ),
  'unpainted',
)
assert.equal(entryStatus(galleryEntry(beat('q', 'encounter'))), 'no-prompt')
assert.equal(
  entryStatus(galleryEntry(beat('r', 'encounter', { artUrl: '/r.webp' }))),
  'painted',
)
assert.equal(
  targetNoteKey({ type: 'section', id: 'follower' }),
  'section:follower',
)
assert.equal(targetNoteKey({ type: 'person', id: 'pell' }), 'person:pell')
assert.equal(
  filterEntries(
    [
      galleryEntry(beat('a1', 'encounter', { artUrl: '/a.webp' })),
      galleryEntry(beat('a2', 'encounter')),
    ],
    'missing',
  ).length,
  1,
)

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

assert.equal(
  new Set(EXISTING_PLAYBOOKS.map((e) => e.slug)).size,
  EXISTING_PLAYBOOKS.length,
  'one library entry per game, even when a kit spec shares its slug',
)

// Openings fan out into endings: the party adds epilogue lines, the hero
// multiplies the written endings.
{
  const couch = EXISTING_PLAYBOOKS.find((e) => e.slug === 'game-of-captains')!
  const combos = openingCombos(couch.plan)
  assert.equal(combos.heroes, 6, 'six captains')
  assert.equal(combos.parties, 220, '12 crew choose 3')
  assert.equal(combos.openings, 1320)
  assert.equal(combos.endingVersions, 96, '16 endings × 6 captains')
  assert.equal(combos.epilogueLines, 96 * 12)
  // Silas, 2026-10-27: every trio earns two endings and an adventure of its
  // own; every galactic boss brings endings of its own.
  assert.equal(combos.partyEndings, 440, 'two endings per trio')
  assert.equal(combos.partyScenes, 660, 'a three-step adventure per trio')
  assert.equal(combos.villainEndings, 24, 'three endings per boss')
  assert.equal(couch.plan.romances, 12, 'a romance thread per crew member')
  const measuredCouch = await couch.count()
  assert.equal(
    measuredCouch.values.romances,
    12,
    'measured romances must reflect all twelve authored crew courtships',
  )

  const noParty = forecast({
    ...couch.plan,
    partyEndings: 0,
    partyAdventureSteps: 0,
  })
  assert.ok(
    forecast(couch.plan).totalImages - noParty.totalImages >= 440 + 660,
    'party endings and adventures are painted',
  )
  const one = openingCombos({ ...couch.plan, endingVersions: 'one' })
  assert.equal(one.endingVersions, 16, 'one version each ignores the hero')
  const f1 = forecast({ ...couch.plan, endingVersions: 'one' })
  const f6 = forecast(couch.plan)
  assert.ok(
    f6.totalImages > f1.totalImages && f6.totalWords > f1.totalWords,
    'per-hero endings cost pictures and words',
  )
  assert.ok(
    f6.notes.some((note) => note.includes('1320 openings')),
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
    { label: 'Followers', from: '12', to: '20' },
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
    changes: [{ label: 'Followers', from: '12', to: '20' }],
    additions: [{ kind: 'follower', title: 'A depressed toaster', note: '' }],
    combos: 'line',
  })
  assert.ok(typeof post !== 'string')
  const comment = adjustmentComment(post, 'silas')
  assert.match(comment, /tax auditor/)
  assert.match(comment, /\| Followers \| 12 \| 20 \|/)
  assert.match(comment, /Follower: A depressed toaster/)
}

// Facets: genres map to the nearest loadout; the rest are dealt into slots.
{
  let id = 0
  const card = (
    taxonomy: string,
    title: string,
    extra: Partial<FacetCard> = {},
  ): FacetCard => ({
    id: ++id,
    title,
    taxonomy,
    description: `${title} described.`,
    flavorText: null,
    artPrompt: null,
    imagePath: null,
    randomWeight: 1,
    isRandomizable: true,
    ...extra,
  })
  assert.equal(presetForGenre(card('GENRE', 'Space Opera')), 'space-comedy')
  assert.equal(presetForGenre(card('GENRE', 'Cyberpunk')), 'office-dystopia')
  assert.equal(presetForGenre(card('GENRE', 'Gothic Horror')), 'comedy-horror')
  assert.equal(
    presetForGenre(card('GENRE', 'Polka')),
    'open',
    'unknown genres start open',
  )
  const pool = facetPool([
    card('MOOD', 'Wistful'),
    card('SETTING', 'Tidal Library'),
    card('THEME', 'Forgiveness'),
    card('ARCHETYPE', 'Reluctant Heir'),
    card('OCCUPATION', 'Lighthouse Keeper'),
    card('SPECIES', 'Otter'),
    card('QUIRK', 'Collects Keys'),
    card('BACKSTORY', 'Exiled Cartographer'),
    card('MATERIAL', 'Sea Glass'),
    card('ART_DIRECTION', 'Woodcut', { artPrompt: 'bold woodcut lines' }),
    card('MOOD', 'Never Dealt', { isRandomizable: false }),
  ])
  const dealt = dealSparks(pool, [], () => 0)
  assert.equal(dealt.length, SPARK_SLOTS.length, 'every slot gets a spark')
  assert.ok(
    dealt.every((s) => s.title !== 'Never Dealt'),
    'only randomizable Facets are dealt',
  )
  const kept = dealt.map((s) =>
    s.slot === 'tone' ? { ...s, locked: true } : s,
  )
  const again = dealSparks(pool, kept, () => 0.99)
  assert.equal(
    again.find((s) => s.slot === 'tone')?.facetId,
    kept.find((s) => s.slot === 'tone')?.facetId,
    'kept sparks survive a redeal',
  )
  const idea = composeIdea([
    {
      slot: 'genre',
      facetId: 99,
      taxonomy: 'GENRE',
      title: 'Sea Fable',
      description: '',
    },
    ...dealt,
  ])
  assert.match(
    idea,
    /^A wistful sea fable set in the tidal library, about forgiveness\. You play the reluctant heir, with a lighthouse keeper at your side \(quirk: collects keys\)\./,
  )
  assert.match(idea, /Painted as woodcut\./)
  assert.ok(
    sparkLines(dealt).some((line) => line.includes('bold woodcut lines')),
    'the look carries its art prompt into the pitch',
  )
  const follower = elementFromFacets('follower', pool, () => 0)
  assert.equal(follower?.title, 'The Otter Lighthouse Keeper')
  assert.match(follower?.source ?? '', /^Facets: /)
  assert.match(
    follower?.note ?? '',
    /Collects Keys/,
    'the quirk goes in the note',
  )
  assert.equal(
    elementFromFacets('place', { SETTING: pool.SETTING! }, () => 0)?.title,
    'The Tidal Library',
    'a missing taxonomy leaves its slot out of the name',
  )
  assert.equal(elementFromFacets('villain', {}), null, 'no Facets, no draw')
}

// Gestation: dated dockets grow concepts; notes ride along; pitches forge drafts.
{
  const pitch = (mode: string, evolution: string) => ({
    slug: 'moon-laundry',
    concept_id: 'moon-laundry',
    title: 'Moon Laundry',
    mode,
    evolution,
    hook: 'Lost socks are portals.',
    genre_pillar: 'Cozy science fiction',
    cast: { playable: 3, followers: 10, npcs: 16 },
    production: { maps: 6, encounter_scenes: 168, finale_scripts: 20 },
  })
  const concepts = buildGestation(
    [
      {
        date: '2026-10-27',
        data: { pitches: [pitch('expand', 'Second day')] },
      },
      {
        date: '2026-10-26',
        data: { pitches: [pitch('new', 'First day'), { bad: true }] },
      },
      { date: '2026-10-25', data: null },
    ],
    {
      concepts: {
        'moon-laundry': { status: 'promising', strengths: ['Socks'] },
      },
    },
    {
      notes: {
        'moon-laundry': [
          { at: '2026-10-27T00:00:00Z', note: 'More moths.', status: 'open' },
          { note: '' },
        ],
      },
    },
  )
  assert.equal(
    concepts.length,
    1,
    'one concept across days; malformed rows skipped',
  )
  const [moon] = concepts
  assert.equal(moon!.versions.length, 2)
  assert.equal(moon!.latestDate, '2026-10-27')
  assert.equal(moon!.latest.evolution, 'Second day')
  assert.equal(moon!.status, 'promising')
  assert.deepEqual(
    moon!.notes.map((n) => n.note),
    ['More moths.'],
  )
  const b = blueprintFromPitch(moon!.latest)
  assert.equal(
    b.genre,
    'space-comedy',
    'science fiction starts from the space loadout',
  )
  assert.equal(b.followers, 10)
  assert.equal(b.rosterSize, 3)
  assert.equal(b.locations, 6)
  assert.equal(b.endings, 20)
  assert.equal(b.idea, 'Lost socks are portals.')

  const header = '# keep me\nnotes: {}\n'
  const once = withGestationNote(header, 'moon-laundry', {
    at: 't1',
    note: 'A: b "c"',
    status: 'open',
  })
  const twice = withGestationNote(once, 'moon-laundry', {
    at: 't2',
    note: 'Two',
    status: 'open',
  })
  assert.match(twice, /^# keep me/, 'comments survive')
  assert.deepEqual(
    (parseYaml(twice) as { notes: Record<string, { note: string }[]> }).notes[
      'moon-laundry'
    ]!.map((n) => n.note),
    ['A: b "c"', 'Two'],
  )
  assert.match(withGestationNote('', 'x', { note: 'first' }), /notes:\n {2}x:/)
}

// Designs: plan pages lead with art, the game's beats and authored designs.
{
  const book = {
    order: ['a', 'b', 'c'],
    nodes: {
      a: { ...beat('a', 'follower'), artUrl: '/a.webp' },
      b: { ...beat('b', 'encounter'), artPrompt: 'A pier at dawn.' },
      c: beat('c', 'ending'),
    },
  }
  const design = {
    id: 'd1',
    kind: 'villain' as const,
    title: 'The Tax Auditor',
    note: '',
    prompt: 'A grey clerk.',
  }
  const cast = cardsForTab('cast', book, [design])
  assert.deepEqual(
    cast.map((c) => c.id),
    ['design:d1', 'beat:a'],
    'designs first, then the page’s beats',
  )
  assert.equal(cast[1]!.imageUrl, '/a.webp')
  const story = cardsForTab('story', book, [design])
  assert.deepEqual(
    story.map((c) => c.prompt),
    ['A pier at dawn.'],
    'an unpainted beat shows its authored prompt',
  )
  assert.equal(designTab('place'), 'story')

  // Catalogue: entities read as art cards; picks become designs and sparks.
  assert.equal(entityImage({ artImageId: 7 }), '/api/art/images/7/file')
  assert.equal(entityImage({ imagePath: 'images/x.webp' }), '/images/x.webp')
  const hero = characterItem({
    id: 3,
    name: 'Mosswick',
    species: 'Otter',
    class: 'Bard',
    artImageId: 9,
  })!
  assert.equal(hero.imageUrl, '/api/art/images/9/file')
  assert.equal(
    itemDesign(hero).kind,
    'follower',
    'a character becomes a follower design',
  )
  assert.equal(itemDesign(hero).imageUrl, '/api/art/images/9/file')
  const setting = facetItem({
    id: 4,
    title: 'Tidal Library',
    taxonomy: 'SETTING',
    description: 'Shelves in the surf.',
    flavorText: null,
    artPrompt: null,
    imagePath: null,
    randomWeight: 1,
    isRandomizable: true,
  })
  assert.equal(itemDesign(setting).kind, 'place')
  assert.equal(
    itemSpark(setting)?.slot,
    'world',
    'a SETTING Facet sparks the world',
  )
  const genre = facetItem({
    id: 5,
    title: 'Solarpunk',
    taxonomy: 'GENRE',
    description: null,
    flavorText: null,
    artPrompt: null,
    imagePath: null,
    randomWeight: 1,
    isRandomizable: true,
  })
  assert.equal(itemSpark(genre)?.slot, 'genre')
  assert.deepEqual(
    scenarioLocations({
      id: 2,
      title: 'Fog',
      locations: '- The Pier: where it starts\n- Old Mill',
    }).map((l) => l.title),
    ['The Pier', 'Old Mill'],
  )
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
  'gestation',
  'gestation-concept',
  'designs',
  'art-card',
  'catalog',
  'catalog-tray',
  'gallery',
  'gallery-strip',
  'gallery-card',
  'gallery-inspector',
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
