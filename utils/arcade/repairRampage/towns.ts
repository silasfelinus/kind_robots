export type RepairTown = {
  id: string
  name: string
  region: string
  weather: 'clear' | 'rain' | 'wind' | 'snow' | 'storm'
  objective: 'repair' | 'rescue' | 'relight'
  towerCount: number
  maxRows: number
  damage: number
  threats: readonly string[]
}

const regions = [
  {
    name: 'Harbourside',
    towns: [
      'Saltwater Quay',
      'Seaglass Pier',
      'Beacon Bay',
      'Tidepool Dock',
      'Lighthouse Night',
    ],
    weather: 'rain',
    threats: ['news-drone', 'gull-flock', 'rascal'],
  },
  {
    name: 'Old Brick Town',
    towns: [
      'Cobble Square',
      'Chimney Row',
      'Market Clock',
      'Bell Street',
      'Bell Run',
    ],
    weather: 'wind',
    threats: ['news-drone', 'pigeon', 'gust'],
  },
  {
    name: 'Hilltop Village',
    towns: [
      'Fernhill',
      'Cable Crossing',
      'Goat Path',
      'Mossy Summit',
      'Cable Car Rescue',
    ],
    weather: 'clear',
    threats: ['news-drone', 'gust', 'runaway-cart'],
  },
  {
    name: 'Neon Downtown',
    towns: [
      'Electric Avenue',
      'Cinema Mile',
      'Skybridge',
      'Midnight Plaza',
      'Opening Night',
    ],
    weather: 'snow',
    threats: ['news-drone', 'paparazzi-blimp', 'searchlight'],
  },
  {
    name: 'Eye of the Storm',
    towns: [
      'Cloudbreak',
      'Thunder Alley',
      'Blackout Boulevard',
      'Last Lighthouse',
      'Sunrise Square',
    ],
    weather: 'storm',
    threats: ['news-drone', 'gust', 'paparazzi-blimp'],
  },
] as const

export const REPAIR_TOWNS: readonly RepairTown[] = regions.flatMap(
  (region, regionIndex) =>
    region.towns.map((name, townIndex) => ({
      id: `town-${regionIndex + 1}-${townIndex + 1}`,
      name,
      region: region.name,
      weather: region.weather,
      objective:
        townIndex === 4 ? 'relight' : townIndex === 2 ? 'rescue' : 'repair',
      towerCount: Math.min(4, 2 + Math.floor((regionIndex + townIndex) / 3)),
      maxRows: Math.min(11, 6 + regionIndex + Math.floor(townIndex / 2)),
      damage: Math.min(0.9, 0.45 + regionIndex * 0.07 + townIndex * 0.02),
      threats: region.threats,
    })),
)

export function repairTownForCity(city: number): RepairTown {
  const index = Math.max(0, Math.floor(city) - 1) % REPAIR_TOWNS.length
  return REPAIR_TOWNS[index]!
}
