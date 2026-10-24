<template>
  <section class="kr-surface min-h-0 gap-3 p-2 sm:p-3">
    <header class="flex shrink-0 items-center gap-3 rounded-2xl border border-base-300 bg-(--kr-surface-raised) p-3">
      <div class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Icon name="kind-icon:gallery" class="kr-icon-6" />
      </div>
      <div class="min-w-0 flex-1">
        <h2 class="kr-text-black-xl">Explore our projects</h2>
        <p class="kr-text-dim-sm">Worlds, tools and experiments. Open an experience or browse its illustrated project sheet.</p>
      </div>
      <span class="badge badge-primary">{{ store.publicProjects.length }}</span>
    </header>
    <div class="kr-scroll min-h-0 flex-1">
      <kr-gallery
        :items="items"
        :mode="mode"
        :loading="store.loading"
        :error="store.error ?? undefined"
        empty-label="public projects"
        @update:mode="mode = $event"
        @open="open"
      />
      <p v-if="store.loaded && !items.length" class="py-8 text-center text-base-content/60">
        No public projects are available yet.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProjectStore } from '@/stores/projectStore'
import { projectDestination, projectSheetPath } from '@/utils/projectDestination'
import type { GalleryMode } from '@/utils/galleryVocabulary'

const store = useProjectStore()
const mode = ref<GalleryMode>('cards')
const items = computed(() =>
  store.publicProjects.map((project) => {
    const slug = project.conductorSlug || project.slug || String(project.id)
    const destination = projectDestination(project.liveUrl)
    return {
      id: project.id,
      title: project.title,
      description: project.flavorText || project.description || project.goal || '',
      icon: project.iconPath || project.imagePath || `/images/projects/${slug}-icon.webp`,
      card: project.cardPath || `/images/projects/${slug}-card.webp`,
      hero: project.heroPath || `/images/projects/${slug}-hero.webp`,
      meta: destination ? 'Open experience' : 'Explore project sheet',
      badges: [{ label: destination ? 'Experience' : 'Project sheet', class: destination ? 'badge-primary' : 'badge-ghost' }],
    }
  }),
)

function open(item: { id: number }) {
  const project = store.publicProjects.find((entry) => entry.id === item.id)
  if (!project) return
  const slug = project.conductorSlug || project.slug || String(project.id)
  const target = projectDestination(project.liveUrl) || projectSheetPath(slug)
  return navigateTo(target, { external: target.startsWith('https://') })
}

onMounted(() => { void store.fetchProjects() })
</script>
