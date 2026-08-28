import type { User } from '~/prisma/generated/prisma/client'

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
