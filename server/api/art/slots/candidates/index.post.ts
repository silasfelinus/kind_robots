// /server/api/art/slots/candidates/index.post.ts
//
// Register renders as candidates for their art slots (server/utils/artSlots.ts).
// Idempotent per (slot, image). Conductor calls this for every DONE render it
// records, so all renders of one asset can be compared and one chosen.
// Body: { candidates: [{ slotKey, projectSlug?, label?, artImageId, artJobId?,
//         source?, sourceRef?, selectIfEmpty? }] }   (at most 500)
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'
import {
  assertCurator,
  parseCandidateInputs,
  registerCandidates,
} from '../../../../utils/artSlots'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    assertCurator(auth)
    const body = (await readBody(event)) as { candidates?: unknown } | null
    const inputs = parseCandidateInputs(body?.candidates)
    const results = await registerCandidates(inputs, auth.user.id)
    const created = results.filter((r) => r.status === 'created').length
    return {
      success: true,
      message: `${created} new candidate(s), ${results.length - created} already known or missing.`,
      data: { results },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to register art candidates.',
      statusCode: event.node.res.statusCode,
    }
  }
})
