// /server/api/davinci/endings/coverage.get.ts
//
// Admin audit view for davinci/t-018: how much of the 1,024-ending art
// universe actually has delivered art, versus a queued path string versus
// nothing at all. `icon`/`heroImage` are path strings written by the seed
// importer (utils/scripts/seedDaVinciEndings.ts) for a future generator
// pipeline — a non-null path string does NOT mean an image exists.
// `iconArtImageId`/`heroArtImageId` are the only fields that point at a
// real, delivered ArtImage row (the importer deliberately never sets them —
// see docs/notes/davinci-ending-seed.md's "What it deliberately does NOT
// do"), so those are what "resolved" means here.
//
// Also inventories contextual (in-run) art via LifeRunArt, which is a
// separate art surface from ending icon/hero art (davinci/t-020's scope).
import { defineEventHandler } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'

const EXPECTED_TOTAL_ENDINGS = 1024
const SAMPLE_LIMIT = 25

function isRealPath(value: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const endings = await prisma.lifeEnding.findMany({
      select: {
        id: true,
        outcomeKey: true,
        slug: true,
        icon: true,
        heroImage: true,
        iconArtImageId: true,
        heroArtImageId: true,
        isActive: true,
      },
      orderBy: { outcomeKey: 'asc' },
    })

    type ArtState = 'resolved' | 'queued' | 'missing'

    const classify = (
      artImageId: number | null,
      pathValue: string | null,
    ): ArtState => {
      if (artImageId != null) return 'resolved'
      if (isRealPath(pathValue)) return 'queued'
      return 'missing'
    }

    const iconBuckets: Record<ArtState, string[]> = {
      resolved: [],
      queued: [],
      missing: [],
    }
    const heroBuckets: Record<ArtState, string[]> = {
      resolved: [],
      queued: [],
      missing: [],
    }
    let bothResolved = 0
    let bothMissing = 0

    for (const ending of endings) {
      const iconState = classify(ending.iconArtImageId, ending.icon)
      const heroState = classify(ending.heroArtImageId, ending.heroImage)
      iconBuckets[iconState].push(ending.outcomeKey)
      heroBuckets[heroState].push(ending.outcomeKey)
      if (iconState === 'resolved' && heroState === 'resolved') bothResolved++
      if (iconState === 'missing' && heroState === 'missing') bothMissing++
    }

    // Confirm iconArtImageId/heroArtImageId that DO point somewhere actually
    // resolve to a live ArtImage row (FK integrity should guarantee this,
    // but the audit is meant to check reality, not assume the schema).
    const referencedArtImageIds = Array.from(
      new Set(
        endings.flatMap((e) =>
          [e.iconArtImageId, e.heroArtImageId].filter(
            (v): v is number => v != null,
          ),
        ),
      ),
    )
    const liveArtImages = referencedArtImageIds.length
      ? await prisma.artImage.findMany({
          where: { id: { in: referencedArtImageIds } },
          select: { id: true },
        })
      : []
    const liveArtImageIds = new Set(liveArtImages.map((a) => a.id))
    const danglingArtImageRefs = referencedArtImageIds.filter(
      (id) => !liveArtImageIds.has(id),
    )

    const outcomeKeysSeen = new Set(endings.map((e) => e.outcomeKey))
    const missingOutcomeCount = EXPECTED_TOTAL_ENDINGS - outcomeKeysSeen.size

    // Contextual (in-run) art — a separate surface from ending icon/hero art.
    const [runArtTotal, runArtBySceneType, distinctRunsWithArt, totalRuns] =
      await Promise.all([
        prisma.lifeRunArt.count(),
        prisma.lifeRunArt.groupBy({
          by: ['sceneType'],
          _count: { _all: true },
        }),
        prisma.lifeRunArt
          .findMany({ select: { lifeRunId: true }, distinct: ['lifeRunId'] })
          .then((rows) => rows.length),
        prisma.lifeRun.count(),
      ])

    const data = {
      expectedTotalEndings: EXPECTED_TOTAL_ENDINGS,
      seededEndingCount: endings.length,
      missingOutcomeKeyCount: missingOutcomeCount < 0 ? 0 : missingOutcomeCount,
      extraOutcomeKeyCount: missingOutcomeCount < 0 ? -missingOutcomeCount : 0,
      inactiveEndingCount: endings.filter((e) => !e.isActive).length,
      icon: {
        resolved: iconBuckets.resolved.length,
        queued: iconBuckets.queued.length,
        missing: iconBuckets.missing.length,
        sampleMissing: iconBuckets.missing.slice(0, SAMPLE_LIMIT),
      },
      hero: {
        resolved: heroBuckets.resolved.length,
        queued: heroBuckets.queued.length,
        missing: heroBuckets.missing.length,
        sampleMissing: heroBuckets.missing.slice(0, SAMPLE_LIMIT),
      },
      bothIconAndHeroResolved: bothResolved,
      bothIconAndHeroMissing: bothMissing,
      danglingArtImageRefs,
      contextualArt: {
        totalLifeRunArtRows: runArtTotal,
        bySceneType: runArtBySceneType.map((g) => ({
          sceneType: g.sceneType,
          count: g._count._all,
        })),
        distinctRunsWithArt: distinctRunsWithArt,
        totalLifeRuns: totalRuns,
        runsWithNoArt: Math.max(totalRuns - distinctRunsWithArt, 0),
      },
    }

    return {
      success: true,
      message: `Da Vinci ending art coverage: ${data.bothIconAndHeroResolved}/${data.seededEndingCount} endings have both icon and hero art delivered.`,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        handled.message || 'Failed to load Da Vinci ending art coverage.',
      statusCode,
    }
  }
})
