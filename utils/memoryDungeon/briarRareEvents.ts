import { BRIAR_QUESTS } from './briarQuests'
import { HOUSE_ROOMS, type HouseRoomId } from './house'
import { BRIAR_SCENES } from './scenes'

type ChoiceScope = 'briar' | 'house'
type Decisions = Readonly<Record<string, string>>

interface ChoiceCondition {
  scope: ChoiceScope
  key: string
  choice: string
}

interface RareEventDefinition {
  id: string
  questId: string
  title: string
  premise: string
  requires: readonly ChoiceCondition[]
  branch: {
    scope: ChoiceScope
    key: string
    outcomes: Readonly<Record<string, string>>
  }
}

export interface EarnedBriarRareEvent {
  id: string
  questId: string
  title: string
  premise: string
  outcome: string
}

/**
 * Rare interludes are earned by four real decisions across different threads.
 * They are durable discoveries projected from existing save choices, never
 * repeatable rewards or a second mutable journal. Each has two consequences,
 * including the cost of the path not taken.
 */
export const BRIAR_RARE_EVENTS: readonly RareEventDefinition[] = [
  {
    id: 'the-fourth-column',
    questId: 'orens-emergency-manifest',
    title: 'The Fourth Column',
    premise:
      'When the wolf gate, the threshold ribbon and the cellar loop are all open, Oren unfolds a fourth column of his evacuation manifest. It is headed not WHERE, but WHO CANNOT LEAVE.',
    requires: [
      { scope: 'briar', key: '6,1', choice: 'mark' },
      { scope: 'house', key: 'HD-24', choice: 'mark' },
      { scope: 'house', key: 'HD-05', choice: 'open' },
    ],
    branch: {
      scope: 'briar',
      key: '4,3',
      outcomes: {
        plan: 'Because you drew the carriage route together, Oren can point to the exact turn where the stairs become too narrow for the injured. He redraws the public route around the mill, adding a slower crossing with room for a stretcher. Scylla signs the correction. Char insists on walking it before anyone calls it safe. The manifest now tells the truth, but the detour will cost the village a night of shelter.',
        load: 'Because you carried the provisions rather than drawing the route, Oren knows precisely which families have enough food to wait for a second cart. He opens the stores to the stranded travelers first, even though the House steward objects that the rations were counted for residents. Char carries the first basket; Scylla records who consented to share. The route remains difficult, but nobody is asked to march hungry to make the ledger balance.',
      },
    },
  },
  {
    id: 'the-second-signature',
    questId: 'mosswicks-true-account',
    title: 'The Second Signature',
    premise:
      'The Index carbon copy and the elder’s bargain agree on every date except one. Mosswick asks you to put the two records beside the blank line he tried to sell.',
    requires: [
      { scope: 'briar', key: '4,2', choice: 'promise' },
      { scope: 'briar', key: '7,4', choice: 'register' },
      { scope: 'house', key: 'HD-17', choice: 'read' },
    ],
    branch: {
      scope: 'house',
      key: 'HD-25',
      outcomes: {
        compare:
          'Your comparison shows that the second signature was added years after the first bargain. Mosswick could sell the discrepancy to the Index for a fortune. Instead he writes both dates in the public margin, then asks the surviving witness whether their name may be printed. They refuse. The margin remains anonymous but verifiable; the village has evidence without another person being entered into a debt they never agreed to.',
        recount:
          'Your spoken account reveals why the second signature looks older: the House remembered a promise before anyone made it. Mosswick cannot prove who would have signed, and he refuses to invent a debtor for the convenience of his ledger. He writes “disputed future” where a price should be. You lose the certainty of a named culprit, but the witness is spared a verdict built from an event that has not happened.',
      },
    },
  },
  {
    id: 'a-letter-written-back',
    questId: 'an-apology-for-the-door',
    title: 'A Letter Written Back',
    premise:
      'The Brass Knight’s sealed apology reaches the House beside the bargain you read. Someone inside has written a reply, and the Knight must decide whether to hear it.',
    requires: [
      { scope: 'briar', key: '5,4', choice: 'errand' },
      { scope: 'briar', key: '6,4', choice: 'carry' },
      { scope: 'house', key: 'HD-17', choice: 'read' },
    ],
    branch: {
      scope: 'briar',
      key: '6,3',
      outcomes: {
        remember:
          'You copied the crossed-out names, so the reply can be signed by the people the Knight’s order would have displaced. He reads each name without drawing his sword. The House agrees to a witnessed hearing, not forgiveness, and the Knight must bring his own account of the broken bridge. The record can finally be challenged in public, but the witnesses will have to decide how much of their lives to expose.',
        protect:
          'You shielded the names from the Index, so the reply reaches the Knight without a signature. He first calls it a trick, then recognizes a detail only someone who lived behind the door could know. He agrees to meet a witness with Oren present and no royal clerk. The people inside keep their privacy, but the village cannot yet cite their testimony to overturn the old destruction order.',
      },
    },
  },
]

