import catalog from './identityArcs.json'
import type { SignaturePowerId } from './specialPowers'

export type IdentityArc = {
  signature: SignaturePowerId
  student: { alias: string; conflict: string }
  hero: { alias: string; method: string }
  villain: { alias: string; method: string }
  quests: { protagonist: string; antagonist: string; partner: string }
}

export const IDENTITY_ARCS = catalog.identityCatalog as IdentityArc[]
const bySignature = new Map(IDENTITY_ARCS.map((arc) => [arc.signature, arc]))

export function identityFor(signature: SignaturePowerId): IdentityArc {
  const identity = bySignature.get(signature)
  if (!identity) throw new Error(`Missing identity for ${signature}`)
  return identity
}
