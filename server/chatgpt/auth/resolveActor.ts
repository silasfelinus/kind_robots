import { getHeader } from 'h3'

export type ChatGptActor = {
  userId: number
  username: string
  role: 'guest' | 'user' | 'admin' | 'system'
  source: 'guest' | 'user-token' | 'admin-token'
}

export async function resolveChatGptActor(event: any): Promise<ChatGptActor> {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()

  // No token: default to kindguests.
  if (!token) {
    return {
      userId: 10,
      username: 'kindguest',
      role: 'guest',
      source: 'guest',
    }
  }

  // Temporary admin token support.
  if (token === process.env.ADMIN_TOKEN) {
    return {
      userId: 1,
      username: 'admin',
      role: 'admin',
      source: 'admin-token',
    }
  }

  // Later: look up real user tokens here.
  return {
    userId: 10,
    username: 'kindguest',
    role: 'guest',
    source: 'guest',
  }
}
