import {
  HOUSE_ROOMS,
  type HouseEnding,
  type HouseEndingLens,
  type HouseProgress,
  type HouseRoomId,
} from './house'
import { briarQuestLog } from './briarQuests'

/**
 * The twelve House epilogues: the three Memory Hearth resolutions, each told
 * through one of the master bible's four earned epilogue lenses (kind_robots
 * #4136 §9). The lens is read from decisions the save already keeps, Briar
 * scene choices and House room choices. The earned lens is snapshotted at
 * the Hearth; completed legacy saves derive that lens during restoration.
 */
export type HouseEpilogueLens = HouseEndingLens

export const HOUSE_EPILOGUE_LENSES: readonly HouseEpilogueLens[] = [
  'community',
  'bonds',
  'obligation',
  'honesty',
]

export const HOUSE_EPILOGUE_LENS_LABELS: Record<HouseEpilogueLens, string> = {
  community: 'Community repaired',
  bonds: 'Private bonds, unsettled order',
  obligation: 'Power bought with obligation',
  honesty: 'Fractured trust, hard-won honesty',
}

type Signal = readonly [scope: 'house' | 'briar', key: string, choice: string]

/**
 * Each lens is earned by the choices that built it, and by every World One
 * side quest finished for it (utils/memoryDungeon/briarQuests.ts). Ties go to the earlier
 * lens in HOUSE_EPILOGUE_LENSES order. The Hearth (HD-35) and the exit
 * (HD-36) are left out on purpose: the epilogue is fixed the moment the
 * resolution is chosen.
 */
export const HOUSE_EPILOGUE_SIGNALS: Record<
  HouseEpilogueLens,
  readonly Signal[]
> = {
  community: [
    ['house', 'HD-04', 'share'],
    ['house', 'HD-05', 'open'],
    ['house', 'HD-12', 'open'],
    ['house', 'HD-24', 'mark'],
    ['house', 'HD-26', 'testify'],
    ['house', 'HD-28', 'cooperate'],
    ['house', 'HD-29', 'repair'],
    ['house', 'HD-31', 'mark'],
    ['briar', '1,2', 'warn'],
    ['briar', '1,8', 'plant'],
    ['briar', '3,4', 'help'],
    ['briar', '5,7', 'negotiate'],
    ['briar', '7,8', 'open'],
    ['briar', '8,3', 'vote'],
    ['briar', '8,7', 'route'],
  ],
  bonds: [
    ['house', 'HD-02', 'shelter'],
    ['house', 'HD-10', 'manifest'],
    ['house', 'HD-11', 'respect'],
    ['house', 'HD-18', 'rest'],
    ['house', 'HD-30', 'talk'],
    ['house', 'HD-33', 'consent'],
    ['briar', '1,3', 'return'],
    ['briar', '2,1', 'invite'],
    ['briar', '2,5', 'grieve'],
    ['briar', '4,3', 'plan'],
    ['briar', '4,4', 'escort'],
    ['briar', '6,8', 'shield'],
    ['briar', '8,6', 'promise'],
  ],
  obligation: [
    ['house', 'HD-01', 'name'],
    ['house', 'HD-09', 'duel'],
    ['house', 'HD-22', 'duel'],
    ['house', 'HD-27', 'keep'],
    ['house', 'HD-28', 'duel'],
    ['house', 'HD-32', 'fight'],
    ['briar', '2,8', 'bargain'],
    ['briar', '3,2', 'offer'],
    ['briar', '4,2', 'promise'],
    ['briar', '5,4', 'errand'],
    ['briar', '5,5', 'gift'],
    ['briar', '5,6', 'bargain'],
    ['briar', '7,3', 'bribe'],
    ['briar', '7,4', 'register'],
    ['briar', '8,5', 'promise'],
  ],
  honesty: [
    ['house', 'HD-15', 'question'],
    ['house', 'HD-16', 'inspect'],
    ['house', 'HD-17', 'read'],
    ['house', 'HD-20', 'testify'],
    ['house', 'HD-21', 'archive'],
    ['house', 'HD-25', 'recount'],
    ['house', 'HD-33', 'reveal'],
    ['briar', '1,5', 'wake'],
    ['briar', '2,1', 'truth'],
    ['briar', '2,2', 'report'],
    ['briar', '4,5', 'pay'],
    ['briar', '5,4', 'truth'],
    ['briar', '6,4', 'read'],
    ['briar', '6,8', 'warn'],
    ['briar', '7,1', 'appeal'],
  ],
}

