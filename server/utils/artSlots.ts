// /server/utils/artSlots.ts
//
// Art slots: every render made for one place an image is used, kept side by side
// as candidates, with one chosen by an admin. Schema and rationale:
// prisma/art-slots.prisma. Silas, 2026-11-11 PT: "support having multiple art
// sources for art ... manageable from a back end, so that the admin interfaces
// can choose a better choice. If the art is actually duplicated (same seed),
// they can be deleted."
//
// "Duplicated" is decided by renderFingerprint: same normalized prompt, negative
// prompt, seed, checkpoint, sampler, steps and cfg is the same picture. A render
// with no seed has no fingerprint and is never removed automatically. Removal is
// recycleArtImage (isActive=false), so the Recycle Bin can restore it.
import { createError } from 'h3'
import prisma from './prisma'
import { recycleArtImage, type RecycleBinActor } from './artRecycleBin'
import { galleryThumbnailUrl } from './artGalleryArchiveMedia'
import {
  badRequestError,
  planDuplicates,
  renderFingerprint,
  type ArtCandidateVerdict,
  type CandidateInput,
} from './artSlotRules'

export * from './artSlotRules'

// ---------------------------------------------------------------- database

const RENDER_SELECT = {
  id: true,
  seed: true,
  promptString: true,
  negativePrompt: true,
  checkpoint: true,
  sampler: true,
  steps: true,
  cfg: true,
} as const

export async function registerCandidates(
  inputs: CandidateInput[],
  actorId: number,
) {
  const imageIds = [...new Set(inputs.map((i) => i.artImageId))]
  const images = await prisma.artImage.findMany({
    where: { id: { in: imageIds } },
    select: RENDER_SELECT,
  })
  const imageById = new Map(images.map((image) => [image.id, image]))

  const keys = [...new Set(inputs.map((i) => i.slotKey))]
  const existing = await prisma.artSlot.findMany({
    where: { slotKey: { in: keys } },
  })
  const slotByKey = new Map(existing.map((slot) => [slot.slotKey, slot]))
  for (const input of inputs) {
    if (slotByKey.has(input.slotKey)) continue
    const slot = await prisma.artSlot.upsert({
      where: { slotKey: input.slotKey },
      create: {
        slotKey: input.slotKey,
        projectSlug: input.projectSlug ?? null,
        label: input.label ?? null,
      },
      update: {},
    })
    slotByKey.set(input.slotKey, slot)
  }

  const results = []
  for (const input of inputs) {
    const slot = slotByKey.get(input.slotKey)!
    const image = imageById.get(input.artImageId)
    if (!image) {
      results.push({
        slotKey: input.slotKey,
        artImageId: input.artImageId,
        status: 'missing-image',
      })
      continue
    }
    const fingerprint = renderFingerprint(image)
    const before = await prisma.artCandidate.findUnique({
      where: {
        slotId_artImageId: { slotId: slot.id, artImageId: input.artImageId },
      },
    })
    const candidate = await prisma.artCandidate.upsert({
      where: {
        slotId_artImageId: { slotId: slot.id, artImageId: input.artImageId },
      },
      create: {
        slotId: slot.id,
        artImageId: input.artImageId,
        artJobId: input.artJobId ?? null,
        source: input.source ?? 'manual',
        sourceRef: input.sourceRef ?? null,
        seed: image.seed,
        checkpoint: image.checkpoint,
        renderFingerprint: fingerprint,
      },
      update: {
        artJobId: before?.artJobId ?? input.artJobId ?? null,
        renderFingerprint: fingerprint,
      },
    })
    if (input.selectIfEmpty && !slot.selectedArtImageId) {
      const updated = await prisma.artSlot.update({
        where: { id: slot.id },
        data: {
          selectedArtImageId: input.artImageId,
          selectedAt: new Date(),
          selectedBy: actorId,
        },
      })
      slotByKey.set(input.slotKey, updated)
    }
    results.push({
      slotKey: input.slotKey,
      slotId: slot.id,
      artImageId: input.artImageId,
      candidateId: candidate.id,
      status: before ? 'exists' : 'created',
      renderFingerprint: fingerprint,
    })
  }
  return results
}

export async function selectCandidate(
  slotId: number,
  artImageId: number,
  actorId: number,
) {
  const candidate = await prisma.artCandidate.findUnique({
    where: { slotId_artImageId: { slotId, artImageId } },
  })
  if (!candidate)
    throw createError({
      statusCode: 404,
      message: `ArtImage ${artImageId} is not a candidate for slot ${slotId}.`,
    })
  if (candidate.verdict === 'duplicate')
    badRequestError(
      'That candidate was removed as a duplicate; restore it from the Recycle Bin first.',
    )
  return prisma.artSlot.update({
    where: { id: slotId },
    data: {
      selectedArtImageId: artImageId,
      selectedAt: new Date(),
      selectedBy: actorId,
    },
  })
}

export async function setCandidateVerdict(
  candidateId: number,
  verdict: ArtCandidateVerdict,
  note: string | null | undefined,
) {
  const candidate = await prisma.artCandidate.findUnique({
    where: { id: candidateId },
  })
  if (!candidate)
    throw createError({ statusCode: 404, message: 'No such candidate.' })
  return prisma.artCandidate.update({
    where: { id: candidateId },
    data: {
      verdict,
      ...(note !== undefined
        ? { note: note ? String(note).slice(0, 500) : null }
        : {}),
    },
  })
}

