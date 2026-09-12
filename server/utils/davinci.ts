// /server/utils/davinci.ts
//
// Da Vinci life-sim ending resolution. The app owns this math — AI narration
// may generate prose and choices, but the outcomeKey, ending lookup, and
// award records come from here.
//
// Bit order matches conductor's projects/davinci/data/ending-dimensions.yaml
// and scripts/generate_davinci_endings.py: outcomeKey[i] is DIMENSIONS[i],
// '1' = pass. Do not reorder without migrating the seeded endings.

import prisma from './prisma'
import { LifeArtSceneType } from '~/prisma/generated/prisma/client'
import {
  LIFE_DECK_KEY,
  parseDeckAxes,
  resolveDeckOutcomeKey,
  type DeckDefinition,
} from './endingDeckMath'

export interface ResolveLifeRunResult {
  outcomeKey: string
  stats: Record<string, number>
  ending: { id: number; title: string; slug: string; victoryType: string }
  achievementId: number | null
  achievementRecordId: number | null
  achievementAwarded: boolean
  lifeAchievementId: number | null
  unlockId: number | null
  lifeAchievementAwarded: boolean
}

// prisma is $extends()-wrapped (see server/utils/prisma.ts), so its
// $transaction callback's tx param has extended InternalArgs that don't
// structurally match the plain Prisma.TransactionClient type. Derive the
// type from the actual instance instead of the generated default.
type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0]

// Read-only counterpart to resolveLifeRunEnding's write path, used when a run
// is already COMPLETE: re-derives the ResolveLifeRunResult shape from the
// stored outcomeKey/statsSnapshot/ending instead of recomputing stats and
// re-running the award transaction. Never awards — awarding only happens once,
// on the run's first resolve.
async function resolveCompletedLifeRun(
  tx: TransactionClient,
  run: { id: number; statsSnapshot: string | null },
  outcomeKey: string,
  endingId: number,
  userId: number,
): Promise<ResolveLifeRunResult> {
  const ending = await tx.lifeEnding.findUnique({ where: { id: endingId } })
  if (!ending) {
    const error = new Error(
      `LifeEnding ${endingId} referenced by LifeRun ${run.id} no longer exists.`,
    )
    ;(error as Error & { statusCode?: number }).statusCode = 500
    throw error
  }

  const stats: Record<string, number> = run.statsSnapshot
    ? JSON.parse(run.statsSnapshot)
    : {}

  const achievementRecord = ending.achievementId
    ? await tx.achievementRecord.findFirst({
        where: { achievementId: ending.achievementId, userId },
        select: { id: true },
      })
    : null

  const lifeAchievement = await tx.lifeAchievement.findFirst({
    where: { endingId: ending.id, isActive: true },
    select: { id: true },
  })
  const unlock = lifeAchievement
    ? await tx.lifeAchievementUnlock.findFirst({
        where: { userId, achievementId: lifeAchievement.id },
        select: { id: true },
      })
    : null

  return {
    outcomeKey,
    stats,
    ending: {
      id: ending.id,
      title: ending.title,
      slug: ending.slug,
      victoryType: ending.victoryType,
    },
    achievementId: ending.achievementId,
    achievementRecordId: achievementRecord?.id ?? null,
    achievementAwarded: false,
    lifeAchievementId: lifeAchievement?.id ?? null,
    unlockId: unlock?.id ?? null,
    lifeAchievementAwarded: false,
  }
}

/**
 * Award a deck's COLLECTION achievement once the reader has found every
 * ending in it.
 *
 * Runs inside the resolve transaction so the last ending and the completion
 * it triggers land together. Does nothing when the deck has no COLLECTION
 * achievement seeded, which is the normal state for a deck whose art and
 * copy are still being written.
 */
