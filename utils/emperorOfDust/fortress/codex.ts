import { FOLLOWERS } from './followers'
import { questDef } from './content'
import type { Codex, FollowerDef, FortressRun, TraitDef } from './types'

// The Codex (conductor SYSTEMS-V03.md, "Cross-run memory"): secret traits and
// true allegiances the emperor has learned, kept across every run and rewind.
// It holds trait ids and nothing else: never items, brass or relationships.

const TRAITS = new Map<string, { trait: TraitDef; follower: FollowerDef }>(
  FOLLOWERS.flatMap((follower) =>
    follower.traits.map((trait) => [trait.id, { trait, follower }] as const),
  ),
)

/** Only follower trait ids can enter the Codex. */
export const isCodexId = (id: unknown): id is string =>
  typeof id === 'string' && TRAITS.has(id)

export const codexTrait = (id: string) => TRAITS.get(id)

/** Every secret a follower carries, for "N of M learned". */
export const CODEX_SIZE = TRAITS.size

/** Allegiance traits whose conversation flag is set in this run. */
export const allegiancesKnown = (run: FortressRun): string[] =>
  [...TRAITS.values()]
    .filter(
      ({ trait }) => trait.revealFlag && run.flags.includes(trait.revealFlag),
    )
    .map(({ trait }) => trait.id)

const KIND_LABEL: Record<TraitDef['kind'], string> = {
  skill: 'Strength',
  weakness: 'Weakness',
  allegiance: 'True allegiance',
}

export type CodexEntry = {
  id: string
  kind: TraitDef['kind']
  kindLabel: string
  name: string
  text: string
  amount: number
  /** How it was learned: this reign's quest and dawn, a talk, or before. */
  how: string
}

/** Where this run learned a trait, if it did. */
export const howLearned = (run: FortressRun | null, id: string): string => {
  const entry = TRAITS.get(id)
  if (!entry) return ''
  for (const report of run?.reports ?? []) {
    const quest = report.quests.find((q) => q.revealedTraits.includes(id))
    if (quest)
      return `${questDef(quest.questId)?.title ?? 'On the road'}, dawn of Day ${report.day}.`
  }
  if (
    run &&
    entry.trait.revealFlag &&
    run.flags.includes(entry.trait.revealFlag)
  )
    return 'Said aloud, this reign.'
  return 'Learned in another reign, or on a road you rewound.'
}

export const codexEntry = (
  id: string,
  run: FortressRun | null = null,
): CodexEntry | null => {
  const entry = TRAITS.get(id)
  if (!entry) return null
  const { trait } = entry
  return {
    id,
    kind: trait.kind,
    kindLabel: KIND_LABEL[trait.kind],
    name: trait.name,
    text: trait.text,
    amount: trait.amount,
    how: howLearned(run, id),
  }
}

/** One stark line for a reveal moment: who, what. */
export const revealLine = (id: string): string => {
  const entry = TRAITS.get(id)
  if (!entry) return id
  return `${entry.follower.name}. ${KIND_LABEL[entry.trait.kind]}: ${entry.trait.name}. ${entry.trait.text}`
}

/** The Codex as pages, one per follower with anything learned, in roster order. */
export const codexPages = (codex: Codex, run: FortressRun | null = null) =>
  FOLLOWERS.map((follower) => {
    const entries = follower.traits
      .filter((trait) => codex.revealed.includes(trait.id))
      .map((trait) => codexEntry(trait.id, run)!)
    return {
      follower,
      entries,
      unknown: follower.traits.length - entries.length,
    }
  }).filter((page) => page.entries.length)
