// /utils/wonderlab/componentCatalog.ts
import type { Component } from '~/prisma/generated/prisma/client'
import {
  getComponentStatus,
  type ComponentStatus,
} from '@/utils/wonderlab/componentStatus'

export type ComponentCatalogMetrics = {
  reviewCount?: number
  ratingCount?: number
  averageRating?: number | null
  lastReviewedAt?: string | null
}

export type ComponentCatalogItem = Component & ComponentCatalogMetrics

export const componentCatalogSorts = [
  'NAME',
  'STATUS',
  'RATING',
  'REVIEWS',
  'RECENTLY_CHANGED',
  'RECENTLY_REVIEWED',
] as const

export type ComponentCatalogSort = (typeof componentCatalogSorts)[number]

const statusOrder: Record<ComponentStatus, number> = {
  BROKEN: 0,
  UNDER_CONSTRUCTION: 1,
  UNREVIEWED: 2,
  NEEDS_CONTEXT: 3,
  PREVIEW_UNSUPPORTED: 4,
  WORKING: 5,
  RETIRED: 6,
}

function text(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function label(item: ComponentCatalogItem): string {
  return text(item.title) || text(item.componentName) || `Component ${item.id}`
}

function epoch(value: Date | string | null | undefined): number {
  if (!value) return 0
  const date = value instanceof Date ? value : new Date(value)
  const timestamp = date.getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function descendingNumber(
  left: number | null | undefined,
  right: number | null | undefined,
): number {
  return (right ?? 0) - (left ?? 0)
}

function tieBreak(left: ComponentCatalogItem, right: ComponentCatalogItem): number {
  const nameOrder = label(left).localeCompare(label(right), 'en', {
    sensitivity: 'base',
    numeric: true,
  })

  return nameOrder || left.id - right.id
}

export function isComponentCatalogSort(
  value: unknown,
): value is ComponentCatalogSort {
  return (
    typeof value === 'string' &&
    componentCatalogSorts.includes(value as ComponentCatalogSort)
  )
}

export function sortComponentCatalog(
  items: ComponentCatalogItem[],
  sort: ComponentCatalogSort = 'NAME',
): ComponentCatalogItem[] {
  return [...items].sort((left, right) => {
    let order = 0

    switch (sort) {
      case 'STATUS':
        order =
          statusOrder[getComponentStatus(left)] -
          statusOrder[getComponentStatus(right)]
        break
      case 'RATING':
        order = descendingNumber(left.averageRating, right.averageRating)
        if (!order) {
          order = descendingNumber(left.ratingCount, right.ratingCount)
        }
        break
      case 'REVIEWS':
        order = descendingNumber(left.reviewCount, right.reviewCount)
        break
      case 'RECENTLY_CHANGED':
        order =
          epoch(right.updatedAt ?? right.createdAt) -
          epoch(left.updatedAt ?? left.createdAt)
        break
      case 'RECENTLY_REVIEWED':
        order = epoch(right.lastReviewedAt) - epoch(left.lastReviewedAt)
        break
      case 'NAME':
      default:
        break
    }

    return order || tieBreak(left, right)
  })
}
