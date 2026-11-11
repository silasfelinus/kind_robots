import {
  HOTEL_ROOMS,
  performAction,
  travel,
  type CaseAction,
  type CaseResult,
  type CaseState,
  type HotelRoom,
  type RoomId,
} from './prologue'
import { MONSTRESS_CONVENTION } from '../playbookKit/games/monstressConvention'

export type MonstriqueAudience = 'general' | 'mature'

export const GENERAL_INTRO = [
  {
    title: 'Always Last Call',
    text: 'Midnight City. Monstrique agent Odette Harker checks into the Last Call Motor Lodge with Violet Wisp, a stage performer dressed as the legendary Draculina. They have a late-night meeting to settle a disputed booking.',
  },
  {
    title: 'A Very Bad Curtain Call',
    text: 'Violet still has her rented cape and forty-dollar costume fangs. The ice arrives. The curtains close. Downstairs the ice machine clanks twice. Then everything goes strangely quiet.',
  },
  {
    title: 'Checkout Time',
    text: 'Nobody knocks. The door never opens. A jewelled prop knife moves anyway. By morning, two figures lie beneath a sheet, and the motel has its own murder mystery.',
  },
  {
    title: 'Your New Client',
    text: 'At 3 a.m. the phone rings in Room 207. Iris Quill answers for Norb Vale, the city’s most germ-conscious investigator. The caller is Odette. She is dead, furious, and would like to hire you.',
  },
] as const

export const MATURE_INTRO = [
  {
    title: 'Always Last Call',
    text: 'Midnight City. Odette Harker, the agent who ran MONSTRIQUE and took ten percent of everyone in it, checks into Room 205 of the Last Call Motor Lodge with a professional she booked for the night.',
  },
  {
    title: 'Bite Me',
    text: 'Violet Wisp wears a rented cape and forty-dollar fangs, because Odette has wanted a vampire her whole life. Two adults, one bottle of gin, very little rehearsal. The ice arrives. The curtains close. Downstairs, the ice machine clanks twice.',
  },
  {
    title: 'Checkout Time',
    text: 'Nobody knocks. The door never opens. A jewelled knife moves anyway. By morning, Room 205 has two guests who will never check out.',
  },
  {
    title: 'Your New Client',
    text: 'At 3 a.m. the phone rings in Room 207, the field office of The Unwashed Truth. Iris Quill answers for her boss, Norb Vale, Midnight City’s premiere blogger. The caller is Odette Harker. Odette Harker is dead, and she would like to hire you.',
  },
] as const

const GENERAL_HOTSPOTS: Record<RoomId, readonly string[]> = {
  'motel-exterior': ['motel-sign', 'gavin', 'fan-camera', 'billboard'],
  'front-office': ['marta', 'guest-ledger', 'memorabilia-case'],
  'ice-alcove': ['ice-machine', 'maintenance-log', 'sewer-hatch'],
  balcony: ['room-door', 'footprints'],
  'investigators-room': ['desk', 'nico'],
  'neighbor-room': ['neighbor', 'wall-clock'],
  'odette-room': [
    'knife',
    'odette-body',
    'violet-body',
    'odette-purse',
    'ice-ring',
    'odette-ghost',
    'violet-ghost',
  ],
  'city-map': ['drive-in', 'joke-shop', 'mansion', 'sewers'],
  'convention-center': ['idol-poster', 'mummy-actress'],
}

const GENERAL_INVENTORY = new Set(['camera', 'motel-key', 'odette-purse', 'plastic-fangs'])

const GENERAL_TOPICS = new Set([
  'room-access',
  'unknown-visitor',
  'shrine',
  'knife-origin',
  'ghost-accounts',
  'ice-clank',
  'harker-files',
  'agent-deals',
  'violet-fee',
  'violet-witness',
  'missing-fangs',
  'fan-alibi',
  'idol-schedule',
  'norb-shirt',
])

const GENERAL_APPROVED_MOMENTS = new Set([
  'double-murder',
  'dead-client',
  'rental-fangs',
  'two-ghosts',
])
const GENERAL_APPROVED_CAST = new Set([
  'iris',
  'nico',
  'odette',
  'violet',
  'unknown-killer',
])
const GENERAL_APPROVED_REVEALS = new Set(['ghost-accounts'])
const GENERAL_APPROVED_ENDINGS = new Set(['lead-earned', 'reckless'])

function isGeneralRoom(id: string): id is RoomId {
  return Object.prototype.hasOwnProperty.call(GENERAL_HOTSPOTS, id)
}

const GENERAL_ROOM_205 =
  'Room 205 is quiet. Two figures lie respectfully covered beneath a sheet. A jewelled prop knife rests at the scene. In the mirror, two spectral women argue about whose fault this is.'

const GENERAL_LINES: Record<string, string> = {
  'ask:neighbor:unknown-visitor':
    'Dolores: Two women were talking about a film contract. I heard the ice arrive, a thump, and silence. Nobody used the front door afterward.',
  'ask:odette-ghost:ghost-accounts':
    'Odette: I was looking at Violet. Then the knife seemed to float on its own. Neither of us saw who moved it.',
  'ask:odette-ghost:harker-files':
    'Odette: Sixty years of disputed Monstrique contracts and rewritten credits. The Beach Hex paperwork is yours to examine.',
  'ask:odette-ghost:violet-fee':
    'Odette: I refused to pay Violet’s full performance fee. Violet: You cancelled the show by dying! Odette: Details.',
  'ask:violet-ghost:violet-fee':
    'Violet: Four hundred for a private Draculina look-alike performance, cape included. I rehearsed the costume and accent. The booking was never settled.',
  'talk:violet-ghost':
    'Violet: I was hired for a private costume performance and now I’m haunting the motel. Worst booking ever. Odette still owes me.',
  'look:odette-purse':
    'Iris: A flask, a cosmetics case and four hundred dollars in fifties. Odette: Don’t touch the cash.',
  'use:violet-ghost:odette-purse':
    'Iris counts the owed costume-performance fee. Violet: Thank you. Now I can focus on what happened at the door.',
  'look:odette-body':
    'Iris: Odette is covered carefully. We photograph the evidence, not the victims. Violet: That would be a first for this motel.',
  'look:violet-body':
    'Iris: Violet deserves the same careful investigation as her famous client.',
  'look:odette-ghost':
    'Iris: A silver-blue ghost with contracts to settle and an impossible number of grievances.',
  'look:violet-ghost':
    'Iris: Rented cape, missing costume fangs, sharp eyes. She keeps glancing at the door.',
  'use:room-door':
    'Iris: Room 205 is part of the investigation. We should document what happened there.',
}

