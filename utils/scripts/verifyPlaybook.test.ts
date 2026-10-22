import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { ENCOUNTERS, ENDING_LEADS, ENDING_LENSES } from '../ecotone/content'
import {
  ALL_CARDS,
  advance,
  chooseBeat,
  chooseEvent,
  createRun,
  findCard,
  setLiveEdits,
} from '../ecotone/engine'
import { BEATS, ROUTES } from '../ecotone/story'
import { buildEcotonePlaybook } from '../playbook/ecotone'
import {
  PLAYBOOK_GAMES,
  buildPlaybook,
  isPlaybookGame,
  sanitizePlaybookEdit,
  type PlaybookGame,
} from '../playbook/games'
import { applyTextEditToNode } from '../playbook/textOverlay'
import type { PlaybookNode } from '../playbook/types'
import { SHIFTING_LANDS_LIVE_TEXT, v6Card } from '../shiftingLands/deckV6'
import { trialForLand } from '../shiftingLands/authoredBosses'
import {
  SHIFTING_DESKS_LIVE_TEXT,
  WINDOW_PREFIX,
  departmentPack,
  encounterById,
  liveBoss,
  windowApplicant,
} from '../shiftingDesks/rules'
import { GAMEBOOK_LIVE_TEXT, scene } from '../zuzuGamebook/adventure'
import {
  DAYS,
  FORTRESS_LIVE_TEXT,
  dayDef,
  questDef,
} from '../emperorOfDust/fortress/content'
import {
  MAX_ADDED_CHOICES,
  applyCardEdit,
  isEmptyEdit,
  sanitizeCardEdit,
} from '../playbook/edits'
import { PLAYBOOK_ART_LANES, playbookArtRequest } from '../playbook/artLanes'
import {
  normalizePlaybookNote,
  resolvePlaybookGame,
  resolvePlaybookNode,
} from '../../server/utils/playbook'

// The playbook graph: every beat, chained in route order.
const playbook = buildEcotonePlaybook()
for (const card of ALL_CARDS) {
  const node = playbook.nodes[card.id]
  assert.ok(node, `${card.id} is in the playbook`)
  assert.equal(node.editable, true)
  assert.equal(node.kind, card.kind === 'spine' ? 'spine' : 'encounter')
  assert.ok(node.placements.length > 0, `${card.id} is placed on some day`)
}
assert.equal(playbook.nodes.event?.kind, 'opening')
assert.equal(playbook.routes.length, 3)
for (const route of playbook.routes) {
  assert.equal(
    route.steps[0],
    'event',
    'every chain starts at the event choice',
  )
  assert.equal(route.steps.length, ROUTES[route.id as 'kinetic'].length + 1)
  for (const key of route.steps)
    assert.ok(playbook.nodes[key], `${route.id} step ${key} exists`)
  assert.equal(playbook.nodes[route.steps.at(-1) ?? '']?.kind, 'ending')
}
for (const node of Object.values(playbook.nodes)) {
  for (const choice of node.choices)
    if (choice.leadsTo)
      assert.ok(
        playbook.nodes[choice.leadsTo],
        `${node.key}/${choice.id} leads somewhere real`,
      )
  if (node.kind === 'fork') {
    assert.ok(node.pool.length >= 2, `${node.key} pool offers a real choice`)
    assert.deepEqual(
      node.choices.map((c) => c.leadsTo),
      node.pool,
      'fork sub-choices are its pool cards',
    )
  }
}
for (const beat of BEATS)
  for (const choice of playbook.nodes[beat.id]?.choices ?? [])
    assert.ok(choice.leadsTo, `${beat.id}/${choice.id} chains onward`)
for (const lead of ENDING_LEADS) {
  const ending = playbook.nodes[`ending:${lead}`]
  assert.equal(ending?.kind, 'ending')
  assert.equal(
    ending?.choices.length,
    ENDING_LENSES.length * 2,
    `${lead}: each opening lens earns both fates`,
  )
}
assert.ok(playbook.nodes['GR-2']?.lenses.includes('stoned'))
assert.ok(playbook.nodes['GR-2']?.companions.includes('kit'))
assert.ok(playbook.nodes['KN-4']?.companions.includes('alone'))
assert.ok(playbook.nodes['WH-124']?.companions.includes('kit'))
// A beat with no picture in any style shows it needs art; one with a style render does not.
const cards = Object.values(playbook.nodes).filter(
  (n) => n.kind === 'spine' || n.kind === 'encounter',
)
for (const node of cards)
  assert.equal(
    node.needsArt,
    !node.artUrl,
    `${node.key} needsArt follows its art`,
  )
