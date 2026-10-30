// Prom of Doom console sub-screens and seeded villain variability (t-014).
// Every view must read a real save; every accusation must change real play.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CAMPAIGN_VILLAINS, campaignVillain } from '../cometAcademy/campaign'
import { promArt } from '../cometAcademy/artManifest'
import { CITY_SITES } from '../cometAcademy/cityMap'
import { fieldFor } from '../cometAcademy/identityArcs'
import {
  CONSOLE_SCREENS,
  DEFAULT_SETTINGS,
  decodeSaveCode,
  encodeSaveCode,
  endingPlates,
  followerRoster,
  heroDossier,
  mastermindMet,
  normalizeSettings,
  saveSummary,
  scrapbookMoments,
  textRevealDelay,
  villainCaseFile,
  villainDossiers,
} from '../cometAcademy/consoleScreens'
import {
  accuseMastermind,
  assignPlayerCase,
  chooseEncounter,
  dispatchModifier,
  encounterFor,
  incidentsFor,
  nextSchoolDay,
  resolveDispatch,
  restoreAcademy,
  startAcademy,
  startFullAcademy,
  villainInterference,
  visitCitySite,
  type AcademyRun,
} from '../cometAcademy/rules'
import {
  ACCUSATION_WINDOW,
  INTERFERENCE_DAYS,
  OMEN_DAYS,
  VILLAIN_SIGNS,
  villainOmenFor,
} from '../cometAcademy/villainSigns'
import { villainArtKey } from '../cometAcademy/artSlots'

const fromRoot = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const page = fromRoot('pages/play/comet-city-academy.vue')
const screens = fromRoot(
  'components/play/cometAcademy/AcademyConsoleScreens.vue',
)
const store = fromRoot('stores/cometAcademyStore.ts')

const SIGNATURE = 'accident-fire' as const
const fresh = (seed: number) =>
  startFullAcademy(fieldFor(SIGNATURE), seed, SIGNATURE, 'shelter')
const roundTrip = (run: AcademyRun) => {
  const saved = JSON.parse(JSON.stringify(run))
  assert.deepEqual(restoreAcademy(saved), saved, `save on day ${run.day}`)
  return saved as AcademyRun
}

/** One real day of play: visit a site, answer its card, attend one call. */
function playDay(run: AcademyRun): AcademyRun {
  assert.equal(run.phase, 'map')
  const site = CITY_SITES.find(
    (entry) => (run.visitedDays?.[entry.id] ?? -7) <= run.day - 7,
  )!
  let next = visitCitySite(run, site.id)
  assert.equal(next.phase, 'campus', `day ${run.day} visit`)
  next = chooseEncounter(next, encounterFor(next).options[0]!.id)
  assert.equal(next.phase, 'dispatch', `day ${run.day} card`)
  next = resolveDispatch(assignPlayerCase(next, incidentsFor(next)[0]!.id))
  assert.equal(next.phase, 'debrief', `day ${run.day} night`)
  roundTrip(next)
  return nextSchoolDay(next)
}

// ------------------------------------------------ villain signs data contract
assert.equal(VILLAIN_SIGNS.length, CAMPAIGN_VILLAINS.length)
for (const villain of CAMPAIGN_VILLAINS) {
  const signs = VILLAIN_SIGNS.find((entry) => entry.id === villain.id)
  assert.ok(signs, `${villain.id} has first-week omens`)
  for (const day of OMEN_DAYS)
    assert.ok(
      (villainOmenFor(villain, day)?.length ?? 0) > 40,
      `${villain.id} omen day ${day}`,
    )
  assert.equal(villainOmenFor(villain, 5), null, 'day 5 is the interference')
  assert.ok(signs.interference.text.length > 40)
  assert.ok(
    signs.interference.broken
      .toLowerCase()
      .includes(villain.name.toLowerCase()),
  )
  // The lineup is the real roster of painted portraits.
  assert.ok(promArt(villainArtKey(villain.name)), `${villain.id} portrait`)
}
const omenText = VILLAIN_SIGNS.flatMap((signs) => Object.values(signs.omens))
assert.equal(new Set(omenText).size, omenText.length, 'no repeated omens')

