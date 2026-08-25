import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  useResourceGalleryStore,
  type ResourceGalleryRecord,
} from '@/stores/resourceGalleryStore'
import { useResourceStore } from '@/stores/resourceStore'

export type LoraTriageDecision = 'sfw' | 'nsfw'

interface StoredLoraTriageProgress {
  version: 1
  decisions: Record<string, LoraTriageDecision>
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
  const selectedIds = ref<number[]>([])
  const hideConfirmed = ref(true)
  const initialized = ref(false)
  const isSaving = ref(false)
  const saveMessage = ref('')
  const saveError = ref('')

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
        if (!decision) return null

        const isMature = decision === 'nsfw'
        if (Boolean(resource.isMature) === isMature) return null

        return { resource, decision, isMature }
      })
      .filter(
        (
          change,
        ): change is {
          resource: ResourceGalleryRecord
          decision: LoraTriageDecision
          isMature: boolean
        } => Boolean(change),
      ),
  )

  const selectedCount = computed(() => selectedIds.value.length)

  function persist(): void {
    if (typeof window === 'undefined') return

    const stored: StoredLoraTriageProgress = {
      version: 1,
      decisions: Object.fromEntries(
        Object.entries(decisions.value).map(([id, decision]) => [String(id), decision]),
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

          decisions.value = restored
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
          isMature: change.isMature,
        })

        if (updated) saved += 1
        else failed.push(change.resource.customLabel || change.resource.name)
      }

      if (saved > 0) await resourceGalleryStore.loadResources()

      if (saved > 0) {
        saveMessage.value = `Saved ${saved} maturity change${saved === 1 ? '' : 's'}.`
      }

      if (failed.length) {
        saveError.value = `Failed to save ${failed.length}: ${failed.join(', ')}`
      }
    } finally {
      isSaving.value = false
    }
  }

  return {
    decisions,
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
    selectedCount,
    loadResources,
    decisionFor,
    setDecision,
    markSelected,
    setSelected,
    isSelected,
    selectIds,
    clearSelection,
    setHideConfirmed,
    clearProgress,
    saveChanges,
  }
})
