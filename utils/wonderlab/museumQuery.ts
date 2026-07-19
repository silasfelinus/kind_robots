// /utils/wonderlab/museumQuery.ts
import {
  componentCatalogSorts,
  isComponentCatalogSort,
  type ComponentCatalogSort,
} from '@/utils/wonderlab/componentCatalog'
import { componentStatuses } from '@/utils/wonderlab/componentStatus'

export const wonderLabStatusFilters = componentStatuses
export const wonderLabCollectionViews = ['grid', 'list'] as const
export const wonderLabReviewFilters = ['all', 'reviewed', 'unreviewed'] as const
export const wonderLabDiscoveryFilters = ['all', 'discovered', 'missing'] as const

export type WonderLabStatusFilter =
  | 'all'
  | (typeof wonderLabStatusFilters)[number]
export type WonderLabCollectionView = (typeof wonderLabCollectionViews)[number]
export type WonderLabReviewFilter = (typeof wonderLabReviewFilters)[number]
export type WonderLabDiscoveryFilter = (typeof wonderLabDiscoveryFilters)[number]

export type WonderLabMuseumQueryState = {
  search: string
  folder: string
  status: WonderLabStatusFilter
  reviews: WonderLabReviewFilter
  discovery: WonderLabDiscoveryFilter
  sort: ComponentCatalogSort
  view: WonderLabCollectionView
}

export type WonderLabQueryValue =
  | string
  | null
  | undefined
  | Array<string | null>

export type WonderLabQuery = Record<string, WonderLabQueryValue>

const SEARCH_LIMIT = 160
const FOLDER_LIMIT = 160

function firstQueryValue(value: WonderLabQueryValue): string {
  if (Array.isArray(value)) {
    return value.find((entry): entry is string => typeof entry === 'string') || ''
  }

  return typeof value === 'string' ? value : ''
}

function normalizedText(value: WonderLabQueryValue, limit: number): string {
  return firstQueryValue(value).trim().slice(0, limit)
}

function normalizedStatus(value: WonderLabQueryValue): WonderLabStatusFilter {
  const candidate = normalizedText(value, 40).toUpperCase()

  return wonderLabStatusFilters.includes(
    candidate as (typeof wonderLabStatusFilters)[number],
  )
    ? (candidate as WonderLabStatusFilter)
    : 'all'
}

function normalizedReviewFilter(value: WonderLabQueryValue): WonderLabReviewFilter {
  const candidate = normalizedText(value, 24).toLowerCase()
  return wonderLabReviewFilters.includes(candidate as WonderLabReviewFilter)
    ? (candidate as WonderLabReviewFilter)
    : 'all'
}

function normalizedDiscoveryFilter(
  value: WonderLabQueryValue,
): WonderLabDiscoveryFilter {
  const candidate = normalizedText(value, 24).toLowerCase()
  return wonderLabDiscoveryFilters.includes(
    candidate as WonderLabDiscoveryFilter,
  )
    ? (candidate as WonderLabDiscoveryFilter)
    : 'all'
}

function normalizedSort(value: WonderLabQueryValue): ComponentCatalogSort {
  const candidate = normalizedText(value, 40).toUpperCase()
  return isComponentCatalogSort(candidate) ? candidate : 'NAME'
}

function normalizedView(value: WonderLabQueryValue): WonderLabCollectionView {
  const candidate = normalizedText(value, 16).toLowerCase()
  return wonderLabCollectionViews.includes(candidate as WonderLabCollectionView)
    ? (candidate as WonderLabCollectionView)
    : 'grid'
}

export function normalizeWonderLabMuseumQuery(
  query: WonderLabQuery,
): WonderLabMuseumQueryState {
  return {
    search: normalizedText(query.q, SEARCH_LIMIT),
    folder: normalizedText(query.folder, FOLDER_LIMIT),
    status: normalizedStatus(query.status),
    reviews: normalizedReviewFilter(query.reviews),
    discovery: normalizedDiscoveryFilter(query.discovery),
    sort: normalizedSort(query.sort),
    view: normalizedView(query.view),
  }
}

export function wonderLabMuseumQuery(
  currentQuery: WonderLabQuery,
  state: WonderLabMuseumQueryState,
): WonderLabQuery {
  const query: WonderLabQuery = { ...currentQuery }
  const search = state.search.trim().slice(0, SEARCH_LIMIT)
  const folder = state.folder.trim().slice(0, FOLDER_LIMIT)

  if (search) query.q = search
  else delete query.q

  if (folder) query.folder = folder
  else delete query.folder

  if (state.status === 'all') delete query.status
  else query.status = state.status

  if (state.reviews === 'all') delete query.reviews
  else query.reviews = state.reviews

  if (state.discovery === 'all') delete query.discovery
  else query.discovery = state.discovery

  if (state.sort === 'NAME') delete query.sort
  else query.sort = state.sort

  if (state.view === 'grid') delete query.view
  else query.view = state.view

  return query
}

export function sameWonderLabMuseumQuery(
  left: WonderLabMuseumQueryState,
  right: WonderLabMuseumQueryState,
): boolean {
  return (
    left.search === right.search &&
    left.folder === right.folder &&
    left.status === right.status &&
    left.reviews === right.reviews &&
    left.discovery === right.discovery &&
    left.sort === right.sort &&
    left.view === right.view
  )
}

export { componentCatalogSorts }
export type { ComponentCatalogSort }
