import {
  COMPANIONS,
  DECKS,
  ITEMS,
  LOCATIONS,
  SKILL_LABELS,
  TIER_LABELS,
  VILLAINS,
  effectChips,
} from '../crystalStreet/rules'
import { TAGS, type Choice, type Encounter } from '../crystalStreet/types'
import {
  blankNode,
  humanize,
  storyOrder,
  type NodeKind,
  type Playbook,
  type PlaybookChoice,
  type PlaybookNode,
  type PlaybookRoute,
} from './types'

// Terrors on Crystal Street in the Playbook Manager (conductor crystal-street
// t-001). One route per nightmare: its three leads, three signature nights and
// the Halloween finale. Daylight locations and the shared night decks are forks
// whose pools list the cards they can deal. Scene text takes the live text overlay (rules.ts encounterById).

const TIERS = ['best', 'good', 'bittersweet', 'bad'] as const

function choiceView(choice: Choice): PlaybookChoice {
  return {
    id: choice.id,
    label: choice.label,
    check: { skill: SKILL_LABELS[choice.skill], target: choice.target },
    locked: choice.requires?.clues
      ? `Needs ${choice.requires.clues} leads`
      : undefined,
    tags: [
      choice.intent,
      ...(choice.bonus?.companion
        ? [`+${choice.bonus.amount} with ${choice.bonus.companion}`]
        : []),
      ...(choice.bonus?.item
        ? [`+${choice.bonus.amount} with ${choice.bonus.item}`]
        : []),
    ],
    success: { text: choice.success.text },
    failure: { text: choice.failure.text },
    effect:
      effectChips(choice.success.effects)
        .map((c) => c.text)
        .join(' · ') || undefined,
  }
}

function encounterNode(
  encounter: Encounter,
  kind: NodeKind,
  chapter: number | null,
  artUrl: string,
): PlaybookNode {
  const node = blankNode(encounter.id, kind, encounter.title)
  node.place = encounter.place
  node.chapter = chapter
  node.body = [encounter.text]
  node.choices = encounter.choices.map(choiceView)
  node.artUrl = artUrl
  node.needsArt = true
  node.editable = true
  node.editFields = { body: true, outcomes: true }
  node.provenance = `Art prompt: ${encounter.art}`
  return node
}

