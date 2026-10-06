// /stores/comicStudioStore.ts
// Comic Studio (comic-creator/t-013, t-014): owns every API call, the poll for
// in-flight renders, optimistic verdicts, and the versioned page-layout saves.
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '@/stores/utils'
import { useResourceStore } from '@/stores/resourceStore'
import type {
  ComicAttemptDto,
  ComicCritiqueDto,
  ComicEntityDto,
  ComicIssueDto,
  ComicRenderOutcome,
  ComicSeriesDto,
  ComicSeriesSummary,
  ComicSlotDto,
  ComicSnapshot,
} from '~/types/comicStudio'
import {
  comicPrimaryLane,
  orderComicLanes,
  type ComicLane,
} from '~/utils/comicLanes'
import {
  CHECKPOINT_FAMILY_LABELS,
  detectCheckpointFamily,
} from '~/utils/artGeneratorPresets'
import {
  addComicPage,
  addComicPanel,
  mergeComicCells,
  moveComicPage,
  moveComicPanel,
  removeComicPage,
  removeComicPanel,
  setComicPageLayout,
  splitComicCell,
  updateComicPanel,
  type ComicIssueLayout,
  type ComicLettering,
} from '~/utils/comicLayouts'
import {
  comicNotesChangedEnough,
  type ComicEditorTarget,
} from '~/utils/comicEditor'
import {
  applyComicVerdict,
  comicLaneHero,
  comicSlotCover,
  isComicActiveStatus,
  type ComicVerdict,
} from '~/utils/comicStudio'
import { buildComicCastSheets } from '~/utils/comicCast'

export type ComicStudioMode = 'cast' | 'board' | 'composer' | 'notes'
export type ComicDragPayload =
  | { type: 'attempt'; id: number }
  | { type: 'panel'; id: string }
  | { type: 'page'; id: string }
  | { type: 'slot'; id: number }

const LAST_SERIES_KEY = 'comic-studio:last-series'
const AUTO_EDITOR_KEY = 'comic-studio:auto-editor'
const EDITOR_TIMEOUT_MS = 200_000
const POLL_MS = 8000
const MAX_POLL_FAILURES = 5
const LAYOUT_SAVE_DELAY_MS = 400
const UNDO_DEPTH = 50

let pollTimer: ReturnType<typeof setTimeout> | null = null
let layoutTimer: ReturnType<typeof setTimeout> | null = null

function jsonBody(body: unknown): RequestInit['body'] {
  return JSON.stringify(body)
}