export interface HouseEpilogue {
  /** `release-community`, `renew-honesty`, … stable, never renumbered. */
  id: `${HouseEnding}-${HouseEpilogueLens}`
  resolution: HouseEnding
  lens: HouseEpilogueLens
  title: string
  text: string
  artPrompt: string
  artPath: string
}

const STYLE =
  'Hand-painted gouache and ink illustration, warm candlelight and deep green shadows.'
const SCYLLA =
  'Scylla, a stout broad-shouldered woman with light brown skin, a chestnut braid and a small silver crown, in a navy travel coat'
const CHAR =
  'Char, her twin with the same broad face, deep brown skin, a high black braid and black velvet and lace'
const OREN =
  'Oren, a very tall broad man in a rough brown cloth executioner hood with two eyeholes and a leather apron of pouches'
const WARDEN =
  'the Rootbound Warden, a towering guardian of knotted oak roots and brass keys with a carved wooden mask for a face'
const TRAVELER =
  'an androgynous fey traveller with long pointed ears, short silver hair and a dark green cloak'

const TABLEAUX: Record<
  HouseEpilogue['id'],
  { title: string; text: string; scene: string }
> = {
  'release-community': {
    title: 'The Jars Go Home by Cart',
    text: "Oren's manifest becomes a delivery route. The Thorn Patrol escorts a handcart door to door, and every jar is signed for by the hand that filled it. By midsummer the village keeps a shelf at the mill for the jars nobody came to collect, with a lamp beside it and a rota to dust them. Some owners have moved away, and some have died. The shelf is the village's promise that they will be looked for.",
    scene: `A wooden handcart loaded with glowing glass jars stands at a cottage door on a muddy village lane. ${OREN} reads from a long ledger while a grey-haired woman takes a jar from the cart in both hands. Two forest guards in bark armor push the cart. Behind them, a mill wall with a lit lamp beside a shelf of jars. Morning light. Wide shot.`,
  },
  'release-bonds': {
    title: 'Tea on the Landing',
    text: 'The memories go home, and the village spends a loud season arguing about which old protections should never have been taken away. Your party stays out of it. Scylla finds the jar Char gave up as a child and hands it back unopened. Char opens it anyway, laughs at what is inside and says nothing more about it. The House still needs a keeper, and nobody has volunteered.',
    scene: `On a lantern-lit stair landing, ${SCYLLA}, holds out a small glowing glass jar to ${CHAR}, who holds its lid in one hand and laughs. ${OREN}, pours tea from a dented pot beside them. Through a window behind, villagers argue in the lane below. Medium shot.`,
  },
  'release-obligation': {
    title: 'What the Chime Costs',
    text: 'You opened the House with victories and promises, and they hold. The memories are returned and nobody can stop you. Then the invoices arrive. Mosswick wants the true account you swore to bring back. The Index files a copy of every name you carried out of the House, and the Thorn Patrol asks politely when their courage will be paid for. You are free, and you are owed to half the Briar.',
    scene: `${TRAVELER} stands at a forest crossroads holding a small golden bell. Around the traveller, a stooped grey-bearded merchant in a moss-green coat, a thin figure in layered paper armor at a roll-top desk and two forest guards in bark armor each hold out a paper slip. Late afternoon light. Wide shot.`,
  },
  'release-honesty': {
    title: 'Every Jar Opened',
    text: "The jars are returned whole, and the elders' kind lie comes home with them. Neighbours who were protected learn what they were protected from, and some refuse to speak to you all winter. The patrol's testimony stands in the public record next to the village's old accusation. Nobody calls it a happy ending, but for the first time in a generation the House and the village tell the same story.",
    scene: `In a village meeting hall with plain wooden benches, villagers hold open glass jars that glow faintly. An old man in the front row stares at his jar with wet eyes, while a woman beside him turns her back on a cloaked fey traveller standing by the door. A grey wolf in a leather harness sits at the traveller's feet. Cold daylight from high windows. Wide shot.`,
  },
  'renew-community': {
    title: 'The Commons Has a Rota',
    text: 'The commons meets on the first frost of every month. Anyone may reclaim a memory or leave one, and the minutes record who asked. The Warden learns to take its turn at the door, then learns to complain about the rota like everyone else. The service passage stays open, the boot room is swept by volunteers, and a stranger who arrives lost is shown the safe route before anybody asks their name.',
    scene: `Villagers sit on benches around the rootwood hearth of a manor, passing a ledger from hand to hand. ${WARDEN}, stands by the open front door holding a broom, waiting its turn. A child hands a cup of soup to a muddy stranger in the doorway. Warm firelight. Wide shot.`,
  },
  'renew-bonds': {
    title: 'A Key on Every Hook',
    text: 'The commons is fragile and quarrelsome, and the village argues over every clause. Your companions settle into it anyway. Scylla writes the stewardship rules, Char writes the exceptions, and Oren hangs one key on the landing for each of you and a fourth for whoever comes next. The House is not yet safe for everyone, but it has become a place where the four of you come home.',
    scene: `A row of four brass keys hangs on hooks along a lantern-lit stair landing, the fourth hook empty. ${OREN}, hangs the third key. ${SCYLLA}, writes in a ledger at a small desk, and ${CHAR}, leans over her shoulder pointing at a page. Warm lamplight. Medium-wide shot.`,
  },
  'renew-obligation': {
    title: 'Steward by Contract',
    text: 'The witnesses agreed to the commons because you had won the right to propose it. The price is a seat at every meeting, a vote you cannot give away, and a Warden who brings you each dispute first. You hold more power in the Briar than any changeling should. Every promise you made on the road to the Hearth now has a chair at the table, waiting to be kept.',
    scene: `At a long oak table in a root-grown manor, ${TRAVELER} sits in a tall chair at the head while ${WARDEN}, sets a stack of bound ledgers in front of them. Down both sides of the table, empty chairs each hold a folded paper slip. Candlelight. Medium-wide shot.`,
  },
  'renew-honesty': {
    title: 'Minutes Kept in Plain Speech',
    text: 'The commons opens with the truth the elders hid. The first meeting is a shouting match, the second is a long silence, and the third begins with an apology from someone who was never asked for one. Old friendships break and do not mend this year. The minutes are kept in plain speech, every withdrawal is honoured, and no memory is held again without the owner saying yes out loud.',
    scene: `In a dim manor hall, elderly villagers stand in a half-circle, some with arms crossed and one woman with her hand over her mouth. A young clerk at a lectern writes in an open ledger. ${WARDEN}, kneels at the back with its head bowed. Grey morning light through tall windows. Wide shot.`,
  },
  'break-community': {
    title: 'The Village Builds a Smaller House',
    text: 'With the mechanism broken, the House wakes wild. Doors move, rooms wander, and the cellar sings at night. The village does not wait for a hero. It builds a small timber hall by the mill where memories are kept only in the hands of the people who own them, and it posts a night watch of patrol, millers and children. It is not as safe as the old bargain was, but nobody had to be erased to build it.',
    scene: `Villagers raise the timber frame of a small hall beside a water mill at dusk, passing beams hand to hand. In the background on the hill, a huge dark manor of roots leans at a crooked angle with lights moving in its windows. A grey wolf and two guards in bark armor stand watch by a bonfire. Wide shot.`,
  },
  'break-bonds': {
    title: 'Four Travellers and a Loose House',
    text: "The House is free and dangerous, and you leave the village to decide what to do about it. You are not proud of that. On the road, Char teaches you the protective knot her grandmother taught her, Scylla finally admits that she packed the seventh wardrobe for you, and Oren adds a line to the manifest that simply reads 'together'. Behind you, the House is still moving.",
    scene: `Four travellers walk away down a forest road at dawn: ${OREN}, ${SCYLLA}, ${CHAR}, and ${TRAVELER}. Char ties a small cord knot around the traveller's wrist as they walk. Far behind them on a hill, a dark manor of roots leans against the sky. Wide shot from behind.`,
  },
  'break-obligation': {
    title: 'The Hammer Still Owed',
    text: 'You broke the mechanism with the strength you had gathered: the duels won, the promises spent, the names you traded for passage. The House cannot own memory any more, but your creditors still can. Pip keeps a careful book of everything you owe, the Thorn Patrol has started calling you captain, and the Warden, unrooted and unemployed, has decided to follow you until you find it a better job.',
    scene: `On a forest road, ${TRAVELER} walks with a rune hammer over one shoulder. Behind follow a small green-skinned goblin courier writing in a notebook, two forest guards in bark armor, and ${WARDEN}, its roots dragging loose soil. Overcast afternoon light. Wide shot.`,
  },
  'break-honesty': {
    title: 'Nothing Left to Hide Behind',
    text: "The mechanism breaks and every kept secret spills out at once: the elders' lie, the patrol's real service, Morrow's first clumsy weeks inside your life. The village is furious, and some of that fury is for you. You stay anyway, answer every question you can, and admit the ones you cannot. Trust comes back slowly, one honest conversation at a time.",
    scene: `In the ruins of a rootwood hearth, glowing fragments of glass jars drift up through a cracked manor roof. ${TRAVELER} stands among angry villagers, open hands raised, answering an old woman who points at the broken hearth. A grey wolf in a leather harness sits beside the traveller. Grey dawn light. Wide shot.`,
  },
}

