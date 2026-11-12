import { createError, type H3Event } from 'h3'
import { requireHumanApiUser } from './authGuard'
import { randomInt } from 'node:crypto'
import prisma from './prisma'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  accountWithStory,
  storyFromAccount,
  validSlimeCityStory,
  type SlimeCityStory,
} from '~/utils/slimeCity/storySave'
import {
  CARDS,
  TEAMS,
  replayMatch,
  type Command,
  type MatchState,
  type TeamId,
} from '~/utils/slimeCity/prototypes'
import {
  clashOutcome,
  clashRewardCards,
  clashRewardMode,
  clashRewardSetupProblem,
  clashRewardStart,
  replayClashTranscript,
  type ClashRewardSetup,
} from '~/utils/slimeCity/clashRewards'
import { STARTER_CARD_IDS } from '~/utils/slimeCity/alliance'
import {
  awardBattle,
  awardOutcome,
  buyPack,
  canBuyPack,
  claimChallenge,
  newProgression,
  refreshPeriods,
  restoreProgression,
  type Progression,
} from '~/utils/slimeCity/progression'

/** /admin/slime-city is an internal preview. Keep rewards off the public API surface. */
/**
 * Games between players are open to every signed-in player (Silas,
 * 2026-11-11 PT: "Remove admin limitation"). Guests and agents stay out:
 * a duel needs a real account on each side. Rewards stay admin-preview.
 */
export async function requireSlimeCityPlayer(event: H3Event) {
  const auth = await requireHumanApiUser(event)
  if (auth.user.isGuest)
    throw createError({
      statusCode: 403,
      message: 'Sign in to play Slime City against other players.',
    })
  return auth
}

export async function requireSlimeCityPreviewUser(event: H3Event) {
  const auth = await requireHumanApiUser(event)
  if (!auth.isAdmin || auth.user.isGuest)
    throw createError({
      statusCode: 403,
      message: 'Slime City progression is admin-preview only.',
    })
  return auth
}

const toJson = (data: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(data))

/** All virtual Meat, XP, inventory and claims belong to a real User row. */
export async function getSlimeCityAccount(
  userId: number,
): Promise<Progression> {
  const row = await prisma.slimeCityAccount.findUnique({ where: { userId } })
  return row ? restoreProgression(row.data) : newProgression()
}

/** Optimistic compare-and-swap plus DB transaction protects competing tabs. */
async function changeAccount(
  userId: number,
  mutate: (state: Progression) => Progression,
): Promise<Progression> {
  return prisma.$transaction(async (tx) => {
    await tx.slimeCityAccount.upsert({
      where: { userId },
      update: {},
      create: { userId, data: toJson(newProgression()) },
    })
    const row = await tx.slimeCityAccount.findUniqueOrThrow({
      where: { userId },
    })
    const before = restoreProgression(row.data)
    const after = mutate(before)
    if (after === before) return before
    const updated = await tx.slimeCityAccount.updateMany({
      where: { userId, version: row.version },
      data: {
        data: toJson(accountWithStory(row.data, after)),
        version: { increment: 1 },
      },
    })
    if (updated.count !== 1)
      throw createError({
        statusCode: 409,
        message: 'Wallet was updated by another request. Retry.',
      })
    return after
  })
}

export async function buySlimeCityPack(userId: number): Promise<Progression> {
  return changeAccount(userId, (state) => {
    if (!canBuyPack(state))
      throw createError({
        statusCode: 409,
        message:
          'Not enough virtual Meat, or no complete rare-guaranteed packs remain.',
      })
    return buyPack(state, randomInt(1, 0x7fffffff))
  })
}
export async function claimSlimeCityChallenge(
  userId: number,
  id: string,
): Promise<Progression> {
  const before = await getSlimeCityAccount(userId)
  const valid = claimChallenge(before, id)
  if (valid === before)
    throw createError({
      statusCode: 409,
      message: 'Challenge is unavailable or already claimed.',
    })
  return changeAccount(userId, (state) => {
    const after = claimChallenge(state, id)
    if (after === state)
      throw createError({
        statusCode: 409,
        message: 'Challenge is unavailable or already claimed.',
      })
    return after
  })
}

