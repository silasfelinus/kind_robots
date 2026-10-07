import { createError, getRouterParam, type H3Event } from 'h3'
import prisma from '@/server/utils/prisma'
import {
  MUSIC_VIDEO_LIMITS,
  normalizeMusicVideoDoc,
  parseStoredMusicVideoDoc,
  serializeMusicVideoDoc,
  type MusicVideoDoc,
} from '@/utils/musicVideoDoc'

export type MusicVideoRecord = {
  id: number
  createdAt: Date
  updatedAt: Date
  userId: number
  title: string
  status: string
  doc: string
  finalArtImageId: number | null
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
