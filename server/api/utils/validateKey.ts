// /server/api/utils/validateKey.ts
import { type H3Event } from 'h3'
import prisma from './prisma'

export async function validateApiKey(event: H3Event): Promise<{
  isValid: boolean
  user?: {
    Role: string
    id: number
  }
}> {
  // Extract authorization header
  const authorizationHeader = event.node.req.headers['authorization']

  // Gracefully fail if no token or bad format
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { isValid: false }
  }

  // Extract token
  const token = authorizationHeader.split(' ')[1]

  // Find user with matching apiKey
  const user =
    (await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true, Role: true },
    })) ?? undefined

  console.log('sending user', user)

  return { isValid: !!user, user }
}
