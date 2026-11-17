import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { achievementsForGame } from '../achievements/gameAchievements'
import {
  ALL_ENDINGS,
  DH_ACHIEVEMENT_CODES,
  achievementsProven,
} from '../deepheart/achievements'
import {
  decodeChronicle,
  decodeSaves,
  emptyChronicle,
  recordFinish,
  recordProgress,
  recordStart,
} from '../deepheart/chronicle'
import { EVENTS, LAYERS, REVEAL_TEXT } from '../deepheart/dungeon'
import {
  SUPPORT_MOMENTS,
  autoplay,
  createRun,
  finaleOptions,
  romanceMoment,
} from '../deepheart/engine'
import {
  activeSynergies,
  canRomance,
  optimizeParty,
  scoreParty,
  startingPartners,
} from '../deepheart/party'
import { ANTHRO_BLURB, ANTHRO_LOOK } from '../deepheart/anthro'
import { CHARACTERS, ROLES, SUPPORTS, character } from '../deepheart/roster'
import type { EndingId, HeroSetup, Room, RunState } from '../deepheart/types'
import { auditPlaybookKit } from '../playbookKit/budget'
import { DEEPHEART } from '../playbookKit/games/deepheart'

// Deepheart: roster, party rules, seeded delves, every ending reachable from
// a fresh seed, the chronicle and saves, achievements and the kit contract.

const hero = (presetId: string, extra: Partial<HeroSetup> = {}): HeroSetup => {
  const c = character(presetId)
  return {
    presetId,
    name: '',
    gender: c.gender,
    drawnTo: [...c.drawnTo],
    boon: c.edge,
    ...extra,
  }
}

// ── Roster ───────────────────────────────────────────────────────────────
assert.equal(CHARACTERS.length, 50, 'fifty presets')
assert.equal(
  Object.keys(ANTHRO_LOOK).length,
  50,
  'fifty painted anthro designs',
)
assert.equal(Object.keys(ANTHRO_BLURB).length, 50, 'fifty species-free blurbs')
assert.ok(CHARACTERS.every((c) => c.look.startsWith('Anthropomorphic ')))
assert.ok(CHARACTERS.every((c) => c.blurb === ANTHRO_BLURB[c.id]))
assert.ok(
  CHARACTERS.every(
    (c) =>
      !/\b(orc|dwarf|elf|gnome|halfling|tiefling|human|faun|lizardfolk|mothkin|goblin)\b/i.test(
        c.blurb,
      ),
  ),
)
assert.equal(new Set(CHARACTERS.map((c) => c.id)).size, 50, 'unique ids')
for (const c of CHARACTERS) {
  assert.ok(ROLES[c.role], `${c.id} has a real role`)
  assert.ok(
    c.blurb && c.secret && c.heart && c.arc && c.look && c.scene,
    `${c.id} is fully written`,
  )
  if (c.partner)
    assert.equal(
      character(c.partner).partner,
      c.id,
      `${c.id}'s partnership is mutual`,
    )
  if (!c.romanceable)
    assert.ok(!c.drawnTo.length || c.partner, `${c.id} is aromantic or married`)
}
for (const g of ['w', 'm', 'n'] as const)
  assert.ok(
    CHARACTERS.filter((c) => c.gender === g).length >= 10,
    `at least ten presets of gender ${g}`,
  )
assert.ok(
  CHARACTERS.filter((c) => !c.romanceable).length >= 6,
  'non-romanceable presets exist',
)
assert.ok(
  new Set(CHARACTERS.map((c) => c.role)).size === 15,
  'every role is represented',
)
for (const s of SUPPORTS) {
  character(s.a)
  character(s.b)
}

