<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4">
    <header class="flex items-start gap-3">
      <div class="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
        <Icon name="kind-icon:wand" class="size-6" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold uppercase tracking-wide text-primary/70">Wishmaster</p>
        <h2 class="text-2xl font-black leading-tight">Wish dreams</h2>
        <p class="mt-1 text-sm leading-relaxed text-base-content/70">
          A wish is a Dream with <code class="rounded bg-base-200 px-1">dreamType: WISH</code> and no project attachment. A project gets the infrastructure; a wish keeps the request lightweight.
        </p>
      </div>
    </header>

    <div class="grid gap-3 md:grid-cols-3">
      <article class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <p class="text-xs font-bold uppercase tracking-wide text-base-content/40">Active</p>
        <p class="mt-2 text-3xl font-black text-primary">{{ activeWishes.length }}</p>
      </article>
      <article class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <p class="text-xs font-bold uppercase tracking-wide text-base-content/40">Total</p>
        <p class="mt-2 text-3xl font-black text-secondary">{{ wishDreams.length }}</p>
      </article>
      <article class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <p class="text-xs font-bold uppercase tracking-wide text-base-content/40">Inactive</p>
        <p class="mt-2 text-3xl font-black text-base-content/40">{{ inactiveWishes.length }}</p>
      </article>
    </div>

    <form class="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4" @submit.prevent="submitWish">
      <h3 class="text-xs font-bold uppercase tracking-wide text-primary/70">New Wish</h3>
      <input v-model="newWishTitle" type="text" placeholder="Request title" class="input input-bordered w-full rounded-xl" :disabled="dreamStore.isSaving" />
      <textarea v-model="newWishPitch" placeholder="What should Wishmaster help with?" class="textarea textarea-bordered w-full rounded-xl text-sm leading-relaxed" rows="3" :disabled="dreamStore.isSaving" />
      <div class="flex items-center gap-2">
        <p v-if="saveMessage" class="text-xs" :class="saveError ? 'text-error' : 'text-success'">{{ saveMessage }}</p>
        <button type="submit" class="btn btn-primary btn-sm ml-auto rounded-xl" :disabled="!newWishTitle.trim() || dreamStore.isSaving">
          <Icon name="kind-icon:wand" class="size-4" /> Save
        </button>
      </div>
    </form>

    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-xs font-bold uppercase tracking-wide text-base-content/50">Recent wish dreams</h3>
        <span v-if="dreamStore.loading" class="loading loading-spinner loading-xs text-primary" />
      </div>
      <article v-for="wish in recentWishes" :key="wish.id" class="rounded-2xl border border-base-300 bg-base-100 px-4 py-3">
        <div class="flex items-start gap-3">
          <Icon name="kind-icon:sparkles" class="mt-0.5 size-4 shrink-0 text-primary" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold">{{ wish.title }}</p>
            <p v-if="wish.pitch" class="mt-2 line-clamp-2 text-xs leading-relaxed text-base-content/60">{{ wish.pitch }}</p>
          </div>
          <span class="badge badge-xs shrink-0" :class="wish.isActive ? 'badge-success' : 'badge-ghost'">{{ wish.isActive ? 'active' : 'inactive' }}</span>
        </div>
      </article>
      <p v-if="!dreamStore.loading && !recentWishes.length" class="rounded-2xl border border-dashed border-base-300 bg-base-200/50 p-6 text-center text-sm text-base-content/50">No wish dreams yet.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'

const dreamStore = useDreamStore()
const newWishTitle = ref('')
const newWishPitch = ref('')
const saveMessage = ref('')
const saveError = ref(false)

const wishDreams = computed(() => dreamStore.dreams.filter((dream) => dream.dreamType === 'WISH'))
const activeWishes = computed(() => wishDreams.value.filter((wish) => wish.isActive))
const inactiveWishes = computed(() => wishDreams.value.filter((wish) => !wish.isActive))
const recentWishes = computed(() => wishDreams.value.slice(0, 8))

async function submitWish() {
  const title = newWishTitle.value.trim()
  if (!title) return
  saveMessage.value = ''
  saveError.value = false
  const pitch = newWishPitch.value.trim() || title
  const result = await dreamStore.createDream({
    title,
    pitch,
    description: pitch,
    flavorText: 'A focused Wishmaster request.',
    dreamType: 'WISH',
    icon: 'kind-icon:wand',
    creationSource: 'HUMAN',
    isPublic: false,
    isMature: false,
    isActive: true,
  })
  if (result.success) {
    newWishTitle.value = ''
    newWishPitch.value = ''
    saveMessage.value = 'Wish saved.'
  } else {
    saveError.value = true
    saveMessage.value = result.message || 'Save failed.'
  }
}

onMounted(() => {
  if (!dreamStore.hasLoaded || !wishDreams.value.length) dreamStore.fetchDreams({ showInactive: true, limit: 200 })
})
</script>
