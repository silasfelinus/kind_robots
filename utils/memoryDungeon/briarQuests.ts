import { HOUSE_ROOMS, type HouseRoomId } from './house'
import { BRIAR_SCENES } from './scenes'

/**
 * World One's side quests: eight threads that run across Briar scenes and
 * House rooms the player already visits. A step is taken by the choice that
 * advances it, and a different choice at the same place closes the thread
 * with its own ending. Progress is read from decisions the save already keeps
 * (Briar scene choices and House room choices), so threads need no save
 * field. Steps can be taken in any order: the map is open.
 */
export type BriarQuestLens = 'community' | 'bonds' | 'obligation' | 'honesty'

export interface BriarQuestStep {
  scope: 'briar' | 'house'
  key: string
  /** Choices that take this step; any other choice here closes the thread. */
  advance: readonly string[]
  text: string
  /** Alternate authored resolutions for choices that close this step. */
  closedOutcomes?: Readonly<Record<string, string>>
}

export interface BriarQuest {
  /** Stable id, never renamed. */
  id: string
  title: string
  giver: string
  /** The House epilogue lens a finished thread strengthens. */
  lens: BriarQuestLens
  hook: string
  steps: readonly BriarQuestStep[]
  complete: string
  closed: string
  artPrompt: string
  artPath: string
}

const STYLE =
  'Hand-painted gouache and ink illustration in muted moss green, ember orange and slate blue.'
const ROOT = '/images/memory-dungeon/briar/quests'

const quest = (
  q: Omit<BriarQuest, 'artPath' | 'artPrompt'> & { scene: string },
): BriarQuest => {
  const { scene, ...rest } = q
  return {
    ...rest,
    artPrompt: `${scene} ${STYLE}`,
    artPath: `${ROOT}/${q.id}.webp`,
  }
}

