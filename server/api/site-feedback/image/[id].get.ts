import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { readArtImageBytes } from '~/server/utils/artImageBytes'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw createError({ statusCode: 404, message: 'Screenshot not found.' })
  }

  const image = await prisma.artImage.findFirst({
    where: {
      id,
      designer: 'site-feedback',
      isActive: true,
      isPublic: true,
      isMature: false,
    },
    select: { id: true, fileType: true },
  })
  if (!image || !['png', 'jpeg', 'webp'].includes(image.fileType ?? '')) {
    throw createError({ statusCode: 404, message: 'Screenshot not found.' })
  }

  const bytes = await readArtImageBytes(image.id)
  if (!bytes || !['png', 'jpeg', 'webp'].includes(bytes.fileType)) {
    throw createError({ statusCode: 404, message: 'Screenshot not found.' })
  }

  setHeader(event, 'Content-Type', 'image/' + bytes.fileType)
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return Buffer.from(bytes.base64, 'base64')
})
