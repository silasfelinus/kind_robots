import type { TrialResult } from './authoredBosses'
import { PREMADE_CHARACTERS } from './characters'
import type { JourneyStateV6 } from './deckV6'
import type { AuthoredEndingV6 } from './endingsV6'
import { authoredEndingV7 } from './endingsV7'

// zuzu-shifting-lands/t-053 (Silas, 2026-11-12 PT): "We might as well have
// custom endings for each character. Great thing for the scrapbook."
//
// Each premade on a personal road ends on one of its own three endings:
// - dark, when its thread holds a dark turn the road never undid;
// - hopeful, when it carried at least three of its own good turns;
// - bittersweet otherwise.
// The ending keeps the road's own memory (the deed, the trial, the bargains
// and any moral constellation the shared ending would add) between the
// traveler's own opening and closing lines. Achievements still read the
// shared ending (journeyDeeds.ts), so nothing earned changes.

type Phase = 'complete' | 'fallen' | 'retired'
export type PersonalTone = 'hopeful' | 'bittersweet' | 'dark'
export const PERSONAL_TONES: readonly PersonalTone[] = [
  'hopeful',
  'bittersweet',
  'dark',
]

export type PersonalEndingCopy = {
  id: string
  tone: PersonalTone
  title: string
  path: string
  opening: string
} & Record<Phase, string>

type PersonalRoad = {
  characterId: string
  hopeful: readonly string[]
  dark: readonly string[]
  redeems: readonly string[]
  endings: Record<PersonalTone, PersonalEndingCopy>
}

const HOPEFUL_AT = 3

