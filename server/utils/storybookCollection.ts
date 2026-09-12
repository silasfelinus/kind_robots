// /server/utils/storybookCollection.ts
//
// The reader's collection of endings (storybook/t-033).
//
// Silas, 2026-09-12: a finished story should end at "one of the predetermined
// endpoint endings, which they get credit for in a collection of their
// adventures." The credit already exists -- resolveStoryRunEnding awards the
// ending's Achievement and LifeAchievement -- so this reads that same record
// back per deck rather than adding a second unlock table with its own drift.
//
// An unfound ending goes out as a silhouette: its id, slug, victory type and
// icon, and nothing else. Spoiling the ending list would turn a collection
// into a checklist.

import prisma from './prisma'
import { deckEndingCount } from './endingDeckMath'
import type { LoadedDeck } from './storybookRuns'

export interface CollectedEnding {
  id: number
  slug: string
  victoryType: string
  icon: string | null
  unlocked: boolean
  title?: string
  summary?: string
  heroImage?: string | null
  unlockedAt?: Date | null
  runId?: number | null
}

export async function readDeckCollection(deck: LoadedDeck, userId: number) {
  const endings = await prisma.lifeEnding.findMany({
    where: { deckId: deck.id, isActive: true },
    orderBy: { outcomeKey: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      victoryType: true,
      icon: true,
      heroImage: true,
      outcomeKey: true,
      Achievements: { where: { isActive: true }, select: { id: true } },
    },
  })

  const achievementIds = endings.flatMap((ending) =>
    ending.Achievements.map((achievement) => achievement.id),
  )
  const unlocks = achievementIds.length
    ? await prisma.lifeAchievementUnlock.findMany({
        where: { userId, achievementId: { in: achievementIds } },
        select: { achievementId: true, createdAt: true, lifeRunId: true },
      })
    : []
  const unlockByAchievement = new Map(
    unlocks.map((unlock) => [unlock.achievementId, unlock]),
  )

  const collected: CollectedEnding[] = endings.map((ending) => {
    const unlock = ending.Achievements.map((achievement) =>
      unlockByAchievement.get(achievement.id),
    ).find(Boolean)

    if (!unlock) {
      return {
        id: ending.id,
        slug: ending.slug,
        victoryType: ending.victoryType,
        icon: ending.icon,
        unlocked: false,
      }
    }
    return {
      id: ending.id,
      slug: ending.slug,
      victoryType: ending.victoryType,
      icon: ending.icon,
      unlocked: true,
      title: ending.title,
      summary: ending.summary,
      heroImage: ending.heroImage,
      unlockedAt: unlock.createdAt,
      runId: unlock.lifeRunId,
    }
  })

  const found = collected.filter((ending) => ending.unlocked).length

  return {
    deck: {
      key: deck.key,
      title: deck.title,
      description: deck.description,
      axisCount: deck.axes.length,
    },
    found,
    total: endings.length,
    // What a complete deck WOULD hold, so a partially-seeded deck is visible
    // as such rather than reading as complete at 8 of 8 when it wants 16.
    expected: deckEndingCount({
      key: deck.key,
      axes: deck.axes,
      passValue: deck.passValue,
    }),
    endings: collected,
  }
}
