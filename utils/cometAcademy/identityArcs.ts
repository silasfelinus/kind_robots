import catalog from './identityArcs.json'
import lives from './identityLives.json'
import { GUEST_IDENTITIES, type GuestIdentity } from './guestIdentities'
import type { SignaturePowerId } from './specialPowers'

type CivilianLife = {
  signature: SignaturePowerId
  realName: string
  backstory: string
  heroDecision: string
  villainDecision: string
  sidekick: string
  romance: string
}

export type IdentityArc = {
  signature: SignaturePowerId
  realName: string
  backstory: string
  heroDecision: string
  villainDecision: string
  sidekick: string
  romance: string
  student: { alias: string; conflict: string }
  hero: { alias: string; method: string }
  villain: { alias: string; method: string }
  quests: { protagonist: string; antagonist: string; partner: string }
}

type AliasArc = Pick<IdentityArc, 'signature' | 'student' | 'hero' | 'villain' | 'quests'>
const biographies = new Map(
  (lives.people as CivilianLife[]).map((life) => [life.signature, life]),
)

export const IDENTITY_ARCS: IdentityArc[] = (catalog.identityCatalog as AliasArc[]).map(
  (arc) => {
    const life = biographies.get(arc.signature)
    if (!life) throw new Error(`Missing civilian life for ${arc.signature}`)
    return { ...arc, ...life }
  },
)
const bySignature = new Map(IDENTITY_ARCS.map((arc) => [arc.signature, arc]))

export function identityFor(signature: SignaturePowerId): IdentityArc {
  const identity = bySignature.get(signature)
  if (!identity) throw new Error(`Missing identity for ${signature}`)
  return identity
}

export type CharacterIdentity = IdentityArc | GuestIdentity
export const CHARACTER_ROSTER: CharacterIdentity[] = [
  ...IDENTITY_ARCS,
  ...GUEST_IDENTITIES,
]

export type CharacterViewpoint = 'protagonist' | 'antagonist'
export type CharacterAllegiance = 'hero' | 'villain'
export type CharacterBond = 'sidekick' | 'partner' | 'romance'

export function identityStoryFor(
  character: CharacterIdentity,
  viewpoint: CharacterViewpoint,
  allegiance: CharacterAllegiance,
  bonds: readonly CharacterBond[] = [],
) {
  const persona = character[allegiance]
  const setup =
    viewpoint === 'protagonist'
      ? allegiance === 'hero'
        ? character.quests.protagonist
        : character.villainDecision
      : allegiance === 'hero'
        ? character.heroDecision
        : character.quests.antagonist
  const decision =
    allegiance === 'hero'
      ? character.heroDecision
      : character.villainDecision
  const bondScenes: string[] = []
  if (bonds.includes('sidekick')) bondScenes.push(character.sidekick)
  if (bonds.includes('partner')) bondScenes.push(character.quests.partner)
  if (bonds.includes('romance')) bondScenes.push(character.romance)
  return {
    person: character.realName,
    backstory: character.backstory,
    studentAlias: character.student.alias,
    alias: persona.alias,
    method: persona.method,
    viewpoint,
    allegiance,
    setup,
    decision,
    bondScenes,
  }
}
