// /stores/arcadeStore.ts
//
// Kind Robots Arcade leaderboards (conductor kr-arcade). Boards come from
// /api/arcade/scores; if the API cannot be reached, the cabinet keeps playing
// against a board saved in this browser so a high score is never just lost.

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from './utils'

export type ArcadeBoardRange = 'all' | 'today'

export type ArcadeBoardEntry = {
  id: number
  initials: string
  score: number
  level: number
  createdAt: string
}

const BOARD_SIZE = 10
const LOCAL_KEY = (game: string) => `kr-arcade-local-${game}`
const PREFS_KEY = 'kr-arcade-prefs'

type ArcadePrefs = { muted?: boolean; crt?: boolean; initials?: string }

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
  const savedInitials = ref('')

  function loadPreferences(prefersReducedMotion: boolean) {
    const prefs = readPrefs()
    muted.value = prefs.muted === true
    crt.value = prefs.crt ?? !prefersReducedMotion
    savedInitials.value =
      typeof prefs.initials === 'string' ? prefs.initials : ''
  }

  function savePreferences() {
    writePrefs({
      muted: muted.value,
      crt: crt.value,
      initials: savedInitials.value,
    })
  }

  function setMuted(value: boolean) {
    muted.value = value
    savePreferences()
  }

  function setCrt(value: boolean) {
    crt.value = value
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
    } else {
      // Keep it locally (negative ids never collide with server rows).
      const id = -Date.now()
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
    lastSubmittedId,
    muted,
    crt,
    savedInitials,
    board,
    fetchBoard,
    submitScore,
    loadPreferences,
    setMuted,
    setCrt,
    rememberInitials,
  }
})
