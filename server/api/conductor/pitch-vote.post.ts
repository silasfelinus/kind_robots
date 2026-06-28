import { conductorGet, conductorPut } from '~/server/utils/conductor-github'

type PitchVote = 'approved' | 'passed'

export default defineEventHandler(async (event) => {
  const { slug, vote } = await readBody<{ slug: string; vote: PitchVote }>(event)

  if (!slug?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  }
  if (vote !== 'approved' && vote !== 'passed') {
    throw createError({ statusCode: 400, statusMessage: 'vote must be "approved" or "passed"' })
  }

  const path = `pitches/${slug}.md`
  const file = await conductorGet(path)

  if (!file) {
    throw createError({ statusCode: 404, statusMessage: `Pitch not found: ${slug}` })
  }

  const updated = file.content.replace(/^status:.*$/m, `status: ${vote}`)

  if (updated === file.content) {
    return { success: true, changed: false, path }
  }

  await conductorPut(path, updated, `vote: ${vote} ${slug}`, file.sha)

  return { success: true, changed: true, path }
})
