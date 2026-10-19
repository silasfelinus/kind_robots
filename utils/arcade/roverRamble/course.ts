// /utils/arcade/roverRamble/course.ts
//
// Rover Ramble's Rally Course (conductor kr-arcade/t-098, depth-pass CABINETS.md section 15): the
// 26 lettered sections, A to Z, as authored data. Each section is a short beat script; the game
// lays the script out along the track with seeded variation in the spacing and the crater widths,
// so a retry of a section is the same section but never the same pixels. Section lengths follow
// from their scripts, so the pacing varies from one letter to the next.
//
// Beat letters (one per token, spaces between):
//   c crater      C twin craters   r rock         B big boulder   o roller
//   m landmine    t tank           R ramp + gap    k moon creeper  d dust devil
//   s sprite trio z zig saucer     b bomber saucer p pursuer from behind   . breather
//
// Moon 1 (A to E) is complete. Moons 2 to 5 run the same threats on a harder script until their
// own terrain and Guardians arrive in the later slices.

export type Beat =
  | 'crater'
  | 'twin'
  | 'rock'
  | 'big'
  | 'roller'
  | 'mine'
  | 'tank'
  | 'ramp'
  | 'creeper'
  | 'devil'
  | 'sprites'
  | 'zig'
  | 'bomber'
  | 'pursuer'
  | 'rest'

export const TOKENS: Record<string, Beat> = {
  c: 'crater',
  C: 'twin',
  r: 'rock',
  B: 'big',
  o: 'roller',
  m: 'mine',
  t: 'tank',
  R: 'ramp',
  k: 'creeper',
  d: 'devil',
  s: 'sprites',
  z: 'zig',
  b: 'bomber',
  p: 'pursuer',
  '.': 'rest',
}

/** Beats that fly or drive in on a trigger instead of sitting on the track. */
const CUES: ReadonlySet<Beat> = new Set(['sprites', 'zig', 'bomber', 'pursuer'])

export type PlaceKind =
  | 'crater'
  | 'rock'
  | 'big'
  | 'roller'
  | 'mine'
  | 'tank'
  | 'ramp'
  | 'creeper'
  | 'devil'

export type CueKind = 'sprites' | 'zig' | 'bomber' | 'pursuer'

/** One thing on the track. `w` is a crater's or ramp's width, otherwise 0. */
export type Placement = { kind: PlaceKind; x: number; w: number }
/** A trigger: when the rover reaches `x`, this threat arrives. */
export type Cue = { kind: CueKind; x: number }

export const MOONS = ['PEBBLE', 'RIME', 'CINDER', 'PRISM', 'THE FAR SIDE']
/** The last letter of each moon is an outpost with a checkpoint report. */
export const OUTPOSTS = [4, 9, 14, 19, 25]

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const SECTION_COUNT = LETTERS.length
/** Pixels of track in front of the first beat and behind the last. */
export const LEAD_IN = 260
export const LEAD_OUT = 200
export const RAMP_W = 34
export const RAMP_GAP_W = 56
/** Unscaled cruise speed in pixels per second (60 ticks of BASE_SPEED 1.6). */
export const CRUISE_PX_PER_SEC = 96

