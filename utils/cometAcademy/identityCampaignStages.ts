import catalog from './identityCampaignStages.json'
import type { SignaturePowerId } from './specialPowers'

export type OriginLevel = {
  title: string
  venue: string
  inciting: string
  powerUse: string
  choice: string
}

export type VillainLair = {
  title: string
  venue: string
  arena: string
  objective: string
  secret: string
}

export type VillainLieutenant = {
  name: string
  look: string
  power: string
  counter: string
  agenda: string
  hp: 4
}

export type IdentityCampaignStage = {
  signature: SignaturePowerId
  opening: OriginLevel
  lair: VillainLair
  lieutenant: VillainLieutenant
}

export const IDENTITY_CAMPAIGN_STAGES =
  catalog.roster as IdentityCampaignStage[]

const bySignature = new Map(
  IDENTITY_CAMPAIGN_STAGES.map((entry) => [entry.signature, entry]),
)

export function campaignStagesFor(
  signature: SignaturePowerId,
): IdentityCampaignStage {
  const stages = bySignature.get(signature)
  if (!stages)
    throw new Error(
      `Missing opening mission, villain lair or lieutenant for ${signature}`,
    )
  return stages
}
