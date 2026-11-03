import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import { useServerStore } from '@/stores/serverStore'
import type {
  BrainstormGenerateData,
  BrainstormGeneratePayload,
} from '@/types/brainstorm'
import {
  buildCoachRequest,
  fullLineText,
  pickCheer,
  sortLines,
  type BrainstormLineReactionWithFlag,
  type BrainstormLineSort,
  type BrainstormReactionCounts,
  type BrainstormRiffFlavor,
} from '@/utils/brainstormRiffs'

export type BrainstormArtStatus = 'ready' | 'painting' | 'failed' | 'none'

export type BrainstormRiffCard = {
  id: number
  flavor: BrainstormRiffFlavor
  title: string
  stem: string | null
  vibe: string | null
  starterKey: string | null
  crossoverIds: number[]
  isPublic: boolean
  isOpen: boolean
  isMine: boolean
  canModerate: boolean
  lastLineAt: string | null
  lineCount: number
  points: number
  heat: number
  bestLine: { id: number; text: string; points: number } | null
  coverUrl: string | null
}

export type BrainstormRiffLine = {
  id: number
  createdAt: string
  authorName: string
  text: string
  aiSpark: string | null
  counts: BrainstormReactionCounts
  points: number
  myReaction: BrainstormLineReactionWithFlag | null
  artStatus: BrainstormArtStatus
  artUrl: string | null
  hidden: boolean
  isMine: boolean
  canDelete: boolean
}

export type BrainstormRiffDetail = {
  riff: Omit<
    BrainstormRiffCard,
    'lineCount' | 'points' | 'heat' | 'bestLine' | 'coverUrl'
  > & {
    crossovers: Array<{ id: number; title: string; stem: string | null }>
  }
  lines: BrainstormRiffLine[]
}

export type BrainstormSpark = { id: string; title: string; text: string }

export type BrainstormNewRiff = {
  flavor: BrainstormRiffFlavor
  title: string
  stem: string
  vibe: string
  crossoverIds: number[]
}

const TABLE_STORAGE_KEY = 'kr-brainstorm-table'
const POLL_MS = 6000
const PAINTING_POLL_MS = 4000
const SPARK_TIMEOUT_MS = 90_000

function readTable(): { players: string[]; on: boolean } {
  try {
    const raw = localStorage.getItem(TABLE_STORAGE_KEY)
    if (!raw) return { players: [], on: false }
    const parsed = JSON.parse(raw) as { players?: unknown; on?: unknown }
    const players = Array.isArray(parsed.players)
      ? parsed.players
          .filter((name): name is string => typeof name === 'string')
          .map((name) => name.trim().slice(0, 60))
          .filter(Boolean)
          .slice(0, 8)
      : []
    return { players, on: parsed.on === true && players.length > 0 }
  } catch {
    return { players: [], on: false }
  }
}

