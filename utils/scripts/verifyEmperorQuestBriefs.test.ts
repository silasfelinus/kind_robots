import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ACT_ONE_QUESTS } from '../emperorOfDust/fortress/actOne'
import { ACT_ONE_LATE_QUESTS } from '../emperorOfDust/fortress/actOneLate'
import { ACT_TWO_QUESTS } from '../emperorOfDust/fortress/actTwo'
import { ACT_THREE_QUESTS } from '../emperorOfDust/fortress/actThree'
import { ACT_FOUR_QUESTS } from '../emperorOfDust/fortress/actFour'
import { ACT_FIVE_QUESTS } from '../emperorOfDust/fortress/actFive'
import { CHORES } from '../emperorOfDust/fortress/chores'
import { authoredQuestDef, questDef } from '../emperorOfDust/fortress/content'
import {
  QUEST_CONTEXT,
  questBrief,
} from '../emperorOfDust/fortress/questBriefs'

const quests = [
  ...ACT_ONE_QUESTS,
  ...ACT_ONE_LATE_QUESTS,
  ...ACT_TWO_QUESTS,
  ...ACT_THREE_QUESTS,
  ...ACT_FOUR_QUESTS,
  ...ACT_FIVE_QUESTS,
  ...CHORES,
]
const names = quests.map((quest) => quest.id)
assert.equal(
  quests.length,
  101,
  'all 71 authored quests and 30 repeatable chores',
)
assert.equal(new Set(names).size, names.length, 'unique quest IDs')
assert.equal(
  Object.keys(QUEST_CONTEXT).length,
  quests.length,
  'complete authored quest-brief coverage',
)
for (const quest of quests) {
  const context = QUEST_CONTEXT[quest.id]
  assert.ok(context, `${quest.id}: narrative context is present`)
  const words = context.trim().split(/\s+/)
  assert.ok(
    words.length >= 50,
    `${quest.id}: at least fifty original words of context (${words.length})`,
  )
  assert.ok(
    !/\b(triumph|success|partial|failure):\b/.test(context),
    `${quest.id}: never paste outcome tables into advance briefing`,
  )
  const brief = questBrief(quest.id, quest.summary)
  assert.ok(
    brief.startsWith(quest.summary),
    `${quest.id}: keep actionable dispatch`,
  )
  assert.ok(brief.includes('\n\n'), `${quest.id}: two readable paragraphs`)
  assert.ok(
    brief.trim().split(/\s+/).length >= 65,
    `${quest.id}: detailed overall brief`,
  )
  assert.equal(
    authoredQuestDef(quest.id)?.summary,
    quest.summary,
    `${quest.id}: editor retains its original editable text`,
  )
  assert.equal(
    questDef(quest.id)?.summary,
    brief,
    `${quest.id}: quest room sees complete briefing`,
  )
  if (quest.id.startsWith('r-')) {
    assert.equal(
      questDef(`${quest.id}@12`)?.summary,
      brief,
      `${quest.id}: seeded repeat instance displays context`,
    )
  }
}
const view = readFileSync('components/EmperorFortressQuests.vue', 'utf8')
assert.ok(
  view.includes('grid grid-cols-2 gap-2'),
  'two compact notices per board row',
)
assert.ok(view.includes('max-h-20'), 'illustrations fit compact quest notices')
assert.ok(
  view.includes('whitespace-pre-line'),
  'paragraph break remains readable',
)
assert.ok(
  view.includes('kr-pane-scroll'),
  'board and dispatch details have independent scrolling',
)
console.log(
  `Emperor of Dust: ${quests.length} unique, spoiler-safe, full-length quest briefs and compact notice grid verified.`,
)