const ROOT = '/images/memory-dungeon/house/epilogues'

export const HOUSE_EPILOGUES: Record<HouseEpilogue['id'], HouseEpilogue> =
  Object.fromEntries(
    (['release', 'renew', 'break'] as const).flatMap((resolution) =>
      HOUSE_EPILOGUE_LENSES.map((lens) => {
        const id = `${resolution}-${lens}` as const
        const tableau = TABLEAUX[id]
        return [
          id,
          {
            id,
            resolution,
            lens,
            title: tableau.title,
            text: tableau.text,
            artPrompt: `${tableau.scene} ${STYLE}`,
            artPath: `${ROOT}/${id}.webp`,
          },
        ]
      }),
    ),
  ) as Record<HouseEpilogue['id'], HouseEpilogue>

/** How strongly each lens was earned, from the House and Briar decisions. */
export function houseEpilogueScores(
  progress: Pick<HouseProgress, 'decisions'>,
  briarDecisions: Readonly<Record<string, string>>,
): Record<HouseEpilogueLens, number> {
  const scores = { community: 0, bonds: 0, obligation: 0, honesty: 0 }
  for (const lens of HOUSE_EPILOGUE_LENSES)
    for (const [scope, key, choice] of HOUSE_EPILOGUE_SIGNALS[lens])
      if (
        (scope === 'house' ? progress.decisions[key] : briarDecisions[key]) ===
        choice
      )
        scores[lens] += 1
  // A finished side quest weighs on the road it was walked for.
  for (const thread of briarQuestLog(briarDecisions, progress.decisions))
    if (thread.state === 'complete') scores[thread.quest.lens] += 1
  return scores
}

