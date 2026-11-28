// /utils/arcade/games/rainbowRouteBeats.ts
//
// Rainbow Bullet Hell Space Princess, conductor rainbow t-027/t-012 (ROUTE-MAP.md sections 5 and 6): the scenes
// that change because of the detours the crew flew, and the route stingers that close an ending.
//
// Scene windows are fixed lengths, so a route beat normally never adds a line: it replaces one named line of the
// scene, always one that carries no instruction (fork directions, telegraphs) and no allegiance line. The one
// exception is the final choice (A09.TURN), whose window has room for a fourth line: there the beat follows the
// crew's own line instead of silencing it (independent story critic round 2, R2-9). The detours now
// follow their origin Acts (S03 -> X1 -> S04, S04 -> X2 -> S05, S06 -> X3 -> S07, S07 -> X4 -> S08), so the
// "arrived via" beats sit on the Act after each detour; ROUTE-MAP's older "III via X1" row moves to Act IV, and
// the Choir's voice in the depot argument lands on Act V.
import type { FinaleChoice } from './rainbowEclipseFinale'

export type RainbowRouteFlags = {
  /** Detours flown this run. */
  viaX1: boolean
  viaX2: boolean
  viaX3: boolean
  viaX4: boolean
  /** X1: every Coral Choir pod rescued. */
  freedChoir: boolean
  /** X2: all four cadet trainers brought home. */
  cadetsHome: boolean
  /** X3: every lighthouse lamp lit, so Lilt recovers what the relay buried. */
  liltMemoryRecovered: boolean
  /** X4: the Shoal Koi freed, so the crew carries the Crown's echo across the shoal. */
  crownEcho: boolean
}

export const NO_ROUTE: RainbowRouteFlags = {
  viaX1: false,
  viaX2: false,
  viaX3: false,
  viaX4: false,
  freedChoir: false,
  cadetsHome: false,
  liltMemoryRecovered: false,
  crownEcho: false,
}

type Line = { speaker: string; text: string }
type Beat = {
  /** Which line of the scene it replaces, or where it goes in when it `inserts`. */
  line: number
  /** The beat is a line of its own at `line` instead of replacing one. */
  inserts?: true
  /** The replacement for these flags and this crew (lead first), or null when the scene plays as written. */
  say: (route: RainbowRouteFlags, crew: readonly string[]) => Line | null
}

/** Every route beat, by scene. */
export const RAINBOW_ROUTE_BEATS: Readonly<Record<string, Beat>> = {
  'A04.OPEN': {
    line: 1,
    say: (r, crew) =>
      r.viaX1
        ? {
            speaker: crew[0]!,
            text: r.freedChoir
              ? 'The Choir sang us out of the kelp. Now we ride the rails, and every shot stays off the convoy.'
              : 'Out of the kelp and onto the rails. Keep every shot off the convoy.',
          }
        : null,
  },
  'A05.OPEN': {
    line: 1,
    say: (r, crew) =>
      r.viaX2
        ? {
            speaker: crew[0]!,
            text: r.cadetsHome
              ? 'We came in over the comet tail with the cadets in formation. Survivors first; shoot carefully.'
              : 'We came in over the comet tail. Survivors could be in any of these wrecks; shoot carefully.',
          }
        : null,
  },
  'A05.TURN': {
    line: 2,
    say: (r, crew) =>
      r.freedChoir
        ? {
            speaker: 'Coral Choir',
            text: 'Our kin sheltered in these wrecks. Break its teeth, not its crew, and we will sing them home.',
          }
        : r.cadetsHome
          ? {
              speaker: crew.includes('Solenne') ? 'Solenne' : crew[0]!,
              text: 'The cadets held the flank all the way here. Break its teeth, not its crew.',
            }
          : null,
  },
  'A07.OPEN': {
    line: 0,
    say: (r) =>
      r.viaX3
        ? {
            speaker: 'Lilt-7',
            text: r.liltMemoryRecovered
              ? 'Glass Current. The lighthouse beams brought something back to me. Every surface here lies; I will not.'
              : 'Glass Current. We followed the drowned lighthouse beams in, and not every reflection here is true.',
          }
        : null,
  },
  'A07.TURN': {
    line: 1,
    say: (r) =>
      r.liltMemoryRecovered
        ? {
            speaker: 'Lilt-7',
            text: 'I know that mirrored signal: it is the Navigator, hiding the way I once hid. Only one is solid; watch the outline.',
          }
        : null,
  },
  'A08.OPEN': {
    line: 0,
    say: (r) =>
      r.viaX4
        ? {
            speaker: 'Lilt-7',
            text: r.crownEcho
              ? "Eclipse Palace. We crossed the shoal carrying the Crown's echo, and every captive inside is still alive."
              : 'Eclipse Palace. Across the mirror shoal, and every captive in that armada is still alive in its collar.',
          }
        : null,
  },
  'A08.TURN': {
    line: 2,
    say: (r, crew) =>
      r.cadetsHome
        ? {
            speaker: crew[0]!,
            text: 'We unlock, we do not cut, and the cadets escort every captive out. That is how we finish.',
          }
        : null,
  },
  'A08.AFTER': {
    line: 0,
    say: (r) =>
      r.crownEcho
        ? {
            speaker: 'Lilt-7',
            text: "The Leviathan's spire locks are open, and it is answering the Crown's first broadcast. The whales remember.",
          }
        : null,
  },
  'A09.TURN': {
    line: 3,
    inserts: true,
    say: (r) =>
      r.liltMemoryRecovered && r.crownEcho
        ? {
            speaker: 'Lilt-7',
            text: 'I remember what the Crown was built for, and it remembers too. Whatever you choose, I fly with you.',
          }
        : r.liltMemoryRecovered
          ? {
              speaker: 'Lilt-7',
              text: 'The lighthouses gave me back the Crown I knew. It was kind, once. Choose; I fly with you.',
            }
          : r.crownEcho
            ? {
                speaker: 'Lilt-7',
                text: 'Hear that echo? Some part of the Crown is still listening. Choose; I fly with you.',
              }
            : null,
  },
}

