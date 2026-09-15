// /utils/scripts/verifyModelBuilderCommitRawTextFallbackGuard.ts
//
// Regression guard (model-builder/t-029, cycle 103). commit.post.ts's
// pickText() (guarded separately by
// verifyModelBuilderCommitTextTruncationGuard.ts) caps every field pulled
// from the FIELDS_AND_PROMPTS blob to its real schema column width before
// writing it. That guard only covers values that go *through* pickText --
// it says nothing about `text`, the raw `(item.pitch || item.fieldsDraft ||
// '').trim()` blob computed once per commit and used directly as a
// fallback when the FIELDS stage's own description/botIntro/prompt lines
// are blank (an entirely normal state; nothing requires filling those in
// before COMMIT). ModelBuildItem.pitch and .fieldsDraft are both
// `@db.Text` columns (prisma/model-builder.prisma) with no
// application-level length cap of their own, so `text` can be arbitrarily
// long.
//
// For every other CREATE/UPDATE target this is harmless -- Character.
// backstory, Reward.description, Dream.pitch, Project.pitch, Scenario.
// description, and Facet.description are all unbounded `@db.Text` columns
// that comfortably hold it. Bot is the one live exception:
// Bot.description/botIntro/prompt are bounded VarChar(764/3000/764)
// columns (see SHORT_TEXT_MAX.Bot). Before this fix, updateText's Bot case
// wrote `description: text` unconditionally, and createRecord's Bot case
// (a real CREATE target via the expand-manager-bot/expand-narrator-bot
// outputs) wrote `description: text` unconditionally plus `botIntro:
// extra.botIntro ?? (text || name)` / `prompt: extra.prompt ?? (text ||
// name)` -- so any Bot UPDATE, or any Bot CREATE whose FIELDS stage left
// those three blank, wrote the full uncapped pitch straight into a bounded
// column, risking a "Data too long for column" write failure (or a silent
// truncation outside strict mode) -- the exact class SHORT_TEXT_MAX exists
// to prevent elsewhere, just reached through this fallback instead of
// pickText.
//
// Fixed by capToBotWidth(), which applies the same slice-to-cap behavior
// pickText already gives FIELDS-derived values to this one raw-text
// fallback path. This asserts the textual shape of that fix stays in
// place: updateText's and createRecord's Bot cases wrap every use of the
// raw `text` (or `text || name`) fallback for description/botIntro/prompt
// in capToBotWidth(...) rather than assigning it bare.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ROUTE_PATH = join(
  repositoryRoot,
  'server/api/model-builder/items/[id]/commit.post.ts',
)

const UPDATE_TEXT_BOT_ANCHOR =
  "case 'Bot': {\n      const bot = await tx.bot.update("
const CREATE_RECORD_BOT_ANCHOR =
  "case 'Bot': {\n      const extra = botFields(fields)\n      const bot = await tx.bot.create("
const SYNC_END_ANCHOR = 'await syncBotFacetsInTransaction(tx, bot, syncOptions)'

// Extracts the text between an anchor and the following
// syncBotFacetsInTransaction call, so each check is robust to reformatting
// inside the case block without having to balance braces.
function extractBotCase(content: string, anchor: string): string | null {
  const start = content.indexOf(anchor)
  if (start === -1) return null
  const end = content.indexOf(SYNC_END_ANCHOR, start)
  if (end === -1) return null
  return content.slice(start, end)
}

export interface RawTextFallbackProblem {
  location: 'updateText' | 'createRecord'
  field: 'description' | 'botIntro' | 'prompt'
}