assert.ok(
  cards.some((n) => n.needsArt),
  'beats without art still show they need it',
)
assert.equal(
  playbook.nodes['KN-4']?.artUrl,
  '/ecotone/styles/zimage/cards/kn-4.webp',
  'the default style render fills a new beat',
)
assert.equal(
  new Set(playbook.order).size,
  playbook.order.length,
  'story order lists each beat once',
)

// Every story game loads as a chain (conductor weird-humboldt t-036).
for (const { id } of PLAYBOOK_GAMES) {
  const book = buildPlaybook(id)
  assert.equal(book.game, id)
  assert.ok(book.routes.length > 0, `${id} has a route`)
  assert.equal(
    new Set(book.order).size,
    book.order.length,
    `${id} lists each node once`,
  )
  for (const route of book.routes)
    for (const key of route.steps)
      assert.ok(book.nodes[key], `${id}: ${route.id} step ${key} exists`)
  for (const node of Object.values(book.nodes)) {
    for (const choice of node.choices)
      if (choice.leadsTo)
        assert.ok(
          book.nodes[choice.leadsTo],
          `${id}: ${node.key}/${choice.id} leads somewhere real`,
        )
    for (const person of node.companions)
      assert.ok(
        book.people.some((p) => p.id === person),
        `${id}: ${node.key} names a known ${book.peopleLabel}`,
      )
  }
  for (const section of book.sections)
    for (const key of section.keys)
      assert.ok(book.nodes[key], `${id}: section ${section.title} ${key}`)
  assert.equal(book.editable, true, `${id} reads live overlays`)
  if (id !== 'ecotone')
    for (const node of Object.values(book.nodes))
      if (node.editable)
        assert.ok(node.editFields, `${id}: ${node.key} says what it edits`)
  assert.ok(book.artProject && book.artLanes.length, `${id} tags its art`)
}
assert.ok(isPlaybookGame('emperor-of-dust'))
assert.ok(!isPlaybookGame('pinball'))
const lands = buildPlaybook('shifting-lands')
assert.equal(
  lands.routes[0]?.steps.filter((k) => k.startsWith('trial:')).length,
  5,
  'five lands, five trials',
)
assert.equal(
  Object.values(lands.nodes).filter((n) => n.kind === 'encounter').length,
  120,
  'all 120 Shifting Lands cards',
)
const desks = buildPlaybook('shifting-desks')
assert.equal(
  desks.routes[0]?.steps.filter((k) => k.startsWith('boss:')).length,
  5,
  'five departments, five bosses',
)
assert.ok(
  (desks.sections[0]?.keys.length ?? 0) >= 10,
  'Shifting Desks has ten or more authored endings',
)
const book = buildPlaybook('zuzu-gamebook')
assert.equal(book.nodes['the-crossing']?.key, 'the-crossing', 'the book opens')
assert.ok((book.sections[0]?.keys.length ?? 0) >= 10, 'the gamebook endings')
const dust = buildPlaybook('emperor-of-dust')
assert.equal(dust.routes[0]?.steps.length, 50, 'fifty days')
const lines = dust.sections.find((s) => s.title === 'Follower lines')
assert.equal(
  lines?.keys.length,
  25,
  'twenty followers and five discoverable wanderers',
)
assert.ok(
  lines?.keys.some((key) => (dust.nodes[key]?.choices.length ?? 0) > 1),
  'follower lines gather where followers join',
)
const threads = dust.sections.find((s) => s.title === 'Quest lines')
assert.ok((threads?.keys.length ?? 0) > 0, 'flag-gated quest lines')
for (const key of threads?.keys ?? [])
  assert.ok(
    dust.nodes[key]?.choices.some((c) =>
      c.tags.some((t) => t.startsWith('Needs it')),
    ),
    `${key} gates something`,
  )