const SCRIPTS: string[] = [
  // --- Moon 1: Pebble ---
  'c r c r R r c r c r . c r c r c r', // A
  'c r B c . s r c B r R c r c B s r c', // B
  'c m r c m . B c r m R r c C m d r c m', // C
  'c r t . B m c s r p R c m r t B c d m c', // D
  'C m B t c . b r R m C d t B c s m r c p', // E
  // --- Moon 2: Rime ---
  'c r B m C . o r c t B R m c r z c B m C', // F
  'C m o c B t . s r c m R d B C m o c r', // G
  'B c m t C . p r o m R c B z t C m c', // H
  'o C m B t . b c r m C R t o B d m c z', // I
  'C m t o B c . s p m R C z t B o b m C c', // J
  // --- Moon 3: Cinder ---
  'k c m r C t . B o k R m c z C t b', // K
  'C k m t B . d o c k m R t C s B z c', // L
  'B k t m C . p o c k R t B z m C b', // M
  'k C t o m . B b k c R m t z C d B o', // N
  'k B t m C . s p o k R t z m C b B c o m', // O
  // --- Moon 4: Prism ---
  'C k t m B . z o c b R m t C k p B', // P
  'B m C k t . o b d z R t m C k s B', // Q
  'k t C m B . z p o b R m t k C B d', // R
  'C B m t k . b z o p R t m C k B s', // S
  'k C t m z . B b o p R t k m C B d z c', // T
  // --- Moon 5: The Far Side ---
  'C k m t B . z b o p R t m C k d B', // U
  'B t C m k . b z p o R m t C B k d', // V
  'C m k t B . z b o p R k m t C B s c r', // W
  'k C t B m . b z p o R t k m C B d z r c', // X
  'B k C t m . z b p o R t m k C B s d b r c', // Y
  'C B k t m z . b p o R k t m C B d z b s p c', // Z
]

export type SectionDef = {
  letter: string
  /** 0..4: which moon the letter belongs to. */
  moon: number
  beats: Beat[]
  /** Spacing between beats on the track. */
  gap: number
  /** The widest ordinary crater. */
  widest: number
  /** Track length in pixels. */
  len: number
  /** Par time in seconds. */
  par: number
}

export function parseBeats(script: string): Beat[] {
  return script
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const beat = TOKENS[token]
      if (!beat) throw new Error(`unknown beat token "${token}"`)
      return beat
    })
}

/** The width a beat takes on the track, before the spacing after it. */
function beatWidth(beat: Beat, widest: number): number {
  if (CUES.has(beat)) return 0
  if (beat === 'crater') return (16 + widest) / 2
  if (beat === 'twin') return 16 + widest + 78
  if (beat === 'ramp') return RAMP_W + 8 + RAMP_GAP_W + 7
  if (beat === 'rest') return 0
  return 0
}

/** Does this beat get the usual spacing after it? */
function spaced(beat: Beat): boolean {
  return !CUES.has(beat) && beat !== 'rest'
}

const REST_PX = 150
/** How much of the section's spacing budget the random factors may eat. */
const SPACING_MEAN = 1.05
const SLACK = 1.12

function build(letter: string, index: number, script: string): SectionDef {
  const beats = parseBeats(script)
  const gap = Math.max(122, 232 - 4 * index)
  const widest = Math.min(44, 26 + index)
  let body = 0
  for (const beat of beats) {
    body += beatWidth(beat, widest)
    if (spaced(beat)) body += gap * SPACING_MEAN
    if (beat === 'rest') body += REST_PX
    if (CUES.has(beat)) body += 30
  }
  const len = Math.ceil((LEAD_IN + body * SLACK + LEAD_OUT) / 50) * 50
  const pace = 1 - 0.2 * (index / (SECTION_COUNT - 1))
  const par = Math.round((len / CRUISE_PX_PER_SEC) * pace)
  return {
    letter,
    moon: OUTPOSTS.findIndex((o) => index <= o),
    beats,
    gap,
    widest,
    len,
    par,
  }
}

export const COURSE: SectionDef[] = SCRIPTS.map((script, i) =>
  build(LETTERS[i]!, i, script),
)

/** Where section `index` (0-based) begins, in track pixels from the start. */
export function sectionStart(index: number): number {
  let x = 0
  for (let i = 0; i < index; i++) x += COURSE[i]!.len
  return x
}

export const COURSE_LENGTH = sectionStart(SECTION_COUNT)

/** Is the end of section `index` a major checkpoint (an outpost)? */
export function isOutpost(index: number): boolean {
  return OUTPOSTS.includes(index)
}

/** The first and last section of a moon, 0-based. */
export function moonRange(moon: number): [number, number] {
  const last = OUTPOSTS[moon]!
  const first = moon === 0 ? 0 : OUTPOSTS[moon - 1]! + 1
  return [first, last]
}

export type Layout = { places: Placement[]; cues: Cue[] }

