// utils/scripts/verifyStorybookPlayLoop.ts
//
// Headless regression check for the deck-generic Storybook play loop
// (storybook/t-029, t-032, t-033). Plays a whole short story on a scratch
// three-axis deck, using all three ways a reader can move -- an offered
// option, a written action, and a card played from the character sheet --
// then resolves it into an ending and checks the collection credited it.
//
// The narrator is a STUB. What this suite tests is the loop's rules: whose
// numbers count, what a turn budget means, when a card is spent, and whether
// an ending is awarded once. Paying a model to restate those on every CI run
// would test the model instead, and would make the suite flaky for reasons
// that have nothing to do with the code under test.
//
// Point it at a scratch database -- it WRITES (a throwaway User, Reward,
// EndingDeck, LifeEnding, LifeRun and award rows) and cleans up everything it
// creates in a `finally` block.
//
// Usage:
//   npm run seed:storybook:playloop-verify
//
// Requires DATABASE_URL.

import 'dotenv/config'
import prisma from '../../server/utils/prisma'
import { resolveStoryRunEnding } from '../../server/utils/davinci'
import {
  serializeDeckAxes,
  type DeckAxis,
} from '../../server/utils/endingDeckMath'
import { readDeckCollection } from '../../server/utils/storybookCollection'
import {
  createStoryRun,
  loadDeckByKey,
  readInventory,
  setStorybookNarrator,
  submitStoryTurn,
} from '../../server/utils/storybookRuns'
import type { StorybookNarrationResult } from '../../server/utils/storybookNarration'
import { applyQuestProposal } from '../../server/utils/storybookQuest'

const TEST_USERNAME = 'storybook-playloop-verify'
const DECK_KEY = 'verify-mystery'
const ITEM_SLUG = 'verify-brass-key'
const SKILL_SLUG = 'verify-quick-tongue'
const TURN_BUDGET = 4
const QUEST_DECK_KEY = 'verify-taskmaster'
const QUEST_PROJECT_SLUG = 'verify-storybook-quest-project'
const QUEST_TODO_TITLE = 'Verify quest honeydo'

const AXES: DeckAxis[] = [
  {
    key: 'truth',
    label: 'Truth',
    description: 'How much of the case is solved.',
  },
  {
    key: 'trust',
    label: 'Trust',
    description: 'Whether allies are still allies.',
  },
  {
    key: 'nerve',
    label: 'Nerve',
    description: 'What holding steady has cost.',
  },
]

let failures = 0
function check(cond: unknown, label: string): void {
  if (cond) {
    console.log(`  ok: ${label}`)
  } else {
    failures += 1
    console.error(`  FAIL: ${label}`)
  }
}

async function rejects(
  label: string,
  run: () => Promise<unknown>,
  expectedStatus: number,
): Promise<void> {
  try {
    await run()
    failures += 1
    console.error(`  FAIL: ${label} — expected a rejection, got none`)
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    check(status === expectedStatus, `${label} (status ${status})`)
  }
}

const prose = Array.from({ length: 70 }, (_, index) => `word${index}`).join(' ')
const NON_NARRATOR_BOT_NAME = 'verify-storybook-not-a-narrator'

/** What the stub narrator was last asked for, so the loop can be inspected. */
let lastRequestSummary: {
  turnIndex: number
  isFinalTurn: boolean
  moveText: string | null
  moveSource: string | null
  playedReward: string | null
  inventorySlugs: string[]
  questObjective: string | null
  questCheckpointId: string | null
  questUnapplied: string[]
} | null = null

/**
 * When set, the stub narrator proposes this outcome for whatever checkpoint the
 * quest is currently presenting. Taskmaster mode only (storybook/t-045).
 */
let stubProposalOutcome: string | null = null

