/**
 * Earth photographs form an independent append-only evidence journal.
 *
 * Production authors 32 fixed beats (two per experience). Only e01/e02 are
 * collectible in the two currently playable realities. Future entries are
 * never exposed by a progress counter, locked card, or UI teaser.
 * The protagonist's response is an enduring interpretation, not a retcon
 * of what the camera actually recorded.
 */
import type { ExperienceId } from './reimaginerCampaign'

export type PhotoResponse = 'challenge' | 'hold'
export interface EarthPhoto {
  id: string
  experience: ExperienceId
  site: string
  order: number
  title: string
  caption: string
  artPath: string
  artPrompt: string
  challenge: string
  hold: string
  challengeReflection: string
  holdReflection: string
}
type AuthorPhoto = [
  ExperienceId,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
]

const AUTHOR_PHOTOS: AuthorPhoto[] = [
  [
    'e01',
    '2,5',
    'The Dismissal',
    'Morrow, wearing your face, leaves the research office carrying a box. Your old career is already gone.',
    'Was this really a dismissal?',
    'Admit how angry this makes you',
    'A cardboard box is not a verdict. The hour, the photographer and what happened afterward remain unknown.',
    'You are furious that someone else could lose your work in your name. The anger is real; the photograph is incomplete.',
    'An androgynous adult in their thirties with short dark hair and a grey cardigan walks out of a glass research office entrance in grey drizzle, carrying a cardboard box holding a potted plant, a mug and a stack of folders. A security guard holds the door. Seen from across the street. Medium-wide shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e01',
    '8,6',
    'The Gathering',
    'Someone you recognize is hurt at a gathering. The image records an injury, not its full explanation.',
    'Look for the person outside the crop',
    'Acknowledge the harm',
    'The injured friend is looking past the camera at someone offering help. Who was there before the shutter fell?',
    'Whatever the cause, that friend was humiliated under your face. You cannot dismiss their pain simply because Morrow acted.',
    'A crowded small apartment living room at night under warm lamplight. an androgynous adult in their thirties with short dark hair and a grey cardigan talks loudly with raised hands while a friend beside them in a green sweater stares at the floor. Off-centre handheld shot with slight motion blur. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e02',
    '2,5',
    'The Helping Hand',
    'A second print of the office exit catches a hand extending from the doorway. The first picture omitted it.',
    'Find the person offering a lift',
    'Keep both contradictory prints',
    'Perhaps someone thought Morrow might need company more than advice. You were not the only one who noticed the fall.',
    'Neither image deserves to replace the other. You preserve both so that your first judgment remains visible.',
    'Two black-and-white contact prints lie side by side on a desk. Both show the same research office doorway with a person carrying a cardboard box, and in the second print a hand reaches out from the doorway toward the box. Desk lamp light from above. Close shot from above. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e02',
    '5,4',
    'The Unsent Reply',
    'A coffee-stained photograph shows two cups opposite one vacant chair. On its reverse, an unmailed apology is addressed in your handwriting.',
    'Ask whether the apology was sent',
    'Keep the blank chair in view',
    'Morrow may have learned an apology before learning the courage to deliver it. A camera cannot establish who came back.',
    'You remember the people left to wait for your face. The empty chair deserves a place in the record.',
    'A late-night cafe table beside a rain-streaked window, two coffee cups facing one empty chair and a turned-over envelope beside the cups. Close shot from the side. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e03',
    '1,3',
    'The Transit Lesson',
    'Morrow studies a railway ticket machine as if negotiating with a petty king. A stranger points patiently at the screen.',
    'Look for the kindness',
    'Remember the stranger was not an obstacle',
    'Someone spent a minute helping your stolen face. Ordinary generosity survives the strangest first impressions.',
    'It is easier to blame an incomprehensible machine than admit you have needed that kind of help yourself.',
    'In a subway station, an androgynous adult in their thirties with short dark hair and a grey cardigan frowns at a ticket machine screen while an older stranger in a raincoat points patiently at one button. Commuters walk past behind them. Fluorescent station light. Medium shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e03',
    '6,4',
    'The Failed Gesture',
    'One open hand hangs above a desk scattered with diagrams. Nothing in the room has moved; the clock reads an ordinary hour.',
    'Consider what Morrow tried to summon',
    'Honor the silence in the room',
    'The gesture is familiar from the other world. On Earth it left no visible miracle, only a frustrated person.',
    'You wanted magic to fail for Morrow. You did not expect the disappointment in your own face to hurt.',
    'An open hand raised above an office desk scattered with diagrams, a still glass of water beside the papers, a plain wall clock in the background. Overhead fluorescent light. Medium close-up. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e04',
    '2,2',
    'The First Impossible Rain',
    'A city intersection glitters with impossible weather. Neighbors guide one another under a pharmacy awning while sirens approach.',
    'Ask who opened the door',
    'Notice the rescue',
    'The image proves an altered possibility, not an inevitable future. Whose wish or mistake brought this weather?',
    'You cannot let the spectacle erase the ordinary people carrying strangers to shelter.',
    'A city intersection at night under falling rain that glows pale gold in the streetlights. Neighbors in coats guide each other under a green pharmacy awning, one holding an elderly man by the arm. The red and blue lights of an approaching ambulance blur in the distance. Wide shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e04',
    '7,6',
    'The Research Shelter',
    'A laboratory door has become a makeshift shelter. Someone uses a whiteboard to track medication rather than explain the impossible.',
    'Follow the practical solution',
    'Respect the overwhelmed helpers',
    'There may be no spell for organizing insulin, clean water and a safe exit. Someone made a plan anyway.',
    'Every future is measured in lives, not the elegance of the miracle that changed it.',
    'A university laboratory turned into an emergency shelter: folding cots between lab benches, stacked water bottles and blankets, and a whiteboard covered in a grid of small marker ticks. A tired volunteer in a lab coat checks a clipboard. Fluorescent light, dark storm clouds through the windows. Wide shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e05',
    '3,1',
    'A Very Formal Postcard',
    'An Earth postcard sits beside a set of carefully folded travel instructions. The handwriting is yours, but the punctuation is unmistakably Morrow’s.',
    'Follow the route described',
    'Laugh at the absurdity',
    'Morrow is making a map of ordinary life as earnestly as you map the Marches. It may actually be useful.',
    'Your first laugh at his expense softens into recognition. He is lost in a foreign country, too.',
    'A tidy desk with a postcard of a seaside town beside a sheet of travel instructions folded into precise thirds and a fountain pen laid parallel to it. Window daylight. Close shot from above. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e05',
    '8,5',
    'The Waiting Room',
    'Morrow waits at a public-service counter with twelve numbered slips. An older stranger has given him the correct form.',
    'Trace the paperwork',
    'Remember the unsolicited helper',
    'He is learning which authorities can help and which only produce another queue. It feels painfully familiar.',
    'This world has its own gatekeepers. Someone chose to make that door easier.',
    'an androgynous adult in their thirties with short dark hair and a grey cardigan sits in a government service waiting room holding a fan of twelve paper number slips, while an older woman in the next plastic chair points to the right form. Fluorescent light. Medium shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e06',
    '2,6',
    'The Quiet Lesson',
    'A research notebook sits open to pages of patient questions. A colleague has drawn the apparatus rather than rewriting the answer for Morrow.',
    'Study what was taught',
    'Thank the unseen colleague',
    'The experiment is small. The dignity of being treated as someone who can learn is not.',
    'You used to demand that coworkers know everything by Friday. This picture makes you reconsider.',
    "An open laboratory notebook on a bench. A colleague's hand sketches a simple pencil drawing of an apparatus while an androgynous adult in their thirties with short dark hair and a grey cardigan leans in to watch. Daylight from a lab window. Close-medium shot. Candid 35mm colour photograph, natural light, soft film grain.",
  ],
  [
    'e06',
    '6,2',
    'An Honest Mistake',
    'In a shared office, Morrow has circled an error in red and left his own name beside the correction.',
    'Look for responsibility',
    'Allow a person to improve',
    'He made a mistake and did not make another person carry it. You can dislike the theft and still recognize the act.',
    'The person wearing your face is changing in ways no photograph from Briar could have predicted.',
    'In a shared office, an androgynous adult in their thirties with short dark hair and a grey cardigan sits at a desk holding a red pen beside a printed chart with one error circled in red. Coworkers type at nearby desks. Overcast window light. Medium shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e07',
    '2,3',
    'Bread for the Long Shift',
    'Morrow has brought a paper bag of warm rolls to an exhausted night crew. One person is already laughing.',
    'Find who invited him',
    'Let the kindness stand',
    'There is a story here of being included, though not yet of being forgiven.',
    'You do not owe approval of the exchange to admit that an act of care happened.',
    'A night-shift break room with tired colleagues in scrubs and high-visibility vests. an androgynous adult in their thirties with short dark hair and a grey cardigan passes around a paper bag of warm bread rolls, and one colleague is laughing. Fluorescent light. Medium shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e07',
    '7,5',
    'The Difficult Call',
    'A phone lies face down beside a page of crossed-out introductions. Morrow has been rehearsing a conversation.',
    'Wonder who was called',
    'Respect the preparation',
    'A draft is not a confession. Someone may still be waiting to hear the truth.',
    'You have also practiced painful words before picking up a telephone.',
    "A late-night apartment desk with a mobile phone face down beside a notepad of crossed-out lines, a desk lamp, and the edge of a person's arm. Warm lamplight. Close shot. Candid 35mm colour photograph, natural light, soft film grain.",
  ],
  [
    'e08',
    '1,4',
    'A Door Left Unlocked',
    'A colleague waits in the doorway of Morrow’s new apartment while another carries a table upstairs.',
    'Notice the invitation',
    'Honor the chosen help',
    'Moving day is not an ending. It suggests there are people prepared to share the work of beginning again.',
    'You never thought the stolen life might contain new debts of gratitude.',
    'A narrow apartment stairwell where two friends carry a secondhand wooden table up the stairs toward an open doorway, a colleague holding the door. Daylight from a stair window. Medium shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e08',
    '6,7',
    'The Empty Place Setting',
    'A supper table is set for three, then crossed by an unexpected fourth plate. You cannot tell who sat where.',
    'Ask who came to dinner',
    'Let the ambiguity remain',
    'Photographs are not population registers. There is still room in the story for someone you cannot name.',
    'You resist inventing a family from crockery. You have been wrong about an empty chair before.',
    'A modest apartment dining table set with mismatched thrift-store plates for three, plus a fourth plate squeezed in at a corner, under a warm pendant lamp. The chairs are empty. Medium shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e09',
    '3,2',
    'A Job Worth Keeping',
    'A staff photograph catches Morrow in a small research group. He is not standing in the center and does not seem to mind.',
    'Read the faces',
    'Acknowledge earned belonging',
    'The smiles do not prove everything is right. They do suggest someone expects him to return tomorrow.',
    'He found work that was not yours. That makes your anger more complicated, not less justified.',
    'A small research group of six colleagues stands in a lab doorway for a staff photo. an androgynous adult in their thirties with short dark hair and a grey cardigan stands at the end of the row, relaxed and smiling. Bright overhead light. Medium-wide shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e09',
    '7,3',
    'The Volunteer Shift',
    'An evening noticeboard is crowded with handwritten requests. Morrow has added a small practical offer in the margin.',
    'Find the beneficiary',
    'Accept that change can help',
    'Nobody photographed the result. You cannot claim credit or blame without asking the people involved.',
    'Your face is becoming known for things you did not choose. Some might be good.',
    'A corridor cork board crowded with pinned paper notes. A hand pins one small extra note into the margin. Evening fluorescent light. Close shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e10',
    '1,5',
    'The First Real Celebration',
    'At a modest gathering, Morrow is holding a lopsided cake. The injured friend from the first photograph is standing nearby.',
    'Ask whether they reconciled',
    'Keep the old hurt in view',
    'A person can stand near someone without forgiving them. The later smile cannot cancel the first bruise.',
    'What happened at that first gathering mattered. So might what happens next.',
    'A small apartment party where an androgynous adult in their thirties with short dark hair and a grey cardigan holds a lopsided homemade cake with lit candles, while a friend in a green sweater stands a step away at the edge of the group, half smiling. Warm lamplight and paper streamers. Medium shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e10',
    '5,7',
    'A Seat Beside the Window',
    'Two adults share a quiet train compartment. Their hands nearly touch on the seat between them.',
    'Resist naming the relationship',
    'Respect an unforced closeness',
    'There may be trust here, or merely companionship during a long commute. You cannot deduce a vow from proximity.',
    'The image unsettles you because it shows tenderness you did not authorize and cannot entirely despise.',
    'Two adults sit side by side in a quiet evening commuter train, their hands resting on the seat between them and almost touching. City lights at dusk through the window. Shallow focus. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e11',
    '2,2',
    'The Trusted Key',
    'Morrow holds an extra apartment key while someone balances groceries at the door. Neither face is performing for the camera.',
    'Ask what was agreed',
    'Consider mutual trust',
    'An extra key is a promise with rules, and you have not heard either person explain theirs.',
    'You remember what it felt like to give someone access to a home. This is somebody’s real risk.',
    'an androgynous adult in their thirties with short dark hair and a grey cardigan holds out a spare apartment key at an open doorway to a person balancing two grocery bags. Hallway light. Medium shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e11',
    '8,3',
    'An Ordinary Tuesday',
    'Two mugs dry beside a sink full of dishes. On the refrigerator, a small drawing is held by a magnet, mostly out of frame.',
    'Do not invent the artist',
    'Value the ordinary work',
    'There is no evidence who made the drawing. Even now, your mind tries to fill every blank.',
    'The dishes are a small proof of continuity. Someone stayed long enough to make a mess together.',
    'A kitchen sink full of dishes with two mugs drying on a rack beside it. Off to one side, a small paper drawing is held to the refrigerator door by a magnet, half out of view. Warm afternoon light. Close shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e12',
    '2,4',
    'The Difficult Conversation',
    'Morrow and another adult sit across from one another, not touching. The camera is too far away to record words.',
    'Leave room for refusal',
    'Notice the courage to speak',
    'The conversation may have ended with goodbye. A photograph cannot tell you whether anyone consented to what followed.',
    'You fear what was decided. You also know that difficult talks are not always disasters.',
    'Seen from across a sunny park, two adults sit facing each other at a small cafe table, leaning in with their hands apart. Blurred passers-by cross the foreground. Long lens. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e12',
    '7,2',
    'Shared Shelter',
    'A hallway coat rack now carries two very different jackets. Outside, a storm has blown wet leaves against the door.',
    'Question what home means',
    'Recognize a shared decision',
    'Two coats are not proof of marriage, nor proof of captivity. They are evidence of repeated returns.',
    'The shape of the life you left behind is growing less like a thing you can simply pick up.',
    'A worn grey cardigan and a bright yellow raincoat hang on two hooks beside an apartment front door. Wet autumn leaves are pressed against the frosted glass of the door. Grey daylight. Medium shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e13',
    '1,6',
    'The Names Not Written',
    'In the archive’s reflection, Morrow is leaving a card face down beside a repaired photograph. Only the blank reverse shows.',
    'Refuse to guess the words',
    'Keep the unfinished record',
    'A name belongs to its speaker. You refuse the temptation to reveal this one by force.',
    'Some truths need consent more than discovery. The card stays face down.',
    'A photograph restoration desk with a repaired black-and-white photograph under a lamp. A hand lays a plain blank index slip face down beside it. A glass cabinet behind reflects tall archive shelves. Close shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e13',
    '6,3',
    'The Future Rehearsal',
    'An emergency contact sheet rests under a glass of water. One square has been obscured by a thumb.',
    'Consider who might need protection',
    'Guard the obscured square',
    'You cannot decide that someone is lying merely because they protect a piece of their life.',
    'Your certainty was once a defense. You learn to let a blank space stay blank.',
    'A sheet of paperwork lies under a glass of water on a kitchen table, and a thumb presses down on one corner of the sheet. Soft indirect window light, shallow focus. Close-up. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e14',
    '2,1',
    'The Possible Address',
    'A moving label sticks to a stack of boxes. The destination has been scratched out and written again.',
    'Question whose move this is',
    'Allow the address to change',
    'Plans made in one future are not binding on every other reality.',
    'You once imagined returning home as a single coordinate. The world may demand a conversation instead.',
    'A stack of cardboard moving boxes in an apartment hallway. The paper sticker on the top box has an address scratched out and written again, slightly out of focus. Daylight from an open door. Medium shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e14',
    '7,7',
    'An Invitation Not Opened',
    'A sealed envelope lies beside an ordinary photograph of a garden. The invitation’s recipient is hidden by a folded corner.',
    'Leave the envelope closed',
    'Honor the uncertainty',
    'The urge to tear it open is partly fear. Someone else may have chosen when and how to share this news.',
    'You put your hands down. Knowing is not always the same as earning a right to know.',
    'A sealed cream envelope with one folded corner rests on a wooden mantelpiece beside a small out-of-focus photograph of a sunny garden propped against the wall. Warm lamplight. Close shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e15',
    '1,4',
    'The Small Shoes',
    'A pair of little shoes appears in the background of an otherwise ordinary thrift-store photograph. No owner is visible.',
    'Avoid a conclusion',
    'Admit the possibility',
    'There are countless reasons for small shoes to stand on a shelf. You need more than this to accuse or celebrate.',
    'A possibility strikes you hard enough to make you afraid of your own next demand.',
    "A thrift store aisle with racks of secondhand coats. In the foreground an adult customer browses a coat rack, and on a low shelf in the far background sits a pair of small child's shoes. Fluorescent store light. Medium-wide shot. Candid 35mm colour photograph, natural light, soft film grain.",
  ],
  [
    'e15',
    '8,2',
    'The Unfinished Sentence',
    'Morrow is laughing at something outside the image. A hand, too small or too distant to identify, rests near the edge.',
    'Ask who photographed this',
    'Keep the person outside the frame safe',
    'The camera has made a story feel certain without showing its crucial witness.',
    'You have reached the limits of what evidence alone can settle. The next step must involve living people.',
    'an androgynous adult in their thirties with short dark hair and a grey cardigan stands in a sunny apartment doorway laughing at someone off to the right. Out of focus at the side, a hand rests on the doorpost. Bright morning light. Medium shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e16',
    '3,5',
    'The People You Did Not Meet',
    'Morrow stands with the family he has built, including children who know your stolen face as the person who stayed.',
    'Ask who knows the truth',
    'Recognize the children as people',
    'The photograph cannot answer whether the adults told the children about the exchange. You must ask before deciding.',
    'No route home grants you permission to erase children or the love they remember.',
    'A warm family kitchen in the evening, where an androgynous adult in their thirties with short dark hair and a grey cardigan sits at the table helping two children, a boy and a girl, with crayons and drawings. Pendant lamp light. Medium shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
  [
    'e16',
    '8,6',
    'A Door with More Than One Key',
    'The final photograph is a family at a threshold, waiting for a decision that does not belong to any one of them.',
    'Invite each person to speak',
    'Keep the door open without a promise',
    'Consent cannot be inferred from a smiling picture. Everyone affected deserves a voice in what follows.',
    'You can reclaim a right without pretending others have no rights. The photograph records the question, not the answer.',
    'A family stands at an open apartment front door in the evening: an androgynous adult in their thirties with short dark hair and a grey cardigan, a second adult and two children, each looking at a different person in the group. Beyond the door, the hallway carpet turns into green forest moss. Warm hallway light. Medium-wide shot. Candid 35mm colour photograph, natural light, soft film grain.',
  ],
]

export const EARTH_PHOTOS: readonly EarthPhoto[] = AUTHOR_PHOTOS.map(
  (
    [
      experience,
      site,
      title,
      caption,
      challenge,
      hold,
      challengeReflection,
      holdReflection,
      artPrompt,
    ],
    index,
  ) => {
    const order = index + 1
    const id = `earth-${String(order).padStart(2, '0')}`
    const artPath =
      order === 1
        ? '/images/memory-dungeon/earth-photographs/dismissal.webp'
        : order === 2
          ? '/images/memory-dungeon/earth-photographs/gathering.webp'
          : `/images/memory-dungeon/earth-photographs/${id}.webp`
    return {
      id,
      experience,
      site,
      order,
      title,
      caption,
      challenge,
      hold,
      challengeReflection,
      holdReflection,
      artPrompt,
      artPath,
    }
  },
)

export const BRIAR_EARTH_PHOTOS = EARTH_PHOTOS.slice(0, 2).map((photo) => ({
  key: photo.site,
  order: photo.order,
  title: photo.title,
  caption: photo.caption,
  artPrompt: photo.artPrompt,
  artPath: photo.artPath,
}))

/** Retained for existing world/scene consumers and earlier saves. */
export function firstWorldPhotoChronicle(
  sceneChoices: Readonly<Record<string, string>>,
) {
  return BRIAR_EARTH_PHOTOS.filter((photo) =>
    earnedPhotoAtScene('e01', photo.key, sceneChoices[photo.key]),
  ).sort((a, b) => a.order - b.order)
}

export interface EarthChronicle {
  version: 1
  found: string[]
  responses: Record<string, PhotoResponse>
}
export function newEarthChronicle(): EarthChronicle {
  return { version: 1, found: [], responses: {} }
}
const KNOWN_PHOTOS = new Map(EARTH_PHOTOS.map((photo) => [photo.id, photo]))
/** Only currently implemented realities may mint a collectible photo. */
const PLAYABLE = new Set<ExperienceId>(['e01', 'e02'])
const PLAYABLE_SCENE_CHOICES: Record<
  'e01' | 'e02',
  Record<string, readonly string[]>
> = {
  e01: {
    '2,5': ['archive', 'grieve'],
    '8,6': ['record', 'promise'],
  },
  e02: {
    '2,5': ['question', 'preserve'],
    '5,4': ['draw', 'release'],
  },
}

function earnedPhotoAtScene(
  experience: 'e01' | 'e02',
  site: string,
  choice: string | undefined,
): boolean {
  return (
    typeof choice === 'string' &&
    Boolean(PLAYABLE_SCENE_CHOICES[experience][site]?.includes(choice))
  )
}

export function restoreEarthChronicle(value: unknown): EarthChronicle {
  if (!value || typeof value !== 'object') return newEarthChronicle()
  const saved = value as Partial<EarthChronicle>
  if (saved.version !== 1) return newEarthChronicle()
  const found = Array.isArray(saved.found)
    ? [
        ...new Set(
          saved.found.filter(
            (id): id is string =>
              typeof id === 'string' &&
              PLAYABLE.has(KNOWN_PHOTOS.get(id)?.experience as ExperienceId),
          ),
        ),
      ].sort(
        (a, b) =>
          (KNOWN_PHOTOS.get(a)?.order ?? 0) - (KNOWN_PHOTOS.get(b)?.order ?? 0),
      )
    : []
  const responses: Record<string, PhotoResponse> = {}
  if (saved.responses && typeof saved.responses === 'object') {
    for (const id of found) {
      const response = saved.responses[id]
      if (response === 'challenge' || response === 'hold')
        responses[id] = response
    }
  }
  return { version: 1, found, responses }
}

/** Reconcile older Briar scene saves, without duplicating evidence or guessing undiscovered photos. */
export function reconcileEarthChronicle(
  original: EarthChronicle,
  scenes: {
    e01: Readonly<Record<string, string>>
    e02: Readonly<Record<string, string>>
  },
): EarthChronicle {
  const found = new Set(original.found)
  for (const photo of EARTH_PHOTOS) {
    if (
      (photo.experience === 'e01' || photo.experience === 'e02') &&
      earnedPhotoAtScene(
        photo.experience,
        photo.site,
        scenes[photo.experience][photo.site],
      )
    ) {
      found.add(photo.id)
    }
  }
  if (found.size === original.found.length) return original
  return {
    ...original,
    found: [...found].sort(
      (a, b) => KNOWN_PHOTOS.get(a)!.order - KNOWN_PHOTOS.get(b)!.order,
    ),
  }
}

export function respondToEarthPhoto(
  chronicle: EarthChronicle,
  id: string,
  response: PhotoResponse,
): EarthChronicle {
  if (
    !chronicle.found.includes(id) ||
    chronicle.responses[id] ||
    !KNOWN_PHOTOS.has(id) ||
    (response !== 'challenge' && response !== 'hold')
  )
    return chronicle
  return { ...chronicle, responses: { ...chronicle.responses, [id]: response } }
}

export function recoveredEarthPhotos(chronicle: EarthChronicle): EarthPhoto[] {
  return chronicle.found
    .map((id) => KNOWN_PHOTOS.get(id))
    .filter(
      (photo): photo is EarthPhoto =>
        Boolean(photo) && PLAYABLE.has(photo!.experience),
    )
    .sort((a, b) => a.order - b.order)
}

export interface EarthPhotoReappraisal {
  title: string
  evidence: string
  reflection: string
}

type ResponsePair = `${PhotoResponse}:${PhotoResponse}`
const PHOTO_REAPPRAISALS: ReadonlyArray<{
  photos: readonly [string, string]
  title: string
  evidence: string
  reflections: Record<ResponsePair, string>
}> = [
  {
    photos: ['earth-01', 'earth-03'],
    title: 'Two frames, one doorway',
    evidence:
      'The first print showed Morrow leaving with a box. The second catches an offered hand. Neither image proves whether the job was lost or whether the offer was accepted.',
    reflections: {
      'challenge:challenge':
        'You questioned the dismissal and the helping hand. Two questions remain, but you can no longer call the exit an abandonment without asking the people at the door.',
      'challenge:hold':
        'You doubted the first verdict, then chose to keep both prints. You refuse to turn a possible kindness into a tidy acquittal for the stolen life.',
      'hold:challenge':
        'You kept your anger and then sought the person reaching out. Someone may have helped Morrow while your career collapsed. Both things can be true.',
      'hold:hold':
        'You kept the hurt and the contradictory print. The offered hand does not undo what you lost; your first judgment no longer gets the only place in the record.',
    },
  },
  {
    photos: ['earth-02', 'earth-04'],
    title: 'A hurt and an unfinished apology',
    evidence:
      'The gathering shows a friend in pain. The later photograph holds an unsent apology beside an empty chair. Nothing identifies the letter’s intended recipient or proves reconciliation.',
    reflections: {
      'challenge:challenge':
        'You looked beyond the gathering and asked if the apology was delivered. The photographs answer neither question. You owe the friend an inquiry, not an invented happy ending.',
      'challenge:hold':
        'You searched the gathering’s edges, then stayed with the empty chair. Someone may have tried to repair a hurt; the person who was hurt still decides what repair means.',
      'hold:challenge':
        'You acknowledged the humiliation and questioned the unsent reply. An apology drafted in your handwriting cannot speak for the friend or certify forgiveness.',
      'hold:hold':
        'You kept the friend’s pain and the vacant chair in view. Even a sincere apology could be refused. You leave room for that refusal without erasing the effort.',
    },
  },
  {
    photos: ['earth-01', 'earth-02'],
    title: 'Two wounds, no verdict',
    evidence:
      'The office exit shows a lost foothold; the gathering shows a friend hurt in your presence. Neither frame proves what Morrow intended or what happened next.',
    reflections: {
      'challenge:challenge':
        'You questioned the dismissal and searched beyond the gathering. Both pictures demand witnesses. You can pursue the truth without deciding in advance that Morrow is innocent.',
      'challenge:hold':
        'You doubted the office verdict but acknowledged the friend’s humiliation. A lost job may have a second story; the hurt person still deserves an account of what happened.',
      'hold:challenge':
        'You kept your anger about the office and searched the edges of the gathering. You are allowed to grieve what was taken without treating every stranger in the frame as an enemy.',
      'hold:hold':
        'You held on to the career loss and the friend’s pain. Neither photograph grants you the full story, and neither injury becomes less real because the other exists.',
    },
  },
]

type FourPhotoResponses = `${PhotoResponse}:${PhotoResponse}:${PhotoResponse}:${PhotoResponse}`
const FOUR_FRAME_IDS = ['earth-01', 'earth-02', 'earth-03', 'earth-04'] as const
const FOUR_FRAME_REFLECTIONS: Record<FourPhotoResponses, string> = {
  'challenge:challenge:challenge:challenge':
    'You questioned both first impressions, then sought the person at the doorway and the fate of the apology. The investigation now needs living witnesses; pressing them may reopen wounds they never agreed to share.',
  'challenge:challenge:challenge:hold':
    'You challenged the first two pictures and pursued the offered hand, but left the empty chair unanswered. You can seek the helper without demanding the injured friend recount a private hurt.',
  'challenge:challenge:hold:challenge':
    'You questioned the dismissal and the gathering, kept both doorway prints, and asked if the apology was delivered. The letter may have reached no one; finding out risks turning another person’s pain into evidence for your case.',
  'challenge:challenge:hold:hold':
    'You refused both early verdicts and preserved both later contradictions. The record is honest but incomplete; choosing not to interrogate either witness means living with unanswered questions.',
  'challenge:hold:challenge:challenge':
    'You doubted the office verdict while naming the harm at the gathering. You now seek both the helping hand and the apology’s recipient; neither witness owes you forgiveness on Morrow’s behalf.',
  'challenge:hold:challenge:hold':
    'You questioned the job loss, acknowledged the friend’s injury, and followed the hand at the doorway. You leave the apology unresolved, accepting that the friend’s privacy may matter more than a clean explanation.',
  'challenge:hold:hold:challenge':
    'You held both office prints without dismissing the gathering’s hurt, then asked whether an apology was delivered. Pursuing that answer may bring accountability, but it cannot make the friend accept it.',
  'challenge:hold:hold:hold':
    'You doubted the office verdict but did not dilute the friend’s pain. Both later images remain beside the first two; you preserve the contradictions at the cost of leaving their witnesses unheard.',
  'hold:challenge:challenge:challenge':
    'You kept your anger about the lost work while searching the gathering’s edges. The offered hand and unsent apology now invite two inquiries, neither of which can return your stolen life or compel a friend to speak.',
  'hold:challenge:challenge:hold':
    'You grieved the career and looked beyond the gathering, then sought the person offering help. You do not chase the apology’s recipient; the cost is uncertainty about whether repair was ever attempted.',
  'hold:challenge:hold:challenge':
    'You held the career loss, questioned the gathering, and preserved both office prints. You ask whether the apology was sent, knowing that the answer may expose a friend who wanted to be left alone.',
  'hold:challenge:hold:hold':
    'You kept the office hurt and searched for the gathering’s missing context, but declined to turn either later image into a verdict. The unanswered questions remain yours to carry, not the witnesses’ obligation to solve.',
  'hold:hold:challenge:challenge':
    'You acknowledged both injuries and still sought the helping hand and the apology’s fate. The new evidence can complicate blame without excusing the exchange; your search risks asking injured people to relive it.',
  'hold:hold:challenge:hold':
    'You kept both first wounds visible and asked who offered Morrow help. The unsent apology stays beside the empty chair; you protect the friend’s silence even though it denies you a simpler judgment.',
  'hold:hold:hold:challenge':
    'You held on to the career loss and the friend’s humiliation, preserved both doorway prints, and asked whether the apology was delivered. An answer might establish an effort, never the friend’s consent to forgive.',
  'hold:hold:hold:hold':
    'You kept the two original harms and both contradictory images without replacing one story with another. The price of this restraint is an unfinished account; nobody’s silence becomes proof of innocence or guilt.',
}

function fourFrameSynthesis(
  chronicle: EarthChronicle,
): EarthPhotoReappraisal | null {
  if (
    !FOUR_FRAME_IDS.every(
      (id) =>
        chronicle.found.includes(id) &&
        (chronicle.responses[id] === 'challenge' ||
          chronicle.responses[id] === 'hold'),
    )
  )
    return null
  const key = FOUR_FRAME_IDS.map((id) => chronicle.responses[id]).join(
    ':',
  ) as FourPhotoResponses
  return {
    title: 'Four frames, no borrowed verdict',
    evidence:
      'The office doorway and injured friend each have a second photograph. An offered hand cannot prove a job was saved; an unsent apology cannot establish forgiveness. All four prints belong in the same record.',
    reflection: FOUR_FRAME_REFLECTIONS[key],
  }
}

export function earthPhotoReappraisals(
  chronicle: EarthChronicle,
  photoId: string,
): EarthPhotoReappraisal[] {
  const earned = [...PHOTO_REAPPRAISALS]
    .reverse()
    .filter(
      ({ photos }) =>
        photos.includes(photoId) &&
        photos.every(
          (id) =>
            chronicle.found.includes(id) &&
            (chronicle.responses[id] === 'challenge' ||
              chronicle.responses[id] === 'hold'),
        ),
    )
    .map((pair) => {
      const first = chronicle.responses[pair.photos[0]]!
      const second = chronicle.responses[pair.photos[1]]!
      return {
        title: pair.title,
        evidence: pair.evidence,
        reflection: pair.reflections[`${first}:${second}`],
      }
    })
  if (FOUR_FRAME_IDS.includes(photoId as (typeof FOUR_FRAME_IDS)[number])) {
    const synthesis = fourFrameSynthesis(chronicle)
    if (synthesis) earned.push(synthesis)
  }
  return earned
}

/** Preserve the most recent comparison for existing single-result consumers. */
export function earthPhotoReappraisal(
  chronicle: EarthChronicle,
  photoId: string,
): EarthPhotoReappraisal | null {
  const available = earthPhotoReappraisals(chronicle, photoId)
  return available[available.length - 1] ?? null
}

export function validateEarthPhotoManifest(): string[] {
  const problems: string[] = []
  if (EARTH_PHOTOS.length !== 32) problems.push('Expected 32 fixed photographs')
  if (
    new Set(EARTH_PHOTOS.map((photo) => photo.id)).size !== EARTH_PHOTOS.length
  )
    problems.push('Duplicate photograph ID')
  for (let number = 1; number <= 16; number++) {
    const experience = `e${String(number).padStart(2, '0')}`
    if (
      EARTH_PHOTOS.filter((photo) => photo.experience === experience).length !==
      2
    )
      problems.push(`Expected exactly two Earth photographs for ${experience}`)
  }
  for (const photo of EARTH_PHOTOS) {
    if (
      !photo.caption ||
      !photo.artPrompt ||
      !photo.challengeReflection ||
      !photo.holdReflection
    )
      problems.push(`Missing content for ${photo.id}`)
  }
  return problems
}
