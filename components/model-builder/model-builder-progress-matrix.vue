<!-- /components/model-builder/model-builder-progress-matrix.vue -->
<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <div class="flex items-start justify-between gap-2">
      <div>
        <h3 class="text-base font-black text-base-content">3. Build run</h3>
        <p class="mt-1 text-xs text-base-content/60">
          <span class="font-bold text-base-content">{{ run?.sourceLabel }}</span>
          · {{ recipeLabel }} ·
          {{ store.runProgress.committed }}/{{ store.runProgress.total }} committed
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          class="btn btn-xs btn-primary rounded-xl"
          :disabled="store.autoBuilding"
          title="Draft, generate, and commit every item automatically"
          @click="store.autoBuildRun()"
        >
          <span v-if="store.autoBuilding" class="loading loading-dots loading-xs" />
          <template v-else>
            <Icon name="kind-icon:bolt" class="h-3.5 w-3.5" />
            Auto-build all
          </template>
        </button>
        <button
          type="button"
          class="btn btn-xs btn-ghost rounded-xl text-base-content/60"
          @click="store.resetRun()"
        >
          <Icon name="kind-icon:arrow-left" class="h-3.5 w-3.5" />
          New run
        </button>
      </div>
    </div>

    <!-- Source context: what we already have on the record we're building from -->
    <div
      v-if="source"
      class="flex items-start gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <div
        class="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-base-200"
      >
        <img
          v-if="sourceImage"
          :src="sourceImage"
          :alt="run?.sourceLabel"
          class="h-full w-full object-cover"
          loading="lazy"
        />
        <Icon v-else name="kind-icon:blueprint" class="h-6 w-6 text-base-content/30" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <span class="truncate text-sm font-bold text-base-content">
            {{ run?.sourceLabel }}
          </span>
          <span class="badge badge-xs badge-ghost">{{ run?.sourceType }}</span>
          <span class="text-[10px] text-base-content/35">#{{ run?.sourceId }}</span>
        </div>
        <p
          v-if="sourceBlurb"
          class="mt-0.5 line-clamp-3 text-xs leading-snug text-base-content/60"
        >
          {{ sourceBlurb }}
        </p>
        <p v-else class="mt-0.5 text-xs italic text-base-content/40">
          No description on this record yet.
        </p>
      </div>
    </div>

    <!-- Stage matrix -->
    <div class="overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
      <table class="table table-sm">
        <thead>
          <tr>
            <th class="text-xs">Item</th>
            <th
              v-for="stage in stages"
              :key="stage.key"
              class="text-center text-xs"
            >
              {{ stage.short }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in run?.items"
            :key="item.id"
            class="cursor-pointer transition"
            :class="item.id === selectedItemId ? 'bg-primary/10' : 'hover:bg-base-200'"
            @click="selectedItemId = item.id"
          >
            <td class="max-w-[10rem] truncate text-xs font-semibold">
              {{ item.label }}
            </td>
            <td
              v-for="stage in stages"
              :key="stage.key"
              class="text-center"
            >
              <span
                class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                :class="statusClass(item.stages[stage.key].status)"
                :title="item.stages[stage.key].status"
              >
                <Icon :name="statusIcon(item.stages[stage.key].status)" class="h-3 w-3" />
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Selected item panel -->
    <model-builder-item-panel
      v-if="selectedItem"
      :key="selectedItem.id"
      :item-id="selectedItem.id"
    />
    <div
      v-else
      class="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center text-sm text-base-content/50"
    >
      Select a row to work through its stages.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModelBuilderStore } from '@/stores/modelBuilderStore'
import { BUILD_STAGES, getRecipe } from '@/stores/helpers/modelBuilderRecipes'
import type { StageStatus } from '@/stores/modelBuilderStore'

const store = useModelBuilderStore()
const stages = BUILD_STAGES

const run = computed(() => store.run)
const recipeLabel = computed(() =>
  run.value ? getRecipe(run.value.recipeKey)?.label : '',
)

// The source record we're building from — snapshot survives resume; fall back to
// the freshly-picked record.
const source = computed<Record<string, unknown> | null>(
  () => run.value?.sourceSnapshot ?? store.selectedSource ?? null,
)

function str(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

const sourceImage = computed(() => {
  const record = source.value
  if (!record) return ''
  const art = record.ArtImage as
    | { thumbnailPath?: string; imagePath?: string }
    | undefined
  return (
    str(record, 'imagePath') ||
    str(record, 'avatarImage') ||
    art?.thumbnailPath ||
    art?.imagePath ||
    ''
  )
})

const sourceBlurb = computed(() => {
  const record = source.value
  if (!record) return ''
  for (const key of [
    'description',
    'pitch',
    'backstory',
    'flavorText',
    'botIntro',
    'subtitle',
  ]) {
    const value = str(record, key)
    if (value.trim()) return value
  }
  return ''
})

const selectedItemId = ref<string>(run.value?.items[0]?.id ?? '')
const selectedItem = computed(() =>
  run.value?.items.find((item) => item.id === selectedItemId.value),
)

function statusClass(status: StageStatus): string {
  switch (status) {
    case 'approved':
      return 'bg-success/20 text-success'
    case 'ready':
      return 'bg-primary/20 text-primary'
    case 'in-progress':
      return 'bg-info/20 text-info animate-pulse'
    case 'rejected':
      return 'bg-error/20 text-error'
    case 'stale':
      return 'bg-warning/20 text-warning'
    default:
      return 'bg-base-300 text-base-content/40'
  }
}

function statusIcon(status: StageStatus): string {
  switch (status) {
    case 'approved':
      return 'kind-icon:check'
    case 'ready':
      return 'kind-icon:pencil'
    case 'in-progress':
      return 'kind-icon:loading'
    case 'rejected':
      return 'kind-icon:x'
    case 'stale':
      return 'kind-icon:refresh'
    default:
      return 'kind-icon:lock'
  }
}
</script>
