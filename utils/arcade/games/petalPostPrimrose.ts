/** Primrose Lane's first six authored deliveries. Sunday belongs to the next slice. */
export type PrimroseWeather = 'sunny' | 'breezy' | 'rainy' | 'foggy' | 'market'
export type PrimroseHazard =
  'cat' | 'bin' | 'car' | 'sprinkler' | 'puppy' | 'kite' | 'puddle'

export type PrimroseEncounter = {
  gap: number
  kind: PrimroseHazard
}

export type PrimroseDay = {
  weekday: string
  title: string
  weather: PrimroseWeather
  encounters: readonly PrimroseEncounter[]
}

export const PRIMROSE_DAYS: readonly PrimroseDay[] = [
  {
    weekday: 'MON',
    title: 'WELCOME TO PRIMROSE',
    weather: 'sunny',
    encounters: [
      { gap: 2, kind: 'cat' },
      { gap: 6, kind: 'bin' },
      { gap: 9, kind: 'cat' },
    ],
  },
  {
    weekday: 'TUE',
    title: 'SPRINKLERS ON',
    weather: 'sunny',
    encounters: [
      { gap: 1, kind: 'bin' },
      { gap: 3, kind: 'sprinkler' },
      { gap: 6, kind: 'car' },
      { gap: 10, kind: 'cat' },
    ],
  },
  {
    weekday: 'WED',
    title: 'THE PUPPY AT THE GATE',
    weather: 'breezy',
    encounters: [
      { gap: 1, kind: 'cat' },
      { gap: 3, kind: 'puppy' },
      { gap: 5, kind: 'sprinkler' },
      { gap: 8, kind: 'puppy' },
      { gap: 10, kind: 'bin' },
    ],
  },
  {
    weekday: 'THU',
    title: 'KITES OVER THE PARK',
    weather: 'breezy',
    encounters: [
      { gap: 1, kind: 'kite' },
      { gap: 3, kind: 'car' },
      { gap: 5, kind: 'puppy' },
      { gap: 7, kind: 'kite' },
      { gap: 10, kind: 'sprinkler' },
    ],
  },
  {
    weekday: 'FRI',
    title: 'PUDDLES AND PETALS',
    weather: 'rainy',
    encounters: [
      { gap: 1, kind: 'puddle' },
      { gap: 3, kind: 'bin' },
      { gap: 5, kind: 'kite' },
      { gap: 7, kind: 'puddle' },
      { gap: 9, kind: 'puppy' },
      { gap: 11, kind: 'puddle' },
    ],
  },
  {
    weekday: 'SAT',
    title: 'THE PRIMROSE MARKET',
    weather: 'market',
    encounters: [
      { gap: 1, kind: 'kite' },
      { gap: 2, kind: 'puddle' },
      { gap: 4, kind: 'puppy' },
      { gap: 6, kind: 'cat' },
      { gap: 8, kind: 'car' },
      { gap: 9, kind: 'sprinkler' },
      { gap: 11, kind: 'bin' },
    ],
  },
]

export const primroseDay = (day: number): PrimroseDay | null =>
  PRIMROSE_DAYS[day - 1] ?? null

export type StreetLandmark = {
  gap: number
  kind: 'crossing' | 'park' | 'shop' | 'side-road'
  side: 'left' | 'right'
  opens: number
}

/** Stable landmarks in the gaps between the twelve persistent homes. */
export const PRIMROSE_LANDMARKS: readonly StreetLandmark[] = [
  { gap: 0, kind: 'crossing', side: 'right', opens: 1 },
  { gap: 2, kind: 'shop', side: 'left', opens: 1 },
  { gap: 4, kind: 'side-road', side: 'right', opens: 2 },
  { gap: 5, kind: 'park', side: 'left', opens: 1 },
  { gap: 7, kind: 'crossing', side: 'left', opens: 3 },
  { gap: 9, kind: 'side-road', side: 'left', opens: 5 },
  { gap: 10, kind: 'shop', side: 'right', opens: 6 },
]

export const primroseLandmarks = (day: number) =>
  PRIMROSE_LANDMARKS.filter((landmark) => day >= landmark.opens)

export type ParkTarget = {
  offset: number
  x: number
  airborne: boolean
}

export const PARK_LOOP_LENGTH = 980
export const PARK_JUMP_TICKS = 40
export const PARK_GOLDEN_POINTS = 1200

/** Every target has a clear approach; elevated rings reward ramp launches. */
export const PARK_LOOP_TARGETS: readonly ParkTarget[] = [
  { offset: 95, x: 63, airborne: false },
  { offset: 200, x: 191, airborne: false },
  { offset: 310, x: 63, airborne: true },
  { offset: 425, x: 193, airborne: false },
  { offset: 535, x: 66, airborne: false },
  { offset: 650, x: 192, airborne: true },
  { offset: 765, x: 65, airborne: false },
  { offset: 875, x: 190, airborne: false },
]

export const PARK_LOOP_RAMPS = [
  { offset: 276, x: 117 },
  { offset: 616, x: 139 },
] as const

export type GazetteCourse = {
  hits: number
  total: number
  golden: boolean
}

export type GazetteHome = {
  subscriber: boolean
  bloom: number
  delivered: boolean
}

export type GazetteReport = {
  day: number
  weekday: string
  headline: string
  homes: readonly GazetteHome[]
  subscribers: number
  delivered: number
  requestsMet: number
  cancellations: number
  signups: number
  tips: number
  course: GazetteCourse | null
}

export function valleyGazette(
  day: number,
  homes: readonly GazetteHome[],
  requestsMet: number,
  cancellations: number,
  signups: number,
  tips: number,
  course: GazetteCourse | null = null,
): GazetteReport {
  const subscribers = homes.filter((h) => h.subscriber).length
  const delivered = homes.filter((h) => h.delivered).length
  const full = homes.filter((h) => h.subscriber && h.bloom === 3).length
  const headline =
    full === homes.length
      ? 'PRIMROSE IN FULL BLOOM!'
      : signups > 0
        ? 'NEW NEIGHBOURS JOIN!'
        : cancellations > 0
          ? 'GARDENS NEED SOME CARE'
          : requestsMet > 1
            ? 'SPECIAL DELIVERIES!'
            : 'A FRESH DAY IN THE VALLEY'
  return {
    day,
    weekday: primroseDay(day)?.weekday ?? 'DAY',
    headline,
    homes: homes.map((h) => ({ ...h })),
    subscribers,
    delivered,
    requestsMet,
    cancellations,
    signups,
    tips,
    course: course ? { ...course } : null,
  }
}
