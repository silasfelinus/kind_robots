import {
  HOUSE_ROOMS,
  HOUSE_ENTRY,
  type HouseRoomId,
  type HouseKind,
} from './house'
import type { DarkBriarProgress } from './darkBriar'
import { DARK_BRIAR_WITNESSES, darkBriarHasWitness } from './darkBriar'
import {
  DARK_HOUSE_TRIALS,
  DARK_HOUSE_PUZZLES,
  darkHouseTrialFaces,
} from './darkHouseChallenges'

export type DarkHouseEnding = 'return' | 'commons'
export type DarkHouseEarnedClue =
  'route' | 'supplies' | 'names' | 'consent' | 'earth-photo'
export interface DarkHouseChoice {
  id: string
  label: string
  outcome: string
}
export interface DarkHouseRoom {
  id: HouseRoomId
  title: string
  kind: HouseKind
  opening: string
  artPrompt: string
  imagePath: string
  exits: readonly HouseRoomId[]
  choices: readonly DarkHouseChoice[]
}
type RoomBrief = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
]
const briefs: readonly RoomBrief[] = [
  [
    'Porch of Names That Return',
    'The porch remembers every guest you refused to name. A chair appears for each apology nobody has delivered.',
    'Porch of haunted oak manor, mismatched chairs, brass knocker, mirror showing borrowed faces.',
    'Hear the guest roll',
    'The chairs turn to face their former owners; the Warden must answer for naming them without permission.',
    'Refuse the registry',
    'An empty chair remains open for travelers who have not chosen a name.',
  ],
  [
    'Umbrella Stand for Lost Storms',
    "Wet umbrellas drip rain from futures that never arrived. One has a child's name carved into its handle.",
    'Victorian umbrella rack holding dripping umbrellas beneath indoor thundercloud, lone caretaker.',
    'Return the smallest umbrella',
    'The caretaker discovers a forgotten visitor and opens a door leading toward a living relative.',
    'Keep the unused shelter',
    'The caretaker gives the village the umbrella as shared weather equipment, ending its private inheritance.',
  ],
  [
    'Boot-Rack Maze of Borrowed Routes',
    'Rows of boots walk in place. Each remembers the journey its owner hoped to take, not the road they actually walked.',
    'Grand hallway of marching empty boots and spiral stairs, cool lamp light.',
    'Match boots to owners',
    'The staircase holds still; former travelers reclaim choices they once made under coercion.',
    'Follow the scuffed pair',
    "The damaged boots reveal a route not registered in the House's map.",
  ],
  [
    'Clockwork Pantry of Hungry Memories',
    'Bread tins tick with stolen hours. A hungry family waits beyond the door; the House insists every loaf belongs to the clock.',
    'Copper clockwork pantry stacked with bread tins, brass clock face, hungry family through doorway.',
    'Feed the waiting family',
    'An unpaid hour returns to the cook, and dinner becomes an ordinary shared obligation.',
    'Unwind the clock',
    'The pantry loses its perfect schedule; the family agrees on an honest ration rota.',
  ],
  [
    "Wolf's Latch, Unlatched",
    "The wolf's warning is still caught in the latch. The villagers call it a threat because the sentence arrived backwards.",
    'Iron garden latch marked by wolf-claw grooves, door ajar, cottage lights beyond.',
    'Read the warning in reverse',
    "The latch gives back the wolf's account; the village must confront the danger it misidentified.",
    'Release the trapped message',
    'A young courier carries the warning to the people who can still act on it.',
  ],
  [
    'Broom Closet of Unpaid Work',
    'All the dust swept from the House has formed a second servant who is tired of being thanked instead of paid.',
    'Tiny servants closet containing animated dust figure, brooms and old brass pay box.',
    'Pay the cleaner fairly',
    'The servant receives a wage and opens a shortcut as part of a negotiated agreement.',
    'Share the work',
    'Guests sweep the landing together, and the servant chooses when to rest.',
  ],
  [
    'Portrait Hall of Mistaken Families',
    'Family portraits show the children who might have been adopted rather than the ones who actually were. A father begs you to pick the happier painting.',
    'Oak gallery with overlapping painted family portraits and uneasy father holding a silver frame.',
    'Ask the living family',
    'The current children tell their own account; one portrait quietly changes without erasing the others.',
    'Preserve all portraits',
    'The gallery becomes a public record of possibilities, not a verdict on the family.',
  ],
  [
    'Staircase of Three Unfinished Apologies',
    'Every step repeats a different apology, none addressed to the person it harmed. The steps shift each time someone says they forgive everybody.',
    'Gothic wooden triple staircase, three floating letter seals, exhausted adult traveler.',
    'Address the right witness',
    'One staircase settles and a previously hidden passage opens from an answer properly given.',
    'Write an honest apology',
    'You cannot buy forgiveness, but the wooden landing stops demanding a false absolution.',
  ],
  [
    'Hearth Guard Who Is Afraid of Fire',
    'A brass guard has protected the cold hearth for decades. He mistakes every spark for an invasion and every visitor for the arsonist.',
    'Brass hearth sentry shielding an extinguished fireplace, red sparks within stone arch.',
    'Teach him to tend a flame',
    'The guard lowers his weapon and learns which danger a real fire poses.',
    'Carry the embers outside',
    'Villagers build a common brazier; the guard follows to protect people instead of furniture.',
  ],
  [
    "Scylla's Inventory of Burdens",
    "Scylla's immaculate inventory lists everything the family needed. It also lists things Char was never asked whether she wanted.",
    'Sturdy proper-crowned princess over well-ordered table of supplies, second empty chair, ribboned ledger.',
    'Ask Scylla what was omitted',
    'She adds her own doubts to the record and asks Char about the journey itself.',
    'Let Char revise the list',
    'Char crosses out three burdens and keeps one unexpected reminder of home.',
  ],
  [
    "Char's Wardrobe of Possible Selves",
    'The wardrobe contains outfits Char was expected to wear to become a good sister. The garments hang beside the goth coat she chose herself.',
    'Arched wardrobe with tailored pale dresses and black velvet goth travel coat, silver chain ornaments.',
    'Protect her chosen clothes',
    "Char keeps her own wardrobe key and refuses the House's generous offer to remake her.",
    'Ask what she has outgrown',
    'The sisters begin planning a future separate from the roles the court wrote.',
  ],
  [
    "Servants' Passage of Invisible Witnesses",
    'The narrow corridor is filled with apologies spoken to empty air. The servants remember every sentence, including the ones never meant for them.',
    'Narrow stone service passage with small warm lamps and silhouettes listening beside open doors.',
    'Invite testimony voluntarily',
    'Two servants offer evidence; the others decline and retain their privacy.',
    'Open a safe return route',
    'A servant marks the way out and makes no demand for gratitude.',
  ],
  [
    "Kitchen Printing Tomorrow's Menus",
    'The printing press produces menus for meals nobody has eaten. A cook has been fired because the machine predicts she will burn the next loaf.',
    'Rootwood kitchen with copper letterpress printing blank food lists, angry cook at oven.',
    'Let the cook make breakfast',
    'Breakfast succeeds imperfectly, and the press loses its authority to fire people.',
    'Examine the prediction gears',
    'The machine was set to prefer empty kitchens: fewer reported mistakes meant higher scores.',
  ],
  [
    'First Memory Jar, Second Owner',
    'A glass jar remembers two separate childhood birthdays. Both adults claim it; the House threatens to break it unless one admits to lying.',
    'Bright blue memory jar on walnut shelf, two adult claimants and a cracked cake tin.',
    'Open it together',
    'They see two birthdays in the same room, neither a fabrication; both families were there.',
    'Keep separate testimonies',
    'The jar remains intact, carrying both stories until each claimant chooses what to disclose.',
  ],
  [
    'Polite Guest with the Wrong Invitation',
    'The guest arrived for a party that never happened. The House has fed him for years because it is afraid of appearing unkind.',
    'Tall courteous stranger seated at candlelit dining table, untouched cake, empty invitations.',
    'Tell him what changed',
    'He accepts the truth and asks to help clean up the abandoned dinner.',
    'Offer a new invitation',
    'He chooses to stay for one ordinary meal, free to leave afterward.',
  ],
  [
    "Housekeeper's Stolen Hour",
    "The thornbound housekeeper is furious that you found her missing hour. She used it to save a traveler and doesn't regret what she did, only the debt imposed afterward.",
    'Thornroot housekeeper with brass key belt beside tall clock whose hands point both directions.',
    'Return her stolen hour',
    'She remembers the rescue accurately and asks the saved traveler for nothing in return.',
    'Cancel the hidden debt',
    'The House pays for the lost shift and the housekeeper opens her locked ledger.',
  ],
  [
    'Gallery of Unsent Replies',
    'Hundreds of reply letters are stored beneath the letters people sent, but never received. The House calls this arrangement merciful.',
    'Dusty letter gallery with closed envelopes stacked under an oak writing desk.',
    'Deliver the consenting replies',
    'Several families reconnect; one recipient refuses and their private letter stays unopened.',
    'Preserve evidence of silence',
    'The letters reveal where the Warden concealed disagreement as a failure of memory.',
  ],
  [
    'Quiet Bedchamber of Restless Futures',
    'A bed offers visions of every safer life the sleeper could have lived. The owner has stopped sleeping to avoid choosing among them.',
    'Small moonlit bedchamber, one iron bed framed by translucent future landscapes, tired innkeeper.',
    'Close the vision shutters',
    'The room becomes dark enough for real rest. Tomorrow remains uncertain and possible.',
    'Keep a single lantern',
    'The sleeper learns to see the way to the door rather than the shape of every future.',
  ],
  [
    "Mirror Corridor of Morrow's Doubles",
    'Morrow appears in three mirrors: fey thief, exhausted office worker, and someone helping a stranger. Each reflection claims to be his truest self.',
    'Long silver mirror corridor with three distinct reflections of adult changeling Morrow in dark cloak and office shirt.',
    'Listen to each account',
    'You learn that guilt and care can coexist; the mirrors stop insisting on a single label.',
    'Match the shared gesture',
    'Each reflection holds the same transit pass; the puzzle resolves around what he actually did.',
  ],
  [
    "Missing Daughter's Chosen Door",
    'The daughter whose absence appears in the ledger built her own doorway years ago. Her parents have kept restoring the wall because they mistake departure for disappearance.',
    "Empty child's room belonging to grown daughter, free-standing door and packed travel bag, family portraits.",
    'Follow the departure trail',
    'You find evidence of a safe adult traveler who chose a new life.',
    'Leave her a message',
    'The parents write an invitation to return, rather than an order.',
  ],
  [
    'Parlor of Celebrated Embarrassments',
    "The parlor projects the worst moment of every guest's life as party entertainment. Tonight the host's memory is the first on display.",
    'Faded purple parlor with brass projector and mortified adult party host, few seated guests.',
    'Turn the projector toward its owner',
    'The host understands why the parties were cruel and cancels the exhibition.',
    'Ask the audience to stop watching',
    'Guests put the projector away together and offer private apologies instead of public amusement.',
  ],
  [
    'Collector of Unpaid Stories',
    "An index collector has bound each villager's story into a numbered volume. He calls it preservation; the owners cannot find their own books.",
    'Stooped collector in leather coat behind towering shelves of unlabeled bound biographies.',
    'Return the volumes',
    'Villagers reclaim their accounts, keeping some private and sharing others.',
    'Expose the buying contracts',
    'The collector is forced to negotiate with the people whose words paid his salary.',
  ],
  [
    'Small Wardrobe Door to a Third Road',
    'Behind a tiny wardrobe is a route neither princess remembers taking. Its coat hooks have space for three travelers, though the old prophecy counted two.',
    'Small oak wardrobe with narrow hidden doorway and three hanging traveling cloaks.',
    'Leave the third hook free',
    'The sisters consider a future companion who may choose their own role.',
    'Measure the new road',
    "Oren's map gains an honest alternative to the old two-person prediction.",
  ],
  [
    'Dry Cellar of Second Chances',
    'The cellar has kept everyone who ever asked to undo a mistake. None has been told that repairs require returning upstairs and speaking to the people harmed.',
    'Brick root cellar filled with repaired broken crockery and waiting adult travelers.',
    'Open the stairwell',
    'A repentant traveler goes back to make a real apology instead of reliving the moment.',
    'Build a meeting room',
    'The cellar becomes a place where wrongdoers and those they harmed can meet by choice.',
  ],
  [
    'Bargain Ledger of Two Truths',
    'The House demands one correct account, but the ledger balances only when both sides write their losses. The old instructions have been crossed out.',
    'Copper-bound account book open across oak table, two ink wells, tangled roots around brass scale.',
    'Record both debts',
    'The ledger reveals that the House profited from hiding the second invoice.',
    'Refuse a single verdict',
    'The mirror-stair opens to a room with room for contradictory testimony.',
  ],
  [
    "Wolf-Mother's Unasked Defense",
    'The guardian everyone calls a monster remembers protecting the same children the village accused her of stalking. She wants protection for the children, not a pardon bought through silence.',
    'Tired imposing forest guardian in wool cloak near oak cradle and protective wolf-shaped shadow.',
    'Let her testify',
    'The villagers hear an imperfect defense and admit the fear they mistook for proof.',
    'Protect the child witness',
    'The House receives testimony through a confidential intermediary.',
  ],
  [
    'Unclaimed Portrait, Unowned Person',
    'A framed portrait appears to represent the hero before the exchange. A stranger arrives, claiming the painting is their future and asking you to give it to them.',
    'Empty portrait frame on dark wall, adult traveler and masked stranger holding glass-covered image.',
    'Ask who is portrayed',
    'The stranger chooses a name and realizes the image depicts a possibility, not a possession.',
    'Leave the picture unclaimed',
    'The frame remains on the wall as evidence of a life still being written.',
  ],
  [
    'Twinned Guard at an Empty Throne',
    'Two identical guards defend an empty chair. Each believes the other has been ordered to kill the first, and both carry orders with the same seal.',
    'Two tired royal guards in matching brass armor facing outward beside empty throne, crossed spears.',
    'Read both orders side by side',
    'The guards find they were given the same protective duty and different invented enemies.',
    'Ask them to lower their spears',
    'One obeys first; the other chooses to trust the person she knows, not the document.',
  ],
  [
    'Indenture Room of Borrowed Work',
    'The House has traded decades of service for a promise nobody remembers making. Workers want wages and the right to quit, not a heroic rescue performed for them.',
    'Long dark workers workshop with copper loom and unpaid wage tins, gathered adults in working aprons.',
    'Open the payroll with workers',
    'They negotiate restitution with evidence from their own surviving records.',
    'Remove the binding lock',
    'The workers choose to leave or stay; the House cannot keep them for their own safety.',
  ],
  [
    'Lantern Landing for the Living',
    'Hundreds of memory lanterns swing above a narrow landing. Each is labeled with a name someone was told to forget, yet the owners can still recognize their voices.',
    'High wooden stair landing with suspended amber glass lanterns and two dark doorways.',
    'Let owners claim lanterns',
    'People select the memories they wish to carry and leave the rest untouched.',
    'Build a public shelf',
    'A new steward is elected and the House loses its monopoly on remembrance.',
  ],
  [
    'Cellar of Fearful Inventories',
    'The cellar holds every object the Warden confiscated to keep the village safe. Its shelves now block all escape routes.',
    'Stone underground cellar with brass inventory cage, confiscated umbrellas boots and lanterns piled in walls.',
    'Clear a safe passage',
    'The workers recover useful tools and reopen the corridor.',
    'Return the confiscated goods',
    "The cellar empties; the Warden's evidence of order becomes evidence of deprivation.",
  ],
  [
    "Rootbound Warden's Hearing",
    'The Warden is neither a pure villain nor an impartial judge. It must answer eight witnesses who remember the benefits as well as the damage of its bargains.',
    'Huge Warden of knotted roots and brass keys stands before an oak tribunal and eight witness lanterns.',
    'Present all eight witnesses',
    'The Warden admits a wish cannot substitute for consent; the doors open toward a negotiated remedy.',
    'Challenge its claim to own truth',
    'The Warden relinquishes its single ledger and allows conflicting accounts to survive.',
  ],
  [
    'Last Kind Lie, First Honest Hurt',
    'A memory shows a child safe because their parents were lied to. The now-grown child wants to know what really happened, even if the truth costs a comforting story.',
    'Cozy dim nursery with adult traveler holding old toy, sealed memory jar on small stool.',
    'Tell the grown child the truth',
    'They keep the love and reject the deception; the room stops rewinding the lie.',
    'Offer the testimony to them',
    'They choose when to open the jar, retaining authority over the timing.',
  ],
  [
    'Broken Doorway of Shared Repairs',
    'The door was broken by people trying to leave. One side wants it rebuilt so nobody escapes again; the other wants the doorway enlarged.',
    'Shattered carved doorframe at root arch, two groups of adult villagers with woodworking tools.',
    'Rebuild with an open hinge',
    'A practical door swings both directions and supports a shared watch.',
    'Leave an accessible threshold',
    'Residents build a low ramp and a public passage rather than a locked gate.',
  ],
  [
    'Unremembered Hearth',
    'At the final fire every rescued person arrives carrying a different account of home. The Reimaginer offers to restore a single perfect version, and none of the witnesses agrees which one.',
    'Grand rooted hearth circle, amber memory flames held by glass jars, eight distinct adult witnesses and a veiled guardian.',
    'Return each memory to its owner',
    'The hearth releases the jars to consenting hands; the rebuilt House loses the power to choose the owners.',
    'Create a revocable commons',
    'Witnesses write rules permitting memories to be shared and reclaimed, with visible exits for dissent.',
  ],
  [
    'Chime of Many Authors',
    "The exit bell carries every witness's voice, not a single final verdict. Oren has left a practical route out and a blank page in his manifest for the next traveler.",
    'Rooted exit arch leading to dawn forest, suspended little brass chime and weathered supply ledger on stone ledge.',
    'Carry the shared bell',
    'The door opens and the choices of all eight witnesses accompany you into Briar.',
    'Entrust it to Oren',
    'Oren signs the open manifest and takes responsibility for keeping the passage free.',
  ],
]
const keys = Object.keys(HOUSE_ROOMS) as HouseRoomId[]
export const DARK_HOUSE_ROOMS: Record<string, DarkHouseRoom> =
  Object.fromEntries(
    keys.map((id, index) => {
      const base = HOUSE_ROOMS[id]!
      const [
        title,
        opening,
        artPrompt,
        firstLabel,
        firstOutcome,
        secondLabel,
        secondOutcome,
      ] = briefs[index]!
      const choices: DarkHouseChoice[] = [
        { id: 'attend', label: firstLabel, outcome: firstOutcome },
        { id: 'refuse', label: secondLabel, outcome: secondOutcome },
      ]
      return [
        id,
        {
          id,
          title,
          kind: base.kind,
          opening,
          artPrompt,
          imagePath:
            '/images/memory-dungeon/dark-briar/house/rooms/' +
            id.toLowerCase() +
            '.webp',
          exits: base.exits,
          choices,
        },
      ]
    }),
  )
