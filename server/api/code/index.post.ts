// /server/api/code/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import type { Code, Prisma } from '~/prisma/generated/prisma/client'

type CodeCreateBody = Partial<
  Pick<
    Code,
    | 'title'
    | 'description'
    | 'icon'
    | 'isPublic'
    | 'isOfficial'
    | 'isActive'
  >
> & {
  graph?: unknown
}

function normalizeGraph(graph: unknown): string {
  let parsed = graph

  if (typeof graph === 'string') {
    try {
      parsed = JSON.parse(graph)
    } catch {
      throw createError({
        statusCode: 400,
        message: 'The graph field must contain valid JSON.',
      })
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw createError({
      statusCode: 400,
      message: 'A valid graph object is required.',
    })
  }

  return typeof graph === 'string' ? graph : JSON.stringify(parsed)
}

export default defineEventHandler(async (event) => {
  const singularLabel = 'Code'
  const pluralLabel = 'Codes'

  try {
    const { user } = await requireApiUser(event)
    const body = await readBody<CodeCreateBody | CodeCreateBody[]>(event)

    const normalize = (entry: CodeCreateBody): Prisma.CodeCreateInput => {
      const title = entry.title?.trim()

      if (!title) {
        throw createError({
          statusCode: 400,
          message: 'Code title is required.',
        })
      }

      const isAdmin = user.Role === 'ADMIN'

      return {
        title,
        description: entry.description?.trim() || null,
        icon: entry.icon?.trim() || 'kind-icon:blocks',
        graph: normalizeGraph(entry.graph),
        isPublic: entry.isPublic ?? false,
        isOfficial: isAdmin ? (entry.isOfficial ?? false) : false,
        isActive: entry.isActive ?? true,
        User: { connect: { id: user.id } },
      }
    }

    if (Array.isArray(body)) {
      const created: Code[] = []

      for (const entry of body) {
        const data = normalize(entry)
        const result = await prisma.code.create({ data })
        created.push(result)
      }

      event.node.res.statusCode = 201
      return {
        success: true,
        message: `${created.length} ${pluralLabel} created successfully.`,
        data: created,
        count: created.length,
        statusCode: 201,
      }
    }

    const data = await prisma.code.create({
      data: normalize(body),
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: `${singularLabel} created successfully.`,
      data,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to create ${singularLabel}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
