<!-- /components/vibes/vibe-academy.vue -->
<template>
  <div class="container mx-auto max-w-3xl py-8 space-y-6">
    <!-- Header -->
    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl md:text-4xl font-extrabold flex items-center gap-3">
          <span class="i-ph-graduation-cap-duotone text-primary"></span>
          Vibe Academy
        </h1>
        <p class="text-base-content/70 mt-1">
          Choose your <span class="font-semibold">main vibe</span>. You can
          change it anytime.
        </p>
      </div>

      <NuxtLink to="/addvibes" class="btn btn-primary btn-sm rounded-xl">
        ➕ Add Vibe
      </NuxtLink>
    </header>

    <!-- Current main vibe -->
    <section
      class="rounded-2xl border border-base-content/10 bg-base-100 p-4 md:p-5 flex items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-xl"
        >
          <span>✨</span>
        </div>
        <div>
          <p class="text-sm text-base-content/60">Your main vibe</p>
          <p class="text-lg font-semibold">
            {{ currentMain?.title ?? 'None selected' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="selectedSlug && selectedSlug !== currentMain?.slug"
          class="btn btn-sm btn-primary rounded-xl"
          :disabled="saving"
          @click="saveMainVibe"
        >
          Save
        </button>
        <button
          v-if="currentMain"
          class="btn btn-sm btn-ghost rounded-xl"
          :disabled="saving"
          @click="clearMainVibe"
        >
          Clear
        </button>
      </div>
    </section>

    <!-- All vibes (pick one) -->
    <section>
      <h2 class="text-xl font-bold mb-3">All Vibes</h2>

      <div
        v-if="loading"
        class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4"
        aria-busy="true"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="animate-pulse rounded-2xl h-36 bg-base-200"
        ></div>
      </div>

      <div
        v-else
        class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4"
      >
        <label
          v-for="v in vibes"
          :key="v.id ?? v.slug"
          class="group cursor-pointer rounded-2xl border border-base-content/10 bg-base-100 shadow-sm p-4 flex flex-col gap-3 hover:border-primary/40 transition"
        >
          <div class="flex items-start gap-3">
            <div
              class="h-10 w-10 rounded-xl bg-base-200 grid place-items-center text-xl"
            >
              <span>{{ v.icon ?? '🎐' }}</span>
            </div>
            <div class="min-w-0">
              <p class="font-semibold leading-tight line-clamp-2">
                {{ v.title }}
              </p>
              <p class="text-sm text-base-content/60 line-clamp-2">
                {{ v.description || 'A mysterious vibe appears…' }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between mt-auto">
            <div class="text-xs text-base-content/60">slug: {{ v.slug }}</div>
            <input
              class="radio radio-primary"
              type="radio"
              name="main-vibe"
              :value="v.slug"
              v-model="selectedSlug"
              :aria-label="`Select ${v.title}`"
            />
          </div>
        </label>
      </div>

      <p
        v-if="!loading && vibes.length === 0"
        class="text-base-content/60 mt-3"
      >
        No vibes found.
      </p>

      <div v-if="error" class="alert alert-error mt-4 rounded-xl">
        {{ error }}
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// /components/vibes/vibe-academy.vue
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useVibeStore, type UserVibe } from '@/stores/vibeStore'
import { useUserStore } from '@/stores/userStore'

const vibeStore = useVibeStore()
const userStore = useUserStore()

const { vibes, loading, saving, error } = storeToRefs(vibeStore)

const selectedSlug = ref<string | null>(null)

/** derive current main vibe from user.vibes[0] (single main vibe) */
const currentMain = computed<UserVibe | null>(() => {
  const raw = (userStore.user as unknown as { vibes?: unknown })?.vibes
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0] as UserVibe
    if (first && typeof first.slug === 'string') return first
  }
  return null
})

onMounted(async () => {
  if (!vibes.value?.length) await vibeStore.fetchVibes()
  selectedSlug.value = currentMain.value?.slug ?? null
})

/** Save selected as sole main vibe */
async function saveMainVibe() {
  if (!selectedSlug.value) return
  const sel = vibes.value.find((v) => v.slug === selectedSlug.value)
  if (!sel) return
  await vibeStore.patchUserVibes([{ title: sel.title, slug: sel.slug }])
}

/** Clear main vibe entirely */
async function clearMainVibe() {
  await vibeStore.patchUserVibes([])
  selectedSlug.value = null
}
</script>

<style scoped>
input[type='radio']:hover {
  filter: brightness(1.05);
}
</style>
