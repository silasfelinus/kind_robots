import { BRIAR_COLLISION_SCENES, type BriarCollisionSite } from './briarCollision'
import type { MemoryCampaignProgress } from './reimaginerCampaign'

type BriarWitnessEnding = 'trust-witnesses' | 'protect-village'

interface BriarWitnessScene {
  opening: string
  outcomes: Record<string, string>
}

/**
 * Pip's collision remembers the actual Briar verdict. The earlier village
 * hearing cannot be retroactively opened, and a closed gate cannot invent
 * testimony from people who were never admitted.
 */
const BRIAR_WITNESS_CALLBACKS: Record<
  BriarWitnessEnding,
  Record<BriarCollisionSite, BriarWitnessScene>
> = {
  'trust-witnesses': {
    '2,2': {
      opening:
        'Pip recognizes the wolf captain from the hearing where villagers finally listened to outsiders. The captain can witness an evacuation, but Mara will not surrender her workers’ names merely because the forest has learned to use a badge.',
      outcomes: {
        'translate-shift-oath':
          'The captain invokes the old public hearing to honor the temporary oath. Mara records that the workers consented to this one night, not to a permanent claim over their shifts.',
        'redact-and-witness':
          'Two former opponents from the Briar hearing jointly verify the anonymous head count. Their public testimony protects the workers without turning a private roster into a new village census.',
        'break-midnight-clock':
          'The captain offers to testify that the corridor was dangerous. The open Briar hearing can support Mara’s payroll appeal, but it cannot restore the timecards Pip destroyed.',
      },
    },
    '7,6': {
      opening:
        'A wolf who testified beside the villagers recognizes Ren’s family, then turns their badge facedown. The earlier hearing established a right to speak, not a right to publish a refugee address.',
      outcomes: {
        'private-tide-escort':
          'The wolf witnesses the safe arrival without copying Ren’s chart. Pip asks the former hearing members to defend the family’s privacy if the patrol later demands a location.',
        'public-dam-crossing':
          'The public witnesses can verify the rescue, but the new dam exposes the shelter. Pip must still help Ren move before the same patrol can use that visibility against them.',
        'community-ferry-charter':
          'The former village witnesses sign only as observers. Ren’s families keep the ferry key and the right to close the route, refusing to let an earlier victory become permanent oversight.',
      },
    },
  },
  'protect-village': {
    '2,2': {
      opening:
        'Pip remembers the village gates staying shut while the forest witnesses waited outside. The wolf captain has no shared hearing to cite, and Mara refuses to let an unverified patrol decide who counts as an employee.',
      outcomes: {
        'translate-shift-oath':
          'The temporary oath gets the workers out, but the closed village has offered no public witness. Mara keeps signed consent slips in case the captain later disputes the promise.',
        'redact-and-witness':
          'Pip and Mara build a new anonymous evacuation record from the workers themselves. The earlier village still has closed gates; this evidence does not pretend otherwise.',
        'break-midnight-clock':
          'The corridor opens, but neither a village hearing nor intact timecards can support the payroll appeal. Mara begins taking voluntary statements from the people who escaped.',
      },
    },
    '7,6': {
      opening:
        'Ren remembers being kept outside the Briar village gates. No witness from that sealed hearing can be summoned to certify this crossing. Pip must earn the family’s trust in the flooded roots themselves.',
      outcomes: {
        'private-tide-escort':
          'Ren accepts the private escort after Oren demonstrates the route. The family keeps its address, and the village’s old refusal remains an unpaid obligation rather than a magically repaired friendship.',
        'public-dam-crossing':
          'The open dam rescues strangers the village once turned away. Ren insists on moving the shelter immediately; the old closed gates give the approaching patrol no claim to the family.',
        'community-ferry-charter':
          'Ren’s families write the charter without waiting for village approval. Their right to stop the ferry is explicit, because the last community that promised safety kept its gate shut.',
      },
    },
  },
}

export function briarCollisionWitnessCallback(
  campaign: MemoryCampaignProgress,
  key: string,
  choiceId?: string,
): { opening: string; outcome: string } {
  const empty = { opening: '', outcome: '' }
  if (!campaign.completed.includes('e02')) return empty
  const verdict = campaign.pairDecisions?.e02
  if (verdict !== 'trust-witnesses' && verdict !== 'protect-village')
    return empty
  if (!Object.hasOwn(BRIAR_COLLISION_SCENES, key)) return empty
  const scene = BRIAR_WITNESS_CALLBACKS[verdict][key as BriarCollisionSite]
  return {
    opening: scene.opening,
    outcome:
      choiceId && Object.hasOwn(scene.outcomes, choiceId)
        ? scene.outcomes[choiceId]!
        : '',
  }
}
