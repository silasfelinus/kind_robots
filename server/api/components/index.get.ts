// /server/api/components/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { getOptionalApiUser } from '../../utils/authGuard'
import type { ComponentCatalogItem } from '@/utils/wonderlab/componentCatalog'

export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)
    const [components, reactionGroups] = await Promise.all([
      prisma.component.findMany({
        orderBy: [{ componentName: 'asc' }, { id: 'asc' }],
      }),
      prisma.reaction.groupBy({
        by: ['componentId'],
        where: {
          componentId: { not: null },
          reactionCategory: 'COMPONENT',
        },
        _count: {
          _all: true,
          rating: true,
        },
        _avg: {
          rating: true,
        },
        _max: {
          createdAt: true,
        },
      }),
    ])

    const metricsByComponentId = new Map<
      number,
      Pick<
        ComponentCatalogItem,
        'reviewCount' | 'ratingCount' | 'averageRating' | 'lastReviewedAt'
      >
    >()

    for (const group of reactionGroups) {
      if (!group.componentId) continue

      metricsByComponentId.set(group.componentId, {
        reviewCount: group._count._all,
        ratingCount: group._count.rating,
        averageRating: group._avg.rating,
        lastReviewedAt: group._max.createdAt?.toISOString() ?? null,
      })
    }

    const data = components.map((component) => {
      const metrics = metricsByComponentId.get(component.id)
      const catalogItem = {
        ...component,
        reviewCount: metrics?.reviewCount ?? 0,
        ratingCount: metrics?.ratingCount ?? 0,
        averageRating: metrics?.averageRating ?? null,
        lastReviewedAt: metrics?.lastReviewedAt ?? null,
      }

      if (auth?.isAdmin) return catalogItem

      const { notes: _internalNotes, ...publicCatalogItem } = catalogItem
      return publicCatalogItem
    })

    return {
      success: true,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)

    return {
      success: false,
      message: handledError.message || 'Failed to fetch components.',
      data: [],
      statusCode: handledError.statusCode || 500,
    }
  }
})
