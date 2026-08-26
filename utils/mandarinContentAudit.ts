// /utils/mandarinContentAudit.ts
//
// Pure, database-free content-quality checks for the Mandarin Tutor catalog
// (mandarin-tutor/t-011). Kept separate from the CLI wrapper for the same
// reason utils/facetCatalogAudit.ts and utils/matureTerms.ts are: the rules
// should be unit-testable and reviewable without touching a database or the
// network, and reusable from more than one entry point later (a future admin
// UI audit view, a pre-publish check on a requested card, etc).
//
// WHAT THIS DOES NOT DO
// ----------------------
// It does not fetch data. Callers pass in the catalog (cards + sets) they
// already built, however they built it -- from the live source catalog
// (utils/scripts/auditMandarinCatalog.ts's default mode), or from a small
// fixture (its --self-test mode). This module never imports `$fetch`, Prisma,
// or anything else with I/O.
import { matchMatureTerms } from './matureTerms'
import type { MandarinCard, MandarinStudySet } from './mandarin'

export type MandarinAuditIssue = {
  /** Stable machine-readable reason code, one per check below. */
  code:
    | 'duplicate-curated-seed'
    | 'duplicate-card-key'
    | 'malformed-pinyin'
    | 'missing-audio-contract'
    | 'orphan-set-term'
    | 'orphan-set-card-key'
    | 'unsupported-etymology-claim'
    | 'adult-or-irrelevant-meaning'
  /** The card key or set id the issue is about, when there is one card in play. */
  subject: string
  detail: string
}

export type MandarinAuditReport = {
  totals: {
    cards: number
    sets: number
    issues: number
  }
  byCode: Record<string, number>
  issues: MandarinAuditIssue[]
}

/**
 * A single pinyin syllable: Latin letters (including ü/Ü) with either a tone
 * diacritic already applied, or a trailing tone digit 1-5, or neither
 * (neutral tone written bare, e.g. "de", "ma"). This is deliberately
 * permissive about which letters combine -- it is not a phonotactics
 * validator -- but it does reject stray punctuation, digits in the wrong
 * place, or empty syllables, which is the actual failure mode a bad edit or a
 * bad upstream source row produces.
 */
const PINYIN_SYLLABLE_RE =
  /^[a-zA-Züÿāēīōūǖáéíóúǘǎěǐǒǔǚàèìòùǜ]+[1-5]?$/u

