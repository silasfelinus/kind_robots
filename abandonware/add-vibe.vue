<!-- /components/vibes/add-vibe.vue -->
<template>
  <div class="container mx-auto max-w-xl py-6">
    <form
      class="bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-5 space-y-4"
      @submit.prevent="submit"
    >
      <!-- Title -->
      <div class="space-y-1">
        <label class="label"><span class="label-text">Vibe title</span></label>
        <input
          v-model.trim="title"
          class="input input-bordered w-full rounded-xl"
          placeholder='e.g. "social justice warlock"'
          required
        />
        <p class="text-xs text-base-content/60">
          Slug: <span class="font-mono">{{ slug }}</span>
        </p>
      </div>

      <!-- Description -->
      <div class="space-y-1">
        <label class="label">
          <span class="label-text">Description (optional)</span>
        </label>
        <textarea
          v-model.trim="description"
          class="textarea textarea-bordered w-full rounded-xl"
          rows="3"
          placeholder="A short flavor line for this vibe…"
        />
      </div>

      <!-- Public toggle -->
      <div class="form-control">
        <label class="label cursor-pointer justify-start gap-3">
          <input type="checkbox" class="toggle" v-model="isPublic" />
          <span class="label-text">Make public</span>
        </label>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 pt-2">
        <button
          type="submit"
          class="btn btn-primary rounded-xl"
          :disabled="saving || !title"
          :aria-busy="saving"
        >
          Create Vibe
        </button>

        <button
          type="button"
          class="btn btn-outline rounded-xl"
          :disabled="saving || !createdSlug"
          @click="joinCreated"
          title="Join the vibe you just made"
        >
          Join Created
        </button>

        <NuxtLink to="/vibes" class="btn btn-ghost rounded-xl">Done</NuxtLink>
      </div>

      <!-- Messages -->
      <div
        v-if="error"
        class="alert alert-error rounded-xl"
        role="alert"
        aria-live="polite"
      >
        {{ error }}
      </div>
      <div
        v-if="notice"
        class="alert alert-success rounded-xl"
        role="status"
        aria-live="polite"
      >
        {{ notice }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
// /components/vibes/add-vibe.vue
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useVibeStore } from '~/abandonware/vibeStore'

const vibeStore = useVibeStore()
const { saving, error } = storeToRefs(vibeStore)

const title = ref('')
const description = ref('')
const isPublic = ref(true)
const createdSlug = ref<string | null>(null)
const notice = ref('')

const slug = computed(() => vibeStore.toSlug(title.value || 'vibe'))

async function submit() {
  notice.value = ''
  if (!title.value) return
  try {
    const created = await vibeStore.createVibe({
      title: title.value,
      description: description.value,
      isPublic: isPublic.value,
    })
    createdSlug.value = slug.value
    notice.value = `Vibe created${created?.id ? ` (#${created.id})` : ''}!`
  } catch {
    // store error already set
  }
}

async function joinCreated() {
  notice.value = ''
  if (!createdSlug.value) return
  try {
    await vibeStore.addVibeToUser(createdSlug.value)
    notice.value = 'Joined your new vibe!'
  } catch {
    // store error already set
  }
}
</script>
