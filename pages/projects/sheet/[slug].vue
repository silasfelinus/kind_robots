<template>
  <main class="kr-surface min-h-0 p-2 sm:p-3">
    <div class="kr-scroll min-h-0 flex-1">
      <div
        v-if="store.loading && !store.loaded"
        class="flex justify-center py-16"
      >
        <span class="loading loading-spinner loading-lg" />
      </div>
      <div v-else-if="project" class="mx-auto flex max-w-6xl flex-col gap-3">
        <div
          class="relative min-h-56 overflow-hidden rounded-2xl bg-base-300 sm:min-h-72"
        >
          <img
            :src="heroImage"
            :alt="`${project.title} artwork`"
            class="absolute inset-0 h-full w-full object-cover"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/50 to-transparent"
          />
          <div
            class="relative flex min-h-56 flex-col justify-end gap-2 p-4 sm:min-h-72 sm:p-6"
          >
            <div class="flex flex-wrap gap-2">
              <span class="badge badge-primary">{{
                project.status.toLowerCase()
              }}</span>
              <span class="badge badge-ghost">Project sheet</span>
            </div>
            <h2 class="text-3xl font-black sm:text-5xl">{{ project.title }}</h2>
            <p class="max-w-2xl text-sm leading-relaxed sm:text-base">
              {{ project.flavorText || project.description }}
            </p>
          </div>
        </div>
        <div class="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section
            class="rounded-2xl border border-base-300 bg-(--kr-surface-raised) p-4"
          >
            <h2 class="mb-2 text-lg font-bold">The project</h2>
            <p class="whitespace-pre-line text-sm leading-relaxed">
              {{ project.description || 'An experiment in creativity.' }}
            </p>
            <h3 v-if="project.goal" class="mt-4 font-semibold">The goal</h3>
            <p
              v-if="project.goal"
              class="mt-1 whitespace-pre-line text-sm leading-relaxed"
            >
              {{ project.goal }}
            </p>
          </section>
          <aside
            class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-200/70 p-4"
          >
            <img
              v-if="project.cardPath"
              :src="project.cardPath"
              :alt="`${project.title} card art`"
              class="max-h-40 w-full rounded-xl object-cover"
            />
            <span
              class="text-xs font-bold uppercase tracking-wider text-base-content/60"
              >Discover more</span
            >
            <a v-if="endpoint" :href="endpoint" class="btn btn-primary btn-sm">
              <Icon name="kind-icon:arrow-right" class="kr-icon-4" /> Open
              project
            </a>
            <p v-else class="text-sm text-base-content/60">
              This project's experience is being prepared. You're viewing its
              public information sheet.
            </p>
            <NuxtLink to="/conductor" class="btn btn-ghost btn-sm"
              >All projects</NuxtLink
            >
          </aside>
        </div>
      </div>
      <section
        v-else
        class="mx-auto max-w-md rounded-2xl border border-base-300 p-6 text-center"
      >
        <h2 class="text-xl font-bold">Project not available</h2>
        <p class="mt-2 text-sm text-base-content/70">
          This project is not public, or it could not be found.
        </p>
        <NuxtLink to="/conductor" class="btn btn-primary btn-sm mt-4"
          >Browse projects</NuxtLink
        >
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useProjectStore } from '@/stores/projectStore'
import { useUserStore } from '@/stores/userStore'
import { projectDestination } from '@/utils/projectDestination'

const route = useRoute()
const store = useProjectStore()
const user = useUserStore()
const slug = computed(() => String(route.params.slug ?? ''))
const project = computed(() => {
  const match = store.projectForSlug(slug.value)
  return match &&
    (user.isAdmin ||
      store.publicProjects.some((entry) => entry.id === match.id))
    ? match
    : null
})
const endpoint = computed(() => projectDestination(project.value?.liveUrl))
const heroImage = computed(
  () =>
    project.value?.heroPath ||
    project.value?.cardPath ||
    `/images/projects/${slug.value}-hero.webp`,
)
onMounted(() => {
  void store.fetchProjects(
    user.isAdmin ? { includeInactive: true, includeMature: true } : {},
  )
})
</script>
