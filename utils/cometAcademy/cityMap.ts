export type CityView = 'campus' | 'town'
export type CoreSiteId =
  | 'academy-roof'
  | 'theater-wing'
  | 'archive-stacks'
  | 'transit-gate'
  | 'observatory'
  | 'city-grants'
  | 'transit-lab'
export type SiteId = CoreSiteId
  | 'student-commons'
  | 'infirmary'
  | 'training-arena'
  | 'engineering-workshop'
  | 'botanical-conservatory'
  | 'student-dormitory'
  | 'ethics-hall'
  | 'academy-docks'
  | 'waterfront-market'
  | 'transit-union'
  | 'neon-arcade'
  | 'civic-hospital'
  | 'industrial-foundry'
  | 'skyport'
  | 'media-spire'
  | 'labor-museum'
  | 'night-bazaar'

export type CitySite = {
  id: SiteId
  name: string
  district: 'academy' | 'city'
  x: number
  y: number
  teaser: string
  encounterIndex?: number
  neighbors: SiteId[]
}

// Single geographic coordinate system. Camera changes, landmarks do not.
export const CITY_SITES: CitySite[] = [
  {
    id: 'academy-roof',
    name: 'Academy Roof',
    district: 'academy',
    x: 0.79,
    y: 0.85,
    encounterIndex: 0,
    teaser: 'A rooftop promise whose timestamp comes from tomorrow',
    neighbors: ['theater-wing', 'archive-stacks', 'student-commons', 'botanical-conservatory'],
  },
  {
    id: 'theater-wing',
    name: 'Theater Wing',
    district: 'academy',
    x: 0.9,
    y: 0.75,
    encounterIndex: 1,
    teaser: 'A prom rehearsal that refuses to stay fictional',
    neighbors: ['academy-roof', 'transit-lab', 'training-arena', 'student-dormitory'],
  },
  {
    id: 'archive-stacks',
    name: 'Archive Stacks',
    district: 'academy',
    x: 0.66,
    y: 0.72,
    encounterIndex: 2,
    teaser: 'The principal offers a dangerous favor',
    neighbors: ['academy-roof', 'transit-lab', 'student-commons', 'engineering-workshop', 'ethics-hall'],
  },
  {
    id: 'transit-gate',
    name: 'Dimensional Gate',
    district: 'city',
    x: 0.46,
    y: 0.54,
    encounterIndex: 3,
    teaser: 'A stranger from another world needs protection',
    neighbors: ['transit-lab', 'city-grants', 'observatory', 'ethics-hall', 'transit-union', 'neon-arcade', 'civic-hospital'],
  },
  {
    id: 'observatory',
    name: 'City Observatory',
    district: 'city',
    x: 0.3,
    y: 0.29,
    encounterIndex: 4,
    teaser: 'A navigator arrives with a refugee route',
    neighbors: ['transit-gate', 'city-grants', 'skyport', 'labor-museum'],
  },
  {
    id: 'city-grants',
    name: 'Civic Grants Hall',
    district: 'city',
    x: 0.24,
    y: 0.63,
    encounterIndex: 5,
    teaser: 'Someone has diverted the rescue scholarship',
    neighbors: ['transit-gate', 'observatory', 'waterfront-market'],
  },
  {
    id: 'transit-lab',
    name: 'Academy Transit Lab',
    district: 'academy',
    x: 0.68,
    y: 0.57,
    encounterIndex: 6,
    teaser: 'The class list predicts two different futures',
    neighbors: ['theater-wing', 'archive-stacks', 'transit-gate', 'engineering-workshop', 'ethics-hall'],
  },
  {
    id: 'student-commons',
    name: 'Student Commons',
    district: 'academy',
    x: 0.77,
    y: 0.7,
    teaser: 'A missing food program and an anonymous whistleblower',
    neighbors: ['academy-roof', 'archive-stacks', 'infirmary'],
  },
  {
    id: 'infirmary',
    name: 'Campus Infirmary',
    district: 'academy',
    x: 0.82,
    y: 0.62,
    teaser: 'An injured rescuer is missing from the official log',
    neighbors: ['student-commons', 'training-arena'],
  },
  {
    id: 'training-arena',
    name: 'Training Arena',
    district: 'academy',
    x: 0.94,
    y: 0.58,
    teaser: 'A staged duel threatens someone else\'s scholarship',
    neighbors: ['infirmary', 'theater-wing'],
  },
  {
    id: 'engineering-workshop',
    name: 'Engineering Workshop',
    district: 'academy',
    x: 0.56,
    y: 0.78,
    teaser: 'A prototype supersuit has a hidden remote switch',
    neighbors: ['archive-stacks', 'transit-lab', 'academy-docks'],
  },
  {
    id: 'botanical-conservatory',
    name: 'Botanical Conservatory',
    district: 'academy',
    x: 0.78,
    y: 0.94,
    teaser: 'A rare living remedy is claimed as private property',
    neighbors: ['academy-roof', 'student-dormitory', 'academy-docks'],
  },
  {
    id: 'student-dormitory',
    name: 'Student Dormitory',
    district: 'academy',
    x: 0.94,
    y: 0.91,
    teaser: 'A stranger\'s curfew pass turns up in a friend\'s room',
    neighbors: ['botanical-conservatory', 'theater-wing'],
  },
  {
    id: 'ethics-hall',
    name: 'Ethics Hall',
    district: 'academy',
    x: 0.55,
    y: 0.62,
    teaser: 'A civilian panel demands the truth about field training',
    neighbors: ['archive-stacks', 'transit-lab', 'transit-gate'],
  },
  {
    id: 'academy-docks',
    name: 'Academy Docks',
    district: 'academy',
    x: 0.6,
    y: 0.92,
    teaser: 'The school\'s relief boat is carrying secret cargo',
    neighbors: ['engineering-workshop', 'botanical-conservatory'],
  },
  {
    id: 'waterfront-market',
    name: 'Waterfront Market',
    district: 'city',
    x: 0.19,
    y: 0.86,
    teaser: 'The market faces a protection racket during flood season',
    neighbors: ['city-grants', 'night-bazaar', 'transit-union'],
  },
  {
    id: 'transit-union',
    name: 'Transit Union',
    district: 'city',
    x: 0.33,
    y: 0.72,
    teaser: 'A strike challenges the academy\'s rescue timetable',
    neighbors: ['waterfront-market', 'night-bazaar', 'neon-arcade', 'transit-gate'],
  },
  {
    id: 'neon-arcade',
    name: 'Neon Arcade',
    district: 'city',
    x: 0.41,
    y: 0.8,
    teaser: 'An augmented-reality contest has become a surveillance trap',
    neighbors: ['transit-union', 'transit-gate', 'civic-hospital'],
  },
  {
    id: 'civic-hospital',
    name: 'Civic Hospital',
    district: 'city',
    x: 0.39,
    y: 0.44,
    teaser: 'The emergency ward needs volunteers, not publicity',
    neighbors: ['neon-arcade', 'transit-gate', 'industrial-foundry', 'labor-museum'],
  },
  {
    id: 'industrial-foundry',
    name: 'Industrial Foundry',
    district: 'city',
    x: 0.15,
    y: 0.43,
    teaser: 'A dangerous alloy order could arm a private militia',
    neighbors: ['civic-hospital', 'media-spire', 'night-bazaar', 'media-spire'],
  },
  {
    id: 'skyport',
    name: 'Comet Skyport',
    district: 'city',
    x: 0.42,
    y: 0.2,
    teaser: 'A refugee shuttle is denied its landing corridor',
    neighbors: ['observatory', 'media-spire', 'labor-museum'],
  },
  {
    id: 'media-spire',
    name: 'Media Spire',
    district: 'city',
    x: 0.13,
    y: 0.2,
    teaser: 'Two competing broadcasts both claim to be the truth',
    neighbors: ['industrial-foundry', 'skyport', 'industrial-foundry'],
  },
  {
    id: 'labor-museum',
    name: 'Labor Museum',
    district: 'city',
    x: 0.49,
    y: 0.32,
    teaser: 'The city\'s first hero was erased from the records',
    neighbors: ['civic-hospital', 'skyport', 'observatory'],
  },
  {
    id: 'night-bazaar',
    name: 'Night Bazaar',
    district: 'city',
    x: 0.09,
    y: 0.69,
    teaser: 'An illegal clinic is saving people the city ignores',
    neighbors: ['waterfront-market', 'transit-union', 'industrial-foundry'],
  },
]

