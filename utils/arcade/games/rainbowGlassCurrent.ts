/**
 * Authored Act VII encounter director: the Glass Current (S07), a mirrored star canyon of crystalline
 * strata and fractured beams. Local 60 Hz frames start straight after Act VI's aftermath (ACT-STRUCTURE:
 * reef glass begins to refract the fleet). World bible S07 beats, one new craft per lesson: E22 mirror eels
 * fire a solid pellet beside a phantom copy, and only the outlined one is real; E23 crystal squids glint,
 * then their pellets split in three after a fixed delay; E24 crown harbingers warm their prism, then remix
 * two earlier patterns one at a time (a marked lane bolt, then a ring bubble); and prism pylons refract
 * fans across the canyon until they are broken. A refraction merge leads to the Mirror guardian (see
 * rainbowGuardian), then the machine echo (CAST-BIBLE S07: the Crown calls Azure by an outdated chart
 * designation and she tells the squad the route is wrong) and eight escalations. Before the boss, the
 * optional Lost Navigator rescue (flag rescuedNavigator) unlocks a fuller truth but is never required.
 * The canyon turns into the palace approach before B07 Glass Eel. A clean run takes about ten minutes.
 * Wave ids start at 6000.
 */
import {
  buildFormationSchedule,
  wave,
  type RainbowSpawn,
  type RainbowWave,
} from './rainbowFormations'
import type { RainbowGuardianSection } from './rainbowGuardian'

export type GlassEnemy = 'mirror' | 'squid' | 'harbinger' | 'prism'
export type GlassStage = 'opening' | 'waves' | 'turn' | 'boss' | 'aftermath'
export type GlassSceneId =
  'A07.OPEN' | 'A07.ECHO' | 'A07.SIGNAL' | 'A07.TURN' | 'A07.AFTER'
export type GlassDialogue = { speaker: string; text: string }
export type GlassWave = RainbowWave<GlassEnemy>
export type GlassSpawn = RainbowSpawn<GlassEnemy>

export const GLASS = {
  openingEnds: 300,
  turnStarts: 31500,
  bossStarts: 31800,
  aftermathFrames: 390,
  lineFrames: 96,
  waveBase: 6000,
  /** The machine echo opens the section after the guardian. */
  echoAt: 9900,
} as const

export const GLASS_SECTIONS = [
  { name: 'Mirror canyon', from: 300, to: 1800 },
  { name: 'Split lenses', from: 1800, to: 3300 },
  { name: 'Harbinger glass', from: 3300, to: 4800 },
  { name: 'Prism pylons', from: 4800, to: 6300 },
  { name: 'Refraction merge', from: 6300, to: 8100 },
  { name: 'Mirror guardian', from: 8100, to: 9900 },
  { name: 'Machine echo', from: 9900, to: 11700 },
  { name: 'False corridor', from: 11700, to: 13500 },
  { name: 'Lens garden', from: 13500, to: 15300 },
  { name: 'Old patterns', from: 15300, to: 17100 },
  { name: 'Fractured beams', from: 17100, to: 18900 },
  { name: 'Crystal strata', from: 18900, to: 20700 },
  { name: 'Lens ribbons', from: 20700, to: 22500 },
  { name: 'Mirror maze', from: 22500, to: 24300 },
  { name: 'Refraction storm', from: 24300, to: 26100 },
  { name: 'Lost signal', from: 26100, to: 27900 },
  { name: 'Shattered light', from: 27900, to: 29700 },
  { name: 'Palace corridor', from: 29700, to: 31500 },
] as const

/** The Mirror guardian holds the Act after the refraction merge; no waves fly in its section. */
export const GLASS_GUARDIAN: RainbowGuardianSection = {
  name: 'Mirror guardian',
  from: 8100,
  to: 9900,
  kind: 'mirror',
}

/**
 * The Lost Navigator: two comms lines open the Lost signal section, then the navigator's pod drifts out of
 * the glass at podAppears, weaving across the canyon. Touching it rescues the navigator.
 */
export const GLASS_NAVIGATOR = {
  commsFrom: 26100,
  podAppears: 26340,
  podSpeed: 0.5,
  podReach: 24,
  rescueScore: 2000,
} as const

