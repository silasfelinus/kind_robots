// /utils/mandarinLessonAudit.ts
//
// Pure, database-free lesson-quality checks for the Mandarin Tutor teaching layer
// (mandarin-tutor/t-026, auditing t-022's utils/mandarinLesson.ts). Kept separate from
// the CLI wrapper for the same reason utils/mandarinContentAudit.ts is: the rules should
// be unit-testable and reviewable without touching a database or the network.
//
// WHAT THIS CHECKS VS. WHAT utils/mandarinContentAudit.ts (t-011) ALREADY CHECKS
// --------------------------------------------------------------------------------
// t-011's audit is about the catalog's SOURCE DATA -- malformed pinyin strings,
// missing audio contracts, unsourced etymology claims. This audit is about the TEACHING
// LAYER built on top of that data: for every card, does buildMandarinLesson() actually
// produce a lesson a human could learn from -- pinyin anatomy that parses into syllables,
// a non-empty history line (a real source claim or an explicit no-claim, t-022's own
// fallback guarantees this unless the derivation itself regresses), and a summary.
//
// THE INTERESTING NUMBER IS NOT AN "ISSUE"
// ------------------------------------------
// A card whose source asserts no semantic/phonetic role for any component produces a
// lesson with `teachability: 'vocabulary'` rather than `'structural'` -- per t-022's own
// honesty contract, that is the CORRECT output, not a bug. t-026's note is explicit: "A
// card that decomposes into nothing teachable is not a bug in the derivation, it is a
// card that should either be enriched from a second source or shown as a vocabulary item
// ... The audit's job is to report how many of those exist and which they are." So
// vocabulary-only coverage is reported as its own `coverage` section, not mixed into
// `issues`/`byCode` -- a `--strict` live run should fail on a real regression (a lesson
// that fails to build, or one with no pinyin anatomy / no history line at all), never on
// the mere existence of vocabulary-only cards.
import { buildMandarinLesson, type MandarinLessonIndex } from './mandarinLesson'
import type { MandarinCard } from './mandarin'

export type MandarinLessonAuditIssue = {
  /** Stable machine-readable reason code, one per check below. */
  code:
    | 'lesson-build-failed'
    | 'lesson-empty-pinyin-anatomy'
    | 'lesson-empty-history'
    | 'lesson-empty-summary'
  subject: string
  detail: string
}

export type MandarinLessonAuditReport = {
  totals: {
    cards: number
    issues: number
  }
  byCode: Record<string, number>
  issues: MandarinLessonAuditIssue[]
  /**
   * Not issues -- see the file header. `vocabularyOnly` is the coverage-gap number
   * t-026 exists to surface: cards whose lesson is honestly `teachability: 'vocabulary'`
   * because the source asserts no semantic/phonetic role for any piece.
   */
  coverage: {
    structural: number
    vocabularyOnly: number
    vocabularyOnlyCards: string[]
  }
}

function pushIssue(
  issues: MandarinLessonAuditIssue[],
  code: MandarinLessonAuditIssue['code'],
  subject: string,
  detail: string,
): void {
  issues.push({ code, subject, detail })
}

export function auditMandarinLessons(
  cards: readonly MandarinCard[],
  index?: MandarinLessonIndex,
): MandarinLessonAuditReport {
  const issues: MandarinLessonAuditIssue[] = []
  let structural = 0
  const vocabularyOnlyCards: string[] = []

  for (const card of cards) {
    let lesson: ReturnType<typeof buildMandarinLesson>
    try {
      lesson = buildMandarinLesson(card, index)
    } catch (error: unknown) {
      pushIssue(
        issues,
        'lesson-build-failed',
        card.key,
        `buildMandarinLesson threw: ${error instanceof Error ? error.message : String(error)}`,
      )
      continue
    }

    if (!lesson.syllables.length) {
      pushIssue(
        issues,
        'lesson-empty-pinyin-anatomy',
        card.key,
        `pinyin "${card.pinyin}" produced zero syllables -- the lesson has no pronunciation anatomy to teach.`,
      )
    }

    if (!lesson.history?.trim()) {
      pushIssue(
        issues,
        'lesson-empty-history',
        card.key,
        "history is blank -- t-022's fallback should always supply either a source claim or an explicit no-claim sentence.",
      )
    }

    if (!lesson.summary?.trim()) {
      pushIssue(
        issues,
        'lesson-empty-summary',
        card.key,
        'summary is blank -- every lesson should frame what it can actually teach.',
      )
    }

    if (lesson.teachability === 'vocabulary') {
      vocabularyOnlyCards.push(card.key)
    } else {
      structural += 1
    }
  }

  const byCode: Record<string, number> = {}
  for (const issue of issues) {
    byCode[issue.code] = (byCode[issue.code] ?? 0) + 1
  }

  return {
    totals: {
      cards: cards.length,
      issues: issues.length,
    },
    byCode,
    issues,
    coverage: {
      structural,
      vocabularyOnly: vocabularyOnlyCards.length,
      vocabularyOnlyCards,
    },
  }
}
