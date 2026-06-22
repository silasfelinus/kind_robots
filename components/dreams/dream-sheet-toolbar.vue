<!-- /components/dreams/dream-sheet-toolbar.vue -->
<template>
  <aside class="rounded-2xl border border-base-300 bg-base-100/90 p-3 shadow-sm backdrop-blur">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <p class="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-primary">
          <Icon name="kind-icon:file-sparkles" class="h-4 w-4" />
          PitchSheets
        </p>

        <p class="mt-1 text-sm text-base-content/70">
          {{ statusText }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="btn btn-outline btn-sm rounded-xl"
          type="button"
          :disabled="sheetStore.loading || sheetStore.isSaving"
          @click="refreshSheets"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>

        <button
          class="btn btn-primary btn-sm rounded-xl text-white"
          type="button"
          :disabled="!missingDreams.length || sheetStore.isSaving"
          @click="createMissingSheets"
        >
          <Icon name="kind-icon:file-plus" class="h-4 w-4" />
          Create Missing
        </button>
      </div>
    </div>

    <p
      v-if="lastMessage"
      class="mt-3 rounded-2xl border px-3 py-2 text-sm"
      :class="lastSuccess ? 'border-success/30 bg-success/10 text-success' : 'border-error/30 bg-error/10 text-error'"
    >
      {{ lastMessage }}
    </p>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSheetStore } from '@/stores/sheetStore'

const props = withDefaults(
  defineProps<{
    dreams: Array<{ id?: number | null }>
    autoRefresh?: boolean
  }>(),
  {
    autoRefresh: false,
  },
)

const emit = defineEmits<{
  created: [createdCount: number]
  refreshed: []
}>()

const sheetStore = useSheetStore()
const lastMessage = ref('')
const lastSuccess = ref(true)

const validDreams = computed(() => {
  return props.dreams.filter((dream) => Number.isInteger(Number(dream.id)) && Number(dream.id) > 0)
})

const missingDreams = computed(() => {
  return validDreams.value.filter((dream) => !sheetStore.sheetsByDreamId.has(Number(dream.id)))
})

const statusText = computed(() => {
  const total = validDreams.value.length
  const missing = missingDreams.value.length
  const ready = Math.max(total - missing, 0)

  if (!total) return 'No Dreams are currently visible.'
  if (!missing) return `${ready}/${total} visible Dreams already have PitchSheets.`

  return `${ready}/${total} visible Dreams have PitchSheets. ${missing} missing.`
})

async function refreshSheets() {
  await sheetStore.fetchSheets()
  lastMessage.value = 'PitchSheets refreshed.'
  lastSuccess.value = true
  emit('refreshed')
}

async function createMissingSheets() {
  const result = await sheetStore.ensureSheetsForDreams(missingDreams.value)
  lastMessage.value = result.message
  lastSuccess.value = result.success
  emit('created', result.created.length)
}

if (props.autoRefresh) {
  void refreshSheets()
}
</script>
