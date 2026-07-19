<!-- /components/wonderlab/component-card.vue -->
<template>
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :show-reaction="showReaction"
    :target-id="component.id"
    target-type="component"
    reaction-category="COMPONENT"
    :target-title="componentTitle"
    :card-class="statusCardClass"
    @select="selectComponent"
  >
    <template #actions>
      <button
        v-if="showActions && allowEdit && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Component"
        @click.stop="emit('edit', component.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && allowCopyName && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-secondary shadow transition hover:bg-secondary hover:text-secondary-content"
        type="button"
        title="Copy Component Name"
        @click.stop="copyComponentName"
      >
        <Icon name="kind-icon:copy" class="h-4 w-4" />
      </button>
    </template>

    <div class="flex min-w-0 items-start gap-3">
      <div
        :class="[
          'flex shrink-0 items-center justify-center rounded-2xl border',
          compact ? 'h-12 w-12' : 'h-16 w-16',
          statusIconClass,
        ]"
      >
        <Icon :name="statusIcon" class="h-7 w-7" />
      </div>

      <div class="min-w-0 flex-1">
        <h3
          :class="[
            'truncate font-black leading-tight text-base-content',
            compact ? 'text-base' : 'text-lg',
          ]"
          :title="componentTitle"
        >
          {{ componentTitle }}
        </h3>

        <p class="mt-1 truncate text-sm font-semibold text-base-content/60">
          {{ component.componentName }}
        </p>

        <p class="mt-1 truncate text-xs text-base-content/45">
          {{ component.folderName }}
        </p>
      </div>
    </div>

    <p
      v-if="showNotes && summaryText"
      :class="[
        'text-sm leading-relaxed text-base-content/65',
        compact ? 'line-clamp-2' : 'line-clamp-3',
      ]"
    >
      {{ summaryText }}
    </p>

    <div v-if="showStatus" class="flex flex-wrap gap-2">
      <span class="badge badge-sm" :class="statusBadgeClass">
        {{ statusLabel }}
      </span>

      <span
        v-if="component.isDiscovered === false"
        class="badge badge-warning badge-outline badge-sm"
      >
        Not discovered
      </span>

      <span
        v-if="component.previewMode"
        class="badge badge-info badge-outline badge-sm"
      >
        {{ component.previewMode }}
      </span>

      <span v-if="component.artImageId" class="badge badge-primary badge-sm">
        Art #{{ component.artImageId }}
      </span>
    </div>

    <div
      v-if="showMetrics"
      class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-base-300/70 pt-2 text-xs text-base-content/60"
    >
      <span v-if="ratingCount" class="font-bold text-warning-content">
        ★ {{ averageRatingLabel }}
        <span class="font-normal text-base-content/45">({{ ratingCount }})</span>
      </span>
      <span v-else class="text-base-content/45">No ratings</span>

      <span>
        {{ reviewCount }} {{ reviewCount === 1 ? 'review' : 'reviews' }}
      </span>

      <span v-if="!compact && reviewedLabel" class="text-base-content/45">
        Reviewed {{ reviewedLabel }}
      </span>
    </div>

    <div
      v-if="showMeta"
      class="grid grid-cols-2 gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-xs"
    >
      <div>
        <p class="font-bold uppercase text-base-content/45">Folder</p>
        <p class="truncate text-base-content/75">
          {{ component.folderName }}
        </p>
      </div>

      <div>
        <p class="font-bold uppercase text-base-content/45">ID</p>
        <p class="truncate text-base-content/75">#{{ component.id }}</p>
      </div>

      <div>
        <p class="font-bold uppercase text-base-content/45">Updated</p>
        <p class="truncate text-base-content/75">
          {{ updatedLabel }}
        </p>
      </div>

      <div>
        <p class="font-bold uppercase text-base-content/45">Status</p>
        <p class="truncate text-base-content/75">
          {{ statusLabel }}
        </p>
      </div>
    </div>

    <button
      v-if="showSelectButton"
      class="btn btn-sm mt-auto rounded-xl"
      :class="activeSelected ? 'btn-primary text-white' : 'btn-outline'"
      type="button"
      @click.stop="selectComponent"
    >
      <Icon name="kind-icon:check" class="h-4 w-4" />
      {{ activeSelected ? 'Selected' : 'Open exhibit' }}
    </button>

    <details
      v-if="showDebug"
      class="rounded-2xl border border-base-300 bg-base-100 p-2"
      @click.stop
    >
      <summary class="cursor-pointer text-xs font-bold text-base-content/70">
        Debug
      </summary>

      <pre class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70">{{
        JSON.stringify(component, null, 2)
      }}</pre>
    </details>
  </reactable-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KindComponent as Component } from '@/stores/componentStore'