// ── Party rules ──────────────────────────────────────────────────────────
assert.ok(
  canRomance(hero('corso'), 'idris', ['idris']),
  'Corso and Idris can rekindle',
)
assert.ok(
  !canRomance(hero('wren'), 'idris', ['idris']),
  'Idris is drawn to men',
)
assert.ok(
  !canRomance(hero('corso', { drawnTo: [] }), 'idris', ['idris']),
  'an aromantic hero courts nobody',
)
assert.ok(
  !canRomance(hero('juniper'), 'quillon', ['quillon']),
  'Quillon is married',
)
assert.ok(
  !canRomance(hero('vex'), 'thessaly', ['thessaly']),
  'Thessaly is courted only alongside Brannoc',
)
assert.ok(
  canRomance(hero('vex'), 'thessaly', ['thessaly', 'brannoc']),
  'the poly couple can be courted together',
)
assert.deepEqual(
  startingPartners(hero('quillon'), ['ambrose']),
  ['ambrose'],
  'married couples start together',
)
assert.deepEqual(startingPartners(hero('brannoc'), ['thessaly', 'torvald']), [
  'thessaly',
])
assert.ok(
  activeSynergies(['brannoc', 'hesk', 'ragna']).some((s) => s.id === 'trinity'),
)
assert.ok(activeSynergies(['wren', 'vex']).some((s) => s.id === 'scouts'))
assert.ok(activeSynergies(['wren', 'vex']).some((s) => s.id === 'duo'))
assert.ok(activeSynergies(['aurel', 'lucan']).some((s) => s.id === 'twilight'))

const best = optimizeParty(hero('idris'), 'balanced', 3)
assert.equal(best.length, 3)
for (const s of best) {
  assert.ok(
    !s.companions.includes('idris'),
    'the hero is never their own companion',
  )
  assert.ok(s.companions.length >= 1 && s.companions.length <= 3)
}
assert.ok(best[0]!.total >= best[2]!.total)
const random = scoreParty(hero('idris'), ['grell', 'nettle', 'crell'])
assert.ok(
  best[0]!.total >= random.total,
  'the optimizer beats an arbitrary party',
)
const romantic = optimizeParty(hero('idris'), 'romance', 1)[0]!
assert.ok(
  romantic.companions.some((id) =>
    canRomance(hero('idris'), id, romantic.companions),
  ),
  'the romance goal finds a possible romance',
)

// ── Seeded delves ────────────────────────────────────────────────────────
const a = autoplay(createRun(hero('brannoc'), ['hesk', 'ragna', 'vex'], 1234))
const b = autoplay(createRun(hero('brannoc'), ['hesk', 'ragna', 'vex'], 1234))
assert.equal(JSON.stringify(a), JSON.stringify(b), 'a seed replays exactly')

const ids = CHARACTERS.map((c) => c.id)
let finished = 0
for (let s = 1; s <= 60; s++) {
  const lead = ids[s % ids.length]!
  const party = ids
    .filter((id) => id !== lead)
    .slice((s * 7) % 40, ((s * 7) % 40) + 1 + (s % 3))
  const run = autoplay(createRun(hero(lead), party, s * 7919))
  assert.equal(run.phase, 'ended', `seed ${s} ends`)
  assert.ok(run.ending, `seed ${s} has an ending`)
  finished += run.ending === 'fallen' ? 0 : 1
}
assert.ok(finished >= 36, `most auto-played delves survive (${finished}/60)`)

// ── Every ending from a fresh seed ───────────────────────────────────────
type Plan = {
  hero: HeroSetup
  party: string[]
  want: string[]
  ending: EndingId
  greedy?: boolean
  reckless?: boolean
}

const PLANS: Plan[] = [
  {
    hero: hero('thessaly'),
    party: ['brannoc', 'ragna', 'hesk'],
    want: [],
    ending: 'delver',
  },
  {
    hero: hero('ragna'),
    party: ['brannoc', 'hesk', 'vex'],
    want: ['drowned-crown:wear'],
    ending: 'usurper',
  },
  {
    hero: hero('lucan'),
    party: ['brannoc', 'hesk', 'ragna'],
    want: ['lich-offer:accept'],
    ending: 'lichbound',
  },
  {
    hero: hero('moss'),
    party: ['brannoc', 'hesk', 'ragna'],
    want: ['weeping-door:free', 'lantern-seed:plant'],
    ending: 'dawnbringer',
  },
  {
    hero: hero('thessaly'),
    party: ['brannoc', 'hesk', 'ragna'],
    want: [
      'goblin-snare:free',
      'tide-prisoner:free',
      'tide-prisoner:question',
      'keystone:brace',
      'ember-orphans:feed',
      'drowned-crown:smash',
    ],
    ending: 'redemption',
  },
  {
    hero: hero('ragna'),
    party: ['brannoc', 'hesk', 'vex'],
    want: ['keystone:loosen'],
    ending: 'sealed',
  },
  {
    hero: hero('vex'),
    party: ['brannoc', 'hesk', 'nettle'],
    want: [],
    ending: 'gilded',
    greedy: true,
  },
  {
    hero: hero('corso'),
    party: ['idris', 'hesk', 'brannoc'],
    want: [],
    ending: 'hearthbound',
  },
  {
    hero: hero('tamsin'),
    party: ['ember'],
    want: [],
    ending: 'fallen',
    reckless: true,
  },
]

