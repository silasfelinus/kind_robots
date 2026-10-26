import catalog from './specialPowers.json'

export type PowerFormId =
  'impact' | 'arc' | 'veil' | 'step' | 'weave' | 'beacon'
export type PowerAffinityId =
  'fire' | 'ice' | 'storm' | 'stone' | 'light' | 'shadow' | 'bloom' | 'gravity'
export type PowerVowId = 'shelter' | 'unmask' | 'claim'
export type SignaturePowerId = `${PowerFormId}-${PowerAffinityId}`
export type LegacyPowerId =
  'kinetic' | 'technopathy' | 'empathy' | 'elemental' | 'spatial' | 'biotech'

type Signature = {
  id: SignaturePowerId
  form: PowerFormId
  element: PowerAffinityId
  legacy: LegacyPowerId
  name: string
  action: string
  cost: string
  training: string
  special_route: {
    skill: LegacyPowerId
    trigger: string
    tradeoff: string
  }
  finales: Record<PowerVowId, string>
}

export const POWER_FORMS = catalog.forms as {
  id: PowerFormId
  name: string
  legacy: LegacyPowerId
  mechanic: string
  requirement: string
}[]
export const POWER_AFFINITIES = catalog.elements as {
  id: PowerAffinityId
  name: string
  risk: string
}[]
export const POWER_VOWS = catalog.vows as {
  id: PowerVowId
  name: string
  promise: string
}[]
export const SIGNATURE_POWERS = catalog.powers as Signature[]

export function signatureFor(form: PowerFormId, element: PowerAffinityId) {
  return SIGNATURE_POWERS.find(
    (power) => power.form === form && power.element === element,
  )!
}
export function signatureById(id: string) {
  return SIGNATURE_POWERS.find((power) => power.id === id)
}
