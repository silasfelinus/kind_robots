import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireSlimeCityPreviewUser } from '~/server/utils/slimeCityProgress'
import {
  isPvpExpired,
  parsePvpRecord,
  PVP_MODE,
  replayPvp,
} from '~/utils/slimeCity/pvp'
import type { TeamId } from '~/utils/slimeCity/prototypes'

/**
 * Participant-only game inbox. This is the private PvP preview, not public
 * matchmaking. Never send opponent hands or raw commands to the header.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPreviewUser(event)
  const userId = auth.user.id
  const rows = await prisma.slimeCityMatch.findMany({
    where: {
      mode: PVP_MODE,
      OR: [
        { userId },
        { commands: { path: '$.guestId', equals: userId } },
      ],
    },
    orderBy: { startedAt: 'desc' },
    take: 100,
  })

  const games = rows.flatMap((row) => {
    const record = parsePvpRecord(row.commands)
    if (!record) return []
    const seat =
      row.userId === userId
        ? 'player'
        : record.guestId === userId
          ? 'enemy'
          : null
    if (!seat) return []
    const joined = record.guestId !== null
    if (
      isPvpExpired(
        row.startedAt,
        record.lastActionAt,
        joined,
        row.settledAt !== null,
      )
    )
      return []

    const state = joined
      ? replayPvp(
          row.teamId as TeamId,
          row.foeId as TeamId,
          row.seed,
          record.commands,
        )
      : null
    const status = row.settledAt
      ? 'finished'
      : !joined
        ? 'invitation'
        : state?.victor
          ? 'finished'
          : state?.active === seat
            ? 'your-turn'
            : 'their-turn'
    return [
      {
        id: row.id,
        status,
        seat,
        team: seat === 'player' ? row.teamId : row.foeId,
        opponentTeam: seat === 'player' ? row.foeId : row.teamId,
        startedAt: row.startedAt,
        updatedAt: record.lastActionAt ?? row.startedAt.toISOString(),
        outcome: row.settledAt ? row.result : (state?.victor ?? null),
      },
    ]
  })

  return {
    success: true,
    data: {
      pendingTurns: games.filter((game) => game.status === 'your-turn').length,
      games,
    },
  }
})
