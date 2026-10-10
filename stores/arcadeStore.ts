// /stores/arcadeStore.ts
//
// Kind Robots Arcade leaderboards (conductor kr-arcade). Boards are global:
// they come from /api/arcade/scores, and /api/arcade/leaderboard is the hall
// of fame across every cabinet. If a score cannot reach the server it waits in
// this browser's pending queue and uploads on the next visit or reconnect, so
// a high score always ends up on the global board; meanwhile the cabinet
// shows it on a board saved in this browser.

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from './utils'
import {
  enqueuePending,
  PENDING_FLUSH_BATCH,
  sanitizePending,
  shouldRetryScore,
  type HallOfFameEntry,
  type PendingArcadeScore,
} from '~/utils/arcade/leaderboard'
import { isRenderStyle, type RenderStyle } from '~/utils/arcade/display'
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

export type ArcadeBoardRange = 'all' | 'today'

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

type ArcadePrefs = {
  muted?: boolean
  crt?: boolean
  /** The player's render style for every cabinet, and per-game overrides by slug. */
  renderStyle?: RenderStyle
  gameStyles?: Record<string, RenderStyle>
  initials?: string
  /** Players last seated at each co-op cabinet, by game slug. */
  players?: Record<string, number>
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
  /** CRT scanlines; defaults off for reduced-motion viewers. */
  const crt = ref(true)
  const renderStyle = ref<RenderStyle>(DEFAULT_RENDER_STYLE)
  const gameStyles = ref<Record<string, RenderStyle>>({})
  const savedInitials = ref('')
  /** Players last seated at each co-op cabinet, by game slug. */
  const seatedPlayers = ref<Record<string, number>>({})
  /** Mastery goals this device's player has earned, by game slug. */
  const mastery = ref<MasteryRecord>({})
  /** Each long cabinet's saved progress on this device, by game slug. */
  const saves = ref<SaveRecord>({})
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

  /** A game's saved progress on this device, if any. */
  function saveFor(game: string): unknown {
    return saves.value[game]
  }

  /** Keep (or, with null, clear) a game's saved progress. */
  function recordSave(game: string, save: unknown) {
    const next = withSave(saves.value, game, save)
    if (next === saves.value) return
    saves.value = next
    writeSaves(next)
  }

  function loadPreferences(prefersReducedMotion: boolean) {
    mastery.value = readMastery()
    saves.value = readSaves()
    const prefs = readPrefs()
    muted.value = prefs.muted === true
    crt.value = prefs.crt ?? !prefersReducedMotion
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
    pendingCount.value = readPending().length
    if (pendingCount.value) void flushPending()
  }

  function savePreferences() {
    writePrefs({
      muted: muted.value,
      crt: crt.value,
      renderStyle: renderStyle.value,
      gameStyles: gameStyles.value,
      initials: savedInitials.value,
      players: seatedPlayers.value,
    })
  }

  /** How many to seat at this cabinet: the last choice, within its limit. */
  function playersFor(game: string, maxPlayers: number) {
    return Math.max(1, Math.min(maxPlayers, seatedPlayers.value[game] ?? 1))
  }

  function setPlayers(game: string, count: number) {
    seatedPlayers.value = { ...seatedPlayers.value, [game]: count }
    savePreferences()
  }

  function setMuted(value: boolean) {
    muted.value = value
    savePreferences()
  }

  function setCrt(value: boolean) {
    crt.value = value
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
    flushPending,
    lastSubmittedId,
    muted,
    crt,
    renderStyle,
    gameStyles,
    styleFor,
    setRenderStyle,
    setGameStyle,
    savedInitials,
    mastery,
    masteryFor,
    recordMastery,
    saveFor,
    recordSave,
    playersFor,
    setPlayers,
    board,
    fetchBoard,
    submitScore,
    loadPreferences,
    setMuted,
    setCrt,
    rememberInitials,
  }
})
