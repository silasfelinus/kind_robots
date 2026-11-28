import assert from 'node:assert/strict'
import { discoveryArt } from '../playbookKit/view'
import {
  DeepheartSound,
  DEEPHEART_THEMES,
  DEEPHEART_CUES,
  deepheartAudioFrame,
  deepheartCues,
  deepheartMood,
} from '../deepheart/sound'
import { noteFreq, parseLoop, type ArcadeSound } from '../arcade/sound'
import { parseDeepheartBackup } from '../deepheart/accountBackup'
import { DEFAULT_KIT_SETTINGS } from '../playbookKit/settings'
import { readFileSync, readdirSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'
import {
  resolveChannelLocation,
  resolveChannels,
  type ChannelContentItem,
} from '../../stores/helpers/channelContent'
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
import {
  COURT_CHOICE_KEYS,
  COURT_DEITIES,
  COURT_LINKS,
} from '../deepheart/court'
import { UNDERCITY_EVENTS } from '../deepheart/society'
import { SUPPORT_SEQUELS } from '../deepheart/campStories'
import { ENEMIES, EVENTS, LAYERS, REVEAL_TEXT } from '../deepheart/dungeon'
import {
  SUPPORT_MOMENTS,
  abilityModifier,
  autoplay,
  attemptParley,
  campAction,
  campOptions,
  campSceneMoment,
  createRun,
  baseStat,
  chooseCourtOption,
  chooseDoor,
  chooseEnding,
  chooseOption,
  courtOptions,
  finaleOptions,
  rollAbilityCheck,
  romanceMoment,
  startFight,
  stat,
} from '../deepheart/engine'
import {
  activeSynergies,
  canRomance,
  roleFor,
  optimizeParty,
  scoreParty,
  startingPartners,
} from '../deepheart/party'
import { ANTHRO_BLURB, ANTHRO_LOOK } from '../deepheart/anthro'
import {
  CHARACTERS,
  ROLES,
  SUPPORTS,
  character,
  pairKey,
} from '../deepheart/roster'
import { DEEPHEART_ART_IDS, deepheartArtSrc } from '../deepheart/renderedArt'
import { bossBattleArt, encounterArt, enemyArt } from '../deepheart/art'
import {
  DEEPHEART_APPROVED_ART_MODELS,
  DEEPHEART_STYLE_DESIGNER,
  DEEPHEART_STYLE_LANES,
  DEEPHEART_STYLE_SUBJECTS,
  deepheartStyleLaneFromRequest,
} from '../deepheart/styleCheck'
import { CUSTOM_HERO_ID, CUSTOM_STAT_POINTS } from '../deepheart/types'
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

// Every ordinary enemy must be reachable through an actual seeded fight door.
assert.equal(Object.keys(ENEMIES).length, 40, 'forty distinct enemies')
assert.equal(new Set(Object.values(ENEMIES).map((e) => e.name)).size, 40)
assert.equal(new Set(Object.values(ENEMIES).map((e) => e.look)).size, 40)
const ordinaryEnemies = LAYERS.flatMap((layer) => layer.enemies)
assert.equal(new Set(ordinaryEnemies).size, 36)
assert.deepEqual(
  [...ordinaryEnemies, ...LAYERS.map((layer) => layer.boss), 'mimic'].sort(),
  Object.keys(ENEMIES).sort(),
)
for (const layer of LAYERS) {
  assert.equal(layer.enemies.length, 12)
  const seen = new Set<string>()
  for (let seed = 1; seed <= 256; seed++) {
    const run = createRun(hero('idris'), ['brannoc', 'fen'], seed * 104729)
    run.layer = layer.id
    run.rooms = [[{ kind: 'fight', known: true }]]
    chooseDoor(run, 0)
    assert.ok(run.combat)
    for (const enemy of run.combat.enemies) {
      assert.ok(layer.enemies.includes(enemy.id))
      seen.add(enemy.id)
    }
  }
  assert.deepEqual([...seen].sort(), [...layer.enemies].sort())
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

// ── Delivered-art registry contract ──────────────────────────────────────
assert.ok(
  CHARACTERS.every((c) => deepheartArtSrc(`cast:${c.id}`)),
  'every preset has a mapped approved animal-folk portrait',
)
assert.deepEqual(
  Object.keys(DEEPHEART.achievementArt ?? {}).sort(),
  Object.values(DH_ACHIEVEMENT_CODES).sort(),
)
for (const code of Object.values(DH_ACHIEVEMENT_CODES)) {
  assert.ok(deepheartArtSrc(`achievement:${code}`))
  assert.equal(
    DEEPHEART.achievementArt?.[code],
    deepheartArtSrc(`achievement:${code}`),
  )
}
assert.equal(new Set(Object.values(DEEPHEART.achievementArt ?? {})).size, 20)
for (const [enemy, key] of [
  ['warden', 'cast:bone-warden'],
  ['brine', 'cast:mother-brine'],
  ['king', 'cast:hollow-king'],
  ['mimic', 'moment:mimic'],
] as const) {
  assert.ok(enemyArt(enemy)?.src)
  assert.equal(enemyArt(enemy)?.src, deepheartArtSrc(key))
}
assert.equal(enemyArt('not-an-enemy'), undefined)
const bestiarySources = Object.keys(ENEMIES).map((id) => enemyArt(id)?.src)
assert.equal(bestiarySources.length, 40)
assert.ok(bestiarySources.every(Boolean))
assert.equal(new Set(bestiarySources).size, 40)
const guardianPlates = LAYERS.map((layer) => bossBattleArt(layer.boss)?.src)
assert.equal(guardianPlates.length, 3)
assert.ok(guardianPlates.every(Boolean))
assert.equal(new Set(guardianPlates).size, 3)
assert.ok(guardianPlates.every((src) => !bestiarySources.includes(src)))
assert.equal(bossBattleArt('mimic'), undefined)
const nonCourtEvents = [
  ...EVENTS.filter((event) => !event.id.startsWith('fairy-')),
  ...UNDERCITY_EVENTS,
]
const nonCourtArt = new Map(
  nonCourtEvents.map((event) => [event.id, encounterArt(event)?.src]),
)
assert.equal(nonCourtArt.size, 21)
assert.ok([...nonCourtArt.values()].every(Boolean))
assert.equal(new Set(nonCourtArt.values()).size, 21)
assert.ok(deepheartArtSrc('premise'), 'title art is mapped')
assert.ok(deepheartArtSrc('room:fight'), 'fight art is mapped')
const endingArt = DEEPHEART.endings.map((ending) => ending.art.src)
assert.ok(endingArt.every(Boolean))
assert.equal(new Set(endingArt).size, DEEPHEART.endings.length)
assert.ok(DEEPHEART.cast.every((member) => member.portrait.src))
const scrapbookSources = DEEPHEART.moments.map((moment) => moment.art.src)
assert.ok(scrapbookSources.every(Boolean), 'every scrapbook plate is wired')
assert.equal(new Set(scrapbookSources).size, DEEPHEART.moments.length)
assert.equal(DEEPHEART_ART_IDS['moment:full-party'], 280883)
assert.equal(
  DEEPHEART.moments.find((moment) => moment.id === 'full-party')?.art.src,
  deepheartArtSrc('moment:full-party'),
)
assert.ok(!Object.values(DEEPHEART_ART_IDS).includes(273876))
for (const id of ['hollow-king', 'bone-warden', 'mother-brine', 'vesper']) {
  const member = DEEPHEART.cast.find((entry) => entry.id === id)
  assert.ok(member?.portrait.src, `boss portrait ${id} is wired`)
  assert.equal(member.portrait.src, deepheartArtSrc(`cast:${id}`))
}
for (const id of [
  'drowned-crown',
  'lantern-seed',
  'keystone',
  'duo',
  'warden-falls',
  'brine-falls',
]) {
  const moment = DEEPHEART.moments.find((entry) => entry.id === id)
  assert.ok(moment?.art.src, `scrapbook plate ${id} is wired`)
  assert.equal(moment.art.src, deepheartArtSrc(`moment:${id}`))
}

assert.ok(
  Object.keys(DEEPHEART_ART_IDS).filter((key) =>
    key.startsWith('moment:romance-'),
  ).length >= 40,
  'normal romance art is mapped',
)
assert.ok(
  Object.keys(DEEPHEART_ART_IDS).every(
    (key) => !key.includes('private-romance') && !key.includes('after-hours'),
  ),
  'private mature art is never part of the normal art registry',
)
// The 2026-11-16 ending plates (ArtImages 273934-273942) predate the anthro
// canon and depict human delvers; every ending must use the anthro repaint.
for (const ending of DEEPHEART.endings) {
  const id = DEEPHEART_ART_IDS[`ending:${ending.id}`]
  assert.ok(id, `ending ${ending.id} has painted art`)
  assert.ok(
    id < 273934 || id > 273942,
    `ending ${ending.id} does not use a pre-anthro plate`,
  )
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

// ── Player-earned relationship knowledge must govern party-planner hints ─
const undiscovered = { supports: [], romances: [], values: {} }
const hiddenScore = scoreParty(
  hero('corso'),
  ['idris'],
  'balanced',
  undiscovered,
)
assert.ok(
  !hiddenScore.lines.some(
    (line) => line.label === 'Old Flame' || /possible romance/.test(line.label),
  ),
  'the optimizer must not spoil old relationships or compatibility',
)
const discoveredScore = scoreParty(hero('corso'), ['idris'], 'balanced', {
  supports: ['corso+idris'],
  romances: ['idris'],
  values: {},
})
assert.ok(
  discoveredScore.lines.some((line) => line.label === 'Old Flame'),
  'a support scene should unlock the corresponding planner bonus',
)
assert.ok(
  discoveredScore.lines.some((line) => /possible romance/.test(line.label)),
  'a completed romance can be used for future party planning',
)
assert.ok(
  discoveredScore.total > hiddenScore.total,
  'earned knowledge changes recommendations, without changing combat rules',
)
assert.ok(
  optimizeParty(hero('corso'), 'balanced', 3, [1, 2], undiscovered).every(
    (party) =>
      party.lines.every(
        (line) =>
          !SUPPORTS.some((support) => support.name === line.label) &&
          !/possible romance/.test(line.label),
      ),
  ),
  'optimizer suggestions must respect the same discovery barrier',
)
const discoveredChronicle = decodeChronicle(
  JSON.stringify({
    ...emptyChronicle(),
    supports: ['corso+idris'],
    romances: ['idris'],
    values: { idris: ['kind'] },
  }),
)
assert.deepEqual(discoveredChronicle?.values.idris, ['kind'])
assert.deepEqual(discoveredChronicle?.romances, ['idris'])
const romanceScene = DEEPHEART.moments.find(
  (moment) => moment.id === romanceMoment('idris'),
)
assert.ok(
  romanceScene?.art.src,
  'a romance unlock must have its actual painted scene for the delve',
)
const oldFlameMoment = DEEPHEART.moments.find(
  (moment) => moment.id === SUPPORT_MOMENTS['corso+idris'],
)
assert.deepEqual(
  [...(oldFlameMoment?.about ?? [])].sort(),
  ['corso', 'idris'],
  'the support moment must name both companions for illustrated fallback',
)

// ── Campfire narrative: earned second supports and three-beat promises ───
assert.equal(SUPPORTS.length, 35, 'all support pairs are accounted for')
assert.equal(Object.keys(SUPPORT_MOMENTS).length, SUPPORTS.length)
assert.equal(new Set(Object.values(SUPPORT_MOMENTS)).size, SUPPORTS.length)
const supportArt = Object.values(SUPPORT_MOMENTS).map((id) =>
  deepheartArtSrc(`moment:${id}`),
)
assert.ok(supportArt.every(Boolean), 'all support scenes have paintings')
assert.equal(new Set(supportArt).size, SUPPORTS.length)
for (const support of SUPPORTS) {
  const key = pairKey(support.a, support.b)
  const id = SUPPORT_MOMENTS[key]!
  const moment = DEEPHEART.moments.find((entry) => entry.id === id)
  assert.ok(moment, `missing scrapbook entry for ${key}`)
  assert.equal(moment.art.src, deepheartArtSrc(`moment:${id}`))
  assert.deepEqual([...moment.about].sort(), [support.a, support.b].sort())
  const romantic = support.kind === 'lovers' || support.kind === 'exes'
  assert.equal(moment.kind, romantic ? 'romance' : 'follower')
  const run = createRun(hero(support.a), [support.b], 1472)
  run.phase = 'camp'
  run.camp = { talks: 2, supportScenes: [] }
  assert.ok(!run.moments.includes(id), 'support must be earned')
  const choice = campOptions(run).find(
    (option) => option.kind === 'support' && option.key === key,
  )
  assert.ok(choice && choice.kind === 'support')
  assert.equal(choice.tier, 1)
  assert.equal(
    campOptions(run, false).some(
      (option) => option.kind === 'support' && option.key === key,
    ),
    !romantic,
  )
  if (romantic) {
    assert.equal(campAction(run, choice, false), '')
    assert.ok(!run.moments.includes(id))
  }
  assert.equal(campAction(run, choice), support.scene)
  assert.equal(run.moments.filter((entry) => entry === id).length, 1)
  assert.equal(campAction(run, choice), '')
  assert.equal(run.moments.filter((entry) => entry === id).length, 1)
}
assert.deepEqual(
  Object.keys(SUPPORT_SEQUELS).sort(),
  SUPPORTS.map((s) => pairKey(s.a, s.b)).sort(),
  'all 35 support pairs have a unique keyed second scene',
)
assert.equal(
  new Set(Object.values(SUPPORT_SEQUELS)).size,
  SUPPORTS.length,
  'the second support scenes are individually authored',
)
assert.ok(
  Object.values(SUPPORT_SEQUELS).every((line) => line.length > 65),
  'second-tier dialogue must be a real story beat',
)

const supportRun = createRun(hero('idris'), ['corso'], 1471)
supportRun.phase = 'camp'
supportRun.camp = { talks: 2, supportScenes: [] }
const oldFlameKey = pairKey('corso', 'idris')
const firstSupport = campOptions(supportRun).find(
  (option) => option.kind === 'support' && option.key === oldFlameKey,
)
assert.ok(firstSupport && firstSupport.kind === 'support')
assert.equal(firstSupport.tier, 1)
assert.doesNotMatch(
  firstSupport.label,
  /Old Flame/,
  'unknown bond stays secret',
)
assert.ok(
  !campOptions(supportRun, false).some(
    (option) => option.kind === 'support' && option.key === oldFlameKey,
  ),
  'romance-off also hides lovers and exes support scenes',
)
assert.equal(campSceneMoment(supportRun, firstSupport, ''), null)
const refusedSupport = campAction(supportRun, firstSupport, false)
assert.equal(refusedSupport, '')
assert.equal(campSceneMoment(supportRun, firstSupport, refusedSupport), null)
const beforeSupport = stat(supportRun, 'idris', 'atk')
const firstLine = campAction(supportRun, firstSupport)
assert.equal(firstLine, firstSupport.line)
assert.equal(
  campSceneMoment(supportRun, firstSupport, firstLine),
  SUPPORT_MOMENTS[oldFlameKey],
)
assert.equal(supportRun.bonds[oldFlameKey], 1)
assert.ok(stat(supportRun, 'idris', 'atk') > beforeSupport)
assert.ok(
  !campOptions(supportRun).some(
    (option) => option.kind === 'support' && option.key === oldFlameKey,
  ),
  'one support scene per pair per campfire',
)
supportRun.camp = { talks: 2, supportScenes: [] }
supportRun.affinity.corso = 5
const secondSupport = campOptions(supportRun).find(
  (option) => option.kind === 'support' && option.key === oldFlameKey,
)
assert.ok(secondSupport && secondSupport.kind === 'support')
assert.equal(secondSupport.tier, 2)
assert.match(secondSupport.label, /Old Flame/)
const earnedMoments = [...supportRun.moments]
const secondLine = campAction(supportRun, secondSupport)
assert.equal(secondLine, SUPPORT_SEQUELS[oldFlameKey])
assert.equal(
  campSceneMoment(supportRun, secondSupport, secondLine),
  SUPPORT_MOMENTS[oldFlameKey],
)
assert.deepEqual(supportRun.moments, earnedMoments)
const staleLine = campAction(supportRun, secondSupport)
assert.equal(staleLine, '')
assert.equal(campSceneMoment(supportRun, secondSupport, staleLine), null)
assert.equal(supportRun.bonds[oldFlameKey], 2)
assert.ok(
  !campOptions(supportRun).some(
    (option) => option.kind === 'support' && option.key === oldFlameKey,
  ),
  'completed two-stage supports cannot be farmed for extra stats',
)

const arcRun = createRun(hero('corso'), ['idris'], 1472)
arcRun.phase = 'camp'
arcRun.camp = { talks: 2, supportScenes: [] }
assert.ok(canRomance(arcRun.hero, 'idris', arcRun.companions))
assert.equal(
  campAction(arcRun, {
    kind: 'romance',
    id: 'idris',
    label: 'Forged confession',
    line: '',
  }),
  '',
  'a forged choice cannot skip required conversations',
)
for (let i = 0; i < 2; i++) {
  const talk = campOptions(arcRun).find(
    (option) => option.kind === 'talk' && option.id === 'idris',
  )
  assert.ok(talk && talk.kind === 'talk')
  const line = campAction(arcRun, talk)
  assert.equal(
    line,
    i === 0 ? character('idris').blurb : character('idris').secret,
  )
  assert.equal(arcRun.talkBeats?.idris, i + 1)
}
assert.equal(arcRun.affinity.idris, 8)
const savedArc = decodeSaves(
  JSON.stringify({
    version: 1,
    slots: [
      {
        slot: 'auto',
        savedAt: '2026-11-23T00:00:00Z',
        label: 'Campfire',
        run: arcRun,
      },
    ],
  }),
)
assert.equal(savedArc?.slots[0]?.run.talkBeats?.idris, 2)
arcRun.camp = { talks: 2, supportScenes: [] }
const romanceChoice = campOptions(arcRun).find(
  (option) => option.kind === 'romance' && option.id === 'idris',
)
assert.ok(romanceChoice && romanceChoice.kind === 'romance')
assert.doesNotMatch(
  romanceChoice.line,
  /kiss|love|heart/i,
  'commitment preview must not spoil the romantic payoff',
)
const noRomanceRun = JSON.parse(JSON.stringify(arcRun)) as RunState
assert.ok(
  !campOptions(noRomanceRun, false).some((option) => option.kind === 'romance'),
)
assert.equal(
  campAction(noRomanceRun, romanceChoice, false),
  '',
  'the romance-off setting also protects engine actions',
)
const oathChoice = campOptions(noRomanceRun, false).find(
  (option) => option.kind === 'oath' && option.id === 'idris',
)
assert.ok(oathChoice && oathChoice.kind === 'oath')
assert.notEqual(
  campAction(noRomanceRun, oathChoice, false),
  character('idris').heart,
)
assert.ok(noRomanceRun.oaths.includes('idris'))
assert.ok(!noRomanceRun.partners.includes('idris'))
assert.ok(!noRomanceRun.moments.includes(romanceMoment('idris')))
assert.equal(campAction(arcRun, romanceChoice), character('idris').heart)
assert.ok(arcRun.partners.includes('idris'))
assert.ok(arcRun.moments.includes(romanceMoment('idris')))

// ── Original delvers and meaningful party ability checks ────────────────
const customHero: HeroSetup = {
  presetId: CUSTOM_HERO_ID,
  name: 'Copper',
  gender: 'n',
  drawnTo: ['w', 'n'],
  boon: 'wit',
  custom: {
    role: 'scholar',
    appearance: 'Adult copper-furred otter with a scar and green cloak',
    points: { wit: 2, def: 1, hp: 1 },
  },
}
assert.equal(
  Object.values(customHero.custom!.points).reduce((sum, n) => sum + n, 0),
  CUSTOM_STAT_POINTS,
)
assert.equal(roleFor(CUSTOM_HERO_ID, customHero), 'scholar')
assert.equal(
  baseStat(CUSTOM_HERO_ID, 'wit', customHero),
  ROLES.scholar.base.wit + 3 + 4,
)
assert.equal(
  baseStat(CUSTOM_HERO_ID, 'hp', customHero),
  ROLES.scholar.base.hp + 6,
)
const customBest = optimizeParty(customHero, 'balanced', 1)[0]!
assert.equal(customBest.companions.length, 3)
assert.ok(CHARACTERS.some((c) => c.id === customBest.companions[0]))
const customStart = createRun(customHero, customBest.companions, 67890)
assert.equal(customStart.party[0]?.id, CUSTOM_HERO_ID)
assert.equal(customStart.hero.custom?.role, 'scholar')
assert.equal(
  recordStart(emptyChronicle(), customStart).met.includes(CUSTOM_HERO_ID),
  false,
)
assert.equal(
  JSON.stringify(autoplay(createRun(customHero, ['idris', 'hesk'], 9981))),
  JSON.stringify(autoplay(createRun(customHero, ['idris', 'hesk'], 9981))),
)
const customSaved = decodeSaves(
  JSON.stringify({
    version: 1,
    slots: [
      {
        slot: 'auto',
        savedAt: '2026-11-17',
        label: 'Copper',
        run: customStart,
      },
    ],
  }),
)
assert.equal(customSaved?.slots[0]?.run.hero.custom?.role, 'scholar')
assert.equal(customSaved?.slots[0]?.run.hero.custom?.points.wit, 2)
const loneScholar = createRun(customHero, ['brannoc'], 101)
const studyGroup = createRun(customHero, ['aurel', 'hesk', 'brannoc'], 101)
assert.ok(
  abilityModifier(studyGroup, 'wit') > abilityModifier(loneScholar, 'wit'),
  'qualified companions contribute to checks beyond the best individual',
)

// ── Doing good should cost something even when checks fail ──────────────
const school = createRun(hero('idris'), ['brannoc'], 44)
school.phase = 'choice'
school.room = { kind: 'choice', known: true, event: 'ossuary-night-school' }
school.gold = 20
chooseOption(school, 'petition')
assert.equal(school.gold <= 10, true, 'the filing fee is paid before rolling')
assert.equal(
  school.sacrifices,
  1,
  'the attempted sacrifice counts on failure too',
)
assert.ok(school.choices.includes('ossuary-night-school:petition'))
const depleted = createRun(hero('idris'), ['brannoc'], 45)
depleted.phase = 'choice'
depleted.room = { kind: 'choice', known: true, event: 'goblin-snare' }
depleted.party.forEach((member) => {
  member.hp = 1
})
chooseOption(depleted, 'free')
assert.equal(
  depleted.sacrifices,
  0,
  'a sacrifice must actually consume resources, not merely ask for them',
)
const endingGate = createRun(hero('thessaly'), ['brannoc', 'hesk'], 55)
endingGate.phase = 'finale'
endingGate.mercy = 5
endingGate.sacrifices = 1
assert.ok(!finaleOptions(endingGate).some((o) => o.ending === 'redemption'))
endingGate.sacrifices = 2
assert.ok(finaleOptions(endingGate).some((o) => o.ending === 'redemption'))

const gildedGate = createRun(hero('vex'), ['nettle', 'moss'], 56)
gildedGate.phase = 'finale'
gildedGate.gold = 600
assert.ok(
  !finaleOptions(gildedGate).some((o) => o.ending === 'gilded'),
  'ordinary treasure alone cannot buy the Gilded ending',
)
const greedyEvent = EVENTS.find((e) =>
  e.options.some((o) => o.tag === 'greedy'),
)!
const greedyOption = greedyEvent.options.find((o) => o.tag === 'greedy')!
gildedGate.choices.push(`${greedyEvent.id}:${greedyOption.id}`)
assert.ok(finaleOptions(gildedGate).some((o) => o.ending === 'gilded'))
gildedGate.gold = 599
assert.ok(
  !finaleOptions(gildedGate).some((o) => o.ending === 'gilded'),
  'a greedy choice does not replace the wealth requirement',
)
const secularMercy = createRun(hero('vex'), ['nettle', 'moss'], 57)
secularMercy.phase = 'finale'
secularMercy.sacrifices = 2
secularMercy.mercy = 2
assert.ok(!finaleOptions(secularMercy).some((o) => o.ending === 'redemption'))
secularMercy.mercy = 3
assert.ok(
  finaleOptions(secularMercy).some((o) => o.ending === 'redemption'),
  'a non-holy party can earn Redemption through additional mercy',
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

type SurvivalCount = { survived: number; total: number }
const survivalBySize = new Map<number, SurvivalCount>()
const survivalByRole = new Map<string, SurvivalCount>()
const survivalByCombination = new Map<string, SurvivalCount>()

function countSurvival<K>(
  counts: Map<K, SurvivalCount>,
  key: K,
  survived: boolean,
) {
  const count = counts.get(key) ?? { survived: 0, total: 0 }
  count.total++
  if (survived) count.survived++
  counts.set(key, count)
}

// Cross every preset with every legal party size and two distinct seeds.
// Keep the original 60-run regression unchanged for historical comparison.
for (const [index, lead] of CHARACTERS.entries()) {
  const pool = ids.filter((id) => id !== lead.id)
  for (const size of [1, 2, 3]) {
    for (let trial = 0; trial < 2; trial++) {
      const seed = (index * 6 + (size - 1) * 2 + trial + 1) * 104729
      const offset = (index * 7 + trial * 19 + size * 11) % pool.length
      const companions = Array.from(
        { length: size },
        (_, slot) => pool[(offset + slot * 13) % pool.length]!,
      )
      const run = autoplay(createRun(hero(lead.id), companions, seed))
      assert.equal(run.phase, 'ended', `balance seed ${seed} terminates`)
      assert.ok(run.ending, `balance seed ${seed} has an ending`)
      const survived = run.ending !== 'fallen'
      countSurvival(survivalBySize, size + 1, survived)
      countSurvival(survivalByRole, lead.role, survived)
      countSurvival(survivalByCombination, `${size + 1}:${lead.role}`, survived)
    }
  }
}

assert.equal(survivalBySize.size, 3)
for (const count of survivalBySize.values()) assert.equal(count.total, 100)
assert.equal(survivalByRole.size, Object.keys(ROLES).length)

function printSurvival<K>(label: string, counts: Map<K, SurvivalCount>) {
  for (const [key, count] of counts) {
    const percent = ((100 * count.survived) / count.total).toFixed(1)
    console.log(
      `Deepheart balance ${label} ${key}: ${count.survived}/${count.total} (${percent}%)`,
    )
  }
}

printSurvival('party', survivalBySize)
printSurvival('role', survivalByRole)
printSurvival('party-role', survivalByCombination)

// The original matrix is the calibration target. A distinct seed and party
// sample provides an additional check against tuning only these 300 delves.
const holdoutSurvival = new Map<number, SurvivalCount>()
for (const [index, lead] of CHARACTERS.entries()) {
  const pool = ids.filter((id) => id !== lead.id)
  for (const size of [1, 2, 3]) {
    for (let trial = 0; trial < 2; trial++) {
      const seed = (index * 6 + (size - 1) * 2 + trial + 1) * 130363 + 17
      const offset = (index * 17 + trial * 23 + size * 5) % pool.length
      const companions = Array.from(
        { length: size },
        (_, slot) => pool[(offset + slot * 19) % pool.length]!,
      )
      const run = autoplay(createRun(hero(lead.id), companions, seed))
      assert.equal(run.phase, 'ended', `holdout seed ${seed} terminates`)
      assert.ok(run.ending, `holdout seed ${seed} has an ending`)
      countSurvival(holdoutSurvival, size + 1, run.ending !== 'fallen')
    }
  }
}
printSurvival('holdout-party', holdoutSurvival)

for (const [size, count] of survivalBySize) {
  assert.ok(
    count.survived >= 75 && count.survived <= 85,
    `party ${size} survival ${count.survived}/100 is outside 75-85%`,
  )
}
for (const [size, count] of holdoutSurvival) {
  assert.equal(count.total, 100)
  assert.ok(
    count.survived >= 70 && count.survived <= 90,
    `holdout party ${size} survival ${count.survived}/100 is outside 70-90%`,
  )
}

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
        const choseGreed = r.choices.some((choice) =>
          EVENTS.some((e) =>
            e.options.some(
              (o) => o.tag === 'greedy' && choice === `${e.id}:${o.id}`,
            ),
          ),
        )
        if (!choseGreed) {
          const temptation = list.findIndex((d) =>
            EVENTS.find((e) => e.id === d.event)?.options.some(
              (o) => o.tag === 'greedy',
            ),
          )
          if (temptation >= 0) return temptation
        }
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
        const greedy = options.filter((o) => o.tag === 'greedy')
        const gold = [...(greedy.length ? greedy : options)].sort(
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
const customScout = createRun(
  {
    ...customHero,
    custom: { ...customHero.custom!, role: 'ranger' },
  },
  ['vex', 'nettle', 'moss'],
  7,
)
assert.ok(
  achievementsProven(book, customScout).includes(
    DH_ACHIEVEMENT_CODES.perfectParty,
  ),
  'an original ranger earns the same synergies as the preset ranger',
)
const customWarrior = createRun(
  {
    ...customHero,
    custom: { ...customHero.custom!, role: 'warrior' },
  },
  ['vex', 'nettle', 'moss'],
  7,
)
assert.ok(
  !achievementsProven(book, customWarrior).includes(
    DH_ACHIEVEMENT_CODES.perfectParty,
  ),
  'the same companions do not grant ranger synergies to a warrior',
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

// ── Private visual-direction trial ──────────────────────────────────────
assert.equal(DEEPHEART_APPROVED_ART_MODELS.standard.lane, 'krea2')
assert.equal(DEEPHEART_APPROVED_ART_MODELS.standard.engine, 'krea2')
assert.equal(DEEPHEART_APPROVED_ART_MODELS.afterHours.lane, 'furrytoon')
assert.equal(DEEPHEART_APPROVED_ART_MODELS.afterHours.engine, 'comfy')
assert.equal(
  DEEPHEART_APPROVED_ART_MODELS.afterHours.checkpoint,
  'Illustrious/furrytoonmix_xlV3.safetensors',
)
assert.equal(DEEPHEART_APPROVED_ART_MODELS.afterHours.requiresMatureOptIn, true)
assert.equal(
  DEEPHEART_APPROVED_ART_MODELS.afterHours.requiresUnlockedRomance,
  true,
)
assert.equal(DEEPHEART_STYLE_SUBJECTS.length, 5, 'five fixed visual tests')
assert.equal(
  DEEPHEART_STYLE_LANES.length,
  8,
  'seven Illustrious models plus Krea 2',
)
assert.equal(new Set(DEEPHEART_STYLE_SUBJECTS.map((s) => s.seed)).size, 5)
assert.equal(new Set(DEEPHEART_STYLE_LANES.map((lane) => lane.key)).size, 8)
assert.equal(
  DEEPHEART_STYLE_LANES.filter((lane) => lane.family === 'Illustrious').length,
  7,
)
assert.ok(DEEPHEART_STYLE_DESIGNER.startsWith('Deepheart Anthro Style Trial'))
assert.equal(
  deepheartStyleLaneFromRequest('conductor:ledger:deepheart@krea2=abc', ''),
  'krea2',
)
assert.equal(
  deepheartStyleLaneFromRequest('conductor:ledger:deepheart@arthemy=abc', ''),
  'arthemy',
)
assert.equal(
  deepheartStyleLaneFromRequest(
    '',
    'Illustrious/furrytoonmix_xlV3.safetensors',
  ),
  'furrytoon',
)
assert.match(
  readFileSync('components/deepheart/deepheart-title.vue', 'utf8'),
  /user\.isAdmin && user\.showMature/,
)
// A nested Admin route must carry its own tutorial, not silently borrow the
// previously viewed tab (for example ArtJob Queue).
const readAdminTab = (name: string): ChannelContentItem => {
  const source = readFileSync(`content/channels/admin/${name}.md`, 'utf8')
  return parseYaml(source.split('---')[1] ?? '') as ChannelContentItem
}
const artBibleTab = readAdminTab('deepheart-bible')
assert.equal(
  artBibleTab.navigation,
  false,
  'private art bible stays out of nav',
)
assert.equal(artBibleTab.requiredRole, 'ADMIN')
assert.equal(artBibleTab.image, deepheartArtSrc('cast:oona'))
assert.equal(artBibleTab.tutorial?.title, 'Deepheart Art Bible')
assert.match(artBibleTab.tutorial?.body ?? '', /Model comparison/)
const adminTabs = resolveChannels([
  {
    contentType: 'channel',
    channelKey: 'admin',
    label: 'Admin',
    route: '/artjob',
    defaultTab: 'artjob',
  },
  readAdminTab('artjob'),
  readAdminTab('deepheart'),
  artBibleTab,
])
const selectedHelp = resolveChannelLocation(adminTabs, {
  path: '/admin/deepheart/bible',
})
assert.equal(selectedHelp?.tab?.tabKey, 'deepheart-bible')
assert.equal(selectedHelp?.tab?.tutorial?.title, 'Deepheart Art Bible')
assert.notEqual(
  selectedHelp?.tab?.tutorial?.title,
  resolveChannelLocation(adminTabs, { path: '/artjob' })?.tab?.tutorial?.title,
  'nested Deepheart help must never resolve to the ArtJob Queue',
)
assert.equal(
  resolveChannelLocation(adminTabs, { path: '/admin/deepheart' })?.tab?.tabKey,
  'deepheart',
  'the playable game keeps its separate how-to-delve tutorial',
)
const bibleSource = readFileSync('pages/admin/deepheart/bible.vue', 'utf8')
assert.match(bibleSource, /user\.isAdmin && user\.showMature/)
assert.match(bibleSource, /data-testid="deepheart-art-bible"/)
assert.match(bibleSource, /loadJobImage/)
assert.match(bibleSource, /dh-approved-models/)
const styleRoute = readFileSync(
  'server/api/deepheart/style-check.get.ts',
  'utf8',
)
assert.match(styleRoute, /requireAdminApiUser/)
assert.match(styleRoute, /viewerShowsMature/)
assert.match(styleRoute, /private, no-store/)

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
const deepheartPage = readFileSync('pages/admin/deepheart/index.vue', 'utf8')
assert.match(
  deepheartPage,
  /<PlaybookKitShell :spec="deepheart" :meter-values="dh\.meterValues">/,
)
assert.doesNotMatch(
  deepheartPage,
  /<NuxtPage\b/,
  'the game and art bible should be sibling routes, not nested pages',
)
assert.match(
  readFileSync('stores/deepheartStore.ts', 'utf8'),
  /rewardAchievementByCode/,
)

// ── The human-faced fairy court: seeded, optional, and scrapbook-backed ──
assert.equal(COURT_DEITIES.length, 12)
assert.equal(COURT_LINKS.length, 32)
assert.equal(new Set(COURT_DEITIES.map((deity) => deity.id)).size, 12)
for (const layer of [0, 1, 2])
  assert.equal(
    COURT_DEITIES.filter((deity) => deity.layer === layer).length,
    4,
    `four gods inhabit depth ${layer + 1}`,
  )
assert.equal(DEEPHEART.reveals.length, 136, 'full court lore is accounted for')
assert.equal(
  EVENTS.filter((event) => event.id.startsWith('fairy-')).length,
  COURT_DEITIES.length,
)
assert.equal(UNDERCITY_EVENTS.length, 6)
for (const ev of [
  ...UNDERCITY_EVENTS,
  ...EVENTS.filter((e) => e.id.startsWith('fairy-')),
]) {
  assert.ok(
    ev.options.filter((option) => option.check).length >= 2,
    `${ev.id} offers at least two nonviolent dice checks`,
  )
  assert.ok(
    ev.options.some((option) => !option.check && !option.gamble),
    `${ev.id} offers an alternative to rolling`,
  )
}
for (const deity of COURT_DEITIES) {
  assert.ok(deity.look.includes('human-looking'))
  assert.equal(deity.immortal, true, `${deity.id} is deathless`)
  assert.ok(deity.mythicEcho.length > 5)
  assert.ok(deity.power.length > 45, `${deity.id} can rewrite reality`)
  assert.ok(deity.obsession.length > 40)
  assert.ok(deity.immortalTruth.length > 45)
  assert.ok(REVEAL_TEXT[`court-immortality-${deity.id}`])
  assert.deepEqual(
    Object.keys(deity.choices).sort(),
    [...COURT_CHOICE_KEYS].sort(),
  )
  assert.ok(DEEPHEART.cast.some((member) => member.id === `fairy-${deity.id}`))
  assert.ok(REVEAL_TEXT[`court-meet-${deity.id}`])
  for (const choice of COURT_CHOICE_KEYS) {
    assert.ok(
      COURT_LINKS.some((link) => link.id === deity.choices[choice].revealLink),
    )
    assert.ok(REVEAL_TEXT[`court-ending-${deity.id}-${choice}-success`])
    assert.ok(REVEAL_TEXT[`court-ending-${deity.id}-${choice}-failure`])
  }
}
for (const link of COURT_LINKS) {
  assert.ok(COURT_DEITIES.some((deity) => deity.id === link.from))
  assert.ok(COURT_DEITIES.some((deity) => deity.id === link.to))
  assert.ok(REVEAL_TEXT[link.id])
}
const courtFlowchart = readFileSync(
  'components/deepheart/deepheart-court-flowchart.vue',
  'utf8',
)
assert.match(courtFlowchart, /data-testid="dh-court-flowchart"/)
for (const deity of COURT_DEITIES)
  assert.ok(
    courtFlowchart.includes(`${deity.id}: { x:`),
    `court diagram has a distinct home for ${deity.id}`,
  )
assert.ok(courtFlowchart.includes('court-immortality-'))
assert.match(
  readFileSync('components/playbook-kit/playbook-kit-scrapbook.vue', 'utf8'),
  /DeepheartCourtFlowchart/,
)

for (const deity of COURT_DEITIES) {
  const play = (seed: number) => {
    const run = createRun(hero('idris'), ['brannoc', 'fen'], seed)
    run.rooms[0] = [{ kind: 'choice', known: true, event: `fairy-${deity.id}` }]
    chooseDoor(run, 0)
    assert.equal(run.phase, 'choice')
    assert.ok(run.reveals.includes(`court-meet-${deity.id}`))
    chooseOption(run, 'expose')
    assert.ok(run.log.some((line) => line.includes('d20 ')))
    run.phase = 'finale'
    chooseEnding(run, 'delver')
    assert.equal(run.phase, 'court')
    assert.ok(
      courtOptions(run).some((choice) => choice.id === `audience:${deity.id}`),
    )
    chooseCourtOption(run, `audience:${deity.id}`)
    for (const choice of COURT_CHOICE_KEYS) {
      assert.ok(
        courtOptions(run).some((option) => option.id === `resolve:${choice}`),
      )
    }
    chooseCourtOption(run, 'resolve:defy')
    assert.ok(
      run.reveals.includes(`court-immortality-${deity.id}`),
      'last audience unlocks the immortality revelation',
    )
    assert.equal(run.phase, 'ended')
    assert.equal(run.ending, 'delver')
    assert.equal(run.courtOutcome?.deity, deity.id)
    assert.equal(run.courtOutcome?.path, 'defy')
    assert.ok(run.courtOutcome!.die >= 1 && run.courtOutcome!.die <= 20)
    assert.ok(
      run.reveals.includes(
        `court-ending-${deity.id}-defy-${run.courtOutcome!.success ? 'success' : 'failure'}`,
      ),
    )
    return {
      outcome: run.courtOutcome,
      reveals: run.reveals,
      choices: run.choices,
    }
  }
  assert.deepEqual(play(743), play(743), `${deity.id} is seed-replayable`)
}
{
  const run = createRun(hero('idris'), ['brannoc'], 159)
  const check = rollAbilityCheck(run, 'wit', 14)
  assert.ok(check.die >= 1 && check.die <= 20)
  assert.equal(check.total, check.die + check.modifier)
  run.phase = 'finale'
  chooseEnding(run, 'delver')
  assert.equal(
    run.phase,
    'ended',
    'an unmet court does not interrupt the finale',
  )
}

// One peaceful attempt per ordinary fight; no free rerolls on save/resume.
{
  const fight = (seed: number) => {
    const run = createRun(hero('idris'), ['brannoc'], seed)
    run.room = { kind: 'fight', known: true }
    startFight(run, ['cutthroat'])
    attemptParley(run)
    const first = {
      phase: run.phase,
      log: [...run.log],
      rng: run.rng,
      mercy: run.mercy,
      hp: run.party.map((member) => member.hp),
    }
    attemptParley(run)
    assert.equal(run.rng, first.rng, 'a second parley cannot reroll')
    assert.deepEqual(run.log, first.log, 'failed parley cannot be spammed')
    return first
  }
  assert.deepEqual(fight(106), fight(106))
  assert.match(
    readFileSync('components/deepheart/deepheart-fight.vue', 'utf8'),
    /data-testid="dh-parley"/,
  )
}

console.log(
  `Deepheart: 50 presets, ${SUPPORTS.length} supports, 60 seeded delves (${finished} survived), all ${ALL_ENDINGS.length} endings reachable (${Object.entries(
    reached,
  )
    .map(([e, s]) => `${e}@${s}`)
    .join(' ')}), ${catalog.length} achievements.`,
)

const archiveRun = createRun(hero('idris'), ['brannoc'], 481)
const archiveSlot = {
  slot: 'auto',
  savedAt: '2026-11-25T00:00:00.000Z',
  label: 'Idris',
  run: archiveRun,
}
const archive = {
  kind: 'deepheart',
  version: 1,
  chronicle: recordStart(emptyChronicle(), archiveRun),
  saves: { version: 1, slots: [archiveSlot] },
}
assert.deepEqual(parseDeepheartBackup(JSON.stringify(archive)), archive)
const kitArchive = {
  ...archive,
  kit: {
    version: 1,
    settings: { ...DEFAULT_KIT_SETTINGS, sound: 'off', textSize: 'large' },
    progress: {
      moments: { campfire: '2026-11-25T00:00:00.000Z' },
      reveals: { gate: '2026-11-25T00:00:00.000Z' },
      endings: { fallen: '2026-11-25T00:00:00.000Z' },
      trailerSeen: true,
    },
  },
}
assert.deepEqual(parseDeepheartBackup(JSON.stringify(kitArchive)), kitArchive)
assert.throws(() =>
  parseDeepheartBackup(
    JSON.stringify({ ...kitArchive, kit: { ...kitArchive.kit, version: 99 } }),
  ),
)
assert.throws(() =>
  parseDeepheartBackup(
    JSON.stringify({
      ...kitArchive,
      kit: {
        ...kitArchive.kit,
        progress: { ...kitArchive.kit.progress, moments: { campfire: 42 } },
      },
    }),
  ),
)
assert.match(
  readFileSync('stores/deepheartStore.ts', 'utf8'),
  /kit\(\)\.accountSnapshot\('deepheart'\)/,
)
assert.match(
  readFileSync('stores/deepheartStore.ts', 'utf8'),
  /kit\(\)\.restoreAccount\('deepheart', backup\.kit\)/,
)
assert.throws(() =>
  parseDeepheartBackup(JSON.stringify({ ...archive, version: 99 })),
)
assert.throws(() =>
  parseDeepheartBackup(
    JSON.stringify({
      ...archive,
      saves: { version: 1, slots: [archiveSlot, archiveSlot] },
    }),
  ),
)
assert.throws(() =>
  parseDeepheartBackup(
    JSON.stringify({
      ...archive,
      saves: {
        version: 1,
        slots: [{ ...archiveSlot, run: { version: 1 } }],
      },
    }),
  ),
)
assert.throws(() =>
  parseDeepheartBackup(
    JSON.stringify({ ...archive, chronicle: { version: 1 } }),
  ),
)
for (const method of ['get', 'put']) {
  const route = readFileSync(
    `server/api/deepheart/account-save.${method}.ts`,
    'utf8',
  )
  assert.match(route, /requireHumanApiUser\(event\)/)
  assert.match(route, /user\.id/)
  assert.match(route, /parseDeepheartBackup/)
  assert.match(route, /private, no-store/)
}
assert.match(
  readFileSync('server/api/deepheart/account-save.put.ts', 'utf8'),
  /revision: prior/,
)

{
  for (const theme of Object.values(DEEPHEART_THEMES)) {
    const parsed = parseLoop(theme)
    assert.equal(parsed.length, 16)
    assert.ok(parsed.notes.length > 0)
  }
  assert.equal(
    new Set(
      Object.values(DEEPHEART_THEMES).map((theme) => JSON.stringify(theme)),
    ).size,
    7,
  )
  for (const cue of Object.values(DEEPHEART_CUES))
    assert.ok(cue.every((pitch) => noteFreq(pitch) !== null))

  const run = createRun(hero('idris'), ['brannoc'], 42)
  const frame = deepheartAudioFrame(run, 'delve')
  assert.equal(deepheartMood(frame), 'ossuary')
  assert.equal(deepheartMood({ ...frame, layer: 1 }), 'drowned')
  assert.equal(deepheartMood({ ...frame, layer: 2 }), 'ember')
  assert.equal(deepheartMood({ ...frame, phase: 'camp' }), 'campfire')
  assert.equal(deepheartMood({ ...frame, phase: 'fight' }), 'combat')
  assert.equal(deepheartMood({ ...frame, active: false }), 'title')
  assert.deepEqual(deepheartCues(frame, { ...frame, layer: 1 }), ['descent'])
  assert.deepEqual(deepheartCues(frame, { ...frame, phase: 'fight' }), [
    'danger',
  ])
  assert.deepEqual(deepheartCues(frame, { ...frame, phase: 'camp' }), ['rest'])
  assert.deepEqual(deepheartCues(frame, { ...frame, hp: frame.hp - 1 }), [
    'wound',
  ])
  assert.deepEqual(deepheartCues(frame, { ...frame, ending: 'fallen' }), [
    'fallen',
  ])
  assert.deepEqual(deepheartCues(frame, frame), [])

  const calls: string[] = []
  const player: ArcadeSound = {
    play: () => {},
    playNotes: () => calls.push('cue'),
    startMusic: () => calls.push('music'),
    stopMusic: () => calls.push('stop'),
    unlock: () => calls.push('unlock'),
    muted: false,
    setMuted: (muted) => calls.push(muted ? 'mute' : 'unmute'),
    setVolume: (volume) => calls.push(String(volume)),
    context: () => null,
    routeMusic: () => {},
    dispose: () => calls.push('dispose'),
  }
  const sound = new DeepheartSound(() => player)
  sound.setMood('campfire')
  sound.configure(false, false, false)
  sound.unlock()
  assert.equal(calls.length, 0, 'no context before an enabled gesture')
  sound.configure(true, false, false)
  assert.equal(calls.length, 0)
  sound.unlock()
  assert.ok(calls.includes('music'))
  sound.play(['rest'])
  assert.equal(calls.filter((call) => call === 'cue').length, 1)
  sound.configure(true, true, false)
  sound.play(['danger'])
  assert.equal(calls.filter((call) => call === 'cue').length, 1)
  sound.configure(true, false, true)
  assert.ok(calls.includes('stop'))
  sound.configure(true, false, false)
  assert.equal(calls.filter((call) => call === 'music').length, 2)
  sound.dispose()
  assert.equal(calls.at(-1), 'dispose')
}

type MediaFetcher = (url: URL, init: RequestInit) => Promise<Response>

const MEDIA_ORIGIN = 'https://kindrobots.org'

async function imageHeader(response: Response): Promise<boolean> {
  const reader = response.body?.getReader()
  if (!reader) return false
  const prefix: number[] = []
  try {
    while (prefix.length < 16) {
      const { done, value } = await reader.read()
      if (done) break
      prefix.push(...value.subarray(0, 16 - prefix.length))
    }
  } finally {
    await reader.cancel()
  }
  const bytes = Buffer.from(prefix)
  const ascii = bytes.toString('ascii')
  const type = response.headers.get('content-type')?.split(';')[0]
  switch (type) {
    case 'image/png':
      return bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    case 'image/jpeg':
      return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    case 'image/webp':
      return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP'
    case 'image/gif':
      return ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a')
    case 'image/avif':
      return ascii.slice(4, 8) === 'ftyp' && ascii.slice(8, 12) === 'avif'
    default:
      return false
  }
}

async function auditMedia(
  id: number,
  token: string,
  request: MediaFetcher = fetch,
): Promise<string | null> {
  const url = new URL(`/api/deepheart/art/${id}`, MEDIA_ORIGIN)
  const options = { redirect: 'manual' as const }
  const denied = await request(url, options)
  await denied.body?.cancel()
  if (denied.status !== 404) {
    return `anonymous route returned ${denied.status}, expected 404`
  }

  const authenticated = {
    ...options,
    headers: { 'x-api-key': token },
  }
  let image = await request(url, authenticated)
  if (image.status === 302) {
    const location = image.headers.get('location')
    await image.body?.cancel()
    if (!location) return 'redirect missing location'
    const target = new URL(location, url)
    if (
      target.origin !== url.origin ||
      !target.pathname.startsWith('/images/')
    ) {
      return 'unexpected image redirect'
    }
    const direct = await request(target, options)
    await direct.body?.cancel()
    if (![401, 403, 404].includes(direct.status)) {
      return `anonymous image path returned ${direct.status}`
    }
    image = await request(target, authenticated)
  }
  if (image.status !== 200) {
    await image.body?.cancel()
    return `authenticated image returned ${image.status}`
  }
  return (await imageHeader(image)) ? null : 'invalid image type or signature'
}

async function verifyMediaAudit() {
  const png = () =>
    new Response(Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10), {
      headers: { 'content-type': 'image/png' },
    })
  const missing = () => new Response(null, { status: 404 })
  const redirect = (location: string) =>
    new Response(null, { status: 302, headers: { location } })
  const token = 'mock-test-token'
  const isAuthenticated = (init: RequestInit) =>
    new Headers(init.headers).get('x-api-key') === token

  assert.equal(
    await auditMedia(1, token, async (_, init) =>
      isAuthenticated(init) ? png() : missing(),
    ),
    null,
  )
  assert.match(
    (await auditMedia(1, token, async () => png())) ?? '',
    /anonymous route/,
  )
  assert.match(
    (await auditMedia(1, token, async (_, init) =>
      isAuthenticated(init)
        ? new Response('<html>login</html>', {
            headers: { 'content-type': 'image/png' },
          })
        : missing(),
    )) ?? '',
    /signature/,
  )
  assert.match(
    (await auditMedia(1, token, async (_, init) =>
      isAuthenticated(init)
        ? redirect('https://example.invalid/image.png')
        : missing(),
    )) ?? '',
    /unexpected image redirect/,
  )
  assert.equal(
    await auditMedia(1, token, async (url, init) => {
      if (!isAuthenticated(init)) return missing()
      return url.pathname.startsWith('/images/')
        ? png()
        : redirect('/images/private.png')
    }),
    null,
  )
  assert.match(
    (await auditMedia(1, token, async (url, init) => {
      if (url.pathname.startsWith('/images/')) return png()
      return isAuthenticated(init) ? redirect('/images/private.png') : missing()
    })) ?? '',
    /anonymous image path/,
  )

  if (!process.argv.includes('--live-media')) return
  const liveToken = process.env.KR_API_TOKEN
  if (!liveToken)
    throw new Error('KR_API_TOKEN is required for live media audit')
  const failures: string[] = []
  const assets = Object.entries(DEEPHEART_ART_IDS)
  for (const [key, id] of assets) {
    try {
      const failure = await auditMedia(id, liveToken, (url, init) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(15000) }),
      )
      if (failure) failures.push(`${key} (${id}): ${failure}`)
    } catch {
      failures.push(`${key} (${id}): media request failed`)
    }
  }
  for (const failure of failures) console.error(failure)
  console.log(
    `Deepheart live media: ${assets.length - failures.length}/${assets.length} verified`,
  )
  assert.equal(failures.length, 0, 'live media audit failed')
}

void verifyMediaAudit().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})

for (const entry of [...DEEPHEART.moments, ...DEEPHEART.endings]) {
  assert.equal(discoveryArt(DEEPHEART, entry.art, false), DEEPHEART.keyArt)
  assert.equal(discoveryArt(DEEPHEART, entry.art, true), entry.art)
  assert.equal(
    discoveryArt({ ...DEEPHEART, id: 'other-game' }, entry.art, false),
    entry.art,
  )
}
assert.match(
  readFileSync('components/playbook-kit/playbook-kit-scrapbook.vue', 'utf8'),
  /discoveryArt\(\s*spec,\s*moment\.art,\s*kit\.isUnlocked\('moments', moment\.id\)/,
)
assert.match(
  readFileSync('components/playbook-kit/playbook-kit-endings.vue', 'utf8'),
  /discoveryArt\(spec, ending\.art, found\(ending\.id\)\)/,
)
