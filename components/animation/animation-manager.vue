<!-- /components/animation/animation-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      v-if="showHeader"
      class="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 px-4 py-3"
    >
      <div class="flex items-center gap-3">
        <span
          class="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 text-accent"
        >
          <Icon name="kind-icon:sparkles" class="h-6 w-6" />
        </span>
        <div>
          <h2 class="text-lg font-black leading-tight text-base-content">
            Animation Manager
          </h2>
          <p class="text-xs text-base-content/60">
            {{ store.galleryItems.length }} catalog effects &middot;
            {{ builtCount }} with build history
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <NuxtLink
          to="/screenfx"
          class="btn btn-outline btn-sm rounded-xl"
          title="Toggle effects live on-screen"
        >
          <Icon name="kind-icon:sparkles" class="h-4 w-4" />
          Screen FX
        </NuxtLink>
        <NuxtLink
          to="/conductor"
          class="btn btn-outline btn-sm rounded-xl"
          title="Pitches and roadmap tasks for this project live in Conductor"
        >
          <Icon name="kind-icon:scroll" class="h-4 w-4" />
          Conductor
        </NuxtLink>
        <button
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          :disabled="refreshing"
          @click="refresh"
        >
          <Icon
            name="kind-icon:refresh"
            class="h-4 w-4"
            :class="{ 'animate-spin': refreshing }"
          />
          Refresh
        </button>
      </div>
    </div>

    <div
      class="flex flex-wrap items-center gap-2 border-b border-base-300 px-4 py-2"
    >
      <button
        class="badge badge-lg cursor-pointer"
        :class="store.statusFilter === 'ALL' ? 'badge-primary' : 'badge-outline'"
        type="button"
        @click="store.statusFilter = 'ALL'"
      >
        All ({{ store.galleryItems.length }})
      </button>
      <button
        v-for="status in statusOrder"
        :key="status"
        class="badge badge-lg cursor-pointer"
        :class="
          store.statusFilter === status
            ? statusBadgeClass(status)
            : 'badge-outline'
        "
        type="button"
        @click="
          store.statusFilter = store.statusFilter === status ? 'ALL' : status
        "
      >
        {{ statusLabels[status] }} ({{ store.statusCounts[status] ?? 0 }})
      </button>

      <button
        v-if="store.compareIds.length > 0"
        class="badge badge-lg badge-secondary ml-auto cursor-pointer"
        type="button"
        @click="store.clearCompare()"
      >
        Comparing {{ store.compareIds.length }}/2
        <Icon name="kind-icon:x" class="ml-1 h-3 w-3" />
      </button>
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <div
        class="grid min-h-0 flex-1 auto-rows-min grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <div
          v-for="item in store.filteredGalleryItems"
          :key="item.effect.id"
          class="flex flex-col gap-3 rounded-2xl border bg-base-200 p-3 transition-shadow hover:shadow-lg"
          :class="[
            statusCardBorderClass(item.status),
            store.selectedSlug === item.effect.id
              ? 'ring-2 ring-primary'
              : '',
          ]"
        >
          <div
            class="flex cursor-pointer items-start gap-3"
            @click="store.selectSlug(item.effect.id)"
          >
            <span
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
              :style="{ borderColor: item.effect.color, color: item.effect.color }"
            >
              <Icon :name="item.effect.icon" class="h-6 w-6" />
            </span>

            <div class="min-w-0 flex-1">
              <h3 class="truncate font-black text-base-content">
                {{ item.effect.label }}
              </h3>
              <p class="truncate text-xs text-base-content/55">
                {{ item.effect.id }}
              </p>
            </div>

            <span class="badge badge-sm" :class="statusBadgeClass(item.status)">
              {{ statusLabels[item.status] }}
            </span>
          </div>

          <p class="text-xs text-base-content/60">
            {{ item.attempts.length }}
            {{ item.attempts.length === 1 ? 'build' : 'builds' }} logged
            <span v-if="item.latestAttempt">
              &middot; latest v{{ latestBuildNumber(item) }}
            </span>
            <span v-else>&middot; no attempt history yet</span>
          </p>

          <div v-if="item.live" class="flex flex-wrap items-center gap-2 text-xs">
            <span v-if="ratingCount(item.live)" class="font-bold text-warning-content">
              ★ {{ averageRatingLabel(item.live) }}
              <span class="font-normal text-base-content/45"
                >({{ ratingCount(item.live) }})</span
              >
            </span>
            <span v-else class="text-base-content/45">No ratings yet</span>
          </div>

          <div class="mt-auto flex flex-wrap gap-2">
            <button
              class="btn btn-xs rounded-lg"
              type="button"
              title="Trigger this effect live on screen"
              @click="store.previewEffect(item.effect.id)"
            >
              <Icon name="kind-icon:eye" class="h-3 w-3" />
              Preview
            </button>
            <button
              class="btn btn-xs rounded-lg"
              type="button"
              @click="store.selectSlug(item.effect.id)"
            >
              <Icon name="kind-icon:search" class="h-3 w-3" />
              History
            </button>
            <button
              v-if="item.latestAttempt"
              class="btn btn-xs rounded-lg"
              :class="store.isComparing(item.latestAttempt.id) ? 'btn-secondary' : ''"
              type="button"
              title="Add latest build to comparison"
              @click="store.toggleCompare(item.latestAttempt.id)"
            >
              <Icon name="kind-icon:copy" class="h-3 w-3" />
              Compare
            </button>
          </div>
        </div>

        <div
          v-if="store.filteredGalleryItems.length === 0"
          class="col-span-full flex flex-col items-center justify-center gap-2 py-12 text-base-content/50"
        >
          <Icon name="kind-icon:sparkles" class="h-8 w-8" />
          <p>No effects match this filter.</p>
        </div>
      </div>

      <aside
        v-if="store.selectedItem || store.compareAttempts.length > 0"
        class="flex w-full max-w-sm shrink-0 flex-col gap-3 overflow-y-auto border-l border-base-300 bg-base-100 p-4"
      >
        <div v-if="store.compareAttempts.length > 0" class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <h3 class="font-black text-base-content">Compare builds</h3>
            <button class="btn btn-ghost btn-xs" type="button" @click="store.clearCompare()">
              <Icon name="kind-icon:x" class="h-4 w-4" />
            </button>
          </div>
          <component-card
            v-for="attempt in store.compareAttempts"
            :key="attempt.id"
            :component="attempt"
            compact
            :show-actions="false"
          />
        </div>

        <div v-if="store.selectedItem" class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="font-black text-base-content">
              {{ store.selectedItem.effect.label }} history
            </h3>
            <button
              class="btn btn-ghost btn-xs"
              type="button"
              @click="store.selectSlug(null)"
            >
              <Icon name="kind-icon:x" class="h-4 w-4" />
            </button>
          </div>

          <p class="text-xs text-base-content/60">
            {{ store.selectedItem.effect.tooltip }}
          </p>

          <div
            v-if="store.selectedItem.attempts.length === 0"
            class="rounded-xl border border-dashed border-base-300 p-3 text-center text-xs text-base-content/50"
          >
            No logged build attempts for this effect yet. The next Animation
            Manager build cycle (animation-manager/t-007) can log one via
            componentStore.recordAnimationAttempt.
          </div>

          <div
            v-for="attempt in reversedAttempts(store.selectedItem)"
            :key="attempt.id"
            class="flex flex-col gap-2"
          >
            <component-card
              :component="attempt"
              compact
              :show-actions="false"
            />

            <div class="flex flex-wrap gap-2 pl-1">
              <button
                class="btn btn-xs btn-success rounded-lg"
                type="button"
                :disabled="getStatus(attempt) === 'WORKING'"
                @click="store.promoteAttempt(attempt)"
              >
                <Icon name="kind-icon:trophy" class="h-3 w-3" />
                Promote
              </button>
              <button
                class="btn btn-xs btn-warning rounded-lg"
                type="button"
                :disabled="getStatus(attempt) === 'UNDER_CONSTRUCTION'"
                @click="store.sendToConstruction(attempt)"
              >
                <Icon name="kind-icon:gearhammer" class="h-3 w-3" />
                Polish
              </button>
              <button
                class="btn btn-xs btn-outline rounded-lg"
                type="button"
                :disabled="getStatus(attempt) === 'RETIRED'"
                @click="store.retireAttempt(attempt)"
              >
                <Icon name="kind-icon:x" class="h-3 w-3" />
                Retire
              </button>
              <button
                class="btn btn-xs rounded-lg"
                :class="store.isComparing(attempt.id) ? 'btn-secondary' : 'btn-outline'"
                type="button"
                @click="store.toggleCompare(attempt.id)"
              >
                <Icon name="kind-icon:copy" class="h-3 w-3" />
                Compare
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/animation/animation-manager.vue
import { computed, onMounted, ref } from 'vue'
import ComponentCard from '@/components/wonderlab/component-card.vue'
import { useAnimationManagerStore } from '@/stores/animationManagerStore'
import {
  getComponentStatus,
  type ComponentStatus,
} from '@/utils/wonderlab/componentStatus'
import type { KindComponent } from '@/stores/componentStore'
import type { AnimationGalleryItem } from '@/stores/animationManagerStore'

