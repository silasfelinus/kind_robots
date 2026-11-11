import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from './utils'
import type { PvpSnapshot } from '~/utils/slimeCity/pvp'
import type { TeamId } from '~/utils/slimeCity/prototypes'

export type PvpInput =
  | { t: 'play'; card: string; lane: number; choice?: 1 }
  | { t: 'power'; lane: number; team?: TeamId }
  | { t: 'pass' | 'strike' | 'end' }

export const useSlimeCityPvpStore = defineStore('slimeCityPvp', () => {
  const duel = ref<PvpSnapshot | null>(null)
  const loading = ref(false)
  const sending = ref(false)
  const error = ref('')
  let polling: ReturnType<typeof setInterval> | null = null

  const isMyTurn = computed(
    () =>
      !!duel.value?.board &&
      duel.value.stage === 'battle' &&
      duel.value.board.active === duel.value.seat,
  )

  async function request(
    url: string,
    options: RequestInit = {},
  ): Promise<PvpSnapshot> {
    const result = await performFetch<PvpSnapshot>(url, options, 1)
    if (!result.success || !result.data)
      throw new Error(result.message || 'Duel service is unavailable.')
    return result.data
  }

  async function load(id: string, quiet = false): Promise<void> {
    if (sending.value) return
    if (!quiet) loading.value = true
    try {
      const next = await request(
        '/api/slime-city/pvp/' + encodeURIComponent(id),
      )
      duel.value = next
      error.value = ''
    } catch (cause) {
      if (!quiet) {
        duel.value = null
        error.value =
          cause instanceof Error ? cause.message : 'Cannot find duel.'
      }
    } finally {
      loading.value = false
    }
  }

  async function start(team: TeamId): Promise<PvpSnapshot | null> {
    sending.value = true
    error.value = ''
    try {
      const data = await request('/api/slime-city/pvp', {
        method: 'POST',
        body: JSON.stringify({ team }),
      })
      duel.value = data
      return data
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : 'Cannot start duel.'
      return null
    } finally {
      sending.value = false
    }
  }

  async function join(id: string, team: TeamId): Promise<PvpSnapshot | null> {
    sending.value = true
    error.value = ''
    try {
      const data = await request(
        '/api/slime-city/pvp/' + encodeURIComponent(id) + '/join',
        { method: 'POST', body: JSON.stringify({ team }) },
      )
      duel.value = data
      return data
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Cannot join duel.'
      return null
    } finally {
      sending.value = false
    }
  }

  async function send(command: PvpInput): Promise<boolean> {
    const current = duel.value
    if (!current || sending.value || !isMyTurn.value) return false
    sending.value = true
    error.value = ''
    try {
      duel.value = await request(
        '/api/slime-city/pvp/' + encodeURIComponent(current.id) + '/command',
        {
          method: 'POST',
          body: JSON.stringify({ revision: current.revision, command }),
        },
      )
      return true
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Move rejected.'
      await load(current.id, true)
      return false
    } finally {
      sending.value = false
    }
  }

  async function forfeit(): Promise<boolean> {
    const current = duel.value
    if (!current || current.stage !== 'battle' || sending.value) return false
    sending.value = true
    error.value = ''
    try {
      duel.value = await request(
        '/api/slime-city/pvp/' + encodeURIComponent(current.id) + '/forfeit',
        { method: 'POST' },
      )
      return true
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : 'Cannot forfeit duel.'
      await load(current.id, true)
      return false
    } finally {
      sending.value = false
    }
  }

  function watchDuel(id: string) {
    stopWatching()
    polling = setInterval(() => {
      if (!sending.value && !loading.value) void load(id, true)
    }, 3500)
  }

  function stopWatching() {
    if (polling) clearInterval(polling)
    polling = null
  }

  function clearDuel() {
    stopWatching()
    duel.value = null
    error.value = ''
  }

  return {
    duel,
    loading,
    sending,
    error,
    isMyTurn,
    load,
    start,
    join,
    send,
    forfeit,
    watchDuel,
    stopWatching,
    clearDuel,
  }
})