// Overlays: sanitized, bounded, and they never touch mechanics.
const raw = {
  title: '  A New Title  ',
  body: ['One.', '', 'Two.'],
  hack: 'ignored',
  lensLines: { stoned: 'Slow green light.', glenn: 'nope' },
  choices: {
    pilot: { label: 'Fly it', success: 'You fly it.' },
    'BAD ID': { label: 'x' },
  },
  added: [
    {
      label: 'Call Dot’s mom',
      check: { skill: 'rizz', target: 8 },
      success: { text: 'She is delighted.', effects: { goodwill: 9 } },
    },
    {
      label: 'Roll the dice',
      check: { skill: 'wits', target: 9 },
      success: { text: 'It works.', effects: { nerve: -7, flag: 'Big Win!' } },
    },
    { label: 'No text' },
    { label: 'Third', success: { text: 'ok' } },
    { label: 'Fourth', success: { text: 'ok' } },
  ],
}
const edit = sanitizeCardEdit(raw)
assert.equal(edit.title, 'A New Title')
assert.deepEqual(edit.body, ['One.', 'Two.'])
assert.ok(!('hack' in edit))
assert.deepEqual(edit.lensLines, { stoned: 'Slow green light.' })
assert.deepEqual(Object.keys(edit.choices ?? {}), ['pilot'])
assert.ok((edit.added?.length ?? 0) <= MAX_ADDED_CHOICES)
const [call, dice] = edit.added ?? []
assert.equal(call?.check, undefined, 'only 7, 9 and 11 are real targets')
assert.equal(call?.success.effects.goodwill, 2, 'effects are bounded')
assert.equal(dice?.check?.target, 9)
assert.ok(dice?.failure, 'a rolled choice always has a complication')
assert.equal(dice?.success.effects.nerve, -2)
assert.equal(dice?.success.effects.flag, 'big_win_')
assert.ok(isEmptyEdit(sanitizeCardEdit({ title: '   ', body: [] })))
assert.ok(isEmptyEdit(sanitizeCardEdit('nonsense')))

const kn4 = findCard('KN-4')
assert.ok(kn4)
const edited = applyCardEdit(kn4, edit)
assert.equal(edited.title, 'A New Title')
assert.equal(edited.lensLines?.stoned, 'Slow green light.')
assert.equal(edited.choices.find((c) => c.id === 'pilot')?.label, 'Fly it')
assert.deepEqual(
  edited.choices.find((c) => c.id === 'pilot')?.check,
  kn4.choices.find((c) => c.id === 'pilot')?.check,
  'mechanics stay authored',
)
assert.equal(edited.choices.length, 4, 'a card never grows past four choices')
assert.equal(kn4.title, 'Conscripted', 'the authored card is untouched')

// Live edits reach play and can be withdrawn.
setLiveEdits({ 'KN-1': { title: 'Race Day', added: edit.added } })
assert.equal(findCard('KN-1')?.title, 'Race Day')
let run = advance(chooseEvent(createRun(4, 'rower'), 'kinetic'))
assert.equal(run.card, 'KN-1')
const added = findCard('KN-1')?.choices.find((c) => c.id.startsWith('added'))
assert.ok(added)
run = chooseBeat(run, added.id)
assert.ok(run.pending, 'an added choice plays like any other')
setLiveEdits({})
assert.equal(findCard('KN-1')?.title, 'The Night Before on the Plaza')

// Server validation.
assert.equal(resolvePlaybookGame('ecotone'), 'ecotone')
assert.throws(() => resolvePlaybookGame('pinball'))
assert.equal(resolvePlaybookNode('ecotone', 'fork:kinetic:5'), 'fork:kinetic:5')
assert.throws(() => resolvePlaybookNode('ecotone', 'WH-999'))
assert.throws(
  () =>
    resolvePlaybookNode('ecotone', 'crossroads:kinetic', { editable: true }),
  'assembled beats are not edited directly',
)
assert.equal(resolvePlaybookNode('ecotone', 'GR-1', { editable: true }), 'GR-1')
assert.deepEqual(normalizePlaybookNote({ kind: 'comment', body: ' Hi ' }), {
  kind: 'comment',
  body: 'Hi',
  choiceId: null,
  artJobId: null,
  artImageId: null,
})
assert.throws(() => normalizePlaybookNote({ kind: 'shout', body: 'x' }))
assert.throws(() => normalizePlaybookNote({ kind: 'image', body: 'x' }))
assert.throws(() => normalizePlaybookNote({ kind: 'art-request', body: 'x' }))
assert.throws(() => normalizePlaybookNote({ kind: 'comment', body: '' }))
assert.equal(
  normalizePlaybookNote({ kind: 'image', body: '', artImageId: 12 }).artImageId,
  12,
)

