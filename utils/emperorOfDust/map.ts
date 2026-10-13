import type { Incident } from './types'

export type ImperialRegion = {
  id: string
  name: string
  faction: string
  description: string
  x: number
  y: number
  outwardHours: number
}

export const TOWER = { x: 50, y: 9 } as const

export const IMPERIAL_REGIONS: readonly ImperialRegion[] = [
  {
    id: 'east-ford',
    name: 'Eastern Ford',
    faction: 'Border Freeholds',
    description:
      'The closest crossing feeds the tower and the scattered farms below it.',
    x: 76,
    y: 35,
    outwardHours: 1,
  },
  {
    id: 'hollow-bell',
    name: 'Hollow Bell',
    faction: 'Hollow Bell Council',
    description:
      'A shrewd mayor balances refugee pleas, repairs, and the limits of his generosity.',
    x: 82,
    y: 58,
    outwardHours: 2,
  },
  {
    id: 'storm-crow-heights',
    name: 'Storm Crow Heights',
    faction: 'Storm Crow Conclave',
    description:
      'Rain is a blessing; the terms of a Crow bargain are rarely simple.',
    x: 23,
    y: 31,
    outwardHours: 3,
  },
  {
    id: 'jackalwire',
    name: 'Jackalwire Canyon',
    faction: 'Jackalwire Pack',
    description:
      'Painted wagons and restless raiders contest the dry southern approaches.',
    x: 24,
    y: 76,
    outwardHours: 4,
  },
  {
    id: 'mirefen',
    name: 'Mirefen',
    faction: 'Mire Mothers',
    description:
      'The swamp witches request help while concealing terrible obligations.',
    x: 74,
    y: 83,
    outwardHours: 5,
  },
  {
    id: 'mole-tunnels',
    name: 'Mole Tunnels',
    faction: 'Mole Revolutionaries',
    description:
      'Dissent spreads under the roads, and the Moles resist the witches as fiercely as the throne.',
    x: 44,
    y: 67,
    outwardHours: 3,
  },
]

export const pathFromTower = (region: ImperialRegion): string =>
  `M ${TOWER.x} ${TOWER.y} L ${region.x} ${region.y}`

export const regionForIncident = (incident: Incident): ImperialRegion => {
  const region = IMPERIAL_REGIONS.find(
    (entry) => entry.id === incident.destinationId,
  )
  if (!region || region.outwardHours !== incident.outwardHours) {
    throw new Error(`Incident ${incident.id} has an invalid map route`)
  }
  return region
}
