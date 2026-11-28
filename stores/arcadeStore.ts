// /stores/arcadeStore.ts
//
// Kind Robots Arcade leaderboards (conductor kr-arcade). Boards are global:
// they come from /api/arcade/scores, and /api/arcade/leaderboard is the hall
// of fame across every cabinet. If a score cannot reach the server it waits in
// this browser's pending queue and uploads on the next visit or reconnect, so
// a high score always ends up on the global board; meanwhile the cabinet
// shows it on a board saved in this browser.

import { ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from './utils'
import { useAchievementStore } from './achievementStore'
import {
  PlumberCloud,
  type PlumberAccountCopy,
  type PlumberCloudStatus,
  type PlumberCloudConflict,
} from './helpers/plumberCloud'
import {
  PLUMBER_SLUG,
  type PlumberFile,
  type PlumberConflictChoice,
} from '~/utils/arcade/games/savePlumberSave'
import {
  enqueuePending,
  PENDING_FLUSH_BATCH,
  sanitizePending,
  shouldRetryScore,
  type HallOfFameEntry,
  type PendingArcadeScore,
} from '~/utils/arcade/leaderboard'
import { isRenderStyle, type RenderStyle } from '~/utils/arcade/display'
import { clampVolume } from '~/utils/arcade/sound'
import {
  sanitizeKeyRemap,
  withKeyRemap,
  type ArcadeKeyRemap,
  type RemappableButton,
} from '~/utils/arcade/input'
import {
  MASTERY_KEY,
  mergeMastery,
  sanitizeMastery,
  type MasteryRecord,
} from '~/utils/arcade/mastery'
import {
  SAVES_KEY,
  sanitizeSaves,
  withSave,
  type SaveRecord,
} from '~/utils/arcade/saves'
import {
  mergeSpectrumSaves,
  readSpectrumSave,
  validSpectrumCloudSave,
  type SpectrumSave,
} from '~/utils/arcade/superkateSpectrum/progress'
import {
  RAINBOW_SAVE_GAME,
  RAINBOW_SLOT_COUNT,
  eraseRainbowSlot,
  rainbowSlotKey,
} from '~/utils/arcade/games/rainbowSaveSlots'
import type { RainbowMedal } from '~/utils/arcade/games/rainbowLoadouts'
import {
  awardRainbowHangarMedals,
  emptyRainbowHangar,
  purchaseRainbowHangarUpgrade,
  rainbowHangarBonuses as hangarBonuses,
  rainbowHangarLivery,
  readRainbowHangar,
  withRainbowCallSign,
  withRainbowPaint,
  type RainbowHangar,
  type RainbowHangarUpgrade,
} from '~/utils/arcade/games/rainbowHangar'
import {
  achievementCode,
  arcadeAchievementsEarned,
  gameAchievementByCode,
  isMainGame,
} from '~/utils/achievements/gameAchievements'
import {
  ARCADE_COMMS,
  ARCADE_DIFFICULTIES,
  type ArcadeComms,
  type ArcadeDifficulty,
} from '~/utils/arcade/types'

export type ArcadeBoardRange = 'all' | 'today'

export type ArcadeShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export type ArcadeBoardEntry = {
  id: number
  initials: string
  /** Signed-in player's username; absent for guests and this device's own rows. */
  username?: string | null
  score: number
  level: number
  createdAt: string
}

const DEFAULT_RENDER_STYLE: RenderStyle = 'hd'
const BOARD_SIZE = 10
const LOCAL_KEY = (game: string) => `kr-arcade-local-${game}`
const PREFS_KEY = 'kr-arcade-prefs'
const PENDING_KEY = 'kr-arcade-pending'
const SPECTRUM_SLUG = 'superkate-spectrum'
const SPECTRUM_OWNER = 'kr-arcade-spectrum-owner'
const SPECTRUM_SCOPED = (owner: string) => `kr-spectrum-save-${owner}`
function spectrumRead(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function spectrumWrite(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Continue offline in memory even when browser storage is unavailable.
  }
}
type SpectrumCloudStatus =
  'local' | 'checking' | 'saving' | 'synced' | 'offline'
type SpectrumAccountCopy = {
  save: SpectrumSave
  revision: number
}

type ArcadePrefs = {
  muted?: boolean
  /** Arcade sound volume, 0..1, applied to music and effects. */
  volume?: number
  crt?: boolean
  /** Pinball's camera holds still: no sweeps, cuts instead of pans. */
  stillCamera?: boolean
  /** Hostile shots on an opaque dark disc with a bright ring, in every cabinet that offers it. */
  highContrast?: boolean
  /** Story, banner and speech text drawn larger, for cabinets that offer it. */
  largeText?: boolean
  /** Story panels and speech plates stay up longer, for cabinets that offer it. */
  slowReading?: boolean
  /** How much crew chatter cabinets with comms show. */
  comms?: ArcadeComms
  /** Each cabinet's player-chosen face-button keys, by game slug. */
  keyRemaps?: Record<string, ArcadeKeyRemap>
  /** The player's render style for every cabinet, and per-game overrides by slug. */
  renderStyle?: RenderStyle
  gameStyles?: Record<string, RenderStyle>
  initials?: string
  /** Players last seated at each co-op cabinet, by game slug. */
  players?: Record<string, number>
  /** The difficulty last chosen at each cabinet that offers one, by game slug. */
  difficulties?: Record<string, ArcadeDifficulty>
  /** Selected Rainbow campaign slot; slot one keeps the original save key. */
  rainbowSlot?: number
  rainbowHangars?: RainbowHangar[]
  /** Games whose opening this device has watched or skipped, by slug. */
  openings?: Record<string, boolean>
}

function readPrefs(): ArcadePrefs {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? (parsed as ArcadePrefs) : {}
  } catch {
    return {}
  }
}

