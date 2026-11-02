import { createError, defineEventHandler, readBody } from 'h3'
import { requireSpaceCouchCollector } from '~/server/utils/spaceCouchAlienAuth'
import { saveSpaceCouchAlienGuide } from '~/server/utils/spaceCouchAlienGuide'

export default defineEventHandler(async (event) => {
  const auth = await requireSpaceCouchCollector(event)
  const body = await readBody<unknown>(event)
  const serialized = JSON.stringify(body ?? null)
  if (serialized.length > 128_000)
    throw createError({ statusCode: 413, message: 'Alien guide exceeds save limit.' })
  return {
    success: true,
    data: await saveSpaceCouchAlienGuide(auth.user.id, body),
  }
})