function stubNarration(): void {
  setStorybookNarrator(async (request) => {
    lastRequestSummary = {
      turnIndex: request.turnIndex,
      isFinalTurn: request.isFinalTurn,
      moveText: request.move?.text ?? null,
      moveSource: request.move?.source ?? null,
      playedReward: request.playedReward?.slug ?? null,
      inventorySlugs: request.inventory.map((item) => item.slug),
      questObjective: request.quest?.objective ?? null,
      questCheckpointId: request.quest?.checkpoint?.id ?? null,
      questUnapplied: request.quest?.unapplied ?? [],
    }
    const result: StorybookNarrationResult = {
      narrativeText: prose,
      // Deliberately large and out of range: the loop must clamp what it
      // stores, not trust what the narrator proposed.
      moveEffects: { truth: 9, nerve: -9 },
      choices: request.isFinalTurn
        ? []
        : [
            { id: 'a', choiceText: 'Open the ledger.', effects: { truth: 1 } },
            { id: 'b', choiceText: 'Ask her instead.', effects: { trust: 1 } },
          ],
      stateDelta: {
        consequences: ['The clerk saw you.'],
        relationshipShifts: [],
        inventoryAdd: [],
        inventoryRemove: [],
      },
      artPrompt: null,
      endingHint: null,
      proposal:
        stubProposalOutcome && request.quest?.checkpoint
          ? {
              checkpointId: request.quest.checkpoint.id,
              outcome: stubProposalOutcome as 'completed',
              note: 'Swept the workshop and put the tools back.',
            }
          : null,
    }
    return result
  })
}

async function seedFixtures(userId: number) {
  const deck = await prisma.endingDeck.upsert({
    where: { key: DECK_KEY },
    update: {
      axes: serializeDeckAxes(AXES),
      turnBudget: TURN_BUDGET,
      isActive: true,
    },
    create: {
      key: DECK_KEY,
      title: 'Verify Mystery',
      description: 'A scratch deck for the play-loop regression suite.',
      ownerKind: 'GENRE_FACET',
      axes: serializeDeckAxes(AXES),
      passValue: 1,
      turnBudget: TURN_BUDGET,
    },
  })

  // Eight endings, one per outcomeKey, each with the Achievement +
  // LifeAchievement pair the collection reads back.
  for (let index = 0; index < 8; index += 1) {
    const outcomeKey = index.toString(2).padStart(3, '0')
    const achievement = await prisma.achievement.upsert({
      where: { triggerCode: `verify-ending-${DECK_KEY}-${outcomeKey}` },
      update: {},
      create: {
        triggerCode: `verify-ending-${DECK_KEY}-${outcomeKey}`,
        label: `Verify ending ${outcomeKey}`,
        message: `You reached ending ${outcomeKey}.`,
        isActive: true,
        isRepeatable: false,
      },
    })
    const ending = await prisma.lifeEnding.upsert({
      where: {
        deckId_outcomeKey: { deckId: deck.id, outcomeKey },
      },
      update: { achievementId: achievement.id },
      create: {
        outcomeKey,
        deckId: deck.id,
        title: `Verify ending ${outcomeKey}`,
        slug: `verify-ending-${outcomeKey}`,
        summary: `The scratch ending for ${outcomeKey}.`,
        victoryType: 'MIXED',
        achievementId: achievement.id,
      },
    })
    const conditionKey = `ending:${DECK_KEY}:${outcomeKey}`
    const existing = await prisma.lifeAchievement.findFirst({
      where: { conditionKey },
      select: { id: true },
    })
    if (!existing) {
      await prisma.lifeAchievement.create({
        data: {
          title: `Verify ending ${outcomeKey}`,
          slug: `verify-la-${DECK_KEY}-${outcomeKey}`,
          achievementType: 'ENDING',
          conditionKey,
          endingId: ending.id,
          achievementId: achievement.id,
        },
      })
    }
  }

  const item = await prisma.reward.upsert({
    where: { slug: ITEM_SLUG },
    update: { isActive: true },
    create: {
      slug: ITEM_SLUG,
      name: 'Verify Brass Key',
      rewardType: 'ITEM',
      rarity: 'COMMON',
      effect: 'Opens one locked thing.',
      isActive: true,
      isPublic: true,
    },
  })
  const skill = await prisma.reward.upsert({
    where: { slug: SKILL_SLUG },
    update: { isActive: true },
    create: {
      slug: SKILL_SLUG,
      name: 'Verify Quick Tongue',
      rewardType: 'SKILL',
      rarity: 'RARE',
      effect: 'Talk past one closed door.',
      isActive: true,
      isPublic: true,
    },
  })

  const character = await prisma.character.upsert({
    where: { slug: 'verify-storybook-hero' },
    update: {},
    create: {
      slug: 'verify-storybook-hero',
      name: 'Verify Hero',
      userId,
      isPublic: true,
      Rewards: { connect: [{ id: item.id }, { id: skill.id }] },
    },
  })

  return { deck, character }
}