export interface DarkHouseTrialProgress {
  matched: string[]
  faceUp: string[]
  failures: number
  clue: string | null
  note: string
}
export interface DarkHousePuzzleProgress {
  solved: boolean
  wrong: string[]
  hint: boolean
  note: string
}
export interface DarkHouseProgress {
  version: 2
  active: boolean
  current: HouseRoomId
  visited: HouseRoomId[]
  decisions: Record<string, string>
  trials: Record<string, DarkHouseTrialProgress>
  puzzles: Record<string, DarkHousePuzzleProgress>
  spentEchoes: number
  ending: DarkHouseEnding | null
  status: string
}

function emptyTrial(): DarkHouseTrialProgress {
  return { matched: [], faceUp: [], failures: 0, clue: null, note: '' }
}
function emptyPuzzle(): DarkHousePuzzleProgress {
  return { solved: false, wrong: [], hint: false, note: '' }
}

export function darkHouseTrialSolved(
  progress: DarkHouseProgress,
  room: string,
): boolean {
  const faces = darkHouseTrialFaces(room)
  return (
    faces.length > 0 &&
    faces.every((face) => progress.trials[room]?.matched.includes(face.id))
  )
}
export function darkHousePuzzleSolved(
  progress: DarkHouseProgress,
  room: string,
): boolean {
  return progress.puzzles[room]?.solved === true
}
export function darkHouseRoomResolved(
  progress: DarkHouseProgress,
  room = progress.current,
): boolean {
  // Older saves already contain committed decisions. Respect these rather than
  // retroactively stranding existing players behind newly introduced games.
  if (progress.decisions[room]) return true
  if (DARK_HOUSE_TRIALS[room] && !darkHouseTrialSolved(progress, room))
    return false
  if (DARK_HOUSE_PUZZLES[room] && !darkHousePuzzleSolved(progress, room))
    return false
  return true
}
export function darkHouseEchoes(progress: DarkHouseProgress): number {
  const earned =
    Object.keys(DARK_HOUSE_TRIALS).filter((room) =>
      darkHouseTrialSolved(progress, room),
    ).length +
    Object.keys(DARK_HOUSE_PUZZLES).filter((room) =>
      darkHousePuzzleSolved(progress, room),
    ).length
  return Math.max(0, earned - progress.spentEchoes)
}
export function darkHouseStrain(progress: DarkHouseProgress): number {
  return (
    Object.values(progress.trials).reduce(
      (total, trial) => total + Math.floor(trial.failures / 3),
      0,
    ) +
    Object.values(progress.puzzles).reduce(
      (total, puzzle) => total + puzzle.wrong.length,
      0,
    )
  )
}
export function newDarkHouseProgress(): DarkHouseProgress {
  return {
    version: 2,
    active: false,
    current: HOUSE_ENTRY,
    visited: [HOUSE_ENTRY],
    decisions: {},
    trials: {},
    puzzles: {},
    spentEchoes: 0,
    ending: null,
    status: 'The reflected House is waiting for its witnesses.',
  }
}
export function canEnterDarkHouse(progress: DarkBriarProgress): boolean {
  return (
    progress.phase === 'exploring' &&
    progress.waveIndex === 3 &&
    progress.mapCards.length === 16 &&
    progress.mapCards.every((card) => card.matched) &&
    progress.player === '6,2' &&
    DARK_BRIAR_WITNESSES.every((key) => darkBriarHasWitness(progress, key))
  )
}

