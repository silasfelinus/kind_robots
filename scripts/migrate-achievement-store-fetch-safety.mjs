import { readFileSync, writeFileSync } from 'node:fs'

const path = 'stores/achievementStore.ts'
const source = readFileSync(path, 'utf8')
const newline = source.includes('\r\n') ? '\r\n' : '\n'
let updated = source.replace(/\r\n/g, '\n')

function replaceExact(target, replacement, label) {
  if (!updated.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  updated = updated.replace(target, replacement)
}

replaceExact(
  `import { loadSnapshot, markSnapshotActive } from './helpers/snapshotLoader'
import { slugify } from '~/utils/slugify'`,
  `import { loadSnapshot, markSnapshotActive } from './helpers/snapshotLoader'
import { mergeDefinedRecord, mergeRecordsById } from './helpers/recordMerge'
import { slugify } from '~/utils/slugify'`,
  'Achievement merge helper import',
)

replaceExact(
  `  const loadingScores = ref(false)
  const lastError = ref<string | null>(null)`,
  `  const loadingScores = ref(false)
  const activeScoreFetches = ref(0)
  const lastError = ref<string | null>(null)`,
  'Achievement score fetch counter',
)

replaceExact(
  `    if (index >= 0) {
      achievementRecords.value.splice(index, 1, record)
    } else {`,
  `    if (index >= 0) {
      achievementRecords.value.splice(
        index,
        1,
        mergeDefinedRecord(achievementRecords.value[index], record),
      )
    } else {`,
  'Achievement record detail-preserving upsert',
)

replaceExact(
  `    if (index >= 0) {
      achievements.value.splice(index, 1, achievement)
    } else {`,
  `    if (index >= 0) {
      achievements.value.splice(
        index,
        1,
        mergeDefinedRecord(achievements.value[index], achievement),
      )
    } else {`,
  'Achievement detail-preserving upsert',
)

replaceExact(
  `  async function fetchAchievements(force = false): Promise<Achievement[]> {
    if (!force && achievements.value.length) return achievements.value
    if (fetchAchievementsPromise.value && !force) {
      return fetchAchievementsPromise.value
    }`,
  `  async function fetchAchievements(force = false): Promise<Achievement[]> {
    if (fetchAchievementsPromise.value) return fetchAchievementsPromise.value
    if (!force && achievements.value.length) return achievements.value`,
  'Achievement catalog in-flight dedupe order',
)

replaceExact(
  `        if (res.success && Array.isArray(res.data)) {
          achievements.value = res.data
          usingSnapshot.value = false`,
  `        if (res.success && Array.isArray(res.data)) {
          achievements.value = mergeRecordsById(achievements.value, res.data)
          usingSnapshot.value = false`,
  'Achievement catalog merge',
)

replaceExact(
  `  ): Promise<AchievementRecord[]> {
    if (!force && achievementRecords.value.length) return achievementRecords.value
    if (fetchRecordsPromise.value && !force) return fetchRecordsPromise.value`,
  `  ): Promise<AchievementRecord[]> {
    if (fetchRecordsPromise.value) return fetchRecordsPromise.value
    if (!force && achievementRecords.value.length) return achievementRecords.value`,
  'Achievement record in-flight dedupe order',
)

replaceExact(
  `    if (isInitialized.value && !options.force) return
    if (initializePromise.value && !options.force)
      return initializePromise.value`,
  `    if (initializePromise.value) return initializePromise.value
    if (isInitialized.value && !options.force) return`,
  'Achievement initialize in-flight dedupe order',
)

replaceExact(
  `  async function fetchHighClickScores(force = false): Promise<UserScore[]> {
    if (!force && highClickScores.value.length) return highClickScores.value
    if (fetchHighClickScoresPromise.value && !force) {
      return fetchHighClickScoresPromise.value
    }

    fetchHighClickScoresPromise.value = (async () => {
      try {
        loadingScores.value = true`,
  `  async function fetchHighClickScores(force = false): Promise<UserScore[]> {
    if (fetchHighClickScoresPromise.value) return fetchHighClickScoresPromise.value
    if (!force && highClickScores.value.length) return highClickScores.value

    fetchHighClickScoresPromise.value = (async () => {
      activeScoreFetches.value += 1
      loadingScores.value = true

      try {`,
  'Click-score in-flight dedupe and loading start',
)

replaceExact(
  `      } finally {
        loadingScores.value = false
        fetchHighClickScoresPromise.value = null
      }
    })()

    return fetchHighClickScoresPromise.value
  }

  async function fetchHighMatchScores(force = false): Promise<UserScore[]> {
    if (!force && highMatchScores.value.length) return highMatchScores.value
    if (fetchHighMatchScoresPromise.value && !force) {
      return fetchHighMatchScoresPromise.value
    }

    fetchHighMatchScoresPromise.value = (async () => {
      try {
        loadingScores.value = true`,
  `      } finally {
        activeScoreFetches.value = Math.max(0, activeScoreFetches.value - 1)
        loadingScores.value = activeScoreFetches.value > 0
        fetchHighClickScoresPromise.value = null
      }
    })()

    return fetchHighClickScoresPromise.value
  }

  async function fetchHighMatchScores(force = false): Promise<UserScore[]> {
    if (fetchHighMatchScoresPromise.value) return fetchHighMatchScoresPromise.value
    if (!force && highMatchScores.value.length) return highMatchScores.value

    fetchHighMatchScoresPromise.value = (async () => {
      activeScoreFetches.value += 1
      loadingScores.value = true

      try {`,
  'Score fetch transition and match-score loading start',
)

replaceExact(
  `      } finally {
        loadingScores.value = false
        fetchHighMatchScoresPromise.value = null
      }`,
  `      } finally {
        activeScoreFetches.value = Math.max(0, activeScoreFetches.value - 1)
        loadingScores.value = activeScoreFetches.value > 0
        fetchHighMatchScoresPromise.value = null
      }`,
  'Match-score loading completion',
)

writeFileSync(path, updated.replace(/\n/g, newline), 'utf8')
