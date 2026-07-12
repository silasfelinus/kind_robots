// /server/api/model-builder/items/[id]/commit.post.ts
//
// Execute the approved COMMIT for a build item — the durable, idempotent write.
//
// - ASSET_ONLY: promote the item's generated ArtImage onto the source record's
//   canonical `artImageId`.
// - UPDATE: write the item's pitch into a single safe text field on the source.
// - CREATE: create a new private/inactive (draft-early) related record and link
//   it to the source via the known relation.
//
// Idempotency: the first commit atomically claims the item by setting its unique
// `idempotencyKey`; a replay returns the existing target instead of writing
// again. If the write fails after the claim, the claim is released so a retry can
// run. CREATE + link happen in one transaction so a link failure never leaves an
// orphan. COMMIT never overwrites unrelated canonical data — it only touches the
// one field / relation it owns.

import { createError, defineEventHandler, readBody } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { assertRunAccess, getItemId } from '../../runs/index'

type SourceType =
  | 'Project'
  | 'Character'
  | 'Bot'
  | 'Facet'
  | 'Dream'
  | 'Reward'
  | 'Scenario'

// Which model an expansion output creates.
const CREATE_TARGETS: Record<string, SourceType> = {
  'expand-characters': 'Character',
  'expand-signature-rewards': 'Reward',
  'expand-rewards': 'Reward',
  'expand-scenarios': 'Scenario',
  'expand-manager-bot': 'Bot',
  'expand-narrator-bot': 'Bot',
}

function isSourceType(value: string): value is SourceType {
  return [
    'Project',
    'Character',
    'Bot',
    'Facet',
    'Dream',
    'Reward',
    'Scenario',
  ].includes(value)
}

// Promote a generated ArtImage onto the source record's canonical art link.
async function promoteAsset(
  type: SourceType,
  id: number,
  artImageId: number,
): Promise<void> {
  switch (type) {
    case 'Project':
      await prisma.project.update({ where: { id }, data: { artImageId } })
      return
    case 'Character':
      await prisma.character.update({ where: { id }, data: { artImageId } })
      return
    case 'Bot':
      await prisma.bot.update({ where: { id }, data: { artImageId } })
      return
    case 'Facet':
      await prisma.facet.update({ where: { id }, data: { artImageId } })
      return
    case 'Dream':
      await prisma.dream.update({ where: { id }, data: { artImageId } })
      return
    case 'Reward':
      await prisma.reward.update({ where: { id }, data: { artImageId } })
      return
    case 'Scenario':
      await prisma.scenario.update({ where: { id }, data: { artImageId } })
      return
  }
}

// The single freeform text field UPDATE writes on each model.
async function updateText(
  type: SourceType,
  id: number,
  text: string,
): Promise<void> {
  switch (type) {
    case 'Project':
      await prisma.project.update({ where: { id }, data: { pitch: text } })
      return
    case 'Character':
      await prisma.character.update({ where: { id }, data: { backstory: text } })
      return
    case 'Bot':
      await prisma.bot.update({ where: { id }, data: { description: text } })
      return
    case 'Facet':
      await prisma.facet.update({ where: { id }, data: { description: text } })
      return
    case 'Dream':
      await prisma.dream.update({ where: { id }, data: { pitch: text } })
      return
    case 'Reward':
      await prisma.reward.update({ where: { id }, data: { description: text } })
      return
    case 'Scenario':
      await prisma.scenario.update({ where: { id }, data: { description: text } })
      return
  }
}

