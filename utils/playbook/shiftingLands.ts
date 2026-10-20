import { JOURNEY_WORLD } from '../shiftingLands/journey'
import {
  DEED_FLAGS,
  MARKS,
  V6_CARDS,
  v6Pool,
  type V6Card,
  type V6Effect,
} from '../shiftingLands/deckV6'
import { AUTHORED_TRIALS } from '../shiftingLands/authoredBosses'
import { encounterArt, locationArt, trialArt } from '../shiftingLands/sceneArt'
import {
  blankNode,
  humanize,
  signedParts,
  storyOrder,
  uniq,
  type Playbook,
  type PlaybookChoice,
  type PlaybookNode,
  type PlaybookRoute,
} from './types'

// Zuzu: Shifting Lands in the Playbook Manager (conductor weird-humboldt t-036).
// The journey crosses five lands in chapter order; each land has three
// locations whose first visit deals one card from an eight-card weighted pool,
// then the land's trial. Read-only here: the game does not read overlays.

type Location = {
  id: string
  label: string
  teaser: string
  art: string | null
}
type Land = {
  id: string
  name: string
  chapter: number
  biome: string
  locations: Location[]
  boss?: { label: string; teaser: string; art: string | null }
}

function deed(flag: string): string {
  return DEED_FLAGS[flag] ? humanize(flag.replace(/^deed-/, '')) : flag
}

function effectSummary(effect: V6Effect | null): string {
  if (!effect) return ''
  const parts = signedParts({
    hp: effect.hp_delta,
    provisions: effect.provisions_delta,
    ...(effect.marks ?? {}),
  })
  for (const flag of effect.add_flags) parts.push(`+ ${deed(flag)}`)
  if (effect.map_effect !== 'none') parts.push('shifts the map')
  return parts.join(' · ')
}

function cardNode(card: V6Card, land: Land, location: Location): PlaybookNode {
  const node = blankNode(card.id, 'encounter', card.title)
  node.place = `${location.label}, ${land.name}`
  node.chapter = land.chapter
  node.body = [card.flavor]
  node.editable = true
  node.editFields = { body: true, outcomes: true }
  node.choices = card.choices.map((choice): PlaybookChoice => ({
    id: choice.id,
    label: choice.label,
    check: choice.roll
      ? { skill: choice.roll.skill, target: choice.roll.target }
      : undefined,
    cost: choice.cost
      ? signedParts({
          hp: -(choice.cost.hp ?? 0),
          provisions: -(choice.cost.provisions ?? 0),
        }).join(' · ')
      : undefined,
    tags: [
      choice.intent,
      choice.risk,
      ...(choice.requires?.anyFlags.map((f) => `Needs: ${deed(f)}`) ?? []),
    ].filter(Boolean),
    success: { text: choice.success.text },
    failure: choice.failure ? { text: choice.failure.text } : undefined,
    effect: effectSummary(choice.success) || undefined,
  }))
  node.lenses = uniq(
    card.choices.flatMap((choice) => [
      ...Object.keys(choice.success.marks ?? {}),
      ...Object.keys(choice.failure?.marks ?? {}),
    ]),
  )
  node.artUrl = encounterArt(land.id, card, location)
  node.needsArt = !node.artUrl
  node.provenance = `Weight ${card.weight} in the ${location.label} pool.`
  return node
}

export function buildShiftingLandsPlaybook(): Playbook {
  const lands = [...(JOURNEY_WORLD.lands as unknown as Land[])].sort(
    (a, b) => a.chapter - b.chapter,
  )
  const nodes: Record<string, PlaybookNode> = {}
  const steps: string[] = []
  const headings: Record<number, string> = {}
  const placement = (land: Land, step: number) => ({
    route: 'journey',
    routeName: 'The Journey',
    day: land.chapter,
    dayName: land.name,
    step,
  })

  for (const land of lands) {
    headings[steps.length] = `Chapter ${land.chapter} · ${land.name}`
    for (const location of land.locations) {
      const key = `loc:${location.id}`
      const node = blankNode(key, 'fork', location.label)
      const pool = v6Pool(location.id)
      node.place = land.name
      node.chapter = land.chapter
      node.body = [
        location.teaser,
        `The first visit deals one card from these ${pool.length}, weighted; a revisit never draws again.`,
      ]
      node.pool = pool.map((card) => card.id)
      node.choices = pool.map((card) => ({
        id: card.id,
        label: card.title,
        tags: [`Weight ${card.weight}`],
        leadsTo: card.id,
      }))
      node.artUrl = locationArt(land.id, location)
      node.placements.push(placement(land, steps.length))
      for (const card of pool) {
        nodes[card.id] ??= cardNode(card, land, location)
        nodes[card.id]!.placements.push(placement(land, steps.length))
      }
      nodes[key] = node
      steps.push(key)
    }
    const trial = AUTHORED_TRIALS.find((t) => t.landId === land.id)
    if (trial) {
      const key = `trial:${land.id}`
      const node = blankNode(key, 'boss', trial.title)
      node.place = land.boss?.label ?? land.name
      node.chapter = land.chapter
      node.body = [trial.flavor]
      node.editable = true
      node.editFields = { body: true, outcomes: true }
      node.choices = trial.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        check: { skill: choice.skill, target: choice.target },
        cost: choice.cost ? `provisions −${choice.cost}` : undefined,
        tags: [
          choice.intent,
          ...choice.requiredAnyFlags.map((f) => `Needs: ${deed(f)}`),
        ].filter(Boolean),
        success: { text: choice.success },
        failure: { text: choice.failure },
      }))
      node.artUrl = trialArt(land.id, trial.art)
      node.placements.push(placement(land, steps.length))
      nodes[key] = node
      steps.push(key)
    }
  }
  // Cards outside any current pool still show up in the list view.
  for (const card of V6_CARDS)
    if (!nodes[card.id]) {
      const land = lands.find((l) =>
        l.locations.some((loc) => loc.id === card.locationId),
      )
      const location = land?.locations.find((loc) => loc.id === card.locationId)
      if (land && location) nodes[card.id] = cardNode(card, land, location)
    }

  const routes: PlaybookRoute[] = [
    {
      id: 'journey',
      name: 'The Journey',
      kind: 'Five lands, three locations each, then the land’s trial',
      steps,
      headings,
    },
  ]
  return {
    game: 'shifting-lands',
    title: 'Zuzu: Shifting Lands',
    blurb: 'Five lands of seeded location decks and boss trials.',
    routes,
    nodes,
    order: storyOrder(
      routes,
      V6_CARDS.map((card) => card.id),
    ),
    sections: [],
    people: [],
    peopleLabel: 'Written for',
    variations: MARKS.map((mark) => ({ id: mark, label: humanize(mark) })),
    variationLabel: 'Grants a mark',
    dayLabel: 'Chapter',
    kindLabels: {
      fork: 'Location draw',
      encounter: 'Card',
      boss: 'Trial',
    },
    editable: true,
    artProject: 'zuzu-shifting-lands',
    artLanes: ['arthemy', 'zimage', 'krea2', 'flux2'],
  }
}