export const useBrainstormRiffStore = defineStore('brainstormRiffStore', () => {
  const riffs = ref<BrainstormRiffCard[]>([])
  const riffsState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const riffsError = ref('')

  const activeRiffId = ref<number | null>(null)
  const detail = ref<BrainstormRiffDetail | null>(null)
  const detailState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const detailError = ref('')
  const sort = ref<BrainstormLineSort>('hot')

  const draft = ref('')
  const draftSpark = ref<BrainstormSpark | null>(null)
  const posting = ref(false)
  const postError = ref('')
  const cheer = ref('')
  const cheerKey = ref(0)

  const sparks = ref<BrainstormSpark[]>([])
  const sparkState = ref<'idle' | 'thinking' | 'error'>('idle')
  const sparkError = ref('')
  const sparkDealKey = ref('sparks-0')

  const tablePlayers = ref<string[]>([])
  const tableMode = ref(false)
  const tableTurn = ref(0)

  const creating = ref(false)
  const createError = ref('')

  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let tableLoaded = false

  const sortedLines = computed(() =>
    detail.value ? sortLines(detail.value.lines, sort.value) : [],
  )
  const activePlayer = computed(() =>
    tableMode.value && tablePlayers.value.length
      ? tablePlayers.value[tableTurn.value % tablePlayers.value.length]
      : null,
  )
  const personaRiffs = computed(() =>
    riffs.value.filter((riff) => riff.flavor === 'persona'),
  )
  const anyPainting = computed(() =>
    Boolean(detail.value?.lines.some((line) => line.artStatus === 'painting')),
  )

  function loadTable() {
    if (tableLoaded) return
    tableLoaded = true
    const saved = readTable()
    tablePlayers.value = saved.players
    tableMode.value = saved.on
  }

  function saveTable() {
    try {
      localStorage.setItem(
        TABLE_STORAGE_KEY,
        JSON.stringify({ players: tablePlayers.value, on: tableMode.value }),
      )
    } catch {
      return
    }
  }

  function setTablePlayers(names: string[]) {
    tablePlayers.value = names
      .map((name) => name.trim().slice(0, 60))
      .filter(Boolean)
      .slice(0, 8)
    tableTurn.value = 0
    tableMode.value = tablePlayers.value.length > 0
    saveTable()
  }

  function setTableMode(on: boolean) {
    tableMode.value = on && tablePlayers.value.length > 0
    saveTable()
  }

  function passTurn() {
    if (tablePlayers.value.length) {
      tableTurn.value = (tableTurn.value + 1) % tablePlayers.value.length
    }
  }

  async function ensurePlayer(): Promise<string | null> {
    const userStore = useUserStore()
    if (userStore.isLoggedIn) return null
    const promoted = await userStore.ensureRealUser()
    return promoted.success
      ? null
      : promoted.message || 'Sign in to play Brainstorm.'
  }

  async function fetchRiffs() {
    loadTable()
    riffsState.value = riffs.value.length ? 'ready' : 'loading'
    const result = await performFetch<{ riffs: BrainstormRiffCard[] }>(
      '/api/brainstorm/riffs',
    )
    if (!result.success || !result.data) {
      riffsError.value = result.message || 'Could not load the riff board.'
      riffsState.value = 'error'
      return
    }
    riffs.value = result.data.riffs
    riffsError.value = ''
    riffsState.value = 'ready'
  }

  function stopPolling() {
    if (pollTimer) clearTimeout(pollTimer)
    pollTimer = null
  }

  function schedulePoll() {
    stopPolling()
    if (!activeRiffId.value || typeof window === 'undefined') return
    pollTimer = setTimeout(
      async () => {
        if (document.visibilityState === 'visible') await refreshDetail()
        schedulePoll()
      },
      anyPainting.value ? PAINTING_POLL_MS : POLL_MS,
    )
  }

  async function refreshDetail() {
    const riffId = activeRiffId.value
    if (!riffId) return
    const result = await performFetch<BrainstormRiffDetail>(
      `/api/brainstorm/riffs/${riffId}`,
    )
    if (riffId !== activeRiffId.value) return
    if (!result.success || !result.data) {
      if (!detail.value) {
        detailError.value = result.message || 'Could not load that riff.'
        detailState.value = 'error'
      }
      return
    }
    detail.value = result.data
    detailError.value = ''
    detailState.value = 'ready'
  }

  async function openRiff(riffId: number) {
    loadTable()
    if (activeRiffId.value !== riffId) {
      detail.value = null
      draft.value = ''
      draftSpark.value = null
      sparks.value = []
      sparkState.value = 'idle'
      postError.value = ''
    }
    activeRiffId.value = riffId
    detailState.value = 'loading'
    await refreshDetail()
    schedulePoll()
    void paintMissingForAdmin()
  }

  function closeRiff() {
    stopPolling()
    activeRiffId.value = null
    detail.value = null
    detailState.value = 'idle'
    sparks.value = []
    void fetchRiffs()
  }

  async function createRiff(input: BrainstormNewRiff): Promise<number | null> {
    createError.value = ''
    const blocked = await ensurePlayer()
    if (blocked) {
      createError.value = blocked
      return null
    }
    creating.value = true
    try {
      const result = await performFetch<{ riffId: number }>(
        '/api/brainstorm/riffs',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      )
      if (!result.success || !result.data) {
        createError.value = result.message || 'Could not start that riff.'
        return null
      }
      await fetchRiffs()
      return result.data.riffId
    } finally {
      creating.value = false
    }
  }

  function pickSpark(spark: BrainstormSpark) {
    draftSpark.value = spark
  }

  function clearSpark() {
    draftSpark.value = null
  }

  async function submitLine(): Promise<boolean> {
    const riffId = activeRiffId.value
    const text = draft.value.trim()
    if (!riffId || !text || posting.value) return false
    postError.value = ''
    const blocked = await ensurePlayer()
    if (blocked) {
      postError.value = blocked
      return false
    }
    posting.value = true
    try {
      const result = await performFetch<{ lineId: number }>(
        `/api/brainstorm/riffs/${riffId}/lines`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            authorName: activePlayer.value ?? undefined,
            aiSpark: draftSpark.value?.title ?? undefined,
          }),
        },
      )
      if (!result.success) {
        postError.value = result.message || 'Could not add that line.'
        return false
      }
      const usedSparkId = draftSpark.value?.id
      draft.value = ''
      draftSpark.value = null
      sparks.value = sparks.value.filter((spark) => spark.id !== usedSparkId)
      cheer.value = pickCheer(Date.now())
      cheerKey.value += 1
      passTurn()
      if (sort.value === 'top') sort.value = 'new'
      await refreshDetail()
      schedulePoll()
      return true
    } finally {
      posting.value = false
    }
  }

  async function react(lineId: number, type: BrainstormLineReactionWithFlag) {
    const blocked = await ensurePlayer()
    if (blocked) {
      postError.value = blocked
      return
    }
    const line = detail.value?.lines.find((entry) => entry.id === lineId)
    if (!line) return
    const previous = line.myReaction
    const next = previous === type ? null : type
    if (previous) line.counts[previous] = Math.max(0, line.counts[previous] - 1)
    if (next) line.counts[next] += 1
    line.myReaction = next

    const result = await performFetch<{
      myReaction: BrainstormLineReactionWithFlag | null
    }>(`/api/brainstorm/lines/${lineId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    if (!result.success) {
      postError.value = result.message || 'Could not save that reaction.'
    }
    await refreshDetail()
  }

  async function deleteLine(lineId: number) {
    const result = await performFetch(`/api/brainstorm/lines/${lineId}`, {
      method: 'DELETE',
    })
    if (!result.success) {
      postError.value = result.message || 'Could not remove that line.'
      return
    }
    await refreshDetail()
  }

  async function paintLine(lineId: number) {
    const blocked = await ensurePlayer()
    if (blocked) {
      postError.value = blocked
      return
    }
    const line = detail.value?.lines.find((entry) => entry.id === lineId)
    if (line) line.artStatus = 'painting'
    const result = await performFetch(`/api/brainstorm/lines/${lineId}/art`, {
      method: 'POST',
    })
    if (!result.success) {
      if (line) line.artStatus = 'failed'
      postError.value = result.message || 'Could not queue art for that line.'
      return
    }
    await refreshDetail()
    schedulePoll()
  }

  async function paintMissingForAdmin() {
    const userStore = useUserStore()
    if (!userStore.isAdmin || !detail.value) return
    const missing = detail.value.lines
      .filter((line) => line.artStatus === 'none')
      .slice(0, 3)
    for (const line of missing) await paintLine(line.id)
  }

  async function activeServer() {
    const serverStore = useServerStore()
    await serverStore.initialize({ fetchRemote: true })
    const server = serverStore.activeTextServer
    if (!server) return null
    return {
      id: server.id ?? null,
      serverType: server.serverType ?? null,
      baseUrl: server.baseUrl ?? null,
      endpointPath: server.endpointPath ?? null,
      model: server.model ?? null,
    }
  }

  async function requestSparks() {
    if (!detail.value || sparkState.value === 'thinking') return
    sparkError.value = ''
    const blocked = await ensurePlayer()
    if (blocked) {
      sparkError.value = blocked
      sparkState.value = 'error'
      return
    }
    sparkState.value = 'thinking'
    try {
      const server = await activeServer()
      if (!server) {
        sparkError.value = 'No text server is free to coach right now.'
        sparkState.value = 'error'
        return
      }
      const { riff, lines } = detail.value
      const visible = lines.filter((line) => !line.hidden)
      const favorites = sortLines(visible, 'top')
        .filter((line) => line.points > 0)
        .map((line) => fullLineText(riff, line.text))
      const recent = sortLines(visible, 'new').map((line) =>
        fullLineText(riff, line.text),
      )
      const coach = buildCoachRequest({ riff, favorites, recent })
      const payload: BrainstormGeneratePayload = {
        premise: coach.premise,
        constraints: coach.constraints,
        count: coach.count,
        examples: [],
        mode: 'freeform',
        outputDomain: 'ideas',
        batchShape: 'focused',
        returnTypes: [],
        source: null,
        server,
      }
      const result = await performFetch<BrainstormGenerateData>(
        '/api/brainstorm/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        1,
        SPARK_TIMEOUT_MS,
      )
      if (!result.success || !result.data?.candidates?.length) {
        sparkError.value = result.message || 'The coach blanked. Try again.'
        sparkState.value = 'error'
        return
      }
      const stamp = Date.now()
      sparks.value = result.data.candidates.map((candidate, index) => ({
        id: `spark-${stamp}-${index}`,
        title: (candidate.title || 'An angle').slice(0, 60),
        text: candidate.text.slice(0, 240),
      }))
      sparkDealKey.value = `sparks-${stamp}`
      sparkState.value = 'idle'
    } catch (error) {
      sparkError.value =
        error instanceof Error ? error.message : 'The coach blanked. Try again.'
      sparkState.value = 'error'
    }
  }

  return {
    riffs,
    riffsState,
    riffsError,
    personaRiffs,
    activeRiffId,
    detail,
    detailState,
    detailError,
    sort,
    sortedLines,
    draft,
    draftSpark,
    posting,
    postError,
    cheer,
    cheerKey,
    sparks,
    sparkState,
    sparkError,
    sparkDealKey,
    tablePlayers,
    tableMode,
    activePlayer,
    creating,
    createError,
    anyPainting,
    fetchRiffs,
    openRiff,
    closeRiff,
    refreshDetail,
    stopPolling,
    createRiff,
    pickSpark,
    clearSpark,
    submitLine,
    react,
    deleteLine,
    paintLine,
    requestSparks,
    setTablePlayers,
    setTableMode,
    passTurn,
  }
})
