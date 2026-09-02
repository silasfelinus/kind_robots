import { defineEventHandler, readBody, setHeader } from 'h3'
import {
  assertAgentCheckInRateAllowed,
  parseAgentCheckInInput,
  recordAgentCheckIn,
  requireBoundAgentProfile,
} from '@/server/utils/agentProfileRuntime'

type CheckInBody = {
  status?: unknown
  summary?: unknown
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const context = await requireBoundAgentProfile(event, 'agent:checkin')
  const body = (await readBody<CheckInBody>(event)) ?? {}
  const input = parseAgentCheckInInput(body)
  assertAgentCheckInRateAllowed(event, context.auth.credentialId)

  return {
    success: true,
    ...(await recordAgentCheckIn({ context, ...input })),
  }
})
