import { conductorPut } from '~/server/utils/conductor-github'

export default defineEventHandler(async (event) => {
  const { title, summary, target, effort, why, firstTask } = await readBody<{
    title: string
    summary: string
    target: string
    effort?: string
    why?: string
    firstTask?: string
  }>(event)

  if (!title?.trim() || !summary?.trim() || !target?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'title, summary, and target are required',
    })
  }

  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  const path = `pitches/${date}-${slug}.md`

  const content = [
    `# Pitch: ${title}`,
    `date: ${date}`,
    `project-target: ${target}`,
    `status: awaiting-silas`,
    '',
    `## The idea`,
    summary.trim(),
    '',
    `## Why it's worth doing`,
    why?.trim() || '(to be filled)',
    '',
    `## Rough effort`,
    effort || 'medium',
    '',
    `## Suggested first task`,
    firstTask?.trim() || '(to be filled)',
  ].join('\n') + '\n'

  await conductorPut(
    path,
    content,
    `pitch: ${title.slice(0, 72)} (from workspace)`,
  )

  return { success: true, path }
})
