import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  useResourceGalleryStore,
  type ResourceGalleryRecord,
} from '@/stores/resourceGalleryStore'
import { useResourceStore } from '@/stores/resourceStore'
import { performFetch } from '@/stores/utils'
import { hasBlindPreview } from '@/utils/loraProbe'
import {
  canReclassify,
  inferLoraCategory,
  normalizeLoraCategory,
  type LoraCategory,
} from '@/utils/loraCategory'

export type LoraTriageDecision = 'sfw' | 'nsfw'

export type LoraRenderState = 'queued' | 'failed'

type ProbePlan = {
  resourceId: number
  label: string
  family: string
  // Null on the flux lane, which resolves its own UNet and takes no catalog
  // checkpoint -- not an error, and not something to render as "missing base".
  checkpoint: { id: number; name: string; localPath: string | null } | null
  enqueue: Record<string, unknown>
}

type ProbeSkip = {
  resourceId: number
  label: string
  family: string
  reason: string
}

// Enqueue is a database write per plan, not a render, so this only paces the
// request burst -- the GPU work is drained by the queue worker afterwards.
const ENQUEUE_CONCURRENCY = 4

interface StoredLoraTriageProgress {
  version: 1
  decisions: Record<string, LoraTriageDecision>
  categories?: Record<string, LoraCategory>
  hideConfirmed: boolean
}

const STORAGE_KEY = 'kind-robots:lora-maturity-triage:v1'

function isDecision(value: unknown): value is LoraTriageDecision {
  return value === 'sfw' || value === 'nsfw'
}

