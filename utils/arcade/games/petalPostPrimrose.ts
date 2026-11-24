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
}

export function valleyGazette(
  day: number,
  homes: readonly GazetteHome[],
  requestsMet: number,
  cancellations: number,
  signups: number,
  tips: number,
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
  }
}
