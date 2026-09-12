// /server/utils/storybookRuns.ts
//
// Server-side story runs for every Storybook shape (storybook/t-029, t-032).
//
// Before this, only the life shape had a run: the beat shapes lived entirely in
// the reader's localStorage, which meant a story could not be resumed on
// another device, could not be counted in a collection, and had no ending to
// collect. Silas, 2026-09-12: a story should end "at one of the predetermined
// endpoint endings, which they get credit for in a collection of their
// adventures." That requires a row.
//
// Rather than a parallel table set, this generalizes the Life engine: LifeRun
// gained a shape, a deck, a turn budget, a bible snapshot, an inventory and a
// pending turn; LifeChoice gained a move source, an optional played Reward and
// a state delta. Life is the deck with key 'life'. See prisma/migrations/
// 20260912120000_add_ending_deck_and_story_run_columns.
//
// THE SERVER HOLDS THE OFFERED CHOICES. `LifeRun.pendingTurn` stores the scene
// the reader is looking at together with each option's effects, so submitting a
// move sends an option id, never a stat delta. The pre-deck play loop trusted
// the client's effects map (recordLifeChoice accepts any key by design); a
// storymaker with collectible endings cannot.

import prisma from './prisma'
import {
  LIFE_DECK_KEY,
  parseDeckAxes,
  type DeckDefinition,
} from './endingDeckMath'
import { assertAttachable, withStatusCode } from './davinci'
import { assertDeckPlayable, isDeckUnlocked } from './storybookGating'
import {
  PROSE_BOUNDS_BY_SHAPE,
  clampEffectsToDeck,
  generateStorybookTurn,
  type StoryBible,
  type StoryNarrator,
  type StoryTreasure,
  type StorybookMove,
  type StorybookNarrationRequest,
  type StorybookNarrationResult,
  type StorybookNarratorStyle,
  type StorybookShape,
} from './storybookNarration'
import type {
  StoryMoveSource,
  StoryShape,
} from '~/prisma/generated/prisma/client'

const DEFAULT_NARRATOR_BOT_ID = 433
/** Recent turns replayed to the narrator for continuity. */
const RECENT_TURN_WINDOW = 3
const MAX_CAST = 5
const MAX_FACETS = 5
const MAX_TREASURES = 3
const MAX_CUSTOM_MOVE_CHARS = 500

const SHAPE_BY_WIRE: Record<StorybookShape, StoryShape> = {
  'short-story': 'SHORT_STORY',
  chaptered: 'CHAPTERED',
  episodic: 'EPISODIC',
  life: 'LIFE',
}
const WIRE_BY_SHAPE: Record<StoryShape, StorybookShape> = {
  SHORT_STORY: 'short-story',
  CHAPTERED: 'chaptered',
  EPISODIC: 'episodic',
  LIFE: 'life',
}
const MOVE_SOURCE_BY_WIRE: Record<StorybookMove['source'], StoryMoveSource> = {
  option: 'OPTION',
  custom: 'CUSTOM',
  sheet: 'SHEET',
}

const NARRATOR_STYLES = new Set<StorybookNarratorStyle>([
  'cinematic',
  'playful',
  'storybook',
  'mysterious',
  'intimate',
])

/** A Reward held by the run, with the turn it was spent on if it is gone. */
export interface RunInventoryEntry extends StoryTreasure {
  /** 'loadout' (the protagonist's own), 'board' (a chosen treasure), 'found'. */
  origin: 'loadout' | 'board' | 'found'
  consumedAtTurn?: number | null
}

/** The scene the reader is currently looking at. */
export interface PendingTurn {
  turnIndex: number
  narrativeText: string
  choices: { id: string; choiceText: string; effects: Record<string, number> }[]
  artPrompt: string | null
  endingHint: string | null
  narrator: string
}

export interface StoryBoardInput {
  shape: StorybookShape
  deckKey?: string | null
  title?: string | null
  /** The optional typed premise. A board with no spark is a valid board. */
  spark?: string | null
  narratorStyle?: string | null
  botId?: number | null
  castSlugs?: string[]
  castRoles?: Record<string, string>
  locationSlug?: string | null
  facetSlugs?: string[]
  scenarioSlug?: string | null
  rewardSlugs?: string[]
}

