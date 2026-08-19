// /server/api/social/drafts/populate.post.ts
//
// kind-economy/t-025: turns eligible daily-dream output into SocialPostDraft
// rows (status DRAFT). Admin-only, on-demand for v1 -- there is no cron/
// scheduled-task wiring in this task's scope, just this route a scheduled
// hook could call later. Writes only to this app's own database: no
// external platform API is ever called here.
import { defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { errorHandler } from '../../../utils/error'
import { logAdminAction } from '../../../utils/audit'
import { populateSocialDraftsFromDailyDreams } from '../../../utils/socialPostDraft'

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)

    const body = await readBody<{ take?: number }>(event).catch(
      () => ({}) as { take?: number },
    )
    const take =
      Number.isInteger(body?.take) && (body?.take as number) > 0
        ? Math.min(body.take as number, 100)
        : undefined

    const result = await populateSocialDraftsFromDailyDreams({ take })

    await logAdminAction(
      admin,
      `Populated social post drafts from daily-dream content: scanned ${result.scanned}, created ${result.created}, skipped ${result.skipped} (already queued).`,
    )

    return {
      success: true,
      message: `Created ${result.created} new draft(s) from ${result.scanned} scanned daily-dream item(s).`,
      statusCode: 200,
      data: result,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to populate social post drafts.',
      statusCode: event.node.res.statusCode,
    }
  }
})
