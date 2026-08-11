// /stores/animationManagerStore.ts
//
// Animation Manager is a live catalog/preview surface. WonderLab's retired
// Component table no longer doubles as an animation-build museum.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAnimationStore } from '@/stores/animationStore'
import {
  animationEffects,
  type AnimationEffect,
  type AnimationEffectId,
} from '@/stores/animationCatalog'

export const useAnimationManagerStore = defineStore('animationManagerStore', () => {
  const animationStore = useAnimationStore()
  const selectedSlug = ref<AnimationEffectId | null>(null)

  const galleryItems = computed<AnimationEffect[]>(() => animationEffects)
  const selectedItem = computed<AnimationEffect | null>(() => {
    if (!selectedSlug.value) return null
    return galleryItems.value.find((effect) => effect.id === selectedSlug.value) ?? null
  })

  const activeEffectIds = computed(() => new Set(animationStore.screenEffectIds))

  function selectSlug(slug: AnimationEffectId | null) {
    selectedSlug.value = slug
  }

  function previewEffect(effectId: AnimationEffectId) {
    animationStore.toggleScreenEffect(effectId)
  }

  function isEffectActive(effectId: AnimationEffectId): boolean {
    return activeEffectIds.value.has(effectId)
  }

  function clearEffects() {
    animationStore.clearScreenEffects()
  }

  return {
    selectedSlug,
    galleryItems,
    selectedItem,
    selectSlug,
    previewEffect,
    isEffectActive,
    clearEffects,
  }
})
