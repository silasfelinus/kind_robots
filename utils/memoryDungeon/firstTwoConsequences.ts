import type { BriarSave } from '../memoryDungeonWorld'
import type { DarkBriarProgress } from './darkBriar'
import type { DarkHouseProgress, DarkHouseEarnedClue } from './darkHouse'

export type MemoryCustody = 'unset' | 'release' | 'renew' | 'break'
export type CrossingAccord = 'unset' | 'return' | 'commons'
export interface FirstTwoWorldFrames {
  memoryCustody: MemoryCustody
  crossingAccord: CrossingAccord
  /** One of six earned worldframes, or an explicitly incomplete campaign. */
  combination: string
}

/** Derive both major authoring switches from the two playable House decisions.
 * Never grant an unelected "good" worldframe or multiply every minor choice. */
export function firstTwoWorldFrames(
  briar: Pick<BriarSave, 'house'>,
  mirroredHouse: Pick<DarkHouseProgress, 'ending'> | null,
): FirstTwoWorldFrames {
  const original = briar.house?.ending
  const memoryCustody: MemoryCustody =
    original === 'release' || original === 'renew' || original === 'break'
      ? original
      : 'unset'
  const mirrored = mirroredHouse?.ending
  const crossingAccord: CrossingAccord =
    mirrored === 'return' || mirrored === 'commons' ? mirrored : 'unset'
  return {
    memoryCustody,
    crossingAccord,
    combination: `${memoryCustody}:${crossingAccord}`,
  }
}

type ChoiceLedger = Readonly<Record<string, string>>
interface Callback {
  target: string
  source: string
  responses: Readonly<Record<string, string>>
  /** Nearby and named-character callbacks outrank generalized lore. */
  priority: number
}

const CALLBACKS: readonly Callback[] = [
  {
    target: '2,4',
    source: '2,4',
    priority: 10,
    responses: {
      lend: 'The courier holds the lantern you lent. Its glass is cracked where another traveler took shelter beneath it.',
      copy: 'The courier produces the copy of the impossible address. The village used the record to contest an unpaid debt.',
    },
  },
  {
    target: '4,3',
    source: '4,3',
    priority: 10,
    responses: {
      plan: 'Oren still uses the route you planned together. Its spare column names every traveler who chose another road.',
      load: 'Oren has kept count of the provisions you carried. Someone ate because the account included actual meals.',
    },
  },
  {
    target: '3,2',
    source: '3,2',
    priority: 10,
    responses: {
      ask: 'Vesper remembers you asking whom the map omitted. A real name has appeared in the gap, and Vesper is not laughing.',
      offer:
        'Vesper unfolds the map purchased with your wildflower. A second ink line reveals someone paid to copy it.',
    },
  },
  {
    target: '5,4',
    source: '5,4',
    priority: 10,
    responses: {
      truth:
        'The Brass Knight recognizes the false oath you challenged. His replacement instructions mention actual travelers.',
      errand:
        'The sealed apology reached the intended family. It also allowed the Knight to remain at his empty station.',
    },
  },
  {
    target: '6,4',
    source: '6,4',
    priority: 9,
    responses: {
      carry:
        'The apology you carried brought a temporary truce. The undisclosed warning still haunts the village wall.',
      read: 'The Vault received your warning. The neighborhood evacuated in time, but an apology never arrived.',
    },
  },
  {
    target: '2,6',
    source: '2,6',
    priority: 8,
    responses: {
      trace:
        'A perfect copy of your original rune order is here, but the river has changed which end counts as first.',
      listen:
        'The gardener you listened to left a mark indicating the shore from which the old instructions were true.',
    },
  },
  {
    target: '3,5',
    source: '3,5',
    priority: 8,
    responses: {
      light:
        'Pip knows that you exposed the borrowed voice. They ask whether you also listened to what it needed.',
      listen:
        'The borrowed voice remembers that you heard its story to the end. One traveler wishes you had interrupted.',
    },
  },
  {
    target: '6,3',
    source: '6,3',
    priority: 8,
    responses: {
      remember:
        'The name-record you copied is useful evidence. The person it describes can now be summoned by strangers.',
      protect:
        'The protected witness is safe, but Oren needs an indirect method to validate their testimony.',
    },
  },
  {
    target: '2,5',
    source: '2,5',
    priority: 7,
    responses: {
      archive:
        'The timestamp you saved on Morrow’s Earth photograph can be checked against this new shadow.',
      grieve:
        'Your unease over the lost Earth life returns. The second shadow belongs to someone you have not met.',
    },
  },
]

const CUSTODY_OBJECTS: Readonly<
  Record<Exclude<MemoryCustody, 'unset'>, string>
> = {
  release:
    'Individual villagers carry wax-sealed memory packets toward the House. Several paper locks stand empty; a frightened courier guards a packet that belongs to its owner.',
  renew:
    'A small elected witness circle stands beside a wooden cabinet with removable brass locks. Each person holds a key to revoke their own agreement.',
  break:
    'The House archive lies in splintered cupboards. Villagers carry glass memory shards in cloth pockets, rebuilding a public path without a central ledger.',
}

/** This is one concrete physical scene projection, not three new maps.
 * Keep these images and props coherent as the Reimaginer changes worlds. */
export function firstTwoPhysicalConsequence(
  target: string,
  frames: FirstTwoWorldFrames,
): string | null {
  if (!['2,4', '6,3', '6,2'].includes(target)) return null
  if (frames.memoryCustody === 'unset') return null
  return CUSTODY_OBJECTS[frames.memoryCustody]
}

