import { createError, getRouterParam, type H3Event } from 'h3'
import prisma from '@/server/utils/prisma'
import {
  MUSIC_VIDEO_LIMITS,
  normalizeMusicVideoDoc,
  parseStoredMusicVideoDoc,
  serializeMusicVideoDoc,
  type MusicVideoDoc,
} from '@/utils/musicVideoDoc'
import {
  canViewMusicVideo,
  type MusicVideoFinalCut,
  type MusicVideoViewer,
} from '@/utils/musicVideoAccess'

export type MusicVideoRecord = {
  id: number
  createdAt: Date
  updatedAt: Date
  userId: number
  title: string
  status: string
  doc: string
  finalArtImageId: number | null
  isPublic: boolean
}

export type MusicVideoDto = Omit<MusicVideoRecord, 'doc'> & {
  doc: MusicVideoDoc
}

export function toMusicVideoDto(record: MusicVideoRecord): MusicVideoDto {
  return { ...record, doc: parseStoredMusicVideoDoc(record.doc) }
}

let packetBytes: Promise<number | null> | null = null

/** The database's max_allowed_packet in bytes, cached; null when it cannot be read. */
export function readDbMaxPacketBytes(): Promise<number | null> {
  packetBytes ??= prisma.$queryRaw<
    Array<{ packet: number | bigint }>
  >`SELECT @@max_allowed_packet AS packet`
    .then((rows) => {
      const value = Number(rows[0]?.packet)
      return Number.isFinite(value) && value > 0 ? value : null
    })
    .catch(() => {
      packetBytes = null
      return null
    })
  return packetBytes
}

export function readMusicVideoId(event: H3Event): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid music video id.' })
  }
  return id
}

export async function loadOwnedMusicVideo(
  id: number,
  userId: number,
): Promise<MusicVideoRecord> {
  const record = await prisma.musicVideo.findFirst({ where: { id, userId } })
  if (!record)
    throw createError({ statusCode: 404, message: 'Music video not found.' })
  return record
}

/** Final-cut ArtImages by id, with only what access needs. */
export async function loadMusicVideoFinals(
  ids: Array<number | null>,
): Promise<Map<number, NonNullable<MusicVideoFinalCut>>> {
  const wanted = [
    ...new Set(ids.filter((id): id is number => typeof id === 'number')),
  ]
  if (!wanted.length) return new Map()
  const rows = await prisma.artImage.findMany({
    where: { id: { in: wanted } },
    select: { id: true, userId: true, isActive: true, isMature: true },
  })
  return new Map(rows.map(({ id, ...final }) => [id, final]))
}

/**
 * A video this viewer may see (their own, or someone's public finished one),
 * with its final cut. Anything else answers exactly like a missing row.
 */
export async function loadViewableMusicVideo(
  id: number,
  viewer: MusicVideoViewer,
): Promise<{ record: MusicVideoRecord; final: MusicVideoFinalCut }> {
  const record = await prisma.musicVideo.findUnique({ where: { id } })
  const final = record?.finalArtImageId
    ? ((await loadMusicVideoFinals([record.finalArtImageId])).get(
        record.finalArtImageId,
      ) ?? null)
    : null
  if (!record || !canViewMusicVideo(record, final, viewer)) {
    throw createError({ statusCode: 404, message: 'Music video not found.' })
  }
  return { record, final }
}

export function cleanMusicVideoTitle(value: unknown, fallback = ''): string {
  const title =
    typeof value === 'string'
      ? value.trim().slice(0, MUSIC_VIDEO_LIMITS.maxTitle)
      : ''
  return title || fallback
}

export function serializeValidatedDoc(raw: unknown): string {
  const { doc, errors } = normalizeMusicVideoDoc(raw)
  if (errors.length) {
    throw createError({
      statusCode: 400,
      message: `Music video document is invalid: ${errors.slice(0, 5).join(' ')}`,
      data: { errors },
    })
  }
  const serialized = serializeMusicVideoDoc(doc)
  if (Buffer.byteLength(serialized, 'utf8') > MUSIC_VIDEO_LIMITS.maxDocBytes) {
    throw createError({
      statusCode: 413,
      message: 'Music video document is too large.',
    })
  }
  return serialized
}