const ROADS: readonly PersonalRoad[] = [
  {
    characterId: 'zuzu',
    hopeful: [
      'zuzu-home-given',
      'zuzu-gave-the-blade',
      'zuzu-taught-the-fold',
      'zuzu-refused-the-voice',
      'zuzu-closed-the-snow-door',
      'zuzu-sang-for-the-dead',
      'zuzu-bowed-to-the-sentry',
      'zuzu-stood-surety',
    ],
    dark: ['zuzu-took-the-snow-road'],
    redeems: [],
    endings: {
      hopeful: {
        id: 'zuzu-a-peg-by-another-door',
        tone: 'hopeful',
        title: "A Peg by Someone Else's Door",
        path: 'Home found where you stopped walking',
        opening:
          'There is a wooden peg beside a door in a land nobody in your country has heard of, and your straw hat hangs on it. You never decided to stay. You only kept finding work for your hands among people who needed it done, until one evening someone set a bowl in front of you without asking.',
        complete:
          'Beyond the Verge you build nothing grand: a fence, a well cover, a bench by the road where travelers can sit. You still bow to the dead in the old way. The children who grow up near you bow too, without knowing why, and that is how your country arrives in this one, a little at a time.',
        fallen:
          'You fall on the road with no country under you but this one. The people you walked beside bury you the way you buried their dead, hat off, with a song nobody here knows the words to. They hum it anyway. It is close enough.',
        retired:
          'You stop before the last gate and do not regret it. The hat stays on its peg through the long season. When the road calls, you walk a little way down it and come back, and each time the door is open before you knock.',
      },
      bittersweet: {
        id: 'zuzu-two-countries-no-map',
        tone: 'bittersweet',
        title: 'Two Countries, No Map',
        path: 'An old code kept on a road that never shared it',
        opening:
          'You carry two countries now and live in neither. One is behind a door you chose not to open. The other is the road under your feet, which shifts every night and has never once asked who you were before.',
        complete:
          'You cross the Verge and keep walking. Some nights you dream in your own language and wake to find a word of it gone. You bow to the dead anyway. The code holds even when the words go, and it is the only map you have.',
        fallen:
          'The road takes you before you decide where home is. A traveler finds your hat beside the trail and wears it to the next town, where nobody knows what it means. It keeps the sun off her face. That is something.',
        retired:
          'You stop walking at a crossroads that belongs to no one. Travelers who pass get water and a bow, and no story. You keep the story. It is all that is left of the road from Edo, and you do not spend it lightly.',
      },
      dark: {
        id: 'zuzu-the-road-home-collects',
        tone: 'dark',
        title: 'The Road Home Collects',
        path: 'Home, bought at a price someone small paid',
        opening:
          'The bridge in the snow was real, and so was the gate beyond it. You crossed, as you knew you would the moment you saw it, and the bell that has no clapper rang you in.',
        complete:
          'Your country is exactly as you left it, and nobody in it remembers you. Your teacher’s gate opens on strangers who bow politely and ask where you are from. On the far side of the seam the price was paid by someone small. You were not asked to watch. The bell rings every evening, and it is not the bell you remember.',
        fallen:
          'You do not survive the crossing, or you survive it as something else. Travelers at the last threshold still feel the cold seam in the rock. On the worst nights they hear an evening bell on the far side, and a voice in a language none of them know, asking for one small thing.',
        retired:
          'You stop before the last gate with the seam still open behind you. You know the way back to it with your eyes shut. Every evening you stand facing it and listen for a bell, and the children nearby learn not to walk past you at that hour.',
      },
    },
  },
  {
    characterId: 'jeffery-mittens',
    hopeful: [
      'jeffery-crew-fed',
      'jeffery-vouched-at-the-seep',
      'jeffery-told-hollis',
      'jeffery-barefoot-shod',
      'jeffery-barefoot-taught',
      'jeffery-barefoot-watched',
      'jeffery-crew-turned',
      'jeffery-gave-from-the-string',
      'jeffery-taught-the-hiding-place',
    ],
    dark: ['jeffery-crew-rejoined'],
    redeems: ['jeffery-crew-turned'],
    endings: {
      hopeful: {
        id: 'jeffery-quartermaster-of-the-long-table',
        tone: 'hopeful',
        title: 'Quartermaster of the Long Table',
        path: 'Every child shod, and nobody’s scout',
        opening:
          'You still wear a string round your neck, but there are no boots on it now, only a knot for every child who has a pair. There are a lot of knots. You lost count somewhere past the canyon and started again.',
        complete:
          'Beyond the Verge the barefoot line becomes a long table with a roof over it, and you are its quartermaster in a coat that finally fits. Hollis’s crew sells water at a fair price down the road and sends its kits to eat at your table on bad days. Nobody strips the dead for boots anymore. There are cobblers now, and you know every one of them by name.',
        fallen:
          'You do not make it to the end of the road. The children you shod carry you the last mile anyway, taking turns, and bury you with your boots on, because you would have hated it any other way. The oldest girl takes the string.',
        retired:
          'You stop walking when the smallest child stops needing to be carried. The barefoot line settles where you stopped: a camp with a fire and a pile of boots by the door, sorted by size. Everybody who passes gets a pair that fits. You check.',
      },
      bittersweet: {
        id: 'jeffery-one-pair-short',
        tone: 'bittersweet',
        title: 'One Pair Short',
        path: 'Quartermaster to children you could not keep',
        opening:
          'You did what you could with a string of boots and two black paws, and it was never quite enough. There was always one more child with bare feet than there were pairs to go round.',
        complete:
          'You cross the Verge alone with one small boot still on the string, its partner lost somewhere in the Tablelands. The crew went one way and the barefoot line another, and you took the long way between them, carrying word. You hang the last boot on the gate. Someone will need it.',
        fallen:
          'The road takes you somewhere between the crew and the children, and neither hears for a long time. When the oldest girl finds out, she ties a rag round her arm the way you did and keeps the line moving.',
        retired:
          'You turn back toward Hollow Bell and hang the last boots on its arch, under the sign that has been painted over so many times. People who pass take a pair if they need one. You come by every spring to count how many are gone.',
      },
      dark: {
        id: 'jeffery-hollis-best-scout',
        tone: 'dark',
        title: 'Hollis’s Best Scout',
        path: 'Fed, armed, and on the wrong side of the fence',
        opening:
          'You eat every day now. You have a rifle you are tall enough to hold, a post on the wall, and a coat that fits because you took it off someone who did not need it anymore. Hollis says you are the best scout she ever had.',
        complete:
          'Beyond the Verge the crew holds the crossings, and you are the one who decides which wagons are worth stopping. You are good at it. Sometimes a barefoot child comes up the road and looks at the boots on your feet, and you look back until they leave. You used to know what that was like. You remember it the way you remember a fever.',
        fallen:
          'You fall on a raid that was supposed to be easy. The crew takes your boots before they bury you, because that is what the crew does, and you taught half of them how. Somewhere a barefoot kit gets a pair too big for him, and grows into them.',
        retired:
          'You leave the crew with a full pack and nobody to bring it to; the barefoot line scattered while you were on the wall. You walk back to Hollow Bell and sit under the arch where you once gave your name, and nobody comes to ask it.',
      },
    },
  },
  {
    characterId: 'fennec-siblings',
    hopeful: [
      'ling-kept-him-close',
      'ling-crossed-the-ford',
      'ling-out-talked-the-ferryman',
      'ling-broke-the-fever',
      'ling-refused-the-voice',
      'ling-bao-shared-his-bowl',
      'ling-fed-him-without-an-oath',
      'ling-held-him-up-to-the-counter',
    ],
    dark: ['ling-followed-the-voice'],
    redeems: [],
    endings: {
      hopeful: {
        id: 'ling-two-bowls-both-full',
        tone: 'hopeful',
        title: 'Two Bowls, Both Full',
        path: 'A little brother who stops guarding his bowl',
        opening:
          'There is a day, somewhere past the canyons, when Bao sets his bowl down half full and wanders off to look at a beetle. Nobody takes it. He does not run back. You watch the bowl for a long time, and then you eat your own supper first, all of it, for the first time since the fire.',
        complete:
          'Beyond the Verge you find a town with a school, a door you can lock from the inside, and a baker who gives the heels away to children. You go back to school, older than everyone in your class and taller than the teacher. Bao starts two years later and tells everyone his sister carried him across the whole world. He is not wrong.',
        fallen:
          'You do not reach the end of the road. Bao does: carried, then walking, by people who learned from watching you how a child is kept. He grows up never once guarding his bowl, and tells his own children about a sister who fed him first, every time. They think it is a story.',
        retired:
          'You stop at the first place where the bread is honest and the doors lock from the inside, and you stay. Bao grows round and loud and fearless. Some nights you still wake and count him. He is always there.',
      },
      bittersweet: {
        id: 'ling-ten-years-old-twice',
        tone: 'bittersweet',
        title: 'Ten Years Old, Twice Over',
        path: 'A childhood spent keeping someone else’s',
        opening:
          'You kept him fed. Every day, every road, every bargain, you fed him first and ate what was left, and he grew, and you got thinner, and somewhere along the way you stopped being ten and became whatever a person is who does that.',
        complete:
          'Beyond the Verge Bao runs ahead of you into a town that will look after him, and he does not look back, because you taught him he never had to. You stand at its edge a long time with empty arms. Then you go in. Someone asks how old you are, and you have to think about it.',
        fallen:
          'The road takes you on a cold night, with Bao asleep and warm against you because you gave him the blanket. A family on the road finds him in the morning and keeps him. He grows up remembering his sister only as a warmth, a counting song, and the feeling of being carried.',
        retired:
          'You stop walking because he needs to stop, not because you do. You find work, too young, and a room, too small, and you keep him fed. He goes to school. You walk him there every morning and stand outside the window until the bell, and then you go to work.',
      },
      dark: {
        id: 'ling-the-table-under-the-hill',
        tone: 'dark',
        title: 'The Table Under the Hill',
        path: 'Fed, at a price nobody named',
        opening:
          'You went down to the table under the hill, and it fed you, and it never asked for anything. That was how you knew, later, that it had already taken what it wanted. Bao is fine. Bao is always fine. Bao is never hungry anymore, even when there is no food at all.',
        complete:
          'Beyond the Verge you settle where the bread is free and nobody asks where you came from. Bao grows tall and quiet, and does not like the sun. Some nights his bed is empty and you follow the smell of baking to a crack in the cellar wall and carry him back up, and in the morning he does not remember. You keep carrying him. You always will.',
        fallen:
          'The road takes you, and Bao goes on alone, untroubled, toward a smell of bread nobody else can smell. Travelers who meet a small fennec boy on the black road say he is polite and well fed, and that he asks each of them whether they are hungry.',
        retired:
          'You stop near a hill with a cave in it, because Bao will not walk any farther from it. You tell yourself he is only tired. You build a door across the cave mouth with your own hands, and every night you sit against it, and every night something on the other side is kind to you through the wood.',
      },
    },
  },
]