// ------------------------------------- variability: two seeds, two villains
const seedsByVillain = new Map<string, number>()
for (let seed = 1; seedsByVillain.size < CAMPAIGN_VILLAINS.length; seed++)
  if (!seedsByVillain.has(fresh(seed).mastermind!))
    seedsByVillain.set(fresh(seed).mastermind!, seed)
const [seedA, seedB] = [...seedsByVillain.values()]
let runA = fresh(seedA!)
let runB = fresh(seedB!)
assert.notEqual(runA.mastermind, runB.mastermind)
const fileA = villainCaseFile(runA)!
const fileB = villainCaseFile(runB)!
assert.equal(fileA.revealed, false, 'spoiler-safe on day 1')
assert.equal(fileA.name, 'Unknown mastermind')
assert.equal(fileA.portraitKey, null)
assert.notDeepEqual(fileA.omens, fileB.omens, 'different first clue')

// Play both seeds for a real first week, from New Game, and compare evidence.
const accusedCorrect: AcademyRun[] = []
for (const [label, start] of [
  ['A', runA],
  ['B', runB],
] as const) {
  let run = start
  while (run.day < ACCUSATION_WINDOW.first) run = playDay(run)
  const file = villainCaseFile(run)!
  assert.equal(file.omens.length, 1 + OMEN_DAYS.filter((d) => d <= 5).length)
  assert.equal(file.interference?.active, true, `${label} day 5 interference`)
  assert.equal(file.canAccuse, true)
  // The jammed field really costs a step on a matching call tonight.
  const villain = campaignVillain(run.seed, run.mastermind)
  const jam = VILLAIN_SIGNS.find((s) => s.id === villain.id)!.interference.jams
  const jammed = { ...incidentsFor(run)[0]!, need: jam }
  const clear = {
    ...jammed,
    need: jam === 'kinetic' ? ('empathy' as const) : ('kinetic' as const),
  }
  assert.equal(villainInterference(run, jammed), 1)
  assert.equal(villainInterference(run, clear), 0)
  // Wrong accusation: interference holds and the city pays.
  const wrong = CAMPAIGN_VILLAINS.find((v) => v.id !== villain.id)!
  const missed = accuseMastermind(run, wrong.id)
  assert.equal(missed.danger, run.danger + 1)
  assert.equal(villainCaseFile(missed)!.suspect?.correct, false)
  assert.equal(villainInterference(missed, jammed), 1)
  assert.deepEqual(accuseMastermind(missed, villain.id), missed, 'one try')
  roundTrip(missed)
  // Right accusation: breaks the interference and reveals the file early.
  const named = accuseMastermind(run, villain.id)
  assert.equal(named.influence, run.influence + 2)
  assert.equal(villainInterference(named, jammed), 0)
  assert.ok(
    dispatchModifier(named, jammed, []) ===
      dispatchModifier(run, jammed, []) + 1,
  )
  const revealed = villainCaseFile(named)!
  assert.equal(revealed.revealed, true)
  assert.equal(revealed.name, villain.name)
  assert.ok(revealed.countermeasure)
  assert.equal(revealed.interference?.active, false)
  assert.ok(mastermindMet(named))
  accusedCorrect.push(roundTrip(named))
  // Keep playing the uninformed run to day 15: the dossier opens anyway.
  while (run.day < 15) run = playDay(run)
  const dossier = villainCaseFile(run)!
  assert.equal(dossier.revealed, true)
  assert.equal(dossier.canAccuse, false)
  assert.ok(dossier.accomplices[0]!.status !== 'unknown', 'day-11 accomplice')
  assert.equal(dossier.accomplices[2]!.status, 'unknown', 'day 26 unseen')
  assert.ok(dossier.antagonist, 'rival antagonist shown from day 15')
  if (label === 'A') runA = run
  else runB = run
}
assert.notEqual(
  villainCaseFile(accusedCorrect[0]!)!.name,
  villainCaseFile(accusedCorrect[1]!)!.name,
)
// The window is enforced at both ends and outside the thirty-day run.
assert.deepEqual(accuseMastermind({ ...fresh(3), day: 4 }, 'the-mirror'), {
  ...fresh(3),
  day: 4,
})
const late = { ...fresh(3), day: 15 }
assert.deepEqual(accuseMastermind(late, late.mastermind!), late)
const sim = startAcademy(fieldFor(SIGNATURE), 3, SIGNATURE)
assert.deepEqual(accuseMastermind({ ...sim, day: 6 }, 'the-mirror'), {
  ...sim,
  day: 6,
})
assert.equal(villainCaseFile(sim), null)
// Interference only touches new patrol-opening runs, on days 5-7.
for (const day of [4, 8]) {
  const run = { ...fresh(seedA!), day }
  for (const need of [
    'kinetic',
    'technopathy',
    'empathy',
    'elemental',
    'spatial',
    'biotech',
  ] as const)
    assert.equal(
      villainInterference(run, { ...incidentsFor(run)[0]!, need }),
      0,
    )
}
const legacyNight = { ...fresh(seedA!), day: INTERFERENCE_DAYS[0] }
delete legacyNight.patrolOpening
for (const need of [
  'kinetic',
  'technopathy',
  'empathy',
  'elemental',
  'spatial',
  'biotech',
] as const)
  assert.equal(
    villainInterference(legacyNight, {
      ...incidentsFor(legacyNight)[0]!,
      need,
    }),
    0,
  )

