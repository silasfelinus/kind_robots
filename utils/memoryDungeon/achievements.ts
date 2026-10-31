import type { BriarSave } from '../memoryDungeonWorld'
import type { DarkBriarProgress } from './darkBriar'
import { darkBriarIllustrationPath } from './darkBriarArt'
import {
  earnedBorrowedVoiceAccord,
  earnedCourierBellAccord,
  earnedKnightCrossingAccord,
  earnedMosswickPromiseAccord,
  earnedOrenManifestAccord,
  earnedRoyalEscortAccord,
  earnedVesperRookeryAccord,
  earnedWitnessBellAccord,
} from './firstTwoConsequences'
import { BRIAR_QUESTS } from './briarQuests'
import {
  HOUSE_EPILOGUES,
  houseEpilogue,
  houseEpilogueLens,
} from './houseEpilogues'
import { BRIAR_RARE_EVENTS, type EarnedBriarRareEvent } from './briarRareEvents'

export interface MemoryAchievement {
  id: string
  questId: string
  title: string
  description: string
  echo: string | null
  artPath: string
  earned: boolean
}

const MEDALS: Record<
  string,
  { title: string; description: string; echo: string }
> = {
  'the-fourth-column': {
    title: 'A Fourth Way Out',
    description:
      'Make Oren account for someone his first evacuation plan left behind.',
    echo: 'Oren keeps the fourth column open after the evacuation is over. It is a list of people the first plan failed to see, not a tally of people who owe him thanks. Every future route must begin with that uncomfortable arithmetic.',
  },
  'the-second-signature': {
    title: 'Two Dates, One Truth',
    description: 'Give Mosswick a truthful account without inventing a debtor.',
    echo: 'Mosswick begins keeping two ledgers: one for what was promised and one for what can actually be proved. The second is much thinner. For the first time, he is proud to show a customer a page with an honest blank.',
  },
  'a-letter-written-back': {
    title: 'The Door Answers Back',
    description:
      'Carry a reply that makes the Brass Knight answer for his order.',
    echo: 'The Brass Knight leaves his sword against the door while he reads the reply. He has learned that a written apology can open a hearing, but cannot deliver its verdict. The people on the other side still decide whether to answer.',
  },
  'the-voice-that-came-home': {
    title: 'Return to Sender',
    description:
      'Help Pip recognize a missing courier without claiming their identity.',
    echo: "Pip leaves a space in his route book for a destination that cannot yet be named. He refuses to call it a failed delivery. A voice can be recognized without turning the person behind it into someone else's property.",
  },
  'the-road-without-an-owner': {
    title: 'A Road for Everyone',
    description: 'Find a path for the Wolf-Mother that respects her witnesses.',
    echo: 'The Wolf-Mother folds her map with the paths facing inward. She can guide the next traveler without giving the Index a list of the children who used them. A safe road does not need an owner, only people willing to keep it safe.',
  },
  'two-crowns-one-promise': {
    title: 'Two Crowns, No Clerk',
    description:
      'Let Scylla and Char decide who may tell the story of their departure.',
    echo: "Scylla's careful itinerary and Char's scribbled additions still disagree about the weather. They agree about one thing: no clerk may turn their two wishes into one royal signature. Even sisters who travel together deserve separate answers.",
  },
  'supper-for-tomorrow': {
    title: 'Bread and Tomorrow',
    description: 'Choose how a scarce harvest can help the village.',
    echo: 'The field cook leaves an empty line beneath the supper tally for whatever the next harvest brings. A meal cannot undo hunger, and a sapling cannot feed someone tonight. The workers keep both truths in the same book.',
  },
  'the-name-left-blank': {
    title: 'The Right to Be Missing',
    description:
      "Honor a daughter's agency while investigating the erased guests.",
    echo: 'The village registry learns to distinguish eleven erased records from a twelfth absence. A blank can mean that someone was forgotten, or that someone asked not to be found. The difference belongs to the missing person, not the clerk.',
  },
}

/**
 * The first eight of the planned 64 campaign achievements. Each is a
 * cosmetic Chronicle medal for a rare World One convergence, not a stat
 * boost or another claimable reward. Reuse the corresponding quest painting.
 */
export const MEMORY_BRIAR_ACHIEVEMENTS = BRIAR_RARE_EVENTS.map((event) => {
  const quest = BRIAR_QUESTS.find((entry) => entry.id === event.questId)
  const medal = MEDALS[event.id]
  if (!quest || !medal)
    throw new Error(`Missing Memory Dungeon medal source for ${event.id}`)
  return {
    id: event.id,
    questId: event.questId,
    title: medal.title,
    description: medal.description,
    echo: medal.echo,
    artPath: quest.artPath,
  }
})