const roads = new Map(ROADS.map((road) => [road.characterId, road]))

export const PERSONAL_ROAD_IDS: readonly string[] = ROADS.map(
  (road) => road.characterId,
)

export function personalEndingsFor(
  characterId: string,
): readonly PersonalEndingCopy[] {
  const road = roads.get(characterId)
  return road ? PERSONAL_TONES.map((tone) => road.endings[tone]) : []
}

// The flags a traveler's thread reads: good turns, dark turns and the turns
// that undo a dark one.
export function personalThreadFlags(characterId: string): {
  hopeful: readonly string[]
  dark: readonly string[]
  redeems: readonly string[]
} | null {
  const road = roads.get(characterId)
  return road
    ? { hopeful: road.hopeful, dark: road.dark, redeems: road.redeems }
    : null
}

export const ALL_PERSONAL_ENDINGS: readonly PersonalEndingCopy[] =
  ROADS.flatMap((road) => personalEndingsFor(road.characterId))

// Which of a traveler's endings their road has earned so far.
export function personalTone(
  characterId: string,
  flags: readonly string[],
): PersonalTone | null {
  const road = roads.get(characterId)
  if (!road) return null
  const held = (flag: string) => flags.includes(flag)
  if (road.dark.some(held) && !road.redeems.some(held)) return 'dark'
  if (road.hopeful.filter(held).length >= HOPEFUL_AT) return 'hopeful'
  return 'bittersweet'
}