// Create a private/inactive draft-early record of the target type. Returns its id.
async function createRecord(
  tx: Prisma.TransactionClient,
  type: SourceType,
  name: string,
  text: string,
  userId: number,
): Promise<number> {
  const priv = { userId, isPublic: false, isActive: false }
  switch (type) {
    case 'Character':
      return (
        await tx.character.create({
          data: { name, backstory: text, ...priv },
        })
      ).id
    case 'Reward':
      return (
        await tx.reward.create({
          data: { name, description: text, ...priv },
        })
      ).id
    case 'Scenario':
      return (
        await tx.scenario.create({
          data: { title: name, description: text || name, intros: '', ...priv },
        })
      ).id
    case 'Dream':
      return (await tx.dream.create({ data: { title: name, pitch: text, ...priv } })).id
    case 'Project':
      return (await tx.project.create({ data: { title: name, pitch: text, ...priv } })).id
    case 'Facet':
      return (
        await tx.facet.create({ data: { title: name, description: text, ...priv } })
      ).id
    case 'Bot':
      return (
        await tx.bot.create({
          data: {
            name,
            description: text,
            BotType: 'CHATBOT',
            botIntro: text || name,
            userIntro: 'Hello!',
            prompt: text || name,
            ...priv,
          },
        })
      ).id
    default:
      throw createError({
        statusCode: 400,
        message: `Cannot create a ${type as string}.`,
      })
  }
}

// Link a newly created target back to its source via the known relation.
// Returns true if a link was written, false if the pair has no known relation.
async function linkSourceToTarget(
  tx: Prisma.TransactionClient,
  sourceType: SourceType,
  sourceId: number,
  targetType: SourceType,
  targetId: number,
): Promise<boolean> {
  if (sourceType === 'Dream' && targetType === 'Character') {
    await tx.dream.update({
      where: { id: sourceId },
      data: { Characters: { connect: { id: targetId } } },
    })
    return true
  }
  if (sourceType === 'Dream' && targetType === 'Reward') {
    await tx.dream.update({
      where: { id: sourceId },
      data: { Rewards: { connect: { id: targetId } } },
    })
    return true
  }
  if (sourceType === 'Dream' && targetType === 'Scenario') {
    await tx.dream.update({
      where: { id: sourceId },
      data: { Scenarios: { connect: { id: targetId } } },
    })
    return true
  }
  if (sourceType === 'Project' && targetType === 'Bot') {
    await tx.project.update({
      where: { id: sourceId },
      data: { managerBotId: targetId },
    })
    return true
  }
  if (sourceType === 'Character' && targetType === 'Reward') {
    await tx.character.update({
      where: { id: sourceId },
      data: { Rewards: { connect: { id: targetId } } },
    })
    return true
  }
  if (sourceType === 'Scenario' && targetType === 'Character') {
    await tx.scenario.update({
      where: { id: sourceId },
      data: { Characters: { connect: { id: targetId } } },
    })
    return true
  }
  return false
}

interface CommitTarget {
  type: SourceType
  id: number
  created: boolean
  linked?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const id = getItemId(event)
    const auth = await requireApiUser(event)
    const body = await readBody<{ dryRun?: boolean }>(event)
    const dryRun = body?.dryRun === true

    const item = await prisma.modelBuildItem.findUnique({
      where: { id },
      include: { Run: { select: { userId: true, sourceType: true, sourceId: true } } },
    })
    if (!item) {
      event.node.res.statusCode = 404
      return { success: false, message: 'Build item not found.', statusCode: 404 }
    }
    assertRunAccess(item.Run, auth.user)

    const sourceType = item.Run.sourceType
    if (!isSourceType(sourceType)) {
      throw createError({
        statusCode: 400,
        message: `Unsupported source type "${sourceType}".`,
      })
    }
    const sourceId = item.Run.sourceId
    const text = (item.pitch || item.fieldsDraft || '').trim()
    const name =
      (item.pitch?.split('\n')[0]?.trim() || item.label || 'Untitled').slice(0, 255)

    // Already committed? Return the recorded target without writing again.
    if (item.idempotencyKey) {
      return {
        success: true,
        message: 'Item was already committed.',
        data: {
          alreadyCommitted: true,
          target:
            item.targetType && item.targetId
              ? { type: item.targetType, id: item.targetId }
              : null,
        },
        statusCode: 200,
      }
    }

    // Plan the write (also the dry-run response).
    let plan:
      | { action: 'ASSET_ONLY'; targetType: SourceType; targetId: number; field: string; value: number }
      | { action: 'UPDATE'; targetType: SourceType; targetId: number; field: string; value: string }
      | { action: 'CREATE'; targetType: SourceType; name: string; text: string }

