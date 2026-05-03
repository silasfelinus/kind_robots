<!-- /components/content/dream/edit-dream.vue -->
<template>
  <section
    class="w-full max-w-3xl rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl sm:p-6"
  >
    <header class="mb-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 class="text-2xl font-black text-primary">Edit Dream</h2>
        <p class="text-sm text-base-content/60">
          Tune the current dream state without touching its reusable assets.
        </p>
      </div>

      <button
        type="button"
        class="btn btn-sm btn-ghost rounded-2xl"
        @click="emit('close')"
      >
        <Icon name="kind-icon:x" class="h-5 w-5" />
      </button>
    </header>

    <div
      v-if="!dreamStore.dreamForm.id"
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Select a dream before editing. The dream goblin refuses to edit fog.
    </div>

    <form v-else class="grid gap-4" @submit.prevent="handleSave">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label class="form-control">
          <span class="label-text font-bold">Title</span>
          <input
            v-model="dreamStore.dreamForm.title"
            class="input input-bordered rounded-2xl"
            placeholder="Dream title"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Slug</span>
          <input
            v-model="dreamStore.dreamForm.slug"
            class="input input-bordered rounded-2xl"
            placeholder="dream-slug"
          />
        </label>
      </div>

      <label class="form-control">
        <span class="label-text font-bold">Description</span>
        <textarea
          v-model="dreamStore.dreamForm.description"
          class="textarea textarea-bordered min-h-20 resize-none rounded-2xl"
          placeholder="Optional description"
        />
      </label>

      <label class="form-control">
        <span class="label-text font-bold">Current Vibe</span>
        <textarea
          v-model="dreamStore.dreamForm.currentVibe"
          class="textarea textarea-bordered min-h-32 resize-none rounded-2xl"
          placeholder="Current dream state"
        />
      </label>

      <label class="form-control">
        <span class="label-text font-bold">Current Prompt</span>
        <textarea
          v-model="dreamStore.dreamForm.currentPrompt"
          class="textarea textarea-bordered min-h-28 resize-none rounded-2xl"
          placeholder="Prompt for model actions"
        />
      </label>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label class="form-control">
          <span class="label-text font-bold">Pitch ID</span>
          <input
            v-model.number="dreamStore.dreamForm.pitchId"
            type="number"
            min="1"
            class="input input-bordered rounded-2xl"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Art ID</span>
          <input
            v-model.number="dreamStore.dreamForm.artId"
            type="number"
            min="1"
            class="input input-bordered rounded-2xl"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">ArtImage ID</span>
          <input
            v-model.number="dreamStore.dreamForm.artImageId"
            type="number"
            min="1"
            class="input input-bordered rounded-2xl"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Collection ID</span>
          <input
            v-model.number="dreamStore.dreamForm.artCollectionId"
            type="number"
            min="1"
            class="input input-bordered rounded-2xl"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Gallery ID</span>
          <input
            v-model.number="dreamStore.dreamForm.galleryId"
            type="number"
            min="1"
            class="input input-bordered rounded-2xl"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Scenario ID</span>
          <input
            v-model.number="dreamStore.dreamForm.scenarioId"
            type="number"
            min="1"
            class="input input-bordered rounded-2xl"
          />
        </label>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label
          class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
        >
          <span class="label-text font-bold">Public</span>
          <input
            v-model="dreamStore.dreamForm.isPublic"
            type="checkbox"
            class="toggle toggle-success"
          />
        </label>

        <label
          class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
        >
          <span class="label-text font-bold">Mature</span>
          <input
            v-model="dreamStore.dreamForm.isMature"
            type="checkbox"
            class="toggle toggle-warning"
          />
        </label>

        <label
          class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
        >
          <span class="label-text font-bold">Active</span>
          <input
            v-model="dreamStore.dreamForm.isActive"
            type="checkbox"
            class="toggle toggle-primary"
          />
        </label>
      </div>

      <div
        v-if="dreamStore.error"
        class="rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
      >
        {{ dreamStore.error }}
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="btn btn-outline btn-sm rounded-2xl"
          @click="emit('close')"
        >
          Cancel
        </button>

        <button
          type="submit"
          class="btn btn-primary btn-sm rounded-2xl text-white"
          :disabled="dreamStore.isSaving || !canSave"
        >
          {{ dreamStore.isSaving ? 'Saving...' : 'Save Dream' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
// /components/content/dream/edit-dream.vue
import { computed } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'

const dreamStore = useDreamStore()
const emit = defineEmits(['close'])

const canSave = computed(() =>
  Boolean(
    dreamStore.dreamForm.title?.trim() &&
    dreamStore.dreamForm.currentVibe?.trim(),
  ),
)

async function handleSave() {
  const result = await dreamStore.saveDream()

  if (result.success) {
    emit('close')
  }
}
</script>