export const useLoraTriageStore = defineStore('loraTriageStore', () => {
  const resourceGalleryStore = useResourceGalleryStore()
  const resourceStore = useResourceStore()

  const decisions = ref<Record<number, LoraTriageDecision>>({})
  /*
   * Pending category edits, held the same way maturity decisions are: this
   * page's whole shape is "sort a lot of rows fast, then commit in one pass",
   * and a per-card PATCH would make a 1,500-row sweep 1,500 round trips.
   */
  const categoryEdits = ref<Record<number, LoraCategory>>({})
  const selectedIds = ref<number[]>([])
  const hideConfirmed = ref(true)
  const initialized = ref(false)
  const isSaving = ref(false)
  const saveMessage = ref('')
  const saveError = ref('')

  /*
   * Render state is deliberately NOT persisted. A queued job's real outcome is
   * the ArtImage the completion path writes back onto the Resource, so a reload
   * should re-read that rather than trust a stale local flag.
   */
  const renderStates = ref<Record<number, LoraRenderState>>({})
  const isRendering = ref(false)
  const renderMessage = ref('')
  const renderError = ref('')
  const renderDone = ref(0)
  const renderTotal = ref(0)
  const probeSkipped = ref<ProbeSkip[]>([])
  let cancelRequested = false

  const loras = computed<ResourceGalleryRecord[]>(() =>
    resourceGalleryStore.resources.filter((resource) => {
      const type = String(resource.resourceType || '').toUpperCase()
      return type === 'LORA' || type === 'LYCORIS'
    }),
  )

  const confirmedCount = computed(
    () => loras.value.filter((resource) => Boolean(decisions.value[resource.id])).length,
  )

  const remainingCount = computed(() => loras.value.length - confirmedCount.value)

  const pendingChanges = computed(() =>
    loras.value
      .map((resource) => {
        const decision = decisions.value[resource.id]
        const isMature = decision ? decision === 'nsfw' : null
        const maturityChanged =
          isMature !== null && Boolean(resource.isMature) !== isMature

        const category = categoryEdits.value[resource.id] ?? null
        const categoryChanged =
          category !== null &&
          category !== normalizeLoraCategory(resource.loraCategory)

        if (!maturityChanged && !categoryChanged) return null

        return {
          resource,
          decision: decision ?? null,
          isMature: maturityChanged ? isMature : null,
          category: categoryChanged ? category : null,
        }
      })
      .filter(
        (
          change,
        ): change is {
          resource: ResourceGalleryRecord
          decision: LoraTriageDecision | null
          isMature: boolean | null
          category: LoraCategory | null
        } => Boolean(change),
      ),
  )

  const unclassifiedCount = computed(
    () =>
      loras.value.filter(
        (resource) =>
          !normalizeLoraCategory(resource.loraCategory) &&
          !categoryEdits.value[resource.id],
      ).length,
  )

  const selectedCount = computed(() => selectedIds.value.length)

  /*
   * LoRAs with nothing to look at: no generated ArtImage, no stored path, and
   * either no remote preview or one on a host that no longer resolves. These
   * are the rows whose maturity flag was set without an image to judge it by.
   */
  const missingPreviewLoras = computed(() =>
    loras.value.filter((resource) => hasBlindPreview(resource)),
  )

  const missingPreviewCount = computed(() => missingPreviewLoras.value.length)

  function renderStateFor(resourceId: number): LoraRenderState | null {
    return renderStates.value[resourceId] ?? null
  }

  function persist(): void {
    if (typeof window === 'undefined') return

    const stored: StoredLoraTriageProgress = {
      version: 1,
      decisions: Object.fromEntries(
        Object.entries(decisions.value).map(([id, decision]) => [String(id), decision]),
      ),
      categories: Object.fromEntries(
        Object.entries(categoryEdits.value).map(([id, category]) => [
          String(id),
          category,
        ]),
      ),
      hideConfirmed: hideConfirmed.value,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  }

  function initialize(): void {
    if (typeof window === 'undefined' || initialized.value) return

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<StoredLoraTriageProgress>
        if (parsed.version === 1 && parsed.decisions && typeof parsed.decisions === 'object') {
          const restored: Record<number, LoraTriageDecision> = {}

          for (const [rawId, decision] of Object.entries(parsed.decisions)) {
            const id = Number(rawId)
            if (Number.isInteger(id) && id > 0 && isDecision(decision)) {
              restored[id] = decision
            }
          }

          const restoredCategories: Record<number, LoraCategory> = {}
          for (const [rawId, category] of Object.entries(
            parsed.categories ?? {},
          )) {
            const id = Number(rawId)
            const normalized = normalizeLoraCategory(category)
            if (Number.isInteger(id) && id > 0 && normalized) {
              restoredCategories[id] = normalized
            }
          }

          decisions.value = restored
          categoryEdits.value = restoredCategories
          hideConfirmed.value = parsed.hideConfirmed !== false
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }

    initialized.value = true
  }

  async function loadResources(): Promise<void> {
    initialize()
    await resourceGalleryStore.loadResources()
  }

  function decisionFor(resourceId: number): LoraTriageDecision | null {
    return decisions.value[resourceId] ?? null
  }

  function setDecision(resourceId: number, decision: LoraTriageDecision): void {
    decisions.value = { ...decisions.value, [resourceId]: decision }
    selectedIds.value = selectedIds.value.filter((id) => id !== resourceId)
    persist()
  }

  function markSelected(decision: LoraTriageDecision): void {
    if (!selectedIds.value.length) return

    const next = { ...decisions.value }
    for (const id of selectedIds.value) next[id] = decision

    decisions.value = next
    selectedIds.value = []
    persist()
  }

  function categoryFor(resourceId: number): LoraCategory | null {
    const edited = categoryEdits.value[resourceId]
    if (edited) return edited

    const resource = loras.value.find((row) => row.id === resourceId)
    return normalizeLoraCategory(resource?.loraCategory)
  }

  function setCategory(resourceId: number, category: LoraCategory | null): void {
    const next = Object.fromEntries(
      Object.entries(categoryEdits.value).filter(
        ([id]) => Number(id) !== resourceId,
      ),
    ) as Record<number, LoraCategory>

    if (category) next[resourceId] = category

    categoryEdits.value = next
    persist()
  }

  function markSelectedCategory(category: LoraCategory): void {
    if (!selectedIds.value.length) return

    const next = { ...categoryEdits.value }
    for (const id of selectedIds.value) next[id] = category

    categoryEdits.value = next
    selectedIds.value = []
    persist()
  }

  /*
   * Fills the empty category slots from what the row already says about itself.
   *
   * A suggestion, not a save: it lands in the same pending-edit buffer every
   * manual pick uses, so Silas sees all of them before anything is written and
   * can overrule any of them first. Rows already classified by a person are
   * never touched, and neither is a row that already carries a category --
   * re-deciding a settled row is the sweep's job, not the suggester's.
   */
  function suggestCategories(resourceIds?: number[]): number {
    const scope = resourceIds?.length
      ? loras.value.filter((resource) => resourceIds.includes(resource.id))
      : loras.value

    const next = { ...categoryEdits.value }
    let suggested = 0

    for (const resource of scope) {
      if (next[resource.id]) continue
      if (normalizeLoraCategory(resource.loraCategory)) continue
      if (!canReclassify(resource.loraCategorySource)) continue

      const inference = inferLoraCategory({
        name: resource.name,
        customLabel: resource.customLabel,
        description: resource.description,
        triggerWords: resource.triggerWords,
      })

      if (!inference.category) continue

      next[resource.id] = inference.category
      suggested += 1
    }

    categoryEdits.value = next
    persist()
    return suggested
  }

  function setSelected(resourceId: number, selected: boolean): void {
    const ids = new Set(selectedIds.value)
    if (selected) ids.add(resourceId)
    else ids.delete(resourceId)
    selectedIds.value = [...ids]
  }

  function isSelected(resourceId: number): boolean {
    return selectedIds.value.includes(resourceId)
  }

  function selectIds(resourceIds: number[]): void {
    selectedIds.value = [...new Set(resourceIds)]
  }

  function clearSelection(): void {
    selectedIds.value = []
  }

  function setHideConfirmed(value: boolean): void {
    hideConfirmed.value = value
    persist()
  }

  function clearProgress(): void {
    decisions.value = {}
    categoryEdits.value = {}
    selectedIds.value = []
    saveMessage.value = ''
    saveError.value = ''
    persist()
  }

  async function saveChanges(): Promise<void> {
    if (isSaving.value || !pendingChanges.value.length) return

    isSaving.value = true
    saveMessage.value = ''
    saveError.value = ''

    const changes = [...pendingChanges.value]
    let saved = 0
    const failed: string[] = []

    try {
      for (const change of changes) {
        const updated = await resourceStore.updateResource(change.resource.id, {
          ...(change.isMature !== null ? { isMature: change.isMature } : {}),
          // No loraCategorySource here on purpose. The PATCH route stamps HUMAN
          // for an edit that names a category without naming a source, and that
          // stamp is what stops the next catalog scan reverting this decision.
          ...(change.category !== null ? { loraCategory: change.category } : {}),
        })

        if (updated) saved += 1
        else failed.push(change.resource.customLabel || change.resource.name)
      }

      if (saved > 0) await resourceGalleryStore.loadResources()

      if (saved > 0) {
        saveMessage.value = `Saved ${saved} change${saved === 1 ? '' : 's'}.`
        categoryEdits.value = {}
        persist()
      }

      if (failed.length) {
        saveError.value = `Failed to save ${failed.length}: ${failed.join(', ')}`
      }
    } finally {
      isSaving.value = false
    }
  }

  async function renderPreviews(resourceIds?: number[]): Promise<void> {
    if (isRendering.value) return

    const ids = resourceIds?.length
      ? [...new Set(resourceIds)]
      : missingPreviewLoras.value.map((resource) => resource.id)

    if (!ids.length) {
      renderError.value = 'No LoRAs are missing a preview.'
      return
    }

    isRendering.value = true
    cancelRequested = false
    renderMessage.value = ''
    renderError.value = ''
    probeSkipped.value = []
    renderDone.value = 0
    renderTotal.value = 0

    try {
      const planned = await performFetch<{
        plans: ProbePlan[]
        skipped: ProbeSkip[]
      }>('/api/lora/probe-plan', {
        method: 'POST',
        body: JSON.stringify({
          scope: 'ids',
          resourceIds: ids,
          limit: ids.length,
        }),
      })

      if (!planned?.success || !planned.data) {
        renderError.value = planned?.message || 'Could not plan the previews.'
        return
      }

      const plans = planned.data.plans
      probeSkipped.value = planned.data.skipped ?? []
      renderTotal.value = plans.length

      if (!plans.length) {
        renderError.value =
          'Nothing could be planned -- every selected LoRA lacks a usable base model.'
        return
      }

      const queued: Record<number, LoraRenderState> = { ...renderStates.value }
      let cursor = 0
      let failures = 0

      async function worker(): Promise<void> {
        while (cursor < plans.length && !cancelRequested) {
          const plan = plans[cursor]
          cursor += 1
          if (!plan) continue

          try {
            const response = await performFetch<unknown>('/api/art/enqueue', {
              method: 'POST',
              body: JSON.stringify(plan.enqueue),
            })
            if (response?.success) queued[plan.resourceId] = 'queued'
            else {
              queued[plan.resourceId] = 'failed'
              failures += 1
            }
          } catch {
            queued[plan.resourceId] = 'failed'
            failures += 1
          }

          renderDone.value += 1
          renderStates.value = { ...queued }
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(ENQUEUE_CONCURRENCY, plans.length) }, () =>
          worker(),
        ),
      )

      const succeeded = renderDone.value - failures
      renderMessage.value = cancelRequested
        ? `Stopped after queueing ${succeeded} preview render(s).`
        : `Queued ${succeeded} preview render(s).`

      if (failures) {
        renderError.value = `${failures} enqueue request(s) failed.`
      }
    } catch (error) {
      renderError.value =
        error instanceof Error ? error.message : 'Could not queue the previews.'
    } finally {
      isRendering.value = false
    }
  }

  function cancelRender(): void {
    if (isRendering.value) cancelRequested = true
  }

  return {
    decisions,
    categoryEdits,
    selectedIds,
    hideConfirmed,
    initialized,
    isSaving,
    saveMessage,
    saveError,
    loras,
    confirmedCount,
    remainingCount,
    pendingChanges,
    unclassifiedCount,
    selectedCount,
    loadResources,
    decisionFor,
    setDecision,
    markSelected,
    categoryFor,
    setCategory,
    markSelectedCategory,
    suggestCategories,
    setSelected,
    isSelected,
    selectIds,
    clearSelection,
    setHideConfirmed,
    clearProgress,
    saveChanges,
    renderStates,
    isRendering,
    renderMessage,
    renderError,
    renderDone,
    renderTotal,
    probeSkipped,
    missingPreviewLoras,
    missingPreviewCount,
    renderStateFor,
    renderPreviews,
    cancelRender,
  }
})
