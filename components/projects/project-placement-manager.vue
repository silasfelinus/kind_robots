<!-- /components/projects/project-placement-manager.vue -->
<template>
  <section class="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
    <header
      class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
    >
      <div class="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <Icon name="kind-icon:map" class="h-6 w-6 text-primary" />
            <h1 class="text-xl font-black sm:text-2xl">Project Placement</h1>
          </div>
          <p class="mt-2 max-w-3xl text-sm leading-relaxed text-base-content/65">
            Apply the canonical channel, tab, and live URL map to existing
            Project rows. The operation uses the normal guarded Project PATCH
            endpoint and reports every updated, unchanged, missing, or failed
            slug.
          </p>
        </div>

        <span class="badge badge-warning badge-lg shrink-0 gap-1 font-black">
          <Icon name="kind-icon:shield" class="h-4 w-4" />
          Admin
        </span>
      </div>
    </header>

    <div
      v-if="!canManage"
      class="alert alert-error rounded-2xl border border-error/30"
    >
      <Icon name="kind-icon:lock" class="h-5 w-5" />
      <span>This workspace requires an administrator account.</span>
    </div>

    <template v-else>
      <section class="grid gap-3 sm:grid-cols-3">
        <article class="stat rounded-2xl border border-base-300 bg-base-100 shadow-sm">
          <div class="stat-title">Canonical placements</div>
          <div class="stat-value text-primary">{{ expectedCount }}</div>
          <div class="stat-desc">Defined in projectPlacements.ts</div>
        </article>

        <article class="stat rounded-2xl border border-base-300 bg-base-100 shadow-sm">
          <div class="stat-title">Projects loaded</div>
          <div class="stat-value">{{ projectStore.projects.length }}</div>
          <div class="stat-desc">Including inactive projects</div>
        </article>

        <article class="stat rounded-2xl border border-base-300 bg-base-100 shadow-sm">
          <div class="stat-title">Placement matches</div>
          <div class="stat-value text-secondary">{{ matchedCount }}</div>
          <div class="stat-desc">Recognized by slug or conductor slug</div>
        </article>
      </section>

      <section
        class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5"
      >
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="font-black">Backfill controls</h2>
            <p class="mt-1 text-sm text-base-content/60">
              Existing non-empty live URLs are preserved unless overwrite is
              enabled. Individual failures do not stop the remaining rows.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <label
              class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2 text-sm font-bold"
            >
              <input
                v-model="overwriteLiveUrl"
                type="checkbox"
                class="checkbox checkbox-sm checkbox-warning"
              />
              Overwrite live URLs
            </label>

            <button
              type="button"
              class="btn btn-ghost btn-sm rounded-xl"
              :disabled="busy"
              @click="loadProjects"
            >
              <span v-if="projectStore.loading" class="loading loading-spinner loading-xs" />
              <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
              Load projects
            </button>

            <button
              type="button"
              class="btn btn-primary btn-sm rounded-xl"
              :disabled="busy || !projectStore.loaded"
              @click="applyPlacements"
            >
              <span v-if="applying" class="loading loading-spinner loading-xs" />
              <Icon v-else name="kind-icon:wand" class="h-4 w-4" />
              Apply placements
            </button>
          </div>
        </div>

        <div
          v-if="message"
          class="alert rounded-xl"
          :class="messageTone === 'error' ? 'alert-error' : 'alert-success'"
        >
          <Icon
            :name="messageTone === 'error' ? 'kind-icon:error' : 'kind-icon:check'"
            class="h-5 w-5"
          />
          <span>{{ message }}</span>
        </div>
      </section>

      <section
        v-if="result"
        class="grid gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4 xl:p-5"
      >
        <article>
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-black text-success">Updated</h2>
            <span class="badge badge-success">{{ result.updated.length }}</span>
          </div>
          <ul class="mt-3 space-y-1.5 text-sm">
            <li
              v-for="slug in result.updated"
              :key="slug"
              class="rounded-lg bg-success/10 px-2.5 py-1.5 font-semibold"
            >
              {{ slug }}
            </li>
            <li v-if="!result.updated.length" class="text-base-content/45">
              No rows required updates.
            </li>
          </ul>
        </article>

        <article>
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-black">Unchanged</h2>
            <span class="badge">{{ result.unchanged.length }}</span>
          </div>
          <ul class="mt-3 space-y-1.5 text-sm">
            <li
              v-for="slug in result.unchanged"
              :key="slug"
              class="rounded-lg bg-base-200 px-2.5 py-1.5 font-semibold"
            >
              {{ slug }}
            </li>
            <li v-if="!result.unchanged.length" class="text-base-content/45">
              No canonical rows were already current.
            </li>
          </ul>
        </article>

        <article>
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-black text-warning">Missing</h2>
            <span class="badge badge-warning">{{ result.missing.length }}</span>
          </div>
          <ul class="mt-3 space-y-1.5 text-sm">
            <li
              v-for="slug in result.missing"
              :key="slug"
              class="rounded-lg bg-warning/10 px-2.5 py-1.5 font-semibold"
            >
              {{ slug }}
            </li>
            <li v-if="!result.missing.length" class="text-base-content/45">
              Every canonical slug matched a Project row.
            </li>
          </ul>
        </article>

        <article>
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-black text-error">Failed</h2>
            <span class="badge badge-error">{{ result.failed.length }}</span>
          </div>
          <ul class="mt-3 space-y-1.5 text-sm">
            <li
              v-for="failure in result.failed"
              :key="failure.slug"
              class="rounded-lg bg-error/10 px-2.5 py-1.5"
            >
              <p class="font-black">{{ failure.slug }}</p>
              <p class="mt-0.5 text-xs text-error/80">{{ failure.message }}</p>
            </li>
            <li v-if="!result.failed.length" class="text-base-content/45">
              No Project updates failed.
            </li>
          </ul>
        </article>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  useProjectStore,
  type ApplyPlacementsResult,
} from '@/stores/projectStore'
import { useUserStore } from '@/stores/userStore'
import { PROJECT_PLACEMENTS } from '@/utils/projectPlacements'