/**
 * A project with one open HONEYDO on it, and a taskmaster deck to resolve into.
 *
 * The project is a Kind Robots Project row carrying a conductorSlug, which is
 * how dealQuestCheckpoints finds it -- the same join the Projects page uses.
 */
async function seedQuestFixtures(userId: number) {
  const deck = await prisma.endingDeck.upsert({
    where: { key: QUEST_DECK_KEY },
    update: {
      axes: serializeDeckAxes(AXES),
      ownerKind: 'TASKMASTER',
      minTurnsBeforeResolve: 1,
      isActive: true,
    },
    create: {
      key: QUEST_DECK_KEY,
      title: 'Verify Taskmaster',
      description: 'A scratch quest deck for the play-loop regression suite.',
      ownerKind: 'TASKMASTER',
      axes: serializeDeckAxes(AXES),
      passValue: 1,
      turnBudget: 4,
      minTurnsBeforeResolve: 1,
    },
  })

  const existingProject = await prisma.project.findFirst({
    where: { conductorSlug: QUEST_PROJECT_SLUG },
    select: { id: true },
  })
  const project =
    existingProject ??
    (await prisma.project.create({
      data: {
        title: 'Verify Quest Project',
        conductorSlug: QUEST_PROJECT_SLUG,
        userId,
      },
      select: { id: true },
    }))

  const existingTodo = await prisma.todo.findFirst({
    where: { title: QUEST_TODO_TITLE },
    select: { id: true },
  })
  if (existingTodo) {
    await prisma.todo.delete({ where: { id: existingTodo.id } })
  }
  const todo = await prisma.todo.create({
    data: {
      title: QUEST_TODO_TITLE,
      category: 'HONEYDO',
      status: 'OPEN',
      userId,
      projectId: project.id,
    },
    select: { id: true },
  })

  return { deck, project, todo }
}

