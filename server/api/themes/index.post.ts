// /server/api/themes/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'
import { validateApiKey } from '@/server/api/utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      event.node.res.statusCode = 401
      return { success: false, message: 'Invalid or expired token.' }
    }

    const body = await readBody(event)
    const userId = user.id

    const normalizeThemeInput = (entry: any) => {
      const { name, values, tagline, isPublic = false } = entry
      if (!name || typeof name !== 'string') {
        throw createError({ statusCode: 400, message: '"name" is required.' })
      }
      if (!values || typeof values !== 'object') {
        throw createError({
          statusCode: 400,
          message: '"values" must be a valid object.',
        })
      }
      return {
        name,
        tagline: tagline || null,
        values,
        isPublic,
        userId,
      }
    }

    // Handle batch create
    if (Array.isArray(body)) {
      if (body.length === 0) {
        throw createError({
          statusCode: 400,
          message: 'Theme array cannot be empty.',
        })
      }

      const validatedData = body.map(normalizeThemeInput)

      const createdThemes = await prisma.theme.createMany({
        data: validatedData,
        skipDuplicates: true,
      })

      event.node.res.statusCode = 201
      return {
        success: true,
        message: `${createdThemes.count} themes created successfully.`,
        count: createdThemes.count,
      }
    }

    // Handle single theme create
    const themeInput = normalizeThemeInput(body)

    const theme = await prisma.theme.create({ data: themeInput })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Theme created successfully.',
      theme,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to create theme(s).',
    }
  }
})