export type SlotQuery = {
  projectSlug?: string | null
  prefix?: string | null
  multipleOnly?: boolean
  page?: number
  pageSize?: number
}

export async function listSlots(query: SlotQuery) {
  const pageSize = Math.min(Math.max(query.pageSize ?? 24, 1), 100)
  const page = Math.max(query.page ?? 1, 1)
  const where = {
    ...(query.projectSlug ? { projectSlug: query.projectSlug } : {}),
    ...(query.prefix ? { slotKey: { startsWith: query.prefix } } : {}),
  }
  let slotIds: number[] | null = null
  if (query.multipleOnly) {
    const grouped = await prisma.artCandidate.groupBy({
      by: ['slotId'],
      where: { verdict: { not: 'duplicate' }, Slot: where },
      _count: { _all: true },
    })
    slotIds = grouped.filter((g) => g._count._all > 1).map((g) => g.slotId)
  }
  const filter = slotIds ? { ...where, id: { in: slotIds } } : where
  const [totalCount, slots] = await Promise.all([
    prisma.artSlot.count({ where: filter }),
    prisma.artSlot.findMany({
      where: filter,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { Candidates: { orderBy: { artImageId: 'asc' } } },
    }),
  ])
  const imageIds = [
    ...new Set(slots.flatMap((s) => s.Candidates.map((c) => c.artImageId))),
  ]
  const images = await prisma.artImage.findMany({
    where: { id: { in: imageIds } },
    select: { id: true, isActive: true, isMature: true, imagePath: true },
  })
  const imageById = new Map(images.map((image) => [image.id, image]))
  return {
    totalCount,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(totalCount / pageSize)),
    slots: slots.map((slot) => ({
      id: slot.id,
      slotKey: slot.slotKey,
      projectSlug: slot.projectSlug,
      label: slot.label,
      selectedArtImageId: slot.selectedArtImageId,
      selectedAt: slot.selectedAt,
      updatedAt: slot.updatedAt,
      candidates: slot.Candidates.map((c) => {
        const image = imageById.get(c.artImageId)
        return {
          id: c.id,
          artImageId: c.artImageId,
          artJobId: c.artJobId,
          source: c.source,
          sourceRef: c.sourceRef,
          seed: c.seed,
          checkpoint: c.checkpoint,
          renderFingerprint: c.renderFingerprint,
          verdict: c.verdict,
          note: c.note,
          createdAt: c.createdAt,
          isActive: image ? image.isActive !== false : false,
          isMature: image?.isMature === true,
          thumbnailUrl: image ? galleryThumbnailUrl(c.artImageId) : null,
        }
      }),
    })),
  }
}

export async function selectedArt(query: {
  projectSlug?: string | null
  prefix?: string | null
}) {
  if (!query.projectSlug && !query.prefix)
    badRequestError('projectSlug or prefix is required.')
  const slots = await prisma.artSlot.findMany({
    where: {
      selectedArtImageId: { not: null },
      ...(query.projectSlug ? { projectSlug: query.projectSlug } : {}),
      ...(query.prefix ? { slotKey: { startsWith: query.prefix } } : {}),
    },
    select: { slotKey: true, selectedArtImageId: true, selectedAt: true },
    orderBy: { slotKey: 'asc' },
  })
  return slots.map((s) => ({
    slotKey: s.slotKey,
    artImageId: s.selectedArtImageId!,
    selectedAt: s.selectedAt,
  }))
}

export async function dedupeSlots(options: {
  projectSlug?: string | null
  slotKeys?: string[]
  protectArtImageIds?: number[]
  apply: boolean
  actor: RecycleBinActor
}) {
  if (!options.projectSlug && !options.slotKeys?.length)
    badRequestError('projectSlug or slotKeys is required.')
  const slots = await prisma.artSlot.findMany({
    where: {
      ...(options.projectSlug ? { projectSlug: options.projectSlug } : {}),
      ...(options.slotKeys?.length
        ? { slotKey: { in: options.slotKeys } }
        : {}),
    },
    include: { Candidates: true },
  })
  const protectedIds = new Set(options.protectArtImageIds ?? [])
  const report = []
  let removed = 0
  for (const slot of slots) {
    const groups = planDuplicates(
      slot.Candidates,
      slot.selectedArtImageId,
      protectedIds,
    )
    if (!groups.length) continue
    if (options.apply) {
      for (const group of groups) {
        for (const artImageId of group.removeArtImageIds) {
          await recycleArtImage(artImageId, options.actor)
          await prisma.artCandidate.update({
            where: { slotId_artImageId: { slotId: slot.id, artImageId } },
            data: {
              verdict: 'duplicate',
              note: `Same render as ArtImage ${group.keepArtImageId}; moved to the Recycle Bin.`,
            },
          })
          removed += 1
        }
      }
    }
    report.push({ slotId: slot.id, slotKey: slot.slotKey, groups })
  }
  return { apply: options.apply, slots: report, removed }
}

/** Admins and server keys only: these routes curate everyone's art. */
export function assertCurator(auth: {
  isAdmin?: boolean
  isServerKey?: boolean
}) {
  if (!auth.isAdmin && !auth.isServerKey)
    throw createError({ statusCode: 403, message: 'Admin access required.' })
}