async function awardDeckCollection(
  tx: TransactionClient,
  input: {
    deckId: number
    deckKey: string
    userId: number
    username: string | null
    lifeRunId: number
  },
): Promise<void> {
  const collectionAchievement = await tx.lifeAchievement.findFirst({
    where: {
      achievementType: 'COLLECTION',
      conditionKey: `deck:${input.deckKey}`,
      isActive: true,
    },
    select: { id: true, achievementId: true },
  })
  if (!collectionAchievement) return

  const alreadyHeld = await tx.lifeAchievementUnlock.findFirst({
    where: { userId: input.userId, achievementId: collectionAchievement.id },
    select: { id: true },
  })
  if (alreadyHeld) return

  const endings = await tx.lifeEnding.findMany({
    where: { deckId: input.deckId, isActive: true },
    select: {
      Achievements: { where: { isActive: true }, select: { id: true } },
    },
  })
  const endingAchievementIds = endings.flatMap((ending) =>
    ending.Achievements.map((achievement) => achievement.id),
  )
  // A deck with no per-ending achievements cannot be "completed" -- there is
  // nothing to have collected.
  if (!endingAchievementIds.length) return

  const held = await tx.lifeAchievementUnlock.findMany({
    where: {
      userId: input.userId,
      achievementId: { in: endingAchievementIds },
    },
    select: { achievementId: true },
  })
  const heldIds = new Set(held.map((unlock) => unlock.achievementId))
  if (heldIds.size < new Set(endingAchievementIds).size) return

  let achievementRecordId: number | null = null
  if (collectionAchievement.achievementId) {
    const existing = await tx.achievementRecord.findFirst({
      where: {
        achievementId: collectionAchievement.achievementId,
        userId: input.userId,
      },
      select: { id: true },
    })
    achievementRecordId =
      existing?.id ??
      (
        await tx.achievementRecord.create({
          data: {
            achievementId: collectionAchievement.achievementId,
            userId: input.userId,
            username: input.username,
          },
        })
      ).id
  }

  await tx.lifeAchievementUnlock.create({
    data: {
      userId: input.userId,
      achievementId: collectionAchievement.id,
      lifeRunId: input.lifeRunId,
      achievementRecordId,
      data: JSON.stringify({ deck: input.deckKey, collected: true }),
    },
  })
}