withDefaults(defineProps<{ showHeader?: boolean }>(), { showHeader: true })

const store = useAnimationManagerStore()
const refreshing = ref(false)

const statusOrder: ComponentStatus[] = [
  'WORKING',
  'UNDER_CONSTRUCTION',
  'BROKEN',
  'NEEDS_CONTEXT',
  'UNREVIEWED',
  'PREVIEW_UNSUPPORTED',
  'RETIRED',
]

const statusLabels: Record<ComponentStatus, string> = {
  UNREVIEWED: 'Unreviewed',
  WORKING: 'Working',
  NEEDS_CONTEXT: 'Needs context',
  UNDER_CONSTRUCTION: 'Building',
  BROKEN: 'Broken',
  RETIRED: 'Retired',
  PREVIEW_UNSUPPORTED: 'Preview unsupported',
}

const builtCount = computed(
  () => store.galleryItems.filter((item) => item.attempts.length > 0).length,
)

function statusBadgeClass(status: ComponentStatus): string {
  switch (status) {
    case 'BROKEN':
      return 'badge-error'
    case 'UNDER_CONSTRUCTION':
      return 'badge-warning'
    case 'WORKING':
      return 'badge-success'
    case 'NEEDS_CONTEXT':
      return 'badge-info'
    case 'PREVIEW_UNSUPPORTED':
      return 'badge-secondary'
    default:
      return 'badge-ghost'
  }
}