export const BRIAR_QUESTS: readonly BriarQuest[] = [
  quest({
    id: 'every-letter-delivered',
    title: 'Every Letter Delivered',
    giver: 'The couriers of Briar',
    lens: 'community',
    hook: 'Three couriers on three roads are carrying letters somebody would rather see opened, burned or lost. None of them asked you for help. All of them could use it.',
    steps: [
      {
        scope: 'briar',
        key: '2,4',
        advance: ['lend'],
        text: 'Lend the night courier your lantern at the two-arrow post.',
        closedOutcomes: {
          copy: 'You kept your lantern and copied the impossible address. The courier can still try the unlit road, but you cannot promise a safe delivery. You keep the address as evidence, though it is no substitute for someone volunteering to walk the road.',
        },
      },
      {
        scope: 'briar',
        key: '1,4',
        advance: ['inspect'],
        text: 'Read the red courier’s contract before anyone knocks.',
        closedOutcomes: {
          knock:
            'You stood beside the red courier and made Grandmother name the children excluded from her bargain. The courier carries their testimony instead of a quietly inspected contract. The letter remains sealed, but its delivery must now wait for the people it would erase.',
        },
      },
      {
        scope: 'briar',
        key: '6,4',
        advance: ['carry'],
        text: 'Carry the Brass Knight’s apology for Pip, and leave the destruction order sealed.',
        closedOutcomes: {
          read: 'You broke the destruction order’s seal and warned the House before the threat could arrive. Pip must account for an opened letter, and the Knight’s apology travels more slowly. The House has time to shelter its residents, which matters more than a perfect delivery record.',
        },
      },
    ],
    complete:
      'The letters arrive unopened and on time, which in Briar counts as a small miracle. The couriers start leaving a lantern at the two-arrow post for whoever walks the night road next. Pip enters your name in his book under "reliable", then crosses it out and writes "suspiciously reliable".',
    closed:
      'One letter was opened or kept, and the couriers notice. They still nod to you on the road, but they choose their own routes now.',
    scene:
      'Three couriers stand at a lantern-lit forest crossroads at night: a young courier in a dark cloak, an adult courier in a red hooded cloak and a small green-skinned goblin in a patched brown coat. Each holds out a sealed envelope toward a wooden post where a brass lantern hangs from a hook. Warm lantern light, cold blue moonlight. Wide shot.',
  }),
  quest({
    id: 'the-patrols-defense',
    title: 'The Patrol’s Defense',
    giver: 'The Wolf-Mother',
    lens: 'honesty',
    hook: 'The village calls the wolf patrol raiders. The tracks, the scratches and the safe-conduct lists all say they have been standing guard. Somebody has to carry the evidence all the way to the House.',
    steps: [
      {
        scope: 'briar',
        key: '2,2',
        advance: ['observe'],
        text: 'Sketch the wolf track and which way the claw marks face.',
        closedOutcomes: {
          report:
            'You warned the village that its story about the patrol was wrong. Doors closed, and the child who listened now knows whom to ask, but your unrecorded tracks cannot yet protect a witness from the council’s accusation.',
        },
      },
      {
        scope: 'briar',
        key: '4,6',
        advance: ['testify'],
        text: 'Carry the patrol’s list of escorted children to the Index.',
        closedOutcomes: {
          shelter:
            'You found the courier a safe road instead of carrying the names to the Index. The families gain shelter tonight, but the patrol must still petition alone to remove the false tribute charge from the village record.',
        },
      },
      {
        scope: 'house',
        key: 'HD-05',
        advance: ['open'],
        text: 'Unlatch the patrol route the House barred from the inside.',
        closedOutcomes: {
          test: 'You traced the payment for the barred latch to someone afraid of witnesses. The proof matters, but the gate stays locked, leaving the Wolf-Mother to guide families along a longer and less sheltered road.',
        },
      },
      {
        scope: 'house',
        key: 'HD-26',
        advance: ['testify'],
        text: 'Record the Wolf-Mother’s evidence and name her witnesses.',
        closedOutcomes: {
          shelter:
            'You offered food and safe passage instead of a formal hearing. The Wolf-Mother accepts the help and keeps her petition; until the Index hears her witnesses, the village can still call protection a raid.',
        },
      },
    ],
    complete:
      'The patrol’s record stands in the House beside the village’s accusation, and neither can be quietly removed. The Wolf-Mother does not thank you. She asks for blankets for the winter route, and the village, grudgingly, sends them.',
    closed:
      'You helped the patrol in your own way, but the evidence never reached the record whole. The accusation still stands in the village ledger, unanswered.',
    scene:
      'A large grey she-wolf with a scarred muzzle and a leather harness of supply pouches sits upright in a stone manor hall beside a lectern with an open ledger. Villagers in winter coats stand across the hall holding folded wool blankets. Lantern light from the left. Medium-wide shot.',
  }),
  quest({
    id: 'orens-emergency-manifest',
    title: 'Oren’s Emergency Manifest',
    giver: 'Oren Pike',
    lens: 'community',
    hook: 'Oren keeps a manifest of every safe exit in the Briar and the House. It has gaps. He would never ask you to fill them, and he has already left you the pencil.',
    steps: [
      {
        scope: 'briar',
        key: '4,3',
        advance: ['plan', 'load'],
        text: 'Help Oren at the stuck carriage, with the plan or the parcels.',
      },
      {
        scope: 'briar',
        key: '6,1',
        advance: ['mark'],
        text: 'Mark a safer return route at the Rootbound Threshold.',
      },
      {
        scope: 'house',
        key: 'HD-06',
        advance: ['route', 'stock'],
        text: 'Learn or restock the broom-closet exit.',
      },
      {
        scope: 'house',
        key: 'HD-24',
        advance: ['mark'],
        text: 'Mark the dry cellar loop for other expeditions.',
      },
    ],
    complete:
      'Oren copies your marks into the manifest in a hand so neat it looks printed, then adds one line at the bottom that he does not let you read. Every exit in the House is now on a page anybody may borrow. Scylla calls it a triumph of administration. Char calls it a map, which is higher praise.',
    closed:
      'One exit went unmarked. Oren fills the gap himself without comment, which somehow feels worse than a comment.',
    scene:
      'A very tall broad man in a rough brown cloth executioner hood with two eyeholes sits on a crate in a lantern-lit manor cellar, writing in a large open ledger balanced on his knee. Bright ribbons are tied to the stair rail behind him, and a water cask stands by the steps. Warm lamplight. Medium shot.',
  }),
  quest({
    id: 'different-waters-same-face',
    title: 'Different Waters, Same Face',
    giver: 'Scylla and Char',
    lens: 'bonds',
    hook: 'The princesses have declared you part of the expedition. Neither will say why they left home together, or what each one gave up so the other could come.',
    steps: [
      {
        scope: 'briar',
        key: '4,4',
        advance: ['escort', 'question'],
        text: 'Join the princesses at the carriage stuck between two trees.',
      },
      {
        scope: 'house',
        key: 'HD-10',
        advance: ['improvise'],
        text: 'Let Char improvise while Scylla manages the supplies.',
      },
      {
        scope: 'house',
        key: 'HD-11',
        advance: ['respect'],
        text: 'Ask Char how her protective charm was made.',
      },
      {
        scope: 'house',
        key: 'HD-30',
        advance: ['talk'],
        text: 'Hear what each companion thinks the House owes.',
      },
    ],
    complete:
      'On the landing, Scylla finally admits that she packed the extra wardrobe so Char would never have to borrow a dress at court again. Char admits she knew, and that she wore the borrowed dresses anyway so Scylla could feel useful. Neither apologises. They trade cups and finish each other’s tea.',
    closed:
      'The twins stay cheerful company, but the conversation you might have had on the landing never happens. They keep their reasons to themselves.',
    scene:
      'Two stout broad-shouldered women with the same face sit side by side on a cushioned bench on a lantern-lit stair landing, trading teacups. One has light brown skin, a chestnut braid and a small silver crown with a navy travel coat. The other has deep brown skin, a high black braid and black velvet and lace with silver rings. Warm lamplight. Medium shot.',
  }),
  quest({
    id: 'mosswicks-true-account',
    title: 'Mosswick’s True Account',
    giver: 'Mosswick',
    lens: 'obligation',
    hook: 'Mosswick paid you a flower as earnest money for a story worth more than the flower. He wants to know whose name belongs on the blank line in his ledger, and so, it turns out, do you.',
    steps: [
      {
        scope: 'briar',
        key: '4,2',
        advance: ['promise'],
        text: 'Promise Mosswick a true account.',
      },
      {
        scope: 'briar',
        key: '7,4',
        advance: ['register'],
        text: 'Give the Index your name, and take the carbon copy.',
      },
      {
        scope: 'house',
        key: 'HD-25',
        advance: ['compare', 'recount'],
        text: 'Read the Bargain Ledger for who signed and who inherited.',
      },
    ],
    complete:
      'You bring Mosswick the Index’s carbon copy and what the Bargain Ledger told you. He reads it twice, fills the blank line with two names instead of one, and closes the book. "A true account," he says, "is the only kind I cannot resell." He pays you in lantern oil and an uncomfortable amount of respect.',
    closed:
      'You never brought Mosswick the whole account. The blank line in his ledger stays blank, and he still marks it with your silhouette.',
    scene:
      'A stooped old man with a long grey braided beard and a patched moss-green coat stands behind a forest stall of brass lanterns, writing on an open black ledger with a quill. A traveller’s hand lays a thin carbon-paper sheet on the ledger beside him. Warm lantern light, dark blue evening forest. Medium close-up.',
  }),
  quest({
    id: 'an-apology-for-the-door',
    title: 'An Apology for the Door',
    giver: 'The Brass Knight',
    lens: 'obligation',
    hook: 'The Brass Knight swore to guard a crossing and sent two letters to the House: one apologising, one ordering it destroyed. He has asked you to carry the first and to forget the second exists.',
    steps: [
      {
        scope: 'briar',
        key: '5,4',
        advance: ['errand'],
        text: 'Agree to carry the Knight’s sealed apology.',
        closedOutcomes: {
          truth:
            'You told the Knight that his promised crossing never existed. He marked the Vault on your map but entrusted you with no letter. He must now decide whether to rebuild the bridge before asking the House to forgive an oath he never kept.',
        },
      },
      {
        scope: 'briar',
        key: '5,5',
        advance: ['question'],
        text: 'Ask the Moss Sprite whose favour it is remembering.',
        closedOutcomes: {
          gift: 'You gave the Moss Sprite a silver wildflower to settle its grievance. It promised to testify that somebody listened, but you did not learn whose broken oath it remembered. The Knight’s apology has no witness to the promise he erased.',
        },
      },
      {
        scope: 'briar',
        key: '6,4',
        advance: ['carry'],
        text: 'Choose the apology over the destruction order when Pip offers both.',
        closedOutcomes: {
          read: 'You opened the Knight’s destruction order and warned the House. Pip must explain the broken seal, but the residents can prepare for danger instead of trusting a private apology. The Knight must answer for both letters in public.',
        },
      },
      {
        scope: 'briar',
        key: '6,2',
        advance: ['witness'],
        text: 'Promise the House to witness its residents.',
        closedOutcomes: {
          demand:
            'You demanded to know who owns the House’s stored memories before promising to witness its residents. The House admitted you but turned its plaque away. The Knight’s apology cannot stand in for the residents’ testimony or their consent.',
        },
      },
    ],
    complete:
      'The House takes the Knight’s apology, reads it in a voice like a door settling on its hinges, and does not answer. The next morning a bridge stands over the dry creek where the toll collector sits, plain timber, exactly wide enough for one knight. Nobody admits to building it.',
    closed:
      'The apology never reached the door in the way the Knight hoped. He keeps polishing his shield and does not ask you about it again.',
    scene:
      'A tall knight in dented brass plate armor kneels before the root-grown front door of a dark manor, holding out a sealed envelope in both gauntlets. A knee-high moss-covered sprite with a leaf cap watches from the porch rail. Early morning mist. Medium-wide shot.',
  }),
  quest({
    id: 'feed-the-orchard-workers',
    title: 'Feed the Orchard Workers',
    giver: 'The orchard keeper',
    lens: 'community',
    hook: 'Briar’s orchards and kitchens are feeding everyone on memories, spoons and promises. The people who pick the fruit have not eaten a real meal since the harvest bell started answering back.',
    steps: [
      {
        scope: 'briar',
        key: '3,1',
        advance: ['harvest'],
        text: 'Gather only the fruit the Sleepless Orchard releases.',
      },
      {
        scope: 'briar',
        key: '1,3',
        advance: ['return'],
        text: 'Give the bent spoon back to the field cook and share real food.',
      },
      {
        scope: 'briar',
        key: '1,8',
        advance: ['plant', 'share'],
        text: 'Decide what the last apple is for.',
      },
      {
        scope: 'house',
        key: 'HD-04',
        advance: ['share'],
        text: 'Divide the Clockwork Pantry’s rations with the absent guest.',
      },
    ],
    complete:
      'The field cook opens a kitchen at the orchard gate. The keeper brings the apples the trees let go, and the House’s pantry sends bread it admits it had been hoarding. It is not a feast, but for one evening the people who pick the fruit eat first.',
    closed:
      'Some of the food went where it was promised instead of where it was needed. The pickers eat, but later, and less.',
    scene:
      'Orchard pickers in patched work clothes sit at a long trestle table under apple trees at dusk, eating bread and stew from wooden bowls. A weary middle-aged cook with rolled sleeves ladles stew from an iron pot. A grey-haired orchard keeper sets down a basket of red apples. Warm lantern light. Wide shot.',
  }),
  quest({
    id: 'names-on-the-lintel',
    title: 'Names on the Lintel',
    giver: 'The House That Remembers',
    lens: 'honesty',
    hook: 'The House’s doorway carries names that the royal records say never existed, and the vault door carries a dozen more, each crossed out by a different hand. Someone should find out who they were before anyone decides what they were worth.',
    steps: [
      {
        scope: 'briar',
        key: '6,3',
        advance: ['remember'],
        text: 'Copy the crossed-out names at the vault threshold.',
      },
      {
        scope: 'house',
        key: 'HD-07',
        advance: ['count'],
        text: 'Count the uninvited guests in the Family Portrait Hall.',
      },
      {
        scope: 'house',
        key: 'HD-17',
        advance: ['read'],
        text: 'Read both sides of the village elder’s bargain.',
      },
    ],
    complete:
      'Eleven names, eleven painted guests and one bargain. They were travellers who signed away their memories to the House for shelter and were struck from the village count when they did. You read the names aloud on the porch. Two old women in the crowd answer to theirs.',
    closed:
      'You left some names hidden or uncounted. The lintel keeps them, and so does the House, but nobody outside it will say them for a while yet.',
    scene:
      'On the crooked wooden porch of a dark manor grown from roots, a cloaked fey traveller with long pointed ears reads from an open notebook to a crowd of villagers on the steps. Two elderly women in shawls raise their hands. The heavy carved lintel above the door is covered in small notches. Late afternoon light. Wide shot.',
  }),
]

