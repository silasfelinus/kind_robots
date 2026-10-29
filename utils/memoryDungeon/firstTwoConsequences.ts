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
  if (
    (target === '2,4' || target === '3,4') &&
    mirrored.sceneChoices['3,4'] === 'shelter'
  ) {
    const courierChoice = original['2,4']
    if (courierChoice === 'lend') {
      available.unshift(
        'Sheltering the courier repays your lent lantern with a silver wildflower, carried safely back across the reflection.',
      )
    } else if (courierChoice === 'copy') {
      available.unshift(
        'The address you copied leads the sheltered courier to a forgotten lantern, now yours to carry back across the reflection.',
      )
    }
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

/** An earned cross-reality resource, not a repeatable encounter payout.
 * The original courier choice determines which scarce resource is returned. */
export function earnedCourierCompensation(
  original: Pick<BriarSave, 'sceneChoices'>,
  mirroredChoice: string,
): 'lantern' | 'wildflower' | null {
  if (mirroredChoice !== 'shelter') return null
  if (original.sceneChoices['2,4'] === 'lend') return 'wildflower'
  if (original.sceneChoices['2,4'] === 'copy') return 'lantern'
  return null
}

export type BorrowedVoiceAccord =
  | 'unset'
  | 'freed-repaired'
  | 'freed-consulted'
  | 'heard-repaired'
  | 'heard-consulted'

const BORROWED_VOICE_OUTCOMES: Record<
  Exclude<BorrowedVoiceAccord, 'unset'>,
  { scene: string; epilogue: string }
> = {
  'freed-repaired': {
    scene:
      'Pip recognizes the moth you freed from the stump. The traveler asks that its warning be delivered without caging the creature as evidence. You help correct the road notices; the moth is free to leave.',
    epilogue:
      'Pip and the traveler repair the misleading road signs together. The freed moth is neither named nor kept as proof.',
  },
  'freed-consulted': {
    scene:
      'The traveler thanks you for freeing the moth, then asks why nobody consulted the people who followed its borrowed directions. Pip gives them a blank map and lets them draw their own next road.',
    epilogue:
      'The traveler draws a new route on a blank map Pip supplied, and nobody mistakes that choice for a debt.',
  },
  'heard-repaired': {
    scene:
      'Pip compares the stump story you listened to with the traveler’s actual journey. You help mark the false turning without erasing either account. The traveler carries the corrected directions home.',
    epilogue:
      'Pip posts corrected directions beside the old stump account, with the traveler’s permission and without publishing their name.',
  },
  'heard-consulted': {
    scene:
      'The traveler hears the stump account you preserved, then adds what the borrowed voice left out. Pip carries both versions and asks where they want to go next. For once, the answer belongs to them.',
    epilogue:
      'Pip preserves both accounts of the journey, while the traveler decides which road to take without an appointed guide.',
  },
}

/** Two real original decisions and two freely chosen mirrored responses
 * yield four earned outcomes. Unvisited scenes cannot invent a shared past. */
export function earnedBorrowedVoiceAccord(
  original: Pick<BriarSave, 'sceneChoices'>,
  mirrored: Pick<DarkBriarProgress, 'sceneChoices'>,
): BorrowedVoiceAccord {
  const source = original.sceneChoices['3,5']
  const response = mirrored.sceneChoices['3,5']
  if (source !== 'light' && source !== 'listen') return 'unset'
  if (response !== 'apologize' && response !== 'ask') return 'unset'
  if (source === 'light')
    return response === 'apologize' ? 'freed-repaired' : 'freed-consulted'
  return response === 'apologize' ? 'heard-repaired' : 'heard-consulted'
}

export function earnedBorrowedVoiceOutcome(
  original: Pick<BriarSave, 'sceneChoices'>,
  mirrored: Pick<DarkBriarProgress, 'sceneChoices'>,
): string | null {
  const accord = earnedBorrowedVoiceAccord(original, mirrored)
  return accord === 'unset' ? null : BORROWED_VOICE_OUTCOMES[accord].scene
}

export type RoyalEscortAccord =
  | 'unset'
  | 'escort-scylla'
  | 'escort-char'
  | 'question-scylla'
  | 'question-char'

const ROYAL_ESCORT_OUTCOMES: Record<
  Exclude<RoyalEscortAccord, 'unset'>,
  { scene: string; epilogue: string }
> = {
  'escort-scylla': {
    scene:
      'Scylla studies the escort proclamation you accepted and admits its carriage left a family behind. When you ask for her account, she signs a second order giving the stranded household her own seat. She will walk with you rather than call that sacrifice somebody else’s duty.',
    epilogue:
      'Scylla returns her royal carriage to the family her first escort displaced. She walks beside them, having learned that a proclamation is not a passenger list.',
  },
  'escort-char': {
    scene:
      'Char finds the skull she drew on the escort proclamation you accepted. It matches the House windows, but the stranded family needs a road more than a prophecy. At your invitation she turns the sketch into a warning marker and leads them around the sealed gate.',
    epilogue:
      'Char marks a safe footpath for the family left behind by the royal escort. Her old skull drawing becomes a useful warning, not a claim to foresight.',
  },
  'question-scylla': {
    scene:
      'Scylla remembers that you asked why the sisters look different, not whether they deserved to travel together. She explains the court kept separate records for people it considered interchangeable. Asked for her account, she strikes both sisters’ false signatures from the escort order and takes the refused travelers’ names herself.',
    epilogue:
      'Scylla corrects the court registry that confused the sisters and the travelers it refused. Every passenger signs their own account; no royal name stands in for another.',
  },
  'question-char': {
    scene:
      'Char remembers your question about the sisters’ matching faces and different styles. The lantern they gave you illuminates two royal seals printed as though one sister spoke for both. She recognizes the House-window pattern in her own skull sketch and helps the travelers demand two separate, consenting witnesses.',
    epilogue:
      'Char exposes the duplicated royal seals using the lantern from your first meeting. She and Scylla testify separately, and the stranded travelers choose whom to trust.',
  },
}

/** A real choice on each side of the mirror is required. Neither sister
 * becomes a generic reward, and a missing first encounter invents no history. */
export function earnedRoyalEscortAccord(
  original: Pick<BriarSave, 'sceneChoices'>,
  mirrored: Pick<DarkBriarProgress, 'sceneChoices'>,
): RoyalEscortAccord {
  const source = original.sceneChoices['4,4']
  const response = mirrored.sceneChoices['4,4']
  if (source !== 'escort' && source !== 'question') return 'unset'
  if (response !== 'scylla' && response !== 'char') return 'unset'
  if (source === 'escort')
    return response === 'scylla' ? 'escort-scylla' : 'escort-char'
  return response === 'scylla' ? 'question-scylla' : 'question-char'
}

export function earnedRoyalEscortOutcome(
  original: Pick<BriarSave, 'sceneChoices'>,
  mirrored: Pick<DarkBriarProgress, 'sceneChoices'>,
): string | null {
  const accord = earnedRoyalEscortAccord(original, mirrored)
  return accord === 'unset' ? null : ROYAL_ESCORT_OUTCOMES[accord].scene
}

export type KnightCrossingAccord =
  | 'unset'
  | 'truth-built'
  | 'truth-released'
  | 'errand-built'
  | 'errand-released'

const KNIGHT_CROSSING_OUTCOMES: Record<
  Exclude<KnightCrossingAccord, 'unset'>,
  { scene: string; epilogue: string }
> = {
  'truth-built': {
    scene:
      'The Brass Knight recognizes the false oath you exposed in Briar. Rather than pretend the bridge existed, he asks the waiting families where a real crossing would serve them. You spend the night hauling planks to their chosen bank. The road opens, but the registrar now has evidence to prosecute the officials who issued his oath, and the Knight must testify.',
    epilogue:
      'The Knight helps the families build a crossing where they asked for one. He testifies against the false oath that sent them to the ravine; the road is open, but his old command is under public investigation.',
  },
  'truth-released': {
    scene:
      'Because you challenged his original oath, the Knight can name the officials who invented this bridge. He lays down his post and escorts the waiting travelers toward the long public road. Nobody is forced to stand in his queue, but those without provisions must spend another night away from home.',
    epilogue:
      'The Knight names the makers of the false oath and escorts the queue by the longer road. He is free of the post, while the families still need shelter for an extra night.',
  },
  'errand-built': {
    scene:
      'The Knight remembers the apology you carried to the family he once failed. Their reply asks him to build something useful instead of guarding an absence. With their permission he leads the bridge crew, and the stranded travelers cross at dawn. The false royal order remains unchallenged, however, and could send another guard to the same empty ravine.',
    epilogue:
      'The family receives the Knight’s apology and helps choose the new bridge. Travelers cross safely, but the royal registry still contains the false order that created the queue.',
  },
  'errand-released': {
    scene:
      'The family who received your earlier apology has left the Knight a reply: they forgive his mistake, not the command that caused it. He steps away from the imaginary bridge and helps them carry their belongings to a safer road. Their private reconciliation survives, but the public crossing remains unbuilt and the registrar has not withdrawn the oath.',
    epilogue:
      'The Knight carries the forgiven family’s belongings along the safer road. His personal debt is answered, but the missing bridge and the official false oath remain unresolved.',
  },
}

/** The first oath/apology decision and the mirrored bridge decision must both
 * be earned. A released Knight does not secretly build a bridge, and a
 * repaired crossing does not automatically pardon the original command. */
export function earnedKnightCrossingAccord(
  original: Pick<BriarSave, 'sceneChoices'>,
  mirrored: Pick<DarkBriarProgress, 'sceneChoices'>,
): KnightCrossingAccord {
  const source = original.sceneChoices['5,4']
  const response = mirrored.sceneChoices['5,4']
  if (source !== 'truth' && source !== 'errand') return 'unset'
  if (response !== 'draw' && response !== 'release') return 'unset'
  if (source === 'truth')
    return response === 'draw' ? 'truth-built' : 'truth-released'
  return response === 'draw' ? 'errand-built' : 'errand-released'
}

export function earnedKnightCrossingOutcome(
  original: Pick<BriarSave, 'sceneChoices'>,
  mirrored: Pick<DarkBriarProgress, 'sceneChoices'>,
): string | null {
  const accord = earnedKnightCrossingAccord(original, mirrored)
  return accord === 'unset' ? null : KNIGHT_CROSSING_OUTCOMES[accord].scene
}

export type VesperRookeryAccord =
  | 'unset'
  | 'asked-verified'
  | 'asked-delivered'
  | 'flower-verified'
  | 'flower-delivered'

const VESPER_ROOKERY_OUTCOMES: Record<
  Exclude<VesperRookeryAccord, 'unset'>,
  { scene: string; epilogue: string }
> = {
  'asked-verified': {
    scene:
      'Vesper recognizes the question-mark road they drew when you asked who had vanished. Together you take the rook replies to living witnesses instead of treating handwriting as proof. Three letters match memories; the fourth names a promise nobody can confirm. Vesper marks the missing person as unverified, not erased. The messenger gains an honest record, but the fourth letter stays undelivered.',
    epilogue:
      'Vesper keeps the fourth rook letter in an unverified folder while the other three witnesses confirm their memories. The missing traveler is not declared dead or found just to make the House ledger tidy.',
  },
  'asked-delivered': {
    scene:
      'You follow the alternate path Vesper drew beside the rook tower and find the living recipient of the unanswered letter. They have chosen a new name and ask that the route never enter a public atlas. Vesper tears the identifying corner from their map before the messenger delivers the letter. One person gets an answer, but the other rook replies remain unchecked and the road cannot be published.',
    epilogue:
      'Vesper leaves a deliberate blank in the public map to protect the letter recipient who chose a new name. The delivered message is real; the other rook replies remain unverified.',
  },
  'flower-verified': {
    scene:
      'The lantern Vesper traded for your wildflower illuminates three rook letters well enough for living witnesses to compare the ink. Vesper admits the birds repeated real memories, not messages from the dead. The fourth letter bears a name the witnesses cannot safely reveal. You leave it sealed, and the messenger loses the dramatic answer they wanted, but nobody is indexed on a guess.',
    epilogue:
      'By the lantern traded for your wildflower, Vesper verifies three rook replies and seals the fourth pending consent. The messenger has fewer miraculous claims, and the witnesses keep their names.',
  },
  'flower-delivered': {
    scene:
      'You carry Vesper’s lantern through the rookery dusk so the messenger can find the recipient of the unanswered letter. The recipient accepts it under a new name and asks for silence. Vesper presses your old wildflower into the map as a marker only the three of you understand. The delivery is safe, but you cannot use that secret route to prove the other birds’ stories.',
    epilogue:
      'Vesper marks the private delivery with the wildflower you traded for a lantern. The recipient remains free to use their new name, while the other rook replies are left without a public verdict.',
  },
}

/** A map's missing name and a rook's reply become one earned account only
 * after the original Vesper exchange and a second authored rookery choice. */
export function earnedVesperRookeryAccord(
  original: Pick<BriarSave, 'sceneChoices'>,
  mirrored: Pick<DarkBriarProgress, 'sceneChoices'>,
): VesperRookeryAccord {
  const source = original.sceneChoices['3,2']
  const response = mirrored.sceneChoices['3,2']
  if (source !== 'ask' && source !== 'offer') return 'unset'
  if (response !== 'verify' && response !== 'honor') return 'unset'
  if (source === 'ask')
    return response === 'verify' ? 'asked-verified' : 'asked-delivered'
  return response === 'verify' ? 'flower-verified' : 'flower-delivered'
}

export function earnedVesperRookeryOutcome(
  original: Pick<BriarSave, 'sceneChoices'>,
  mirrored: Pick<DarkBriarProgress, 'sceneChoices'>,
): string | null {
  const accord = earnedVesperRookeryAccord(original, mirrored)
  return accord === 'unset' ? null : VESPER_ROOKERY_OUTCOMES[accord].scene
}

export type OrenManifestAccord =
  | 'unset'
  | 'route-counted'
  | 'route-rescued'
  | 'supplies-counted'
  | 'supplies-rescued'

const OREN_MANIFEST_OUTCOMES: Record<
  Exclude<OrenManifestAccord, 'unset'>,
  { scene: string; epilogue: string }
> = {
  'route-counted': {
    scene:
      'Oren lays your original route beside the mirrored passenger count. The two extra seats are not people at all, but wishes travelling without their owners. He marks both as disputed cargo and refuses to print the names of the travelers who carried them. The crowd can challenge the ledger without being indexed, but departure must wait until someone checks which wishes can safely be returned.',
    epilogue:
      'Oren publishes the corrected passenger totals without naming the people who carried unowned wishes. Two seats remain under review, delaying the next crossing rather than inventing two missing travelers.',
  },
  'route-rescued': {
    scene:
      'Because you planned the narrow turns with Oren, he can lead the stranded families along a route the evacuation carts can actually take. Scylla walks the first stretch and Char checks the bridge supports. Nobody is left at the false crossing, but the longer road consumes a night of shelter the village had promised to another group.',
    epilogue:
      'Oren uses your original route to guide the stranded across a safe detour. The rescue succeeds, though the extra night on the road costs the village one night of available shelter.',
  },
  'supplies-counted': {
    scene:
      'The parcels you sorted in Briar let Oren separate actual food from the two phantom seats on his new manifest. He shares the rations with people whose bodies are present and leaves the wishes unclaimed until their owners can speak. His ledger becomes accurate enough to audit, but the waiting travelers must endure another hungry evening.',
    epilogue:
      'Oren uses the supplies you counted to feed real passengers rather than phantom entries. He keeps the two disputed seats open and accepts the delay instead of declaring their owners found.',
  },
  'supplies-rescued': {
    scene:
      'Oren recognizes the stores you helped pack and spends the reserve feeding the stranded as he escorts them back across the bridge. Char distributes bread without taking names; Scylla records each household that agrees to share. Everyone gets across tonight, but the House loses its emergency stock and must ask the village before borrowing another meal.',
    epilogue:
      'Oren spends the reserve you packed on the stranded passengers and gets them home. The House must rebuild its emergency stores with the village’s consent rather than treating rescue as an automatic claim on future meals.',
  },
}

/** Reconcile Oren's original work with the mirrored ledger or evacuation.
 * Both decisions must be real authored choices; no speculative outcome is
 * granted for missing or fabricated history. */
export function earnedOrenManifestAccord(
  original: Pick<BriarSave, 'sceneChoices'>,
  mirrored: Pick<DarkBriarProgress, 'sceneChoices'>,
): OrenManifestAccord {
  const source = original.sceneChoices['4,3']
  const response = mirrored.sceneChoices['4,3']
  if (source !== 'plan' && source !== 'load') return 'unset'
  if (response !== 'counts' && response !== 'rescue') return 'unset'
  if (source === 'plan')
    return response === 'counts' ? 'route-counted' : 'route-rescued'
  return response === 'counts' ? 'supplies-counted' : 'supplies-rescued'
}

export function earnedOrenManifestOutcome(
  original: Pick<BriarSave, 'sceneChoices'>,
  mirrored: Pick<DarkBriarProgress, 'sceneChoices'>,
): string | null {
  const accord = earnedOrenManifestAccord(original, mirrored)
  return accord === 'unset' ? null : OREN_MANIFEST_OUTCOMES[accord].scene
}

/** Carry only story-scale facts forward. Minor scene choices stay in the
 * original save; this projection never becomes another mutable save ledger. */
export interface CrossRealmConsequenceLedger {
  memoryCustody: MemoryCustody
  crossingAccord: CrossingAccord
  witnessRecord: 'unset' | 'copied' | 'protected'
  orensProvision: 'unset' | 'route' | 'supplies'
  knightsDuty: 'unset' | 'oath' | 'errand'
  borrowedVoiceAccord: BorrowedVoiceAccord
  royalEscortAccord: RoyalEscortAccord
  orenManifestAccord: OrenManifestAccord
  knightCrossingAccord: KnightCrossingAccord
  vesperRookeryAccord: VesperRookeryAccord
}

export function crossRealmConsequenceLedger(
  briar: Pick<BriarSave, 'house' | 'sceneChoices'>,
  mirroredHouse: Pick<DarkHouseProgress, 'ending'> | null,
  mirrored?: Pick<DarkBriarProgress, 'sceneChoices'>,
): CrossRealmConsequenceLedger {
  const frames = firstTwoWorldFrames(briar, mirroredHouse)
  const witnessChoice = briar.sceneChoices['6,3']
  const orensChoice = briar.sceneChoices['4,3']
  const knightChoice = briar.sceneChoices['5,4']
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
    knightsDuty:
      knightChoice === 'truth'
        ? 'oath'
        : knightChoice === 'errand'
          ? 'errand'
          : 'unset',
    borrowedVoiceAccord: mirrored
      ? earnedBorrowedVoiceAccord(briar, mirrored)
      : 'unset',
    royalEscortAccord: mirrored
      ? earnedRoyalEscortAccord(briar, mirrored)
      : 'unset',
    orenManifestAccord: mirrored
      ? earnedOrenManifestAccord(briar, mirrored)
      : 'unset',
    knightCrossingAccord: mirrored
      ? earnedKnightCrossingAccord(briar, mirrored)
      : 'unset',
    vesperRookeryAccord: mirrored
      ? earnedVesperRookeryAccord(briar, mirrored)
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

const KNIGHT_EPILOGUES = {
  oath: 'The Brass Knight, freed from the false oath you challenged, stands at the House door only to name each returning traveler aloud.',
  errand:
    'The Brass Knight, whose apology you delivered, keeps the House door but admits nobody he has not first greeted by name.',
} as const

/** An earned ending callback, not an extra global branch or a reward loop.
 * Unrecorded and invalid past choices add nothing; neither House ending locks. */
export function crossRealmHouseEpilogue(
  briar: Pick<BriarSave, 'house' | 'sceneChoices'>,
  mirroredHouse: Pick<DarkHouseProgress, 'ending'>,
  mirrored?: Pick<DarkBriarProgress, 'sceneChoices'>,
): string {
  if (!mirroredHouse.ending) return ''
  const ledger = crossRealmConsequenceLedger(briar, mirroredHouse, mirrored)
  const witness =
    ledger.witnessRecord === 'unset'
      ? ''
      : WITNESS_EPILOGUES[ledger.witnessRecord][mirroredHouse.ending]
  const provision =
    ledger.orenManifestAccord !== 'unset' || ledger.orensProvision === 'unset'
      ? ''
      : OREN_EPILOGUES[ledger.orensProvision]
  const knight =
    ledger.knightCrossingAccord !== 'unset' || ledger.knightsDuty === 'unset'
      ? ''
      : KNIGHT_EPILOGUES[ledger.knightsDuty]
  const knightCrossing =
    ledger.knightCrossingAccord === 'unset'
      ? ''
      : KNIGHT_CROSSING_OUTCOMES[ledger.knightCrossingAccord].epilogue
  const traveler =
    ledger.borrowedVoiceAccord === 'unset'
      ? ''
      : BORROWED_VOICE_OUTCOMES[ledger.borrowedVoiceAccord].epilogue
  const royals =
    ledger.royalEscortAccord === 'unset'
      ? ''
      : ROYAL_ESCORT_OUTCOMES[ledger.royalEscortAccord].epilogue
  const manifest =
    ledger.orenManifestAccord === 'unset'
      ? ''
      : OREN_MANIFEST_OUTCOMES[ledger.orenManifestAccord].epilogue
  const vesper =
    ledger.vesperRookeryAccord === 'unset'
      ? ''
      : VESPER_ROOKERY_OUTCOMES[ledger.vesperRookeryAccord].epilogue
  return [
    witness,
    provision,
    manifest,
    knight,
    knightCrossing,
    traveler,
    royals,
    vesper,
  ]
    .filter(Boolean)
    .join(' ')
}