export function darkHouseExits(progress: DarkHouseProgress): HouseRoomId[] {
  const room = DARK_HOUSE_ROOMS[progress.current]
  if (!room) return []
  const forward = [...room.exits]
  const backtrack = Object.values(DARK_HOUSE_ROOMS)
    .filter(
      (previous) =>
        previous.exits.includes(progress.current) &&
        progress.visited.includes(previous.id),
    )
    .map((previous) => previous.id)
  const exits = [...new Set([...forward, ...backtrack])]
  // Every room has a story consequence. Solving its challenge unlocks the
  // two responses, but cannot silently skip the response by clicking the
  // next numbered square. On older saves, the already-visited route is still
  // traversable, even if that room predates this stricter decision gate.
  const canAdvance =
    darkHouseRoomResolved(progress) &&
    Boolean(progress.decisions[progress.current])
  return exits.filter(
    (id) =>
      (canAdvance || progress.visited.includes(id)) &&
      !(
        id === 'HD-33' &&
        (!progress.decisions['HD-32'] ||
          !darkHouseRoomResolved(progress, 'HD-32'))
      ) &&
      !(id === 'HD-36' && !progress.ending),
  )
}

export function darkHouseMove(
  progress: DarkHouseProgress,
  target: HouseRoomId,
): DarkHouseProgress {
  if (!progress.active || !darkHouseExits(progress).includes(target))
    return progress
  return {
    ...progress,
    current: target,
    visited: [...new Set([...progress.visited, target])],
    status: DARK_HOUSE_ROOMS[target]!.opening,
  }
}