export type BriarQuestState = 'unstarted' | 'active' | 'complete' | 'closed'

export interface BriarQuestProgress {
  quest: BriarQuest
  state: BriarQuestState
  steps: { step: BriarQuestStep; state: 'open' | 'done' | 'closed' }[]
  done: number
}

export function briarQuestProgress(
  quest: BriarQuest,
  briarDecisions: Readonly<Record<string, string>>,
  houseDecisions: Readonly<Record<string, string>>,
): BriarQuestProgress {
  const steps = quest.steps.map((step) => {
    const made =
      step.scope === 'briar'
        ? briarDecisions[step.key]
        : houseDecisions[step.key]
    return {
      step,
      state:
        !made || !choiceIds(step)?.includes(made)
          ? ('open' as const)
          : step.advance.includes(made)
            ? ('done' as const)
            : ('closed' as const),
    }
  })
  const done = steps.filter((s) => s.state === 'done').length
  const state: BriarQuestState = steps.some((s) => s.state === 'closed')
    ? 'closed'
    : done === steps.length
      ? 'complete'
      : done
        ? 'active'
        : 'unstarted'
  const firstClosed = steps.find((entry) => entry.state === 'closed')
  const closingChoice = firstClosed
    ? firstClosed.step.scope === 'briar'
      ? briarDecisions[firstClosed.step.key]
      : houseDecisions[firstClosed.step.key]
    : undefined
  const closedOutcome = closingChoice
    ? firstClosed?.step.closedOutcomes?.[closingChoice]
    : undefined
  return {
    quest: closedOutcome ? { ...quest, closed: closedOutcome } : quest,
    state,
    steps,
    done,
  }
}

