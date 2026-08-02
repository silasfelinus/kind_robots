<!-- /components/conductor/plan-projects-grid.vue -->
<!--
  In-page directory of the Plan → Projects sub-items (the third nav level).
  Sourced directly from the content pages under /plan/projects/, so adding or
  removing a pitch page is the single source of truth — no separate registry.
  Nested inside components/pages/conductor-manager.vue (the sole MDC mount for
  content/conductor.md — see interface-vision/t-017's one-mdc sweep).
-->
<template>
  <section v-if="projects.length" class="mt-6 flex w-full flex-col gap-3">
    <header class="flex flex-col">
      <h2 class="text-lg font-black">Projects in progress</h2>
      <p class="text-sm text-base-content/60">
        Experiments and pitches still finding their shape.
      </p>
    </header>

    <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="project in projects" :key="project.path">
        <NuxtLink
          :to="project.path"
          class="flex h-full items-center gap-3 rounded-xl border border-base-300 bg-base-100 p-2 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
        >
          <span
            class="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-base-200"
          >
            <img
              v-if="project.image"
              :src="project.image"
              :alt="project.title"
              loading="lazy"
              class="h-full w-full object-cover"
            />
            <span
              class="absolute inset-0 flex items-center justify-center bg-base-content/15"
            >
              <Icon
                :name="project.icon || 'kind-icon:sparkles'"
                class="h-5 w-5 text-base-100 drop-shadow"
              />
            </span>
          </span>

          <span class="flex min-w-0 flex-1 flex-col items-start leading-tight">
            <span class="max-w-full truncate text-sm font-black">
              {{ project.title }}
            </span>
            <span
              v-if="project.description"
              class="line-clamp-2 text-xs font-medium text-base-content/60"
            >
              {{ project.description }}
            </span>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ProjectCard = {
  path: string
  title: string
  description: string
  icon: string
  image: string
}

function resolveImage(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''
  return raw.startsWith('/') || raw.startsWith('http') ? raw : `/images/${raw}`
}

const { data } = await useAsyncData('plan-projects-grid', () =>
  queryCollection('content')
    .where('path', 'LIKE', '/plan/projects/%')
    .all(),
)

const projects = computed<ProjectCard[]>(() => {
  const pages = (data.value ?? []) as unknown as Array<Record<string, unknown>>

  return pages
    .map((page) => ({
      path: typeof page.path === 'string' ? page.path : '',
      title:
        (typeof page.title === 'string' && page.title) ||
        (typeof page.path === 'string' ? page.path : ''),
      description:
        typeof page.description === 'string' ? page.description : '',
      icon: typeof page.icon === 'string' ? page.icon : '',
      image: resolveImage(page.image),
    }))
    .filter((project) => project.path)
    .sort((a, b) => a.title.localeCompare(b.title))
})
</script>
