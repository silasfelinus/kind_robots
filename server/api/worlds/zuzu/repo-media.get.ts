import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import {
  zuzuPublicRoots,
  zuzuRepoFileProbe,
} from '~/server/utils/zuzuRepoMediaFiles'
import {
  filterZuzuRepoMedia,
  resolveZuzuRepoFileStatus,
  zuzuRepoMediaIndex,
} from '~/utils/zuzuRepoMedia'
import {
  ZUZU_REPO_COLLECTIONS,
  ZUZU_REPO_PAGE_SIZE,
  isZuzuProjectSlug,
  type ZuzuRepoFileStatus,
  type ZuzuRepoMediaPage,
} from '~/utils/zuzuWorld'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const access = await getArtImageAccessContext(event)
    if (!access.isAdmin) {
      event.node.res.statusCode = 403
      return {
        success: false,
        message: 'Admin access required.',
        statusCode: 403,
      }
    }

    const query = getQuery(event)
    const page = Math.max(1, Math.min(1000, Number(query.page) || 1))
    const search = String(query.q ?? '').slice(0, 120)
    const projectQuery = String(query.project ?? '')
    const collectionQuery = String(query.collection ?? '')
    const project = isZuzuProjectSlug(projectQuery) ? projectQuery : ''
    const collection = ZUZU_REPO_COLLECTIONS.some(
      (entry) => entry.value === collectionQuery,
    )
      ? collectionQuery
      : ''

    const index = zuzuRepoMediaIndex()
    const scoped = filterZuzuRepoMedia(index, { search, project })
    const matches = filterZuzuRepoMedia(scoped, { collection })
    const resolved = resolveZuzuRepoFileStatus(
      matches,
      zuzuRepoFileProbe(zuzuPublicRoots()),
    )
    const start = (page - 1) * ZUZU_REPO_PAGE_SIZE
    const pageEntries = resolved.slice(start, start + ZUZU_REPO_PAGE_SIZE)

    const backingIds = [
      ...new Set(
        pageEntries.flatMap((entry) =>
          entry.artImageId ? [entry.artImageId] : [],
        ),
      ),
    ]
    const accessible = backingIds.length
      ? await prisma.artImage.findMany({
          where: {
            AND: [
              buildArtImageWhere(access),
              { id: { in: backingIds } },
              ...(access.showMature
                ? []
                : [{ OR: [{ isMature: false }, { isMature: null }] }]),
            ],
          },
          select: { id: true },
        })
      : []
    const accessibleIds = new Set(accessible.map((row) => row.id))

    const counts: Record<ZuzuRepoFileStatus, number> = {
      present: 0,
      missing: 0,
      unverified: 0,
    }
    for (const entry of resolved) counts[entry.fileStatus] += 1

    const data: ZuzuRepoMediaPage = {
      items: pageEntries.map((entry) => ({
        ...entry,
        artImageAccessible:
          entry.artImageId !== null && accessibleIds.has(entry.artImageId),
      })),
      total: matches.length,
      page,
      pageSize: ZUZU_REPO_PAGE_SIZE,
      indexed: index.length,
      counts,
      collections: ZUZU_REPO_COLLECTIONS.map((entry) => ({
        value: entry.value,
        label: entry.label,
        count: scoped.filter((item) => item.collection === entry.value).length,
      })),
      source:
        'Repository manifests (gamebook plates, Showdown rigs, Ghost Trail stages); files are referenced in place, never copied into ArtImage rows',
    }
    return { success: true, data, statusCode: 200 }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Unable to index repository media.',
      statusCode: handled.statusCode || 500,
    }
  }
})