// Tampered suspects are rejected; saves without one still load.
const base = roundTrip({ ...fresh(seedA!), day: 6 })
assert.equal(
  restoreAcademy({ ...base, suspect: { id: 'nobody', day: 6 } }),
  null,
)
assert.equal(
  restoreAcademy({ ...base, suspect: { id: base.mastermind, day: 9 } }),
  null,
  'suspect from the future',
)
assert.equal(
  restoreAcademy({ ...base, suspect: { id: base.mastermind, day: 3 } }),
  null,
  'suspect before the window',
)

// ------------------------------------------------------------- hero screen
const hero = heroDossier(runA)
assert.equal(hero.name.length > 0, true)
assert.equal(hero.stats.length, 6)
assert.equal(hero.forms.length, 3)
assert.equal(hero.forms.find((form) => form.id === 'student')!.unlocked, true)
assert.equal(hero.forms.find((form) => form.id === 'villain')!.unlocked, false)
assert.ok(
  heroDossier(runA, ['villain']).forms.find((f) => f.id === 'villain')!
    .unlocked,
)
assert.ok(hero.power.signature && hero.vow)
assert.ok(
  hero.portraitKeys.some((key) => promArt(key)),
  'hero portrait ships',
)
assert.equal(
  hero.record.find((row) => row.label === 'Days survived')!.value,
  runA.day - 1,
)
// A legacy first-week save without a signature still renders.
const plain = startAcademy('kinetic', 9)
assert.equal(heroDossier(plain).stats.length, 0)
assert.equal(heroDossier(plain).name, 'Unregistered student')

// -------------------------------------------------------- followers screen
const roster = followerRoster(runA)
assert.equal(roster.length, 12)
const freshRoster = followerRoster(fresh(seedA!))
assert.equal(freshRoster.filter((person) => person.met).length, 0, 'rookie')
const injured = followerRoster({
  ...runA,
  contacts: ['mina'],
  injuries: { mina: runA.day + 1 },
  relationships: {
    connections: { mina: { trust: 4, helped: true, romance: true } },
    romance: 'mina',
    days: [2],
  },
}).find((person) => person.id === 'mina')!
assert.equal(injured.met, true)
assert.equal(injured.mood, 'negative')
assert.equal(injured.injuredUntil, runA.day + 1)
assert.ok(injured.status.some((tag) => tag.startsWith('Injured')))
assert.ok(injured.status.includes('Dating you'))
assert.ok(promArt(injured.portraitKeys[0]!), 'injured face ships')
const healed = followerRoster({
  ...runA,
  contacts: ['mina'],
  relationships: {
    connections: { mina: { trust: 4, helped: true, romance: true } },
    romance: 'mina',
    days: [2],
  },
}).find((person) => person.id === 'mina')!
assert.equal(healed.mood, 'positive')
// Every first-week (all-contacts) roster entry is met.
assert.ok(followerRoster(plain).every((person) => person.met))

