import { RULER_HOOKED_CONTENT } from '../rulerHooked/content'
import { RULER_HOOKED_FISH, fishBestiaryImageSrc } from '../rulerHooked/fish'
import { RULER_HOOKED_OPENING } from '../rulerHooked/opening'
import { RULER_PRESETS } from '../rulerHooked/rulerPresets'
import { GEAR_CATALOG, KINGDOM_CATALOG } from '../rulerHooked/economy'
import { characterPortraitPath } from '../rulerHooked/characterArt'
import { cardArtPath } from '../rulerHooked/cardArt'
import { rulerHookedArtPrompt } from '../rulerHooked/artPrompts'
import type { Card } from '../../types/ruler-hooked'
import {
  blankNode,
  storyOrder,
  type NodeKind,
  type Playbook,
  type PlaybookNode,
  type PlaybookRoute,
} from './types'

// Playbook Studio adapter for The Ruler Is Hooked (Silas, 2026-10-27: "next
// we need support for cthulhuquarium and the ruler is hooked"). A fishing
// game rather than a branching story, so its authored content is the beats:
// the opening, the two event decks, the arcs and endings, the Fishopedia,
// the cast, the rulers, the rewards and the shop. Every picture is served
// from the image store (/images/ruler-hooked/…), so each beat names its
// runtime path as `artPath` and the ledger API reports which files exist.
// Its Krea 2 prompts live in utils/rulerHooked/artPrompts.ts, keyed by beat
// key, never built from titles.

const ROOT = '/images/ruler-hooked'

function beat(
  key: string,
  kind: NodeKind,
  title: string,
  options: {
    place: string
    chapter: number
    body: (string | undefined)[]
    artPath?: string
    companions?: string[]
    choices?: readonly { id: string; text: string; result?: string }[]
  },
): PlaybookNode {
  const node = blankNode(key, kind, title)
  node.place = options.place
  node.chapter = options.chapter
  node.body = options.body.filter((line): line is string => !!line?.trim())
  node.artPath = options.artPath
  node.needsArt = !!options.artPath
  node.artPrompt = options.artPath ? rulerHookedArtPrompt(key) : undefined
  node.companions = options.companions ?? []
  node.provenance = 'utils/rulerHooked'
  node.choices = (options.choices ?? []).map((choice) => ({
    id: choice.id,
    label: choice.text,
    tags: [],
    ...(choice.result ? { success: { text: choice.result } } : {}),
  }))
  return node
}