function playPlan(plan: Plan, seed: number): RunState {
  const want = new Set(plan.want)
  const run = createRun(plan.hero, plan.party, seed)
  return autoplay(run, {
    door: (r: RunState, list: Room[]) => {
      if (plan.reckless) {
        const fight = list.findIndex(
          (d) => d.kind === 'fight' || d.kind === 'boss',
        )
        return fight >= 0 ? fight : 0
      }
      const wanted = list.findIndex(
        (d) =>
          d.event &&
          EVENTS.find((e) => e.id === d.event)?.options.some((o) =>
            want.has(`${d.event}:${o.id}`),
          ),
      )
      if (wanted >= 0) return wanted
      const hurt = r.party.some((m) => m.down)
      const camp = list.findIndex((d) => d.kind === 'camp')
      if ((hurt || plan.ending === 'hearthbound') && camp >= 0) return camp
      if (plan.greedy) {
        const rich = list.findIndex(
          (d) => d.kind === 'treasure' || d.kind === 'puzzle',
        )
        if (rich >= 0) return rich
      }
      return 0
    },
    option: (r, options) => {
      const ev = r.room!.event!
      const hit = options.find((o) => want.has(`${ev}:${o.id}`))
      if (hit) return hit.id
      if (plan.greedy) {
        const gold = [...options].sort(
          (x, y) => (y.effects.gold ?? 0) - (x.effects.gold ?? 0),
        )[0]!
        return gold.id
      }
      const calm = options.find((o) => !o.effects.flag && !o.effects.item)
      return (calm ?? options[0]!).id
    },
    ending: (_r, options) =>
      options.find((o) => o.ending === plan.ending)?.ending ??
      options[0]!.ending,
  })
}

const reached: Record<string, number> = {}
for (const plan of PLANS) {
  for (let seed = 1; seed <= 400 && !reached[plan.ending]; seed++) {
    const run = playPlan(plan, seed * 104729)
    if (run.ending === plan.ending) reached[plan.ending] = seed
  }
  assert.ok(
    reached[plan.ending],
    `${plan.ending} is reachable from a fresh seed`,
  )
}
assert.deepEqual(
  Object.keys(reached).sort(),
  [...ALL_ENDINGS].sort(),
  'every ending has a replayable trace',
)

// ── Kit spec: everything the engine unlocks exists, and vice versa ──────
const audit = auditPlaybookKit(DEEPHEART)
assert.ok(
  audit.ok,
  audit.issues
    .filter((i) => i.level === 'error')
    .map((i) => i.message)
    .join('\n'),
)
const engineMoments = new Set<string>([
  ...LAYERS.flatMap((l) => [l.moment, l.bossMoment]),
  ...EVENTS.flatMap((e) => (e.moment ? [e.moment] : [])),
  ...Object.values(SUPPORT_MOMENTS),
  ...CHARACTERS.filter((c) => c.romanceable).map((c) => romanceMoment(c.id)),
  'first-fight',
  'puzzle-solved',
  'mimic',
  'campfire',
  'treasure-hoard',
  'full-party',
  'duo',
])
const specMoments = new Set(DEEPHEART.moments.map((m) => m.id))
for (const id of engineMoments)
  assert.ok(specMoments.has(id), `engine moment ${id} is in the scrapbook`)
for (const id of specMoments)
  assert.ok(engineMoments.has(id), `scrapbook moment ${id} can be lived`)
