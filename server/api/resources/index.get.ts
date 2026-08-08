// /server/api/resources/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '../../utils/authGuard'
import {
  resourceListSelect,
  resourceGallerySelect,
  resourceGalleryWhere,
  type ResourceGalleryRecord,
} from './gallery'
import { effectiveShowMature } from '~/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)
    const data = await prisma.resource.findMany({
      where: resourceGalleryWhere({
        userId: auth?.user.id ?? null,
        isAdmin: auth?.isAdmin ?? false,
        showMature: effectiveShowMature(auth?.user),
      }),
      // The LIST select, not the full one: this is every active Resource in
      // one response, so the per-row cost is the whole cost. The card back
      // fetches the rest by id when it opens.
      select: resourceListSelect,
      orderBy: [{ customLabel: 'asc' }, { name: 'asc' }],
    })

    return {
      success: true,
      message: 'Resources fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return {
      success,
      message: message || 'Failed to fetch resources.',
      data: null,
      statusCode: statusCode || 500,
    }
  }
})

export async function fetchAllResources(): Promise<ResourceGalleryRecord[]> {
  return await prisma.resource.findMany({
    where: { isActive: true },
    select: resourceGallerySelect,
    orderBy: [{ customLabel: 'asc' }, { name: 'asc' }],
  })
}
