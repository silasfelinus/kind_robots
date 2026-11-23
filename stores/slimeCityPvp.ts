import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from './utils'
import { useFriendStore } from './friendStore'
import {
  pvpRematch,
  pvpTally,
  type PvpGameSummary,
  type PvpSnapshot,
} from '~/utils/slimeCity/pvp'
import type { TeamId } from '~/utils/slimeCity/prototypes'
import {
  readTakebackPreference,
  writeTakebackPreference,
} from './helpers/slimeCityClashPreference'

export type PvpInput =
  | { t: 'play'; card: string; lane: number; choice?: 1 }
  | { t: 'power'; lane: number; team?: TeamId }
  | { t: 'activate'; uid: number }
  | { t: 'pass' | 'strike' | 'end' }
  | { t: 'undo' }

/** A player the VS hub can challenge or invite. */
export interface PvpPlayer {
  id: number
  username: string
  designerName?: string | null
  avatarImage?: string | null
  allowFriendRequests?: boolean
}

/** An open duel anyone can join, from the VS list. */
export interface PvpOpenDuel {
  id: string
  hostTeam: TeamId
  hostName: string
}

export const useSlimeCityPvpStore = defineStore('slimeCityPvp', () => {
  const duel = ref<PvpSnapshot | null>(null)
  /** The VS hub's list of this player's games against other players. */
  const games = ref<PvpGameSummary[]>([])
  const gamesLoaded = ref(false)
  const gamesError = ref('')
  /**
   * Silas, 2026-11-11 PT: "You should be able to challenge players on your
   * friends list. And they should get notified. That should be the assumed
   * method, with help to invite friend via email or username."
   */
  const friends = ref<PvpPlayer[]>([])
  const friendsLoaded = ref(false)
  const players = ref<PvpPlayer[]>([])
  /** Open duels other players listed for anyone to join. */
  const openDuels = ref<PvpOpenDuel[]>([])
  const searching = ref(false)
  const searchMessage = ref('')
  const loading = ref(false)
  const sending = ref(false)
  const error = ref('')
  /**
   * Silas, 2026-11-22 PT: "Our error messages during play ... pop up and then
   * disappear too quickly." A rejected move's message stays up for a few
   * seconds, and the reload that recovers the board no longer wipes it.
   */
  let errorTimer: ReturnType<typeof setTimeout> | null = null
  function showError(message: string, hold = 6000): void {
    error.value = message
    if (errorTimer) clearTimeout(errorTimer)
    errorTimer = setTimeout(() => {
      error.value = ''
      errorTimer = null
    }, hold)
  }
  /** The take-back allowance new duels start with (a game option at start). */
  const takebackChoice = ref(1)
  if (import.meta.client) takebackChoice.value = readTakebackPreference() ?? 1
  function setTakebackChoice(value: number): void {
    takebackChoice.value = value
    writeTakebackPreference(value)
  }
  function clearError(): void {
    if (errorTimer) clearTimeout(errorTimer)
    errorTimer = null
    error.value = ''
  }
  let polling: ReturnType<typeof setInterval> | null = null
  /** Bumped by every move, so a poll that started before one is discarded. */
  let sendCount = 0

  /** This player's record over the finished games in the VS list. */
  const tally = computed(() => pvpTally(games.value))
  const canRematch = computed(() => !!duel.value && !!pvpRematch(duel.value))

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

  async function load(
    id: string,
    quiet = false,
    recoverRejectedMove = false,
  ): Promise<void> {
    if (sending.value && !recoverRejectedMove) return
    if (!quiet) loading.value = true
    const sentBefore = sendCount
    try {
      const next = await request(
        '/api/slime-city/pvp/' + encodeURIComponent(id),
      )
      // Silas, 2026-11-22 PT: "Do we have to double click the strike button?"
      // A background poll that left before a move must never land after it
      // and roll the board back to the older revision.
      const current = duel.value
      if (
        quiet &&
        !recoverRejectedMove &&
        (sendCount !== sentBefore ||
          sending.value ||
          (current?.id === next.id && next.revision < current.revision))
      )
        return
      duel.value = next
      if (!quiet) clearError()
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

  async function start(
    team: TeamId,
    options: { friendId?: number; isPublic?: boolean; takebacks?: number } = {},
  ): Promise<PvpSnapshot | null> {
    sending.value = true
    error.value = ''
    try {
      const data = await request('/api/slime-city/pvp', {
        method: 'POST',
        body: JSON.stringify({
          team,
          ...(options.friendId ? { friendId: options.friendId } : {}),
          ...(options.isPublic ? { isPublic: true } : {}),
          takebacks: options.takebacks ?? takebackChoice.value,
        }),
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

  /** Challenge the same rival again with the same crew, privately. */
  async function rematch(): Promise<PvpSnapshot | null> {
    const next = duel.value ? pvpRematch(duel.value) : null
    if (!next || sending.value) return null
    stopWatching()
    return start(next.team, {
      friendId: next.friendId,
      ...(duel.value?.takebacks !== undefined
        ? { takebacks: duel.value.takebacks }
        : {}),
    })
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
    sendCount++
    sending.value = true
    clearError()
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
      showError(cause instanceof Error ? cause.message : 'Move rejected.')
      await load(current.id, true, true)
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
      await load(current.id, true, true)
      return false
    } finally {
      sending.value = false
    }
  }

  async function loadGames(): Promise<void> {
    try {
      const result = await performFetch<PvpGameSummary[]>(
        '/api/slime-city/pvp',
        {},
        1,
      )
      if (!result.success || !result.data)
        throw new Error(result.message || 'Cannot load your games.')
      games.value = result.data
      gamesError.value = ''
    } catch (cause) {
      gamesError.value =
        cause instanceof Error ? cause.message : 'Cannot load your games.'
    } finally {
      gamesLoaded.value = true
    }
  }

  async function loadOpen(): Promise<void> {
    const result = await performFetch<PvpOpenDuel[]>(
      '/api/slime-city/pvp/open',
      {},
      1,
    )
    if (result.success && Array.isArray(result.data))
      openDuels.value = result.data
  }

  /** Withdraw a waiting duel, or decline a friend's challenge. */
  async function cancel(id: string): Promise<boolean> {
    if (sending.value) return false
    sending.value = true
    error.value = ''
    try {
      const result = await performFetch<{ id: string }>(
        '/api/slime-city/pvp/' + encodeURIComponent(id) + '/cancel',
        { method: 'POST' },
        1,
      )
      if (!result.success)
        throw new Error(result.message || 'Cannot cancel this duel.')
      games.value = games.value.filter((game) => game.id !== id)
      if (duel.value?.id === id) clearDuel()
      return true
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : 'Cannot cancel this duel.'
      return false
    } finally {
      sending.value = false
    }
  }

  async function loadFriends(): Promise<void> {
    try {
      const result = await performFetch<PvpPlayer[]>(
        '/api/slime-city/pvp/friends',
        {},
        1,
      )
      if (result.success && Array.isArray(result.data))
        friends.value = result.data
    } finally {
      friendsLoaded.value = true
    }
  }

  /** Search the opt-in player directory by username. */
  async function findPlayers(query: string): Promise<void> {
    const text = query.trim().replace(/^@/, '')
    players.value = []
    searchMessage.value = ''
    if (text.length < 2) {
      searchMessage.value = 'Type at least two letters of a username.'
      return
    }
    searching.value = true
    try {
      const result = await performFetch<PvpPlayer[]>(
        '/api/users/directory?search=' + encodeURIComponent(text),
        {},
        1,
      )
      const known = new Set(friends.value.map((friend) => friend.id))
      players.value = (
        result.success && Array.isArray(result.data) ? result.data : []
      )
        .filter((player) => !known.has(player.id))
        .slice(0, 6)
      if (!players.value.length)
        searchMessage.value =
          'No listed player by that name. Invite them by email instead.'
    } catch {
      searchMessage.value = 'Player search is unavailable right now.'
    } finally {
      searching.value = false
    }
  }

  /** Send a friend request; once accepted, they appear on the friends list. */
  async function addFriend(userId: number): Promise<boolean> {
    const relations = useFriendStore()
    await relations.load()
    await relations.sendFriendRequest(userId)
    const state = relations.relationship(userId)
    if (state === 'friend') await loadFriends()
    return state === 'friend' || state === 'outgoing'
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
    games,
    tally,
    gamesLoaded,
    gamesError,
    loadGames,
    friends,
    friendsLoaded,
    loadFriends,
    players,
    searching,
    searchMessage,
    findPlayers,
    addFriend,
    openDuels,
    loadOpen,
    cancel,
    loading,
    sending,
    error,
    showError,
    clearError,
    takebackChoice,
    setTakebackChoice,
    isMyTurn,
    load,
    start,
    rematch,
    canRematch,
    join,
    send,
    forfeit,
    watchDuel,
    stopWatching,
    clearDuel,
  }
})
