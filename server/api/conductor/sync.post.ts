import type {
  ProjectPriority,
  ProjectStatus,
} from '~/prisma/generated/prisma/client'
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import {
  assertConductorProjectionSnapshot,
  buildConductorData,
  type ConductorProjectionSnapshot,
} from '@/server/utils/conductorProjection'

const MAX_PROJECTION_BYTES = 4_000_000

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)
  const body: unknown = await readBody(event)

  try {
    assertConductorProjectionSnapshot(body)
  } catch (cause) {
    throw createError({
      statusCode: 400,
      statusMessage:
        cause instanceof Error ? cause.message : 'Invalid Conductor projection',
    })
  }

  const snapshot = body as ConductorProjectionSnapshot
  const payload = JSON.stringify(snapshot)
  const payloadBytes = Buffer.byteLength(payload, 'utf8')
  if (payloadBytes > MAX_PROJECTION_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: `Conductor projection exceeds ${MAX_PROJECTION_BYTES} bytes`,
    })
  }

  const syncedAt = new Date()
  const generatedAt = new Date(snapshot.generatedAt)
  const normalized = buildConductorData(
    snapshot,
    new Map(),
    syncedAt.toISOString(),
  )
  let createdProjects = 0
  let updatedProjects = 0

  await prisma.$transaction(async (tx) => {
    for (const project of normalized.projects) {
      const existing = await tx.project.findFirst({
        where: {
          OR: [{ conductorSlug: project.slug }, { slug: project.slug }],
        },
        select: { id: true, conductorSlug: true },
      })

      if (existing) {
        await tx.project.update({
          where: { id: existing.id },
          data: {
            conductorSlug: existing.conductorSlug ?? project.slug,
            status: project.status as ProjectStatus,
            priority: project.priority as ProjectPriority,
            lastSyncedAt: syncedAt,
          },
        })
        updatedProjects += 1
        continue
      }

      await tx.project.create({
        data: {
          title: project.name,
          slug: project.slug,
          conductorSlug: project.slug,
          description: project.notesFromSilas ?? project.goal,
          goal: project.goal,
          status: project.status as ProjectStatus,
          priority: project.priority as ProjectPriority,
          repoUrl: project.repoUrl,
          liveUrl: project.liveUrl,
          channelKey: project.channelKey,
          tabKey: project.tabKey,
          imagePath: project.imagePath,
          cardPath: project.cardPath,
          heroPath: project.heroPath,
          lastSyncedAt: syncedAt,
          designer: 'conductor-projection',
          isPublic: true,
          isActive: true,
        },
      })
      createdProjects += 1
    }

    await tx.$executeRaw`
      INSERT INTO ConductorProjection (
        id,
        sourceRepo,
        sourceRef,
        sourceCommitSha,
        payload,
        generatedAt,
        syncedAt
      ) VALUES (
        1,
        ${snapshot.sourceRepo},
        ${snapshot.sourceRef},
        ${snapshot.sourceCommitSha},
        ${payload},
        ${generatedAt},
        ${syncedAt}
      )
      ON DUPLICATE KEY UPDATE
        sourceRepo = VALUES(sourceRepo),
        sourceRef = VALUES(sourceRef),
        sourceCommitSha = VALUES(sourceCommitSha),
        payload = VALUES(payload),
        generatedAt = VALUES(generatedAt),
        syncedAt = VALUES(syncedAt)
    `
  })

  return {
    success: true,
    data: {
      sourceCommitSha: snapshot.sourceCommitSha,
      registryCount: normalized.registryCount,
      pitchCount: normalized.pitches.length,
      createdProjects,
      updatedProjects,
      payloadBytes,
      syncedAt: syncedAt.toISOString(),
    },
  }
})