export function buildCrystalStreetPlaybook(): Playbook {
  const nodes: Record<string, PlaybookNode> = {}
  const routes: PlaybookRoute[] = []
  const endingKeys: string[] = []
  const add = (node: PlaybookNode) => (nodes[node.key] = node)
  const scene = (id: string) => `/crystal-street/scenes/${id}.webp`

  for (const villain of VILLAINS) {
    const steps: string[] = []
    const headings: Record<number, string> = { 0: 'Leads (by day)' }
    const placement = (day: number, dayName: string) => ({
      route: villain.id,
      routeName: villain.name,
      day,
      dayName,
      step: steps.length,
    })
    for (const clue of villain.clues) {
      const node = add(
        encounterNode(clue.encounter, 'quest', null, scene(clue.encounter.id)),
      )
      node.place = `${node.place} (lead: ${clue.title})`
      node.lenses = [...villain.tags]
      node.placements.push(placement(0, 'Any day'))
      steps.push(node.key)
    }
    headings[steps.length] = 'Signature nights'
    villain.signature.forEach((encounter, i) => {
      const node = add(
        encounterNode(encounter, 'encounter', (i + 1) * 2, scene(encounter.id)),
      )
      node.lenses = [...villain.tags]
      node.placements.push(placement((i + 1) * 2, `Night ${(i + 1) * 2}`))
      steps.push(node.key)
    })
    headings[steps.length] = 'Halloween'
    const finale = add(
      encounterNode(villain.finale, 'boss', 7, scene(villain.finale.id)),
    )
    finale.lenses = [...villain.tags]
    finale.variations = [
      {
        axis: 'issue',
        key: 'central',
        label: villain.centralIssue.title,
        text: villain.centralIssue.summary,
      },
      {
        axis: 'remix',
        key: villain.inspiration.kind,
        label: `${villain.inspiration.original}, ${villain.inspiration.film} (${villain.inspiration.year})`,
        text: `Old script: ${villain.inspiration.oldScript} New lens: ${villain.inspiration.newLens}`,
      },
    ]
    finale.placements.push(placement(7, 'Night 7'))
    steps.push(finale.key)
    for (const tier of TIERS) {
      const ending = villain.endings[tier]
      const node = add(
        blankNode(`ending:${villain.id}:${tier}`, 'ending', ending.title),
      )
      node.place = `${villain.name} · ${TIER_LABELS[tier]}`
      node.body = [ending.text]
      node.lenses = [...villain.tags]
      node.artUrl = `/crystal-street/endings/${villain.id}-${tier}.webp`
      node.needsArt = true
      node.provenance = `Art prompt: ${ending.art}`
      endingKeys.push(node.key)
    }
    routes.push({
      id: villain.id,
      name: villain.name,
      kind: villain.epithet,
      steps,
      headings,
    })
  }

  const daySteps: string[] = []
  for (const location of LOCATIONS) {
    const key = `loc:${location.id}`
    const node = add(blankNode(key, 'fork', location.name))
    node.body = [location.blurb, `Trains ${SKILL_LABELS[location.train]}.`]
    node.pool = location.beats.map((b) => b.id)
    node.artUrl = `/crystal-street/locations/${location.id}.webp`
    node.provenance = `Art prompt: ${location.art}`
    node.choices = location.beats.map((b) => ({
      id: b.id,
      label: b.title,
      tags: [],
      leadsTo: b.id,
    }))
    for (const beat of location.beats)
      add(encounterNode(beat, 'encounter', null, scene(beat.id)))
    daySteps.push(key)
  }
  routes.push({
    id: 'daylight',
    name: 'Glimmer Falls by day',
    kind: 'Daylight beats',
    steps: daySteps,
    headings: {},
  })

  const deckSteps: string[] = []
  for (const deck of DECKS) {
    const key = `deck:${deck.tag}`
    const node = add(blankNode(key, 'fork', deck.name))
    node.body = [deck.blurb]
    node.lenses = [deck.tag]
    node.pool = deck.encounters.map((e) => e.id)
    node.choices = deck.encounters.map((e) => ({
      id: e.id,
      label: e.title,
      tags: [],
      leadsTo: e.id,
    }))
    for (const encounter of deck.encounters) {
      const n = add(
        encounterNode(encounter, 'encounter', null, scene(encounter.id)),
      )
      n.lenses = [deck.tag]
    }
    deckSteps.push(key)
  }
  routes.push({
    id: 'night-decks',
    name: 'Night decks',
    kind: 'Shared pulls by tag',
    steps: deckSteps,
    headings: {},
  })

  const companionKeys: string[] = []
  for (const companion of COMPANIONS) {
    const node = add(
      encounterNode(
        companion.meet,
        'follower',
        null,
        `/crystal-street/companions/${companion.id}-poster.webp`,
      ),
    )
    node.companions = [companion.id]
    node.provenance = `${companion.bio} Art prompt: ${companion.meet.art}`
    node.variations = Object.entries(companion.emotions).map(
      ([emotion, e]) => ({
        axis: 'emotion',
        key: emotion,
        label: humanize(emotion),
        text: e.line,
      }),
    )
    companionKeys.push(node.key)
  }

  const artRequirements: NonNullable<Playbook['artRequirements']> = []
  const required = (key: string, title: string, url: string) =>
    artRequirements.push({ key, title, url })

  for (const node of Object.values(nodes))
    for (const choice of node.choices) {
      if (!choice.success || !choice.failure) continue
      for (const result of ['success', 'failure'] as const)
        required(
          `outcome:${node.key}:${choice.id}:${result}`,
          `${node.title} · ${choice.label} · ${result}`,
          `/crystal-street/outcomes/${node.key}--${choice.id}-${result}.webp`,
        )
    }
  for (const companion of COMPANIONS)
    for (const emotion of Object.keys(companion.emotions))
      required(
        `companion:${companion.id}:${emotion}`,
        `${companion.name} · ${emotion}`,
        `/crystal-street/companions/${companion.id}-${emotion}.webp`,
      )
  for (const villain of VILLAINS)
    for (const pose of ['portrait', 'poster', 'ending'] as const)
      required(
        `villain:${villain.id}:${pose}`,
        `${villain.name} · ${pose}`,
        `/crystal-street/villains/${villain.id}-${pose}.webp`,
      )
  for (const item of ITEMS)
    required(
      `item:${item.id}`,
      `Item · ${item.name}`,
      `/crystal-street/items/${item.id}.webp`,
    )

  return {
    game: 'crystal-street',
    title: 'Terrors on Crystal Street',
    blurb:
      'Twenty-two nightmares, many of them gender-flipped classic villains, each with three leads, three signature nights and a Halloween finale.',
    routes,
    nodes,
    artRequirements,
    order: storyOrder(routes, [...companionKeys, ...endingKeys, ...Object.keys(nodes)]),
    sections: [
      {
        title: 'Endings',
        blurb: 'Best, good, bittersweet and taken, for every nightmare.',
        keys: endingKeys,
      },
      {
        title: 'Companions',
        blurb: 'First meetings for all 22 friends.',
        keys: companionKeys,
      },
    ],
    people: COMPANIONS.map((c) => ({ id: c.id, label: c.name })),
    peopleLabel: 'Companion',
    variations: TAGS.map((t) => ({ id: t, label: humanize(t) })),
    variationLabel: 'Tag',
    dayLabel: 'Night',
    kindLabels: {
      quest: 'Lead',
      encounter: 'Scene',
      boss: 'Finale',
      fork: 'Deck',
      follower: 'Companion',
      ending: 'Ending',
    },
    editable: true,
    artProject: 'crystal-street',
    artLanes: ['zimage', 'krea2', 'flux2', 'arthemy'],
  }
}
