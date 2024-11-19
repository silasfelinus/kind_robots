// server/api/utils/validateKey.ts
import { createError, type H3Event } from 'h3'
import prisma from './prisma'

export async function validateApiKey(event: H3Event): Promise<{
  isValid: boolean
  user?: { id: number }
}> {
  // Extract authorization header
  const authorizationHeader = event.node.req.headers['authorization']

  // Check for valid Bearer token format
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message:
        'Authorization token is required in the format "Bearer <token>".',
    })
  }

  // Extract token
  const token = authorizationHeader.split(' ')[1]

  // Find user with matching apiKey
  const user =
    (await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true, Role: true },
    })) ?? undefined // Convert null to undefined for compatibility

console.log("sending user", user)
  // Return user and validation flag based on match
  return { isValid: !!user, user }
}