function writePrefs(prefs: ArcadePrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Private mode: the choice just won't persist.
  }
}

function readLocal(game: string): ArcadeBoardEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY(game)) ?? '[]')
    return Array.isArray(parsed) ? (parsed as ArcadeBoardEntry[]) : []
  } catch {
    return []
  }
}

function writeLocal(game: string, rows: ArcadeBoardEntry[]) {
  try {
    localStorage.setItem(LOCAL_KEY(game), JSON.stringify(rows))
  } catch {
    // Storage full or blocked: the score still shows for this visit.
  }
}

function readPending(): PendingArcadeScore[] {
  try {
    return sanitizePending(
      JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]'),
    )
  } catch {
    return []
  }
}

function writePending(rows: PendingArcadeScore[]) {
  try {
    if (rows.length) localStorage.setItem(PENDING_KEY, JSON.stringify(rows))
    else localStorage.removeItem(PENDING_KEY)
  } catch {
    // Blocked storage: the score stays on this visit's board only.
  }
}

function readMastery(): MasteryRecord {
  try {
    return sanitizeMastery(
      JSON.parse(localStorage.getItem(MASTERY_KEY) ?? '{}'),
    )
  } catch {
    return {}
  }
}

function readSaves(): SaveRecord {
  try {
    return sanitizeSaves(JSON.parse(localStorage.getItem(SAVES_KEY) ?? '{}'))
  } catch {
    return {}
  }
}

function writeSaves(record: SaveRecord) {
  try {
    localStorage.setItem(SAVES_KEY, JSON.stringify(record))
  } catch {
    // Blocked storage: progress lasts for this visit only.
  }
}

function writeMastery(record: MasteryRecord) {
  try {
    localStorage.setItem(MASTERY_KEY, JSON.stringify(record))
  } catch {
    // Blocked storage: the goals count for this visit only.
  }
}

function rankRows(rows: ArcadeBoardEntry[]): ArcadeBoardEntry[] {
  return [...rows]
    .sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt))
    .slice(0, BOARD_SIZE)
}

function isToday(iso: string): boolean {
  return iso.slice(0, 10) === new Date().toISOString().slice(0, 10)
}

