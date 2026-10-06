// /server/api/music-video/import.post.ts
//
// Create a fully set-up music video from a prepared spec (music-video/t-033):
// pitch, settings, lyrics, scenes on the beat grid with prompts, and hero
// shots with their animation prompts, in one call. Body: { specKey } for a
// bundled spec (utils/musicVideoSpecs.ts), or { spec } with the same shape.
// Press Produce afterwards and it skips straight to the steps still missing.
import { promises as fs } from 'node:fs'
import path from 'node:path'
import {
  createError,
  defineEventHandler,
  getRequestURL,
  readBody,
  type H3Event,
} from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { getImageStorageRoot } from '@/server/utils/imageStorageRoot'
import { uploadArtImage } from '@/server/utils/UploadArtImage'
import {
  cleanMusicVideoTitle,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'
import {
  musicVideoSpecByKey,
  specToDoc,
  type MusicVideoSpec,
} from '@/utils/musicVideoSpecs'
import {
  normalizeMusicVideoDoc,
  type MusicVideoScene,
  type MusicVideoSong,
} from '@/utils/musicVideoDoc'
import { buildSongTags } from '@/utils/musicVideoSong'
import {
  adoptDeletedStills,
  adoptSong,
  firstStillAt,
  type RecoverableJob,
} from '@/utils/musicVideoRecover'
import { MUSIC_VIDEO_PROJECT_SLUG } from '@/server/utils/musicVideoScenes'

type ImportBody = {
  specKey?: unknown
  spec?: unknown
  title?: unknown
  /** Reuse the song and stills of a deleted copy of this spec. */
  reuseDeleted?: unknown
}

type JobRow = {
  id: number
  status: string
  createdAt: Date
  artImageId: number | null
  payload: string
}

function parseJob(row: JobRow): RecoverableJob {
  let payload: Record<string, unknown> = {}
  try {
    const parsed: unknown = JSON.parse(row.payload)
    if (parsed && typeof parsed === 'object') {
      payload = parsed as Record<string, unknown>
    }
  } catch {
    // An unreadable payload simply matches nothing.
  }
  return { ...row, payload }
}

/*
 * Silas, 2026-10-06: restore the classic theme song "using the song we already
 * made and the art being processed". Finds the newest deleted video whose
 * stills match this spec's scenes and the song made just before them.
 */
async function recoverDeleted(
  userId: number,
  scenes: MusicVideoScene[],
  songTags: string,
): Promise<{
  scenes: MusicVideoScene[]
  song: MusicVideoSong | null
  notes: string[]
}> {
  const select = {
    id: true,
    status: true,
    createdAt: true,
    artImageId: true,
    payload: true,
  } as const
  const stillRows = await prisma.artJob.findMany({
    where: {
      userId,
      projectSlug: MUSIC_VIDEO_PROJECT_SLUG,
      payload: { contains: '"musicVideo":{' },
    },
    select,
    orderBy: { createdAt: 'desc' },
    take: 400,
  })
  const stills = stillRows.map(parseJob)
  const videoIds = [
    ...new Set(
      stills
        .map(
          (job) => (job.payload.musicVideo as { videoId?: unknown })?.videoId,
        )
        .filter((id): id is number => typeof id === 'number'),
    ),
  ]
  const live = new Set(
    (
      await prisma.musicVideo.findMany({
        where: { id: { in: videoIds } },
        select: { id: true },
      })
    ).map((video) => video.id),
  )
  const recovery = adoptDeletedStills({ scenes }, stills, live)
  if (recovery.fromVideoId === null) {
    return { scenes, song: null, notes: recovery.notes }
  }
  const before = firstStillAt(stills, recovery.fromVideoId)
  const songRows = await prisma.artJob.findMany({
    where: {
      userId,
      projectSlug: MUSIC_VIDEO_PROJECT_SLUG,
      status: 'DONE',
      payload: { contains: '"engine":"acestep"' },
      ...(before ? { createdAt: { lte: before } } : {}),
    },
    select,
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  const song = adoptSong(songRows.map(parseJob), songTags)
  return {
    scenes: recovery.scenes,
    song,
    notes: [
      ...recovery.notes,
      song
        ? `Reused its song (ArtJob ${song.jobId}).`
        : 'Its song was not found, so Produce will make a new one.',
    ],
  }
}

function readSpec(body: ImportBody): MusicVideoSpec {
  if (typeof body.specKey === 'string') {
    const spec = musicVideoSpecByKey(body.specKey.trim())
    if (!spec) {
      throw createError({
        statusCode: 404,
        message: `No prepared spec "${body.specKey}".`,
      })
    }
    return spec
  }
  const spec = body.spec as Partial<MusicVideoSpec> | undefined
  if (
    !spec ||
    typeof spec !== 'object' ||
    !spec.settings ||
    typeof spec.settings !== 'object' ||
    !Array.isArray(spec.scenes) ||
    spec.scenes.some(
      (row) =>
        !row ||
        typeof row !== 'object' ||
        !(Number(row.beats) > 0) ||
        typeof row.prompt !== 'string',
    )
  ) {
    throw createError({
      statusCode: 400,
      message:
        'Send { specKey } or a { spec } with settings and scenes (each with beats and a prompt).',
    })
  }
  return {
    ...spec,
    key: String(spec.key ?? 'custom'),
    title: String(spec.title ?? ''),
    summary: '',
    pitch: String(spec.pitch ?? ''),
    sections: Array.isArray(spec.sections) ? spec.sections : [],
  } as MusicVideoSpec
}

const SITE_IMAGE = /^\/images\/[A-Za-z0-9_\-/]+\.(webp|png|jpe?g)$/
const MAX_SITE_IMAGE_BYTES = 15 * 1024 * 1024

/*
 * The bytes of a site image such as the logo (Silas, 2026-10-06: "use our
 * logo as one of the images, or two"). /images/... is served by the media
 * origin, so read the storage root first and fall back to the site's own URL.
 */
async function loadSiteImage(
  event: H3Event,
  sitePath: string,
): Promise<Buffer | null> {
  if (!SITE_IMAGE.test(sitePath) || sitePath.includes('..')) return null
  const root = getImageStorageRoot()
  const absolute = path.resolve(root, sitePath.slice('/images/'.length))
  if (absolute.startsWith(root + path.sep)) {
    try {
      const bytes = await fs.readFile(absolute)
      if (bytes.length && bytes.length <= MAX_SITE_IMAGE_BYTES) return bytes
    } catch {
      // Not on this host's disk; try the public URL.
    }
  }
  try {
    const origin = getRequestURL(event, {
      xForwardedHost: true,
      xForwardedProto: true,
    }).origin
    const response = await fetch(`${origin}${sitePath}`, {
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) return null
    const bytes = Buffer.from(await response.arrayBuffer())
    return bytes.length && bytes.length <= MAX_SITE_IMAGE_BYTES ? bytes : null
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body = (await readBody<ImportBody>(event)) ?? {}
    const spec = readSpec(body)
    const raw = specToDoc(spec)
    const warnings: string[] = []

    let comicSeriesId: number | undefined
    if (spec.comicSeriesSlug) {
      const series = await prisma.comicSeries.findUnique({
        where: { slug: spec.comicSeriesSlug },
        select: { id: true, isArchived: true },
      })
      // Silas, 2026-10-06: the Zuzu comic is not made yet, but the video
      // should still load as a proof of concept. Without the series, stills
      // render through the spec's own imageLaneKey (its checkpoint) instead.
      if (!series || series.isArchived) {
        warnings.push(
          `Comic series "${spec.comicSeriesSlug}" was not found, so stills render with the ${spec.settings.imageLaneKey ?? 'default'} checkpoint and no series style.`,
        )
      } else {
        comicSeriesId = series.id
      }
    }

    // A keyframe that no longer exists becomes a fresh still, not a failure.
    const keyframeIds = [
      ...new Set(
        raw.scenes
          .map((scene) => scene.image.artImageId)
          .filter((id): id is number => typeof id === 'number'),
      ),
    ]
    const found = new Set(
      keyframeIds.length
        ? (
            await prisma.artImage.findMany({
              where: { id: { in: keyframeIds } },
              select: { id: true },
            })
          ).map((image) => image.id)
        : [],
    )
    const scenes = raw.scenes.map((scene) => {
      const id = scene.image.artImageId
      if (!id || found.has(id)) return scene
      warnings.push(
        `Scene ${scene.id}: ArtImage ${id} was not found, so it renders a fresh still.`,
      )
      return { ...scene, image: { source: 'generated' as const } }
    })

    // Site images (the logo, a bot's portrait) become private ArtImages on
    // their scenes; one that cannot be read leaves the scene to its prompt.
    const copied = new Map<string, number>()
    for (const [index, row] of spec.scenes.entries()) {
      const scene = scenes[index]
      if (!row.siteImage || !scene) continue
      let artImageId = copied.get(row.siteImage)
      if (!artImageId) {
        const bytes = await loadSiteImage(event, row.siteImage)
        if (bytes) {
          const fileName = path.basename(row.siteImage)
          const image = await uploadArtImage({
            uploadedFile: { data: bytes, filename: fileName },
            userId: auth.user.id,
            galleryName: 'music-video',
            fileType: path.extname(fileName).slice(1),
            fileName,
            promptString: scene.prompt.slice(0, 2000),
            designer: 'Music Video',
            isPublic: false,
            isMature: false,
          })
          artImageId = image.id
          copied.set(row.siteImage, artImageId)
        }
      }
      if (artImageId) {
        scenes[index] = {
          ...scene,
          image: { source: 'upload', artImageId },
        }
      } else {
        warnings.push(
          `Scene ${scene.id}: ${row.siteImage} could not be read, so it renders its prompt instead.`,
        )
      }
    }

    let finalScenes = scenes
    let song: MusicVideoSong | null = null
    if (body.reuseDeleted === true) {
      const recovered = await recoverDeleted(
        auth.user.id,
        scenes,
        buildSongTags(normalizeMusicVideoDoc(raw).doc),
      )
      finalScenes = recovered.scenes
      song = recovered.song
      warnings.push(...recovered.notes)
    }

    const doc = serializeValidatedDoc({
      ...raw,
      settings: {
        ...raw.settings,
        ...(comicSeriesId ? { comicSeriesId } : {}),
      },
      scenes: finalScenes,
      ...(song ? { song } : {}),
    })
    const record = await prisma.musicVideo.create({
      data: {
        userId: auth.user.id,
        title: cleanMusicVideoTitle(
          body.title ?? spec.title,
          'Untitled music video',
        ),
        doc,
      },
    })
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: warnings.length
        ? `Music video created. ${warnings.join(' ')}`
        : 'Music video created from the prepared spec.',
      data: toMusicVideoDto(record),
      warnings,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
