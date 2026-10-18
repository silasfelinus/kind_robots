import type { AffinityTier, KingdomFactionId, LocalFactionId } from './types'

export type LocalFactionDef = {
  id: LocalFactionId
  name: string
  who: string
  wants: string
}

export const LOCAL_FACTION_DEFS: readonly LocalFactionDef[] = [
  {
    id: 'ledger',
    name: 'The Ledger',
    who: 'Merchants, money-changers and brass-stampers',
    wants: 'Low taxes on trade, open roads and repaid debts',
  },
  {
    id: 'old-houses',
    name: 'The Old Houses',
    who: 'Landed families who backed the throne',
    wants: 'Precedence, land and their heirs in office',
  },
  {
    id: 'yard',
    name: 'The Yard',
    who: 'Laborers, cooks and stablehands of the fortress',
    wants: 'Bread, fair wages and not being spent on wars',
  },
  {
    id: 'lamplight',
    name: 'The Lamplight Archive',
    who: 'Scribes, scholars and cartographers',
    wants: 'Records kept, truth told, relics studied rather than sold',
  },
  {
    id: 'gate-watch',
    name: 'The Gate Watch',
    who: 'The fortress garrison',
    wants: 'Pay, respect and a commander who does not waste them',
  },
]

export type KingdomFactionDef = {
  id: KingdomFactionId
  name: string
  home: string
  /** Day the faction appears on the map (act-end reveals). */
  revealedOnDay: number
  startAffinity: number
  startStrength: number
}

export const KINGDOM_FACTION_DEFS: readonly KingdomFactionDef[] = [
  {
    id: 'hollow-bell',
    name: 'Hollow Bell',
    home: 'Border town under the bell tower',
    revealedOnDay: 1,
    startAffinity: 10,
    startStrength: 6,
  },
  {
    id: 'abbey',
    name: 'The Abbey',
    home: 'The convent of the Silent Bell on the mission road',
    revealedOnDay: 1,
    startAffinity: 20,
    startStrength: 6,
  },
  {
    id: 'storm-crows',
    name: 'Storm Crow Conclave',
    home: 'Cave heights in the west',
    revealedOnDay: 1,
    startAffinity: 0,
    startStrength: 7,
  },
  {
    id: 'mire-mothers',
    name: 'Mire Mothers',
    home: 'The Mirefen wetlands in the north',
    revealedOnDay: 1,
    startAffinity: 0,
    startStrength: 6,
  },
  {
    id: 'jackalwire',
    name: 'Jackalwire Pack',
    home: 'The rail canyon in the south',
    revealedOnDay: 1,
    startAffinity: -20,
    startStrength: 6,
  },
  {
    id: 'saltroad',
    name: 'Saltroad Caravans',
    home: 'Villages along the trade road',
    revealedOnDay: 1,
    startAffinity: 10,
    startStrength: 5,
  },
  {
    id: 'freeholds',
    name: 'Border Freeholds',
    home: 'Scattered homesteads',
    revealedOnDay: 1,
    startAffinity: 0,
    startStrength: 4,
  },
  {
    id: 'moles',
    name: 'Mole Revolutionaries',
    home: 'Tunnels beneath the badlands',
    revealedOnDay: 1,
    startAffinity: -40,
    startStrength: 5,
  },
  {
    id: 'rustline',
    name: 'The Rustline',
    home: 'Sunken rail yards in the east',
    revealedOnDay: 11,
    startAffinity: 0,
    startStrength: 5,
  },
  {
    id: 'black-verge',
    name: 'The Black Verge Court',
    home: 'The far border',
    revealedOnDay: 21,
    startAffinity: -20,
    startStrength: 8,
  },
]

export type RegionDef = {
  id: string
  name: string
  controller: KingdomFactionId
  tax: number
}

/** Regions that pay taxes while their controller is Neutral or better. */
export const REGIONS: readonly RegionDef[] = [
  { id: 'east-ford', name: 'Eastern Ford', controller: 'freeholds', tax: 4 },
  { id: 'hollow-bell', name: 'Hollow Bell', controller: 'hollow-bell', tax: 6 },
  { id: 'mission-road', name: 'The Mission Road', controller: 'abbey', tax: 3 },
  {
    id: 'storm-crow-heights',
    name: 'Storm Crow Heights',
    controller: 'storm-crows',
    tax: 4,
  },
  { id: 'mirefen', name: 'Mirefen', controller: 'mire-mothers', tax: 3 },
  {
    id: 'jackalwire',
    name: 'Jackalwire Canyon',
    controller: 'jackalwire',
    tax: 4,
  },
  { id: 'saltroad', name: 'The Saltroad', controller: 'saltroad', tax: 6 },
  { id: 'mole-tunnels', name: 'Mole Tunnels', controller: 'moles', tax: 2 },
  {
    id: 'rail-yards',
    name: 'Sunken Rail Yards',
    controller: 'rustline',
    tax: 4,
  },
  {
    id: 'black-verge',
    name: 'The Black Verge',
    controller: 'black-verge',
    tax: 5,
  },
]

export const AFFINITY_FLOOR: Record<AffinityTier, number> = {
  hostile: -100,
  wary: -59,
  neutral: -19,
  friendly: 20,
  allied: 60,
}

export const affinityTier = (value: number): AffinityTier => {
  if (value >= AFFINITY_FLOOR.allied) return 'allied'
  if (value >= AFFINITY_FLOOR.friendly) return 'friendly'
  if (value >= AFFINITY_FLOOR.neutral) return 'neutral'
  if (value >= AFFINITY_FLOOR.wary) return 'wary'
  return 'hostile'
}

export const LOCAL_START = 10
export const LOCAL_MAX = 30