export function briarQuestLog(
  briarDecisions: Readonly<Record<string, string>>,
  houseDecisions: Readonly<Record<string, string>>,
): BriarQuestProgress[] {
  return BRIAR_QUESTS.map((quest) =>
    briarQuestProgress(quest, briarDecisions, houseDecisions),
  )
}

export function validateBriarQuests(): string[] {
  const issues: string[] = []
  if (BRIAR_QUESTS.length !== 8) issues.push('World One has eight side quests')
  if (new Set(BRIAR_QUESTS.map((q) => q.id)).size !== BRIAR_QUESTS.length)
    issues.push('Quest ids repeat')
  for (const q of BRIAR_QUESTS) {
    if (q.steps.length < 3) issues.push(`${q.id} needs at least three steps`)
    if (q.complete.length < 150 || q.closed.length < 60 || q.hook.length < 80)
      issues.push(`${q.id} is unwritten`)
    let closable = false
    for (const step of q.steps) {
      if (step.key === 'HD-35' || step.key === 'HD-36')
        issues.push(`${q.id} waits on the Hearth`)
      const ids = choiceIds(step)
      if (!ids) {
        issues.push(`${q.id} step ${step.key} is not a place`)
        continue
      }
      if (!step.advance.every((id) => ids.includes(id)))
        issues.push(`${q.id} step ${step.key} advances on a missing choice`)
      const alternatives = ids.filter((id) => !step.advance.includes(id))
      if (alternatives.length) closable = true
      if (step.closedOutcomes) {
        for (const id of alternatives)
          if (!step.closedOutcomes[id])
            issues.push(`${q.id} step ${step.key} lacks ${id} resolution`)
        for (const [id, ending] of Object.entries(step.closedOutcomes)) {
          if (!alternatives.includes(id))
            issues.push(`${q.id} step ${step.key} has invalid ${id} resolution`)
          if (ending.trim().length < 90)
            issues.push(`${q.id} step ${step.key} has thin ${id} resolution`)
        }
      }
    }
    // A step any choice takes is fine; a thread made only of them would be
    // a checklist, not a quest.
    if (!closable) issues.push(`${q.id} can never close`)
  }
  return issues
}

function choiceIds(step: BriarQuestStep): string[] | undefined {
  const place =
    step.scope === 'house'
      ? HOUSE_ROOMS[step.key as HouseRoomId]
      : (
          BRIAR_SCENES as Record<string, { choices: readonly { id: string }[] }>
        )[step.key]
  return place?.choices.map((c) => c.id)
}
