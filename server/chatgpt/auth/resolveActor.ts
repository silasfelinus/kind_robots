// /server/chatgpt/auth/resolveActor.ts
import type { H3Event } from 'h3'
import { requireMachineUser } from '~/server/utils/authGuard'

export type ChatGptActorRole = 'admin' | 'user'

export type ChatGptActorSource =
  | 'jwt'
  | 'beta-admin-token'
  | 'user-api-key'

export type ChatGptActor = {
  userId: number
  username: string
  role: ChatGptActorRole
  source: ChatGptActorSource
}

export async function resolveChatGptActor(
  event: H3Event,
): Promise<ChatGptActor> {
  const auth = await requireMachineUser(event)

  return {
    userId: auth.user.id,
    username: auth.user.username,
    role: auth.isAdmin ? 'admin' : 'user',
    source: auth.kind,
  }
}
