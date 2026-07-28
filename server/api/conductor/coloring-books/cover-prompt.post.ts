import { createError, defineEventHandler, readBody } from 'h3'
import type { ColoringBookCoverPromptUpdate } from '~/types/coloringBookStudio'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { conductorGet, conductorPut } from '@/server/utils/conductor-github'
import { coloringBookConfig } from '@/server/utils/coloringBookStudio'
import { COLORING_BOOK_COVER_QUEUE_PATH } from '@/server/utils/coloringBookCoverState'

function wrapYamlText(value: string, width = 100): string[] {
  const words = value.replace(/\r/g, '').replace(/\s+/g, ' ').trim().split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (!word) continue
    const next = current ? `${current} ${word}` : word
    if (next.length > width && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

function replaceCoverPrompt(
  content: string,
  bookSlug: string,
  prompt: string,
): string {
  const blocks = [...content.matchAll(/^- order:\s*\d+\s*$/gm)]
  const index = blocks.findIndex((match, position) => {
    const start = match.index ?? 0
    const end = blocks[position + 1]?.index ?? content.length
    return new RegExp(`^  book_slug:\s*${bookSlug}\s*$`, 'm').test(
      content.slice(start, end),
    )
  })
  if (index < 0) throw new Error(`Cover queue entry not found: ${bookSlug}`)

  const start = blocks[index]?.index ?? 0
  const end = blocks[index + 1]?.index ?? content.length
  const block = content.slice(start, end)
  const promptLine = /^  prompt:.*$/m.exec(block)
  if (!promptLine) throw new Error(`Cover prompt field not found: ${bookSlug}`)
  const promptStart = start + (promptLine.index ?? 0)
  const afterLine = promptStart + promptLine[0].length
  const continuation = content
    .slice(afterLine, end)
    .match(/^(?:\n(?: {4,}.*)?)*?\n(?=  [a-z_]+:)/)?.[0]
  const promptEnd = continuation
    ? afterLine + continuation.length - 1
    : afterLine
  const replacement = [
    '  prompt: >',
    ...wrapYamlText(prompt).map((line) => `    ${line}`),
  ].join('\n')
  return `${content.slice(0, promptStart)}${replacement}${content.slice(promptEnd)}`
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody(event)) as Partial<ColoringBookCoverPromptUpdate> | null
    const bookSlug = String(body?.bookSlug || '').trim().toLowerCase()
    const prompt = String(body?.prompt || '').replace(/\r/g, '').trim()

    if (!coloringBookConfig(bookSlug)) {
      throw createError({ statusCode: 400, message: 'Invalid coloring-book slug.' })
    }
    if (prompt.length < 40) {
      throw createError({
        statusCode: 400,
        message: 'The cover prompt must be at least 40 characters.',
      })
    }
    if (prompt.length > 8000) {
      throw createError({
        statusCode: 400,
        message: 'The cover prompt must be 8000 characters or fewer.',
      })
    }

    const source = await conductorGet(COLORING_BOOK_COVER_QUEUE_PATH)
    if (!source) {
      throw createError({ statusCode: 404, message: 'Canonical cover queue was not found.' })
    }
    const content = replaceCoverPrompt(source.content, bookSlug, prompt)
    await conductorPut(
      COLORING_BOOK_COVER_QUEUE_PATH,
      content,
      `coloring-book: update ${bookSlug} cover prompt`,
      source.sha,
    )

    return {
      success: true,
      message: `${bookSlug} cover prompt saved to the canonical Conductor queue.`,
      data: { bookSlug, prompt },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to update the coloring-book cover prompt.',
      statusCode,
    }
  }
})
