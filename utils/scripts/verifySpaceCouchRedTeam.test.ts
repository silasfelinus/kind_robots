import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import {
  CONSEQUENCE_STORIES,
  castConsequenceText,
} from '../gameOfCaptains/consequenceStories'
import { CAPTAINS, startVoyage, type CrewId } from '../gameOfCaptains/rules'
import { CREW_PROFILES } from '../gameOfCaptains/crewAssignments'
import {
  episodeCard,
  episodePlotOdds,
  nemesisFilePenalty,
} from '../gameOfCaptains/episodeConsole'
import { WAITING_LINES } from '../gameOfCaptains/transitLines'
import {
  casinoIncident,
  casinoIncidentSetup,
  chapterSystem,
} from '../gameOfCaptains/solarCircuit'
import { VOYAGE_CHAPTERS } from '../gameOfCaptains/voyageMap'
import { playVoyage, type Driver } from './spaceCouchTraceHarness'

/**
 * Space Couch independent red-team (t-011, 2026-11-05 PT). An adversarial
 * read of seeded persona transcripts found: Act I's first cases still
 * called the couch a starship with bridge speakers and a warp coil, and
 * credited officers who were not aboard; quest logs told a success story
 * above a failed roll; plot reports read "Mox-9 secure"; the patient,
 * consent-first audit cost nothing when it worked; the nemesis "pressure"
 * every override and audit promised was never read; and casino incidents,
 * nemesis cards and transit waits repeated word for word inside a voyage.
 * Each check below pins one of those fixes.
 */