export const GLASS_WAVES: readonly GlassWave[] = [
  // Mirror canyon: mirror eels fire a solid pellet beside a phantom copy; only the outlined one is real.
  wave(420, 'mirror', 'single', 1, 0.5),
  wave(720, 'mirror', 'single', 1, 0.3),
  wave(960, 'mirror', 'single', 1, 0.7),
  wave(1200, 'mirror', 'pair', 2, 0.25),
  wave(1440, 'mirror', 'single', 1, 0.5),
  wave(1620, 'mirror', 'single', 1, 0.2),
  // Split lenses: crystal squids glint, then their pellets split in three on a timer.
  wave(1860, 'squid', 'single', 1, 0.5),
  wave(2160, 'squid', 'single', 1, 0.3),
  wave(2400, 'mirror', 'single', 1, 0.7),
  wave(2640, 'squid', 'single', 1, 0.65),
  wave(2880, 'squid', 'pair', 2, 0.25),
  wave(3120, 'squid', 'single', 1, 0.45),
  // Harbinger glass: harbingers warm their prism, then remix a lane bolt and a ring bubble.
  wave(3360, 'harbinger', 'single', 1, 0.5),
  wave(3720, 'harbinger', 'single', 1, 0.3),
  wave(4020, 'squid', 'single', 1, 0.7),
  wave(4260, 'harbinger', 'single', 1, 0.7),
  wave(4560, 'harbinger', 'pair', 2, 0.25),
  // Prism pylons: prism pylons refract fans across the canyon; break them to clear the light.
  wave(4860, 'prism', 'single', 1, 0.25),
  wave(5040, 'prism', 'single', 1, 0.75),
  wave(5280, 'mirror', 'single', 1, 0.5),
  wave(5520, 'prism', 'column', 2, 0.5, { spread: 0.5 }),
  wave(5760, 'squid', 'single', 1, 0.5),
  wave(6000, 'prism', 'single', 1, 0.4),
  wave(6180, 'mirror', 'single', 1, 0.6),
  // Refraction merge: every glass craft together in the mirrored canyon.
  wave(6360, 'mirror', 'single', 1, 0.3),
  wave(6540, 'squid', 'single', 1, 0.6),
  wave(6720, 'prism', 'single', 1, 0.5),
  wave(6900, 'harbinger', 'single', 1, 0.25),
  wave(7140, 'mirror', 'pair', 2, 0.2),
  wave(7380, 'squid', 'pair', 2, 0.3),
  wave(7620, 'harbinger', 'single', 1, 0.6),
  wave(7860, 'prism', 'single', 1, 0.7),
  // Machine echo: the Crown’s echo speaks first; then the canyon fills.
  wave(10260, 'mirror', 'single', 1, 0.5),
  wave(10500, 'squid', 'single', 1, 0.3),
  wave(10740, 'prism', 'single', 1, 0.6),
  wave(10980, 'harbinger', 'single', 1, 0.5),
  wave(11220, 'mirror', 'pair', 2, 0.2),
  wave(11460, 'squid', 'single', 1, 0.7),
  // False corridor: mirror eels in pairs, phantoms crossing the real lanes.
  wave(11760, 'mirror', 'pair', 2, 0.2),
  wave(12000, 'mirror', 'single', 1, 0.5),
  wave(12240, 'squid', 'single', 1, 0.3),
  wave(12480, 'mirror', 'pair', 2, 0.35),
  wave(12720, 'prism', 'single', 1, 0.5),
  wave(12960, 'mirror', 'pair', 2, 0.15),
  wave(13200, 'harbinger', 'single', 1, 0.5),
  // Lens garden: squids among the pylons, every split timed to a refraction.
  wave(13560, 'squid', 'pair', 2, 0.2),
  wave(13800, 'prism', 'single', 1, 0.5),
  wave(14040, 'squid', 'single', 1, 0.4),
  wave(14280, 'squid', 'pair', 2, 0.3),
  wave(14520, 'prism', 'column', 2, 0.5, { spread: 0.5 }),
  wave(14760, 'squid', 'single', 1, 0.6),
  wave(15000, 'mirror', 'single', 1, 0.5),
  // Old patterns: harbingers remix the trench and the reef; read them one at a time.
  wave(15360, 'harbinger', 'single', 1, 0.3),
  wave(15600, 'harbinger', 'single', 1, 0.7),
  wave(15900, 'mirror', 'single', 1, 0.5),
  wave(16140, 'harbinger', 'pair', 2, 0.25),
  wave(16440, 'squid', 'single', 1, 0.5),
  wave(16680, 'harbinger', 'single', 1, 0.5),
  // Fractured beams: pylons on both walls with eels threading the beams.
  wave(17160, 'prism', 'pair', 2, 0.2),
  wave(17400, 'mirror', 'single', 1, 0.5),
  wave(17640, 'prism', 'single', 1, 0.5),
  wave(17880, 'squid', 'single', 1, 0.35),
  wave(18120, 'prism', 'pair', 2, 0.3),
  wave(18360, 'mirror', 'pair', 2, 0.2),
  wave(18600, 'harbinger', 'single', 1, 0.6),
  // Crystal strata: layers of glass, each with its own trick.
  wave(18960, 'mirror', 'single', 1, 0.2),
  wave(19140, 'squid', 'single', 1, 0.8),
  wave(19380, 'harbinger', 'single', 1, 0.5),
  wave(19620, 'prism', 'single', 1, 0.3),
  wave(19860, 'mirror', 'pair', 2, 0.25),
  wave(20100, 'squid', 'pair', 2, 0.2),
  wave(20340, 'prism', 'single', 1, 0.7),
  // Lens ribbons: the front lens ribbons bend every shot; squids split in pairs.
  wave(20760, 'squid', 'pair', 2, 0.15),
  wave(21000, 'squid', 'single', 1, 0.5),
  wave(21240, 'mirror', 'single', 1, 0.6),
  wave(21480, 'squid', 'pair', 2, 0.3),
  wave(21720, 'harbinger', 'single', 1, 0.4),
  wave(21960, 'squid', 'single', 1, 0.5),
  wave(22200, 'prism', 'single', 1, 0.5),
  // Mirror maze: phantoms everywhere; only the outlined pellets are real.
  wave(22560, 'mirror', 'pair', 2, 0.25),
  wave(22800, 'mirror', 'pair', 2, 0.1),
  wave(23040, 'prism', 'single', 1, 0.5),
  wave(23280, 'mirror', 'single', 1, 0.5),
  wave(23520, 'mirror', 'pair', 2, 0.3),
  wave(23760, 'harbinger', 'single', 1, 0.5),
  wave(24000, 'squid', 'single', 1, 0.6),
  // Refraction storm: all four glass hazards at once.
  wave(24360, 'harbinger', 'single', 1, 0.5),
  wave(24540, 'prism', 'pair', 2, 0.2),
  wave(24780, 'squid', 'single', 1, 0.3),
  wave(25020, 'mirror', 'pair', 2, 0.25),
  wave(25260, 'harbinger', 'single', 1, 0.6),
  wave(25500, 'squid', 'pair', 2, 0.2),
  wave(25740, 'mirror', 'single', 1, 0.5),
  // Lost signal: a navigator’s beacon in the glass, lightly guarded; reaching it is a choice.
  wave(26520, 'mirror', 'single', 1, 0.8),
  wave(26940, 'squid', 'single', 1, 0.2),
  wave(27360, 'prism', 'single', 1, 0.8),
  wave(27660, 'mirror', 'single', 1, 0.3),
  // Shattered light: the canyon cracks open toward the palace.
  wave(27960, 'prism', 'pair', 2, 0.25),
  wave(28200, 'harbinger', 'single', 1, 0.5),
  wave(28440, 'mirror', 'pair', 2, 0.2),
  wave(28680, 'squid', 'single', 1, 0.5),
  wave(28920, 'harbinger', 'single', 1, 0.3),
  wave(29160, 'squid', 'pair', 2, 0.25),
  wave(29400, 'mirror', 'single', 1, 0.6),
  // Palace corridor: the mirror corridor turns into the palace approach.
  wave(29760, 'mirror', 'pair', 2, 0.2),
  wave(30000, 'squid', 'single', 1, 0.5),
  wave(30240, 'prism', 'single', 1, 0.4),
  wave(30480, 'harbinger', 'single', 1, 0.6),
  wave(30720, 'mirror', 'single', 1, 0.3),
  wave(30960, 'squid', 'pair', 2, 0.2),
  wave(31200, 'prism', 'single', 1, 0.5),
]

