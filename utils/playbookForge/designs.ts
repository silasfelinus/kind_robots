import type { NodeKind, Playbook, PlaybookNode } from '../playbook/types'
import type { AdditionKind } from './adjust'
import type { ForgeTab } from './factors'

// Designs: what each page of a playbook looks like, before and after it is
// built. A design is a named element with an authored art prompt (and, once
// rendered, its picture). An existing game's beats show up as design cards
// too, with their painting or their prompt, so every plan page leads with art.

export type Design = {
  id: string
  kind: AdditionKind
  title: string
  note: string
  /** The picture in plain prose. Never assembled from titles. */
  prompt?: string
  /** Where it came from: a Facet, a Character, a Scenario, a pitch. */
  source?: string
  /** A picture it already has (a catalogue card's art). */
  imageUrl?: string
  /** The ArtJob rendering its prompt. */
  jobId?: number
}

export type DesignCard = {
  id: string
  title: string
  subtitle: string
  kind: string
  imageUrl: string | null
  prompt: string | null
  /** A built beat (opens in Beats), or a design (edit and render here). */
  origin: 'beat' | 'design'
  beatKey?: string
  design?: Design
}

/** The beat kinds each plan page shows. */
export const TAB_BEATS: Record<ForgeTab, NodeKind[]> = {
  pitch: ['opening', 'crossroads'],
  player: ['opening'],
  cast: ['follower', 'boss', 'thread'],
  story: ['spine', 'encounter', 'quest', 'fork', 'crossroads'],
  rules: [],
  endings: ['ending'],
  save: [],
}

/** The design kinds each plan page adds. */
export const TAB_DESIGNS: Record<ForgeTab, AdditionKind[]> = {
  pitch: ['other', 'place'],
  player: ['other'],
  cast: ['follower', 'villain'],
  story: ['place', 'encounter', 'quest'],
  rules: ['other'],
  endings: ['ending'],
  save: ['other'],
}

const DESIGN_TAB: Record<AdditionKind, ForgeTab> = {
  follower: 'cast',
  villain: 'cast',
  quest: 'story',
  encounter: 'story',
  place: 'story',
  ending: 'endings',
  other: 'pitch',
}

export function designTab(kind: AdditionKind): ForgeTab {
  return DESIGN_TAB[kind]
}

function beatCard(node: PlaybookNode): DesignCard {
  return {
    id: `beat:${node.key}`,
    title: node.title,
    subtitle: node.place,
    kind: node.kind,
    imageUrl: node.artUrl,
    prompt: node.artPrompt?.trim() || null,
    origin: 'beat',
    beatKey: node.key,
  }
}

export function designCard(design: Design): DesignCard {
  return {
    id: `design:${design.id}`,
    title: design.title,
    subtitle: design.note,
    kind: design.kind,
    imageUrl: design.imageUrl ?? null,
    prompt: design.prompt?.trim() || null,
    origin: 'design',
    design,
  }
}

/** A plan page's cards: its designs first, then the game's beats of that page. */
export function cardsForTab(
  tab: ForgeTab,
  book: Pick<Playbook, 'order' | 'nodes'> | null,
  designs: Design[],
): DesignCard[] {
  const kinds = TAB_BEATS[tab]
  const own = designs.filter((d) => designTab(d.kind) === tab).map(designCard)
  const beats = book
    ? book.order
        .map((key) => book.nodes[key])
        .filter((node): node is PlaybookNode =>
          Boolean(node && kinds.includes(node.kind)),
        )
        .map(beatCard)
    : []
  return [...own, ...beats]
}

export function newDesignId(): string {
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
