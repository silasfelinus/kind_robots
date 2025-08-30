<!-- /components/vibes/vibe-gallery.vue -->
<template>
  <div class="container mx-auto max-w-3xl py-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-2xl md:text-3xl font-bold">Choose Your Vibes</h2>
      <NuxtLink to="/addvibes" class="btn btn-primary btn-sm rounded-xl">
        ➕ Add Vibe
      </NuxtLink>
    </div>

    <!-- Active vibes (user) -->
    <div>
      <h3 class="text-lg font-semibold mb-2">Your vibes</h3>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="v in userVibes"
          :key="v.slug"
          class="badge badge-secondary gap-1 rounded-xl"
        >
          {{ v.title }}
          <button
            class="btn btn-ghost btn-xs ml-1"
            title="Leave"
            @click="remove(v.slug)"
          >
            ✕
          </button>
        </span>
        <span v-if="userVibes.length === 0" class="text-base-content/60">
          You haven’t joined any yet.
        </span>
      </div>
    </div>

    <!-- All vibes (gallery) -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold">All vibes</h3>
        <div class="join">
          <input
            v-model="q"
            type="text"
            placeholder="Search vibes…"
            class="input input-sm input-bordered join-item rounded-l-xl"
          />
          <button class="btn btn-sm join-item rounded-r-xl" @click="refresh">
            Refresh
          </button>
        </div>
      </div>

      <div class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <div
          v-for="v in filteredVibes"
          :key="v.id ?? v.slug"
          class="p-4 rounded-2xl border border-base-content/10 bg-base-100 shadow-sm flex flex-col gap-2"
        >
          <div class="text-base font-semibold line-clamp-2">
            {{ v.title }}
          </div>
          <div class="text-sm text-base-content/60 line-clamp-3">
            {{ v.description || 'A mysterious vibe appears…' }}
          </div>

          <div class="mt-2">
            <button
              v-if="!isMember(v.slug)"
              class="btn btn-sm btn-primary w-full rounded-xl"
              :disabled="saving"
              @click="add(v.slug)"
            >
              Join
            </button>
            <button
              v-else
              class="btn btn-sm btn-outline w-full rounded-xl"
              :disabled="saving"
              @click="remove(v.slug)"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      <div v-if="error" class="alert alert-error mt-4 rounded-xl">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/vibes/vibe-gallery.vue
import { onMounted, ref, computed, type ComputedRef, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useVibeStore, type VibeDef, type UserVibe } from '~/stores/vibeStore'
import { useUserStore } from '@/stores/userStore'

const vibeStore = useVibeStore()
const userStore = useUserStore()

// Pinia is typed via your store; storeToRefs preserves types
const { vibes, loading, saving, error } = storeToRefs(vibeStore)

// Local state
const q: Ref<string> = ref('')

// Lifecycle
onMounted(async () => {
  if (!vibes.value?.length) await vibeStore.fetchVibes()
})

// Derived state
const userVibes: ComputedRef<UserVibe[]> = computed(() =>
  vibeStore.getUserVibes(),
)

const filteredVibes: ComputedRef<VibeDef[] | undefined> = computed(() => {
  const list = vibes.value
  if (!list) return list
  const needle = q.value.trim().toLowerCase()
  if (!needle) return list
  return list.filter((v: VibeDef) => {
    const title = v.title.toLowerCase()
    const desc = (v.description ?? '').toLowerCase()
    return title.includes(needle) || desc.includes(needle)
  })
})

// Helpers
function isMember(slug?: string): boolean {
  if (!slug) return false
  return userVibes.value.some((u) => u.slug === slug)
}

// Actions
async function add(slug?: string): Promise<void> {
  if (!slug) return
  await vibeStore.addVibeToUser(slug)
}

async function remove(slug?: string): Promise<void> {
  if (!slug) return
  await vibeStore.removeVibeFromUser(slug)
}

async function refresh(): Promise<void> {
  await vibeStore.fetchVibes()
}
</script>
