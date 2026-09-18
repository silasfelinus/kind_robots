import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  loadButterflyBinPresets,
  saveButterflyBinPresets,
  toCustomBinPreset,
  type ButterflyCustomBinPreset,
  type ButterflyGenerationAction,
} from '@/stores/helpers/butterflyGalleryBinPresets'
import { createDefaultButterflyBins } from '@/stores/helpers/butterflyGalleryFixtures'
import type { ButterflyBinConfig } from '@/types/butterflyGallery'

function defaultPresets(): ButterflyCustomBinPreset[] {
  return createDefaultButterflyBins().map((bin) => toCustomBinPreset(bin))
}

export const useButterflyGalleryPresetStore = defineStore(
  'butterflyGalleryPresetStore',
  () => {
    const bins = ref<ButterflyCustomBinPreset[]>(defaultPresets())
    const initialized = ref(false)
    const persistenceAvailable = ref(true)

    const enabledBins = computed(() =>
      bins.value
        .filter((bin) => bin.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    )

    function persist(): void {
      if (typeof window === 'undefined') return
      try {
        saveButterflyBinPresets(window.localStorage, bins.value)
        persistenceAvailable.value = true
      } catch {
        persistenceAvailable.value = false
      }
    }

    function initialize(): void {
      if (initialized.value) return
      if (typeof window !== 'undefined') {
        try {
          bins.value = loadButterflyBinPresets(window.localStorage) ?? defaultPresets()
          persistenceAvailable.value = true
        } catch {
          bins.value = defaultPresets()
          persistenceAvailable.value = false
        }
      }
      initialized.value = true
    }

    function upsertPreset(
      bin: ButterflyBinConfig,
      actions: ButterflyGenerationAction[] = [],
    ): void {
      const preset = toCustomBinPreset(bin, actions)
      const index = bins.value.findIndex((existing) => existing.id === preset.id)
      bins.value =
        index === -1
          ? [...bins.value, preset]
          : bins.value.map((existing, i) => (i === index ? preset : existing))
      persist()
    }

    function removePreset(binId: string): void {
      bins.value = bins.value.filter((bin) => bin.id !== binId)
      persist()
    }

    function setEnabled(binId: string, enabled: boolean): void {
      bins.value = bins.value.map((bin) =>
        bin.id === binId ? { ...bin, enabled } : bin,
      )
      persist()
    }

    function setActions(
      binId: string,
      actions: ButterflyGenerationAction[],
    ): void {
      bins.value = bins.value.map((bin) =>
        bin.id === binId ? { ...bin, actions: [...actions] } : bin,
      )
      persist()
    }

    function resetToDefaults(): void {
      bins.value = defaultPresets()
      persist()
    }

    return {
      bins,
      initialized,
      persistenceAvailable,
      enabledBins,
      initialize,
      upsertPreset,
      removePreset,
      setEnabled,
      setActions,
      resetToDefaults,
    }
  },
)