    if (item.action === 'ASSET_ONLY') {
      if (!item.artImageId) {
        throw createError({
          statusCode: 400,
          message: 'Generate and keep an asset before committing.',
        })
      }
      plan = {
        action: 'ASSET_ONLY',
        targetType: sourceType,
        targetId: sourceId,
        field: 'artImageId',
        value: item.artImageId,
      }
    } else if (item.action === 'UPDATE') {
      if (!text) {
        throw createError({
          statusCode: 400,
          message: 'Add pitch/field text before committing an update.',
        })
      }
      plan = {
        action: 'UPDATE',
        targetType: sourceType,
        targetId: sourceId,
        field: 'text',
        value: text,
      }
    } else {
      const targetType = CREATE_TARGETS[item.outputKey]
      if (!targetType) {
        throw createError({
          statusCode: 400,
          message: `Commit for "${item.outputKey}" is not supported yet.`,
        })
      }
      plan = { action: 'CREATE', targetType, name, text }
    }

    if (dryRun) {
      return {
        success: true,
        message: 'Commit plan (dry run).',
        data: { alreadyCommitted: false, dryRun: true, plan },
        statusCode: 200,
      }
    }

    // Atomic claim: only one commit may proceed. count === 0 means another
    // request already claimed/committed this item.
    const claim = await prisma.modelBuildItem.updateMany({
      where: { id, idempotencyKey: null },
      data: { idempotencyKey: `commit:${id}` },
    })
    if (claim.count === 0) {
      const fresh = await prisma.modelBuildItem.findUnique({
        where: { id },
        select: { targetType: true, targetId: true },
      })
      return {
        success: true,
        message: 'Item was already committed.',
        data: {
          alreadyCommitted: true,
          target:
            fresh?.targetType && fresh?.targetId
              ? { type: fresh.targetType, id: fresh.targetId }
              : null,
        },
        statusCode: 200,
      }
    }

    // Execute the durable write. On any failure, release the claim so a retry
    // can run (compensating cleanup).
    let target: CommitTarget
    try {
      if (plan.action === 'ASSET_ONLY') {
        await promoteAsset(sourceType, sourceId, plan.value)
        target = { type: sourceType, id: sourceId, created: false }
      } else if (plan.action === 'UPDATE') {
        await updateText(sourceType, sourceId, plan.value)
        target = { type: sourceType, id: sourceId, created: false }
      } else {
        const targetType = plan.targetType
        const created = await prisma.$transaction(async (tx) => {
          const newId = await createRecord(tx, targetType, name, text, auth.user.id)
          const linked = await linkSourceToTarget(
            tx,
            sourceType,
            sourceId,
            targetType,
            newId,
          )
          return { newId, linked }
        })
        target = {
          type: targetType,
          id: created.newId,
          created: true,
          linked: created.linked,
        }
      }
    } catch (writeError) {
      await prisma.modelBuildItem.updateMany({
        where: { id },
        data: { idempotencyKey: null },
      })
      throw writeError
    }

    // Record the commit on the item (COMMIT stage + target) so it survives resume.
    const stages =
      item.stageStatuses && typeof item.stageStatuses === 'object'
        ? { ...(item.stageStatuses as Record<string, unknown>) }
        : {}
    stages.COMMIT = {
      status: 'approved',
      note: `Committed → ${target.type} #${target.id}${target.created ? (target.linked ? ' (created + linked)' : ' (created)') : ''}`,
    }

    const updated = await prisma.modelBuildItem.update({
      where: { id },
      data: {
        targetType: target.type,
        targetId: target.id,
        stageStatuses: stages as unknown as Prisma.InputJsonValue,
      },
      include: {
        Artifacts: { orderBy: { id: 'asc' } },
        Revisions: { orderBy: { id: 'asc' } },
      },
    })

    return {
      success: true,
      message: `Committed ${plan.action === 'CREATE' ? 'new ' + target.type : target.type + ' #' + target.id}.`,
      data: { alreadyCommitted: false, target, item: updated },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