async function main() {
  const user = await prisma.user.upsert({
    where: { username: TEST_USERNAME },
    create: { username: TEST_USERNAME },
    update: {},
  })

  stubNarration()

  try {
    const { deck } = await seedFixtures(user.id)

    console.log('1. open a story from a board')
    const created = await createStoryRun(user.id, {
      mode: 'episodic',
      deckKey: DECK_KEY,
      title: 'Play loop verify story',
      spark: 'A letter arrives from a star that should not exist.',
      narratorStyle: 'mysterious',
      castSlugs: ['verify-storybook-hero'],
      rewardSlugs: [],
    })
    check(created.run.status === 'ACTIVE', 'run starts ACTIVE')
    check(created.run.deckId === deck.id, 'run is bound to its deck')
    check(
      created.run.turnBudget === TURN_BUDGET,
      `run takes the deck's turn budget (${created.run.turnBudget})`,
    )
    check(
      Boolean(created.pendingTurn),
      'the opening scene is narrated on creation',
    )
    check(
      created.inventory.some((entry) => entry.slug === ITEM_SLUG) &&
        created.inventory.some((entry) => entry.slug === SKILL_SLUG),
      "the protagonist's own cards are on the sheet from turn one",
    )
    check(
      created.pendingTurn?.choices.every(
        (choice) => Object.keys(choice.effects).length > 0,
      ) === true,
      'the stored pending turn keeps the option effects server-side',
    )

    const runId = created.run.id

    console.log('2. a chosen option scores from the SERVER copy')
    const turnOne = await submitStoryTurn(runId, user.id, {
      turnIndex: 1,
      move: { source: 'option', text: 'ignored', optionId: 'a' },
    })
    check(
      turnOne.turn?.choiceText === 'Open the ledger.',
      'the move text comes from the offered option, not the request body',
    )
    const turnOneEffects = JSON.parse(turnOne.turn?.effects || '{}')
    check(
      turnOneEffects.truth === 1 && turnOneEffects.nerve === undefined,
      `an option applies its own stored effects (${turnOne.turn?.effects})`,
    )
    check(turnOne.turnIndex === 2, 'the story advances one turn')
    check(
      turnOne.pendingTurn?.choices.every(
        (choice) => Object.keys(choice.effects).length === 0,
      ) === true,
      "a genre deck's axis deltas never reach the client",
    )

    await rejects(
      'an option id that was not offered is refused',
      () =>
        submitStoryTurn(runId, user.id, {
          turnIndex: 2,
          move: { source: 'option', text: '', optionId: 'z' },
        }),
      400,
    )
    await rejects(
      'a turn out of order is refused',
      () =>
        submitStoryTurn(runId, user.id, {
          turnIndex: 4,
          move: { source: 'option', text: '', optionId: 'a' },
        }),
      409,
    )

    console.log('3. a written move is scored by the narrator and clamped')
    const turnTwo = await submitStoryTurn(runId, user.id, {
      turnIndex: 2,
      move: { source: 'custom', text: 'Read the letter aloud.' },
    })
    const turnTwoEffects = JSON.parse(turnTwo.turn?.effects || '{}')
    check(
      turnTwoEffects.truth === 2 && turnTwoEffects.nerve === -2,
      `the narrator's +-9 proposal is clamped to +-2 (${turnTwo.turn?.effects})`,
    )
    check(
      turnTwo.turn?.source === 'CUSTOM',
      'the move is recorded as a written one',
    )

    console.log('4. a card played from the sheet is a move')
    const turnThree = await submitStoryTurn(runId, user.id, {
      turnIndex: 3,
      move: {
        source: 'sheet',
        text: 'I want the door open.',
        rewardSlug: ITEM_SLUG,
      },
    })
    check(
      turnThree.turn?.source === 'SHEET',
      'the move is recorded as a character-sheet play',
    )
    check(
      turnThree.turn?.rewardId !== null,
      'the played Reward is recorded on the turn',
    )
    check(
      lastRequestSummary?.playedReward === ITEM_SLUG,
      'the narrator is told which card was played',
    )
    check(
      turnThree.inventory.find((entry) => entry.slug === ITEM_SLUG)
        ?.consumedAtTurn === 3,
      'an ITEM is spent when it is played',
    )
    check(
      !turnThree.inventory.find((entry) => entry.slug === SKILL_SLUG)
        ?.consumedAtTurn,
      'a SKILL stays on the sheet',
    )
    await rejects(
      'a spent card cannot be played again',
      () =>
        submitStoryTurn(runId, user.id, {
          turnIndex: 4,
          move: { source: 'sheet', text: '', rewardSlug: ITEM_SLUG },
        }),
      409,
    )
    await rejects(
      'a card the sheet never held cannot be played',
      () =>
        submitStoryTurn(runId, user.id, {
          turnIndex: 4,
          move: { source: 'sheet', text: '', rewardSlug: 'no-such-card' },
        }),
      400,
    )

    console.log('5. the last turn closes the scene instead of branching')
    check(
      lastRequestSummary?.isFinalTurn === false,
      'turn 3 was not the final turn',
    )
    const turnFour = await submitStoryTurn(runId, user.id, {
      turnIndex: 4,
      move: { source: 'custom', text: 'Walk into the observatory.' },
    })
    check(
      lastRequestSummary?.isFinalTurn === true,
      'the narrator is told the last turn is the last',
    )
    check(
      turnFour.pendingTurn === null,
      'no further scene is offered after the budget is spent',
    )
    check(turnFour.readyToResolve, 'the story is ready to resolve')
    await rejects(
      'a turn past the budget is refused',
      () =>
        submitStoryTurn(runId, user.id, {
          turnIndex: 5,
          move: { source: 'custom', text: 'One more.' },
        }),
      409,
    )

    console.log(
      '5b. a concurrent duplicate turn submission does not double-write state (storybook/t-056)',
    )
    const raceRun = await createStoryRun(user.id, {
      mode: 'episodic',
      deckKey: DECK_KEY,
      title: 'Concurrency race verify story',
      spark: 'Two messengers arrive with the same news.',
      narratorStyle: 'mysterious',
      castSlugs: ['verify-storybook-hero'],
      rewardSlugs: [],
    })
    const raceRunId = raceRun.run.id
    const [raceA, raceB] = await Promise.allSettled([
      submitStoryTurn(raceRunId, user.id, {
        turnIndex: 1,
        move: { source: 'custom', text: 'Read the first messenger.' },
      }),
      submitStoryTurn(raceRunId, user.id, {
        turnIndex: 1,
        move: { source: 'custom', text: 'Read the second messenger.' },
      }),
    ])
    check(
      raceA.status === 'fulfilled' && raceB.status === 'fulfilled',
      'both concurrent requests for the same turn resolve rather than one throwing',
    )
    const raceChoices = await prisma.lifeChoice.findMany({
      where: { lifeRunId: raceRunId, chapter: 1 },
    })
    check(
      raceChoices.length === 1,
      `only one LifeChoice row survives the race (${raceChoices.length})`,
    )
    const raceStat = await prisma.lifeStat.findUnique({
      where: { lifeRunId_key: { lifeRunId: raceRunId, key: 'truth' } },
    })
    check(
      raceStat?.value === 2,
      `the stat increment lands once, not twice (truth=${raceStat?.value})`,
    )
    const raceRunRow = await prisma.lifeRun.findUnique({
      where: { id: raceRunId },
      select: { currentChapter: true },
    })
    check(
      raceRunRow?.currentChapter === 2,
      `the run advances exactly one turn despite two concurrent submits (${raceRunRow?.currentChapter})`,
    )
    if (raceA.status === 'fulfilled' && raceB.status === 'fulfilled') {
      check(
        raceA.value.turn?.id === raceB.value.turn?.id,
        'both callers are told about the same committed turn',
      )
    }

    console.log("6. resolve into one of the deck's endings")
    const resolved = await resolveStoryRunEnding(runId, user.id, user.username)
    check(
      resolved.outcomeKey.length === AXES.length,
      `the outcome key has one bit per axis (${resolved.outcomeKey})`,
    )
    check(
      resolved.ending.slug.startsWith('verify-ending-'),
      `the ending comes from this deck (${resolved.ending.slug})`,
    )
    check(resolved.achievementAwarded, 'the first resolve credits the ending')
    const reResolved = await resolveStoryRunEnding(
      runId,
      user.id,
      user.username,
    )
    check(
      reResolved.ending.id === resolved.ending.id &&
        reResolved.achievementAwarded === false,
      're-resolving credits nothing twice',
    )

    console.log('7. the ending lands in the collection')
    const loadedDeck = await loadDeckByKey(DECK_KEY)
    const collection = await readDeckCollection(loadedDeck, user.id)
    check(
      collection.total === 8,
      `the deck holds 8 endings (${collection.total})`,
    )
    check(collection.found === 1, `one ending is found (${collection.found})`)
    const found = collection.endings.find((ending) => ending.unlocked)
    check(Boolean(found?.title), 'a found ending shows its title')
    const unfound = collection.endings.find((ending) => !ending.unlocked)
    check(
      unfound !== undefined && unfound.title === undefined,
      'an unfound ending is a silhouette, not a spoiler',
    )

    console.log('8. a legacy life run still resolves')
    // deckId NULL is what every run created before decks existed looks like.
    const legacy = await prisma.lifeRun.create({
      data: {
        userId: user.id,
        title: 'Legacy life run',
        seed: 'legacy-verify',
        status: 'ACTIVE',
        currentChapter: 1,
      },
    })
    const legacyRun = await prisma.lifeRun.findUnique({
      where: { id: legacy.id },
      select: { deckId: true, shape: true, turnBudget: true },
    })
    check(legacyRun?.deckId === null, 'a legacy run has no deck')
    check(
      legacyRun?.shape === 'STRUCTURED',
      "a run created without a mode defaults to structured, the life shape's meaning",
    )
    check(
      legacyRun?.turnBudget === null,
      'a legacy run has no turn budget, so no server-side turn gate',
    )

    console.log('9. the mode taxonomy, the length dial, and endless play')
    // storybook/t-039: a client that has not reloaded since the rename still
    // opens a story rather than getting a 400 on the one action that hurts most.
    const legacyWire = await createStoryRun(user.id, {
      shape: 'short-story',
      deckKey: DECK_KEY,
      title: 'Legacy wire name',
      castSlugs: ['verify-storybook-hero'],
    })
    check(
      legacyWire.mode === 'open-ended',
      'a pre-mode wire name still opens a story, as its mode',
    )
    await rejects(
      'an unknown mode is refused',
      () =>
        createStoryRun(user.id, {
          mode: 'freeform',
          deckKey: DECK_KEY,
          castSlugs: ['verify-storybook-hero'],
        }),
      400,
    )

    // storybook/t-041: length is a setting the reader turns, not a mode.
    const dialled = await createStoryRun(user.id, {
      mode: 'episodic',
      deckKey: DECK_KEY,
      turnBudget: 6,
      title: 'Dialled to six',
      castSlugs: ['verify-storybook-hero'],
    })
    check(
      dialled.run.turnBudget === 6,
      `the length dial overrides the deck's budget (${dialled.run.turnBudget})`,
    )
    await rejects(
      'a budget below the floor is refused',
      () =>
        createStoryRun(user.id, {
          mode: 'episodic',
          deckKey: DECK_KEY,
          turnBudget: 1,
          castSlugs: ['verify-storybook-hero'],
        }),
      400,
    )
    await rejects(
      'only an open-ended story may run without a budget',
      () =>
        createStoryRun(user.id, {
          mode: 'episodic',
          deckKey: DECK_KEY,
          turnBudget: null,
          castSlugs: ['verify-storybook-hero'],
        }),
      400,
    )

    // storybook/t-040: no budget, no final turn, and the reader ends it.
    const endless = await createStoryRun(user.id, {
      mode: 'open-ended',
      deckKey: DECK_KEY,
      turnBudget: null,
      title: 'Endless',
      castSlugs: ['verify-storybook-hero'],
    })
    check(
      endless.run.turnBudget === null,
      'an open-ended story may open with no budget at all',
    )
    const endlessId = endless.run.id
    let endlessTurn = null as Awaited<ReturnType<typeof submitStoryTurn>> | null
    for (let index = 1; index <= TURN_BUDGET + 2; index += 1) {
      endlessTurn = await submitStoryTurn(endlessId, user.id, {
        turnIndex: index,
        move: { source: 'custom', text: `Keep going, turn ${index}.` },
      })
      check(
        lastRequestSummary?.isFinalTurn === false,
        `turn ${index} is never announced as the last one`,
      )
    }
    check(
      endlessTurn?.pendingTurn !== null,
      'an endless story always has a next scene waiting',
    )
    check(
      endlessTurn?.isFinalTurn === false &&
        endlessTurn?.readyToResolve === true,
      'past the floor it is resolvable on demand, without ever being final',
    )
    const endlessEnding = await resolveStoryRunEnding(
      endlessId,
      user.id,
      user.username,
    )
    check(
      endlessEnding.ending.slug.startsWith('verify-ending-'),
      'an endless story the reader ends is collectible like any other',
    )

    console.log('10. the Narrator slot holds a real narrator Bot')
    // storybook/t-042: the slot is a Bot card, so a Bot that was never written
    // to narrate is refused rather than quietly given the voice.
    // Bot.name is not unique, so this is find-then-create rather than upsert.
    const notANarrator =
      (await prisma.bot.findFirst({
        where: { name: NON_NARRATOR_BOT_NAME },
        select: { id: true },
      })) ??
      (await prisma.bot.create({
        data: {
          name: NON_NARRATOR_BOT_NAME,
          subtitle: 'Not a narrator',
          description: 'A scratch bot for the play-loop regression suite.',
          BotType: 'ASSISTANT',
          botIntro: 'A scratch bot for the play-loop regression suite.',
          userIntro: 'Not for narrating.',
          prompt: 'You are a scratch fixture.',
          userId: user.id,
          isPublic: true,
        },
        select: { id: true },
      }))
    await rejects(
      'a Bot that is not a narrator cannot take the Narrator slot',
      () =>
        createStoryRun(user.id, {
          mode: 'episodic',
          deckKey: DECK_KEY,
          botId: notANarrator.id,
          castSlugs: ['verify-storybook-hero'],
        }),
      400,
    )

    console.log('11. taskmaster mode: real work, proposals, and one apply')
    const questFixtures = await seedQuestFixtures(user.id)

    await rejects(
      'a quest without an objective is refused',
      () =>
        createStoryRun(user.id, {
          mode: 'taskmaster',
          deckKey: QUEST_DECK_KEY,
          projectSlug: QUEST_PROJECT_SLUG,
          castSlugs: ['verify-storybook-hero'],
        }),
      400,
    )
    await rejects(
      'a quest without a project is refused',
      () =>
        createStoryRun(user.id, {
          mode: 'taskmaster',
          deckKey: QUEST_DECK_KEY,
          spark: 'Clear the workshop bench.',
          castSlugs: ['verify-storybook-hero'],
        }),
      400,
    )

    stubProposalOutcome = 'completed'
    const quest = await createStoryRun(user.id, {
      mode: 'taskmaster',
      deckKey: QUEST_DECK_KEY,
      spark: 'Clear the workshop bench.',
      projectSlug: QUEST_PROJECT_SLUG,
      castSlugs: ['verify-storybook-hero'],
    })
    const questRunId = quest.run.id
    check(
      quest.quest?.objective === 'Clear the workshop bench.',
      'the objective is stored on the run, not folded into the prose',
    )
    check(
      (quest.quest?.checkpoints.length ?? 0) >= 2,
      `the quest deals real checkpoints (${quest.quest?.checkpoints.length})`,
    )
    check(
      quest.quest?.checkpoints.some(
        (checkpoint) => checkpoint.todoId === questFixtures.todo.id,
      ) === true,
      "the reader's own open HONEYDO is one of them",
    )
    check(
      lastRequestSummary?.questObjective === 'Clear the workshop bench.',
      'the narrator is told the real objective',
    )

    // THE RULE (storybook/t-045): a turn proposes, and nothing real moves.
    const questTurn = await submitStoryTurn(questRunId, user.id, {
      turnIndex: 1,
      move: { source: 'custom', text: 'Start with the bench.' },
    })
    const proposals = questTurn.quest?.proposals ?? []
    check(
      proposals.length === 1,
      `the turn recorded one proposal (${proposals.length})`,
    )
    check(
      proposals[0]?.applied === false && proposals[0]?.appliedAt === null,
      'the proposal is recorded as NOT applied',
    )

    const untouched = await prisma.todo.findUnique({
      where: { id: questFixtures.todo.id },
      select: { status: true, description: true },
    })
    check(
      untouched?.status === 'OPEN' && untouched.description === null,
      'playing the turn changed nothing on the real to-do',
    )
    check(
      (lastRequestSummary?.questUnapplied.length ?? 0) === 0,
      'the first turn had no unapplied proposals to warn about yet',
    )

    // Only the explicit apply writes.
    const firstProposal = proposals.find(
      (proposal) =>
        quest.quest?.checkpoints.find(
          (checkpoint) => checkpoint.id === proposal.checkpointId,
        )?.todoId === questFixtures.todo.id,
    )
    const targetProposal = firstProposal ?? proposals[0]!
    const applied = await applyQuestProposal(
      questRunId,
      user.id,
      targetProposal.id,
    )
    check(applied.alreadyApplied === false, 'the first apply lands')
    const again = await applyQuestProposal(
      questRunId,
      user.id,
      targetProposal.id,
    )
    check(again.alreadyApplied === true, 'applying twice writes nothing twice')

    await rejects(
      "another reader cannot apply this quest's proposals",
      () => applyQuestProposal(questRunId, user.id + 99_999, targetProposal.id),
      403,
    )

    console.log('12. inventory reads back off the run row')
    const stored = await prisma.lifeRun.findUnique({
      where: { id: runId },
      select: { inventory: true },
    })
    check(
      readInventory(stored || { inventory: null }).some(
        (entry) => entry.slug === ITEM_SLUG && entry.consumedAtTurn === 3,
      ),
      'the spent card is persisted, not just returned',
    )

    if (failures > 0) {
      console.error(`\n${failures} check(s) FAILED`)
      process.exitCode = 1
    } else {
      console.log('\nALL STORYBOOK PLAY LOOP CHECKS PASSED')
    }
  } finally {
    setStorybookNarrator(null)
    await prisma.lifeRun.deleteMany({ where: { userId: user.id } })
    await prisma.lifeAchievementUnlock.deleteMany({
      where: { userId: user.id },
    })
    await prisma.achievementRecord.deleteMany({ where: { userId: user.id } })
    await prisma.lifeAchievement.deleteMany({
      where: { conditionKey: { startsWith: `ending:${DECK_KEY}:` } },
    })
    await prisma.lifeEnding.deleteMany({
      where: { slug: { startsWith: 'verify-ending-' } },
    })
    await prisma.achievement.deleteMany({
      where: { triggerCode: { startsWith: `verify-ending-${DECK_KEY}-` } },
    })
    await prisma.endingDeck.deleteMany({
      where: { key: { in: [DECK_KEY, QUEST_DECK_KEY] } },
    })
    await prisma.bot.deleteMany({ where: { name: NON_NARRATOR_BOT_NAME } })
    await prisma.todo.deleteMany({
      where: {
        OR: [
          { title: QUEST_TODO_TITLE },
          { title: { startsWith: 'Taskmaster decision on' } },
        ],
      },
    })
    await prisma.project.deleteMany({
      where: { conductorSlug: QUEST_PROJECT_SLUG },
    })
    await prisma.character.deleteMany({
      where: { slug: 'verify-storybook-hero' },
    })
    await prisma.reward.deleteMany({
      where: { slug: { in: [ITEM_SLUG, SKILL_SLUG] } },
    })
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