export const useComicStudioStore = defineStore('comicStudioStore', () => {
  const seriesList = ref<ComicSeriesSummary[]>([])
  const series = ref<ComicSeriesDto | null>(null)
  const entities = ref<ComicEntityDto[]>([])
  const slots = ref<ComicSlotDto[]>([])
  const attempts = ref<ComicAttemptDto[]>([])
  const issues = ref<ComicIssueDto[]>([])
  const syncedAt = ref<string | null>(null)

  const mode = ref<ComicStudioMode>('cast')
  const selectedEntityId = ref<number | null>(null)
  const selectedSlotId = ref<number | null>(null)
  const selectedIssueId = ref<number | null>(null)
  const selectedPageId = ref<string | null>(null)
  const selectedPanelId = ref<string | null>(null)
  const lightboxAttemptId = ref<number | null>(null)
  const dragPayload = ref<ComicDragPayload | null>(null)

  const loading = ref(false)
  const saving = ref(false)
  const renderingSlotIds = ref<number[]>([])
  const layoutSaveState = ref<'idle' | 'pending' | 'saving' | 'error'>('idle')
  const undoStack = ref<Record<number, ComicIssueLayout[]>>({})
  const pollFailures = ref(0)
  const pollPaused = ref(false)
  const error = ref<string | null>(null)
  const message = ref<string | null>(null)
  const critiques = ref<ComicCritiqueDto[]>([])
  const editorBusy = ref<string | null>(null)
  const editorError = ref<string | null>(null)
  const autoEditor = ref(true)
  let pollEpoch = 0
  let pendingLayoutIssueId: number | null = null

  const lanes = computed<ComicLane[]>(() => series.value?.lanes ?? [])
  const activeLanes = computed(() =>
    orderComicLanes(lanes.value.filter((lane) => lane.active)),
  )
  const primaryLane = computed(() => comicPrimaryLane(lanes.value))
  const checkpointOptions = computed(() =>
    useResourceStore()
      .visibleCheckpoints.filter((resource) => resource.localPath)
      .map((resource) => {
        const family = detectCheckpointFamily(resource)
        return {
          path: String(resource.localPath),
          label:
            resource.customLabel || resource.name || String(resource.localPath),
          family,
          familyLabel: CHECKPOINT_FAMILY_LABELS[family],
        }
      })
      .filter((option) =>
        ['sdxl', 'pony', 'illustrious'].includes(option.family),
      )
      .sort((a, b) => a.path.localeCompare(b.path)),
  )
  const attemptsBySlot = computed(() => {
    const map = new Map<number, ComicAttemptDto[]>()
    for (const attempt of attempts.value) {
      const list = map.get(attempt.slotId) ?? []
      list.push(attempt)
      map.set(attempt.slotId, list)
    }
    return map
  })
  const attemptById = computed(
    () => new Map(attempts.value.map((attempt) => [attempt.id, attempt])),
  )
  const castSheets = computed(() =>
    buildComicCastSheets(slots.value, attempts.value),
  )
  const subjectSlots = computed(() =>
    slots.value.filter((slot) => slot.kind !== 'panel'),
  )
  const panelSlots = computed(() =>
    slots.value.filter((slot) => slot.kind === 'panel'),
  )
  const slotsByEntity = computed(() => {
    const map = new Map<number | null, ComicSlotDto[]>()
    for (const slot of subjectSlots.value) {
      const list = map.get(slot.entityId) ?? []
      list.push(slot)
      map.set(slot.entityId, list)
    }
    return map
  })
  const selectedSlot = computed(
    () => slots.value.find((slot) => slot.id === selectedSlotId.value) ?? null,
  )
  const selectedEntity = computed(
    () =>
      entities.value.find((entity) => entity.id === selectedEntityId.value) ??
      null,
  )
  const selectedIssue = computed(
    () =>
      issues.value.find((issue) => issue.id === selectedIssueId.value) ??
      issues.value[0] ??
      null,
  )
  const selectedPage = computed(() => {
    const issue = selectedIssue.value
    if (!issue) return null
    return (
      issue.layout.pages.find((page) => page.id === selectedPageId.value) ??
      issue.layout.pages[0] ??
      null
    )
  })
  const selectedPanel = computed(
    () =>
      selectedPage.value?.panels.find(
        (panel) => panel.id === selectedPanelId.value,
      ) ?? null,
  )
  const activeCount = computed(
    () =>
      attempts.value.filter((attempt) => isComicActiveStatus(attempt.status))
        .length,
  )
  const artShelf = computed(() => {
    const rank = (verdict: string) =>
      verdict === 'selected' ? 0 : verdict === 'liked' ? 1 : 2
    return attempts.value
      .filter((attempt) => attempt.artImageId && attempt.verdict !== 'rejected')
      .sort((a, b) => rank(a.verdict) - rank(b.verdict) || b.id - a.id)
  })

  function attemptsFor(slotId: number): ComicAttemptDto[] {
    return attemptsBySlot.value.get(slotId) ?? []
  }
  function laneHero(slotId: number, laneKey: string): ComicAttemptDto | null {
    return comicLaneHero(attemptsFor(slotId), laneKey)
  }
  function slotCover(slotId: number): ComicAttemptDto | null {
    return comicSlotCover(attemptsFor(slotId), primaryLane.value?.key)
  }
  function slotById(slotId: number | null | undefined): ComicSlotDto | null {
    return slotId
      ? (slots.value.find((slot) => slot.id === slotId) ?? null)
      : null
  }
  function attemptFor(id: number | null | undefined): ComicAttemptDto | null {
    return id ? (attemptById.value.get(id) ?? null) : null
  }
  function panelArt(panel: {
    slotId: number | null
    artAttemptId?: number | null
  }): ComicAttemptDto | null {
    return (
      attemptFor(panel.artAttemptId) ??
      (panel.slotId ? slotCover(panel.slotId) : null)
    )
  }

  async function loadCheckpointOptions() {
    await useResourceStore().loadStore()
  }

  function setMessage(text: string | null) {
    message.value = text
    error.value = null
  }
  function setError(text: string | null) {
    error.value = text
  }

  function mergeAttempts(
    incoming: ComicAttemptDto[],
    replaceSlotIds: number[] = [],
  ) {
    const replace = new Set(replaceSlotIds)
    const byId = new Map(
      attempts.value
        .filter((attempt) => !replace.has(attempt.slotId))
        .map((attempt) => [attempt.id, attempt]),
    )
    for (const attempt of incoming) byId.set(attempt.id, attempt)
    attempts.value = [...byId.values()].sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id - a.id,
    )
  }

  function applySnapshot(snapshot: ComicSnapshot) {
    series.value = snapshot.series
    entities.value = snapshot.entities
    slots.value = snapshot.slots
    attempts.value = snapshot.attempts
    issues.value = snapshot.issues
    syncedAt.value = snapshot.syncedAt
    if (!issues.value.some((issue) => issue.id === selectedIssueId.value)) {
      selectedIssueId.value = issues.value[0]?.id ?? null
    }
    if (
      selectedSlotId.value &&
      !slots.value.some((slot) => slot.id === selectedSlotId.value)
    ) {
      selectedSlotId.value = null
    }
  }

  function rememberSeries(id: number) {
    try {
      localStorage.setItem(LAST_SERIES_KEY, String(id))
    } catch {
      return
    }
  }

  function rememberedSeriesId(): number | null {
    try {
      const id = Number(localStorage.getItem(LAST_SERIES_KEY))
      return Number.isInteger(id) && id > 0 ? id : null
    } catch {
      return null
    }
  }

  async function fetchSeriesList() {
    const response = await performFetch<ComicSeriesSummary[]>('/api/comics')
    if (response.success && Array.isArray(response.data))
      seriesList.value = response.data
    else setError(response.message)
    return response.success
  }

  async function openSeries(id: number) {
    loading.value = true
    pollEpoch += 1
    try {
      const response = await performFetch<ComicSnapshot>(
        `/api/comics/${id}`,
        {},
        1,
        30000,
      )
      if (!response.success || !response.data) {
        setError(response.message)
        return false
      }
      applySnapshot(response.data)
      rememberSeries(id)
      void fetchCritiques()
      pollFailures.value = 0
      pollPaused.value = false
      schedulePoll()
      return true
    } finally {
      loading.value = false
    }
  }

  async function initialize(preferredSlugOrId?: string | null) {
    await fetchSeriesList()
    const wanted = preferredSlugOrId
      ? seriesList.value.find(
          (item) =>
            item.slug === preferredSlugOrId ||
            String(item.id) === preferredSlugOrId,
        )
      : null
    const remembered = seriesList.value.find(
      (item) => item.id === rememberedSeriesId(),
    )
    const target = wanted ?? remembered ?? seriesList.value[0]
    if (target) await openSeries(target.id)
  }

  async function refresh() {
    if (series.value) await openSeries(series.value.id)
  }

  async function createSeries(title: string) {
    saving.value = true
    try {
      const response = await performFetch<ComicSnapshot>('/api/comics', {
        method: 'POST',
        body: jsonBody({ title }),
      })
      if (!response.success || !response.data) {
        setError(response.message)
        return false
      }
      applySnapshot(response.data)
      rememberSeries(response.data.series.id)
      await fetchSeriesList()
      setMessage(response.message)
      return true
    } finally {
      saving.value = false
    }
  }

  async function saveSeries(patch: Partial<ComicSeriesDto>) {
    if (!series.value) return false
    const notesBefore = series.value.notes
    const response = await performFetch<ComicSeriesDto>(
      `/api/comics/${series.value.id}`,
      {
        method: 'PATCH',
        body: jsonBody(patch),
      },
    )
    if (!response.success || !response.data) {
      setError(response.message)
      return false
    }
    series.value = response.data
    if (
      'notes' in patch &&
      comicNotesChangedEnough(notesBefore, response.data.notes)
    ) {
      autoCritique('series', null)
    }
    return true
  }

  async function createEntity(name: string, kind = 'character') {
    if (!series.value) return null
    const response = await performFetch<ComicEntityDto>(
      '/api/comics/entities',
      {
        method: 'POST',
        body: jsonBody({ seriesId: series.value.id, name, kind }),
      },
    )
    if (!response.success || !response.data) {
      setError(response.message)
      return null
    }
    entities.value = [...entities.value, response.data]
    selectedEntityId.value = response.data.id
    return response.data
  }

  async function saveEntity(id: number, patch: Record<string, unknown>) {
    const notesBefore =
      entities.value.find((entity) => entity.id === id)?.notes ?? null
    const response = await performFetch<ComicEntityDto>(
      `/api/comics/entities/${id}`,
      {
        method: 'PATCH',
        body: jsonBody(patch),
      },
    )
    if (!response.success || !response.data) {
      setError(response.message)
      return false
    }
    const updated = response.data
    entities.value =
      patch.isArchived === true
        ? entities.value.filter((entity) => entity.id !== id)
        : entities.value.map((entity) => (entity.id === id ? updated : entity))
    if (patch.isArchived === true && selectedEntityId.value === id)
      selectedEntityId.value = null
    if ('notes' in patch && comicNotesChangedEnough(notesBefore, updated.notes))
      autoCritique('entity', id)
    return true
  }

  async function createSlot(input: {
    entityId?: number | null
    issueId?: number | null
    kind?: string
    title?: string
    aspect?: string
    copyFromSlotId?: number | null
  }) {
    if (!series.value) return null
    const response = await performFetch<ComicSlotDto>('/api/comics/slots', {
      method: 'POST',
      body: jsonBody({ seriesId: series.value.id, ...input }),
    })
    if (!response.success || !response.data) {
      setError(response.message)
      return null
    }
    slots.value = [...slots.value, response.data]
    return response.data
  }

  async function saveSlot(id: number, patch: Record<string, unknown>) {
    const response = await performFetch<ComicSlotDto>(
      `/api/comics/slots/${id}`,
      {
        method: 'PATCH',
        body: jsonBody(patch),
      },
    )
    if (!response.success || !response.data) {
      setError(response.message)
      return false
    }
    const updated = response.data
    if (patch.isArchived === true) {
      slots.value = slots.value.filter((slot) => slot.id !== id)
      if (selectedSlotId.value === id) selectedSlotId.value = null
    } else {
      slots.value = slots.value.map((slot) => (slot.id === id ? updated : slot))
    }
    return true
  }

  async function renderSlot(
    slotId: number,
    laneKeys: string[],
    patch?: Record<string, unknown>,
  ) {
    if (renderingSlotIds.value.includes(slotId)) return false
    renderingSlotIds.value = [...renderingSlotIds.value, slotId]
    try {
      const response = await performFetch<{
        slot: ComicSlotDto
        outcomes: ComicRenderOutcome[]
        attempts: ComicAttemptDto[]
      }>(
        `/api/comics/slots/${slotId}/render`,
        {
          method: 'POST',
          body: jsonBody({ laneKeys, ...(patch ? { patch } : {}) }),
        },
        0,
        45000,
      )
      const data = response.data
      if (data && Array.isArray(data.attempts)) {
        mergeAttempts(data.attempts, [slotId])
        if (data.slot)
          slots.value = slots.value.map((slot) =>
            slot.id === slotId ? data.slot : slot,
          )
      }
      const problems = (data?.outcomes ?? []).filter(
        (outcome) => outcome.status !== 'queued',
      )
      if (problems.length) {
        setError(
          problems
            .map(
              (outcome) =>
                `${outcome.laneKey}: ${outcome.message ?? outcome.status}`,
            )
            .join(' · '),
        )
      } else if (!response.success) {
        setError(response.message)
      } else {
        setMessage(response.message)
      }
      schedulePoll()
      return response.success
    } finally {
      renderingSlotIds.value = renderingSlotIds.value.filter(
        (id) => id !== slotId,
      )
    }
  }

  async function setVerdict(attemptId: number, verdict: ComicVerdict) {
    const before = attempts.value
    attempts.value = applyComicVerdict(attempts.value, attemptId, verdict)
    const response = await performFetch<{ attempts: ComicAttemptDto[] }>(
      `/api/comics/attempts/${attemptId}`,
      {
        method: 'PATCH',
        body: jsonBody({ verdict }),
      },
    )
    if (!response.success || !response.data) {
      attempts.value = before
      setError(response.message)
      return false
    }
    const slotId = response.data.attempts[0]?.slotId
    mergeAttempts(response.data.attempts, slotId ? [slotId] : [])
    return true
  }

  async function setAttemptNote(attemptId: number, note: string) {
    const response = await performFetch<{ attempts: ComicAttemptDto[] }>(
      `/api/comics/attempts/${attemptId}`,
      {
        method: 'PATCH',
        body: jsonBody({ note }),
      },
    )
    if (response.success && response.data) mergeAttempts(response.data.attempts)
    else setError(response.message)
    return response.success
  }

  async function retryAttempt(attemptId: number) {
    const response = await performFetch<{ attempts: ComicAttemptDto[] }>(
      `/api/comics/attempts/${attemptId}/retry`,
      { method: 'POST', body: jsonBody({}) },
      0,
    )
    if (!response.success || !response.data) {
      setError(response.message)
      return false
    }
    mergeAttempts(response.data.attempts)
    schedulePoll()
    return true
  }

  async function arrange(body: {
    entities?: number[]
    slots?: Array<{ id: number; entityId?: number | null }>
  }) {
    if (!series.value) return false
    const response = await performFetch(
      `/api/comics/${series.value.id}/arrange`,
      {
        method: 'POST',
        body: jsonBody(body),
      },
    )
    if (!response.success) setError(response.message)
    return response.success
  }

  async function moveEntity(entityId: number, delta: number) {
    const list = [...entities.value]
    const from = list.findIndex((entity) => entity.id === entityId)
    const to = from + delta
    if (from === -1 || to < 0 || to >= list.length) return
    const [moved] = list.splice(from, 1)
    list.splice(to, 0, moved!)
    const before = entities.value
    entities.value = list.map((entity, index) => ({
      ...entity,
      sortOrder: index,
    }))
    if (!(await arrange({ entities: list.map((entity) => entity.id) })))
      entities.value = before
  }

  async function moveSlot(
    slotId: number,
    target: { delta?: number; entityId?: number | null },
  ) {
    const slot = slotById(slotId)
    if (!slot) return
    const entityId =
      target.entityId !== undefined ? target.entityId : slot.entityId
    const siblings = subjectSlots.value.filter(
      (item) => item.entityId === entityId && item.id !== slotId,
    )
    const current = subjectSlots.value.filter(
      (item) => item.entityId === slot.entityId,
    )
    let index = siblings.length
    if (target.delta !== undefined && target.entityId === undefined) {
      index = Math.max(
        0,
        Math.min(
          siblings.length,
          current.findIndex((item) => item.id === slotId) + target.delta,
        ),
      )
    }
    siblings.splice(index, 0, { ...slot, entityId })
    const before = slots.value
    const order = new Map(siblings.map((item, position) => [item.id, position]))
    slots.value = slots.value.map((item) =>
      order.has(item.id)
        ? {
            ...item,
            entityId: item.id === slotId ? entityId : item.entityId,
            sortOrder: order.get(item.id)!,
          }
        : item,
    )
    const ok = await arrange({
      slots: siblings.map((item) => ({ id: item.id, entityId })),
    })
    if (!ok) slots.value = before
  }

  async function createIssue() {
    if (!series.value) return null
    const response = await performFetch<ComicIssueDto>('/api/comics/issues', {
      method: 'POST',
      body: jsonBody({ seriesId: series.value.id }),
    })
    if (!response.success || !response.data) {
      setError(response.message)
      return null
    }
    issues.value = [...issues.value, response.data]
    selectedIssueId.value = response.data.id
    return response.data
  }

  async function saveIssue(id: number, patch: Partial<ComicIssueDto>) {
    const notesBefore =
      issues.value.find((issue) => issue.id === id)?.notes ?? null
    const response = await performFetch<ComicIssueDto>(
      `/api/comics/issues/${id}`,
      {
        method: 'PATCH',
        body: jsonBody(patch),
      },
    )
    if (!response.success || !response.data) {
      setError(response.message)
      return false
    }
    const updated = response.data
    issues.value = issues.value.map((issue) =>
      issue.id === id ? { ...updated, layout: issue.layout } : issue,
    )
    if ('notes' in patch && comicNotesChangedEnough(notesBefore, updated.notes))
      autoCritique('issue', id)
    return true
  }

  function replaceIssue(updated: ComicIssueDto) {
    issues.value = issues.value.map((issue) =>
      issue.id === updated.id ? updated : issue,
    )
  }

  async function flushLayout() {
    if (layoutTimer) clearTimeout(layoutTimer)
    layoutTimer = null
    const issueId = pendingLayoutIssueId
    pendingLayoutIssueId = null
    const issue = issues.value.find((item) => item.id === issueId)
    if (!issue) return
    layoutSaveState.value = 'saving'
    const response = await performFetch<ComicIssueDto>(
      `/api/comics/issues/${issue.id}/layout`,
      {
        method: 'PUT',
        body: jsonBody({
          baseVersion: issue.layoutVersion,
          layout: issue.layout,
        }),
      },
    )
    if (response.success && response.data) {
      const saved = response.data
      issues.value = issues.value.map((item) =>
        item.id === saved.id
          ? { ...item, layoutVersion: saved.layoutVersion }
          : item,
      )
      layoutSaveState.value = pendingLayoutIssueId ? 'pending' : 'idle'
      return
    }
    layoutSaveState.value = 'error'
    if (response.status === 409 && response.data && 'layout' in response.data) {
      replaceIssue(response.data)
      setError(response.message)
    } else {
      setError(response.message)
    }
  }

  function commitLayout(
    issueId: number,
    next: ComicIssueLayout,
    recordUndo = true,
  ) {
    const issue = issues.value.find((item) => item.id === issueId)
    if (!issue || next === issue.layout) return
    if (recordUndo) {
      const stack = [...(undoStack.value[issueId] ?? []), issue.layout].slice(
        -UNDO_DEPTH,
      )
      undoStack.value = { ...undoStack.value, [issueId]: stack }
    }
    issues.value = issues.value.map((item) =>
      item.id === issueId ? { ...item, layout: next } : item,
    )
    pendingLayoutIssueId = issueId
    layoutSaveState.value = 'pending'
    if (layoutTimer) clearTimeout(layoutTimer)
    layoutTimer = setTimeout(() => {
      void flushLayout()
    }, LAYOUT_SAVE_DELAY_MS)
  }

  function editLayout(
    transform: (layout: ComicIssueLayout) => ComicIssueLayout,
  ) {
    const issue = selectedIssue.value
    if (!issue) return
    commitLayout(issue.id, transform(issue.layout))
  }

  function undoLayout() {
    const issue = selectedIssue.value
    if (!issue) return
    const stack = [...(undoStack.value[issue.id] ?? [])]
    const previous = stack.pop()
    if (!previous) return
    undoStack.value = { ...undoStack.value, [issue.id]: stack }
    commitLayout(issue.id, previous, false)
  }

  const canUndo = computed(() =>
    Boolean(
      selectedIssue.value && undoStack.value[selectedIssue.value.id]?.length,
    ),
  )

  function addPage(layoutKey = 'three-tier') {
    const issue = selectedIssue.value
    if (!issue) return
    const index = selectedPage.value
      ? issue.layout.pages.findIndex(
          (page) => page.id === selectedPage.value?.id,
        ) + 1
      : issue.layout.pages.length
    const next = addComicPage(issue.layout, layoutKey, index)
    commitLayout(issue.id, next)
    selectedPageId.value = next.pages[index]?.id ?? null
  }

  function movePage(pageId: string, toIndex: number) {
    editLayout((layout) => moveComicPage(layout, pageId, toIndex))
  }

  function removePage(pageId: string) {
    editLayout((layout) => removeComicPage(layout, pageId))
    if (selectedPageId.value === pageId) selectedPageId.value = null
  }

  function setPageLayout(pageId: string, layoutKey: string) {
    editLayout((layout) => setComicPageLayout(layout, pageId, layoutKey))
  }

  function splitCell(
    pageId: string,
    cell: number,
    direction: 'horizontal' | 'vertical',
  ) {
    editLayout((layout) => splitComicCell(layout, pageId, cell, direction))
  }

  function mergeCells(pageId: string, first: number, second: number) {
    editLayout((layout) => mergeComicCells(layout, pageId, first, second))
  }

  async function addPanel(
    pageId: string,
    cell: number | null = null,
    fromSlotId: number | null = null,
  ) {
    const issue = selectedIssue.value
    if (!issue) return
    const existing = fromSlotId ? slotById(fromSlotId) : null
    const slot =
      existing?.kind === 'panel' && existing.issueId === issue.id
        ? existing
        : await createSlot({
            issueId: issue.id,
            kind: 'panel',
            copyFromSlotId: existing?.id ?? null,
          })
    if (!slot) return
    const current = issues.value.find((item) => item.id === issue.id)
    if (!current) return
    const result = addComicPanel(current.layout, pageId, slot.id, cell)
    commitLayout(issue.id, result.layout)
    selectedPanelId.value = result.panelId
  }

  function movePanel(panelId: string, toPageId: string, toCell: number | null) {
    editLayout((layout) => moveComicPanel(layout, panelId, toPageId, toCell))
  }

  function removePanel(panelId: string) {
    editLayout((layout) => removeComicPanel(layout, panelId))
    if (selectedPanelId.value === panelId) selectedPanelId.value = null
  }

  function assignArt(panelId: string, attemptId: number | null) {
    editLayout((layout) =>
      updateComicPanel(layout, panelId, { artAttemptId: attemptId }),
    )
  }

  function updatePanelFocus(panelId: string, focusX: number, focusY: number) {
    editLayout((layout) =>
      updateComicPanel(layout, panelId, { focusX, focusY }),
    )
  }

  function updateLettering(panelId: string, lettering: ComicLettering[]) {
    editLayout((layout) => updateComicPanel(layout, panelId, { lettering }))
  }

  function loadAutoEditor() {
    try {
      autoEditor.value = localStorage.getItem(AUTO_EDITOR_KEY) !== 'off'
    } catch {
      autoEditor.value = true
    }
  }

  function setAutoEditor(on: boolean) {
    autoEditor.value = on
    try {
      localStorage.setItem(AUTO_EDITOR_KEY, on ? 'on' : 'off')
    } catch {
      return
    }
  }

  async function fetchCritiques() {
    if (!series.value) return
    const seriesId = series.value.id
    const response = await performFetch<ComicCritiqueDto[]>(
      `/api/comics/${seriesId}/editor`,
    )
    if (
      response.success &&
      Array.isArray(response.data) &&
      series.value?.id === seriesId
    ) {
      critiques.value = response.data
    }
  }

  async function askEditor(input: {
    targetType?: ComicEditorTarget
    targetId?: number | null
    text?: string
    parentId?: number | null
    trigger?: 'ask' | 'auto'
  }): Promise<ComicCritiqueDto | null> {
    if (!series.value) return null
    const key = input.parentId
      ? `reply:${input.parentId}`
      : `${input.targetType}:${input.targetId ?? ''}`
    editorBusy.value = key
    editorError.value = null
    try {
      const response = await performFetch<ComicCritiqueDto>(
        `/api/comics/${series.value.id}/editor`,
        { method: 'POST', body: jsonBody(input) },
        0,
        EDITOR_TIMEOUT_MS,
      )
      if (
        !response.success ||
        !response.data ||
        !('verdict' in response.data)
      ) {
        editorError.value = response.message
        return null
      }
      critiques.value = [response.data, ...critiques.value]
      return response.data
    } finally {
      editorBusy.value = null
    }
  }

  function autoCritique(
    targetType: ComicEditorTarget,
    targetId: number | null,
  ) {
    if (!autoEditor.value || editorBusy.value) return
    void askEditor({ targetType, targetId, trigger: 'auto' })
  }

  function beginDrag(payload: ComicDragPayload) {
    dragPayload.value = payload
  }

  function endDrag() {
    dragPayload.value = null
  }

  function dropOnCell(pageId: string, cell: number) {
    const payload = dragPayload.value
    dragPayload.value = null
    if (!payload) return
    const page = selectedIssue.value?.layout.pages.find(
      (item) => item.id === pageId,
    )
    const occupant = page?.panels.find((panel) => panel.cell === cell)
    if (payload.type === 'panel') movePanel(payload.id, pageId, cell)
    else if (payload.type === 'attempt') {
      if (occupant) assignArt(occupant.id, payload.id)
      else {
        const attempt = attemptFor(payload.id)
        void addPanel(pageId, cell, attempt?.slotId ?? null).then(() => {
          const panelId = selectedPanelId.value
          if (panelId) assignArt(panelId, payload.id)
        })
      }
    } else if (payload.type === 'slot') {
      void addPanel(pageId, cell, payload.id)
    }
  }

  function dropOnPage(pageId: string) {
    const payload = dragPayload.value
    if (!payload || payload.type !== 'page') {
      if (payload?.type === 'panel') {
        dragPayload.value = null
        movePanel(payload.id, pageId, null)
      }
      return
    }
    dragPayload.value = null
    const pages = selectedIssue.value?.layout.pages ?? []
    movePage(
      payload.id,
      pages.findIndex((page) => page.id === pageId),
    )
  }

  function schedulePoll() {
    if (pollTimer || pollPaused.value || !import.meta.client) return
    if (!attempts.value.some((attempt) => isComicActiveStatus(attempt.status)))
      return
    pollTimer = setTimeout(() => {
      pollTimer = null
      void pollOnce()
    }, POLL_MS)
  }

  async function pollOnce() {
    if (!series.value) return
    if (typeof document !== 'undefined' && document.hidden) {
      schedulePoll()
      return
    }
    const epoch = pollEpoch
    const response = await performFetch<{
      attempts: ComicAttemptDto[]
      active: number
    }>(`/api/comics/${series.value.id}/status`)
    if (epoch !== pollEpoch) return
    if (!response.success || !response.data) {
      pollFailures.value += 1
      if (pollFailures.value >= MAX_POLL_FAILURES) {
        pollPaused.value = true
        setError(
          'Status updates paused after repeated failures. Refresh to resume.',
        )
        return
      }
    } else {
      pollFailures.value = 0
      mergeAttempts(response.data.attempts)
    }
    schedulePoll()
  }

  function stopPolling() {
    if (pollTimer) clearTimeout(pollTimer)
    pollTimer = null
    pollEpoch += 1
  }

  return {
    seriesList,
    series,
    entities,
    slots,
    attempts,
    issues,
    syncedAt,
    mode,
    selectedEntityId,
    selectedSlotId,
    selectedIssueId,
    selectedPageId,
    selectedPanelId,
    lightboxAttemptId,
    dragPayload,
    loading,
    saving,
    renderingSlotIds,
    layoutSaveState,
    pollFailures,
    pollPaused,
    error,
    message,
    critiques,
    editorBusy,
    editorError,
    autoEditor,
    lanes,
    activeLanes,
    primaryLane,
    checkpointOptions,
    loadCheckpointOptions,
    attemptsBySlot,
    castSheets,
    subjectSlots,
    panelSlots,
    slotsByEntity,
    selectedSlot,
    selectedEntity,
    selectedIssue,
    selectedPage,
    selectedPanel,
    activeCount,
    artShelf,
    canUndo,
    attemptsFor,
    laneHero,
    slotCover,
    slotById,
    attemptFor,
    panelArt,
    setMessage,
    setError,
    initialize,
    fetchSeriesList,
    openSeries,
    refresh,
    createSeries,
    saveSeries,
    createEntity,
    saveEntity,
    createSlot,
    saveSlot,
    renderSlot,
    setVerdict,
    setAttemptNote,
    retryAttempt,
    moveEntity,
    moveSlot,
    createIssue,
    saveIssue,
    undoLayout,
    addPage,
    movePage,
    removePage,
    setPageLayout,
    splitCell,
    mergeCells,
    addPanel,
    movePanel,
    removePanel,
    assignArt,
    updatePanelFocus,
    updateLettering,
    loadAutoEditor,
    setAutoEditor,
    fetchCritiques,
    askEditor,
    beginDrag,
    endDrag,
    dropOnCell,
    dropOnPage,
    flushLayout,
    stopPolling,
  }
})