/** Card flips are synchronous, save-safe and touch/keyboard friendly. An
 * incorrect pair stays face up until dismissed by the player. */
export function darkHouseFlip(
  progress: DarkHouseProgress,
  id: string,
): DarkHouseProgress {
  const room = progress.current
  if (!progress.active || !DARK_HOUSE_TRIALS[room] || progress.decisions[room])
    return progress
  const faces = darkHouseTrialFaces(room)
  const card = faces.find((face) => face.id === id)
  const trial = progress.trials[room] ?? emptyTrial()
  if (
    !card ||
    trial.matched.includes(id) ||
    trial.faceUp.includes(id) ||
    trial.faceUp.length >= 2
  )
    return progress
  const faceUp = [...trial.faceUp, id]
  if (faceUp.length === 1)
    return {
      ...progress,
      trials: {
        ...progress.trials,
        [room]: {
          ...trial,
          faceUp,
          note: 'Choose the corresponding piece of evidence.',
        },
      },
    }
  const previous = faces.find((face) => face.id === faceUp[0])!
  if (previous.pair === card.pair) {
    const matched = [...trial.matched, ...faceUp]
    const done = matched.length === faces.length
    const note = done
      ? 'The full testimony is restored. The chamber offers two ways to respond.'
      : previous.label +
        ' connects to ' +
        card.label +
        '. A remembered link holds.'
    return {
      ...progress,
      trials: {
        ...progress.trials,
        [room]: { ...trial, matched, faceUp: [], note },
      },
      status: note,
    }
  }
  const failures = trial.failures + 1
  const note =
    failures % 3 === 0
      ? 'The House presses back. A scar remains in your Chronicle, but the cards and choices remain available.'
      : 'These memories belong to different events. Study both, then turn them over.'
  return {
    ...progress,
    trials: {
      ...progress.trials,
      [room]: { ...trial, faceUp, failures, note },
    },
    status: note,
  }
}
export function darkHouseCloseMismatch(
  progress: DarkHouseProgress,
): DarkHouseProgress {
  const room = progress.current
  const trial = progress.trials[room]
  if (!progress.active || !trial || trial.faceUp.length !== 2) return progress
  const faces = darkHouseTrialFaces(room)
  if (
    faces.find((face) => face.id === trial.faceUp[0])?.pair ===
    faces.find((face) => face.id === trial.faceUp[1])?.pair
  )
    return progress
  return {
    ...progress,
    trials: { ...progress.trials, [room]: { ...trial, faceUp: [] } },
  }
}
export function darkHouseRecall(
  progress: DarkHouseProgress,
): DarkHouseProgress {
  const room = progress.current
  const trial = progress.trials[room] ?? emptyTrial()
  if (
    !progress.active ||
    !DARK_HOUSE_TRIALS[room] ||
    trial.clue ||
    darkHouseTrialSolved(progress, room) ||
    darkHouseEchoes(progress) < 1
  )
    return progress
  const faces = darkHouseTrialFaces(room)
  const next = faces.find((face) => !trial.matched.includes(face.id))
  if (!next) return progress
  return {
    ...progress,
    spentEchoes: progress.spentEchoes + 1,
    trials: {
      ...progress.trials,
      [room]: {
        ...trial,
        clue: next.pair,
        note: 'A remembered fragment identifies one complete pair.',
      },
    },
  }
}
export function darkHouseAnswerPuzzle(
  progress: DarkHouseProgress,
  id: string,
): DarkHouseProgress {
  const room = progress.current
  const puzzle = DARK_HOUSE_PUZZLES[room]
  const previous = progress.puzzles[room] ?? emptyPuzzle()
  if (
    !progress.active ||
    !puzzle ||
    previous.solved ||
    progress.decisions[room]
  )
    return progress
  const option = puzzle.options.find((item) => item.id === id)
  if (!option || previous.wrong.includes(id)) return progress
  const solved = id === puzzle.answer
  const next: DarkHousePuzzleProgress = {
    ...previous,
    solved,
    wrong: solved ? previous.wrong : [...previous.wrong, id],
    note: option.response,
  }
  return {
    ...progress,
    puzzles: { ...progress.puzzles, [room]: next },
    status: option.response,
  }
}
const EARNED_HOUSE_HINTS: Partial<
  Record<HouseRoomId, { source: DarkHouseEarnedClue; note: string }>
