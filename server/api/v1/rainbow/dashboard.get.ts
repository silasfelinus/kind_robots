import { defineEventHandler, setHeader } from 'h3'
import { requireHumanOrDelegatedApiUser } from '@/server/utils/authGuard'
import { effectiveShowMature } from '@/server/utils/contentAccess'
import { errorHandler } from '@/server/utils/error'
import { buildRainbowDashboardWorkspace } from '@/server/utils/rainbowDashboard'

export default defineEventHandler(async (event) => {
  try {
    setHeader(event, 'Cache-Control', 'no-store')
    const auth = await requireHumanOrDelegatedApiUser(event)
    const data = await buildRainbowDashboardWorkspace({
      userId: auth.user.id,
      includeMature: effectiveShowMature(auth.user),
    })

    return {
      success: true,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      data: null,
      message: handled.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
