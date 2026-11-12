// /server/plugins/02-achievement-catalog-drift.ts
//
// Say at boot whether every game achievement this build can award has a live
// row in the Achievement table. Rows are written only by the catalog
// maintenance workflow (scripts/seed_achievements.ts --write); a code that
// shipped before that run cannot be awarded, and the store only queues it.
//
// WARNS, NEVER BLOCKS, and never writes: the container must not seed the
// catalog (utils/scripts/verifyAchievementCatalog.ts). It is one ordinary read
// in the application lane, and every failure is swallowed after a note, the
// same contract as 01-migration-drift-check.ts.
import prisma from '../utils/prisma'
import { gameAchievementCatalogRows } from '../../utils/achievements/gameAchievements'

export default defineNitroPlugin(() => {
  void (async () => {
    const codes = gameAchievementCatalogRows().map((row) => row.triggerCode)
    if (!codes.length) return

    let stored: { triggerCode: string | null }[]
    try {
      stored = await prisma.achievement.findMany({
        where: { triggerCode: { in: codes }, isActive: true },
        select: { triggerCode: true },
      })
    } catch (error) {
      console.warn(
        '[achievement-catalog-drift] could not read the Achievement table; ' +
          'skipping the check (fresh database, or the database is unreachable).',
        error,
      )
      return
    }

    const live = new Set(stored.map((row) => row.triggerCode))
    const missing = codes.filter((code) => !live.has(code))
    if (!missing.length) return

    console.warn(
      `[achievement-catalog-drift] ${missing.length} game achievement code(s) ` +
        'have no active Achievement row, so awards for them are queued on ' +
        'players’ devices until the achievement-catalog-maintenance workflow ' +
        `seeds them: ${missing.join(', ')}`,
    )
  })()
})