/**
 * Issued server-side: clients cannot choose rewarding seeds or opponents.
 * With a Clash `setup` (Solo or Alliance deck) the match is CLASH: the deck is
 * checked for legality (and TRICKLE ownership) and kept with the match, so the
 * reward replay uses exactly the deck that was issued. Without one, legacy
 * BLACKOUT is issued for older clients.
 */
export async function startSlimeCityCpuMatch(
  userId: number,
  teamId: string,
  setup?: unknown,
  boutFoe?: unknown,
) {
  if (!TEAMS.some((team) => team.id === teamId))
    throw createError({ statusCode: 400, message: 'Unknown Slime City crew.' })
  const seed = randomInt(100000, 1000000)
  const team = teamId as TeamId
  const foes = TEAMS.filter((t) => t.id !== team)
  // A bout (SOLO story, CAMPAIGN, TOWER) names its rival; PRACTICE never does.
  const bout =
    !!setup &&
    typeof setup === 'object' &&
    (setup as { bout?: unknown }).bout !== undefined
  if (bout && !TEAMS.some((t) => t.id === boutFoe))
    throw createError({ statusCode: 400, message: 'Unknown bout rival.' })
  const foeId = bout ? (boutFoe as TeamId) : foes[randomInt(foes.length)]!.id
  if (setup === undefined) {
    const row = await prisma.slimeCityMatch.create({
      data: { userId, mode: 'blackout', teamId: team, foeId, seed },
    })
    return { id: row.id, mode: 'blackout' as const, teamId: team, foeId, seed }
  }
  const problem = clashRewardSetupProblem(team, setup)
  if (problem) throw createError({ statusCode: 400, message: problem })
  const clash = setup as ClashRewardSetup
  const account = await prisma.slimeCityAccount.findUnique({
    where: { userId },
  })
  {
    const owned = new Set(restoreProgression(account?.data).cards)
    if (
      clashRewardCards(clash).some(
        (id) => !STARTER_CARD_IDS.has(id) && !owned.has(id),
      )
    )
      throw createError({
        statusCode: 403,
        message: 'Unlock every card in this deck before a reward match.',
      })
  }
  const mode = clashRewardMode(clash)
  // The issued deck rides in `commands` until settlement replaces it with
  // the verified transcript (no schema change needed).
  const row = await prisma.slimeCityMatch.create({
    data: {
      userId,
      mode,
      teamId: team,
      foeId,
      seed,
      commands: toJson({ setup: clash }),
    },
  })
  return { id: row.id, mode, teamId: team, foeId, seed }
}

/** Verify a Clash reward transcript against the issued setup. */
export function validateSlimeCityClash(
  setup: {
    mode: string
    teamId: string
    foeId: string
    seed: number
    startedAt: Date
    commands: unknown
  },
  commands: unknown,
  now = new Date(),
) {
  const ageMs = now.getTime() - setup.startedAt.getTime()
  if (ageMs < 5000 || ageMs > 86400000)
    throw createError({
      statusCode: 409,
      message: 'CPU battle is too short or expired.',
    })
  const stored = (setup.commands as { setup?: ClashRewardSetup } | null)?.setup
  if (
    !stored ||
    !TEAMS.some((x) => x.id === setup.foeId) ||
    clashRewardSetupProblem(setup.teamId, stored)
  )
    throw createError({
      statusCode: 400,
      message: 'Invalid server match setup.',
    })
  const result = replayClashTranscript(
    clashRewardStart(
      setup.teamId as TeamId,
      setup.foeId as TeamId,
      setup.seed,
      stored,
    ),
    commands,
  )
  if ('error' in result)
    throw createError({ statusCode: 409, message: result.error })
  return result.state
}

