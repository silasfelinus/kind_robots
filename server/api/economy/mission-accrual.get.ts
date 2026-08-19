// /server/api/economy/mission-accrual.get.ts
//
// kind-economy/t-010: admin-only mission-share accrual dashboard. Returns
// the platform-wide accrued mission-share total (from the RevenueSplit
// ledger, t-008), the remittance log + its total (from the new
// MissionRemittance ledger), and outstanding = accrued - remitted.
//
// Admin-gated via requireAdminApiUser -- this is Silas's own operational
// and reconciliation record, not a per-user view like t-009's creator
// earnings page. Real "how much has been raised" happens in two completely
// separate places and this route only ever answers for the platform-side
// one: the ~$840 already raised directly via againstmalaria.com/amibot
// never touched this app's books and is NOT included in any figure this
// route returns -- the frontend surfaces that figure separately, as a
// static/config value, explicitly labeled as not part of these totals.
import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { getMissionAccrualData } from '../../utils/missionAccrual'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const data = await getMissionAccrualData()

    return {
      success: true,
      message: 'Mission accrual loaded.',
      statusCode: 200,
      data,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to load mission accrual.',
      statusCode: event.node.res.statusCode,
    }
  }
})