export const useArcadeStore = defineStore('arcadeStore', () => {
  const boards = ref<Record<string, ArcadeBoardEntry[]>>({})
  /** True when the boards shown are this browser's own (API unreachable). */
  const offline = ref(false)
  const lastSubmittedId = ref<number | null>(null)
  const muted = ref(false)
  const volume = ref(1)
  /** CRT scanlines; defaults off for reduced-motion viewers. */
  const crt = ref(true)
  const stillCamera = ref(false)
  const highContrast = ref(false)
  const largeText = ref(false)
  const slowReading = ref(false)
  const comms = ref<ArcadeComms>('full')
  const keyRemaps = ref<Record<string, ArcadeKeyRemap>>({})
  const renderStyle = ref<RenderStyle>(DEFAULT_RENDER_STYLE)
  const gameStyles = ref<Record<string, RenderStyle>>({})
  const savedInitials = ref('')
  /** Players last seated at each co-op cabinet, by game slug. */
  const seatedPlayers = ref<Record<string, number>>({})
  /** The difficulty last chosen at each cabinet that offers one, by game slug. */
  const difficulties = ref<Record<string, ArcadeDifficulty>>({})
  /** Mastery goals this device's player has earned, by game slug. */
  const mastery = ref<MasteryRecord>({})
  /** Each long cabinet's saved progress on this device, by game slug. */
  const saves = ref<SaveRecord>({})
  const plumberCloudStatus = ref<PlumberCloudStatus>('local')
  const plumberConflict = shallowRef<PlumberCloudConflict | null>(null)
  const plumberFile = ref<PlumberFile | null>(null)
  const plumberDeviceOwner = ref<string | null>(null)
  const plumberCloud = new PlumberCloud({
    read(owner) {
      try {
        return JSON.parse(
          localStorage.getItem(`kr-plumber-save-${owner}`) ?? 'null',
        )
      } catch {
        return null
      }
    },
    write(owner, cache) {
      try {
        localStorage.setItem(`kr-plumber-save-${owner}`, JSON.stringify(cache))
      } catch {
        // Keep the current account's save in memory.
      }
    },
    async get(token) {
      const reply = await $fetch<
        { success: boolean; data: PlumberAccountCopy | null },
        string
      >('/api/arcade/saves/save-the-plumber', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 4000,
      })
      if (!reply.success) throw new Error('Could not read account save')
      return reply.data
    },
    async put(token, save, expectedRevision) {
      const reply = await $fetch<
        { success: boolean; data?: { revision: number } },
        string
      >('/api/arcade/saves/save-the-plumber', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 4000,
        body: { save, expectedRevision },
      })
      if (!reply.success || !reply.data)
        throw new Error('Could not write account save')
      return reply.data.revision
    },
    changed(save, status, conflict) {
      plumberFile.value = save
      plumberCloudStatus.value = status
      plumberConflict.value = conflict
    },
  })

  function plumberOwner() {
    return String(useUserStore().authenticatedUserId ?? 'guest')
  }

  function selectPlumberOwner() {
    if (!import.meta.client) return
    const owner = plumberOwner()
    plumberDeviceOwner.value = owner
    plumberCloud.select(owner, saves.value[PLUMBER_SLUG])
  }

  async function syncPlumberCareer() {
    if (!import.meta.client) return
    selectPlumberOwner()
    const token = useUserStore().token ?? null
    await plumberCloud.sync(plumberOwner(), token, saves.value[PLUMBER_SLUG])
  }

  async function resolvePlumberConflict(choice: PlumberConflictChoice) {
    if (!import.meta.client || !plumberConflict.value) return
    await plumberCloud.resolve(
      plumberOwner(),
      useUserStore().token ?? null,
      choice,
      plumberConflict.value,
    )
  }

  function retryPlumberCareer() {
    if (!import.meta.client) return
    plumberCloud.retry(plumberOwner(), useUserStore().token ?? null)
  }

  const spectrumCloudStatus = ref<SpectrumCloudStatus>('local')
  let spectrumOwner: number | null = null
  let spectrumRevision: number | null = null
  let spectrumUploading: number | null = null
  let spectrumDeviceOwner: string | null = null
  let spectrumDirty = false
  let spectrumSession = 0
  const rainbowSlot = ref(0)
  const rainbowHangars = ref<RainbowHangar[]>(
    Array.from({ length: RAINBOW_SLOT_COUNT }, emptyRainbowHangar),
  )
  /** Scores waiting in this browser to reach the global board. */
  const pendingCount = ref(0)
  const hallOfFame = ref<HallOfFameEntry[]>([])
  let flushing = false

  /**
   * Upload scores that could not reach the server earlier. Stops at the first
   * one the server still can't take; drops any it rejects outright.
   */
  async function flushPending() {
    if (flushing) return
    flushing = true
    try {
      let queue = readPending()
      for (const entry of queue.slice(0, PENDING_FLUSH_BATCH)) {
        const res = await performFetch<{ id: number; rank: number }>(
          '/api/arcade/scores',
          {
            method: 'POST',
            body: JSON.stringify({
              game: entry.game,
              initials: entry.initials,
              score: entry.score,
              level: entry.level,
            }),
          },
        )
        if (!res.success && shouldRetryScore(res.status)) break
        queue = queue.filter((row) => row.id !== entry.id)
        writePending(queue)
      }
      pendingCount.value = queue.length
    } finally {
      flushing = false
    }
  }

  async function shareLink(link: {
    title: string
    text?: string
    url: string
  }): Promise<ArcadeShareResult> {
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(link)
        return 'shared'
      }
      await navigator.clipboard.writeText(
        link.text ? `${link.text} ${link.url}` : link.url,
      )
      return 'copied'
    } catch (err) {
      return (err as Error)?.name === 'AbortError' ? 'cancelled' : 'failed'
    }
  }

  async function fetchHallOfFame() {
    const res = await performFetch<HallOfFameEntry[]>('/api/arcade/leaderboard')
    if (res.success && Array.isArray(res.data)) {
      hallOfFame.value = res.data
      offline.value = false
    }
    return hallOfFame.value
  }

  /** The mastery goals this player has earned at a cabinet. */
  function masteryFor(game: string): string[] {
    return mastery.value[game] ?? []
  }

  /** Keep the goals a game just earned (stores own persistence). */
  function recordMastery(game: string, ids: readonly string[]) {
    const next = mergeMastery(mastery.value, game, ids)
    if (next === mastery.value) return
    mastery.value = next
    writeMastery(next)
  }

  /**
   * Award the site achievements a run earned at a cabinet: its score, its
   * level, and every mastery goal this player holds there. Already-earned
   * ones are skipped, so a run only announces what is new.
   */
  async function awardRunAchievements(
    game: string,
    run: { score: number; level: number },
  ) {
    const earned = arcadeAchievementsEarned(game, {
      ...run,
      mastered: masteryFor(game),
    })
    if (!earned.length) return
    const achievements = useAchievementStore()
    for (const entry of earned) {
      if (achievements.hasEarnedCode(entry.code)) continue
      await achievements.rewardAchievementByCode(entry.code)
    }
  }

  /**
   * Award the achievements a game reported the moment it performed them (a
   * table's feats, a main game's deeds). Codes follow the registry, so a
   * cabinet-born main game keeps its arcade- prefix; unknown keys are skipped.
   */
  async function awardFeats(game: string, feats: readonly string[]) {
    const achievements = useAchievementStore()
    for (const feat of feats) {
      const code = achievementCode({ game, key: feat })
      if (!gameAchievementByCode(code)) continue
      if (achievements.hasEarnedCode(code)) continue
      await achievements.rewardAchievementByCode(code)
    }
  }

  /**
   * A main game's achievements that share their key with a mastery goal this
   * player already holds here: earned before the game had achievements, they
   * are backfilled at the next start or finished run.
   */
  async function awardMasteryAchievements(game: string) {
    if (!isMainGame(game)) return
    await awardFeats(game, masteryFor(game))
  }

  /** A game's saved progress on this device, if any. */
  function saveFor(game: string): unknown {
    if (game === PLUMBER_SLUG)
      return plumberDeviceOwner.value === plumberOwner()
        ? plumberFile.value
        : undefined
    const key =
      game === RAINBOW_SAVE_GAME ? rainbowSlotKey(rainbowSlot.value) : game
    return key ? saves.value[key] : undefined
  }

  function rainbowSlotSaves(): unknown[] {
    return Array.from({ length: RAINBOW_SLOT_COUNT }, (_, index) => {
      const key = rainbowSlotKey(index)
      return key ? saves.value[key] : undefined
    })
  }

  function setRainbowSlot(slot: number) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= RAINBOW_SLOT_COUNT)
      return
    if (slot === rainbowSlot.value) return
    rainbowSlot.value = slot
    savePreferences()
  }

  /** Erase the chosen slot's flight log: its checkpoint and its Hangar. Earned feats stay with the player. */
  function eraseRainbowFlightLog() {
    const erased = eraseRainbowSlot(
      saves.value,
      rainbowHangars.value,
      rainbowSlot.value,
      emptyRainbowHangar,
    )
    saves.value = erased.saves
    writeSaves(erased.saves)
    rainbowHangars.value = erased.hangars
    savePreferences()
  }

  function rainbowHangarForSlot(): RainbowHangar {
    return rainbowHangars.value[rainbowSlot.value]!
  }

  function rainbowHangarBonuses() {
    return hangarBonuses(rainbowHangarForSlot())
  }

  /** The slot's call sign and ship paint, for the next flight (t-044). */
  function rainbowLivery() {
    return rainbowHangarLivery(rainbowHangarForSlot())
  }

  /** Set or clear this slot's call sign; returns the call sign kept ('' for none). */
  function setRainbowCallSign(raw: unknown): string {
    const next = withRainbowCallSign(rainbowHangarForSlot(), raw)
    rainbowHangars.value[rainbowSlot.value] = next
    savePreferences()
    return next.callSign ?? ''
  }

  /** Paint a pilot's ship in this slot with an unlocked scheme; false when it stays as it was. */
  function paintRainbowShip(pilot: number, scheme: number): boolean {
    const previous = rainbowHangarForSlot()
    const next = withRainbowPaint(previous, pilot, scheme)
    if (next === previous) return false
    rainbowHangars.value[rainbowSlot.value] = next
    savePreferences()
    return true
  }

  function buyRainbowUpgrade(upgrade: RainbowHangarUpgrade): boolean {
    const previous = rainbowHangarForSlot()
    const next = purchaseRainbowHangarUpgrade(previous, upgrade)
    if (next === previous) return false
    rainbowHangars.value[rainbowSlot.value] = next
    savePreferences()
    return true
  }

  /** A replay may improve an Act medal, but must never rewrite the saved flight. */
  function recordRainbowReplayMedal(act: number, medal: RainbowMedal): boolean {
    if (
      !Number.isInteger(act) ||
      act < 1 ||
      act > 8 ||
      !['bronze', 'silver', 'gold'].includes(medal)
    )
      return false
    const previous = rainbowHangarForSlot()
    const next = awardRainbowHangarMedals(previous, {
      medals: { [act]: medal },
    })
    if (next === previous) return false
    rainbowHangars.value[rainbowSlot.value] = next
    savePreferences()
    return true
  }

  /**
   * Device scopes prevent a second signed-in account from silently inheriting
   * the first account's saved stars. A guest career may be adopted on sign-in.
   */
  function switchSpectrumOwner(userId: number | null) {
    if (!import.meta.client) return
    const owner = userId === null ? 'guest' : String(userId)
    const prior = spectrumDeviceOwner ?? spectrumRead(SPECTRUM_OWNER) ?? 'guest'
    spectrumDeviceOwner = owner
    if (prior === owner) return
    const current = saves.value[SPECTRUM_SLUG]
    if (current !== undefined)
      spectrumWrite(SPECTRUM_SCOPED(prior), JSON.stringify(current))
    const cached = spectrumRead(SPECTRUM_SCOPED(owner))
    let next: unknown = null
    if (cached) {
      try {
        next = JSON.parse(cached)
      } catch {
        next = null
      }
    } else if (prior === 'guest' && userId !== null) {
      next = current
    }
    saves.value = withSave(saves.value, SPECTRUM_SLUG, next)
    writeSaves(saves.value)
    spectrumWrite(SPECTRUM_OWNER, owner)
    spectrumSession++
    spectrumDirty = false
    spectrumOwner = null
    spectrumRevision = null
    spectrumCloudStatus.value = 'local'
  }

  /** The owner's server is canonical for identity, not for reducing progress. */
  async function fetchSpectrumCopy(
    userId: number,
    token: string,
  ): Promise<SpectrumAccountCopy | null> {
    const reply = await $fetch<
      { success: boolean; data: SpectrumAccountCopy | null },
      string
    >('/api/arcade/saves/superkate-spectrum', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 4000,
    })
    if (!reply.success) throw new Error('Could not read account career')
    if (
      reply.data &&
      (!Number.isSafeInteger(reply.data.revision) ||
        reply.data.revision < 0 ||
        !validSpectrumCloudSave(reply.data.save))
    )
      throw new Error('Account career needs repair')
    if (useUserStore().authenticatedUserId !== userId)
      throw new Error('Signed-in player changed during sync')
    return reply.data
  }

  /** Sync is idempotent. All conflict recovery refetches before any retry. */
  async function syncSuperkateCareer() {
    if (!import.meta.client) return
    const user = useUserStore()
    const userId = user.authenticatedUserId
    if (!userId || !user.token) {
      switchSpectrumOwner(null)
      spectrumSession++
      spectrumDirty = false
      spectrumOwner = null
      spectrumRevision = null
      spectrumCloudStatus.value = 'local'
      return
    }
    switchSpectrumOwner(userId)
    // Every cabinet re-entry refetches; another device may have progressed.
    const session = ++spectrumSession
    spectrumDirty = false
    spectrumCloudStatus.value = 'checking'
    try {
      const copy = await fetchSpectrumCopy(userId, user.token)
      if (session !== spectrumSession) return
      spectrumOwner = userId
      spectrumRevision = copy?.revision ?? null
      const local = readSpectrumSave(saves.value[SPECTRUM_SLUG])
      const merged = copy ? mergeSpectrumSaves(local, copy.save) : local
      saves.value = withSave(saves.value, SPECTRUM_SLUG, merged)
      writeSaves(saves.value)
      spectrumWrite(SPECTRUM_SCOPED(String(userId)), JSON.stringify(merged))
      spectrumCloudStatus.value = 'synced'
      if (!copy || JSON.stringify(merged) !== JSON.stringify(copy.save))
        queueSpectrumUpload()
    } catch {
      if (session === spectrumSession) spectrumCloudStatus.value = 'offline'
    }
  }

  function queueSpectrumUpload() {
    if (
      !spectrumOwner ||
      (spectrumCloudStatus.value !== 'synced' &&
        spectrumCloudStatus.value !== 'saving') ||
      !import.meta.client
    )
      return
    spectrumDirty = true
    spectrumCloudStatus.value = 'saving'
    if (spectrumUploading !== spectrumSession) void uploadSpectrumCareer()
  }

  async function uploadSpectrumCareer() {
    if (spectrumUploading === spectrumSession || !spectrumOwner) return
    const userId = spectrumOwner
    const session = spectrumSession
    spectrumUploading = session
    try {
      for (let tries = 0; tries < 4; tries++) {
        if (session !== spectrumSession || !spectrumDirty) break
        const user = useUserStore()
        if (user.authenticatedUserId !== userId || !user.token) break
        spectrumDirty = false
        const save = readSpectrumSave(saves.value[SPECTRUM_SLUG])
        try {
          const reply = await $fetch<
            { success: boolean; data?: { revision: number } },
            string
          >('/api/arcade/saves/superkate-spectrum', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${user.token}` },
            timeout: 4000,
            body: { save, expectedRevision: spectrumRevision },
          })
          if (!reply.success || !reply.data)
            throw new Error('Account career write failed')
          if (session !== spectrumSession) break
          spectrumRevision = reply.data.revision
        } catch (error) {
          const response = error as { status?: number; statusCode?: number }
          const conflict =
            response.status === 409 || response.statusCode === 409
          if (!conflict) throw error
          const remote = await fetchSpectrumCopy(userId, user.token)
          if (session !== spectrumSession) break
          spectrumRevision = remote?.revision ?? null
          const latest = readSpectrumSave(saves.value[SPECTRUM_SLUG])
          const merged = remote
            ? mergeSpectrumSaves(latest, remote.save)
            : latest
          saves.value = withSave(saves.value, SPECTRUM_SLUG, merged)
          writeSaves(saves.value)
          spectrumWrite(SPECTRUM_SCOPED(String(userId)), JSON.stringify(merged))
          spectrumDirty = true
        }
      }
      if (session === spectrumSession)
        spectrumCloudStatus.value = spectrumDirty ? 'offline' : 'synced'
    } catch {
      if (session === spectrumSession) {
        spectrumDirty = true
        spectrumCloudStatus.value = 'offline'
      }
    } finally {
      if (spectrumUploading === session) spectrumUploading = null
    }
  }

  /** Keep (or, with null, clear) a game's saved progress. */
  function recordSave(game: string, save: unknown) {
    if (game === PLUMBER_SLUG) {
      if (import.meta.client && plumberDeviceOwner.value === plumberOwner())
        plumberCloud.record(plumberOwner(), useUserStore().token ?? null, save)
      return
    }
    if (game === SPECTRUM_SLUG && import.meta.client) {
      const userId = useUserStore().authenticatedUserId
      const owner = userId ? String(userId) : 'guest'
      if (spectrumDeviceOwner !== owner) return
    }
    if (game === RAINBOW_SAVE_GAME) {
      const previous = rainbowHangarForSlot()
      const next = awardRainbowHangarMedals(previous, save)
      if (next !== previous) {
        rainbowHangars.value[rainbowSlot.value] = next
        savePreferences()
      }
    }
    const key =
      game === RAINBOW_SAVE_GAME ? rainbowSlotKey(rainbowSlot.value) : game
    if (!key) return
    const value =
      game === SPECTRUM_SLUG && save !== null
        ? mergeSpectrumSaves(
            readSpectrumSave(save),
            readSpectrumSave(saves.value[SPECTRUM_SLUG]),
          )
        : save
    const next = withSave(saves.value, key, value)
    if (next === saves.value) return
    saves.value = next
    writeSaves(next)
    if (game === SPECTRUM_SLUG && import.meta.client) {
      const owner = spectrumDeviceOwner ?? 'guest'
      spectrumWrite(SPECTRUM_SCOPED(owner), JSON.stringify(value))
      queueSpectrumUpload()
    }
  }

  function loadPreferences(prefersReducedMotion: boolean) {
    mastery.value = readMastery()
    saves.value = readSaves()
    selectPlumberOwner()
    const prefs = readPrefs()
    rainbowHangars.value = Array.from(
      { length: RAINBOW_SLOT_COUNT },
      (_, index) => {
        const key = rainbowSlotKey(index)
        const hangar = readRainbowHangar(prefs.rainbowHangars?.[index])
        return awardRainbowHangarMedals(hangar, key ? saves.value[key] : null)
      },
    )
    writePrefs({ ...prefs, rainbowHangars: rainbowHangars.value })
    rainbowSlot.value =
      Number.isInteger(prefs.rainbowSlot) &&
      prefs.rainbowSlot! >= 0 &&
      prefs.rainbowSlot! < RAINBOW_SLOT_COUNT
        ? prefs.rainbowSlot!
        : 0
    muted.value = prefs.muted === true
    volume.value = clampVolume(prefs.volume, 1)
    crt.value = prefs.crt ?? !prefersReducedMotion
    stillCamera.value = prefs.stillCamera ?? prefersReducedMotion
    highContrast.value = prefs.highContrast === true
    largeText.value = prefs.largeText === true
    slowReading.value = prefs.slowReading === true
    comms.value = ARCADE_COMMS.includes(prefs.comms as ArcadeComms)
      ? (prefs.comms as ArcadeComms)
      : 'full'
    keyRemaps.value = {}
    if (prefs.keyRemaps && typeof prefs.keyRemaps === 'object')
      for (const [game, raw] of Object.entries(prefs.keyRemaps)) {
        const remap = sanitizeKeyRemap(raw)
        if (Object.keys(remap).length) keyRemaps.value[game] = remap
      }
    renderStyle.value = isRenderStyle(prefs.renderStyle)
      ? prefs.renderStyle
      : DEFAULT_RENDER_STYLE
    gameStyles.value = {}
    if (prefs.gameStyles && typeof prefs.gameStyles === 'object')
      for (const [game, style] of Object.entries(prefs.gameStyles))
        if (isRenderStyle(style)) gameStyles.value[game] = style
    savedInitials.value =
      typeof prefs.initials === 'string' ? prefs.initials : ''
    seatedPlayers.value = {}
    if (prefs.players && typeof prefs.players === 'object')
      for (const [game, count] of Object.entries(prefs.players))
        if (Number.isInteger(count) && count >= 1 && count <= 4)
          seatedPlayers.value[game] = count
    difficulties.value = {}
    if (prefs.difficulties && typeof prefs.difficulties === 'object')
      for (const [game, level] of Object.entries(prefs.difficulties))
        if (ARCADE_DIFFICULTIES.includes(level))
          difficulties.value[game] = level
    pendingCount.value = readPending().length
    if (pendingCount.value) void flushPending()
  }

  function savePreferences() {
    writePrefs({
      muted: muted.value,
      volume: volume.value,
      crt: crt.value,
      stillCamera: stillCamera.value,
      highContrast: highContrast.value,
      largeText: largeText.value,
      slowReading: slowReading.value,
      comms: comms.value,
      keyRemaps: keyRemaps.value,
      renderStyle: renderStyle.value,
      gameStyles: gameStyles.value,
      initials: savedInitials.value,
      players: seatedPlayers.value,
      difficulties: difficulties.value,
      openings: readPrefs().openings,
      rainbowSlot: rainbowSlot.value,
      rainbowHangars: rainbowHangars.value,
    })
  }

  /** Whether this device has already watched (or skipped) a game's opening. */
  function openingSeen(game: string): boolean {
    return readPrefs().openings?.[game] === true
  }

  /** Remember that a game's opening was watched or skipped, so it is offered rather than shown next time. */
  function markOpeningSeen(game: string) {
    const prefs = readPrefs()
    writePrefs({ ...prefs, openings: { ...prefs.openings, [game]: true } })
  }

  /** How many to seat at this cabinet: the last choice, within its limit. */
  function playersFor(game: string, maxPlayers: number) {
    return Math.max(1, Math.min(maxPlayers, seatedPlayers.value[game] ?? 1))
  }

  function setPlayers(game: string, count: number) {
    seatedPlayers.value = { ...seatedPlayers.value, [game]: count }
    savePreferences()
  }

  /** The difficulty to start this cabinet's next game at: the last choice, else normal. */
  function difficultyFor(game: string): ArcadeDifficulty {
    return difficulties.value[game] ?? 'normal'
  }

  function setDifficulty(game: string, level: ArcadeDifficulty) {
    difficulties.value = { ...difficulties.value, [game]: level }
    savePreferences()
  }

  function setMuted(value: boolean) {
    muted.value = value
    savePreferences()
  }

  function setVolume(value: number) {
    volume.value = clampVolume(value, volume.value)
    savePreferences()
  }

  function setCrt(value: boolean) {
    crt.value = value
    savePreferences()
  }

  function setStillCamera(value: boolean) {
    stillCamera.value = value
    savePreferences()
  }

  function setHighContrast(value: boolean) {
    highContrast.value = value
    savePreferences()
  }

  function setLargeText(value: boolean) {
    largeText.value = value
    savePreferences()
  }

  function setSlowReading(value: boolean) {
    slowReading.value = value
    savePreferences()
  }

  /**
   * Put the shared sound and accessibility options back to a fresh device's defaults:
   * sound on at full volume, high contrast, large text and slow reading off, and the
   * still camera following the viewer's reduced-motion preference. Keys, styles, saves
   * and initials are untouched.
   */
  function resetCabinetSettings(prefersReducedMotion: boolean) {
    muted.value = false
    volume.value = 1
    stillCamera.value = prefersReducedMotion
    highContrast.value = false
    largeText.value = false
    slowReading.value = false
    savePreferences()
  }

  function setComms(value: ArcadeComms) {
    comms.value = value
    savePreferences()
  }

  function keyRemapFor(game: string): ArcadeKeyRemap {
    return keyRemaps.value[game] ?? {}
  }

  /** Give a face button the player's own key (null clears it); a key chosen for another button moves here. */
  function setKeyRemap(
    game: string,
    button: RemappableButton,
    code: string | null,
  ) {
    const clean = withKeyRemap(keyRemapFor(game), button, code)
    keyRemaps.value = Object.fromEntries([
      ...Object.entries(keyRemaps.value).filter(([slug]) => slug !== game),
      ...(Object.keys(clean).length ? [[game, clean]] : []),
    ])
    savePreferences()
  }

  /** The style a cabinet draws in: its own override, else the player's arcade-wide choice. */
  function styleFor(game: string): RenderStyle {
    return gameStyles.value[game] ?? renderStyle.value
  }

  function setRenderStyle(value: RenderStyle) {
    renderStyle.value = value
    savePreferences()
  }

  /** Override one cabinet's style; `null` returns it to the arcade-wide choice. */
  function setGameStyle(game: string, value: RenderStyle | null) {
    const next = Object.fromEntries(
      Object.entries(gameStyles.value).filter(([slug]) => slug !== game),
    ) as Record<string, RenderStyle>
    if (value) next[game] = value
    gameStyles.value = next
    savePreferences()
  }

  function rememberInitials(value: string) {
    savedInitials.value = value
    savePreferences()
  }

  const boardKey = (game: string, range: ArcadeBoardRange) => `${game}:${range}`

  function board(game: string, range: ArcadeBoardRange = 'all') {
    return boards.value[boardKey(game, range)] ?? []
  }

  async function fetchBoard(game: string, range: ArcadeBoardRange = 'all') {
    const res = await performFetch<ArcadeBoardEntry[]>(
      `/api/arcade/scores/${encodeURIComponent(game)}?range=${range}`,
    )
    if (res.success && Array.isArray(res.data)) {
      offline.value = false
      boards.value[boardKey(game, range)] = res.data
    } else {
      offline.value = true
      const local = readLocal(game)
      boards.value[boardKey(game, range)] = rankRows(
        range === 'today'
          ? local.filter((row) => isToday(row.createdAt))
          : local,
      )
    }
    return board(game, range)
  }

  async function submitScore(entry: {
    game: string
    initials: string
    score: number
    level: number
  }) {
    const createdAt = new Date().toISOString()
    const res = await performFetch<{ id: number; rank: number }>(
      '/api/arcade/scores',
      { method: 'POST', body: JSON.stringify(entry) },
    )
    if (res.success && res.data) {
      lastSubmittedId.value = res.data.id
      if (pendingCount.value) void flushPending()
    } else {
      // Keep it locally (negative ids never collide with server rows), and
      // queue it for the global board unless the server rejected it outright.
      const id = -Date.now()
      if (shouldRetryScore(res.status)) {
        const queue = enqueuePending(readPending(), {
          id,
          createdAt,
          ...entry,
        })
        writePending(queue)
        pendingCount.value = queue.length
      }
      writeLocal(
        entry.game,
        rankRows([
          ...readLocal(entry.game),
          {
            id,
            createdAt,
            initials: entry.initials,
            score: entry.score,
            level: entry.level,
          },
        ]),
      )
      lastSubmittedId.value = id
    }
    await Promise.all([
      fetchBoard(entry.game, 'all'),
      fetchBoard(entry.game, 'today'),
    ])
    return lastSubmittedId.value
  }

  return {
    boards,
    offline,
    pendingCount,
    hallOfFame,
    fetchHallOfFame,
    shareLink,
    flushPending,
    lastSubmittedId,
    muted,
    volume,
    crt,
    stillCamera,
    highContrast,
    largeText,
    slowReading,
    comms,
    keyRemapFor,
    renderStyle,
    gameStyles,
    styleFor,
    setRenderStyle,
    setGameStyle,
    savedInitials,
    mastery,
    masteryFor,
    recordMastery,
    awardRunAchievements,
    awardFeats,
    awardMasteryAchievements,
    saveFor,
    recordSave,
    spectrumCloudStatus,
    syncSuperkateCareer,
    plumberCloudStatus,
    plumberConflict,
    resolvePlumberConflict,
    syncPlumberCareer,
    retryPlumberCareer,
    rainbowSlot,
    rainbowSlotSaves,
    eraseRainbowFlightLog,
    setRainbowSlot,
    rainbowHangarForSlot,
    rainbowHangarBonuses,
    rainbowLivery,
    setRainbowCallSign,
    paintRainbowShip,
    buyRainbowUpgrade,
    recordRainbowReplayMedal,
    playersFor,
    setPlayers,
    board,
    fetchBoard,
    submitScore,
    loadPreferences,
    setMuted,
    setVolume,
    setCrt,
    setStillCamera,
    setHighContrast,
    setLargeText,
    setSlowReading,
    resetCabinetSettings,
    setComms,
    setKeyRemap,
    difficultyFor,
    setDifficulty,
    rememberInitials,
    openingSeen,
    markOpeningSeen,
  }
})
