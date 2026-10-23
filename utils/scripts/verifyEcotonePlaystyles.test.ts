import assert from 'node:assert/strict'
import {
  ARCHETYPES,
  ENCOUNTERS,
  LENSES,
  type Choice,
  type EventId,
} from '../ecotone/content'
import {
  advance,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  createRun,
  encounterEligible,
  findCard,
  restoreRun,
  type RunState,
} from '../ecotone/engine'
import { openingLensChoices } from '../ecotone/openingLensChoices'
import { EVENTS } from '../ecotone/story'

type Style =
  'investigator' | 'caretaker' | 'thrill' | 'solitary' | 'collaborator'

const styles: Style[] = [
  'investigator',
  'caretaker',
  'thrill',
  'solitary',
  'collaborator',
]

function choiceScore(choice: Choice, style: Style): number {
  const result = choice.success.effects
  switch (style) {
    case 'investigator':
      return (
        (result.evidence ? 15 : 0) +
        (choice.check?.skill === 'wits' || choice.check?.skill === 'lore'
          ? 5
          : 0) +
        (result.flag ? 2 : 0)
      )
    case 'caretaker':
      return (result.goodwill ?? 0) * 10 + (choice.meet ? 5 : 0)
    case 'thrill':
      return (result.weird ?? 0) * 10 + (choice.check ? 4 : 0)
    case 'solitary':
      return (result.nerve ?? 0) * 10 + (choice.meet === false ? 5 : 0)
    case 'collaborator':
      return (
        (result.goodwill ?? 0) * 5 +
        (result.evidence ? 4 : 0) +
        (choice.meet ? 5 : 0)
      )
  }
}

function nextChoice(state: RunState, style: Style): string {
  const card = findCard(state.card)
  assert.ok(card, 'a journey must only offer authored cards')
  const choices = openingLensChoices(card).filter((choice) => !choice.locked)
  assert.ok(choices.length > 0, card.id + ' has a playable decision')

  const area = choices.filter((choice) => choice.prospect)
  if (area.length && !state.prospect) {
    return area[styles.indexOf(style) % area.length]!.id
  }

  if (!state.openingState) {
    const lens = choices.find((choice) => choice.lens === state.currentState)
    if (lens) return lens.id
  }

  const meeting = choices.filter((choice) => choice.meet !== undefined)
  if (meeting.length) {
    const accept = style !== 'solitary'
    return (meeting.find((choice) => choice.meet === accept) ?? meeting[0])!.id
  }

  return [...choices].sort(
    (a, b) =>
      choiceScore(b, style) - choiceScore(a, style) ||
      (style === 'thrill'
        ? b.id.localeCompare(a.id)
        : a.id.localeCompare(b.id)),
  )[0]!.id
}

function journey(
  event: EventId,
  lens: (typeof LENSES)[number]['id'],
  seed: number,
  style: Style,
): RunState {
  let state = createRun(seed, ARCHETYPES[seed % ARCHETYPES.length]!.id)
  state = advance(chooseEvent(state, event))
  let turns = 0

  while (state.phase !== 'end') {
    assert.ok(++turns < 125, style + ' campaign stalled')
    if (state.phase === 'fork') {
      assert.ok(state.offered.length > 0)
      state = chooseFork(
        state,
        state.offered[(seed + state.step) % state.offered.length]!,
      )
      continue
    }
    if (state.phase === 'crossroads') {
      const decision =
        style === 'solitary'
          ? 'stay'
          : style === 'thrill'
            ? 'follow'
            : style === 'collaborator' && state.activeLead
              ? 'together'
              : style === 'caretaker'
                ? 'stay'
                : 'follow'
      state = advance(chooseCrossroads(state, decision))
      continue
    }
    assert.equal(state.phase, 'beat')
    const card = findCard(state.card)
    assert.ok(card)
    const options = openingLensChoices(card)
    const requestedLens = options.find((choice) => choice.lens === lens)
    const chosen =
      !state.openingState && requestedLens && !requestedLens.locked
        ? requestedLens.id
        : nextChoice(state, style)
    const result = chooseBeat(state, chosen)
    assert.ok(result.pending, card.id + '/' + chosen + ' must resolve')
    state = advance(result)
  }

  assert.equal(state.openingState, lens)
  assert.ok(state.ending)
  assert.equal(new Set(state.played).size, state.played.length)
  assert.ok(!state.played.includes('WH-121'))
  assert.deepEqual(restoreRun(JSON.parse(JSON.stringify(state))), state)
  return state
}

function storySignature(state: RunState): string {
  return state.log
    .map(
      (entry) =>
        entry.source +
        ':' +
        entry.choice +
        ':' +
        (entry.roll?.success === false ? 'failure' : 'success'),
    )
    .join('|')
}

let campaigns = 0
let divergentDecisions = 0
let divergentConsequences = 0
let divergentEndings = 0
const uniqueCardPaths = new Set<string>()
const uniqueForkPaths = new Set<string>()
const encountered = new Map<string, number>()
const chapterCoverage = new Map<number, Set<string>>()
let comparedPairs = 0
let totalRouteOverlap = 0
let totalForkOverlap = 0
let identicalForkPairs = 0
let flagOnlyEligibilityDifferences = 0
const encounterIds = new Set(ENCOUNTERS.map((card) => card.id))
const jaccard = (a: Set<string>, b: Set<string>): number => {
  const union = new Set([...a, ...b])
  if (union.size === 0) return 1
  return [...a].filter((id) => b.has(id)).length / union.size
}
const uniqueStories = new Set<string>()
const styleEndings = new Map<Style, Set<string>>(
  styles.map((style) => [style, new Set<string>()]),
)