/**
 * Lays one section's script along the track starting at `start`. Spacing and crater widths come
 * from `rng`; the spacing is scaled back if the dice run long, so every beat always fits.
 */
export function layoutSection(
  def: SectionDef,
  start: number,
  rng: () => number,
): Layout {
  const factors = def.beats.map(() => 0.75 + rng() * 0.6)
  const widths = def.beats.map(() => 16 + rng() * (def.widest - 16))
  let fixed = 0
  let spacing = 0
  def.beats.forEach((beat, i) => {
    if (beat === 'crater') fixed += widths[i]!
    else if (beat === 'twin') fixed += widths[i]! + 24 + 70
    else if (beat === 'ramp') fixed += RAMP_W + 8 + RAMP_GAP_W + 7
    if (spaced(beat)) spacing += def.gap * factors[i]!
    if (beat === 'rest') fixed += REST_PX
    if (CUES.has(beat)) fixed += 30
  })
  const room = def.len - LEAD_IN - LEAD_OUT
  const scale = Math.min(1, (room - fixed) / Math.max(1, spacing))
  const places: Placement[] = []
  const cues: Cue[] = []
  let x = start + LEAD_IN
  def.beats.forEach((beat, i) => {
    const w = widths[i]!
    const after = def.gap * factors[i]! * scale
    switch (beat) {
      case 'crater':
        places.push({ kind: 'crater', x, w })
        x += w + after
        break
      case 'twin':
        places.push({ kind: 'crater', x, w })
        x += w + 70
        places.push({ kind: 'crater', x, w: 16 + (w % 8) })
        x += 24 + after
        break
      case 'ramp':
        places.push({ kind: 'ramp', x, w: RAMP_W })
        places.push({ kind: 'crater', x: x + RAMP_W + 8, w: RAMP_GAP_W })
        x += RAMP_W + 8 + RAMP_GAP_W + 7 + after
        break
      case 'rest':
        x += REST_PX
        break
      case 'sprites':
      case 'zig':
      case 'bomber':
      case 'pursuer':
        cues.push({ kind: beat, x: Math.max(start + 120, x - 150) })
        x += 30
        break
      default:
        places.push({ kind: beat, x, w: 0 })
        x += after
    }
  })
  return { places, cues }
}

export function courseProblems(): string[] {
  const out: string[] = []
  if (COURSE.length !== SECTION_COUNT) out.push('the course is not A to Z')
  COURSE.forEach((s, i) => {
    const secs = s.len / CRUISE_PX_PER_SEC
    if (secs < 35 || secs > 62)
      out.push(`${s.letter} runs ${secs.toFixed(0)} s at cruise (35 to 60)`)
    if (s.par >= secs) out.push(`${s.letter} par is not under cruise time`)
    if (s.beats.length < 10) out.push(`${s.letter} has fewer than 10 beats`)
    if (i === OUTPOSTS[s.moon]! && !s.beats.length)
      out.push(`${s.letter} is an empty outpost`)
  })
  return out
}

// --- the checkpoint report ---------------------------------------------------------------

export type MoonRun = {
  /** Ticks spent from the moon's first letter to its outpost, retries included. */
  ticks: number
  /** Rovers lost on the moon. */
  crashes: number
}

export type Report = {
  moon: number
  name: string
  seconds: number
  par: number
  underPar: boolean
  noScrape: boolean
  bonus: number
}

export const STAMP_BONUS = 1000

/** The time board at an outpost: your time against par, the stamps and what they pay. */
export function checkpointReport(moon: number, run: MoonRun): Report {
  const [first, last] = moonRange(moon)
  let par = 0
  for (let i = first; i <= last; i++) par += COURSE[i]!.par
  const seconds = Math.round(run.ticks / 60)
  const underPar = seconds <= par
  const noScrape = run.crashes === 0
  return {
    moon,
    name: MOONS[moon]!,
    seconds,
    par,
    underPar,
    noScrape,
    bonus:
      (underPar ? STAMP_BONUS : 0) * (moon + 1) +
      (noScrape ? STAMP_BONUS : 0) * (moon + 1),
  }
}
