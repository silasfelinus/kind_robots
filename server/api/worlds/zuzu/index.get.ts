import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import {
  attachGalleryArchiveMediaPaths,
  galleryThumbnailUrl,
} from '~/server/utils/artGalleryArchiveMedia'
import { loadZuzuArtLedger } from '~/server/utils/zuzuWorldLedger'
import {
  ZUZU_ASSET_PAGE_SIZE,
  ZUZU_PROJECTS,
  isZuzuProjectSlug,
  type ZuzuAsset,
  type ZuzuProject,
  type ZuzuWorldPage,
} from '~/utils/zuzuWorld'

const VIDEO_FORMATS = /^(?:video\/|mp4$|webm$|mov$|m4v$)/i

function titleForKey(key: string): string {
  return key
    .replace(/^r\d+[a-z]?[-_]/i, '')
    .replace(/^(?:mvfix|mv|lora)[-_]/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const access = await getArtImageAccessContext(event)
    if (!access.isAdmin) {
      event.node.res.statusCode = 403
      return { success: false, message: 'Admin access required.', statusCode: 403 }
    }

    const query = getQuery(event)
    const page = Math.max(1, Math.min(1000, Number(query.page) || 1))
    const search = String(query.q ?? '').trim().toLowerCase().slice(0, 120)
    const project = String(query.project ?? '')
    const kind = String(query.kind ?? 'all')
    const scope = isZuzuProjectSlug(project) ? project : ''
    const ledger = await loadZuzuArtLedger()
    const candidateIds = [...ledger.items.keys()]

    const [projects, images] = await Promise.all([
      prisma.project.findMany({
        where: {
          isActive: true,
          conductorSlug: { in: ZUZU_PROJECTS.map((entry) => entry.slug) },
        },
        select: { id: true, title: true, conductorSlug: true },
      }),
      prisma.artImage.findMany({
        where: {
          AND: [
            buildArtImageWhere(access),
            { id: { in: candidateIds } },
            ...(access.showMature ? [] : [{
              OR: [{ isMature: false }, { isMature: null }],
            }]),
          ],
        },
        select: {
          id: true,
          imagePath: true,
          path: true,
          designer: true,
          fileName: true,
          fileType: true,
          promptString: true,
          checkpoint: true,
          isMature: true,
          isPublic: true,
          ProjectLinks: {
            select: {
              projectId: true,
              Project: { select: { conductorSlug: true } },
            },
          },
        },
        orderBy: { id: 'desc' },
      }),
    ])

    attachGalleryArchiveMediaPaths(images, 'medium')
    const listedProjects: ZuzuProject[] = projects.flatMap((row) =>
      row.conductorSlug && isZuzuProjectSlug(row.conductorSlug)
        ? [{ id: row.id, title: row.title, slug: row.conductorSlug }]
        : [],
    )

    const all: ZuzuAsset[] = []
    for (const image of images) {
      const meta = ledger.items.get(image.id)
      if (!meta) continue
      const linked = image.ProjectLinks.filter((link) =>
        link.Project.conductorSlug && isZuzuProjectSlug(link.Project.conductorSlug),
      )
      const projectSlugs = [...new Set([
        meta.sourceProject,
        ...linked.map((link) => link.Project.conductorSlug).filter(
          (value): value is string => Boolean(value),
        ),
      ])]
      const mediaKind = VIDEO_FORMATS.test(image.fileType || '') ? 'video' : 'image'
      const title = meta.key.startsWith('Music video #')
        ? meta.key
        : titleForKey(meta.key)

      if (scope && !projectSlugs.includes(scope)) continue
      if (kind === 'video' && mediaKind !== 'video') continue
      if (kind === 'image' && mediaKind !== 'image') continue
      if (kind === 'sheets' && !/(angle|expression|lora|sheet)/i.test(meta.source + meta.key)) continue
      if (search && ![
        title,
        String(image.id),
        meta.entity ?? '',
        meta.key,
        meta.source,
        image.fileName ?? '',
        image.promptString ?? '',
      ].some((value) => value.toLowerCase().includes(search))) continue

      all.push({
        id: image.id,
        title,
        entity: meta.entity,
        source: meta.source,
        sourceProject: meta.sourceProject,
        artJobIds: meta.jobIds,
        projectSlugs,
        linkedProjectIds: linked.map((link) => link.projectId),
        thumbnailUrl: galleryThumbnailUrl(image.id),
        previewUrl: image.imagePath || galleryThumbnailUrl(image.id),
        fileType: image.fileType,
        mediaKind,
        status: 'available',
        isMature: image.isMature === true,
        isPublic: image.isPublic === true,
        promptString: image.promptString,
        checkpoint: image.checkpoint,
      })
    }

    const start = (page - 1) * ZUZU_ASSET_PAGE_SIZE
    const data: ZuzuWorldPage = {
      items: all.slice(start, start + ZUZU_ASSET_PAGE_SIZE),
      projects: listedProjects,
      total: all.length,
      page,
      pageSize: ZUZU_ASSET_PAGE_SIZE,
      recordedCount: ledger.items.size,
      ledgerCount: ledger.ledgerCount,
      source: 'Conductor Zuzu ledgers + accessible Kind Robots ArtImages',
      sourceWarning: null,
    }
    return { success: true, data, statusCode: 200 }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Unable to browse the Zuzu world.',
      statusCode: handled.statusCode || 500,
    }
  }
})