for (const event of EVENTS) {
  for (const lens of LENSES) {
    for (let seed = 21; seed <= 32; seed++) {
      const histories = styles.map((style) => {
        const run = journey(event.id, lens.id, seed, style)
        styleEndings.get(style)!.add(run.ending!)
        uniqueStories.add(storySignature(run))
        uniqueCardPaths.add(run.played.join('>'))
        uniqueForkPaths.add(
          run.played.filter((id) => encounterIds.has(id)).join('>'),
        )
        for (const id of run.played) {
          const card = findCard(id)
          if (!card) continue
          if (!chapterCoverage.has(card.chapter))
            chapterCoverage.set(card.chapter, new Set())
          chapterCoverage.get(card.chapter)!.add(id)
          if (encounterIds.has(id))
            encountered.set(id, (encountered.get(id) ?? 0) + 1)
        }
        const flagless = { ...run, flags: [] }
        const actualEligible = ENCOUNTERS.filter((card) =>
          encounterEligible(card, run),
        ).map((card) => card.id)
        const withoutFlags = ENCOUNTERS.filter((card) =>
          encounterEligible(card, flagless),
        ).map((card) => card.id)
        if (actualEligible.join('|') !== withoutFlags.join('|'))
          flagOnlyEligibilityDifferences++
        campaigns++
        if (seed === 21) {
          assert.deepEqual(
            journey(event.id, lens.id, seed, style),
            run,
            'the same seed and player policy must replay exactly',
          )
        }
        return run
      })
      const signatures = histories.map(storySignature)
      assert.ok(
        new Set(signatures).size >= 2,
        event.id + '/' + lens.id + ' needs distinct player decisions',
      )
      divergentDecisions++
      for (let left = 0; left < histories.length; left++) {
        for (let right = left + 1; right < histories.length; right++) {
          const leftCards = new Set(histories[left]!.played)
          const rightCards = new Set(histories[right]!.played)
          const leftForks = new Set(
            histories[left]!.played.filter((id) => encounterIds.has(id)),
          )
          const rightForks = new Set(
            histories[right]!.played.filter((id) => encounterIds.has(id)),
          )
          totalRouteOverlap += jaccard(leftCards, rightCards)
          const forkOverlap = jaccard(leftForks, rightForks)
          totalForkOverlap += forkOverlap
          if (forkOverlap === 1) identicalForkPairs++
          comparedPairs++
        }
      }
      const consequences = histories.map((run) =>
        JSON.stringify({
          flags: [...run.flags].sort(),
          evidence: [...run.evidence].sort(),
          goodwill: run.goodwill,
          nerve: run.nerve,
          wild: run.wild,
        }),
      )
      if (new Set(consequences).size >= 2) divergentConsequences++
      if (new Set(histories.map((run) => run.ending)).size >= 2)
        divergentEndings++
    }
  }
}

assert.ok(divergentConsequences > 0, 'playstyles must alter saved consequences')
assert.ok(
  [...styleEndings.values()].every((endings) => endings.size > 0),
  'every playstyle must complete collectible endings',
)
const unvisited = ENCOUNTERS.filter((card) => !encountered.has(card.id))
const leastSeen = [...encountered.entries()]
  .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
  .slice(0, 8)
assert.ok(comparedPairs > 0)
assert.ok(chapterCoverage.size >= 4)
console.log(
  'Ecotone route-path audit: ' +
    uniqueCardPaths.size +
    '/' +
    campaigns +
    ' distinct ordered card paths; ' +
    uniqueForkPaths.size +
    ' distinct side-encounter paths; matched-pair mean overlap ' +
    (totalRouteOverlap / comparedPairs).toFixed(3) +
    ' all cards, ' +
    (totalForkOverlap / comparedPairs).toFixed(3) +
    ' side cards; ' +
    identicalForkPairs +
    '/' +
    comparedPairs +
    ' identical side-card sets. Chapter coverage: ' +
    [...chapterCoverage.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([chapter, cards]) => chapter + '=' + cards.size)
      .join(', ') +
    '. Unvisited eligible-or-gated side cards: ' +
    unvisited.length +
    '/' +
    ENCOUNTERS.length +
    ' (' +
    unvisited
      .slice(0, 12)
      .map((card) => card.id)
      .join(', ') +
    '). Least seen: ' +
    leastSeen.map(([id, count]) => id + '=' + count).join(', ') +
    '. Flag-only differences in remaining encounter eligibility: ' +
    flagOnlyEligibilityDifferences +
    '/' +
    campaigns +
    '.',
)
console.log(
  'Ecotone playstyle audit: ' +
    campaigns +
    ' campaigns, ' +
    uniqueStories.size +
    ' distinct decision histories; ' +
    divergentDecisions +
    '/252 sampled groups differ in decisions, ' +
    divergentConsequences +
    '/252 in state consequences, and ' +
    divergentEndings +
    '/252 in endings. Persona ending spread: ' +
    [...styleEndings.entries()]
      .map(([style, endings]) => style + '=' + endings.size)
      .join(', '),
)
