<!-- /components/content/wonderlab/component-card.vue -->
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
      v-if="showNotes && component.notes"
      :class="[
        'text-sm leading-relaxed text-base-content/65',
        compact ? 'line-clamp-2' : 'line-clamp-3',
      ]"
    >
      {{ component.notes }}
    </p>

    <div v-if="showStatus" class="flex flex-wrap gap-2">
      <span
        class="badge badge-sm"
        :class="component.isWorking ? 'badge-success' : 'badge-ghost'"
      >
        {{ component.isWorking ? 'Working' : 'Not verified' }}
      </span>

      <span
        v-if="component.underConstruction"
        class="badge badge-warning badge-sm"
      >
        Building
      </span>

      <span v-if="component.isBroken" class="badge badge-error badge-sm">
        Broken
      </span>

      <span v-if="component.artImageId" class="badge badge-primary badge-sm">
        Art #{{ component.artImageId }}
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
      {{ activeSelected ? 'Selected' : 'Select' }}
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
// /components/content/wonderlab/component-card.vue
import { computed } from 'vue'
import type { KindComponent as Component } from '@/stores/componentStore'
import { useComponentStore } from '@/stores/componentStore'

const props = withDefaults(
  defineProps<{
    component: Component
    selected?: boolean
    compact?: boolean
    showActions?: boolean
    showReaction?: boolean
    showStatus?: boolean
    showNotes?: boolean
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

const statusLabel = computed(() => {
  if (props.component.isBroken) return 'Broken'
  if (props.component.underConstruction) return 'Building'
  if (props.component.isWorking) return 'Working'

  return 'Unverified'
})

const statusIcon = computed(() => {
  if (props.component.isBroken) return 'kind-icon:warning'
  if (props.component.underConstruction) return 'kind-icon:hammer'
  if (props.component.isWorking) return 'kind-icon:check'

  return 'kind-icon:sparkles'
})

const statusIconClass = computed(() => {
  if (props.component.isBroken) {
    return 'border-error bg-error/10 text-error'
  }

  if (props.component.underConstruction) {
    return 'border-warning bg-warning/10 text-warning'
  }

  if (props.component.isWorking) {
    return 'border-success bg-success/10 text-success'
  }

  return 'border-accent bg-accent/10 text-accent'
})

const statusCardClass = computed(() => {
  if (props.component.isBroken) return 'border-error/50'
  if (props.component.underConstruction) return 'border-warning/50'
  if (props.component.isWorking) return 'border-success/40'

  return ''
})

const updatedLabel = computed(() => {
  const value = props.component.updatedAt || props.component.createdAt

  if (!value) return 'n/a'

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) return 'n/a'

  return date.toLocaleDateString()
})

function selectComponent() {
  componentStore.selectedComponent = props.component
}

async function copyComponentName() {
  const name = props.component.componentName || componentTitle.value

  await navigator.clipboard.writeText(name)
  emit('copied', name)
}
</script>
