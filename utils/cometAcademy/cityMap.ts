export type CityView = 'campus' | 'town'
export type SiteId =
  | 'academy-roof'
  | 'theater-wing'
  | 'archive-stacks'
  | 'transit-gate'
  | 'observatory'
  | 'city-grants'
  | 'transit-lab'

export type CitySite = {
  id: SiteId
  name: string
  district: 'academy' | 'city'
  x: number
  y: number
  encounterIndex: number
  neighbors: SiteId[]
}

export const CITY_SITES: CitySite[] = [
  {
    id: 'academy-roof',
    name: 'Academy Roof',
    district: 'academy',
    x: 0.79,
    y: 0.85,
    encounterIndex: 0,
    neighbors: ['theater-wing', 'archive-stacks'],
  },
  {
    id: 'theater-wing',
    name: 'Theater Wing',
    district: 'academy',
    x: 0.9,
    y: 0.75,
    encounterIndex: 1,
    neighbors: ['academy-roof', 'transit-lab'],
  },
  {
    id: 'archive-stacks',
    name: 'Archive Stacks',
    district: 'academy',
    x: 0.66,
    y: 0.72,
    encounterIndex: 2,
    neighbors: ['academy-roof', 'transit-lab'],
  },
  {
    id: 'transit-gate',
    name: 'Dimensional Gate',
    district: 'city',
    x: 0.46,
    y: 0.54,
    encounterIndex: 3,
    neighbors: ['transit-lab', 'city-grants', 'observatory'],
  },
  {
    id: 'observatory',
    name: 'City Observatory',
    district: 'city',
    x: 0.3,
    y: 0.29,
    encounterIndex: 4,
    neighbors: ['transit-gate', 'city-grants'],
  },
  {
    id: 'city-grants',
    name: 'Civic Grants Hall',
    district: 'city',
    x: 0.24,
    y: 0.63,
    encounterIndex: 5,
    neighbors: ['transit-gate', 'observatory'],
  },
  {
    id: 'transit-lab',
    name: 'Academy Transit Lab',
    district: 'academy',
    x: 0.68,
    y: 0.57,
    encounterIndex: 6,
    neighbors: ['transit-gate', 'archive-stacks', 'theater-wing'],
  },
]

const VIEW_BOUNDS: Record<
  CityView,
  { x0: number; y0: number; x1: number; y1: number }
> = {
  campus: { x0: 0.38, y0: 0.44, x1: 1, y1: 1 },
  town: { x0: 0.08, y0: 0.13, x1: 0.98, y1: 0.96 },
}

export function projectCitySites(view: CityView) {
  const { x0, y0, x1, y1 } = VIEW_BOUNDS[view]
  return CITY_SITES.filter(
    (site) => site.x >= x0 && site.x <= x1 && site.y >= y0 && site.y <= y1,
  ).map((site) => ({
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
