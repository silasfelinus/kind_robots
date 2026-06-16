// /stores/sheetStore.ts
// Single source of truth for what workspace-sheet displays in its hero.
//
// Default behavior: no override → workspace-sheet falls back to its
// existing cascade (builder sheet → active card → pageStore meta).
//
// Override behavior: any store can push content here — selecting a
// scenario, changing a dashboard subtab, picking a character — and the
// sheet hero swaps to it. Last write wins; clears are source-checked so
// deselecting a scenario can't stomp a newer override from someone else.
//
// Open/close state stays in navStore (it's persisted layout geometry);
// this store proxies it so callers have one import.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useNavStore } from '@/stores/navStore'
import type { DashboardTabConfig } from '@/stores/helpers/dashboardHelper'

export type SheetSource =
  | 'scenario'
  | 'character'
  | 'reward'
  | 'bot'
  | 'tab'
  | string

export type SheetContent = {
  source: SheetSource
  label: string
  title: string
  narrative: string
  imagePath: string
  icon: string
  artImageId?: number | null
}

export type SheetInput = Partial<Omit<SheetContent, 'source'>> & {
  source: SheetSource
}

export type SetSheetOptions = {
  /** Open the workspace sheet after setting content. Default false. */
  open?: boolean
}

export const useSheetStore = defineStore('sheetStore', () => {
  const override = ref<SheetContent | null>(null)

  // Tracks the in-flight art fetch so a fast scenario→scenario switch
  // can't resolve a stale image onto the newer override.
  const artRequestToken = ref(0)

  const hasOverride = computed(() => override.value !== null)

  const isOpen = computed(() => {
    const navStore = useNavStore()
    return navStore.workspaceSheetOpen
  })

  function openSheet(): void {
    useNavStore().openWorkspaceSheet()
  }

  function closeSheet(): void {
    useNavStore().closeWorkspaceSheet()
  }

  function toggleSheet(): void {
    useNavStore().toggleWorkspaceSheet()
  }

  /**
   * Set the sheet hero content. Missing fields render as empty and let
   * workspace-sheet's fallbacks (placeholder icon, etc.) take over.
   * If artImageId is provided and no imagePath resolves, the art image
   * is fetched async and applied when it lands.
   */
  function setSheet(input: SheetInput, options: SetSheetOptions = {}): void {
    override.value = {
      source: input.source,
      label: input.label ?? '',
      title: input.title ?? '',
      narrative: input.narrative ?? '',
      imagePath: input.imagePath ?? '',
      icon: input.icon ?? '',
      artImageId: input.artImageId ?? null,
    }

    if (input.artImageId) {
      void resolveArtImage(input.artImageId)
    }

    if (options.open) {
      openSheet()
    }
  }

  /**
   * Clear the override. Pass a source to clear only when that source is
   * the current owner — deselecting a scenario won't wipe a tab intro
   * or a character override that was set afterward.
   */
  function clearSheet(source?: SheetSource): void {
    if (source && override.value?.source !== source) return

    override.value = null
  }

  /** Convenience: push a dashboard tab's intro copy into the sheet. */
  function setSheetFromTab(tab: DashboardTabConfig): void {
    const title = tab.title?.trim() || tab.label?.trim() || ''
    const narrative = tab.narrative?.trim() || tab.summary?.trim() || ''
    const imagePath = tab.image?.trim() || ''

    // A bare key/icon tab (like the "+" tab) has no intro to show;
    // fall back to page defaults instead of a near-empty hero.
    if (!title && !narrative && !imagePath) {
      clearSheet('tab')
      return
    }

    setSheet({
      source: 'tab',
      label: tab.label || '',
      title,
      narrative,
      imagePath,
      icon: tab.icon || '',
    })
  }

  async function resolveArtImage(artImageId: number): Promise<void> {
    const token = ++artRequestToken.value

    try {
      const artStore = useArtStore()
      const result = await artStore.getArtImageById(artImageId)

      if (!result?.imageData) return

      // A newer setSheet/clearSheet happened while we were fetching
      if (token !== artRequestToken.value) return
      if (override.value?.artImageId !== artImageId) return

      override.value = {
        ...override.value,
        imagePath: `data:image/${result.fileType};base64,${result.imageData}`,
      }
    } catch (error) {
      console.error('Failed to resolve sheet art image:', error)
    }
  }

  return {
    override,
    hasOverride,
    isOpen,

    setSheet,
    clearSheet,
    setSheetFromTab,
    openSheet,
    closeSheet,
    toggleSheet,
  }
})
