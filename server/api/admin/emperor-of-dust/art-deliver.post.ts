import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createError, defineEventHandler, readBody } from 'h3'
import sharp from 'sharp'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { readArtImageBytes } from '~/server/utils/artImageBytes'
import { mediaShareRootIsMounted } from '~/server/utils/artImageOffload'
import {
  emperorMediaArtUrl,
  parseEmperorArtDeliveryTargets,
} from '~/utils/emperorOfDust/fortress/artDelivery'

type DeliveryRequest = {
  targets?: unknown
  write?: unknown
  curated?: unknown
}

type DeliveryResult = {
  asset: string
  artImageId: number
  artJobId?: number
  url: string
  bytes?: number
  sha256?: string
  width?: number
  height?: number
  status:
    | 'would-write'
    | 'written'
    | 'already-delivered'
    | 'conflict'
    | 'unavailable'
  reason?: string
}

const digest = (bytes: Buffer): string =>
  createHash('sha256').update(bytes).digest('hex')

async function existingDigest(file: string): Promise<string | null> {
  try {
    return digest(await fs.readFile(file))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = await readBody<DeliveryRequest>(event)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'JSON object required.' })
    }
    const targets = parseEmperorArtDeliveryTargets(body.targets)
    if (typeof body.write !== 'undefined' && typeof body.write !== 'boolean') {
      throw createError({ statusCode: 400, message: 'write must be boolean.' })
    }
    const write = body.write === true

    // Delivery makes private artwork reachable from the media namespace.
    // A caller must explicitly attest that every supplied image was curated.
    // Nothing in this route submits new ArtJobs, publishes a game route,
    // changes ArtImage privacy or deletes the database source.
    if (write && body.curated !== true) {
      throw createError({
        statusCode: 403,
        message: 'Actual delivery requires curated: true.',
      })
    }

    const configured = process.env.IMAGES_PATH?.trim()
    if (!configured) {
      throw createError({
        statusCode: 503,
        message: 'Durable IMAGES_PATH is not configured.',
      })
    }
    const root = path.resolve(configured)
    if (!(await mediaShareRootIsMounted(root))) {
      throw createError({
        statusCode: 503,
        message: 'Durable image share is not mounted.',
      })
    }

    const ids = targets.map((target) => target.artImageId)
    const [jobs, artImages] = await Promise.all([
      prisma.artJob.findMany({
        where: {
          projectSlug: 'emperor-of-dust',
          status: 'DONE',
          artImageId: { in: ids },
        },
        select: { id: true, artImageId: true },
      }),
      prisma.artImage.findMany({
        where: { id: { in: ids }, isActive: true },
        select: { id: true, isMature: true },
      }),
    ])
    const jobByImage = new Map(
      jobs.filter((job) => job.artImageId).map((job) => [job.artImageId, job.id]),
    )
    const activeImageIds = new Set(
      artImages.filter((image) => !image.isMature).map((image) => image.id),
    )

    const results: DeliveryResult[] = []
    for (const target of targets) {
      const result: DeliveryResult = {
        ...target,
        url: emperorMediaArtUrl(target.asset),
        status: 'unavailable',
      }
      results.push(result)
      const job = jobByImage.get(target.artImageId)
      if (!job || !activeImageIds.has(target.artImageId)) {
        result.reason = 'No active, non-mature DONE Emperor ArtJob source.'
        continue
      }
      result.artJobId = job
      const source = await readArtImageBytes(target.artImageId)
      if (!source) {
        result.reason = 'Original ArtImage bytes are unavailable.'
        continue
      }

      try {
        const original = Buffer.from(source.base64, 'base64')
        const metadata = await sharp(original).metadata()
        const minWidth = target.asset.startsWith('endings/') ? 960 : 400
        const minHeight = target.asset.startsWith('endings/') ? 500 : 250
        if (
          !metadata.width ||
          !metadata.height ||
          metadata.width < minWidth ||
          metadata.height < minHeight ||
          (metadata.pages ?? 1) > 1
        ) {
          result.reason = 'Image dimensions or page count failed validation.'
          continue
        }

        const webp = await sharp(original)
          .webp({ quality: 82, effort: 5 })
          .toBuffer()
        result.width = metadata.width
        result.height = metadata.height
        result.bytes = webp.length
        result.sha256 = digest(webp)

        // A restricted relative path, below the already-existing mounted
        // share. Unlike a write to public/ in a container, this survives a
        // self-hosted application replacement.
        const destination = path.join(
          root,
          'emperor-of-dust',
          `${target.asset}.webp`,
        )
        const previous = await existingDigest(destination)
        if (previous) {
          result.status =
            previous === result.sha256 ? 'already-delivered' : 'conflict'
          if (result.status === 'conflict') {
            result.reason = 'Different on-disk bytes; manual curation required.'
          }
          continue
        }
        if (!write) {
          result.status = 'would-write'
          continue
        }

        await fs.mkdir(path.dirname(destination), { recursive: true })
        const temporary = path.join(
          path.dirname(destination),
          `.${path.basename(destination)}.${randomUUID()}.tmp`,
        )
        try {
          await fs.writeFile(temporary, webp, { flag: 'wx' })
          // Linking an already-complete sibling is atomic and cannot replace
          // a concurrently installed keeper, unlike rename(overwrite=true).
          await fs.link(temporary, destination)
          result.status = 'written'
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
          const winner = await existingDigest(destination)
          result.status =
            winner === result.sha256 ? 'already-delivered' : 'conflict'
          if (result.status === 'conflict') {
            result.reason = 'Another export won the destination race.'
          }
        } finally {
          await fs.unlink(temporary).catch(() => undefined)
        }
      } catch (error) {
        result.reason =
          error instanceof Error ? error.message : 'Image could not be read.'
      }
    }
    return {
      success: true,
      statusCode: 200,
      dryRun: !write,
      message: write
        ? 'Media-share writes attempted; verify final HTTP URLs independently.'
        : 'Dry-run only. No files or ArtImage rows were changed.',
      data: { results },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: event.node.res.statusCode,
      message: handled.message || 'Emperor art delivery failed.',
      data: null,
    }
  }
})