// Resolves a LifeRun's stats into its deterministic ending and awards the
// linked Achievement + LifeAchievement. Idempotent: re-resolving an already
// completed run re-derives the same ending and awards nothing twice.
//
// Duplicate-unlock guard: LifeAchievementUnlock's unique
// (userId, achievementId, lifeRunId) does NOT protect global uniqueness —
// MySQL treats each NULL lifeRunId as distinct, and different runs reaching
// the same ending would each satisfy the constraint. Ending achievements are
// one-per-user, so we guard on (userId, achievementId) here at the API layer.
export async function resolveStoryRunEnding(
  lifeRunId: number,
  userId: number,
  username?: string | null,
): Promise<ResolveLifeRunResult> {
  return prisma.$transaction(async (tx) => {
    const run = await tx.lifeRun.findUnique({
      where: { id: lifeRunId },
      include: { Stats: true, Deck: true },
    })
    if (!run) {
      const error = new Error(`LifeRun ${lifeRunId} does not exist.`)
      ;(error as Error & { statusCode?: number }).statusCode = 404
      throw error
    }
    if (run.userId !== userId) {
      const error = new Error(
        'LifeRun does not belong to the authenticated user.',
      )
      ;(error as Error & { statusCode?: number }).statusCode = 403
      throw error
    }

    // Guard: a COMPLETE run already has its outcomeKey/ending/awards settled.
    // Read the stored result back instead of recomputing stats and re-running
    // the award transaction — recompute is redundant once resolved (Stats
    // never change post-completion) and skipping it avoids a wasted write on
    // every repeat resolve call (e.g. a client retrying after a dropped
    // response). achievementAwarded/lifeAchievementAwarded are always false
    // here since a genuinely new award only happens on first resolve.
    if (run.status === 'COMPLETE') {
      if (!run.outcomeKey || run.endingId == null) {
        const error = new Error(
          `LifeRun ${lifeRunId} is COMPLETE but missing its outcomeKey/endingId.`,
        )
        ;(error as Error & { statusCode?: number }).statusCode = 500
        throw error
      }
      return resolveCompletedLifeRun(
        tx,
        run,
        run.outcomeKey,
        run.endingId,
        userId,
      )
    }

    // Which deck's axes decide this run. A run created before decks existed
    // has deckId NULL and is a life run by definition, so it resolves against
    // the life deck exactly as it always did.
    const deckRow =
      run.Deck ??
      (await tx.endingDeck.findUnique({ where: { key: LIFE_DECK_KEY } }))
    if (!deckRow) {
      const error = new Error(
        `No '${LIFE_DECK_KEY}' EndingDeck exists. Run the deck seed importer first.`,
      )
      ;(error as Error & { statusCode?: number }).statusCode = 500
      throw error
    }
    const deck: DeckDefinition = {
      key: deckRow.key,
      title: deckRow.title,
      axes: parseDeckAxes(deckRow.axes),
      passValue: deckRow.passValue,
    }

    // A story does not get to end early. The budget is what makes an ending
    // feel earned rather than picked, so the server holds it even though the
    // client also hides the button.
    //
    // Only for runs the new engine created. A run with turnBudget NULL was
    // opened through POST /api/davinci/runs, which never had a server-side
    // turn gate -- the life UI enforces MIN_CHAPTERS_BEFORE_ENDING itself.
    // Retrofitting a refusal onto a game already being played is a design
    // change, not a refactor, so a legacy run still resolves whenever it
    // asks. New life runs get the gate from the life deck's
    // minTurnsBeforeResolve.
    const playedTurns = Math.max(0, run.currentChapter - 1)
    const minimum =
      run.turnBudget === null
        ? 0
        : (deckRow.minTurnsBeforeResolve ?? run.turnBudget)
    if (playedTurns < minimum) {
      const error = new Error(
        `This story resolves after ${minimum} turns; ${playedTurns} have been played.`,
      )
      ;(error as Error & { statusCode?: number }).statusCode = 409
      throw error
    }

    const stats: Record<string, number> = {}
    for (const stat of run.Stats) stats[stat.key] = stat.value
    const outcomeKey = resolveDeckOutcomeKey(deck, stats)

    // findFirst, not findUnique: the global unique on outcomeKey is still in
    // place and the composite (deckId, outcomeKey) index does not become the
    // lookup key until the second genre deck ships (storybook/t-030). Scoping
    // by deckId here is what lets that later migration be a no-op for callers.
    const ending = await tx.lifeEnding.findFirst({
      where: { deckId: deckRow.id, outcomeKey, isActive: true },
    })
    if (!ending) {
      const error = new Error(
        `No ending seeded for outcomeKey ${outcomeKey} in the ${deckRow.key} deck. Run the seed importer first.`,
      )
      ;(error as Error & { statusCode?: number }).statusCode = 404
      throw error
    }

    await tx.lifeRun.update({
      where: { id: run.id },
      data: {
        outcomeKey,
        endingId: ending.id,
        status: 'COMPLETE',
        statsSnapshot: JSON.stringify(stats),
      },
    })

    // Award the linked Achievement (davinci-ending-{outcomeKey}) once per user.
    let achievementRecordId: number | null = null
    let achievementAwarded = false
    if (ending.achievementId) {
      const existingRecord = await tx.achievementRecord.findFirst({
        where: { achievementId: ending.achievementId, userId },
        select: { id: true },
      })
      if (existingRecord) {
        achievementRecordId = existingRecord.id
      } else {
        const record = await tx.achievementRecord.create({
          data: {
            achievementId: ending.achievementId,
            userId,
            username: username ?? null,
          },
        })
        achievementRecordId = record.id
        achievementAwarded = true
      }
    }

    // Award the linked LifeAchievement once per user (global guard — see above).
    let lifeAchievementId: number | null = null
    let unlockId: number | null = null
    let lifeAchievementAwarded = false
    const lifeAchievement = await tx.lifeAchievement.findFirst({
      where: { endingId: ending.id, isActive: true },
      select: { id: true },
    })
    if (lifeAchievement) {
      lifeAchievementId = lifeAchievement.id
      const existingUnlock = await tx.lifeAchievementUnlock.findFirst({
        where: { userId, achievementId: lifeAchievement.id },
        select: { id: true },
      })
      if (existingUnlock) {
        unlockId = existingUnlock.id
      } else {
        const unlock = await tx.lifeAchievementUnlock.create({
          data: {
            userId,
            achievementId: lifeAchievement.id,
            lifeRunId: run.id,
            achievementRecordId,
            data: JSON.stringify({ outcomeKey }),
          },
        })
        unlockId = unlock.id
        lifeAchievementAwarded = true
      }
    }

    // A deck is COLLECTED when every one of its active endings has been
    // found. Silas asked for endings the reader "gets credit for in a
    // collection"; this is the credit for finishing the collection itself.
    // Same one-per-user guard as an ending unlock, and silent when the deck
    // has no COLLECTION achievement seeded.
    await awardDeckCollection(tx, {
      deckId: deckRow.id,
      deckKey: deckRow.key,
      userId,
      username: username ?? null,
      lifeRunId: run.id,
    })

    return {
      outcomeKey,
      stats,
      ending: {
        id: ending.id,
        title: ending.title,
        slug: ending.slug,
        victoryType: ending.victoryType,
      },
      achievementId: ending.achievementId,
      achievementRecordId,
      achievementAwarded,
      lifeAchievementId,
      unlockId,
      lifeAchievementAwarded,
    }
  })
}

