// POST /api/playbook-forge/gestation-note
//
// Appends Silas's note on a gestating playbook concept to Conductor's
// pitches/playbook-challenges/SILAS-NOTES.yaml. The next daily challenge
// brief lists open notes first (scripts/playbook_pitch_memory.py). Comments
// in the file are kept. Admin only.
import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { conductorGet, conductorPut } from '~/server/utils/conductor-github'
import { GESTATION_NOTES } from '~/utils/playbookForge/gestation'
import { withGestationNote } from '~/utils/playbookForge/gestationNotes'

const CONCEPT = /^[a-z0-9][a-z0-9-]{0,80}$/
export default defineEventHandler(async (event) => {
  const auth = await requireAdminApiUser(event)
  const body = await readBody<{ conceptId?: unknown; note?: unknown }>(event)
  const conceptId = String(body?.conceptId ?? '').trim()
  const note = String(body?.note ?? '')
    .trim()
    .slice(0, 4000)
  if (!CONCEPT.test(conceptId))
    throw createError({
      statusCode: 400,
      statusMessage: 'A concept id is required.',
    })
  if (!note)
    throw createError({ statusCode: 400, statusMessage: 'Type a note first.' })

  const row = {
    at: new Date().toISOString(),
    by: auth.user.username || 'silas',
    note,
    status: 'open',
  }
  // One retry when the file changed between read and write.
  for (let attempt = 0; attempt < 2; attempt++) {
    const file = await conductorGet(GESTATION_NOTES)
    try {
      await conductorPut(
        GESTATION_NOTES,
        withGestationNote(file?.content ?? '', conceptId, row),
        `gestation: note on ${conceptId} from the Playbook Forge`,
        file?.sha,
      )
      return {
        success: true,
        message: 'Note saved for the next development.',
        data: row,
      }
    } catch (error) {
      if (attempt === 1) throw error
    }
  }
  throw createError({
    statusCode: 502,
    statusMessage: 'The note could not be saved.',
  })
})