/** A server replay is required; a client-submitted winner/XP/Meat is ignored. */
export function validateSlimeCityBattle(
  setup: {
    mode: string
    teamId: string
    foeId: string
    seed: number
    startedAt: Date
  },
  commands: unknown,
  now = new Date(),
): MatchState {
  if (!Array.isArray(commands) || commands.length < 3 || commands.length > 600)
    throw createError({
      statusCode: 400,
      message: 'Incomplete or oversized battle transcript.',
    })
  const ageMs = now.getTime() - setup.startedAt.getTime()
  if (ageMs < 5000 || ageMs > 86400000)
    throw createError({
      statusCode: 409,
      message: 'CPU battle is too short or expired.',
    })
  if (
    setup.mode !== 'blackout' ||
    !TEAMS.some((x) => x.id === setup.teamId) ||
    !TEAMS.some((x) => x.id === setup.foeId)
  )
    throw createError({
      statusCode: 400,
      message: 'Invalid server match setup.',
    })
  let ends = 0
  let plays = 0
  for (const action of commands) {
    if (!action || typeof action !== 'object' || typeof action.t !== 'string')
      throw createError({ statusCode: 400, message: 'Bad battle command.' })
    if (action.t === 'end') {
      ends++
      continue
    }
    if (action.side !== 'player')
      throw createError({
        statusCode: 403,
        message: 'Cannot submit CPU-owned commands.',
      })
    if (action.t === 'discard') {
      if (typeof action.card !== 'string' || action.card.length > 90)
        throw createError({
          statusCode: 400,
          message: 'Malformed hand discard.',
        })
    } else if (action.t === 'deploy') {
      if (
        !CARDS.some((c) => c.id === action.card) ||
        !Number.isSafeInteger(action.x) ||
        !Number.isSafeInteger(action.y)
      )
        throw createError({ statusCode: 400, message: 'Malformed deployment.' })
      plays++
    } else if (action.t === 'move') {
      if (![action.id, action.x, action.y].every(Number.isSafeInteger))
        throw createError({ statusCode: 400, message: 'Malformed movement.' })
    } else if (action.t === 'stance') {
      if (
        !Number.isSafeInteger(action.id) ||
        (action.stance !== 'attack' && action.stance !== 'defend')
      )
        throw createError({ statusCode: 400, message: 'Malformed order.' })
    } else if (action.t === 'reveal') {
      if (!Number.isSafeInteger(action.id))
        throw createError({ statusCode: 400, message: 'Malformed reveal.' })
    } else
      throw createError({ statusCode: 400, message: 'Unknown battle command.' })
  }
  if (ends < 2 || plays < 1)
    throw createError({
      statusCode: 400,
      message: 'Battle needs played units and real turns.',
    })
  const verified = replayMatch(
    {
      mode: 'blackout',
      teamId: setup.teamId as TeamId,
      foeId: setup.foeId as TeamId,
      seed: setup.seed,
    },
    commands as Command[],
  )
  if (
    !verified.victor ||
    JSON.stringify(verified.commands) !== JSON.stringify(commands)
  )
    throw createError({
      statusCode: 409,
      message: 'Match is incomplete or actions failed replay validation.',
    })
  return verified
}

export async function finishSlimeCityCpuMatch(
  userId: number,
  id: string,
  commands: unknown,
): Promise<Progression> {
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id))
    throw createError({ statusCode: 400, message: 'Invalid match id.' })
  return prisma.$transaction(async (tx) => {
    const match = await tx.slimeCityMatch.findFirst({ where: { id, userId } })
    if (!match || match.settledAt)
      throw createError({
        statusCode: 409,
        message: 'CPU match not found or already rewarded.',
      })
    const now = new Date()
    const clash = match.mode.startsWith('clash')
    const verified = clash
      ? validateSlimeCityClash(match, commands, now)
      : validateSlimeCityBattle(match, commands, now)
    const row = await tx.slimeCityAccount.upsert({
      where: { userId },
      update: {},
      create: { userId, data: toJson(newProgression(now)) },
    })
    const before = refreshPeriods(restoreProgression(row.data, now), now)
    const after = clash
      ? awardOutcome(
          before,
          clashOutcome(id, verified as never, match.mode),
          now,
        )
      : awardBattle(before, verified as never, now)
    const updated = await tx.slimeCityAccount.updateMany({
      where: { userId, version: row.version },
      data: {
        data: toJson(accountWithStory(row.data, after)),
        version: { increment: 1 },
      },
    })
    if (updated.count !== 1)
      throw createError({
        statusCode: 409,
        message: 'Wallet changed; please retry settlement.',
      })
    const settled = await tx.slimeCityMatch.updateMany({
      where: { id, userId, settledAt: null },
      data: {
        settledAt: now,
        result: verified.victor!,
        commands: toJson(commands),
      },
    })
    if (settled.count !== 1)
      throw createError({ statusCode: 409, message: 'Battle already settled.' })
    return after
  })
}

/** Story and city progress are private and never award XP, cards or virtual Meat. */
export async function getSlimeCityStory(
  userId: number,
): Promise<SlimeCityStory> {
  const row = await prisma.slimeCityAccount.findUnique({ where: { userId } })
  return storyFromAccount(row?.data)
}

