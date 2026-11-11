import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from './utils'
import { useFriendStore } from './friendStore'
import type { PvpGameSummary, PvpSnapshot } from '~/utils/slimeCity/pvp'
import type { TeamId } from '~/utils/slimeCity/prototypes'

export type PvpInput =
  | { t: 'play'; card: string; lane: number; choice?: 1 }
  | { t: 'power'; lane: number; team?: TeamId }
  | { t: 'pass' | 'strike' | 'end' }

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

  async function load(
    id: string,
    quiet = false,
    recoverRejectedMove = false,
  ): Promise<void> {
    if (sending.value && !recoverRejectedMove) return
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

  async function start(
    team: TeamId,
    options: { friendId?: number; isPublic?: boolean } = {},
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
