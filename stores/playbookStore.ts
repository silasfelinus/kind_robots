import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '~/stores/utils'
import type { SceneKind } from '~/utils/ecotone/content'
import { ALL_CARDS } from '~/utils/ecotone/engine'
import { playbookCardNode } from '~/utils/playbook/ecotone'
import {
  PLAYBOOK_GAMES,
  buildPlaybook,
  sanitizePlaybookEdit,
  type PlaybookGame,
} from '~/utils/playbook/games'
import { applyTextEditToNode } from '~/utils/playbook/textOverlay'
import type { NodeKind, PlaybookNode } from '~/utils/playbook/types'
import {
  applyCardEdit,
  blankBeatCard,
  isEmptyEdit,
  isNewBeatKey,
  makeNewBeatKey,
  type CardEdit,
} from '~/utils/playbook/edits'
import {
  PLAYBOOK_ART_LANES,
  playbookArtRequest,
  type PlaybookArtShape,
} from '~/utils/playbook/artLanes'
import { resolveArtImageSource } from '~/utils/artImageSource'

// Playbook Manager (conductor weird-humboldt t-033, t-036). The authored
// playbook for the chosen game is built in the browser from that game's
// source; edits and notes come from the admin API and are overlaid here.

export type PlaybookEditRow = {
  nodeKey: string
  content: CardEdit
  live: boolean
  updatedAt: string
}

export type PlaybookNoteKind = 'comment' | 'flag' | 'image' | 'art-request'

export type PlaybookNoteRow = {
  id: number
  nodeKey: string
  kind: PlaybookNoteKind
  body: string
  choiceId: string | null
  artJobId: number | null
  artImageId: number | null
  authorId: number
  resolved: boolean
  createdAt: string
}

export type PlaybookStatus =
  'all' | 'needs-art' | 'notes' | 'flagged' | 'edited' | 'requested'

export type PlaybookSort = 'story' | 'day' | 'kind' | 'companion' | 'title'

export const KIND_ORDER: NodeKind[] = [
  'opening',
  'spine',
  'fork',
  'encounter',
  'crossroads',
  'boss',
  'quest',
  'follower',
  'thread',
  'ending',
]

export const KIND_NAMES: Record<NodeKind, string> = {
  opening: 'Opening',
  spine: 'Story spine',
  fork: 'Draw',
  encounter: 'Encounter',
  crossroads: 'Crossroads',
  boss: 'Boss',
  quest: 'Quest',
  follower: 'Follower line',
  thread: 'Quest line',
  ending: 'Ending',
}