/** Same separator set utils/mandarinPronunciation.ts's tone parser splits on. */
const PINYIN_SEPARATOR_RE = /[\s'’·-]+/u

export function pinyinSyllables(pinyin: string): string[] {
  return pinyin
    .trim()
    .split(PINYIN_SEPARATOR_RE)
    .map((syllable) => syllable.trim())
    .filter(Boolean)
}

export function isWellFormedPinyin(pinyin: string): boolean {
  const trimmed = pinyin.trim()
  if (!trimmed) return false
  const syllables = pinyinSyllables(trimmed)
  if (!syllables.length) return false
  return syllables.every((syllable) => PINYIN_SYLLABLE_RE.test(syllable))
}

function pushIssue(
  issues: MandarinAuditIssue[],
  code: MandarinAuditIssue['code'],
  subject: string,
  detail: string,
): void {
  issues.push({ code, subject, detail })
}

/**
 * Duplicate Hanzi in the curated-seed list (utils/mandarin.ts's
 * CURATED_MANDARIN_CARDS, one entry per CURATED_SEEDS row -- the raw tuple
 * array itself is not exported, but a duplicate `simplified` in it produces
 * an equally duplicate `simplified`/`key` here). `mergeCards()` in
 * server/utils/mandarinCatalog.ts keys a Map by `simplified`, so a repeated
 * seed entry is silently dropped with no warning anywhere -- this is the
 * check that would have caught it.
 */
export function auditDuplicateSeeds(
  curatedCards: readonly MandarinCard[],
): MandarinAuditIssue[] {
  const issues: MandarinAuditIssue[] = []
  const seen = new Map<string, number>()
  curatedCards.forEach((card, index) => {
    const firstIndex = seen.get(card.simplified)
    if (firstIndex === undefined) {
      seen.set(card.simplified, index)
      return
    }
    pushIssue(
      issues,
      'duplicate-curated-seed',
      card.simplified,
      `CURATED_SEEDS has "${card.simplified}" at index ${firstIndex} and again at index ${index}; the later entry is silently discarded by mergeCards()'s Map, not merged or reported.`,
    )
  })
  return issues
}

function auditDuplicateKeys(cards: readonly MandarinCard[]): MandarinAuditIssue[] {
  const issues: MandarinAuditIssue[] = []
  const seen = new Set<string>()
  for (const card of cards) {
    if (seen.has(card.key)) {
      pushIssue(
        issues,
        'duplicate-card-key',
        card.key,
        `More than one card in the built catalog shares key "${card.key}". Downstream lookups by key (sets, overrides, audio) can silently resolve to the wrong one.`,
      )
      continue
    }
    seen.add(card.key)
  }
  return issues
}

function auditPinyin(cards: readonly MandarinCard[]): MandarinAuditIssue[] {
  const issues: MandarinAuditIssue[] = []
  for (const card of cards) {
    if (!isWellFormedPinyin(card.pinyin)) {
      pushIssue(
        issues,
        'malformed-pinyin',
        card.key,
        `pinyin "${card.pinyin}" does not parse as one or more Latin pinyin syllables (optionally toned).`,
      )
    }
  }
  return issues
}

/**
 * mandarinAudio.ts's deterministic audio-asset id is built from
 * [recipeVersion, provider, model, voice, format, simplified, pinyin]. A card
 * missing either half of that pair can never get a working audio contract --
 * flag it before it reaches the player rather than after.
 */
function auditAudioContracts(cards: readonly MandarinCard[]): MandarinAuditIssue[] {
  const issues: MandarinAuditIssue[] = []
  for (const card of cards) {
    const missing: string[] = []
    if (!card.simplified?.trim()) missing.push('simplified')
    if (!card.pinyin?.trim()) missing.push('pinyin')
    if (missing.length) {
      pushIssue(
        issues,
        'missing-audio-contract',
        card.key,
        `card is missing ${missing.join(' and ')}, so no audio asset id can be derived for it.`,
      )
    }
  }
  return issues
}

/**
 * Two directions of orphan check: a study set's cardKeys pointing at a card
 * that doesn't exist in the built catalog (a stale reference), and a
 * BUILT_IN_SET_TERMS term that matched no card at all (silently contributes
 * nothing to its set, with nothing surfacing that fact today).
 */
export function auditOrphanSets(
  cards: readonly MandarinCard[],
  sets: readonly MandarinStudySet[],
  builtInSetTerms?: Readonly<Record<string, readonly string[]>>,
): MandarinAuditIssue[] {
  const issues: MandarinAuditIssue[] = []
  const cardKeys = new Set(cards.map((card) => card.key))
  const simplifiedForms = new Set(cards.map((card) => card.simplified))

  for (const set of sets) {
    for (const cardKey of set.cardKeys) {
      if (!cardKeys.has(cardKey)) {
        pushIssue(
          issues,
          'orphan-set-card-key',
          set.id,
          `set "${set.id}" references cardKey "${cardKey}", which is not in the built catalog.`,
        )
      }
    }
  }

  if (builtInSetTerms) {
    for (const [setId, terms] of Object.entries(builtInSetTerms)) {
      for (const term of terms) {
        if (!simplifiedForms.has(term)) {
          pushIssue(
            issues,
            'orphan-set-term',
            setId,
            `BUILT_IN_SET_TERMS["${setId}"] lists "${term}", which matches no card's simplified form -- it silently contributes nothing to the set.`,
          )
        }
      }
    }
  }

  return issues
}

/**
 * Structural invariant, not a linguistic judgment: every semantic/phonetic
 * component this catalog assembles (server/utils/mandarinCharacterData.ts) is
 * supposed to carry a sourcing note, and every card whose historyStatus
 * claims "starter" (vetted/source-backed) is supposed to carry actual history
 * text. A component or card that fails this slipped past the code paths that
 * are meant to guarantee it, which is exactly the "unsupported claim" this
 * check exists to catch -- a formation/etymology assertion with the
 * provenance that should back it left off.
 */
function auditEtymologyClaims(cards: readonly MandarinCard[]): MandarinAuditIssue[] {
  const issues: MandarinAuditIssue[] = []
  for (const card of cards) {
    for (const component of card.components) {
      if (
        (component.role === 'semantic' || component.role === 'phonetic') &&
        !component.note?.trim()
      ) {
        pushIssue(
          issues,
          'unsupported-etymology-claim',
          card.key,
          `component "${component.glyph}" (role: ${component.role}) has no sourcing note.`,
        )
      }
    }
    if (card.historyStatus === 'starter' && !card.history?.trim()) {
      pushIssue(
        issues,
        'unsupported-etymology-claim',
        card.key,
        `historyStatus is "starter" (source-backed) but the history field is empty.`,
      )
    }
  }
  return issues
}

/**
 * This is a beginner-facing, kid-safe curriculum by default (see the
 * "casino" set for the one deliberately adult-audience exception, which is
 * itself never mature content, just gambling vocabulary). Reuses the same
 * word-boundary-safe matcher the Resource catalog's mature-content sweep
 * uses (utils/matureTerms.ts) rather than a second ad hoc implementation --
 * false positives here are cheap (a human reviews the flagged card), false
 * negatives are not.
 */
function auditMeaningContent(cards: readonly MandarinCard[]): MandarinAuditIssue[] {
  const issues: MandarinAuditIssue[] = []
  for (const card of cards) {
    const text = [card.meaning, ...card.meanings, card.history ?? '']
      .filter(Boolean)
      .join(' \n ')
    const matches = matchMatureTerms(text)
    if (matches.length) {
      pushIssue(
        issues,
        'adult-or-irrelevant-meaning',
        card.key,
        `meaning/history text matched: ${matches.map((match) => `${match.term} (${match.tier})`).join(', ')}.`,
      )
    }
  }
  return issues
}

export type MandarinCatalogAuditInput = {
  cards: readonly MandarinCard[]
  sets: readonly MandarinStudySet[]
  /** Optional: enables the orphan-set-term half of the orphan-set check. */
  builtInSetTerms?: Readonly<Record<string, readonly string[]>>
  /** Optional: enables the duplicate-curated-seed check. */
  curatedCards?: readonly MandarinCard[]
}

export function auditMandarinCatalog(
  input: MandarinCatalogAuditInput,
): MandarinAuditReport {
  const issues: MandarinAuditIssue[] = [
    ...(input.curatedCards ? auditDuplicateSeeds(input.curatedCards) : []),
    ...auditDuplicateKeys(input.cards),
    ...auditPinyin(input.cards),
    ...auditAudioContracts(input.cards),
    ...auditOrphanSets(input.cards, input.sets, input.builtInSetTerms),
    ...auditEtymologyClaims(input.cards),
    ...auditMeaningContent(input.cards),
  ]

  const byCode: Record<string, number> = {}
  for (const issue of issues) {
    byCode[issue.code] = (byCode[issue.code] ?? 0) + 1
  }

  return {
    totals: {
      cards: input.cards.length,
      sets: input.sets.length,
      issues: issues.length,
    },
    byCode,
    issues,
  }
}