/**
 * The scene's lines with its route beat in place (a copy; the scene's own list is untouched). A beat aimed past
 * the scene's last line is ignored, so a shortened scene can never grow; an inserting beat follows that line.
 */
export function withRainbowRouteBeat<L extends Line>(
  lines: readonly L[],
  id: string,
  route: RainbowRouteFlags | undefined,
  crew: readonly string[],
): readonly L[] {
  const beat = route && RAINBOW_ROUTE_BEATS[id]
  if (!beat || beat.line > lines.length) return lines
  if (!beat.inserts && beat.line === lines.length) return lines
  const said = beat.say(route, crew)
  if (!said) return lines
  const changed = [...lines]
  if (beat.inserts) changed.splice(beat.line, 0, said as L)
  else changed[beat.line] = { ...lines[beat.line]!, ...said }
  return changed
}

export type RainbowRouteStinger = {
  id: 'first-rule' | 'whole-fleet' | 'kept-memory' | 'open-sea'
  title: string
  line: string
}

/**
 * ROUTE-MAP section 6: the route stinger an ending earns, if any. Open Sea (every detour's flag and all six
 * rescues) outranks the choice's own stinger; without its keys a choice plays its ending as written.
 */
export function rainbowRouteStinger(
  choice: FinaleChoice,
  route: RainbowRouteFlags,
  rescues: { all: boolean; stoppedRelay: boolean },
): RainbowRouteStinger | null {
  if (
    rescues.all &&
    route.freedChoir &&
    route.cadetsHome &&
    route.liltMemoryRecovered &&
    route.crownEcho
  )
    return {
      id: 'open-sea',
      title: 'Open Sea',
      line: 'Every route flown, every rescue made. The Luminous Ocean wakes to an open dawn.',
    }
  if (choice === 'restore' && route.liltMemoryRecovered && route.crownEcho)
    return {
      id: 'first-rule',
      title: 'First Rule',
      line: 'The Crown speaks its original directive in its own voice: protect, and ask.',
    }
  if (choice === 'evacuate' && route.freedChoir && route.cadetsHome)
    return {
      id: 'whole-fleet',
      title: 'Whole Fleet',
      line: 'The Coral Choir and the cadet wing fly the evacuation escort, side by side.',
    }
  if (choice === 'sever' && rescues.stoppedRelay && route.liltMemoryRecovered)
    return {
      id: 'kept-memory',
      title: 'Kept Memory',
      line: 'The shards go dark, but Lilt keeps everything they carried.',
    }
  return null
}

/** Credit lines for the route: alt flags (not rescues) and the stinger. */
export function rainbowRouteCredits(
  route: RainbowRouteFlags,
  stinger: RainbowRouteStinger | null,
): string[] {
  const flown = [
    route.freedChoir && 'The Coral Choir, sung home from the Kelp Nebula',
    route.cadetsHome && 'The cadet wing, home from the comet tail',
    route.liltMemoryRecovered &&
      "Lilt-7's memory, relit at the drowned lighthouses",
    route.crownEcho && "The Crown's echo, carried across the mirror shoal",
  ].filter((line): line is string => Boolean(line))
  if (!flown.length && !stinger) return []
  return [
    'THE ROUTE',
    ...flown,
    ...(stinger ? [`${stinger.title}: ${stinger.line}`] : []),
    '',
  ]
}