/** Eight mirrored-Briar medals require a genuine choice in BOTH realities.
 * Their echoes record consequences, never extra combat strength or resources. */
const DARK_MEDALS = [
  {
    id: 'e02-bell-witness',
    key: '2,4',
    title: 'The Bell Has Two Owners',
    description:
      'Answer the mirrored courier after choosing what to do with their first message.',
    echo: 'The courier hangs the cracked bell where anyone may ring it, but nobody can be summoned by force. The original address remains sealed. On certain evenings, the courier sits beneath the bell and explains how one letter became two obligations.',
    accord: earnedCourierBellAccord,
  },
  {
    id: 'e02-borrowed-voice',
    key: '3,5',
    title: 'A Voice Returned Freely',
    description:
      'Face the borrowed moth-voice with the memory of your first decision.',
    echo: 'Pip leaves the moth a window that opens outward. The people who followed its directions draw their own corrected map. Nobody is required to keep the creature as evidence, and the travelers remember the difference between hearing a warning and owning its speaker.',
    accord: earnedBorrowedVoiceAccord,
  },
  {
    id: 'e02-two-royal-orders',
    key: '4,4',
    title: 'Two Sisters, Two Signatures',
    description:
      'Revisit the royal escort and let one sister answer for the earlier road.',
    echo: 'Scylla keeps the official proclamation; Char keeps the charcoal sketch on its reverse. They disagree about the route but both insist that the stranded family be heard. The court must now record two separate witnesses instead of one convenient royal voice.',
    accord: earnedRoyalEscortAccord,
  },
  {
    id: 'e02-crossing-without-oath',
    key: '5,4',
    title: 'The Crossing Is Real',
    description:
      'Confront the false bridge with the consequences of the first knightly oath.',
    echo: 'The Brass Knight has stopped guarding empty air. Whether he builds a crossing or escorts people elsewhere, he must now answer to the families who waited. He carries the old order folded inside his shield as evidence, not permission to command them.',
    accord: earnedKnightCrossingAccord,
  },
  {
    id: 'e02-vesper-rookery',
    key: '3,2',
    title: 'A Map With an Honest Blank',
    description:
      'Revisit Vesper’s rookery and decide what an unanswered letter proves.',
    echo: 'Vesper copies the safe routes onto a new map, leaving one deliberate blank where a traveler requested privacy. The rook still flies, but its destination is no longer public property. For Vesper, withholding a name becomes an act of cartography rather than shame.',
    accord: earnedVesperRookeryAccord,
  },
  {
    id: 'e02-mosswick-ledger',
    key: '4,2',
    title: 'The Promise May Be Challenged',
    description:
      'Revisit Mosswick’s ledger and make a future-dated debt answerable.',
    echo: 'Mosswick places a small question mark beside every debt dated tomorrow. Customers may challenge a charge without surrendering their names. The old payments are not magically refunded, but the clerk has learned that an honest blank can be more useful than a perfect account.',
    accord: earnedMosswickPromiseAccord,
  },
  {
    id: 'e02-oren-manifest',
    key: '4,3',
    title: 'No Passenger Is a Number',
    description:
      'Help Oren reconcile the two passenger manifests across the changed road.',
    echo: 'Oren leaves two seats marked disputed instead of assigning them invented travelers. His axe rests across the bridge only while the crossing is unsafe. The next rescue begins with a count of provisions, and ends with every traveler free to correct the ledger.',
    accord: earnedOrenManifestAccord,
  },
  {
    id: 'e02-witness-bells',
    key: '6,3',
    title: 'Silence Is Not Consent',
    description:
      'Return to the listening House and honor the witnesses’ earlier choice.',
    echo: 'The House rings no bells without invitation. Three witnesses choose to speak; the others remain unnamed until they decide. The council must live with a slower verdict, but its record finally distinguishes a person who declined from a person nobody bothered to ask.',
    accord: earnedWitnessBellAccord,
  },
] as const

export const MEMORY_DARK_BRIAR_ACHIEVEMENTS = DARK_MEDALS.map((medal) => ({
  id: medal.id,
  questId: `e02-${medal.key}`,
  title: medal.title,
  description: medal.description,
  echo: medal.echo,
  artPath: darkBriarIllustrationPath(medal.key),
}))


