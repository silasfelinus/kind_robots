// /stores/animationManagerStore.ts
//
// conductor animation-manager/t-005: view-model layer for the Animation Manager
// gallery + promotion workspace. Composes the existing componentStore (Component
// CRUD + the t-004 recordAnimationAttempt convention) and animationStore (live
// preview trigger) rather than duplicating their API/CRUD logic — this store owns
// only gallery grouping, selection, comparison, and status-transition actions.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Component } from '~/prisma/generated/prisma/client'
import { useComponentStore, type KindComponent } from '@/stores/componentStore'
import { useAnimationStore } from '@/stores/animationStore'
import {
  animationEffects,
  type AnimationEffect,
  type AnimationEffectId,
} from '@/stores/animationCatalog'
import {
  ANIMATION_ATTEMPT_FOLDER,
  listAnimationAttempts,
  getLatestAnimationAttempt,
} from '@/stores/helpers/animationComponentHelper'
import {
  getComponentStatus,
  type ComponentStatus,
} from '@/utils/wonderlab/componentStatus'

export interface AnimationGalleryItem {
  effect: AnimationEffect
  live: KindComponent | null
  attempts: KindComponent[]
  latestAttempt: KindComponent | null
  status: ComponentStatus
}

export type AnimationManagerStatusFilter = ComponentStatus | 'ALL'

export const useAnimationManagerStore = defineStore('animationManagerStore', () => {
  const componentStore = useComponentStore()
  const animationStore = useAnimationStore()

  const selectedSlug = ref<AnimationEffectId | null>(null)
  const compareIds = ref<number[]>([])
  const statusFilter = ref<AnimationManagerStatusFilter>('ALL')

  const isInitialized = computed(() => componentStore.getIsInitialized)

  async function initialize(force = false) {
    await componentStore.initialize(force)
  }

  // The reconciliation scanner (server/api/components/reconcile.post.ts) logs one
  // undecorated Component row per discovered file -- componentName === catalog id,
  // no "@vN" suffix. That is the "live" row; the versioned "@vN" rows are the t-004
  // attempt museum. Both live in the same folderName ('screenfx').
  function findLiveComponent(effectId: AnimationEffectId): KindComponent | null {
    return (
      componentStore.allComponents.find(
        (component) =>
          component.folderName === ANIMATION_ATTEMPT_FOLDER &&
          component.componentName === effectId,
      ) ?? null
    )
  }

  const galleryItems = computed<AnimationGalleryItem[]>(() => {
    return animationEffects.map((effect) => {
      const attempts = listAnimationAttempts(componentStore.allComponents, effect.id)
      const latestAttempt = getLatestAnimationAttempt(
        componentStore.allComponents,
        effect.id,
      )
      const live = findLiveComponent(effect.id)
      const statusSource = latestAttempt ?? live

      return {
        effect,
        live,
        attempts,
        latestAttempt,
        status: statusSource ? getComponentStatus(statusSource) : 'UNREVIEWED',
      }
    })
  })

  const filteredGalleryItems = computed(() => {
    if (statusFilter.value === 'ALL') return galleryItems.value
    return galleryItems.value.filter((item) => item.status === statusFilter.value)
  })

  const statusCounts = computed(() => {
    const counts: Partial<Record<ComponentStatus, number>> = {}
    for (const item of galleryItems.value) {
      counts[item.status] = (counts[item.status] ?? 0) + 1
    }
    return counts
  })

  const selectedItem = computed<AnimationGalleryItem | null>(() => {
    if (!selectedSlug.value) return null
    return galleryItems.value.find((item) => item.effect.id === selectedSlug.value) ?? null
  })

  const compareAttempts = computed<KindComponent[]>(() =>
    compareIds.value
      .map((id) => componentStore.allComponents.find((component) => component.id === id))
      .filter((component): component is KindComponent => Boolean(component)),
  )

  function selectSlug(slug: AnimationEffectId | null) {
    selectedSlug.value = slug
    compareIds.value = []
  }

  function toggleCompare(id: number) {
    const index = compareIds.value.indexOf(id)
    if (index !== -1) {
      compareIds.value = compareIds.value.filter((entry) => entry !== id)
      return
    }

    // Compare is a two-up view -- drop the oldest pick rather than growing unbounded.
    const next = [...compareIds.value, id]
    compareIds.value = next.length > 2 ? next.slice(next.length - 2) : next
  }

  function isComparing(id: number) {
    return compareIds.value.includes(id)
  }

  function clearCompare() {
    compareIds.value = []
  }

  function previewEffect(effectId: AnimationEffectId) {
    animationStore.toggleScreenEffect(effectId)
  }

  async function setAttemptStatus(
    attempt: Component,
    status: ComponentStatus,
    statusReason: string,
  ) {
    return componentStore.updateComponent({
      ...attempt,
      status,
      statusReason,
    })
  }

  async function promoteAttempt(attempt: Component) {
    return setAttemptStatus(
      attempt,
      'WORKING',
      'Promoted from the Animation Manager gallery.',
    )
  }

  async function sendToConstruction(attempt: Component) {
    return setAttemptStatus(
      attempt,
      'UNDER_CONSTRUCTION',
      'Sent back for polish from the Animation Manager gallery.',
    )
  }

  async function retireAttempt(attempt: Component) {
    return setAttemptStatus(
      attempt,
      'RETIRED',
      'Retired from the Animation Manager gallery.',
    )
  }

  return {
    selectedSlug,
    compareIds,
    statusFilter,
    isInitialized,
    galleryItems,
    filteredGalleryItems,
    statusCounts,
    selectedItem,
    compareAttempts,
    initialize,
    selectSlug,
    toggleCompare,
    isComparing,
    clearCompare,
    previewEffect,
    promoteAttempt,
    sendToConstruction,
    retireAttempt,
  }
})
