import { createError } from 'h3'
import prisma from '~/server/utils/prisma'

const PAGE_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/
export const MAX_PROJECT_PAGE_CONTENT_CHARS = 250_000

export function normalizeProjectPageKey(value: unknown): string {
  const pageKey = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!PAGE_KEY_PATTERN.test(pageKey)) {
    throw createError({
      statusCode: 400,
      message: 'Page key must be 1-128 lowercase letters, numbers, or hyphens.',
    })
  }
  return pageKey
}

export function normalizeProjectPageContent(value: unknown): string {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Project page content must be serialized text.',
    })
  }
  if (value.length > MAX_PROJECT_PAGE_CONTENT_CHARS) {
    throw createError({
      statusCode: 413,
      message: 'Project page content is too large.',
    })
  }
  return value
}

export async function resolveProjectPageProject(projectKey: string) {
  const normalized = projectKey.trim()
  if (!normalized) {
    throw createError({ statusCode: 400, message: 'Project key is required.' })
  }

  const id = Number(normalized)
  const project = await prisma.project.findFirst({
    where:
      Number.isInteger(id) && id > 0
        ? { id }
        : { OR: [{ slug: normalized }, { conductorSlug: normalized }] },
    select: {
      id: true,
      title: true,
      slug: true,
      conductorSlug: true,
    },
  })

  if (!project) {
    throw createError({ statusCode: 404, message: 'Project not found.' })
  }

  return project
}
