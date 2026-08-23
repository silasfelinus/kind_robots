<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-4 p-4 md:p-6">
      <header class="kr-toolbar flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-primary">
            Achievement administration
          </p>
          <p class="mt-1 text-2xl font-black">Achievement artwork</p>
          <p class="mt-1 text-sm text-base-content/60">
            Generate, upload, and replace the image attached to each achievement definition.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-primary btn-sm rounded-xl"
          :disabled="loading"
          @click="loadAchievements(true)"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs" />
          Refresh
        </button>
      </header>

      <div v-if="!ready" class="grid min-h-52 place-items-center kr-panel">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="!userStore.isAdmin"
        class="rounded-2xl border border-error/40 bg-error/10 p-8 text-center"
      >
        <p class="text-xl font-black">Administrator access required</p>
        <p class="mt-2 text-sm text-base-content/60">
          Achievement artwork management is restricted to administrators.
        </p>
      </div>

      <template v-else>
        <section class="grid gap-4 lg:grid-cols-[minmax(260px,0.38fr)_minmax(0,1fr)]">
          <aside class="kr-panel space-y-3 p-4">
            <label class="form-control gap-1">
              <span class="text-xs font-bold text-base-content/60">Find achievement</span>
              <input
                v-model="search"
                type="search"
                class="input input-bordered input-sm rounded-xl"
                placeholder="Search label, trigger, or message"
              />
            </label>

            <div class="flex flex-wrap gap-2 text-xs">
              <span class="badge badge-ghost">{{ achievements.length }} total</span>
              <span class="badge badge-warning">{{ missingArtCount }} without art</span>
            </div>

            <div class="space-y-2 pr-1">
              <button
                v-for="achievement in filteredAchievements"
                :key="achievement.id"
                type="button"
                class="flex w-full items-center gap-3 rounded-xl border p-2 text-left transition"
                :class="selectedId === achievement.id
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 bg-base-100 hover:border-primary/50'"
                @click="selectedId = achievement.id"
              >
                <div class="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-base-200">
                  <img
                    v-if="achievement.imagePath"
                    :src="achievement.imagePath"
                    :alt="achievement.label"
                    class="size-full object-cover"
                  />
                  <Icon v-else name="kind-icon:trophy" class="size-5 text-base-content/35" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-black">{{ achievement.label }}</p>
                  <p class="truncate text-xs text-base-content/50">
                    {{ achievement.triggerCode || achievement.message }}
                  </p>
                </div>
                <span
                  class="size-2 shrink-0 rounded-full"
                  :class="achievement.imagePath ? 'bg-success' : 'bg-warning'"
                />
              </button>

              <p
                v-if="!filteredAchievements.length"
                class="rounded-xl border border-dashed border-base-300 p-6 text-center text-sm text-base-content/50"
              >
                No matching achievements.
              </p>
            </div>
          </aside>

          <section v-if="selectedAchievement" class="space-y-4">
            <div class="kr-panel p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p
                    v-if="selectedAchievement.triggerCode"
                    class="text-xs font-black uppercase tracking-wide text-primary"
                  >
                    {{ selectedAchievement.triggerCode }}
                  </p>
                  <h2 class="mt-1 text-xl font-black">{{ selectedAchievement.label }}</h2>
                  <p class="mt-2 max-w-3xl text-sm text-base-content/60">
                    {{ selectedAchievement.message }}
                  </p>
                </div>
                <span class="badge" :class="selectedAchievement.isActive ? 'badge-success' : 'badge-ghost'">
                  {{ selectedAchievement.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>

            <entity-art-manager
              entity-type="achievement"
              :entity="selectedAchievement"
              :slots="artSlots"
              :can-edit="true"
              @updated="applyUpdate"
            />
          </section>

          <div v-else class="grid min-h-72 place-items-center kr-panel text-base-content/50">
            Select an achievement to manage its artwork.
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Achievement } from '~/prisma/generated/prisma/client'
import { useAchievementStore } from '@/stores/achievementStore'
import { useUserStore } from '@/stores/userStore'

const achievementStore = useAchievementStore()
const userStore = useUserStore()
const ready = ref(false)
const loading = ref(false)
const search = ref('')
const selectedId = ref<number | null>(null)

const artSlots = [
  {
    field: 'imagePath',
    label: 'Achievement image',
    aspect: '1 / 1',
    width: 1024,
    height: 1024,
  },
]

const achievements = computed(() => achievementStore.achievements)
const missingArtCount = computed(
  () => achievements.value.filter((achievement) => !achievement.imagePath).length,
)
const filteredAchievements = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return achievements.value
  return achievements.value.filter((achievement) =>
    [achievement.label, achievement.triggerCode, achievement.message, achievement.tooltip]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query)),
  )
})
const selectedAchievement = computed(() =>
  achievements.value.find((achievement) => achievement.id === selectedId.value),
)

onMounted(async () => {
  await userStore.initialize()
  if (userStore.isAdmin) await loadAchievements()
  ready.value = true
})

async function loadAchievements(force = false) {
  loading.value = true
  try {
    await achievementStore.initialize({ force, fetchRemote: true })
    if (!selectedId.value || !achievements.value.some((item) => item.id === selectedId.value)) {
      selectedId.value = achievements.value[0]?.id ?? null
    }
  } finally {
    loading.value = false
  }
}

function applyUpdate(updated: Record<string, unknown>) {
  const achievement = achievements.value.find((item) => item.id === Number(updated.id))
  if (achievement) Object.assign(achievement, updated as Partial<Achievement>)
}
</script>
