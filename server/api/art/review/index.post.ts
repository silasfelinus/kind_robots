// /server/api/art/review/index.post.ts
//
// One review per user per image. The first review of an image earns a click
// and the existing REACTION_GIVEN karma (the owner earns REACTION_RECEIVED);
// changing a rating later updates the same Reaction and earns nothing, so
// re-rating cannot be farmed.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { awardKarma, KARMA_AMOUNTS } from '~/server/utils/karma'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import {
  ART_REVIEW_COMMENT_MAX,
  isArtReviewRating,
  reactionTypeForRating,
  type ArtReviewResult,
} from '~/utils/artReview'

type ReviewBody = { artImageId?: unknown; rating?: unknown; comment?: unknown }

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const body = (await readBody<ReviewBody>(event)) ?? {}

    const artImageId = Number(body.artImageId)
    const rating = Number(body.rating)
    if (!Number.isInteger(artImageId) || artImageId <= 0) {
      throw createError({ statusCode: 400, message: 'artImageId is required.' })
    }
    if (!isArtReviewRating(rating)) {
      throw createError({
        statusCode: 400,
        message: 'rating must be a whole number from 1 to 5.',
      })
    }
    const comment =
      typeof body.comment === 'string' && body.comment.trim()
        ? body.comment.trim().slice(0, ART_REVIEW_COMMENT_MAX)
        : null

    const access = await getArtImageAccessContext(event)
    const art = await prisma.artImage.findFirst({
      where: {
        AND: [
          { id: artImageId },
          buildArtImageWhere(access),
          { OR: [{ isPublic: true }, { userId: user.id }] },
        ],
      },
      select: { id: true, userId: true },
    })
    if (!art) {
      throw createError({ statusCode: 404, message: 'Art not found.' })
    }

    const existing = await prisma.reaction.findFirst({
      where: { userId: user.id, reactionCategory: 'ART_IMAGE', artImageId },
      select: { id: true },
    })

    const fields = {
      reactionType: reactionTypeForRating(rating),
      rating,
      comment,
    }
    const reaction = existing
      ? await prisma.reaction.update({
          where: { id: existing.id },
          data: fields,
        })
      : await prisma.reaction.create({
          data: {
            ...fields,
            userId: user.id,
            reactionCategory: 'ART_IMAGE',
            artImageId,
          },
        })

    let karmaAwarded = 0
    if (!existing) {
      const award = await awardKarma({
        userId: user.id,
        reason: 'REACTION_GIVEN',
        refId: String(reaction.id),
      }).catch(() => null)
      if (award) karmaAwarded = KARMA_AMOUNTS.REACTION_GIVEN

      if (art.userId && art.userId !== user.id) {
        awardKarma({
          userId: art.userId,
          reason: 'REACTION_RECEIVED',
          refId: String(artImageId),
          refType: 'artImage',
        }).catch(() => {})
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { clickRecord: { increment: 1 } },
        select: { id: true },
      })
    }

    const fresh = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { clickRecord: true, karma: true },
    })

    const result: ArtReviewResult = {
      reactionId: reaction.id,
      rating,
      firstReview: !existing,
      clickRecord: fresh.clickRecord ?? 0,
      karma: fresh.karma,
      karmaAwarded,
    }

    event.node.res.statusCode = existing ? 200 : 201
    return {
      success: true,
      message: existing ? 'Review updated.' : 'Review saved.',
      data: result,
      statusCode: event.node.res.statusCode,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to save review.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
