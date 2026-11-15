<template>
  <section class="flex flex-col gap-3" data-testid="advert-edit-panel">
    <form class="flex flex-col gap-2" @submit.prevent="submit">
      <div
        class="flex flex-wrap gap-1"
        role="group"
        aria-label="What to change"
      >
        <button
          v-for="option in ADVERT_EDIT_FIELDS"
          :key="option"
          type="button"
          class="btn btn-xs rounded-lg capitalize"
          :class="
            field === option ? 'btn-primary' : 'btn-ghost border-base-300'
          "
          :aria-pressed="field === option"
          @click="field = option"
        >
          {{ option }}
        </button>
      </div>
      <textarea
        v-model="text"
        class="kr-textarea min-h-28 rounded-xl text-sm"
        rows="5"
        maxlength="4000"
        :placeholder="`What should change on the ${poster.name} poster?`"
      />
      <div class="flex items-center gap-2">
        <select v-model="priority" class="kr-select-sm" aria-label="Priority">
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
        </select>
        <button
          type="submit"
          class="kr-btn-primary ml-auto"
          :disabled="isFiling || !text.trim()"
        >
          <span v-if="isFiling" class="loading loading-spinner loading-xs" />
          Request edit
        </button>
      </div>
    </form>

    <div v-if="requests.length" class="flex flex-col gap-1">
      <p class="text-xs font-bold uppercase tracking-wide text-base-content/60">
        Recent requests
      </p>
      <ul class="flex flex-col gap-1">
        <li
          v-for="todo in requests"
          :key="todo.id"
          class="flex items-center gap-2 rounded-lg bg-base-200 px-2 py-1 text-xs"
        >
          <span
            class="badge badge-xs shrink-0"
            :class="todo.status === 'DONE' ? 'badge-success' : 'badge-ghost'"
            >{{ todo.status }}</span
          >
          <span class="min-w-0 truncate" :title="todo.title">{{
            todo.title
          }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdvertStore } from '@/stores/advertStore'
import type { TodoPriority } from '@/stores/todoStore'
import {
  ADVERT_EDIT_FIELDS,
  type AdvertEditField,
  type AdvertPoster,
} from '@/utils/adverts/posters'

const props = defineProps<{ poster: AdvertPoster }>()

const advertStore = useAdvertStore()
const { isFiling } = storeToRefs(advertStore)

const field = ref<AdvertEditField>('headline')
const text = ref('')
const priority = ref<TodoPriority>('NORMAL')

const requests = computed(() => advertStore.requestsFor(props.poster.slug))

async function submit(): Promise<void> {
  const filed = await advertStore.fileEditRequest({
    posterSlug: props.poster.slug,
    field: field.value,
    text: text.value,
    priority: priority.value,
  })
  if (filed) text.value = ''
}

watch(
  () => props.poster.slug,
  (slug) => void advertStore.loadRequests(slug),
)

onMounted(() => void advertStore.loadRequests(props.poster.slug))
</script>