const OWN_VESSEL =
  /\b(?:the|our|this) starship\b|\bstarship['’]s\b|\bbridge (?:speakers|crew|officers?|console)\b|\bviewscreen\b|\bwarp (?:coil|core|drive|components?)\b|\bgalley table\b|\bnavigation compartment\b/i
const OFFICERS = CREW_PROFILES.map((officer) => ({
  id: officer.id,
  short: officer.name.replace(/^(Bosun|Dr\.) /, '').split(' ')[0]!,
}))
const mentions = (text: string) =>
  OFFICERS.filter(({ short }) =>
    new RegExp('\\b' + short.replace('-', '\\-') + '\\b').test(text),
  ).map(({ id }) => id)
// A captain is chosen on the title screen; authored scenes say "the captain".
const CAPTAIN_WORD = new RegExp(
  '\\b(?:' +
    CAPTAINS.map((captain) => captain.name.replace(/^Captain /, '')).join('|') +
    ')\\b',
)

// 1. Canon: the vessel is a long red couch in a force bubble. No source
// string describes it as a starship with a bridge, warp coil or galley.
const dir = new URL('../gameOfCaptains/', import.meta.url)
for (const file of readdirSync(dir).filter((name) => name.endsWith('.ts'))) {
  const text = readFileSync(new URL(file, dir), 'utf8')
  const hit = text.match(OWN_VESSEL)
  assert.equal(hit, null, `${file}: conventional-ship canon "${hit?.[0]}"`)
}

// 2. Authored consequences never hard-code a captain, never name more than
// two officers, and every named officer who is not aboard is played by one
// who is (the best-suited aboard officer for the check).
const outcomes = Object.values(CONSEQUENCE_STORIES).flatMap((episode) =>
  episode.choices.flatMap((choice) =>
    [choice.success, choice.failure].map((outcome) => ({ choice, outcome })),
  ),
)
for (const episode of Object.values(CONSEQUENCE_STORIES))
  for (const text of [
    episode.opening,
    episode.conflict,
    ...episode.choices.flatMap((c) => [c.label, c.approach, c.cost]),
  ])
    assert.ok(!CAPTAIN_WORD.test(text), `${episode.id}: hard-coded captain`)
const ids = OFFICERS.map((o) => o.id) as CrewId[]
const parties: CrewId[][] = []
for (let a = 0; a < ids.length; a++)
  for (let b = a + 1; b < ids.length; b++)
    for (let c = b + 1; c < ids.length; c++)
      parties.push([ids[a]!, ids[b]!, ids[c]!])
let recast = 0
for (const { choice, outcome } of outcomes) {
  for (const text of [outcome.narrative, outcome.callback])
    assert.ok(!CAPTAIN_WORD.test(text), `${choice.id}: hard-coded captain`)
  const named = mentions(outcome.narrative + ' ' + outcome.callback)
  assert.ok(named.length <= 2, `${choice.id}: at most two named officers`)
  for (const party of parties) {
    const texts = [outcome.narrative, outcome.callback]
    const cast = castConsequenceText(
      { crew: party, away: [] },
      choice.check.ability_any,
      texts,
    )
    for (const text of cast)
      for (const id of mentions(text))
        assert.ok(party.includes(id), `${choice.id}: ${id} is not aboard`)
    if (named.every((id) => party.includes(id)))
      assert.deepEqual(cast, texts, 'aboard officers keep their own lines')
    else recast++
  }
}
assert.ok(recast > 0)

// 3. Ethics: no choice is free. Every outcome carries a real cost and every
// success a real gain, so the patient audit is not a dominant strategy and
// a forceful rescue that works is not pure mockery.
const costs = (delta: Record<string, number>) =>
  Object.entries(delta).some(([meter, value]) =>
    meter === 'antagonist_pressure' ? value > 0 : value < 0,
  )
const gains = (delta: Record<string, number>) =>
  Object.entries(delta).some(([meter, value]) =>
    meter === 'antagonist_pressure' ? value < 0 : value > 0,
  )
for (const episode of Object.values(CONSEQUENCE_STORIES))
  for (const choice of episode.choices) {
    const where = `${episode.id}/${choice.id}`
    assert.ok(costs(choice.success.delta), `${where}: success has a cost`)
    assert.ok(costs(choice.failure.delta), `${where}: failure has a cost`)
    assert.ok(gains(choice.success.delta), `${where}: success has a gain`)
  }

// 4. The nemesis file is real: pressure from overrides, bold detours and
// slow audits makes the nemesis card harder (and only that card).
const base = { ...startVoyage('fluke', ['pell', 'mox', 'rue'], 4242) }
const even = { ...base, chapter: 2, phase: 'expedition' as const }
assert.equal(nemesisFilePenalty(even), 0)
assert.equal(nemesisFilePenalty({ ...even, nemesisPressure: -3 }), 0)
assert.equal(nemesisFilePenalty({ ...even, nemesisPressure: 3 }), 6)
assert.equal(nemesisFilePenalty({ ...even, nemesisPressure: 40 }), 16)
const calm = episodePlotOdds(even, 'nemesis', ['captain'])
const hunted = episodePlotOdds({ ...even, nemesisPressure: 5 }, 'nemesis', [
  'captain',
])
assert.ok(hunted < calm || calm === 8, 'pressure lowers the nemesis odds')
assert.equal(
  episodePlotOdds({ ...even, nemesisPressure: 5 }, 'planet', ['captain']),
  episodePlotOdds(even, 'planet', ['captain']),
  'other decks ignore the nemesis file',
)

// 5. No-repeat pools: casino setups, nemesis cards and transit waits.
assert.ok(WAITING_LINES.length >= VOYAGE_CHAPTERS * 2)
assert.equal(new Set(WAITING_LINES).size, WAITING_LINES.length)
// The casino never repeats an incident inside one voyage (the per-chapter
// hash it replaced averaged 4.7 of 8), and every setup is told in new words.
const openers = new Set<string>()
for (let seed = 1; seed <= 400; seed++) {
  const incidents = Array.from({ length: VOYAGE_CHAPTERS }, (_, n) =>
    casinoIncident(seed, n + 1, chapterSystem(seed, n + 1)),
  )
  assert.equal(new Set(incidents).size, VOYAGE_CHAPTERS, `casino seed ${seed}`)
  const setups = Array.from({ length: VOYAGE_CHAPTERS }, (_, n) =>
    casinoIncidentSetup(seed, n + 1, chapterSystem(seed, n + 1)),
  )
  assert.equal(new Set(setups).size, VOYAGE_CHAPTERS, `casino seed ${seed}`)
  openers.add(incidents[0]!.title)
}
assert.ok(openers.size >= 8, 'voyages open on different casino incidents')
for (const choice of ['ask', 'document', 'override'] as const) {
  const lines = [2, 4, 6, 8].map(
    (chapter) => episodeCard({ ...base, chapter }, 'nemesis').outcomes![choice],
  )
  assert.equal(new Set(lines).size, 4, `nemesis ${choice} escalates`)
}

// 6. Whole voyages through the page's path, read as transcripts.
const PERSONAS: Driver[] = [
  {
    name: 'completionist',
    order: (run) => (run.chapter % 3 === 0 ? 'observe' : 'aid'),
    episode: (run) => (run.chapter % 2 ? 'ask' : 'document'),
    authoredChoices: true,
    resupply: () => true,
    errand: (run) => [run.crew[run.chapter % 3]!, 'careful', 'bold'],
    finale: 'protect',
  },
  {
    name: 'chaos',
    order: () => 'intervene',
    episode: () => 'override',
    redshirtsFirst: true,
    authoredChoices: true,
    errand: (run) => [run.crew[(run.chapter + 1) % 3]!, 'bold', 'bold'],
    finale: 'compromise',
  },
  {
    name: 'observer',
    order: () => 'observe',
    episode: () => 'document',
    sideQuests: false,
    authoredChoices: true,
    finale: 'compromise',
  },
]
const PARTIES: CrewId[][] = [
  ['sora', 'kivo', 'tess'],
  ['brin', 'jex', 'fen'],
  ['taal', 'omi', 'sora'],
  ['pell', 'mox', 'rue'],
]
const SINGLE = new RegExp(
  `(?<!and )\\b(?:The captain|${CREW_PROFILES.map((p) => p.name.replace('.', '\\.')).join('|')}) (?:secure|complicate) the`,
)
let voyages = 0
let consequences = 0
let quests = 0
for (const [p, driver] of PERSONAS.entries())
  for (const [k, party] of PARTIES.entries()) {
    const captain = CAPTAINS[(p + k) % 5]!.id
    const waits = new Set<string>()
    const { run } = playVoyage(
      captain,
      party,
      61000 + p * 97 + k * 13,
      driver,
      {
        inspectEvery: false,
        onStep: (label, before, after) => {
          const fresh = [after.scene, ...after.log.slice(before.log.length)]
          for (const text of fresh) {
            assert.ok(!OWN_VESSEL.test(text), `${label}: ship canon: ${text}`)
            assert.ok(!SINGLE.test(text), `${label}: verb agreement: ${text}`)
            assert.ok(
              !/(?:^|[.\]] )the captain\b/.test(text),
              `${label}: sentence starts lowercase: ${text}`,
            )
            assert.ok(!/complicates? the \w+ objective/.test(text), text)
          }
          if (before.phase === 'decision' && label.startsWith('consequence:')) {
            consequences++
            for (const id of mentions(after.scene))
              assert.ok(
                after.crew.includes(id as CrewId),
                `${label}: ${id} is credited but not aboard: ${after.scene}`,
              )
          }
          if (label === 'dispatch') {
            const added = after.log.slice(before.log.length)
            for (const [i, story] of added.entries()) {
              const title = /^Expedition \d+ \/ (.+?): /.exec(story)?.[1]
              if (!title) continue
              const verdict = added[i + 1] ?? ''
              assert.ok(verdict.includes(title), story)
              quests++
              if (verdict.includes(' failed ('))
                assert.ok(!story.includes(`handles ${title}.`), story)
              else
                assert.ok(!/out of their depth|slips away/.test(story), story)
              // An officer who handled the card is not described as the captain.
              if (
                /^Expedition \d+ \/ .+?: (?!The captain )[^:]+ handles /.test(
                  story,
                )
              )
                assert.ok(!story.includes('. The captain '), story)
            }
            for (const result of after.expeditionVisit?.results ?? [])
              if ('successful' in result)
                assert.equal(
                  result.outcome.includes('Field objective achieved'),
                  result.successful,
                )
          }
          if (label === 'wait' && after.phase === 'transit') {
            const line = WAITING_LINES.find((w) => after.scene.endsWith(w))
            assert.ok(line, 'a waiting day shows couch life')
            assert.ok(!waits.has(line), `waiting line repeated: ${line}`)
            waits.add(line)
          }
        },
      },
    )
    assert.equal(run.phase, 'ending')
    assert.ok((run.nemesisPressure ?? 0) >= 0, 'grievances never go negative')
    voyages++
  }
assert.ok(consequences >= 20 && quests >= 100)

console.log(
  `Space Couch red-team: couch canon, ${outcomes.length} cast-checked outcomes x ${parties.length} parties, costed ethics, live nemesis file, ${voyages} persona voyages (${consequences} consequences, ${quests} quest logs) OK`,
)