export const usePlaybookStore = defineStore('playbook', () => {
  const game = ref<PlaybookGame>('ecotone')
  const authored = computed(() => buildPlaybook(game.value))
  const games = PLAYBOOK_GAMES.map(({ id, title, cover }) => ({
    id,
    title,
    cover,
  }))
  const cover = computed(
    () => PLAYBOOK_GAMES.find((g) => g.id === game.value)?.cover ?? '',
  )
  const edits = ref<Record<string, PlaybookEditRow>>({})
  /** The authored playbook plus the Studio's own "+ New beat" rows (Ecotone). */
  const playbook = computed(() => {
    const base = authored.value
    if (game.value !== 'ecotone') return base
    const keys = Object.keys(edits.value).filter(isNewBeatKey)
    if (!keys.length) return base
    const nodes = { ...base.nodes }
    for (const key of keys) {
      const content = edits.value[key]!.content
      const blank = blankBeatCard(key, content)
      if (!blank) continue
      nodes[key] = {
        ...playbookCardNode(applyCardEdit(blank, content)),
        editable: true,
      }
    }
    return {
      ...base,
      nodes,
      order: [...base.order, ...keys],
      sections: [
        ...base.sections,
        {
          title: 'Studio beats',
          blurb:
            'New beats written here. A beat is dealt in play once it has a title, text and a choice, and is live.',
          keys,
        },
      ],
    }
  })
  const notes = ref<PlaybookNoteRow[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const saving = ref(false)
  const message = ref('')
  const failed = ref(false)

  const route = ref<string>('all')
  /** A Collection in the Studio rail: one of the playbook's sections. */
  const section = ref<string | null>(null)
  const kinds = ref<NodeKind[]>([])
  const day = ref<number | null>(null)
  const companion = ref<string | null>(null)
  const lens = ref<string | null>(null)
  const status = ref<PlaybookStatus>('all')
  const search = ref('')
  const sort = ref<PlaybookSort>('story')
  const view = ref<'chain' | 'list'>('list')
  const selectedKey = ref<string>('event')
  const jobs = ref<
    Record<number, { status: string; artImageId: number | null }>
  >({})
  const previews = ref<Record<number, string>>({})

  function say(text: string, error = false) {
    message.value = text
    failed.value = error
  }

  const openNotes = computed(() => notes.value.filter((n) => !n.resolved))

  function notesFor(key: string) {
    return notes.value.filter((note) => note.nodeKey === key)
  }

  function kindLabel(kind: NodeKind): string {
    return playbook.value.kindLabels[kind] ?? KIND_NAMES[kind]
  }

  /** The node as it reads with its saved overlay applied. */
  function nodeFor(key: string): PlaybookNode | null {
    const base = playbook.value.nodes[key]
    if (!base) return null
    const edit = edits.value[key]
    if (!edit || !base.editable) return base
    if (isNewBeatKey(key)) return base
    if (game.value !== 'ecotone') return applyTextEditToNode(base, edit.content)
    const card = ALL_CARDS.find((c) => c.id === key)
    if (!card) return base
    const edited = playbookCardNode(applyCardEdit(card, edit.content))
    return {
      ...edited,
      placements: base.placements,
      choices: edited.choices.map((choice) => ({
        ...choice,
        leadsTo:
          base.choices.find((c) => c.id === choice.id)?.leadsTo ??
          base.choices[0]?.leadsTo,
      })),
    }
  }

  function flags(key: string) {
    const list = notesFor(key).filter((n) => !n.resolved)
    const node = playbook.value.nodes[key]
    return {
      notes: list.filter((n) => n.kind === 'comment').length,
      flagged: list.some((n) => n.kind === 'flag'),
      requested: list.some((n) => n.kind === 'art-request'),
      submitted: list.some((n) => n.kind === 'image'),
      edited: Boolean(edits.value[key]),
      live: Boolean(edits.value[key]?.live),
      needsArt: Boolean(node?.needsArt),
    }
  }

  const days = computed(() =>
    [
      ...new Set(
        Object.values(playbook.value.nodes).flatMap((n) =>
          n.placements.map((p) => p.day),
        ),
      ),
    ].sort((a, b) => a - b),
  )

  function matches(key: string): boolean {
    const node = nodeFor(key)
    if (!node) return false
    if (
      section.value !== null &&
      !playbook.value.sections
        .find((s) => s.title === section.value)
        ?.keys.includes(key)
    )
      return false
    if (
      route.value !== 'all' &&
      node.placements.length &&
      !node.placements.some((p) => p.route === route.value)
    )
      return false
    if (kinds.value.length && !kinds.value.includes(node.kind)) return false
    if (
      day.value !== null &&
      !node.placements.some(
        (p) =>
          p.day === day.value &&
          (route.value === 'all' || p.route === route.value),
      )
    )
      return false
    if (companion.value && !node.companions.includes(companion.value))
      return false
    if (lens.value && !node.lenses.includes(lens.value)) return false
    const f = flags(key)
    if (status.value === 'needs-art' && !f.needsArt) return false
    if (status.value === 'notes' && !f.notes) return false
    if (status.value === 'flagged' && !f.flagged) return false
    if (status.value === 'edited' && !f.edited) return false
    if (status.value === 'requested' && !f.requested) return false
    const q = search.value.trim().toLowerCase()
    if (q) {
      const haystack = [
        node.key,
        node.title,
        node.place,
        ...node.body,
        ...node.choices.map((c) => c.label),
        ...node.variations.map((v) => v.text),
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  }

  const filtersActive = computed(
    () =>
      kinds.value.length > 0 ||
      section.value !== null ||
      day.value !== null ||
      companion.value !== null ||
      lens.value !== null ||
      status.value !== 'all' ||
      search.value.trim() !== '',
  )

  const listKeys = computed(() => {
    const keys = playbook.value.order.filter(matches)
    const firstDay = (key: string) =>
      Math.min(
        ...(playbook.value.nodes[key]?.placements.map((p) => p.day) ?? []),
        99,
      )
    const sorters: Record<PlaybookSort, (a: string, b: string) => number> = {
      story: () => 0,
      day: (a, b) => firstDay(a) - firstDay(b),
      kind: (a, b) =>
        KIND_ORDER.indexOf(playbook.value.nodes[a]?.kind ?? 'ending') -
        KIND_ORDER.indexOf(playbook.value.nodes[b]?.kind ?? 'ending'),
      companion: (a, b) =>
        (playbook.value.nodes[a]?.companions.length ?? 9) -
        (playbook.value.nodes[b]?.companions.length ?? 9),
      title: (a, b) =>
        (playbook.value.nodes[a]?.title ?? '').localeCompare(
          playbook.value.nodes[b]?.title ?? '',
        ),
    }
    return [...keys].sort(sorters[sort.value])
  })

  const routes = computed(() =>
    route.value === 'all'
      ? playbook.value.routes
      : playbook.value.routes.filter((r) => r.id === route.value),
  )

  const selected = computed(() => nodeFor(selectedKey.value))

  const counts = computed(() => {
    const all = Object.keys(playbook.value.nodes)
    return {
      nodes: all.length,
      needsArt: all.filter((k) => playbook.value.nodes[k]?.needsArt).length,
      edited: Object.keys(edits.value).length,
      live: Object.values(edits.value).filter((e) => e.live).length,
      open: openNotes.value.length,
      requests: openNotes.value.filter((n) => n.kind === 'art-request').length,
    }
  })

  function clearFilters() {
    kinds.value = []
    section.value = null
    day.value = null
    companion.value = null
    lens.value = null
    status.value = 'all'
    search.value = ''
  }

  async function load() {
    loading.value = true
    const response = await performFetch<{
      edits: PlaybookEditRow[]
      notes: PlaybookNoteRow[]
    }>(`/api/admin/playbook/${game.value}`)
    loading.value = false
    if (!response.success || !response.data) {
      say(response.message || 'Could not load the playbook notes.', true)
      return
    }
    edits.value = Object.fromEntries(
      response.data.edits.map((row) => [row.nodeKey, row]),
    )
    notes.value = response.data.notes
    loaded.value = true
  }

  function nodePath(key: string) {
    return `/api/admin/playbook/${game.value}/${encodeURIComponent(key)}`
  }

  async function saveEdit(key: string, raw: CardEdit, live: boolean) {
    const content = sanitizePlaybookEdit(game.value, raw)
    saving.value = true
    const response = await performFetch<PlaybookEditRow | null>(nodePath(key), {
      method: 'PUT',
      body: JSON.stringify({ content, live }),
    })
    saving.value = false
    if (!response.success) {
      say(response.message || 'Could not save the edit.', true)
      return false
    }
    const { [key]: _previous, ...rest } = edits.value
    edits.value =
      isEmptyEdit(content) || !response.data
        ? rest
        : { ...rest, [key]: response.data }
    say(response.message || 'Saved.')
    return true
  }

  /** Starts a "+ New beat" draft row and selects it. */
  async function newBeat(chapter = 1, scene: SceneKind = 'meadow') {
    const key = makeNewBeatKey()
    const ok = await saveEdit(
      key,
      {
        title: 'Untitled beat',
        body: ['Write the scene here.'],
        beat: { chapter, scene },
      },
      false,
    )
    if (ok) selectedKey.value = key
    return ok ? key : null
  }

  async function addNote(
    key: string,
    note: {
      kind: PlaybookNoteKind
      body: string
      choiceId?: string | null
      artJobId?: number | null
      artImageId?: number | null
    },
  ) {
    saving.value = true
    const response = await performFetch<PlaybookNoteRow>(
      `${nodePath(key)}/notes`,
      { method: 'POST', body: JSON.stringify(note) },
    )
    saving.value = false
    if (!response.success || !response.data) {
      say(response.message || 'Could not add the note.', true)
      return false
    }
    notes.value = [response.data, ...notes.value]
    say(response.message || 'Added.')
    return true
  }

  async function resolveNote(id: number, resolved: boolean) {
    const response = await performFetch<PlaybookNoteRow>(
      `/api/admin/playbook/notes/${id}`,
      { method: 'PATCH', body: JSON.stringify({ resolved }) },
    )
    if (!response.success || !response.data) {
      say(response.message || 'Could not update the note.', true)
      return
    }
    const row = response.data
    notes.value = notes.value.map((n) => (n.id === row.id ? row : n))
  }

  async function requestArt(
    key: string,
    options: {
      prompt: string
      laneKey: string
      shape: PlaybookArtShape
      choiceId?: string | null
    },
  ) {
    const lane =
      PLAYBOOK_ART_LANES.find((l) => l.key === options.laneKey) ??
      PLAYBOOK_ART_LANES.find((l) => l.key === playbook.value.artLanes[0])
    if (!lane || !options.prompt.trim()) return false
    saving.value = true
    const seed = Math.floor(Math.random() * 2_000_000_000)
    const response = await performFetch<{ jobId?: number }>(
      '/api/art/enqueue',
      {
        method: 'POST',
        body: JSON.stringify(
          playbookArtRequest(lane, options.prompt, options.shape, seed, {
            projectSlug: playbook.value.artProject,
            designer: playbook.value.title,
            negative: playbook.value.artNegative,
            style: playbook.value.artStyle,
          }),
        ),
      },
    )
    saving.value = false
    const jobId = Number(response.data?.jobId)
    if (!response.success || !Number.isInteger(jobId)) {
      say(response.message || 'The art queue refused the request.', true)
      return false
    }
    return addNote(key, {
      kind: 'art-request',
      body: `${lane.label} · ${options.shape}: ${options.prompt.trim()}`,
      choiceId: options.choiceId ?? null,
      artJobId: jobId,
    })
  }

  /** Polls the ArtJobs behind a beat's art requests. */
  async function refreshJobs(key: string) {
    const ids = notesFor(key).flatMap((n) => (n.artJobId ? [n.artJobId] : []))
    for (const id of ids) {
      const response = await performFetch<{
        job?: { status?: string; artImageId?: number | null }
      }>(`/api/art/queue/${id}`)
      const job = response.data?.job
      if (!response.success || !job) continue
      jobs.value = {
        ...jobs.value,
        [id]: { status: job.status ?? '?', artImageId: job.artImageId ?? null },
      }
      if (job.artImageId) void loadPreview(job.artImageId)
    }
  }

  /** Private renders need the admin's token, so previews load through the API. */
  async function loadPreview(imageId: number) {
    if (previews.value[imageId]) return
    const response = await performFetch<
      Parameters<typeof resolveArtImageSource>[0]
    >(`/api/art/image/${imageId}?includeImageData=true&showMature=true`)
    if (!response.success || !response.data) return
    const src = resolveArtImageSource(response.data).src
    if (src) previews.value = { ...previews.value, [imageId]: src }
  }

  /** Everything Silas changed, for an agent to fold back into the authored source. */
  function exportJson(): string {
    return JSON.stringify(
      {
        game: game.value,
        exportedAt: new Date().toISOString(),
        edits: Object.values(edits.value),
        openNotes: openNotes.value,
      },
      null,
      2,
    )
  }

  /** Open another game: filters and selection reset, its notes load. */
  async function setGame(next: PlaybookGame) {
    if (next === game.value && loaded.value) return
    game.value = next
    route.value = 'all'
    clearFilters()
    selectedKey.value = playbook.value.order[0] ?? ''
    edits.value = {}
    notes.value = []
    loaded.value = false
    await load()
  }

  return {
    game,
    games,
    cover,
    playbook,
    kindLabel,
    setGame,
    edits,
    notes,
    loading,
    loaded,
    saving,
    message,
    failed,
    route,
    section,
    kinds,
    day,
    companion,
    lens,
    status,
    search,
    sort,
    view,
    selectedKey,
    selected,
    jobs,
    previews,
    days,
    routes,
    listKeys,
    counts,
    filtersActive,
    openNotes,
    notesFor,
    nodeFor,
    flags,
    matches,
    clearFilters,
    load,
    saveEdit,
    newBeat,
    addNote,
    resolveNote,
    requestArt,
    refreshJobs,
    loadPreview,
    exportJson,
  }
})
