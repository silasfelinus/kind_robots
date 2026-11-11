import type { TeamId } from './prototypes'
import type { AllianceLaterArc } from './campaignAllianceArcTypes'
import { catgirlAllianceArcs } from './campaignAllianceArcsCatgirls'
import { bloodfairyAllianceArcs } from './campaignAllianceArcsBloodfairies'
import { ironjawAllianceArcs } from './campaignAllianceArcsIronjaw'
import { riotAllianceArcs } from './campaignAllianceArcsRiot'
import { undertowAllianceArcs } from './campaignAllianceArcsUndertow'
import { exchangeAllianceArcs } from './campaignAllianceArcsExchange'

/** Four authored escalations and two authored endings for each ordered pair.
 * The origin stories remain in campaignAllianceJourney.ts. */
export const ALLIANCE_LATER_ARCS: Record<
  TeamId,
  Partial<Record<TeamId, AllianceLaterArc>>
> = {
  catgirls: catgirlAllianceArcs,
  bloodfairies: bloodfairyAllianceArcs,
  ironjaw: ironjawAllianceArcs,
  riot: riotAllianceArcs,
  undertow: undertowAllianceArcs,
  exchange: exchangeAllianceArcs,
}