export function houseEpilogueLens(
  progress: Pick<HouseProgress, 'decisions'>,
  briarDecisions: Readonly<Record<string, string>>,
): HouseEpilogueLens {
  const scores = houseEpilogueScores(progress, briarDecisions)
  return HOUSE_EPILOGUE_LENSES.reduce((best, lens) =>
    scores[lens] > scores[best] ? lens : best,
  )
}

/** The earned epilogue, once the Memory Hearth resolution is chosen. */
export function houseEpilogue(
  progress:
    | Pick<HouseProgress, 'decisions' | 'ending' | 'endingLens'>
    | null
    | undefined,
  briarDecisions: Readonly<Record<string, string>>,
): HouseEpilogue | null {
  if (!progress?.ending) return null
  return HOUSE_EPILOGUES[
    `${progress.ending}-${progress.endingLens ?? houseEpilogueLens(progress, briarDecisions)}`
  ]
}

export function validateHouseEpilogues(
  briarChoices: Readonly<Record<string, readonly string[]>>,
): string[] {
  const issues: string[] = []
  if (Object.keys(HOUSE_EPILOGUES).length !== 12)
    issues.push('The House needs twelve epilogues')
  for (const lens of HOUSE_EPILOGUE_LENSES)
    for (const [scope, key, choice] of HOUSE_EPILOGUE_SIGNALS[lens]) {
      const ids =
        scope === 'house'
          ? HOUSE_ROOMS[key as HouseRoomId]?.choices.map((c) => c.id)
          : briarChoices[key]
      if (key === 'HD-35' || key === 'HD-36')
        issues.push(`${lens} reads ${key}, which follows the resolution`)
      if (!ids?.includes(choice))
        issues.push(`${lens} signal ${scope} ${key}:${choice} is not a choice`)
    }
  for (const epilogue of Object.values(HOUSE_EPILOGUES))
    if (epilogue.text.length < 200 || !epilogue.title.trim())
      issues.push(`Epilogue ${epilogue.id} is unwritten`)
  return issues
}