const VIEW_BOUNDS: Record<
  CityView,
  { x0: number; y0: number; x1: number; y1: number }
> = {
  campus: { x0: 0.38, y0: 0.44, x1: 1, y1: 1 },
  town: { x0: 0.05, y0: 0.1, x1: 0.98, y1: 0.96 },
}

export function projectCitySites(view: CityView) {
  const { x0, y0, x1, y1 } = VIEW_BOUNDS[view]
  return CITY_SITES.filter((site) =>
    view === 'campus'
      ? site.district === 'academy' || site.id === 'transit-gate'
      : site.district === 'city' || site.id === 'academy-roof' || site.id === 'transit-lab',
  )
    .filter((site) => site.x >= x0 && site.x <= x1 && site.y >= y0 && site.y <= y1)
    .map((site) => ({
      ...site,
      left: ((site.x - x0) / (x1 - x0)) * 100,
      top: ((site.y - y0) / (y1 - y0)) * 100,
    }))
}

export function projectedCityRoads(view: CityView) {
  const projected = projectCitySites(view)
  const byId = new Map(projected.map((site) => [site.id, site]))
  return projected.flatMap((from) =>
    from.neighbors.flatMap((id) => {
      const to = byId.get(id)
      if (!to || from.id >= id) return []
      return [
        {
          id: `${from.id}-${to.id}`,
          x1: from.left,
          y1: from.top,
          x2: to.left,
          y2: to.top,
        },
      ]
    }),
  )
}
