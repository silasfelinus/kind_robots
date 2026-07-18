// /utils/wonderlab/museumQuery.ts
export const wonderLabStatusFilters = [
  'UNREVIEWED',
  'WORKING',
  'UNDER_CONSTRUCTION',
  'BROKEN',
] as const

export type WonderLabStatusFilter =
  | 'all'
  | (typeof wonderLabStatusFilters)[number]

export type WonderLabMuseumQueryState = {
  search: string
  folder: string
  status: WonderLabStatusFilter
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

export function normalizeWonderLabMuseumQuery(
  query: WonderLabQuery,
): WonderLabMuseumQueryState {
  return {
    search: normalizedText(query.q, SEARCH_LIMIT),
    folder: normalizedText(query.folder, FOLDER_LIMIT),
    status: normalizedStatus(query.status),
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

  return query
}

export function sameWonderLabMuseumQuery(
  left: WonderLabMuseumQueryState,
  right: WonderLabMuseumQueryState,
): boolean {
  return (
    left.search === right.search &&
    left.folder === right.folder &&
    left.status === right.status
  )
}