// Painted plates that have shipped under public/shifting-lands/endings/.
// Until an ending is listed here, the reader shows the traveler's portrait.
export const SHIPPED_PERSONAL_ENDING_PLATES: ReadonlySet<string> = new Set()
export const personalEndingPlatePath = (endingId: string): string =>
  `/shifting-lands/endings/${endingId}.webp`
export const personalEndingPlate = (endingId: string): string | null =>
  SHIPPED_PERSONAL_ENDING_PLATES.has(endingId)
    ? personalEndingPlatePath(endingId)
    : null

export type PersonalEnding = AuthoredEndingV6 & {
  personal: { characterId: string; endingId: string; tone: PersonalTone }
}

export function personalEndingV10(
  characterId: string,
  state: JourneyStateV6,
  trials: readonly TrialResult[],
): PersonalEnding | null {
  const shared = authoredEndingV7(state, trials)
  const tone = personalTone(characterId, state.flags)
  const phase = state.journey.phase
  if (!shared || !tone) return null
  if (phase !== 'complete' && phase !== 'fallen' && phase !== 'retired')
    return null
  const copy = roads.get(characterId)!.endings[tone]
  return {
    ...shared,
    title: copy.title,
    path: copy.path,
    // The shared opening and phase lines give way to the traveler's own; the
    // deed, the trial and any bargain or constellation the road earned stay.
    paragraphs: [copy.opening, ...shared.paragraphs.slice(2), copy[phase]],
    personal: { characterId, endingId: copy.id, tone },
  }
}

// The scrapbook's record: which of each traveler's own endings this player
// has reached, across every journey. Versioned; the store keeps it in its own
// localStorage key and components only read the pages below.
export const PERSONAL_ENDINGS_RECORD_VERSION = 1
export type PersonalEndingsRecord = {
  version: 1
  found: Record<string, string[]>
}

export const emptyPersonalEndingsRecord = (): PersonalEndingsRecord => ({
  version: PERSONAL_ENDINGS_RECORD_VERSION,
  found: {},
})

// Reads a stored record, keeping only real travelers and their real endings,
// in catalog order. Anything unreadable becomes an empty record.
export function readPersonalEndingsRecord(
  value: unknown,
): PersonalEndingsRecord {
  const record = emptyPersonalEndingsRecord()
  if (!value || typeof value !== 'object' || Array.isArray(value)) return record
  const saved = value as { version?: unknown; found?: unknown }
  if (
    saved.version !== PERSONAL_ENDINGS_RECORD_VERSION ||
    !saved.found ||
    typeof saved.found !== 'object' ||
    Array.isArray(saved.found)
  )
    return record
  const found = saved.found as Record<string, unknown>
  for (const road of ROADS) {
    const ids = Object.hasOwn(found, road.characterId)
      ? found[road.characterId]
      : null
    if (!Array.isArray(ids)) continue
    const kept = personalEndingsFor(road.characterId)
      .map((ending) => ending.id)
      .filter((id) => ids.includes(id))
    if (kept.length) record.found[road.characterId] = kept
  }
  return record
}

// The record with one more ending found; the same object when nothing is new.
export function withPersonalEnding(
  record: PersonalEndingsRecord,
  characterId: string,
  endingId: string,
): PersonalEndingsRecord {
  const catalog = personalEndingsFor(characterId).map((ending) => ending.id)
  const had = record.found[characterId] ?? []
  if (!catalog.includes(endingId) || had.includes(endingId)) return record
  return {
    ...record,
    found: {
      ...record.found,
      [characterId]: catalog.filter(
        (id) => id === endingId || had.includes(id),
      ),
    },
  }
}

export type PersonalScrapbookPage = {
  characterId: string
  name: string
  found: number
  total: number
  endings: Array<{
    id: string
    tone: PersonalTone
    title: string
    found: boolean
    plate: string | null
  }>
}

// One page per premade traveler, in roster order: X of N endings found.
export function personalScrapbook(
  record: PersonalEndingsRecord,
): PersonalScrapbookPage[] {
  return PREMADE_CHARACTERS.filter((entry) => roads.has(entry.id)).map(
    (entry) => {
      const had = record.found[entry.id] ?? []
      const endings = personalEndingsFor(entry.id).map((ending) => ({
        id: ending.id,
        tone: ending.tone,
        title: ending.title,
        found: had.includes(ending.id),
        plate: personalEndingPlate(ending.id),
      }))
      return {
        characterId: entry.id,
        name: entry.name,
        found: endings.filter((ending) => ending.found).length,
        total: endings.length,
        endings,
      }
    },
  )
}