/** Guard against cross-tab clobber, and preserve the separately validated wallet. */
export async function saveSlimeCityStory(
  userId: number,
  body: unknown,
): Promise<SlimeCityStory> {
  if (!validSlimeCityStory(body) || JSON.stringify(body).length > 32768)
    throw createError({
      statusCode: 400,
      message: 'Invalid or oversized story save.',
    })
  const proposed = body as SlimeCityStory
  return prisma.$transaction(async (tx) => {
    const row = await tx.slimeCityAccount.upsert({
      where: { userId },
      update: {},
      create: { userId, data: toJson(newProgression()) },
    })
    const current = storyFromAccount(row.data)
    const ownedCards = new Set(restoreProgression(row.data).cards)
    // Silas, 2026-11-10 PT: everyone, admin included, builds from the base
    // collection plus the cards they unlock. Decks are always ownership-gated.
    const allDecks = [
      ...Object.values(proposed.decks ?? {}),
      ...Object.values(proposed.soloDecks ?? {}),
      ...Object.values(proposed.alliances ?? {}).map((deck) => deck?.cards),
      ...(proposed.library ?? []).map((deck) => deck?.cards),
    ]
    for (const deck of allDecks) {
      if (deck?.some((id) => !STARTER_CARD_IDS.has(id) && !ownedCards.has(id)))
        throw createError({
          statusCode: 403,
          message:
            'Unlock reserve or mercenary cards before adding them to a deck.',
        })
    }
    if (proposed.revision !== current.revision)
      throw createError({
        statusCode: 409,
        message: 'Story changed in another tab. Reload before saving.',
      })
    const next: SlimeCityStory = {
      version: 1,
      revision: current.revision + 1,
      city: proposed.city,
      campaigns: proposed.campaigns,
      // The tower run and journey seat were validated but then dropped here,
      // so a reload lost them; keep them like the rest of the story.
      ...((proposed.tower ?? current.tower)
        ? { tower: proposed.tower ?? current.tower }
        : {}),
      ...(proposed.journeyTeam ? { journeyTeam: proposed.journeyTeam } : {}),
      ...(proposed.journeyFormat
        ? { journeyFormat: proposed.journeyFormat }
        : {}),
      ...(proposed.journeyDeckId !== undefined
        ? { journeyDeckId: proposed.journeyDeckId }
        : {}),
      ...(proposed.journeyScreen
        ? { journeyScreen: proposed.journeyScreen }
        : {}),
      ...((proposed.decks ?? current.decks)
        ? { decks: proposed.decks ?? current.decks }
        : {}),
      ...((proposed.soloDecks ?? current.soloDecks)
        ? { soloDecks: proposed.soloDecks ?? current.soloDecks }
        : {}),
      ...((proposed.alliances ?? current.alliances)
        ? { alliances: proposed.alliances ?? current.alliances }
        : {}),
      ...((proposed.library ?? current.library)
        ? { library: proposed.library ?? current.library }
        : {}),
      unlocks: 'trickle',
      ...((proposed.storyMode ?? current.storyMode)
        ? { storyMode: proposed.storyMode ?? current.storyMode }
        : {}),
      ...((proposed.storyParity ?? current.storyParity) !== undefined
        ? { storyParity: proposed.storyParity ?? current.storyParity }
        : {}),
      // An ending once found stays found, even if a stale tab omits it.
      ...((proposed.endings ?? current.endings)
        ? {
            endings: [
              ...new Set([
                ...(current.endings ?? []),
                ...(proposed.endings ?? []),
              ]),
            ],
          }
        : {}),
      ...((proposed.scrapbook ?? current.scrapbook)
        ? { scrapbook: proposed.scrapbook ?? current.scrapbook }
        : {}),
    }
    const raw =
      row.data && typeof row.data === 'object' && !Array.isArray(row.data)
        ? (row.data as Record<string, unknown>)
        : newProgression()
    const updated = await tx.slimeCityAccount.updateMany({
      where: { userId, version: row.version },
      data: {
        data: toJson({ ...raw, story: next }),
        version: { increment: 1 },
      },
    })
    if (updated.count !== 1)
      throw createError({
        statusCode: 409,
        message: 'Account changed during save. Retry.',
      })
    return next
  })
}