/**
 * The pre-deck name, kept as a delegate.
 *
 * POST /api/davinci/runs/:id/resolve and utils/scripts/verifyDaVinciPlayLoop.ts
 * both call this. A life run has deckId NULL (legacy) or the life deck, so it
 * resolves through exactly the same path it always did.
 */
export async function resolveLifeRunEnding(
  lifeRunId: number,
  userId: number,
  username?: string | null,
): Promise<ResolveLifeRunResult> {
  return resolveStoryRunEnding(lifeRunId, userId, username)
}

// --- Play loop (davinci/t-013) --------------------------------------------
//
// The durable-state substrate the Chat narrator calls: create a run, record a
// choice with its stat effects, and read a run back for resume. AI narration
// is out of scope — these endpoints own state, not prose.
//
// This engine is the 'life' shape of Storybook (merged 2026-09-09). It keeps
// its own Life* models because they encode something the beat loop has no
// equivalent of — ten dimensions resolving to one of 1,024 pre-seeded endings
// — not because the two products are meant to stay apart. Storybook seeds a
// run from the same Character and Dream the reader picked on the setup screen,
// through the FK columns createLifeRun already accepts.

export function withStatusCode(message: string, statusCode: number): Error {
  const error = new Error(message)
  ;(error as Error & { statusCode?: number }).statusCode = statusCode
  return error
}

// A life run/choice may only reference records the player is allowed to attach:
// their own, or a public one. Without this the raw characterId/dreamId/botId/
// artCollectionId/chatId FKs let a user pin — and then read back through the run
// — another user's PRIVATE record (audit P6 MEDIUM/LOW). A non-existent id
// passes here and is caught by the FK constraint on write.
type AttachableResource =
  'Character' | 'Dream' | 'Bot' | 'ArtCollection' | 'Chat'

export async function assertAttachable(
  resource: AttachableResource,
  id: number | null | undefined,
  userId: number,
): Promise<void> {
  if (id === null || id === undefined) return
  if (!Number.isInteger(id) || id <= 0) {
    throw withStatusCode(`${resource} id must be a positive integer.`, 400)
  }

  let forbidden = 0
  switch (resource) {
    case 'Character':
      forbidden = await prisma.character.count({
        where: { id, NOT: { OR: [{ userId }, { isPublic: true }] } },
      })
      break
    case 'Dream':
      forbidden = await prisma.dream.count({
        where: { id, NOT: { OR: [{ userId }, { isPublic: true }] } },
      })
      break
    case 'Bot':
      forbidden = await prisma.bot.count({
        where: { id, NOT: { OR: [{ userId }, { isPublic: true }] } },
      })
      break
    case 'ArtCollection':
      forbidden = await prisma.artCollection.count({
        where: { id, NOT: { OR: [{ userId }, { isPublic: true }] } },
      })
      break
    case 'Chat':
      forbidden = await prisma.chat.count({
        where: { id, NOT: { OR: [{ userId }, { isPublic: true }] } },
      })
      break
  }

  if (forbidden > 0) {
    throw withStatusCode(
      `You do not have permission to attach that ${resource}.`,
      403,
    )
  }
}

export interface CreateLifeRunInput {
  title: string
  seed?: string | null
  protagonistName?: string | null
  genre?: string | null
  currentChapter?: number | null
  characterId?: number | null
  dreamId?: number | null
  botId?: number | null
  artCollectionId?: number | null
}