export interface LoadedDeck {
  id: number
  key: string
  title: string
  description: string | null
  ownerKind: string
  axes: DeckDefinition['axes']
  passValue: number
  turnBudget: number
  turnBudgetByShape: Partial<Record<StorybookShape, number>>
  minTurnsBeforeResolve: number | null
  unlockAchievementId: number | null
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value)
    return (parsed ?? fallback) as T
  } catch {
    return fallback
  }
}

function toDeckDefinition(deck: LoadedDeck): DeckDefinition {
  return {
    key: deck.key,
    title: deck.title,
    axes: deck.axes,
    passValue: deck.passValue,
  }
}

/** Turns this deck gives a run of this shape. */
export function deckTurnBudget(
  deck: LoadedDeck,
  shape: StorybookShape,
): number {
  const perShape = deck.turnBudgetByShape[shape]
  return typeof perShape === 'number' && perShape > 0
    ? perShape
    : deck.turnBudget
}

function hydrateDeck(row: {
  id: number
  key: string
  title: string
  description: string | null
  ownerKind: string
  axes: string
  passValue: number
  turnBudget: number
  turnBudgetByShape: string | null
  minTurnsBeforeResolve: number | null
  unlockAchievementId: number | null
}): LoadedDeck {
  return {
    id: row.id,
    key: row.key,
    title: row.title,
    description: row.description,
    ownerKind: row.ownerKind,
    axes: parseDeckAxes(row.axes),
    passValue: row.passValue,
    turnBudget: row.turnBudget,
    turnBudgetByShape: parseJson(row.turnBudgetByShape, {}),
    minTurnsBeforeResolve: row.minTurnsBeforeResolve,
    unlockAchievementId: row.unlockAchievementId,
  }
}

/** Load a deck by id, falling back to the life deck for a pre-deck run. */
export async function loadDeck(deckId: number | null): Promise<LoadedDeck> {
  const row = deckId
    ? await prisma.endingDeck.findUnique({ where: { id: deckId } })
    : await prisma.endingDeck.findUnique({ where: { key: LIFE_DECK_KEY } })
  if (!row) {
    throw withStatusCode(
      deckId
        ? `EndingDeck ${deckId} does not exist.`
        : `No '${LIFE_DECK_KEY}' EndingDeck exists. Run the deck seed importer first.`,
      deckId ? 404 : 500,
    )
  }
  return hydrateDeck(row)
}

export async function loadDeckByKey(key: string): Promise<LoadedDeck> {
  const row = await prisma.endingDeck.findUnique({ where: { key } })
  if (!row) throw withStatusCode(`No ending deck named "${key}".`, 404)
  if (!row.isActive)
    throw withStatusCode(`The ${row.title} deck is retired.`, 409)
  return hydrateDeck(row)
}

export async function listDecks(userId: number) {
  const rows = await prisma.endingDeck.findMany({
    where: { isActive: true },
    orderBy: [{ ownerKind: 'asc' }, { title: 'asc' }],
    include: { _count: { select: { Endings: true } } },
  })

  return Promise.all(
    rows.map(async (row) => {
      const deck = hydrateDeck(row)
      return {
        key: deck.key,
        title: deck.title,
        description: deck.description,
        ownerKind: deck.ownerKind,
        facetId: row.facetId,
        scenarioId: row.scenarioId,
        // The axes themselves are the deck's secret -- a reader who can see
        // "trust" and "nerve" is playing a spreadsheet, not a story. Only the
        // count leaves the server.
        axisCount: deck.axes.length,
        endingCount: row._count.Endings,
        turnBudget: deck.turnBudget,
        turnBudgetByShape: deck.turnBudgetByShape,
        unlocked: await isDeckUnlocked(deck, userId),
      }
    }),
  )
}

/**
 * Narrator for a run: its Bot, else its Character, else the default narrator.
 *
 * Moved here from POST /api/davinci/runs/:id/narrate so both namespaces share
 * one lookup. It stays out of storybookNarration.ts so that module remains
 * free of ./prisma and importable by the DB-less contract suite.
 */
