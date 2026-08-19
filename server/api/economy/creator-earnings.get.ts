// /server/api/economy/creator-earnings.get.ts
//
// kind-economy/t-009: read-only creator earnings view. Returns the
// authenticated caller's OWN accrued creator-share earnings from the
// RevenueSplit ledger (t-008) -- total, by object, by period, and the raw
// interactions behind them. There is no way to request another user's id
// here (unlike server/api/karma/[id].get.ts's admin-override pattern) --
// this route only ever answers for the caller, so there is nothing to
// authorize beyond "is this a real signed-in user".
//
// No payout action lives here or anywhere else yet: kind-economy/t-014
// ("Design the creator payout mechanism") and t-015 ("GATE: enable real
// creator payouts") are both still open in the roadmap, so this route
// never implies anything is withdrawable.
import { defineEventHandler } from 'h3'
import { requireApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { getCreatorEarnings } from '../../utils/creatorEarnings'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const data = await getCreatorEarnings(auth.user.id)

    return {
      success: true,
      message: 'Creator earnings loaded.',
      statusCode: 200,
      data,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to load creator earnings.',
      statusCode: event.node.res.statusCode,
    }
  }
})
