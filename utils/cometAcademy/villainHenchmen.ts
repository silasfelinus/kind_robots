import catalog from './villainHenchmen.json'
import type { SignaturePowerId } from './specialPowers'

export type VillainHenchman = {
  signature: SignaturePowerId
  name: string
  captain: string
  look: string
  move: string
  counter: string
  story: string
  facetType: 'SPECIES'
  hp: 1
}

export const VILLAIN_HENCHMEN = catalog.roster as VillainHenchman[]

const byVillain = new Map(
  VILLAIN_HENCHMEN.map((henchman) => [henchman.signature, henchman]),
)

export function henchmanForVillain(
  signature: SignaturePowerId,
): VillainHenchman {
  const henchman = byVillain.get(signature)
  if (!henchman)
    throw new Error(`Missing distinctive henchman type for ${signature}`)
  return henchman
}
