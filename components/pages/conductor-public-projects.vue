<template>
  <section class="kr-surface min-h-0 gap-3 p-2 sm:p-3">
    <div class="kr-scroll min-h-0 flex-1">
      <kr-gallery
        :items="items"
        :mode="mode"
        :loading="store.loading"
        :error="store.error ?? undefined"
        empty-label="public projects"
        @update:mode="mode = $event"
        @open="open"
      >
        <template #toolbar>
          <span
            class="badge badge-primary gap-1"
            title="Worlds, tools and experiments. Open an experience or browse its illustrated project sheet."
            data-testid="public-projects-count"
          >
            <Icon name="kind-icon:gallery" class="kr-icon-3" />
            {{ featuredProjects.length }} projects
          </span>
        </template>
      </kr-gallery>
      <p
        v-if="store.loaded && !items.length"
        class="py-8 text-center text-base-content/60"
      >
        No public projects are available yet.
      </p>
      <section
        v-if="shelfApps.length"
        class="mt-4 rounded-2xl border border-base-300 bg-(--kr-surface-raised) p-3"
      >
        <h3 class="kr-text-black-lg">Daily Dream Workshop apps</h3>
        <p class="kr-text-dim-sm">
          Small toys and puzzles from the Daily Dream build shelf.
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          <NuxtLink
            v-for="app in shelfApps"
            :key="app.id"
            :to="app.target"
            :external="app.target.startsWith('https://')"
            class="btn btn-sm btn-outline rounded-xl"
          >
            {{ app.title }}
          </NuxtLink>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConductorStore } from '@/stores/conductorStore'
import { useProjectStore } from '@/stores/projectStore'
import {
  projectDestination,
  projectSheetPath,
} from '@/utils/projectDestination'
import type { GalleryMode } from '@/utils/galleryVocabulary'

const store = useProjectStore()
const conductor = useConductorStore()
const mode = ref<GalleryMode>('cards')

/*
 * Conductor member apps (`parent:`, the Daily Dream Workshop micro apps) are a
 * subset of their parent project, not first-run projects (Silas, 2026-11-01
 * PT): they keep their own endpoint and get a small shelf below the gallery.
 */
const featuredProjects = computed(() =>
  store.publicProjects.filter(
    (project) => !conductor.isMemberProject(project.conductorSlug),
  ),
)
const shelfApps = computed(() =>
  store.publicProjects
    .filter((project) => conductor.isMemberProject(project.conductorSlug))
    .map((project) => {
      const slug = project.conductorSlug || project.slug || String(project.id)
      return {
        id: project.id,
        title: project.title || slug,
        target: projectDestination(project.liveUrl) || projectSheetPath(slug),
      }
    }),
)

const items = computed(() =>
  featuredProjects.value.map((project) => {
    const slug = project.conductorSlug || project.slug || String(project.id)
    const destination = projectDestination(project.liveUrl)
    return {
      id: project.id,
      title: project.title,
      description:
        project.flavorText || project.description || project.goal || '',
      icon:
        project.iconPath ||
        project.imagePath ||
        `/images/projects/${slug}-icon.webp`,
      card: project.cardPath || `/images/projects/${slug}-card.webp`,
      hero: project.heroPath || `/images/projects/${slug}-hero.webp`,
      meta: destination ? 'Open experience' : 'Explore project sheet',
      badges: [
        {
          label: destination ? 'Experience' : 'Project sheet',
          class: destination ? 'badge-primary' : 'badge-ghost',
        },
      ],
    }
  }),
)

function open(item: { id: string | number }) {
  const project = store.publicProjects.find((entry) => entry.id === item.id)
  if (!project) return
  const slug = project.conductorSlug || project.slug || String(project.id)
  const target = projectDestination(project.liveUrl) || projectSheetPath(slug)
  return navigateTo(target, { external: target.startsWith('https://') })
}

onMounted(() => {
  void store.fetchProjects()
  void conductor.fetchProgress()
})
</script>