export function buildRulerHookedPlaybook(): Playbook {
  const content = RULER_HOOKED_CONTENT
  const nodes: Record<string, PlaybookNode> = {}
  const add = (node: PlaybookNode) => {
    nodes[node.key] = node
    return node.key
  }
  const regionState = (region: string) =>
    (content.regions.regions as Record<string, { states: string[] }>)[region]
      ?.states[0]

  const opening = RULER_HOOKED_OPENING.beats.map((b, i) =>
    add(
      beat(`opening:${i + 1}`, 'opening', b.heading, {
        place: b.sceneRegion ? b.sceneRegion.replace('_', ' ') : 'The Steward',
        chapter: 1,
        body: [b.text],
        artPath: b.sceneRegion
          ? `${ROOT}/${b.sceneRegion}-${regionState(b.sceneRegion)}.webp`
          : characterPortraitPath(RULER_HOOKED_OPENING.narratorSlug, 'neutral'),
        companions: b.sceneRegion ? [] : [RULER_HOOKED_OPENING.narratorSlug],
      }),
    ),
  )

  const card = (c: Card, place: string, kind: NodeKind, chapter: number) =>
    add(
      beat(`card:${c.id}`, kind, c.title, {
        place,
        chapter,
        body: [c.body],
        artPath: c.art ? cardArtPath(c.art) : undefined,
        companions: c.characters ?? [],
        choices: c.choices,
      }),
    )
  const decks = content.decks.map((deck) => ({
    deck,
    keys: deck.cards.map((c) =>
      card(
        c,
        deck.title ?? deck.id,
        c.kind === 'finale' ? 'crossroads' : 'encounter',
        2,
      ),
    ),
  }))
  const arcs = content.arcs.map((arc) => ({
    arc,
    keys: arc.steps.map((c) => card(c, arc.title ?? arc.id, 'spine', 3)),
  }))

  const endings = content.endings.map((ending) =>
    add(
      beat(`ending:${ending.outcomeKey}`, 'ending', ending.title, {
        place: ending.victoryType.toLowerCase(),
        chapter: 4,
        body: [ending.body],
        artPath: `${ROOT}/ending-${ending.outcomeKey}.webp`,
      }),
    ),
  )

  const fish = RULER_HOOKED_FISH.map((f) =>
    add(
      beat(`fish:${f.slug}`, 'thread', f.name, {
        place: `${f.affinity.toLowerCase()} · ${f.rarity.toLowerCase()}`,
        chapter: 5,
        body: [f.distinction, f.fishopediaNote, f.consequenceReveal],
        artPath: fishBestiaryImageSrc(f.slug),
      }),
    ),
  )

  const cast = content.characters.map((c) =>
    add(
      beat(`character:${c.slug}`, 'follower', c.name, {
        place: [c.honorific, c.role].filter(Boolean).join(' · '),
        chapter: 6,
        body: [c.drive, c.quirks],
        artPath: characterPortraitPath(c.slug, 'neutral'),
        companions: [c.slug],
      }),
    ),
  )

  const rulers = RULER_PRESETS.map((r) =>
    add(
      beat(`ruler:${r.id}`, 'boss', r.title, {
        place: 'Playable ruler',
        chapter: 7,
        body: [r.look],
        artPath: `${ROOT}/ruler-${r.id}.webp`,
      }),
    ),
  )

  const rewards = content.rewards.map((r) =>
    add(
      beat(`reward:${r.slug}`, 'quest', r.name, {
        place: `${r.rewardType.toLowerCase()} · ${r.rarity.toLowerCase()}`,
        chapter: 8,
        body: [r.description, r.effect],
        artPath: `${ROOT}/reward-${r.slug}.webp`,
      }),
    ),
  )

  const shop = [
    ...GEAR_CATALOG.map((g) => ({ ...g, line: 'Gear' })),
    ...KINGDOM_CATALOG.map((k) => ({ ...k, line: 'Kingdom upgrade' })),
  ].map((item) =>
    add(
      beat(`shop:${item.id}`, 'fork', item.name, {
        place: `${item.line} · ${item.cost} coins`,
        chapter: 9,
        body: [item.description],
        artPath: `${ROOT}/shop-${item.id}.webp`,
      }),
    ),
  )

  const route = (
    id: string,
    name: string,
    steps: string[],
    heading: string,
  ): PlaybookRoute => ({
    id,
    name,
    kind: 'deck',
    steps,
    headings: { 0: heading },
  })
  const routes = [
    route('opening', 'The opening', opening, 'A quiet coronation'),
    ...decks.map(({ deck, keys }) =>
      route(deck.id, deck.title ?? deck.id, keys, deck.title ?? deck.id),
    ),
    ...arcs.map(({ arc, keys }) =>
      route(arc.id, arc.title ?? arc.id, keys, arc.title ?? arc.id),
    ),
  ]

  return {
    game: 'ruler-hooked',
    title: 'The Ruler Is Hooked',
    blurb:
      'A ruler who would rather be fishing: interruptions from the kingdom, three arcs, four endings, the Fishopedia, the cast and the shop.',
    routes,
    nodes,
    order: storyOrder(routes, [
      ...endings,
      ...fish,
      ...cast,
      ...rulers,
      ...rewards,
      ...shop,
    ]),
    sections: [
      { title: 'Endings', blurb: 'How a reign closes.', keys: endings },
      { title: 'Fishopedia', blurb: 'Every species on the lake.', keys: fish },
      { title: 'Cast', blurb: 'Who interrupts the fishing.', keys: cast },
      { title: 'Rulers', blurb: 'Who you can reign as.', keys: rulers },
      { title: 'Rewards', blurb: 'What decisions grant.', keys: rewards },
      { title: 'Shop', blurb: 'Gear and kingdom upgrades.', keys: shop },
    ],
    people: content.characters.map((c) => ({ id: c.slug, label: c.name })),
    peopleLabel: 'Cast',
    variations: [],
    variationLabel: 'Outcome',
    dayLabel: 'Deck',
    kindLabels: {
      opening: 'Opening',
      encounter: 'Interruption',
      crossroads: 'Finale card',
      spine: 'Arc step',
      ending: 'Ending',
      thread: 'Fish',
      follower: 'Character',
      boss: 'Ruler',
      quest: 'Reward',
      fork: 'Shop item',
    },
    sectionLabels: {
      opening: 'Opening',
      encounter: 'Interruptions',
      crossroads: 'Finale cards',
      spine: 'Arcs',
      ending: 'Endings',
      thread: 'Fishopedia',
      follower: 'Cast',
      boss: 'Rulers',
      quest: 'Rewards',
      fork: 'Shop',
    },
    editable: false,
    artProject: 'ruler-hooked',
    artLanes: ['krea2'],
    artPromptsComplete: true,
  }
}
