import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '~/stores/utils'
import { useUserStore } from '~/stores/userStore'
import {
  k8RiskParams,
  type K8ProfileDraft,
  type K8ProfileField,
  type K8Snapshot,
} from '~/utils/k8Wildlife'

export const useK8WildlifeStore = defineStore('k8Wildlife', () => {
  const userStore = useUserStore()
  const snapshot = ref<K8Snapshot | null>(null)
  const level = ref(2)
  const profileDraft = ref<K8ProfileDraft>({})
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const notice = ref('')

  const activeLevel = computed(() => snapshot.value?.appliedLevel ?? null)
  const preview = computed(() =>
    k8RiskParams(
      level.value,
      snapshot.value?.presets,
      snapshot.value?.levelOverrides,
    ),
  )
  const basePreview = computed(() =>
    k8RiskParams(level.value, snapshot.value?.presets),
  )
  const readonly = computed(
    () => userStore.isAdmin || snapshot.value?.readonly !== false,
  )

  function syncDraft() {
    profileDraft.value = { ...(preview.value || {}) }
  }

  function chooseLevel(next: number) {
    if (!Number.isInteger(next) || next < 0 || next > 10) return
    level.value = next
    notice.value = ''
    syncDraft()
  }

  function updateField(key: K8ProfileField, value: number) {
    profileDraft.value = { ...profileDraft.value, [key]: value }
  }

  async function refresh(keepPreview = false) {
    loading.value = true
    const result = await performFetch<K8Snapshot>(
      '/api/k8/fund',
      { method: 'GET' },
      1,
    )
    loading.value = false
    if (!result.success || !result.data?.fingerprint) {
      snapshot.value = null
      error.value =
        result.message || 'The trading gateway is currently unavailable.'
      return false
    }
    snapshot.value = result.data
    error.value = ''
    if (!keepPreview) {
      const applied = result.data.appliedLevel
      level.value =
        Number.isInteger(applied) && applied !== null
          ? applied
          : (result.data.savedLevel ?? 2)
    }
    syncDraft()
    return true
  }

  async function applyLevel() {
    if (saving.value || !snapshot.value || readonly.value) return false
    const chosen = level.value
    const fingerprint = snapshot.value.fingerprint
    saving.value = true
    notice.value = ''
    const result = await performFetch<Record<string, unknown>>(
      '/api/k8/fund/risk',
      {
        method: 'PUT',
        body: JSON.stringify({ level: chosen, fingerprint }),
      },
      1,
    )
    saving.value = false
    notice.value = result.success
      ? chosen === 0
        ? 'Engine stop acknowledged. Existing positions and orders may remain.'
        : 'Level saved. Rechecking the actual engine state.'
      : result.message || 'Could not confirm the change. Please refresh.'
    await refresh(true)
    return result.success
  }

  async function saveProfile(reset = false) {
    if (
      saving.value ||
      !snapshot.value ||
      readonly.value ||
      level.value < 1 ||
      !basePreview.value
    )
      return false
    const overrides: K8ProfileDraft = {}
    if (!reset) {
      for (const [key, value] of Object.entries(profileDraft.value)) {
        if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value === undefined
        ) {
          error.value = 'Each profile setting must be a finite number.'
          return false
        }
        const typedKey = key as K8ProfileField
        if (value !== basePreview.value[typedKey]) overrides[typedKey] = value
      }
    }
    saving.value = true
    notice.value = ''
    const result = await performFetch<Record<string, unknown>>(
      '/api/k8/fund/levels',
      {
        method: 'PUT',
        body: JSON.stringify({
          level: level.value,
          fingerprint: snapshot.value.fingerprint,
          overrides: reset ? null : overrides,
        }),
      },
      1,
    )
    saving.value = false
    notice.value = result.success
      ? 'Profile saved. Apply this animal separately to change trading settings.'
      : result.message || 'Could not save the animal profile.'
    await refresh(true)
    return result.success
  }

  function clear() {
    snapshot.value = null
    profileDraft.value = {}
    error.value = ''
    notice.value = ''
  }

  return {
    snapshot,
    level,
    profileDraft,
    loading,
    saving,
    error,
    notice,
    activeLevel,
    preview,
    basePreview,
    readonly,
    chooseLevel,
    updateField,
    refresh,
    applyLevel,
    saveProfile,
    clear,
  }
})
