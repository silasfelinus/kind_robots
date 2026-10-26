import catalog from './specialPowers.json'

export type PowerOriginId =
  'accident' | 'mutant' | 'tech' | 'magic' | 'alien' | 'psychic'
export type PowerAffinityId =
  | 'fire'
  | 'air'
  | 'earth'
  | 'water'
  | 'discipline'
  | 'genius'
  | 'birthright'
  | 'social'
export type PowerVowId = 'shelter' | 'unmask' | 'claim'
export type SignaturePowerId = `${PowerOriginId}-${PowerAffinityId}`
export type LegacyPowerId =
  'kinetic' | 'technopathy' | 'empathy' | 'elemental' | 'spatial' | 'biotech'
export type StatId = 'might' | 'speed' | 'smarts' | 'heart' | 'control' | 'grit'
export type PersonaStats = Record<StatId, number>

export const STATS: { id: StatId; name: string; field: LegacyPowerId }[] = [
  { id: 'might', name: 'Might', field: 'kinetic' },
  { id: 'speed', name: 'Speed', field: 'spatial' },
  { id: 'smarts', name: 'Smarts', field: 'technopathy' },
  { id: 'heart', name: 'Heart', field: 'empathy' },
  { id: 'control', name: 'Control', field: 'elemental' },
  { id: 'grit', name: 'Grit', field: 'biotech' },
]

type Signature = {
  id: SignaturePowerId
  origin: PowerOriginId
  affinity: PowerAffinityId
  name: string
  action: string
  cost: string
  prom: string
}

export const POWER_ORIGINS = catalog.origins as {
  id: PowerOriginId
  name: string
  glyph: string
  source: string
  complication: string
}[]
export const POWER_AFFINITIES = catalog.affinities as {
  id: PowerAffinityId
  name: string
  glyph: string
  theme: string
  risk: string
}[]
export const POWER_VOWS = catalog.vows as {
  id: PowerVowId
  name: string
  promise: string
}[]
export const SIGNATURE_POWERS = catalog.powers as Signature[]
const LEGACY_SIGNATURES = catalog.legacySignatures as Record<
  string,
  SignaturePowerId
>

export function signatureFor(origin: PowerOriginId, affinity: PowerAffinityId) {
  return SIGNATURE_POWERS.find(
    (power) => power.origin === origin && power.affinity === affinity,
  )!
}
export function signatureById(id: string) {
  return SIGNATURE_POWERS.find((power) => power.id === id)
}
export function migrateSignatureId(id: string): SignaturePowerId | undefined {
  return signatureById(id)?.id ?? LEGACY_SIGNATURES[id]
}

export function strongestStat(stats: PersonaStats): StatId {
  return STATS.reduce((best, stat) =>
    stats[stat.id] > stats[best.id] ? stat : best,
  ).id
}
export function fieldForStats(stats: PersonaStats): LegacyPowerId {
  return STATS.find((stat) => stat.id === strongestStat(stats))!.field
}

export function finaleFor(
  signature: Signature,
  person: string,
  villainAlias: string,
  vow: PowerVowId,
) {
  const opening = `At the Prom of Doom, ${signature.prom}`
  if (vow === 'shelter')
    return `${opening} ${person} uses ${signature.name} to ${signature.action} and gets the nearest guests out first. ${signature.cost}. The survivors remember who stayed with them.`
  if (vow === 'unmask')
    return `${opening} ${person} turns ${signature.name} on the people who arranged it and shows the whole ballroom who profits. The comfortable alliance with the faculty ends, and the evidence now belongs to the guests.`
  return `${opening} ${person} takes command and uses ${signature.name} to ${signature.action} on their own terms. The disaster is contained, and everyone watching wonders whether ${villainAlias} was born tonight.`
}
