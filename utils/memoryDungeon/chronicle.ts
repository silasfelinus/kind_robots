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
    'Contemporary rain-soaked research office exit, androgynous adult Morrow wearing protagonist’s Earth body, carrying carton, unseen photographer viewpoint, subtle documentary realism',
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
    'Small Earth apartment gathering, conflicted friends, one embarrassed familiar adult, off-center photograph with ambiguous body language, no legible text',
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
    'Pair of documentary contact prints of an Earth research office, person offering to help another carrying a box, dark fairytale reflected edge',
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
    'Late-night Earth cafe table with two cups and empty chair, blurred envelope reversed on table, rain on window, no readable lettering',
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
    'Urban subway fare machine in contemporary Earth station, baffled androgynous adult receiving patient instruction, observational street photograph',
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
    'Contemporary desk with hand raised above mundane papers and inert glass of water, no magical glow, documentary realism',
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
    'Modern intersection invaded by luminous impossible rain, pharmacy awning, diverse adults shepherding neighbors, urgent photojournalism',
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
    'Earth science lab turned emergency shelter during uncanny magical storm, visible supplies and handwritten but illegible board',
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
    'Contemporary Earth desk, postcard, carefully folded transit guide and pen, uncanny twin-fold symmetry, no legible text',
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
    'Government service office waiting area with numbered tickets, androgynous adult beside patient elder, candid photo',
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
    'Earth laboratory notebook, colleague gesturing to practical diagram, thoughtful androgynous researcher, unstaged photo',
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
    'Earth shared office workspace, circled failed experiment and hand-written correction without legible words, candid human moment',
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
    'Earth night-shift break room, warm bakery bag passed among tired adult colleagues, documentary image',
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
    'Late-night modern apartment desk, mobile phone, scratched-out note, solitary adult reflection, intimate photography',
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
    'Contemporary apartment staircase, friends lifting secondhand table toward welcoming open doorway, everyday urban life',
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
    'Modern modest apartment dining table with uneven thrift-store plates, warm lamplight, no visible guests',
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
    'Candid group portrait of diverse Earth lab colleagues, androgynous adult researcher among equals, no legible signs',
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
    'Community noticeboard and hands pinning volunteer hours after work, modern Earth corridor, legible text avoided',
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
    'Small warm Earth apartment party with imperfect cake, friends including earlier embarrassed adult, careful ambiguous distance',
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
    'Two adults in quiet evening commuter train, hands near each other, city dusk on windows, candid shallow depth',
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
    'Contemporary apartment doorway with grocery bags and spare key between two consenting adults, unposed photo',
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
    'Used kitchen sink and two mugs in shared apartment, clipped indistinct drawing on fridge edge, mundane warm light',
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
    'Two adults in daylight park cafe at distance, serious conversation, blurred public background, documentary photography',
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
    'Two distinct adult jackets on entryway hooks inside contemporary apartment during rain, realistic everyday snapshot',
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
    'Modern photograph repair desk overlapping fairytale archive, mysterious face-down plain index card, hands visible',
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
    'Earth emergency paperwork under drinking glass, hand protecting blurred private line, soft indirect light, no readable text',
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
    'Cardboard moving boxes in present-day apartment hall, overwritten blurred address label, real-life detail',
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
    'Sealed cream envelope with folded corner and out-of-focus sunny garden photo, adult Earth home mantelpiece',
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
    'Thrift store shelf with small secondhand shoes in the distant background, adult customer foreground, subtle candid framing',
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
    'Contemporary sunny Earth domestic doorway, laughing androgynous adult, ambiguous hand at blurred edge, no child identifiable',
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
    'Sensitive contemporary family documentary photograph, androgynous parent and two children in safe everyday home, warm unposed scene',
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
    'Contemporary family doorway overlapping gentle fairytale portal, adults and children with individual agency, respectful hopeful uncertain tableau',
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
  artPath: photo.artPath,
}))

/** Retained for existing world/scene consumers and earlier saves. */
export function firstWorldPhotoChronicle(
  sceneChoices: Readonly<Record<string, string>>,
) {
  return BRIAR_EARTH_PHOTOS.filter((photo) =>
    Boolean(sceneChoices[photo.key]),
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
      PLAYABLE.has(photo.experience) &&
      Boolean(scenes[photo.experience as 'e01' | 'e02'][photo.site])
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