function withGeneralLine(
  result: CaseResult,
  replacement: string | undefined,
): CaseResult {
  if (!replacement) return result
  return result.changed
    ? {
        ...result,
        line: replacement,
        state: {
          ...result.state,
          transcript: [...result.state.transcript.slice(0, -1), replacement],
        },
      }
    : { ...result, line: replacement }
}

export function roomForAudience(
  id: RoomId,
  audience: MonstriqueAudience,
): HotelRoom {
  const room = HOTEL_ROOMS[id]
  if (audience === 'mature') return room
  const approved = GENERAL_HOTSPOTS[id] ?? []
  return {
    ...room,
    caption:
      id === 'odette-room'
        ? GENERAL_ROOM_205
        : approved.length
          ? room.caption
          : 'This location is reserved for a later general-edition chapter.',
    exits: room.exits.filter(isGeneralRoom),
    hotspots: room.hotspots
      .filter((hotspot) => approved.includes(hotspot.id))
      .map((hotspot) => ({
        ...hotspot,
        verbs: hotspot.verbs.filter((verb) => verb !== 'flirt'),
      })),
  }
}

export function actionForAudience(
  state: CaseState,
  action: CaseAction,
  audience: MonstriqueAudience,
): CaseResult {
  if (audience === 'mature') return performAction(state, action)
  if (action.verb === 'combine') {
    if (
      !GENERAL_INVENTORY.has(action.item ?? '') ||
      !GENERAL_INVENTORY.has(action.target)
    )
      return {
        state,
        changed: false,
        line: 'That item combination is unavailable in the general edition.',
      }
    return performAction(state, action)
  }
  if (
    !GENERAL_HOTSPOTS[state.room]?.includes(action.target) ||
    (action.verb === 'ask' && !GENERAL_TOPICS.has(action.topic ?? ''))
  )
    return {
      state,
      changed: false,
      line: 'This interaction is not available in the general edition.',
    }
  if (action.verb === 'flirt')
    return {
      state,
      changed: false,
      line: 'Optional romance is not part of this edition.',
    }
  const result = performAction(state, action)
  const key =
    action.verb === 'ask'
      ? `ask:${action.target}:${action.topic ?? ''}`
      : action.item
        ? `use:${action.target}:${action.item}`
        : `${action.verb}:${action.target}`
  return withGeneralLine(result, GENERAL_LINES[key])
}

export function travelForAudience(
  state: CaseState,
  destination: RoomId,
  audience: MonstriqueAudience,
): CaseResult {
  if (audience === 'general' && !isGeneralRoom(destination))
    return {
      state,
      changed: false,
      line: 'This location is not yet available in the general edition.',
    }
  const result = travel(state, destination)
  return audience === 'general' && result.changed
    ? withGeneralLine(result, roomForAudience(destination, audience).caption)
    : result
}

export const MONSTRIQUE_GENERAL_SPEC = {
  ...MONSTRESS_CONVENTION,
  id: 'monstrique-general',
  route: '/play/monstrique',
  premise:
    'Investigate two mysterious deaths at a neon motel with Iris, her germophobic boss and two unusually talkative ghost witnesses.',
  cast: MONSTRESS_CONVENTION.cast
    .filter((person) => GENERAL_APPROVED_CAST.has(person.id))
    .map((person) => ({
      ...person,
      romance: undefined,
      tagline:
        person.id === 'iris'
          ? 'Resourceful assistant and photographer. The only one willing to touch the evidence.'
          : person.id === 'violet'
            ? 'A Draculina impersonator with an unpaid booking and a supernatural clue.'
            : person.tagline,
      portrait:
        person.id === 'violet'
          ? {
              brief:
                'A witty adult ghost dressed in a rented theatrical vampire cape, illustrated noir adventure portrait',
            }
          : person.portrait,
    })),
  moments: MONSTRESS_CONVENTION.moments.filter((moment) =>
    GENERAL_APPROVED_MOMENTS.has(moment.id),
  ),
  reveals: MONSTRESS_CONVENTION.reveals.filter((reveal) =>
    GENERAL_APPROVED_REVEALS.has(reveal.id),
  ),
  endings: MONSTRESS_CONVENTION.endings.filter((ending) =>
    GENERAL_APPROVED_ENDINGS.has(ending.id),
  ),
  keyArt: {
    brief:
      'A rain-soaked neon motel with two spectral witnesses behind a curtained upper window, Saturday morning mystery-adventure illustration, no gore or sexual material',
    alt: 'The Last Call motel under the Monstrique billboard at night',
  },
}

export function assertGeneralEditionHasNoRomance(): boolean {
  return (
    MONSTRIQUE_GENERAL_SPEC.moments.every(
      (moment) => moment.kind !== 'romance',
    ) && MONSTRIQUE_GENERAL_SPEC.cast.every((person) => !person.romance)
  )
}
