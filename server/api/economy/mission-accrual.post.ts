// /server/api/economy/mission-accrual.post.ts
//
// kind-economy/t-010: log a new mission-share remittance event. Admin-only
// (requireAdminApiUser). Body: { amountCents, note, reference? }.
//
// This does NOT move any money -- there is no Stripe call, no external
// transfer, nothing outward-facing. It is pure bookkeeping: a record that
// the calling admin already sent real money to the fundraiser OUTSIDE this
// app (e.g. via the same Every.org/AMF donate flow used elsewhere), so the
// dashboard's remitted/outstanding figures are computable. Every write is
// also mirrored into the admin action log (logAdminAction) for the same
// auditability every other admin-gated mutation in this repo gets.
import { defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { createMissionRemittance } from '../../utils/missionAccrual'
import { logAdminAction } from '../../utils/audit'
import { formatUsdCents } from '../../../utils/formatCurrency'

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)
    const body = await readBody<{
      amountCents?: unknown
      note?: unknown
      reference?: unknown
    }>(event)

    const remittance = await createMissionRemittance(
      {
        amountCents: body?.amountCents,
        note: body?.note,
        reference: body?.reference,
      },
      admin.id,
    )

    await logAdminAction(
      admin,
      `Logged a mission-share remittance of ${formatUsdCents(remittance.amountCents)}${
        remittance.reference ? ` (ref ${remittance.reference})` : ''
      }: ${remittance.note}`,
    )

    return {
      success: true,
      message: 'Remittance logged.',
      statusCode: 201,
      data: remittance,
    }
  } catch (error: unknown) {
    // A plain (non-h3) Error -- e.g. validateMissionRemittanceInput's
    // rejection of a bad amountCents/note -- defaults to 400 in
    // errorHandler already, so no extra classification is needed here.
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to log remittance.',
      statusCode: event.node.res.statusCode,
    }
  }
})