export async function loadRunNarrator(run: {
  botId: number | null
  characterId: number | null
}): Promise<StoryNarrator> {
  if (run.botId) {
    const bot = await prisma.bot.findUnique({
      where: { id: run.botId },
      select: {
        name: true,
        personality: true,
        narrativeVoice: true,
        prompt: true,
      },
    })
    if (bot) return bot
  }

  if (run.characterId) {
    const character = await prisma.character.findUnique({
      where: { id: run.characterId },
      select: {
        name: true,
        personality: true,
        quirks: true,
        presentation: true,
        backstory: true,
        drive: true,
      },
    })
    if (character) {
      return {
        name: character.name,
        personality: character.personality || character.quirks || null,
        narrativeVoice: character.presentation || null,
        prompt:
          [
            character.backstory ? `Backstory: ${character.backstory}` : '',
            character.drive ? `Drive: ${character.drive}` : '',
          ]
            .filter(Boolean)
            .join('\n') || null,
      }
    }
  }

  const fallback = await prisma.bot.findUnique({
    where: { id: DEFAULT_NARRATOR_BOT_ID },
    select: {
      name: true,
      personality: true,
      narrativeVoice: true,
      prompt: true,
    },
  })

  return (
    fallback || {
      name: 'the Narrator',
      personality: null,
      narrativeVoice: null,
      prompt: null,
    }
  )
}

function rewardToTreasure(reward: {
  slug: string | null
  name: string
  rewardType: string
  rarity: string
  effect: string | null
  flavorText: string | null
}): StoryTreasure | null {
  if (!reward.slug) return null
  return {
    slug: reward.slug,
    name: reward.name,
    rewardType: reward.rewardType,
    rarity: reward.rarity,
    effect: reward.effect,
    flavorText: reward.flavorText,
  }
}

/**
 * Turn the board the reader assembled into a run.
 *
 * Slugs in, ids out: the client names cards, the server resolves them and
 * checks the reader is allowed to use each one (assertAttachable, reused from
 * the life engine). The resolved board is snapshotted into LifeRun.bible so a
 * story in progress is reproducible -- editing a Character afterwards must not
 * rewrite a scene that already happened.
 */