// Checks the fix's exact shape against the full source text of a file
// containing commit.post.ts's updateText/createRecord Bot cases. Exported
// (rather than only exercised via main()) so the self-test below can run
// it against synthetic buggy/fixed fixtures without touching the real
// route file.
export function findRawTextFallbackProblems(content: string): {
  errors: string[]
  problems: RawTextFallbackProblem[]
} {
  const errors: string[] = []
  const problems: RawTextFallbackProblem[] = []

  const updateCase = extractBotCase(content, UPDATE_TEXT_BOT_ANCHOR)
  if (updateCase === null) {
    errors.push(
      "Could not find updateText's Bot case in commit.post.ts -- has it " +
        'been renamed, removed, or restructured? If so, this guard (and ' +
        'the bug it protects against) needs to move with it.',
    )
  } else if (
    !/description:\s*capToBotWidth\(\s*text\s*,\s*'description'\s*\)/.test(
      updateCase,
    )
  ) {
    errors.push(
      "updateText's Bot case no longer wraps its `description` write in " +
        "capToBotWidth(text, 'description'). Bot.description is a bounded " +
        'VarChar(764) column; the raw pitch/fieldsDraft `text` fallback ' +
        'has no length cap of its own (ModelBuildItem.pitch/fieldsDraft ' +
        'are unbounded @db.Text columns), risking a "Data too long for ' +
        'column" write failure on every Bot UPDATE commit.',
    )
    problems.push({ location: 'updateText', field: 'description' })
  }

  const createCase = extractBotCase(content, CREATE_RECORD_BOT_ANCHOR)
  if (createCase === null) {
    errors.push(
      "Could not find createRecord's Bot case in commit.post.ts -- has it " +
        'been renamed, removed, or restructured? If so, this guard (and ' +
        'the bug it protects against) needs to move with it.',
    )
  } else {
    if (
      !/description:\s*capToBotWidth\(\s*text\s*,\s*'description'\s*\)/.test(
        createCase,
      )
    ) {
      errors.push(
        "createRecord's Bot case no longer wraps its `description` write " +
          "in capToBotWidth(text, 'description'). Bot.description is a " +
          'bounded VarChar(764) column -- Bot is a real CREATE target via ' +
          'the expand-manager-bot/expand-narrator-bot outputs.',
      )
      problems.push({ location: 'createRecord', field: 'description' })
    }
    if (
      !/botIntro:\s*extra\.botIntro\s*\?\?\s*capToBotWidth\(\s*text \|\| name\s*,\s*'botIntro'\s*\)/.test(
        createCase,
      )
    ) {
      errors.push(
        "createRecord's Bot case no longer wraps its `botIntro` fallback " +
          "in capToBotWidth(text || name, 'botIntro'). Bot.botIntro is a " +
          'bounded, NOT NULL VarChar(3000) column -- when the FIELDS ' +
          'stage leaves botIntro blank (normal; nothing requires filling ' +
          'it in before COMMIT), this fallback is what actually writes.',
      )
      problems.push({ location: 'createRecord', field: 'botIntro' })
    }
    if (
      !/prompt:\s*extra\.prompt\s*\?\?\s*capToBotWidth\(\s*text \|\| name\s*,\s*'prompt'\s*\)/.test(
        createCase,
      )
    ) {
      errors.push(
        "createRecord's Bot case no longer wraps its `prompt` fallback in " +
          "capToBotWidth(text || name, 'prompt'). Bot.prompt is a bounded, " +
          'NOT NULL VarChar(764) column -- when the FIELDS stage leaves ' +
          'prompt blank (normal; nothing requires filling it in before ' +
          'COMMIT), this fallback is what actually writes.',
      )
      problems.push({ location: 'createRecord', field: 'prompt' })
    }
  }

  return { errors, problems }
}

function main(): void {
  const content = readFileSync(ROUTE_PATH, 'utf8')
  const { errors } = findRawTextFallbackProblems(content)

  if (errors.length) {
    console.error(
      'Model Builder commit raw-text fallback guard contract failed for ' +
        'server/api/model-builder/items/[id]/commit.post.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder commit raw-text fallback guard contract passed: ' +
      "updateText's and createRecord's Bot cases cap the raw pitch/" +
      "fieldsDraft `text` fallback to Bot.description/botIntro/prompt's " +
      'real schema widths instead of assigning it uncapped.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
