import { defineEventHandler, readBody, createError } from 'h3'
import { conductorGet, conductorPut } from '~/server/utils/conductor-github'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const message = String(body?.message ?? '').trim()
  if (!message) throw createError({ statusCode: 400, message: 'message required' })
  const type = String(body?.type ?? 'general').trim()
  const timestamp = new Date().toISOString()

  const file = await conductorGet('INBOX.md')
  const current = file?.content ?? '# Conductor Inbox\n\nMessages from the Workspace UI, newest first.\n\n---'

  // Prepend new entry after first --- separator (newest first)
  const entry = `\n**[${timestamp}]** (${type})\n\n${message}\n\n---`
  const insertAt = current.indexOf('\n---')
  const updated =
    insertAt === -1
      ? current + entry
      : current.slice(0, insertAt) + entry + current.slice(insertAt + 4)

  await conductorPut('INBOX.md', updated, `inbox: workspace message (${type})`, file?.sha)

  return { ok: true, timestamp }
})
