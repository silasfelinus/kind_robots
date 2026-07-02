import { conductorPut } from '~/server/utils/conductor-github'
import { requireAdminApiUser } from '@/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)

  const { message, project } = await readBody<{ message: string; project?: string }>(event)

  if (!message?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'message is required' })
  }

  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const ts = now.getTime()
  const path = `inbox/${date}-${ts}.md`

  const lines = [
    `# Silas Note — ${now.toISOString()}`,
    ...(project ? [`**Project:** \`${project}\``] : []),
    '',
    message.trim(),
  ]

  await conductorPut(
    path,
    lines.join('\n') + '\n',
    `inbox: note from Silas via workspace [${date}]`,
  )

  return { success: true, path }
})
