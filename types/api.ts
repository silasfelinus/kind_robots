import type { User } from '~/prisma/generated/prisma/client'

// Shared shape for the take/skip/total pagination `meta` several list
// endpoints return (server/api/aquarium/browse/index.get.ts,
// server/api/aquarium/leaderboard.get.ts, and others following the same
// convention). Callers that only need pagination -- not a route-specific
// extra field like catalog.get.ts's `dateKey` -- can use
// `performFetch<T, PaginationMeta>(url)` directly instead of hand-casting
// the result (cthulhuquarium/t-061).
export type PaginationMeta = {
  take: number
  skip: number
  total: number
}

export type ApiResponse<T = unknown, M = unknown> = {
  success: boolean
  message: string
  data?: T
  // Optional out-of-band info alongside `data` -- pagination (take/skip/
  // total), a rotation dateKey, etc. Several server routes already return a
  // `meta` object (server/api/aquarium/catalog.get.ts among them); this was
  // simply dropped by performFetch until cthulhuquarium/t-057 threaded it
  // through. Untyped here (M defaults to unknown) -- each caller narrows to
  // its own endpoint's actual meta shape.
  meta?: M
  statusCode?: number
  user?: User
  token?: string
  apiKey?: string
  usernames?: string[]
}