function statusCardBorderClass(status: ComponentStatus): string {
  switch (status) {
    case 'BROKEN':
      return 'border-error/50'
    case 'UNDER_CONSTRUCTION':
      return 'border-warning/50'
    case 'WORKING':
      return 'border-success/40'
    case 'NEEDS_CONTEXT':
      return 'border-info/45'
    case 'RETIRED':
      return 'border-base-300 opacity-70'
    default:
      return 'border-base-300'
  }
}

function getStatus(attempt: KindComponent): ComponentStatus {
  return getComponentStatus(attempt)
}

function latestBuildNumber(item: AnimationGalleryItem): string {
  const match = /@v(\d+)$/.exec(item.latestAttempt?.componentName ?? '')
  return match?.[1] ?? '?'
}

function reversedAttempts(item: AnimationGalleryItem): KindComponent[] {
  return [...item.attempts].reverse()
}

function ratingCount(component: KindComponent): number {
  return Math.max(0, Number(component.ratingCount) || 0)
}

function averageRatingLabel(component: KindComponent): string {
  const value = Number(component.averageRating)
  return Number.isFinite(value) ? value.toFixed(1) : '—'
}

async function refresh() {
  refreshing.value = true
  try {
    await store.initialize(true)
  } finally {
    refreshing.value = false
  }
}

onMounted(() => {
  store.initialize()
})
</script>