// Creates a fresh ACTIVE run owned by the user. A seed is generated when the
// caller doesn't supply one so runs are always reproducible/identifiable.
export async function createLifeRun(userId: number, input: CreateLifeRunInput) {
  const title = input.title?.trim()
  if (!title) throw withStatusCode('A run title is required.', 400)

  const seed = input.seed?.trim() || `run-${Date.now()}-${crypto.randomUUID()}`
  const currentChapter =
    typeof input.currentChapter === 'number' && input.currentChapter > 0
      ? input.currentChapter
      : 1

  await Promise.all([
    assertAttachable('Character', input.characterId, userId),
    assertAttachable('Dream', input.dreamId, userId),
    assertAttachable('Bot', input.botId, userId),
    assertAttachable('ArtCollection', input.artCollectionId, userId),
  ])

  return prisma.lifeRun.create({
    data: {
      userId,
      title,
      seed,
      status: 'ACTIVE',
      currentChapter,
      protagonistName: input.protagonistName ?? null,
      genre: input.genre ?? null,
      characterId: input.characterId ?? null,
      dreamId: input.dreamId ?? null,
      botId: input.botId ?? null,
      artCollectionId: input.artCollectionId ?? null,
    },
  })
}

export interface RecordChoiceInput {
  chapter: number
  prompt: string
  choiceText: string
  resultText?: string | null
  // Dimension (or arbitrary stat) key -> integer delta. Applied atomically to
  // LifeStat. The resolver only reads the axes its ending deck declares, but
  // any stat key is allowed so the substrate stays flexible.
  effects?: Record<string, number>
  chatId?: number | null
}

// Records a LifeChoice and applies its stat deltas in one transaction. Only
// ACTIVE runs accept choices — a resolved (COMPLETE) or abandoned run is
// closed. Returns the created choice plus the run's full post-choice stats.
export async function recordLifeChoice(
  lifeRunId: number,
  userId: number,
  input: RecordChoiceInput,
) {
  if (!Number.isInteger(input.chapter) || input.chapter <= 0) {
    throw withStatusCode('chapter must be a positive integer.', 400)
  }
  const prompt = input.prompt?.trim()
  const choiceText = input.choiceText?.trim()
  if (!prompt || !choiceText) {
    throw withStatusCode('prompt and choiceText are required.', 400)
  }

  const effects = input.effects ?? {}
  for (const [key, delta] of Object.entries(effects)) {
    if (typeof delta !== 'number' || !Number.isFinite(delta)) {
      throw withStatusCode(`effect "${key}" must be a finite number.`, 400)
    }
  }

  await assertAttachable('Chat', input.chatId, userId)

  return prisma.$transaction(async (tx) => {
    const run = await tx.lifeRun.findUnique({ where: { id: lifeRunId } })
    if (!run) throw withStatusCode(`LifeRun ${lifeRunId} does not exist.`, 404)
    if (run.userId !== userId) {
      throw withStatusCode(
        'LifeRun does not belong to the authenticated user.',
        403,
      )
    }
    if (run.status !== 'ACTIVE') {
      throw withStatusCode(
        `LifeRun ${lifeRunId} is ${run.status}; only ACTIVE runs accept choices.`,
        409,
      )
    }

    // Idempotency guard: exactly one LifeChoice is ever meant to exist per
    // (lifeRunId, chapter) — the front end derives chapterIndex from
    // playedCount and only advances it after a choice lands
    // (storybook-life-run.vue),
    // so a second submission for an already-recorded chapter is always a
    // duplicate, never a legitimate second choice. Without this guard, two
    // browser tabs open on the same run (or a client retry after a dropped
    // response) would each create their own LifeChoice row and double-apply
    // `effects` via the increment upsert below, silently corrupting stats and
    // duplicating narrative history. Re-derive and return the already-recorded
    // result instead of writing again — same "read back, don't recompute"
    // idempotency shape as resolveCompletedLifeRun's COMPLETE-run guard above.
    const existingChoice = await tx.lifeChoice.findFirst({
      where: { lifeRunId, chapter: input.chapter },
      orderBy: { id: 'asc' },
    })
    if (existingChoice) {
      const stats = await tx.lifeStat.findMany({
        where: { lifeRunId },
        orderBy: { key: 'asc' },
      })
      return { choice: existingChoice, stats }
    }

    const choice = await tx.lifeChoice.create({
      data: {
        lifeRunId,
        chapter: input.chapter,
        prompt,
        choiceText,
        resultText: input.resultText ?? null,
        effects: JSON.stringify(effects),
        chatId: input.chatId ?? null,
      },
    })

    for (const [key, delta] of Object.entries(effects)) {
      await tx.lifeStat.upsert({
        where: { lifeRunId_key: { lifeRunId, key } },
        create: { lifeRunId, key, value: delta },
        update: { value: { increment: delta } },
      })
    }

    // Advance the run's chapter marker so a resume reflects progress.
    if (input.chapter > run.currentChapter) {
      await tx.lifeRun.update({
        where: { id: lifeRunId },
        data: { currentChapter: input.chapter },
      })
    }

    const stats = await tx.lifeStat.findMany({
      where: { lifeRunId },
      orderBy: { key: 'asc' },
    })

    return { choice, stats }
  })
}