assert.deepEqual(
  DEEPHEART.reveals.map((r) => r.id).sort(),
  Object.keys(REVEAL_TEXT).sort(),
  'every secret has its text',
)
assert.deepEqual(
  DEEPHEART.endings.map((e) => e.id).sort(),
  [...ALL_ENDINGS].sort(),
)

// ── Chronicle, saves and achievements ────────────────────────────────────
assert.equal(
  decodeChronicle('not json'),
  null,
  'an unreadable chronicle is held, never overwritten',
)
assert.equal(
  decodeChronicle(JSON.stringify({ version: 99 })),
  null,
  'a future chronicle is held',
)
assert.deepEqual(decodeChronicle(null), emptyChronicle())
assert.equal(decodeSaves('{'), null)
assert.deepEqual(decodeSaves(null)?.slots, [])

const catalog = achievementsForGame('deepheart')
  .map((e) => e.code)
  .sort()
assert.deepEqual(
  catalog,
  Object.values(DH_ACHIEVEMENT_CODES).sort(),
  'every catalog code has an award rule',
)
assert.ok(
  catalog.length >= 12,
  'a main game carries at least twelve achievements',
)

const live = createRun(hero('thessaly'), ['brannoc', 'ragna', 'hesk'], 42)
let book = recordStart(emptyChronicle(), live)
assert.ok(
  achievementsProven(book, live).includes(DH_ACHIEVEMENT_CODES.firstDelve),
)
const scouts = createRun(hero('wren'), ['vex', 'nettle', 'moss'], 7)
assert.ok(
  achievementsProven(book, scouts).includes(DH_ACHIEVEMENT_CODES.perfectParty),
  'Scouts, Treasure Hunters and Green Circle',
)
assert.ok(
  !achievementsProven(book, live).includes(DH_ACHIEVEMENT_CODES.heartfelt),
  'an existing marriage is not a new romance',
)
autoplay(live)
book = recordFinish(recordProgress(book, live, 0), live)
assert.equal(book.runs.length, 1, 'a finished delve becomes a page')
assert.ok(book.endings.includes(live.ending!))
assert.ok(
  achievementsProven(book, live).includes(DH_ACHIEVEMENT_CODES.firstEnding),
)
assert.ok(book.met.includes('brannoc') && book.met.includes('thessaly'))

const hearth = playPlan(
  PLANS.find((p) => p.ending === 'hearthbound')!,
  reached.hearthbound! * 104729,
)
assert.ok(hearth.partners.includes('idris'))
assert.ok(
  achievementsProven(emptyChronicle(), hearth).includes(
    DH_ACHIEVEMENT_CODES.heartfelt,
  ),
)
assert.ok(finaleOptions(hearth).length === 0 || hearth.phase === 'ended')

// ── Front end contracts ──────────────────────────────────────────────────
const componentDir = 'components/deepheart'
const builderSource = readFileSync(
  `${componentDir}/deepheart-builder.vue`,
  'utf8',
)
assert.match(builderSource, /ref<'hero' \| 'party'>\('hero'\)/)
assert.doesNotMatch(builderSource, /focused\.ancestry/)
assert.doesNotMatch(
  readFileSync(`${componentDir}/deepheart-portrait.vue`, 'utf8'),
  /person\.ancestry/,
)
for (const file of readdirSync(componentDir)) {
  const source = readFileSync(`${componentDir}/${file}`, 'utf8')
  assert.doesNotMatch(
    source,
    /localStorage|\$fetch/,
    `${file} leaves storage and APIs to the store`,
  )
}
assert.match(
  readFileSync(`${componentDir}/deepheart-hand.vue`, 'utf8'),
  /<KrChoiceHand/,
)
assert.match(
  readFileSync('pages/admin/deepheart.vue', 'utf8'),
  /<PlaybookKitShell :spec="deepheart" :meter-values="dh\.meterValues">/,
)
assert.match(
  readFileSync('stores/deepheartStore.ts', 'utf8'),
  /rewardAchievementByCode/,
)

console.log(
  `Deepheart: 50 presets, ${SUPPORTS.length} supports, 60 seeded delves (${finished} survived), all ${ALL_ENDINGS.length} endings reachable (${Object.entries(
    reached,
  )
    .map(([e, s]) => `${e}@${s}`)
    .join(' ')}), ${catalog.length} achievements.`,
)