/** Stable, bounded callbacks: at most two short, earned reminders per scene.
 * 10 independent small decisions remain ten reusable channels, not 1024 quests. */
export function firstTwoSceneCallbacks(
  target: string,
  original: ChoiceLedger,
  mirrored: Pick<DarkBriarProgress, 'sceneChoices'>,
  max = 2,
): string[] {
  if (max <= 0) return []
  const available = CALLBACKS.filter((rule) => rule.target === target)
    .sort((a, b) => b.priority - a.priority)
    .map((rule) => {
      const choice = original[rule.source]
      return choice ? rule.responses[choice] : undefined
    })
    .filter((value): value is string => Boolean(value))
  if (target === '5,4' && mirrored.sceneChoices['5,4'] === 'draw') {
    available.unshift(
      'The new timber crossing now connects the Knight’s bridge to the far road, giving you a shorter physical route through Dark Briar.',
    )
  }
  return available.slice(0, Math.min(max, 2))
}

/** The first meaningful small choice that changes *traversal*, not a line.
 * Ordinary roads remain open. Repairing the Dark bridge adds a shortcut. */
export function darkBriarExtraBridge(
  from: string,
  to: string,
  mirrored: Pick<DarkBriarProgress, 'sceneChoices'> | undefined,
): boolean {
  if (!mirrored || mirrored.sceneChoices['5,4'] !== 'draw') return false
  return (from === '5,4' && to === '7,4') || (from === '7,4' && to === '5,4')
}

/** Carry only story-scale facts forward. Minor scene choices stay in the
 * original save; this projection never becomes another mutable save ledger. */
export interface CrossRealmConsequenceLedger {
  memoryCustody: MemoryCustody
  crossingAccord: CrossingAccord
  witnessRecord: 'unset' | 'copied' | 'protected'
  orensProvision: 'unset' | 'route' | 'supplies'
}

export function crossRealmConsequenceLedger(
  briar: Pick<BriarSave, 'house' | 'sceneChoices'>,
  mirroredHouse: Pick<DarkHouseProgress, 'ending'> | null,
): CrossRealmConsequenceLedger {
  const frames = firstTwoWorldFrames(briar, mirroredHouse)
  const witnessChoice = briar.sceneChoices['6,3']
  const orensChoice = briar.sceneChoices['4,3']
  return {
    memoryCustody: frames.memoryCustody,
    crossingAccord: frames.crossingAccord,
    witnessRecord:
      witnessChoice === 'remember'
        ? 'copied'
        : witnessChoice === 'protect'
          ? 'protected'
          : 'unset',
    orensProvision:
      orensChoice === 'plan'
        ? 'route'
        : orensChoice === 'load'
          ? 'supplies'
          : 'unset',
  }
}

/** Each earned clue is bound to a different House puzzle. Oren's practical
 * help and the Vault witnesses' consent never become transferable currency. */
export function earnedDarkHousePuzzleClue(
  briar: Pick<BriarSave, 'sceneChoices'>,
  room: string,
): DarkHouseEarnedClue | null {
  const oren = briar.sceneChoices['4,3']
  const witnesses = briar.sceneChoices['6,3']
  if (room === 'HD-03' && oren === 'plan') return 'route'
  if (room === 'HD-25' && oren === 'load') return 'supplies'
  if (
    room === 'HD-13' &&
    ['archive', 'grieve'].includes(briar.sceneChoices['2,5'] ?? '')
  )
    return 'earth-photo'
  if (room === 'HD-08' && witnesses === 'remember') return 'names'
  if (room === 'HD-34' && witnesses === 'protect') return 'consent'
  return null
}

const WITNESS_EPILOGUES = {
  copied: {
    return:
      'The names you copied in Briar allow the returned memories to find their owners. Three witnesses consent to a public record; a fourth refuses, and the House honors that refusal.',
    commons:
      'Your copied names expose a false claim against a villager. The commons votes to correct the record, but first asks each named witness whether their testimony may be shared.',
  },
  protected: {
    return:
      'Because you shielded the names in Briar, the House sends sealed invitations instead of posting a list. The owners recover their memories without becoming targets for the Index.',
    commons:
      'The names you protected remain private. The commons accepts anonymous testimony with a slower, voluntary verification process rather than making safety the price of being believed.',
  },
} as const

const OREN_EPILOGUES = {
  route:
    'Oren uses the route you planned together to escort two missing travelers home. He records their arrival, not their identities, in the public manifest.',
  supplies:
    'Oren draws on the provisions you counted together to feed the returning witnesses. He refuses to call a full stomach a debt of gratitude.',
} as const

/** An earned ending callback, not an extra global branch or a reward loop.
 * Unrecorded and invalid past choices add nothing; neither House ending locks. */
export function crossRealmHouseEpilogue(
  briar: Pick<BriarSave, 'house' | 'sceneChoices'>,
  mirroredHouse: Pick<DarkHouseProgress, 'ending'>,
): string {
  if (!mirroredHouse.ending) return ''
  const ledger = crossRealmConsequenceLedger(briar, mirroredHouse)
  const witness =
    ledger.witnessRecord === 'unset'
      ? ''
      : WITNESS_EPILOGUES[ledger.witnessRecord][mirroredHouse.ending]
  const provision =
    ledger.orensProvision === 'unset'
      ? ''
      : OREN_EPILOGUES[ledger.orensProvision]
  return [witness, provision].filter(Boolean).join(' ')
}
