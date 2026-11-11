/**
 * Server side of the Monstrique series bible. Every route gates on an ADMIN
 * session with mature content enabled, the same gate as the /admin/monstrique
 * preview. Prompt recipes live in ./monstriqueBibleArt (server-only).
 */
import { createError, type H3Event } from 'h3'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { viewerShowsMature } from '~/server/utils/contentAccess'
import {
  CHARACTER_IDS,
  type MonstriqueCharacterId,
} from '~/utils/monstrique/characterModels'
import type { BibleArtKind } from '~/utils/monstrique/bibleLanes'

export { bibleEnqueueBodies } from './monstriqueBibleArt'

export async function requireMonstriqueStudio(event: H3Event) {
  const auth = await requireAdminApiUser(event)
  if (!viewerShowsMature(auth.user))
    throw createError({ statusCode: 404, statusMessage: 'Not found.' })
  return auth
}

export function bibleCharacterKey(value: unknown): MonstriqueCharacterId {
  const key = String(value ?? '')
  if (!(CHARACTER_IDS as string[]).includes(key))
    throw createError({ statusCode: 404, statusMessage: 'Unknown character.' })
  return key as MonstriqueCharacterId
}

export interface BibleRequestRecord {
  jobId: number
  kind: BibleArtKind | 'swimsuit' | 'shower'
  lane: string
}

export function parseRequests(raw: string | null | undefined) {
  if (!raw) return [] as BibleRequestRecord[]
  try {
    const list = JSON.parse(raw)
    return Array.isArray(list)
      ? (list.filter(
          (row) =>
            row &&
            Number.isInteger(row.jobId) &&
            typeof row.kind === 'string' &&
            typeof row.lane === 'string',
        ) as BibleRequestRecord[])
      : []
  } catch {
    return []
  }
}