// Art requests are private, tagged to the project, and sized by shape.
for (const lane of PLAYBOOK_ART_LANES) {
  const body = playbookArtRequest(lane, 'a slug on the bay', 'portrait', 3, {
    projectSlug: 'weird-humboldt',
    designer: 'Ecotone',
    negative: 'anthro, furry',
  })
  assert.equal(body.isPublic, false)
  assert.equal(body.projectSlug, 'weird-humboldt')
  assert.equal(body.height, 1216)
  assert.match(String(body.promptString), /a slug on the bay/)
  if (lane.engine === 'comfy') {
    assert.ok(body.checkpoint)
    assert.match(String(body.negativePrompt), /anthro, furry/)
  }
}

// The admin route, its tab and the schema.
assert.ok(existsSync('pages/admin/playbook-manager.vue'))
const tab = readFileSync('content/channels/admin/playbook-manager.md', 'utf8')
assert.match(tab, /\nchannelKey: admin\n/)
assert.match(tab, /\nroute: \/admin\/playbook-manager\n/)
assert.match(tab, /\nrequiredRole: ADMIN\n/)
const schema = readFileSync('prisma/playbook.prisma', 'utf8')
assert.match(schema, /model PlaybookEdit/)
assert.match(schema, /model PlaybookNote/)
for (const file of [
  'components/playbook/playbook-art.vue',
  'components/playbook/playbook-node.vue',
  'components/playbook/playbook-detail.vue',
  'components/playbook/playbook-atlas-card.vue',
  'components/playbook/playbook-scene.vue',
  'pages/admin/playbook-manager.vue',
])
  assert.ok(
    !/localStorage|\$fetch/.test(readFileSync(file, 'utf8')),
    `${file} leaves storage and fetching to the store`,
  )
assert.equal(ENCOUNTERS.length > 0, true)

// The content layer (t-037): every other game reads its text through a live
// overlay. Each editable beat resolves to the lookup its game plays through.
type Overlay = { set(next: Record<string, unknown>): void }
const LOOKUPS: Record<
  Exclude<PlaybookGame, 'ecotone'>,
  { overlay: Overlay; read(key: string): unknown }
> = {
  'shifting-lands': {
    overlay: SHIFTING_LANDS_LIVE_TEXT,
    read: (key) =>
      key.startsWith('trial:')
        ? trialForLand(key.slice('trial:'.length))
        : v6Card(key),
  },
  'shifting-desks': {
    overlay: SHIFTING_DESKS_LIVE_TEXT,
    read: (key) => {
      if (key.startsWith('applicant:'))
        return windowApplicant(WINDOW_PREFIX + key.slice('applicant:'.length))
          ?.applicant
      if (key.startsWith('boss:'))
        return liveBoss(departmentPack(key.slice('boss:'.length)))
      return encounterById(key)
    },
  },
  'zuzu-gamebook': { overlay: GAMEBOOK_LIVE_TEXT, read: (key) => scene(key) },
  'emperor-of-dust': {
    overlay: FORTRESS_LIVE_TEXT,
    read: (key) => {
      if (key.startsWith('quest:')) return questDef(key.slice('quest:'.length))
      if (key.startsWith('day:')) return dayDef(Number(key.slice(4)))
      const id = key.slice('aud:'.length)
      return DAYS.map((d) => dayDef(d.day))
        .flatMap((d) => d?.audiences ?? [])
        .find((a) => a.id === id)
    },
  },
}

