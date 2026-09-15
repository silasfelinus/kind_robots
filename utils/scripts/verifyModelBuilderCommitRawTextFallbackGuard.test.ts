// /utils/scripts/verifyModelBuilderCommitRawTextFallbackGuard.test.ts
//
// Regression test for findRawTextFallbackProblems() in
// verifyModelBuilderCommitRawTextFallbackGuard.ts (model-builder/t-029,
// cycle 103). Exercises the real check against synthetic
// commit.post.ts-shaped fixtures covering: the pre-fix shape (raw `text`
// assigned uncapped to Bot.description/botIntro/prompt), the fixed shape
// (every one wrapped in capToBotWidth), a partial fixture (description
// fixed, botIntro/prompt still raw), and a missing-anchor fixture.
import assert from 'node:assert/strict'

import { findRawTextFallbackProblems } from './verifyModelBuilderCommitRawTextFallbackGuard.js'

const BUGGY_FIXTURE = `
    case 'Bot': {
      const bot = await tx.bot.update({
        where: { id },
        data: { description: text, ...botFields(fields) },
      })
      await syncBotFacetsInTransaction(tx, bot, syncOptions)
      return
    }
`

const BUGGY_CREATE_FIXTURE = `
    case 'Bot': {
      const extra = botFields(fields)
      const bot = await tx.bot.create({
        data: {
          name,
          description: text,
          BotType: extra.BotType ?? 'CHATBOT',
          botIntro: extra.botIntro ?? (text || name),
          userIntro: extra.userIntro ?? 'Hello!',
          prompt: extra.prompt ?? (text || name),
          ...priv,
          ...extra,
        },
      })
      await syncBotFacetsInTransaction(tx, bot, syncOptions)
      return bot.id
    }
`

const FIXED_FIXTURE = `
    case 'Bot': {
      const bot = await tx.bot.update({
        where: { id },
        data: {
          description: capToBotWidth(text, 'description'),
          ...botFields(fields),
        },
      })
      await syncBotFacetsInTransaction(tx, bot, syncOptions)
      return
    }

    case 'Bot': {
      const extra = botFields(fields)
      const bot = await tx.bot.create({
        data: {
          name,
          description: capToBotWidth(text, 'description'),
          BotType: extra.BotType ?? 'CHATBOT',
          botIntro: extra.botIntro ?? capToBotWidth(text || name, 'botIntro'),
          userIntro: extra.userIntro ?? 'Hello!',
          prompt: extra.prompt ?? capToBotWidth(text || name, 'prompt'),
          ...priv,
          ...extra,
        },
      })
      await syncBotFacetsInTransaction(tx, bot, syncOptions)
      return bot.id
    }
`

const PARTIAL_FIXTURE = `
    case 'Bot': {
      const extra = botFields(fields)
      const bot = await tx.bot.create({
        data: {
          name,
          description: capToBotWidth(text, 'description'),
          BotType: extra.BotType ?? 'CHATBOT',
          botIntro: extra.botIntro ?? (text || name),
          userIntro: extra.userIntro ?? 'Hello!',
          prompt: extra.prompt ?? capToBotWidth(text || name, 'prompt'),
          ...priv,
          ...extra,
        },
      })
      await syncBotFacetsInTransaction(tx, bot, syncOptions)
      return bot.id
    }
`

function run(): void {
  const buggyUpdate = findRawTextFallbackProblems(BUGGY_FIXTURE)
  assert.equal(
    buggyUpdate.errors.length,
    2,
    'expected the buggy update-only fixture to fail with one description ' +
      `error plus one missing-createRecord-anchor error, got: ${JSON.stringify(buggyUpdate.errors)}`,
  )

  const buggyBoth = findRawTextFallbackProblems(
    BUGGY_FIXTURE + BUGGY_CREATE_FIXTURE,
  )
  assert.equal(
    buggyBoth.problems.length,
    4,
    'expected the fully-buggy fixture (updateText description + ' +
      'createRecord description/botIntro/prompt all raw) to flag all 4, ' +
      `got: ${JSON.stringify(buggyBoth.problems)}`,
  )

  const fixed = findRawTextFallbackProblems(FIXED_FIXTURE)
  assert.deepEqual(
    fixed.errors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixed.errors)}`,
  )

  const partial = findRawTextFallbackProblems(PARTIAL_FIXTURE)
  assert.equal(
    partial.problems.length,
    1,
    'expected the partial fixture (botIntro still raw) to flag exactly ' +
      `one problem, got: ${JSON.stringify(partial.problems)}`,
  )
  assert.equal(partial.problems[0]!.field, 'botIntro')

  const missingAnchor = findRawTextFallbackProblems('const somethingElse = 1')
  assert.equal(
    missingAnchor.errors.length,
    2,
    'expected a fixture with neither Bot case present to fail with two ' +
      '"could not find" errors',
  )
  assert.match(missingAnchor.errors[0]!, /Could not find/)
  assert.match(missingAnchor.errors[1]!, /Could not find/)

  console.log(
    'Model Builder commit raw-text fallback guard self-test passed: buggy ' +
      'fixtures fail on the right fields, fixed fixture passes, partial ' +
      'fixture fails once, missing-anchor fixture fails clearly.',
  )
}

run()