> = {
  'HD-03': {
    source: 'route',
    note: 'Oren recognizes the river route you planned together. The House cannot charge an echo for your own map.',
  },
  'HD-13': {
    source: 'earth-photo',
    note: 'The dated Earth photograph you recovered shows how a perfect-looking record can conceal a person losing their work. Count the meals served, not the errors reported.',
  },
  'HD-25': {
    source: 'supplies',
    note: 'Oren checks the provisions you counted together. His ledger names the workers who actually paid the debt.',
  },
  'HD-08': {
    source: 'names',
    note: 'The bridge mason consents to identifying the middle apology from the witness names you copied. The House cannot charge an echo for voluntary testimony.',
  },
  'HD-34': {
    source: 'consent',
    note: 'The witnesses whose names you protected describe an exit they can close themselves: a raised ramp and hinged floodgate, without publishing a single name.',
  },
}

export function darkHousePuzzleHint(
  progress: DarkHouseProgress,
  earnedClue: DarkHouseEarnedClue | null = null,
): DarkHouseProgress {
  const room = progress.current
  const puzzle = DARK_HOUSE_PUZZLES[room]
  const previous = progress.puzzles[room] ?? emptyPuzzle()
  const earnedHint = EARNED_HOUSE_HINTS[room]
  const free = earnedClue !== null && earnedClue === earnedHint?.source
  if (
    !progress.active ||
    !puzzle ||
    previous.solved ||
    previous.hint ||
    progress.decisions[room] ||
    (!free && darkHouseEchoes(progress) < 1)
  )
    return progress
  const note = free
    ? earnedHint!.note
    : 'The Chronicle yields a clue in exchange for one echo.'
  return {
    ...progress,
    spentEchoes: progress.spentEchoes + (free ? 0 : 1),
    puzzles: { ...progress.puzzles, [room]: { ...previous, hint: true, note } },
    status: note,
  }
}
export function darkHouseChoose(
  progress: DarkHouseProgress,
  id: string,
): DarkHouseProgress {
  if (
    !progress.active ||
    progress.decisions[progress.current] ||
    !darkHouseRoomResolved(progress)
  )
    return progress
  const choice = DARK_HOUSE_ROOMS[progress.current]?.choices.find(
    (choice) => choice.id === id,
  )
  if (!choice) return progress
  return {
    ...progress,
    decisions: { ...progress.decisions, [progress.current]: id },
    ending:
      progress.current === 'HD-35'
        ? id === 'attend'
          ? 'return'
          : 'commons'
        : progress.ending,
    status: choice.outcome,
  }
}
export function darkHouseVerdict(progress: DarkHouseProgress): string {
  if (!progress.ending) return ''
  const preface =
    progress.ending === 'commons'
      ? 'The House becomes a revocable commons. Every person may withdraw their testimony.'
      : 'The memories return to their individual owners. Nobody inherits the right to speak for them.'
  const after =
    darkHouseEchoes(progress) >= 3
      ? 'The recovered evidence lets villagers reopen old disputes with witnesses present.'
      : 'Some disputes remain unproven. The villagers make space for uncertain stories.'
  const cost =
    darkHouseStrain(progress) >= 4
      ? 'The crossings left visible fractures. Repairs require time and the willing help of those affected.'
      : 'The House survives the crossing with enough trust to begin its repairs together.'
  return [preface, after, cost].join(' ')
}
export function restoreDarkHouseProgress(value: unknown): DarkHouseProgress {
  const fresh = newDarkHouseProgress()
  if (!value || typeof value !== 'object') return fresh
  const saved = value as Partial<DarkHouseProgress> & { version?: number }
  const decisions: Record<string, string> = {}
  if (saved.decisions && typeof saved.decisions === 'object')
    for (const [room, id] of Object.entries(saved.decisions))
      if (DARK_HOUSE_ROOMS[room]?.choices.some((c) => c.id === id))
        decisions[room] = id
  const visited = Array.isArray(saved.visited)
    ? saved.visited.filter(
        (id): id is HouseRoomId =>
          typeof id === 'string' && Boolean(DARK_HOUSE_ROOMS[id]),
      )
    : []
  const current =
    typeof saved.current === 'string' && DARK_HOUSE_ROOMS[saved.current]
      ? (saved.current as HouseRoomId)
      : HOUSE_ENTRY
  const trials: Record<string, DarkHouseTrialProgress> = {}
  if (saved.trials && typeof saved.trials === 'object')
    for (const [room, raw] of Object.entries(saved.trials)) {
      if (!DARK_HOUSE_TRIALS[room] || !raw || typeof raw !== 'object') continue
      const input = raw as DarkHouseTrialProgress
      const faces = darkHouseTrialFaces(room)
      const ids = new Set(faces.map((face) => face.id))
      const selected = new Set(
        Array.isArray(input.matched)
          ? input.matched.filter((id) => typeof id === 'string' && ids.has(id))
          : [],
      )
      // Never restore half of a "solved" pair or duplicate cards.
      const matched = faces
        .filter(
          (face) =>
            selected.has(face.id) &&
            faces
              .filter((other) => other.pair === face.pair)
              .every((other) => selected.has(other.id)),
        )
        .map((face) => face.id)
      const faceUp = Array.isArray(input.faceUp)
        ? [
            ...new Set(
              input.faceUp.filter(
                (id) =>
                  typeof id === 'string' &&
                  ids.has(id) &&
                  !matched.includes(id),
              ),
            ),
          ].slice(0, 2)
        : []
      trials[room] = {
        matched,
        faceUp,
        failures: Number.isSafeInteger(input.failures)
          ? Math.max(0, Math.min(999, input.failures))
          : 0,
        clue:
          typeof input.clue === 'string' &&
          faces.some((face) => face.pair === input.clue)
            ? input.clue
            : null,
        note: typeof input.note === 'string' ? input.note.slice(0, 350) : '',
      }
    }
  const puzzles: Record<string, DarkHousePuzzleProgress> = {}
  if (saved.puzzles && typeof saved.puzzles === 'object')
    for (const [room, raw] of Object.entries(saved.puzzles)) {
      const puzzle = DARK_HOUSE_PUZZLES[room]
      if (!puzzle || !raw || typeof raw !== 'object') continue
      const input = raw as DarkHousePuzzleProgress
      puzzles[room] = {
        solved: input.solved === true,
        wrong: [
          ...new Set(
            Array.isArray(input.wrong)
              ? input.wrong.filter(
                  (id) =>
                    typeof id === 'string' &&
                    id !== puzzle.answer &&
                    puzzle.options.some((option) => option.id === id),
                )
              : [],
          ),
        ],
        hint: input.hint === true,
        note: typeof input.note === 'string' ? input.note.slice(0, 350) : '',
      }
    }
  const partial: DarkHouseProgress = {
    version: 2,
    active: saved.active === true,
    current,
    visited: [...new Set([HOUSE_ENTRY, ...visited, current])],
    decisions,
    trials,
    puzzles,
    spentEchoes: 0,
    ending:
      decisions['HD-35'] === 'attend'
        ? 'return'
        : decisions['HD-35'] === 'refuse'
          ? 'commons'
          : null,
    status:
      typeof saved.status === 'string'
        ? saved.status.slice(0, 500)
        : fresh.status,
  }
  const spent =
    typeof saved.spentEchoes === 'number' &&
    Number.isSafeInteger(saved.spentEchoes)
      ? saved.spentEchoes
      : 0
  return {
    ...partial,
    spentEchoes: Math.max(0, Math.min(darkHouseEchoes(partial), spent)),
  }
}
export function validateDarkHouse(): string[] {
  const problems: string[] = []
  if (keys.length !== 36 || Object.keys(DARK_HOUSE_ROOMS).length !== 36)
    problems.push('Dark House requires 36 rooms')
  for (const room of Object.values(DARK_HOUSE_ROOMS)) {
    if (room.opening.length < 70 || room.artPrompt.length < 70)
      problems.push('Incomplete dark room ' + room.id)
    if (
      room.choices.length !== 2 ||
      room.choices.some((c) => !c.label || !c.outcome)
    )
      problems.push('Incomplete room choice ' + room.id)
  }
  return problems
}
