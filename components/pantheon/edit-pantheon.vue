<template>
  <div
    class="bg-base-100 rounded-2xl p-6 w-full max-w-lg shadow-xl border border-base-content/10"
  >
    <h2 class="text-2xl font-bold mb-4 text-center">Edit Pantheon</h2>

    <div class="grid gap-4">
      <label class="form-control">
        <span class="label-text">Name</span>
        <input v-model="store.form.name" class="input input-bordered" />
      </label>

      <label class="form-control">
        <span class="label-text">Slug</span>
        <input v-model="store.form.slug" class="input input-bordered" />
      </label>

      <label class="form-control">
        <span class="label-text">Description</span>
        <textarea
          v-model="store.form.description"
          class="textarea textarea-bordered"
          rows="3"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Cover ArtImage ID</span>
        <input
          v-model.number="store.form.coverArtImageId"
          type="number"
          class="input input-bordered"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Chat ID</span>
        <input
          v-model.number="store.form.chatId"
          type="number"
          class="input input-bordered"
        />
      </label>
    </div>

    <div class="flex justify-end mt-6 gap-2">
      <button class="btn btn-outline btn-sm" @click="$emit('close')">
        Cancel
      </button>
      <button class="btn btn-primary btn-sm" @click="handleSave">Save</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePantheonStore } from '~/stores/pantheonStore'
const store = usePantheonStore()
const emit = defineEmits(['close'])

async function handleSave() {
  const result = await store.save()
  if (result.success) emit('close')
}
</script>