const schedule = buildFormationSchedule(GLASS_WAVES, GLASS.waveBase)

/** Craft per wave, by wave index, for the school bonus. */
export const GLASS_WAVE_SIZES: readonly number[] = schedule.sizes

export function glassStage(
  frame: number,
  defeatedAt: number | null,
): GlassStage {
  if (defeatedAt !== null) return 'aftermath'
  if (frame < GLASS.openingEnds) return 'opening'
  if (frame < GLASS.turnStarts) return 'waves'
  if (frame < GLASS.bossStarts) return 'turn'
  return 'boss'
}

/** Every craft that enters on this Act VII frame; empty outside the waves stage. */
export function glassSpawns(frame: number): readonly GlassSpawn[] {
  return glassStage(frame, null) === 'waves' ? schedule.at(frame) : []
}

/** The navigator pod's height as it drifts: a slow weave through the canyon. */
export function glassNavigatorY(frame: number): number {
  return 135 + Math.sin((frame - GLASS_NAVIGATOR.podAppears) / 70) * 70
}

const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const

export function glassDialogue(
  id: GlassSceneId,
  elapsed: number,
  players: number,
  rescuedNavigator = false,
): GlassDialogue | null {
  const crew = PILOTS.slice(0, Math.max(1, Math.min(4, players)))
  const lead = crew[0]!
  const wing = crew[crew.length - 1]!
  const azure = crew.includes('Azure')
  const lines: Record<GlassSceneId, GlassDialogue[]> = {
    'A07.OPEN': [
      {
        speaker: 'Lilt-7',
        text: 'Glass Current. Every surface here reflects, and not every reflection is true.',
      },
      {
        speaker: lead,
        text: 'Then we trust what hits us, not what shines at us.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'Mirror eels ahead. Watch for the outline; the faint copy is only light.',
      },
    ],
    'A07.ECHO': [
      {
        speaker: 'Crown Echo',
        text: 'Chart unit AZ-7, your assigned heading is three degrees off. Correct it.',
      },
      azure
        ? {
            speaker: 'Azure',
            text: 'That name is out of date, and so is your map. The route is wrong; follow me.',
          }
        : {
            speaker: 'Lilt-7',
            text: 'That voice uses the old chart names. Ignore it; the glass lies about the route.',
          },
      crew.includes('Vivi')
        ? {
            speaker: 'Vivi',
            text: 'Hear that distress tone? It is a musical inversion. A real call is hidden inside it.',
          }
        : {
            speaker: 'Lilt-7',
            text: 'I hid that distress tone once, because the Crown used it as a lure. I am sorry.',
          },
    ],
    'A07.SIGNAL': [
      {
        speaker: 'Lilt-7',
        text: "A navigator's beacon, deep in the glass. Reaching it is your choice, not an order.",
      },
      {
        speaker: azure ? 'Azure' : lead,
        text: 'Its pod weaves through the canyon. Meet it, and we learn what the Crown hid.',
      },
    ],
    'A07.TURN': [
      {
        speaker: 'Lilt-7',
        text: rescuedNavigator
          ? 'The navigator is aboard. She says the Glass Eel guards the palace door.'
          : 'The Glass Eel guards the palace door. Its copies move before it does.',
      },
      {
        speaker: wing,
        text: 'Only one of them is solid. Keep your eyes on the outline.',
      },
      {
        speaker: lead,
        text: 'Free it from the glass, and then we choose how we enter the palace, together.',
      },
    ],
    'A07.AFTER': [
      {
        speaker: 'Lilt-7',
        text: "The Glass Eel's mirrored shell is peeling back. It is free.",
      },
      {
        speaker: lead,
        text: rescuedNavigator
          ? 'The navigator knows the palace. We go in the way she came out.'
          : 'No map of the palace, then. We go in together and we ask before we act.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'The mirror corridor is opening. The palace is right ahead.',
      },
    ],
  }
  return lines[id][Math.floor(elapsed / GLASS.lineFrames)] ?? null
}

export function glassScene(
  frame: number,
  defeatedFrame: number | null,
): { id: GlassSceneId; elapsed: number } | null {
  if (defeatedFrame !== null) {
    const elapsed = frame - defeatedFrame
    return elapsed < GLASS.aftermathFrames ? { id: 'A07.AFTER', elapsed } : null
  }
  if (frame < GLASS.openingEnds) return { id: 'A07.OPEN', elapsed: frame }
  if (frame >= GLASS.echoAt && frame < GLASS.echoAt + 3 * GLASS.lineFrames)
    return { id: 'A07.ECHO', elapsed: frame - GLASS.echoAt }
  if (
    frame >= GLASS_NAVIGATOR.commsFrom &&
    frame < GLASS_NAVIGATOR.commsFrom + 2 * GLASS.lineFrames
  )
    return { id: 'A07.SIGNAL', elapsed: frame - GLASS_NAVIGATOR.commsFrom }
  if (frame >= GLASS.turnStarts && frame < GLASS.bossStarts)
    return { id: 'A07.TURN', elapsed: frame - GLASS.turnStarts }
  return null
}
