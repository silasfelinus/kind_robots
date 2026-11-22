export type RainWeather = 'hail' | 'rain' | 'moth' | 'sleet' | 'snowball'

export type RainWave = {
  garden: string
  name: string
  number: number
  localWave: number
  hailCount: number
  rainShare: number
  wind: number
  skyBand: number
  par: number
  threatMix: readonly RainWeather[]
}

const GARDENS = [
  { name: 'Orchard Hills', mix: ['hail', 'rain', 'moth'] },
  { name: 'Terrace Paddies', mix: ['hail', 'rain', 'sleet', 'moth'] },
  { name: 'Desert Oasis', mix: ['hail', 'rain', 'moth', 'sleet'] },
  { name: 'Mountain Tea Garden', mix: ['hail', 'rain', 'snowball'] },
  { name: 'Seaside Cliffs', mix: ['hail', 'rain', 'sleet', 'moth'] },
  {
    name: 'Aurora Greenhouse',
    mix: ['hail', 'rain', 'snowball', 'sleet', 'moth'],
  },
] as const

export const RAIN_GARDENS = GARDENS.map((garden) => garden.name)

export function rainWaveForLevel(level: number): RainWave {
  const safe = Math.max(1, Math.floor(Number.isFinite(level) ? level : 1))
  const index = (safe - 1) % 30
  const gardenIndex = Math.floor(index / 5)
  const localWave = (index % 5) + 1
  const garden = GARDENS[gardenIndex]!
  const mix = garden.mix.filter(
    (kind) => kind !== 'moth' || localWave >= 3 || gardenIndex > 0,
  ) as RainWeather[]
  return {
    garden: garden.name,
    name: localWave === 3 ? 'SPECIAL FORECAST' : 'GARDEN WAVE',
    number: safe,
    localWave,
    hailCount: Math.min(40, 10 + (safe - 1) * 3),
    rainShare: gardenIndex === 2 ? 0.12 : 0.24 + (localWave % 3) * 0.06,
    wind: localWave >= 3 ? (localWave % 2 === 0 ? -0.12 : 0.12) : 0,
    skyBand: Math.floor((safe - 1) / 2) % 6,
    par: Math.round(75 + (safe - 1) * 12),
    threatMix: mix,
  }
}

export function weatherForVolley(
  wave: RainWave,
  sequence: number,
): RainWeather {
  const roll = ((Math.abs(sequence) * 37 + wave.number * 13) % 100) / 100
  if (roll < wave.rainShare) return 'rain'
  const hazards = wave.threatMix.filter((kind) => kind !== 'rain')
  return hazards[Math.abs(sequence) % hazards.length] ?? 'hail'
}