const projectStore = useProjectStore()
const userStore = useUserStore()
const overwriteLiveUrl = ref(false)
const applying = ref(false)
const result = ref<ApplyPlacementsResult | null>(null)
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')

const canManage = computed(() => userStore.role === 'ADMIN')
const expectedCount = Object.keys(PROJECT_PLACEMENTS).length
const busy = computed(() => projectStore.loading || projectStore.saving || applying.value)
const matchedCount = computed(() => {
  const slugs = new Set(Object.keys(PROJECT_PLACEMENTS))

  return projectStore.projects.filter(
    (project) =>
      (project.slug && slugs.has(project.slug)) ||
      (project.conductorSlug && slugs.has(project.conductorSlug)),
  ).length
})

function setMessage(value: string, tone: 'success' | 'error' = 'success'): void {
  message.value = value
  messageTone.value = tone
}

async function loadProjects(): Promise<void> {
  if (!canManage.value) return

  try {
    await projectStore.fetchProjects({
      includeInactive: true,
      includeMature: true,
      take: 500,
    })
    setMessage(`Loaded ${projectStore.projects.length} Project rows.`)
  } catch (error) {
    setMessage(
      error instanceof Error ? error.message : 'Failed to load Projects.',
      'error',
    )
  }
}

async function applyPlacements(): Promise<void> {
  if (!canManage.value || busy.value) return

  applying.value = true
  result.value = null

  try {
    result.value = await projectStore.applyPlacements(overwriteLiveUrl.value)
    const tone = result.value.failed.length ? 'error' : 'success'
    setMessage(
      `Placement pass complete: ${result.value.updated.length} updated, ${result.value.unchanged.length} unchanged, ${result.value.missing.length} missing, ${result.value.failed.length} failed.`,
      tone,
    )
  } catch (error) {
    setMessage(
      error instanceof Error ? error.message : 'Failed to apply placements.',
      'error',
    )
  } finally {
    applying.value = false
  }
}

onMounted(() => {
  if (canManage.value && !projectStore.loaded) {
    void loadProjects()
  }
})
</script>