// Every field an overlay may rewrite, blanked so the rest can be compared.
const WORD_FIELDS = new Set([
  'title',
  'name',
  'flavor',
  'flavor_text',
  'text',
  'summary',
  'label',
  'request',
  'plea',
  'response',
  'komodo',
  'lines',
  'triumph',
  'success',
  'partial',
  'failure',
  'expired',
])
function wordless(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(wordless)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).map(([key, v]) => [
      key,
      WORD_FIELDS.has(key) && (typeof v === 'string' || key === 'lines')
        ? '·'
        : wordless(v),
    ]),
  )
}

/** An edit that restates the beat exactly as the manager shows it. */
function restate(node: PlaybookNode) {
  const fields = node.editFields!
  return {
    title: node.title,
    body: fields.body ? node.body : undefined,
    choices: Object.fromEntries(
      node.choices.map((c) => [
        c.id,
        {
          label: fields.labels === false ? undefined : c.label,
          success: fields.outcomes ? c.success?.text : undefined,
          failure: fields.outcomes ? c.failure?.text : undefined,
        },
      ]),
    ),
  }
}

for (const [game, lookup] of Object.entries(LOOKUPS) as [
  keyof typeof LOOKUPS,
  (typeof LOOKUPS)[keyof typeof LOOKUPS],
][]) {
  const nodes = Object.values(buildPlaybook(game).nodes).filter(
    (n) => n.editable,
  )
  assert.ok(nodes.length > 0, `${game} has editable beats`)
  lookup.overlay.set({})
  const authored = new Map(
    nodes.map((n) => [n.key, JSON.stringify(lookup.read(n.key))]),
  )
  for (const node of nodes)
    assert.ok(lookup.read(node.key), `${game}: ${node.key} has a live lookup`)
  // Restating every beat as written changes nothing the game reads, so the
  // manager's title, paragraphs and choices map straight back onto the source.
  lookup.overlay.set(Object.fromEntries(nodes.map((n) => [n.key, restate(n)])))
  for (const node of nodes)
    assert.equal(
      JSON.stringify(lookup.read(node.key)),
      authored.get(node.key),
      `${game}: ${node.key} round-trips through the overlay`,
    )
  // A real edit lands in play and leaves every non-text field alone.
  const target = nodes[0]!
  const choice = target.choices.find((c) => c.success) ?? target.choices[0]
  lookup.overlay.set({
    [target.key]: {
      title: 'Edited title',
      body: target.body.map((_, i) => `Edited paragraph ${i + 1}.`),
      choices: choice
        ? { [choice.id]: { label: 'Edited label', success: 'Edited result.' } }
        : undefined,
    },
  })
  const edited = JSON.stringify(lookup.read(target.key))
  assert.notEqual(edited, authored.get(target.key), `${game}: edits apply`)
  assert.match(edited, /Edited title|Edited paragraph/, `${game}: text shows`)
  assert.equal(
    JSON.stringify(wordless(JSON.parse(edited))),
    JSON.stringify(wordless(JSON.parse(authored.get(target.key)!))),
    `${game}: only words change`,
  )
  lookup.overlay.set({})
  assert.equal(
    JSON.stringify(lookup.read(target.key)),
    authored.get(target.key),
    `${game}: clearing the overlay restores the authored beat`,
  )
}

// The manager previews a text edit the same way.
const sample = Object.values(buildPlaybook('zuzu-gamebook').nodes).find(
  (n) => n.editable && n.choices.length,
)!
const previewed = applyTextEditToNode(sample, {
  title: 'T',
  body: ['B'],
  choices: { [sample.choices[0]!.id]: { label: 'L' } },
})
assert.equal(previewed.title, 'T')
assert.deepEqual(previewed.body, ['B'])
assert.equal(previewed.choices[0]?.label, 'L')
assert.equal(previewed.choices[0]?.leadsTo, sample.choices[0]?.leadsTo)
assert.deepEqual(
  sanitizePlaybookEdit('shifting-lands', {
    title: ' x ',
    added: [{ id: 'a' }],
    lensLines: { hope: 'y' },
  }),
  { title: 'x' },
  'non-Ecotone games keep to the text overlay',
)

console.log('Playbook contract passed')
