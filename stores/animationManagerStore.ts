// /stores/animationManagerStore.ts
//
// Animation Manager is the canonical catalog, preview, layering, and startup-settings
// surface. WonderLab's retired Component table no longer doubles as an animation-build museum.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  useAnimationStore,
  type FxPlacementState,
} from '@/stores/animationStore'
import {
  animationEffects,
  type AnimationEffect,
  type AnimationEffectId,
  type FxRegion,
} from '@/stores/animationCatalog'

export const useAnimationManagerStore = defineStore('animationManagerStore', () => {
  const animationStore = useAnimationStore()
  const selectedSlug = ref<AnimationEffectId | null>(null)

  const galleryItems = computed<readonly AnimationEffect[]>(() => animationEffects)
  const selectedItem = computed<AnimationEffect | null>(() => {
    if (!selectedSlug.value) return null
    return galleryItems.value.find((effect) => effect.id === selectedSlug.value) ?? null
  })

  const layeredEffectIds = computed(() => new Set(animationStore.screenEffectIds))
  const layeredEffectCount = computed(() => animationStore.screenEffectCount)

  function selectSlug(slug: AnimationEffectId | null) {
    selectedSlug.value = slug
  }

  function previewEffect(effectId: AnimationEffectId) {
    if (
      animationStore.isActive &&
      animationStore.activeEffectId === effectId &&
      animationStore.showBackdrop
    ) {
      animationStore.stop()
      return
    }

    const effect = galleryItems.value.find((item) => item.id === effectId)
    animationStore.start({
      effectId,
      message: `${effect?.label ?? 'Animation'} preview`,
      durationMs: null,
      showBackdrop: true,
    })
  }

  function isPreviewing(effectId: AnimationEffectId): boolean {
    return (
      animationStore.isActive &&
      animationStore.activeEffectId === effectId &&
      animationStore.showBackdrop
    )
  }

  function toggleLayer(effectId: AnimationEffectId) {
    animationStore.toggleScreenEffect(effectId)
  }

  function isLayerActive(effectId: AnimationEffectId): boolean {
    return layeredEffectIds.value.has(effectId)
  }

  function clearLayers() {
    animationStore.clearScreenEffects()
  }

  function getSurfacePlacement(region: FxRegion): FxPlacementState {
    return animationStore.getSurfacePlacement(region)
  }

  function setSurfacePlacement(region: FxRegion, placement: FxPlacementState) {
    animationStore.setSurfacePlacement(region, placement)
  }

  function resetSurfaces() {
    animationStore.resetSurfaces()
  }

  return {
    selectedSlug,
    galleryItems,
    selectedItem,
    layeredEffectCount,
    selectSlug,
    previewEffect,
    isPreviewing,
    toggleLayer,
    isLayerActive,
    clearLayers,
    getSurfacePlacement,
    setSurfacePlacement,
    resetSurfaces,
  }
})