import { useComponentStore } from '@/stores/componentStore'
import {
  getComponentStatus,
  type ComponentStatus,
} from '@/utils/wonderlab/componentStatus'

const props = withDefaults(
  defineProps<{
    component: Component
    selected?: boolean
    compact?: boolean
    showActions?: boolean
    showReaction?: boolean
    showStatus?: boolean
    showNotes?: boolean
    showMetrics?: boolean
    showMeta?: boolean
    showSelectButton?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowCopyName?: boolean
  }>(),
  {
    selected: false,
    compact: false,
    showActions: true,
    showReaction: true,
    showStatus: true,
    showNotes: true,
    showMetrics: true,
    showMeta: false,
    showSelectButton: false,
    showDebug: false,
    allowEdit: true,
    allowCopyName: true,
  },
)

const emit = defineEmits<{
  edit: [id: number]
  copied: [name: string]
}>()

const componentStore = useComponentStore()

const activeSelected = computed(() => {
  return (
    props.selected ||
    componentStore.selectedComponent?.id === props.component.id
  )
})

const componentTitle = computed(() => {
  return (
    props.component.title ||
    props.component.componentName ||
    `Component #${props.component.id}`
  )
})

const summaryText = computed(
  () =>
    props.component.description ||
    props.component.statusReason ||
    props.component.notes ||
    '',
)

const reviewCount = computed(() =>
  Math.max(0, Number(props.component.reviewCount) || 0),
)
const ratingCount = computed(() =>
  Math.max(0, Number(props.component.ratingCount) || 0),
)
const averageRatingLabel = computed(() => {
  const value = Number(props.component.averageRating)
  return Number.isFinite(value) ? value.toFixed(1) : '—'
})

const componentStatus = computed(() => getComponentStatus(props.component))

const statusLabels: Record<ComponentStatus, string> = {
  UNREVIEWED: 'Unreviewed',
  WORKING: 'Working',
  NEEDS_CONTEXT: 'Needs context',
  UNDER_CONSTRUCTION: 'Building',
  BROKEN: 'Broken',
  RETIRED: 'Retired',
  PREVIEW_UNSUPPORTED: 'Preview unsupported',
}

const statusLabel = computed(() => statusLabels[componentStatus.value])

const statusIcon = computed(() => {
  switch (componentStatus.value) {
    case 'BROKEN':
      return 'kind-icon:warning'
    case 'UNDER_CONSTRUCTION':
      return 'kind-icon:hammer'
    case 'WORKING':
      return 'kind-icon:check'
    case 'NEEDS_CONTEXT':
      return 'kind-icon:gearhammer'
    case 'RETIRED':
      return 'kind-icon:x'
    case 'PREVIEW_UNSUPPORTED':
      return 'kind-icon:warning'
    default:
      return 'kind-icon:sparkles'
  }
})

const statusIconClass = computed(() => {
  switch (componentStatus.value) {
    case 'BROKEN':
      return 'border-error bg-error/10 text-error'
    case 'UNDER_CONSTRUCTION':
      return 'border-warning bg-warning/10 text-warning'
    case 'WORKING':
      return 'border-success bg-success/10 text-success'
    case 'NEEDS_CONTEXT':
      return 'border-info bg-info/10 text-info'
    case 'RETIRED':
      return 'border-base-300 bg-base-200 text-base-content/55'
    case 'PREVIEW_UNSUPPORTED':
      return 'border-secondary bg-secondary/10 text-secondary'
    default:
      return 'border-accent bg-accent/10 text-accent'
  }
})

const statusBadgeClass = computed(() => {
  switch (componentStatus.value) {
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
})

const statusCardClass = computed(() => {
  switch (componentStatus.value) {
    case 'BROKEN':
      return 'border-error/50'
    case 'UNDER_CONSTRUCTION':
      return 'border-warning/50'
    case 'WORKING':
      return 'border-success/40'
    case 'NEEDS_CONTEXT':
      return 'border-info/45'
    case 'PREVIEW_UNSUPPORTED':
      return 'border-secondary/40'
    case 'RETIRED':
      return 'opacity-70'
    default:
      return ''
  }
})

const updatedLabel = computed(() => formatDate(props.component.updatedAt || props.component.createdAt))
const reviewedLabel = computed(() => formatDate(props.component.lastReviewedAt))

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString()
}

function selectComponent() {
  componentStore.selectedComponent = props.component
}

async function copyComponentName() {
  const name = props.component.componentName || componentTitle.value

  await navigator.clipboard.writeText(name)
  emit('copied', name)
}
</script>