// Loads a run with its stats, choices, contextual art, and (if resolved)
// ending — for resume. Art is included so a resumed run redisplays chapter
// and ending illustrations already attached, without a second round trip.
export async function getLifeRunForUser(lifeRunId: number, userId: number) {
  const run = await prisma.lifeRun.findUnique({
    where: { id: lifeRunId },
    include: {
      Stats: { orderBy: { key: 'asc' } },
      Choices: { orderBy: [{ chapter: 'asc' }, { id: 'asc' }] },
      Ending: true,
      Art: {
        orderBy: [{ chapter: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          chapter: true,
          sceneType: true,
          prompt: true,
          artImageId: true,
          ArtImage: { select: { imagePath: true, path: true } },
        },
      },
    },
  })
  if (!run) throw withStatusCode(`LifeRun ${lifeRunId} does not exist.`, 404)
  if (run.userId !== userId) {
    throw withStatusCode(
      'LifeRun does not belong to the authenticated user.',
      403,
    )
  }
  return run
}

export interface AttachLifeRunArtInput {
  chapter?: number | null
  sceneType: string
  prompt: string
  artImageId: number
}

// Persists a LifeRunArt row once a queued illustration for this run resolves
// to a real ArtImage. The narrator only ever *proposes* an artPrompt (see
// server/utils/davinciNarration.ts); this is the one place that turns a
// resolved image into durable contextual art, reusing the shared
// enqueue/entityArt art pipeline's output rather than a parallel store.
// Idempotent per (lifeRunId, chapter, sceneType): a resumed run that recovers
// or retries the same art job updates the existing row instead of duplicating
// it, since LifeRunArt has no unique constraint on that triple.
export async function attachLifeRunArt(
  lifeRunId: number,
  userId: number,
  input: AttachLifeRunArtInput,
) {
  const validSceneTypes = Object.values(LifeArtSceneType) as string[]
  if (!validSceneTypes.includes(input.sceneType)) {
    throw withStatusCode(
      `sceneType must be one of ${validSceneTypes.join(', ')}.`,
      400,
    )
  }
  const sceneType = input.sceneType as LifeArtSceneType
  const chapter =
    input.chapter === null || input.chapter === undefined
      ? null
      : Number(input.chapter)
  if (chapter !== null && (!Number.isInteger(chapter) || chapter <= 0)) {
    throw withStatusCode('chapter must be a positive integer or null.', 400)
  }
  const prompt = input.prompt?.trim()
  if (!prompt) throw withStatusCode('prompt is required.', 400)
  const artImageId = Number(input.artImageId)
  if (!Number.isInteger(artImageId) || artImageId <= 0) {
    throw withStatusCode('artImageId must be a positive integer.', 400)
  }

  const run = await prisma.lifeRun.findUnique({ where: { id: lifeRunId } })
  if (!run) throw withStatusCode(`LifeRun ${lifeRunId} does not exist.`, 404)
  if (run.userId !== userId) {
    throw withStatusCode(
      'LifeRun does not belong to the authenticated user.',
      403,
    )
  }

  const artImage = await prisma.artImage.findUnique({
    where: { id: artImageId },
  })
  if (!artImage) {
    throw withStatusCode(`ArtImage ${artImageId} does not exist.`, 404)
  }

  const existing = await prisma.lifeRunArt.findFirst({
    where: { lifeRunId, chapter, sceneType },
  })

  if (existing) {
    return prisma.lifeRunArt.update({
      where: { id: existing.id },
      data: { artImageId, prompt },
      include: { ArtImage: { select: { imagePath: true, path: true } } },
    })
  }

  return prisma.lifeRunArt.create({
    data: { lifeRunId, chapter, sceneType, prompt, artImageId },
    include: { ArtImage: { select: { imagePath: true, path: true } } },
  })
}