// -------------------------------------------------------- scrapbook screen
const moments = scrapbookMoments(runA)
assert.ok(moments.filter((m) => m.kind === 'district').length >= 7)
assert.ok(moments.every((m, i) => i === 0 || moments[i - 1]!.day <= m.day))
assert.ok(
  moments.some((moment) => moment.artKeys.some((key) => promArt(key))),
  'district art shows in the scrapbook',
)
assert.equal(scrapbookMoments(fresh(seedA!)).length, 0, 'nothing unearned')
const scrapNamed = scrapbookMoments(accusedCorrect[0]!)
assert.ok(scrapNamed.some((m) => m.title === 'The case board'))
const plates = endingPlates(['THE BROKEN GRID'])
assert.equal(plates.length, 12)
assert.equal(plates.filter((plate) => plate.found).length, 1)
assert.ok(plates.find((p) => p.found)!.route)
const dossiers = villainDossiers([runA.mastermind!])
assert.equal(dossiers.length, 8)
assert.equal(dossiers.filter((d) => d.met).length, 1)
assert.ok(
  dossiers
    .filter((d) => !d.met)
    .every((d) => d.name === 'Unknown mastermind' && !d.method),
)

// --------------------------------------------------------- settings screen
assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS)
assert.deepEqual(
  normalizeSettings({ textSpeed: 'warp', art: 'no' }),
  DEFAULT_SETTINGS,
)
assert.deepEqual(
  normalizeSettings({ textSpeed: 'leisurely', art: false, cardBack: 'doom' }),
  { textSpeed: 'leisurely', art: false, cardBack: 'doom' },
)
assert.equal(textRevealDelay('instant'), 0)
assert.ok(textRevealDelay('leisurely') > textRevealDelay('brisk'))
const code = encodeSaveCode(runB)
assert.ok(code.startsWith('PROM1:'))
assert.deepEqual(decodeSaveCode(code), roundTrip(runB))
assert.deepEqual(decodeSaveCode(JSON.stringify(runB)), roundTrip(runB))
assert.equal(decodeSaveCode('PROM1:not-base64!!'), null)
assert.equal(decodeSaveCode(encodeSaveCode({ ...runB, day: 99 })), null)
assert.equal(decodeSaveCode('hello'), null)
assert.equal(saveSummary(runB).days, 30)
assert.equal(saveSummary(plain).days, 7)

// ------------------------------------------------- page wiring, no dead tabs
assert.deepEqual(
  CONSOLE_SCREENS.map((screen) => screen.id),
  ['play', 'hero', 'followers', 'casefile', 'scrapbook', 'settings'],
)
for (const screen of CONSOLE_SCREENS.filter((entry) => entry.id !== 'play'))
  assert.ok(
    screens.includes(`data-testid="academy-screen-${screen.id}"`),
    `${screen.id} renders a real view`,
  )
assert.ok(page.includes("'academy-tab-' + tab.id"))
assert.ok(page.includes('<AcademyConsoleScreens'))
assert.ok(page.includes('data-testid="academy-villain-omen"'))
assert.ok(page.includes('data-testid="academy-villain-interference-night"'))
assert.ok(page.includes("openScreen('settings', true)"), 'NEW TERM confirms')
assert.ok(!page.includes('@click="store.restart()"\n      >\n        NEW TERM'))
assert.ok(screens.includes('data-testid="academy-reset-confirm"'))
assert.ok(screens.includes('store.accuse(id)'))
assert.ok(screens.includes('store.importSave(importCode.value)'))
assert.ok(store.includes('SETTINGS_KEY') && store.includes('DOSSIER_KEY'))
assert.ok(page.includes('store.settings.art ? academyStageArt(run.value)'))

// Regression: a watcher read currentSignature before its declaration, which
// threw during setup and blanked the whole New Game screen.
const opening = fromRoot('components/play/cometAcademy/AcademyOpening.vue')
assert.ok(
  opening.indexOf('const currentSignature = computed(') <
    opening.indexOf('currentSignature.value.id],'),
  'AcademyOpening declares currentSignature before its watcher reads it',
)

console.log(
  `Prom of Doom console screens: hero, crew, case file, scrapbook and settings read real saves; ${CAMPAIGN_VILLAINS.length} seeded masterminds with omens, interference and accusations verified.`,
)