export async function createStoryRun(userId: number, board: StoryBoardInput) {
  const shape = board.shape
  if (!SHAPE_BY_WIRE[shape]) {
    throw withStatusCode(`Unknown story shape "${shape}".`, 400)
  }

  const deck = board.deckKey
    ? await loadDeckByKey(board.deckKey)
    : await loadDeck(null)
  await assertDeckPlayable(deck, userId)

  const castSlugs = (board.castSlugs || []).filter(Boolean).slice(0, MAX_CAST)
  const facetSlugs = (board.facetSlugs || [])
    .filter(Boolean)
    .slice(0, MAX_FACETS)
  const rewardSlugs = (board.rewardSlugs || [])
    .filter(Boolean)
    .slice(0, MAX_TREASURES)

  const [cast, location, facets, scenario, boardRewards] = await Promise.all([
    castSlugs.length
      ? prisma.character.findMany({
          where: { slug: { in: castSlugs } },
          select: {
            id: true,
            slug: true,
            name: true,
            presentation: true,
            role: true,
            class: true,
            isPublic: true,
            userId: true,
            Rewards: {
              select: {
                slug: true,
                name: true,
                rewardType: true,
                rarity: true,
                effect: true,
                flavorText: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    board.locationSlug
      ? prisma.dream.findFirst({
          where: { slug: board.locationSlug },
          select: { id: true, title: true, description: true },
        })
      : Promise.resolve(null),
    facetSlugs.length
      ? prisma.facet.findMany({
          where: { slug: { in: facetSlugs } },
          select: { title: true, description: true },
        })
      : Promise.resolve([]),
    board.scenarioSlug
      ? prisma.scenario.findFirst({
          where: { slug: board.scenarioSlug },
          select: { id: true, title: true, description: true },
        })
      : Promise.resolve(null),
    rewardSlugs.length
      ? prisma.reward.findMany({
          where: { slug: { in: rewardSlugs }, isActive: true },
          select: {
            slug: true,
            name: true,
            rewardType: true,
            rarity: true,
            effect: true,
            flavorText: true,
          },
        })
      : Promise.resolve([]),
  ])

  // The first cast member is the protagonist -- the Hero slot on the board.
  const orderedCast = castSlugs
    .map((slug) => cast.find((member) => member.slug === slug))
    .filter((member): member is (typeof cast)[number] => Boolean(member))
  const protagonist = orderedCast[0] || null

  await Promise.all([
    assertAttachable('Character', protagonist?.id ?? null, userId),
    assertAttachable('Dream', location?.id ?? null, userId),
    assertAttachable('Bot', board.botId ?? null, userId),
  ])

  const narratorStyle =
    board.narratorStyle &&
    NARRATOR_STYLES.has(board.narratorStyle as StorybookNarratorStyle)
      ? (board.narratorStyle as StorybookNarratorStyle)
      : null

  const bible: StoryBible = {
    title:
      board.title?.trim() ||
      scenario?.title ||
      protagonist?.name ||
      'An untitled story',
    premise: board.spark?.trim() || null,
    cast: orderedCast.map((member) => ({
      name: member.name,
      role:
        (member.slug && board.castRoles?.[member.slug]) ||
        (member === protagonist ? 'protagonist' : null),
      description: member.presentation || member.role || member.class || null,
    })),
    location: location
      ? {
          title: location.title || 'A place',
          description: location.description,
        }
      : null,
    facets: facets.map((facet) => ({
      title: facet.title,
      description: facet.description,
    })),
    scenario: scenario
      ? {
          title: scenario.title || 'A thread',
          description: scenario.description,
        }
      : null,
    treasures: boardRewards
      .map(rewardToTreasure)
      .filter((treasure): treasure is StoryTreasure => Boolean(treasure)),
  }

  // The protagonist's own Skill/Item cards are in play from turn one -- that is
  // what makes the character sheet a move rather than a profile.
  const loadout: RunInventoryEntry[] = (protagonist?.Rewards || [])
    .map(rewardToTreasure)
    .filter((treasure): treasure is StoryTreasure => Boolean(treasure))
    .map((treasure) => ({ ...treasure, origin: 'loadout' as const }))
  const boardInventory: RunInventoryEntry[] = bible.treasures
    .filter((treasure) => !loadout.some((held) => held.slug === treasure.slug))
    .map((treasure) => ({ ...treasure, origin: 'board' as const }))
  const inventory = [...loadout, ...boardInventory]

  const turnBudget = deckTurnBudget(deck, shape)

  const run = await prisma.lifeRun.create({
    data: {
      userId,
      title: bible.title,
      seed: `run-${Date.now()}-${crypto.randomUUID()}`,
      status: 'ACTIVE',
      currentChapter: 1,
      shape: SHAPE_BY_WIRE[shape],
      deckId: deck.id,
      turnBudget,
      narratorStyle,
      premise: bible.premise,
      protagonistName: protagonist?.name ?? null,
      genre: bible.facets.map((facet) => facet.title).join(', ') || null,
      characterId: protagonist?.id ?? null,
      dreamId: location?.id ?? null,
      scenarioId: scenario?.id ?? null,
      botId: board.botId ?? null,
      bible: JSON.stringify(bible),
      inventory: JSON.stringify(inventory),
    },
  })

  // Narrate the opening scene now, so the reader lands on a story rather than
  // a button. A failure here does NOT discard the run: the row is already
  // theirs and the client re-narrates by submitting a null move.
  let pendingTurn: PendingTurn | null = null
  let narrationError: string | null = null
  try {
    pendingTurn = await narrateInto(run.id, {
      deck,
      shape,
      narratorStyle,
      narrator: await loadRunNarrator(run),
      seed: run.seed,
      turnIndex: 1,
      turnBudget,
      bible,
      inventory,
      statsSoFar: {},
      recentTurns: [],
      move: null,
    })
  } catch (error) {
    narrationError =
      error instanceof Error ? error.message : 'The opening scene slipped away.'
  }

  return { run, deck, bible, inventory, pendingTurn, narrationError }
}

interface NarrateArgs {
  deck: LoadedDeck
  shape: StorybookShape
  narratorStyle: StorybookNarratorStyle | null
  narrator: StoryNarrator
  seed: string
  turnIndex: number
  turnBudget: number
  bible: StoryBible
  inventory: RunInventoryEntry[]
  statsSoFar: Record<string, number>
  recentTurns: StorybookNarrationRequest['recentTurns']
  move: StorybookMove | null
  playedReward?: StoryTreasure | null
}

/**
 * Narration is injectable so utils/scripts/verifyStorybookPlayLoop.ts can play
 * a whole run against a stub. The play loop's rules are what that suite tests;
 * paying a model to restate them on every CI run would test the model instead.
 */
export type NarrateFn = (
  request: StorybookNarrationRequest,
) => Promise<StorybookNarrationResult>

let narrateImpl: NarrateFn = (request) => generateStorybookTurn(request)

export function setStorybookNarrator(impl: NarrateFn | null): void {
  narrateImpl = impl || ((request) => generateStorybookTurn(request))
}

function buildNarrationRequest(args: NarrateArgs): StorybookNarrationRequest {
  return {
    shape: args.shape,
    deck: toDeckDefinition(args.deck),
    narratorStyle: args.narratorStyle,
    narrator: args.narrator,
    seed: args.seed,
    turnIndex: args.turnIndex,
    turnBudget: args.turnBudget,
    isFinalTurn: args.turnIndex >= args.turnBudget,
    bible: args.bible,
    statsSoFar: args.statsSoFar,
    inventory: args.inventory.filter((entry) => !entry.consumedAtTurn),
    recentTurns: args.recentTurns.slice(-RECENT_TURN_WINDOW),
    move: args.move,
    playedReward: args.playedReward ?? null,
  }
}

async function narrateInto(
  runId: number,
  args: NarrateArgs,
): Promise<PendingTurn> {
  const result = await narrateImpl(buildNarrationRequest(args))
  const pending: PendingTurn = {
    turnIndex: args.turnIndex,
    narrativeText: result.narrativeText,
    choices: result.choices,
    artPrompt: result.artPrompt,
    endingHint: result.endingHint,
    narrator: args.narrator.name,
  }
  await prisma.lifeRun.update({
    where: { id: runId },
    data: { pendingTurn: JSON.stringify(pending) },
  })
  return pending
}

export async function getStoryRunForUser(lifeRunId: number, userId: number) {
  const run = await prisma.lifeRun.findUnique({
    where: { id: lifeRunId },
    include: {
      Deck: true,
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
  if (!run) throw withStatusCode(`Story run ${lifeRunId} does not exist.`, 404)
  if (run.userId !== userId) {
    throw withStatusCode(
      'This story run does not belong to the authenticated user.',
      403,
    )
  }
  return run
}

export async function listStoryRuns(
  userId: number,
  options: { status?: string | null; limit?: number } = {},
) {
  const status = options.status?.toUpperCase()
  const runs = await prisma.lifeRun.findMany({
    where: {
      userId,
      ...(status === 'ACTIVE' || status === 'COMPLETE' || status === 'ABANDONED'
        ? { status }
        : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: Math.min(Math.max(options.limit ?? 50, 1), 100),
    select: {
      id: true,
      title: true,
      shape: true,
      status: true,
      currentChapter: true,
      turnBudget: true,
      createdAt: true,
      updatedAt: true,
      Deck: { select: { key: true, title: true } },
      Ending: {
        select: {
          title: true,
          slug: true,
          victoryType: true,
          icon: true,
          heroImage: true,
        },
      },
    },
  })

  return runs.map((run) => ({
    ...run,
    shape: WIRE_BY_SHAPE[run.shape],
    turnIndex: run.currentChapter,
  }))
}

/**
 * What the client is allowed to see of a pending turn.
 *
 * A genre deck's axes are its secret, so the options go out without their
 * effects. The life shape keeps showing them: its ten dimensions have been on
 * screen as stat pills since davinci/t-014, and hiding them now would remove a
 * feature rather than protect one.
 */
export function publicPendingTurn(
  pending: PendingTurn | null,
  deck: LoadedDeck,
): PendingTurn | null {
  if (!pending) return null
  if (deck.ownerKind === 'LIFE') return pending
  return {
    ...pending,
    choices: pending.choices.map((choice) => ({
      id: choice.id,
      choiceText: choice.choiceText,
      effects: {},
    })),
  }
}

export function readPendingTurn(run: { pendingTurn: string | null }) {
  return parseJson<PendingTurn | null>(run.pendingTurn, null)
}

export function readInventory(run: { inventory: string | null }) {
  return parseJson<RunInventoryEntry[]>(run.inventory, [])
}

export function readBible(run: {
  bible: string | null
  title: string
  premise: string | null
}): StoryBible {
  return parseJson<StoryBible>(run.bible, {
    title: run.title,
    premise: run.premise,
    cast: [],
    location: null,
    facets: [],
    scenario: null,
    treasures: [],
  })
}

export interface SubmitTurnInput {
  turnIndex: number
  move: StorybookMove | null
}

/**
 * Record the reader's move and narrate the next scene, in one call.
 *
 * The life engine split these into POST .../narrate and POST .../choices,
 * which left the client posting the stat deltas it had been shown. Combining
 * them closes that hole and costs the reader one spinner instead of two:
 *
 *   - an OPTION move takes its effects from the stored pendingTurn, so the
 *     body only names an option id;
 *   - a CUSTOM or SHEET move is scored by the narrator and clamped here;
 *   - nothing is written unless narration succeeds, so a failed turn leaves
 *     the run exactly as it was and retrying is free;
 *   - a repeat submission of a turn already recorded returns the stored result
 *     instead of advancing twice.
 */
export async function submitStoryTurn(
  lifeRunId: number,
  userId: number,
  input: SubmitTurnInput,
) {
  const run = await getStoryRunForUser(lifeRunId, userId)
  if (run.status !== 'ACTIVE') {
    throw withStatusCode(
      `This story is ${run.status.toLowerCase()}; only an active story takes turns.`,
      409,
    )
  }

  const deck = await loadDeck(run.deckId)
  const shape = WIRE_BY_SHAPE[run.shape]
  const turnBudget = run.turnBudget ?? deckTurnBudget(deck, shape)
  const bible = readBible(run)
  let inventory = readInventory(run)
  const pending = readPendingTurn(run)

  if (!Number.isInteger(input.turnIndex) || input.turnIndex <= 0) {
    throw withStatusCode('turnIndex must be a positive integer.', 400)
  }

  // Idempotency: a client that retried after a dropped response gets the turn
  // it already played back, not a second one.
  if (input.turnIndex < run.currentChapter) {
    const existing = run.Choices.find(
      (choice) => choice.chapter === input.turnIndex,
    )
    if (existing) {
      return {
        run,
        deck,
        turn: existing,
        pendingTurn: publicPendingTurn(pending, deck),
        inventory,
        turnIndex: run.currentChapter,
        turnBudget,
        isFinalTurn: run.currentChapter >= turnBudget,
        readyToResolve: run.currentChapter > turnBudget,
        replayed: true,
      }
    }
  }
  if (input.turnIndex !== run.currentChapter) {
    throw withStatusCode(
      `This story is on turn ${run.currentChapter}, not ${input.turnIndex}.`,
      409,
    )
  }

  const narrator = await loadRunNarrator(run)
  const statsSoFar: Record<string, number> = {}
  for (const stat of run.Stats) statsSoFar[stat.key] = stat.value

  const recentTurns = run.Choices.slice(-RECENT_TURN_WINDOW).map((choice) => ({
    turnIndex: choice.chapter,
    narrativeText: choice.prompt,
    move: {
      source:
        (choice.source.toLowerCase() as StorybookMove['source']) || 'option',
      text: choice.choiceText,
    },
  }))

  // A null move re-narrates the current scene. Only legal when there isn't one
  // -- otherwise a reader could reroll a scene they dislike until it flatters
  // them, which is a different game.
  if (!input.move) {
    if (pending) {
      throw withStatusCode(
        'This turn already has a scene. Make a move to continue.',
        409,
      )
    }
    const regenerated = await narrateInto(run.id, {
      deck,
      shape,
      narratorStyle: run.narratorStyle as StorybookNarratorStyle | null,
      narrator,
      seed: run.seed,
      turnIndex: run.currentChapter,
      turnBudget,
      bible,
      inventory,
      statsSoFar,
      recentTurns,
      move: null,
    })
    return {
      run,
      deck,
      turn: null,
      pendingTurn: publicPendingTurn(regenerated, deck),
      inventory,
      turnIndex: run.currentChapter,
      turnBudget,
      isFinalTurn: run.currentChapter >= turnBudget,
      readyToResolve: false,
      replayed: false,
    }
  }

  if (!pending) {
    throw withStatusCode(
      'There is no scene to answer yet. Ask for this turn first.',
      409,
    )
  }

  const move = { ...input.move }
  let playedReward: StoryTreasure | null = null
  let optionEffects: Record<string, number> | null = null

  if (move.source === 'option') {
    const chosen = pending.choices.find((choice) => choice.id === move.optionId)
    if (!chosen) {
      throw withStatusCode(
        `"${move.optionId}" is not one of this scene's options.`,
        400,
      )
    }
    move.text = chosen.choiceText
    // FROM THE SERVER'S COPY, never the request body.
    optionEffects = chosen.effects
  } else if (move.source === 'custom') {
    const text = (move.text || '').trim()
    if (!text) throw withStatusCode('Write what you do first.', 400)
    if (text.length > MAX_CUSTOM_MOVE_CHARS) {
      throw withStatusCode(
        `Keep your move under ${MAX_CUSTOM_MOVE_CHARS} characters.`,
        400,
      )
    }
    move.text = text
  } else if (move.source === 'sheet') {
    playedReward = assertPlayableCard(inventory, move.rewardSlug, run.Choices)
    move.text = `Plays ${playedReward.name}${
      move.text?.trim() ? `: ${move.text.trim()}` : ''
    }`
  } else {
    throw withStatusCode(`Unknown move source "${move.source}".`, 400)
  }

  const isFinalTurn = run.currentChapter >= turnBudget
  const result = await narrateImpl(
    buildNarrationRequest({
      deck,
      shape,
      narratorStyle: run.narratorStyle as StorybookNarratorStyle | null,
      narrator,
      seed: run.seed,
      turnIndex: run.currentChapter,
      turnBudget,
      bible,
      inventory,
      statsSoFar,
      recentTurns,
      move,
      playedReward,
    }),
  )

  // Clamped HERE, at the write, not only inside the narration response path.
  // LifeStat accepts any key by design, and these effects can arrive from a
  // stored turn or an injected narrator as well as from a validated model
  // response -- so the deck's axis allowlist and the +-2 bound have to hold on
  // the way into the row. (This is what utils/scripts/verifyStorybookPlayLoop.ts
  // caught on its first real run: the stub narrator's +-9 proposal was written
  // through unclamped, because the only clamp was one layer up.)
  const effects = clampEffectsToDeck(
    optionEffects ?? result.moveEffects,
    toDeckDefinition(deck),
  )
  const nextTurnIndex = run.currentChapter + 1
  inventory = applyInventoryChange(inventory, {
    delta: result.stateDelta,
    bible,
    playedReward,
    turnIndex: run.currentChapter,
  })

  const nextPending: PendingTurn | null = isFinalTurn
    ? null
    : {
        turnIndex: nextTurnIndex,
        narrativeText: result.narrativeText,
        choices: result.choices,
        artPrompt: result.artPrompt,
        endingHint: result.endingHint,
        narrator: narrator.name,
      }

  // Resolved BEFORE the transaction and written on the create, not patched in
  // afterwards: a create-then-update left the row correct but returned a stale
  // object with rewardId still null, which is what the caller and the API
  // response actually read.
  const playedRewardId = playedReward
    ? ((
        await prisma.reward.findFirst({
          where: { slug: playedReward.slug },
          select: { id: true },
        })
      )?.id ?? null)
    : null

  const turn = await prisma.$transaction(async (tx) => {
    const created = await tx.lifeChoice.create({
      data: {
        lifeRunId: run.id,
        chapter: run.currentChapter,
        // The scene the reader was answering, not the one just written.
        prompt: pending.narrativeText,
        choiceText: move.text,
        resultText: result.narrativeText,
        source: MOVE_SOURCE_BY_WIRE[move.source],
        optionId: move.source === 'option' ? (move.optionId ?? null) : null,
        rewardId: playedRewardId,
        effects: JSON.stringify(effects),
        stateDelta: JSON.stringify(result.stateDelta),
        artPrompt: result.artPrompt,
      },
    })

    for (const [key, delta] of Object.entries(effects)) {
      if (!delta) continue
      await tx.lifeStat.upsert({
        where: { lifeRunId_key: { lifeRunId: run.id, key } },
        create: { lifeRunId: run.id, key, value: delta },
        update: { value: { increment: delta } },
      })
    }

    await tx.lifeRun.update({
      where: { id: run.id },
      data: {
        currentChapter: nextTurnIndex,
        inventory: JSON.stringify(inventory),
        pendingTurn: nextPending ? JSON.stringify(nextPending) : null,
      },
    })

    return created
  })

  return {
    run,
    deck,
    turn,
    pendingTurn: publicPendingTurn(nextPending, deck),
    inventory,
    turnIndex: nextTurnIndex,
    turnBudget,
    isFinalTurn: nextTurnIndex >= turnBudget,
    readyToResolve: isFinalTurn,
    replayed: false,
    // Only the life shape has ever shown its axis values to the reader.
    stats: deck.ownerKind === 'LIFE' ? statsSoFar : undefined,
    narratedWordBounds: PROSE_BOUNDS_BY_SHAPE[shape],
  }
}

/**
 * A card is playable when the run holds it, it has not been spent, and it was
 * not the previous turn's move.
 *
 * The consecutive-turn rule is what keeps a strong Skill from becoming the
 * whole game: a card should change a scene, not replace the choosing.
 */
export function assertPlayableCard(
  inventory: RunInventoryEntry[],
  rewardSlug: string | null | undefined,
  priorChoices: {
    chapter: number
    rewardId: number | null
    choiceText: string
  }[],
): StoryTreasure {
  const slug = rewardSlug?.trim()
  if (!slug) throw withStatusCode('Name the card you are playing.', 400)

  const entry = inventory.find((item) => item.slug === slug)
  if (!entry) {
    throw withStatusCode(
      "That card is not on this story's character sheet.",
      400,
    )
  }
  if (entry.consumedAtTurn) {
    throw withStatusCode(
      `${entry.name} was already spent on turn ${entry.consumedAtTurn}.`,
      409,
    )
  }

  const lastMove = priorChoices[priorChoices.length - 1]
  if (lastMove && lastMove.choiceText.startsWith(`Plays ${entry.name}`)) {
    throw withStatusCode(
      `${entry.name} was just played. Do something else this turn.`,
      409,
    )
  }

  return {
    slug: entry.slug,
    name: entry.name,
    rewardType: entry.rewardType,
    rarity: entry.rarity,
    effect: entry.effect,
    flavorText: entry.flavorText,
  }
}

/** An ITEM is spent when it is played; every other card type stays. */
export function isConsumable(rewardType: string): boolean {
  return rewardType.toUpperCase() === 'ITEM'
}

export function applyInventoryChange(
  inventory: RunInventoryEntry[],
  input: {
    delta: StorybookNarrationResult['stateDelta']
    bible: StoryBible
    playedReward: StoryTreasure | null
    turnIndex: number
  },
): RunInventoryEntry[] {
  const next = inventory.map((entry) => ({ ...entry }))

  const spend = (slug: string) => {
    const entry = next.find(
      (item) => item.slug === slug && !item.consumedAtTurn,
    )
    if (entry) entry.consumedAtTurn = input.turnIndex
  }

  for (const slug of input.delta.inventoryRemove) spend(slug)

  for (const slug of input.delta.inventoryAdd) {
    const held = next.find((item) => item.slug === slug && !item.consumedAtTurn)
    if (held) continue
    const treasure = input.bible.treasures.find((item) => item.slug === slug)
    if (!treasure) continue
    next.push({ ...treasure, origin: 'found' })
  }

  if (input.playedReward && isConsumable(input.playedReward.rewardType)) {
    spend(input.playedReward.slug)
  }

  return next
}
