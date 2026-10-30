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
  {
    id: 'the-voice-that-came-home',
    questId: 'every-letter-delivered',
    title: 'The Voice That Came Home',
    premise:
      'Pip recognizes the voice trapped in the stump as the courier who vanished from his route book. A painted guest remembers the same voice, but not the name that once belonged to it. The last sealed letter may finally tell them whom they have been delivering to.',
    requires: [
      { scope: 'briar', key: '2,4', choice: 'lend' },
      { scope: 'briar', key: '3,5', choice: 'listen' },
      { scope: 'house', key: 'HD-07', choice: 'speak' },
    ],
    branch: {
      scope: 'briar',
      key: '6,4',
      outcomes: {
        carry:
          'You keep the Knight’s apology sealed and carry it past the listening stump. The painted guest recognizes the cadence of the vanished courier and tells Pip which doorstep the letter belongs to. Pip writes the destination in his own hand rather than surrendering the voice to the Index. The letter can reach its owner without exposing their name, but nobody can yet prove who took the courier from the road.',
        read: 'You open the destruction order and warn the House before carrying another sealed word. The painted guest recognizes the vanished courier’s voice in the order’s witness clause. Pip copies the clause into his route book so the village can challenge the Knight’s authority, then closes the book before the Index arrives. The House gains time to prepare, but the courier’s private address is now evidence that someone may demand to see.',
      },
    },
  },
  {
    id: 'the-road-without-an-owner',
    questId: 'the-patrols-defense',
    title: 'The Road Without an Owner',
    premise:
      'Vesper overlays her erased route on the wolf patrol’s tracks and the House service map. The three lines meet at a door nobody has admitted owning. The Wolf-Mother offers to testify, provided the map does not become another list of children for the Index.',
    requires: [
      { scope: 'briar', key: '3,2', choice: 'ask' },
      { scope: 'briar', key: '2,2', choice: 'observe' },
      { scope: 'house', key: 'HD-12', choice: 'map' },
    ],
    branch: {
      scope: 'house',
      key: 'HD-26',
      outcomes: {
        testify:
          'You bring the patrol’s evidence into a witnessed hearing. Vesper traces the missing road without naming the children who crossed it; the Wolf-Mother signs for her own actions and refuses to sign for theirs. The Index must acknowledge that the patrol protected travelers rather than hunted them. A public record may clear the wolves, but it also reveals where the House concealed a passage, so Oren begins planning a safer route.',
        shelter:
          'You choose food and safe passage over a formal hearing. Vesper redraws the missing road on a map that stays with the Wolf-Mother, and the children leave by a route the Index cannot subpoena. The patrol remains accused in the village ledger, and the Wolf-Mother accepts that cost for tonight. She asks you to remember the witnesses who chose privacy, not to call their silence a confession.',
      },
    },
  },
  {
    id: 'two-crowns-one-promise',
    questId: 'different-waters-same-face',
    title: 'Two Crowns, One Promise',
    premise:
      'Scylla’s careful manifest, Char’s improvised escape and the story behind her charm describe three different versions of the sisters’ departure. Neither will let a court clerk declare which one was the true royal account. At Lantern Landing they ask who gets to remember it.',
    requires: [
      { scope: 'briar', key: '4,4', choice: 'escort' },
      { scope: 'house', key: 'HD-10', choice: 'improvise' },
      { scope: 'house', key: 'HD-11', choice: 'respect' },
    ],
    branch: {
      scope: 'house',
      key: 'HD-30',
      outcomes: {
        rest: 'You give the sisters a quiet landing instead of demanding their history. Scylla checks the supplies while Char repairs the charm she once wore to leave home; each adds one line to a shared itinerary without asking the other to surrender her version. They agree to travel together tomorrow, not to settle what their crowns mean tonight. Their trust survives, but the unanswered royal summons remains in Oren’s ledger.',
        talk: 'You invite both sisters to say what the House owes them, and each speaks for herself. Scylla asks for a route home that does not bind Char to a throne; Char asks that nobody treat her leaving as proof she stopped loving her family. Oren records two separate wishes rather than a single royal order. The sisters leave with a shared plan to negotiate, but a court that demands one heir may reject both of their terms.',
      },
    },
  },
  {
    id: 'supper-for-tomorrow',
    questId: 'feed-the-orchard-workers',
    title: 'Supper for Tomorrow',
    premise:
      'The orchard has released its fruit, the cook has her spoon, and the House has admitted the absent guest to supper. The workers carry the final apple to the kitchen and ask whether one meal or a future harvest should inherit their names.',
    requires: [
      { scope: 'briar', key: '3,1', choice: 'harvest' },
      { scope: 'briar', key: '1,3', choice: 'return' },
      { scope: 'house', key: 'HD-04', choice: 'share' },
    ],
    branch: {
      scope: 'briar',
      key: '1,8',
      outcomes: {
        plant:
          'You plant the last apple where the workers can tend its seeds. The field cook uses the House bread to feed the pickers tonight, but the fruit itself becomes a sapling rather than a meal. The keeper writes the workers into the new orchard charter as owners, not harvest debts. Nobody can promise when it will bear; the hungry must share what remains until then.',
        share:
          'You divide the last apple among the workers and the guest whose place the House pantry finally acknowledged. Each portion carries a name once rubbed out of the harvest tally. The cook records the names only with permission, and the workers eat together tonight. There is no seedling from this apple, so they must bargain for next year’s planting instead of pretending the orchard is restored.',
      },
    },
  },
  {
    id: 'the-name-left-blank',
    questId: 'names-on-the-lintel',
    title: 'The Name Left Blank',
    premise:
      'Eleven painted guests, eleven erased names and the elder’s bargain finally agree. In the next room a living daughter has written that she left freely. The House asks whether a complete count entitles the village to claim a twelfth person.',
    requires: [
      { scope: 'briar', key: '6,3', choice: 'remember' },
      { scope: 'house', key: 'HD-07', choice: 'count' },
      { scope: 'house', key: 'HD-17', choice: 'read' },
    ],
    branch: {
      scope: 'house',
      key: 'HD-20',
      outcomes: {
        testify:
          'You testify that the daughter left by choice, using the letters she authorized the House to preserve. The village corrects its list: eleven stolen records are evidence of coercion, but her absence is not a twelfth theft. Her family hears the truth without receiving her address. The public hearing may still draw unwanted attention to the witnesses who helped her leave.',
        protect:
          'You return the daughter’s letters without her address and ask the House to keep her line blank until she chooses to speak. The eleven erased guests are still counted separately; their claim does not swallow hers. The family cannot use the registry to find her, but some villagers continue accusing the House of hiding a captive because no public testimony settles the dispute.',
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