function recordedChoice(
  scope: ChoiceScope,
  key: string,
  briar: Decisions,
  house: Decisions,
): string | undefined {
  return (scope === 'briar' ? briar : house)[key]
}

export function earnedBriarRareEvents(
  briar: Decisions,
  house: Decisions,
): EarnedBriarRareEvent[] {
  return BRIAR_RARE_EVENTS.flatMap((event) => {
    if (
      !event.requires.every(
        ({ scope, key, choice }) =>
          recordedChoice(scope, key, briar, house) === choice,
      )
    )
      return []
    const branch = recordedChoice(
      event.branch.scope,
      event.branch.key,
      briar,
      house,
    )
    const outcome = branch ? event.branch.outcomes[branch] : undefined
    return outcome
      ? [
          {
            id: event.id,
            questId: event.questId,
            title: event.title,
            premise: event.premise,
            outcome,
          },
        ]
      : []
  })
}

function validChoiceIds(
  scope: ChoiceScope,
  key: string,
): readonly string[] | undefined {
  const scene =
    scope === 'house'
      ? HOUSE_ROOMS[key as HouseRoomId]
      : (
          BRIAR_SCENES as Record<string, { choices: readonly { id: string }[] }>
        )[key]
  return scene?.choices.map((choice) => choice.id)
}

export function validateBriarRareEvents(): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  const questIds = new Set(BRIAR_QUESTS.map((quest) => quest.id))
  for (const event of BRIAR_RARE_EVENTS) {
    if (ids.has(event.id)) issues.push(`Duplicate rare event ${event.id}`)
    ids.add(event.id)
    if (!questIds.has(event.questId))
      issues.push(`${event.id} belongs to an unknown quest`)
    if (event.premise.length < 80)
      issues.push(`${event.id} needs an authored premise`)
    if (event.requires.length < 3)
      issues.push(`${event.id} is not a rare cross-thread convergence`)
    const sites = new Set<string>()
    for (const condition of event.requires) {
      const site = `${condition.scope}:${condition.key}`
      if (sites.has(site)) issues.push(`${event.id} repeats ${site}`)
      sites.add(site)
      if (
        !validChoiceIds(condition.scope, condition.key)?.includes(
          condition.choice,
        )
      )
        issues.push(`${event.id} requires an impossible choice at ${site}`)
    }
    const branch = event.branch
    const branchSite = `${branch.scope}:${branch.key}`
    if (sites.has(branchSite))
      issues.push(`${event.id} branches at a required site`)
    const allowed = validChoiceIds(branch.scope, branch.key)
    if (!allowed || allowed.length !== 2)
      issues.push(`${event.id} needs a two-choice branch at ${branchSite}`)
    const authored = Object.keys(branch.outcomes)
    if (
      authored.length !== 2 ||
      authored.some((choice) => !allowed?.includes(choice))
    )
      issues.push(`${event.id} has missing or invented outcomes`)
    for (const [choice, text] of Object.entries(branch.outcomes))
      if (text.trim().length < 180)
        issues.push(`${event.id} has thin ${choice} outcome`)
  }
  return issues
}
