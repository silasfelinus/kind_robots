<!-- /components/dreams/dream-prompts.vue -->
<template>
  <section class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12">
    <div class="space-y-4 xl:col-span-7">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow">
        <p class="text-xs font-bold uppercase tracking-wide text-primary">
          Location Prompt Lab
        </p>
        <h2 class="text-2xl font-black text-base-content">
          Shape the Dream
        </h2>
        <p class="text-sm text-base-content/70">
          These prompts define the place. The chat can mutate the vibe, but this is the master lantern string.
        </p>
      </div>

      <label class="form-control">
        <span class="label-text font-bold">Current vibe</span>
        <textarea
          v-model="localVibe"
          class="textarea textarea-bordered min-h-32 rounded-2xl"
          placeholder="Describe how the place feels."
        />
      </label>

      <label class="form-control">
        <span class="label-text font-bold">Image/story prompt</span>
        <textarea
          v-model="localPrompt"
          class="textarea textarea-bordered min-h-32 rounded-2xl"
          placeholder="Describe what should be generated or narrated."
        />
      </label>

      <div class="flex flex-wrap gap-2">
        <button
          class="btn btn-primary rounded-2xl"
          type="button"
          :disabled="dreamStore.isSaving || !canSave"
          @click="savePrompt"
        >
          <Icon name="kind-icon:save" class="h-5 w-5" />
          Save Prompt
        </button>

        <button
          class="btn btn-secondary rounded-2xl"
          type="button"
          @click="copyVibeToPrompt"
        >
          <Icon name="kind-icon:copy" class="h-5 w-5" />
          Vibe to Prompt
        </button>

        <button
          class="btn btn-accent rounded-2xl"
          type="button"
          @click="randomize"
        >
          <Icon name="kind-icon:sparkles" class="h-5 w-5" />
          Random Seed
        </button>
      </div>
    </div>

    <aside class="space-y-4 xl:col-span-5">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow">
        <p class="text-xs font-bold uppercase tracking-wide text-primary">
          Active Dream
        </p>
        <h3 class="text-xl font-black text-secondary">
          {{ dreamStore.selectedDream?.title || dreamStore.dreamForm.title || 'Untitled Dream' }}
        </h3>
        <p class="mt-2 whitespace-pre-wrap text-sm text-base-content/70">
          {{ previewText }}
        </p>
      </div>

      <dream-list list-type="chats" />
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'

const dreamStore = useDreamStore()
const localVibe = ref('')
const localPrompt = ref('')

const canSave = computed(() => Boolean(localVibe.value.trim()))

const previewText = computed(() => {
  return localPrompt.value || localVibe.value || 'No prompt loaded yet.'
})

watch(
  () => dreamStore.selectedDream?.id,
  () => syncLocal(),
)

watch(
  () => dreamStore.dreamForm.currentPrompt,
  () => syncLocal(),
)

onMounted(async () => {
  await dreamStore.initialize()
  syncLocal()
})

function syncLocal() {
  localVibe.value = dreamStore.dreamForm.currentVibe || dreamStore.selectedDream?.currentVibe || ''
  localPrompt.value =
    dreamStore.dreamForm.currentPrompt ||
    dreamStore.selectedDream?.currentPrompt ||
    localVibe.value
}

function copyVibeToPrompt() {
  localPrompt.value = localVibe.value
}

function randomize() {
  const seed = dreamStore.randomDream()
  localVibe.value = seed
  localPrompt.value = seed
}

async function savePrompt() {
  dreamStore.setDreamForm({
    currentVibe: localVibe.value,
    currentPrompt: localPrompt.value,
  })

  if (!dreamStore.selectedDream?.id) {
    await dreamStore.saveDream()
    return
  }

  const result = await dreamStore.updateSelectedDream({
    currentVibe: localVibe.value,
    currentPrompt: localPrompt.value,
    updateNote: 'Updated the Dream prompt lab settings.',
  })

  if (result.success) {
    await dreamStore.addModelDreamMessage('Dream prompt updated.', {
      updateDream: false,
      currentVibe: localVibe.value,
      currentPrompt: localPrompt.value,
    })
  }
}
</script>
