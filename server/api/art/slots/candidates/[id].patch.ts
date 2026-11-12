// /server/api/art/slots/candidates/[id].patch.ts
//
// Set a candidate's verdict (none | liked | rejected | duplicate) and note.
// Body: { verdict?, note? }
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'
import {
  assertCurator,
  normalizeVerdict,
  setCandidateVerdict,
} from '../../../../utils/artSlots'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    assertCurator(auth)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isSafeInteger(id) || id < 1)
      throw createError({ statusCode: 400, message: 'Invalid candidate id.' })
    const body = (await readBody(event)) as {
      verdict?: unknown
      note?: unknown
    } | null
    const verdict = normalizeVerdict(body?.verdict ?? 'none')
    const note =
      body && 'note' in body
        ? body.note
          ? String(body.note)
          : null
        : undefined
    const candidate = await setCandidateVerdict(id, verdict, note)
    return {
      success: true,
      message: `Candidate ${id} marked ${verdict}.`,
      data: { candidate },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to update the candidate.',
      statusCode: event.node.res.statusCode,
    }
  }
})