/** The twelve earned House endings are permanent memories, never stat bonuses. */
const HOUSE_MEDAL_ECHOES: Record<keyof typeof HOUSE_EPILOGUES, string> = {
  'release-community':
    'The neighbors carry their memories home in mismatched baskets. Oren keeps the shared route open for anyone who cannot carry theirs alone, and the village council must ask before borrowing a single story.',
  'release-bonds':
    'Char returns a borrowed ribbon to its owner, who remembers a sister rather than a debt. Scylla keeps the reunion private; some bonds grow stronger when the House stops announcing them.',
  'release-obligation':
    'The emptied vault still has creditors at its door. Pip writes down which protections failed when the jars went home, and refuses to call the remaining work a price for freedom.',
  'release-honesty':
    'Vesper pins the old catalog beside the empty shelves, with every error left visible. A former prisoner corrects one name and declines to explain the rest; the archive accepts both acts.',
  'renew-community':
    'The new memory commons opens only when its witnesses arrive. Nobody is counted absent as a yes. The Warden learns to wait through an entire meeting without interpreting silence as agreement.',
  'renew-bonds':
    'A grandmother deposits the story of a quarrel, then takes it back before supper. Her grandson remembers the apology without inheriting its conditions; the new agreement has an exit door.',
  'renew-obligation':
    'Mosswick is assigned the unenviable task of recording every revoked consent. The ledger grows heavier as the House grows fairer, and he finally learns why that is not a contradiction.',
  'renew-honesty':
    'The first audit finds three mislabeled jars and a fourth nobody will identify. The witnesses publish the mistakes and seal the unknown one until its owner asks to be heard.',
  'break-community':
    'The shattered mechanism leaves the village with no central bell to summon help. Neighbors build a quieter warning system from shared paths, voluntary watch shifts and the names people offer.',
  'break-bonds':
    'Scylla and Char find each other in a hall that no longer remembers their argument. They choose to retell it anyway, carefully, because a relationship is not repaired by erasing its evidence.',
  'break-obligation':
    'Oren inventories every broken lock before the rubble cools. A freed memory can still leave a dangerous hole, so he organizes repairs without asking anyone to rebuild the old prison.',
  'break-honesty':
    'The last glass shard reflects the Warden admitting it mistook preservation for care. Vesper refuses to turn the confession into a tidy ending; the villagers keep the fragment as evidence.',
}

export const MEMORY_HOUSE_ACHIEVEMENTS = Object.values(HOUSE_EPILOGUES).map(
  (epilogue) => ({
    id: `e01-house-${epilogue.id}`,
    questId: `house-epilogue:${epilogue.id}`,
    title: epilogue.title,
    description: `Resolve the Memory Hearth through ${epilogue.lens} and choose to ${epilogue.resolution} its custody.`,
    echo: HOUSE_MEDAL_ECHOES[epilogue.id],
    artPath: epilogue.artPath,
  }),
)

const ALL_MEDALS = [
  ...MEMORY_BRIAR_ACHIEVEMENTS,
  ...MEMORY_DARK_BRIAR_ACHIEVEMENTS,
  ...MEMORY_HOUSE_ACHIEVEMENTS,
]

const validIds = new Set(ALL_MEDALS.map((medal) => medal.id))

/** Older and malformed local storage must never introduce unknown medals. */
export function restoreMemoryAchievements(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const ids = new Set(
    value.filter(
      (id): id is string => typeof id === 'string' && validIds.has(id),
    ),
  )
  return ALL_MEDALS.filter((medal) => ids.has(medal.id)).map(
    (medal) => medal.id,
  )
}

/**
 * Only a fully earned, authored rare event can mint a medal. The permanent
 * list survives new expeditions and checkpoint loads; replaying an outcome
 * never duplicates it.
 */
export function reconcileMemoryAchievements(
  previous: readonly string[],
  earnedEvents: readonly EarnedBriarRareEvent[],
  original?: Pick<BriarSave, 'sceneChoices'> & Partial<Pick<BriarSave, 'house'>>,
  mirrored?: Pick<DarkBriarProgress, 'sceneChoices'>,
): string[] {
  const ids = new Set(restoreMemoryAchievements(previous))
  for (const event of earnedEvents)
    if (validIds.has(event.id)) ids.add(event.id)
  if (original && mirrored)
    for (const medal of DARK_MEDALS)
      if (medal.accord(original, mirrored) !== 'unset') ids.add(medal.id)
  const house = original?.house
  if (
    house?.ending &&
    house.visited.includes('HD-35') &&
    (!house.decisions['HD-35'] || house.decisions['HD-35'] === house.ending) &&
    (!house.endingLens ||
      house.endingLens === houseEpilogueLens(house, original.sceneChoices))
  ) {
    const epilogue = houseEpilogue(house, original.sceneChoices)
    if (epilogue) ids.add(`e01-house-${epilogue.id}`)
  }
  return ALL_MEDALS.filter((medal) => ids.has(medal.id)).map(
    (medal) => medal.id,
  )
}

export function memoryAchievementGallery(
  savedIds: readonly string[],
): MemoryAchievement[] {
  const earned = new Set(restoreMemoryAchievements(savedIds))
  return ALL_MEDALS.map((medal) => ({
    ...medal,
    echo: earned.has(medal.id) ? medal.echo : null,
    earned: earned.has(medal.id),
  }))
}
