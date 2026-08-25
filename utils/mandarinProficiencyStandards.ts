// /utils/mandarinProficiencyStandards.ts
//
// mandarin-tutor/t-008: proficiency-standard metadata, kept separate from the
// catalog builder (server/utils/mandarinCatalog.ts) so a coverage report can
// name which official standard -- and which pinned revision of it -- the
// product currently measures against, instead of baking one exam edition in
// permanently. HSK 3.0 (7 cumulative levels) replaced the older HSK 1-6
// scale as mainland China's official standard in 2021 and is the standard
// this product currently targets. MANDARIN_PROFICIENCY_STANDARDS is an array
// so a second entry (the older 2.0 scale, or a future revision) can be added
// later without restructuring callers -- see utils/mandarinProficiencyCoverage.ts
// for the report built from this metadata plus the live catalog.
//
// referenceCumulativeVocabulary figures are HSK 3.0's own published
// cumulative vocabulary sizes (500 / 1,272 / 2,245 / 3,245 / 4,316 / 5,456 /
// 11,092 words through levels 1-7), included for orientation only -- never a
// pass/fail gate. The pinned upstream source's own per-level cumulative
// counts land within ~2% of these (it is a CC-CEDICT + word-frequency
// compilation, not a verbatim transcription of the official blueprint),
// which is close enough to confirm the level mapping without asserting
// exact parity with it.
import { MANDARIN_SOURCE_COMMIT, MANDARIN_SOURCE_REPO_URL } from './mandarin'

export type MandarinProficiencyLevel = {
  level: number
  label: string
  /** HSK 3.0's own published cumulative vocabulary size through this level. Informational only. */
  referenceCumulativeVocabulary: number
}

export type MandarinProficiencyStandard = {
  id: string
  label: string
  levels: MandarinProficiencyLevel[]
  sourceLabel: string
  sourceUrl: string
  sourceCommit: string
}

const HSK_3_LEVELS: MandarinProficiencyLevel[] = [
  { level: 1, label: 'HSK 3.0 Level 1', referenceCumulativeVocabulary: 500 },
  { level: 2, label: 'HSK 3.0 Level 2', referenceCumulativeVocabulary: 1_272 },
  { level: 3, label: 'HSK 3.0 Level 3', referenceCumulativeVocabulary: 2_245 },
  { level: 4, label: 'HSK 3.0 Level 4', referenceCumulativeVocabulary: 3_245 },
  { level: 5, label: 'HSK 3.0 Level 5', referenceCumulativeVocabulary: 4_316 },
  { level: 6, label: 'HSK 3.0 Level 6', referenceCumulativeVocabulary: 5_456 },
  {
    level: 7,
    label: 'HSK 3.0 Levels 7-9 (advanced band)',
    referenceCumulativeVocabulary: 11_092,
  },
]

export const HSK_3_STANDARD: MandarinProficiencyStandard = {
  id: 'hsk-3.0',
  label: 'HSK 3.0 (2021 revision)',
  levels: HSK_3_LEVELS,
  sourceLabel: 'HSK Vocabulary / CC-CEDICT compilation',
  sourceUrl: MANDARIN_SOURCE_REPO_URL,
  sourceCommit: MANDARIN_SOURCE_COMMIT,
}

/** All standards this product knows how to report coverage against. */
export const MANDARIN_PROFICIENCY_STANDARDS: MandarinProficiencyStandard[] = [
  HSK_3_STANDARD,
]

/** The standard the live catalog is currently built from and measured against. */
export const DEFAULT_MANDARIN_PROFICIENCY_STANDARD = HSK_3_STANDARD
