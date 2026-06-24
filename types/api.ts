import type { User } from '~/prisma/generated/prisma/client'

export type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  statusCode?: number
  user?: User
  token?: string
  apiKey?: string
  usernames?: string[]
}
