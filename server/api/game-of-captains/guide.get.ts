import { defineEventHandler } from 'h3'
import { requireSpaceCouchCollector } from '~/server/utils/spaceCouchAlienAuth'
import { getSpaceCouchAlienGuide } from '~/server/utils/spaceCouchAlienGuide'

export default defineEventHandler(async (event) => {
  const auth = await requireSpaceCouchCollector(event)
  return {
    success: true,
    data: await getSpaceCouchAlienGuide(auth.user.id),
  }
})
