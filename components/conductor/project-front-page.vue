<!-- /components/conductor/project-front-page.vue -->
<!--
  Reusable public-facing shell for a project front page. Give it a conductor
  `slug` and a static `fallback` config; it pulls the live Project record when one
  exists and merges the two so the page always renders something styled. Project
  specific interactive UI goes in the #interactive slot. Its icon, status and
  launch actions dock into the system bar through header-page-bar; the channel
  picker already names the page, so the hero keeps only the art, tagline and
  stats.
-->
<template>
  <div class="kr-surface bg-base-200">
    <div class="kr-scroll flex w-full flex-col overscroll-contain">
      <header-page-bar>
        <div class="pf-bar" data-testid="project-front-bar">
          <span v-if="view.icon" class="pf-bar-icon" :title="view.title">
            <Icon :name="view.icon" class="kr-icon-4" />
          </span>
          <span
            v-if="statusLabel"
            class="kr-badge-sm shrink-0 rounded-xl font-semibold"
            :class="statusBadgeClass"
            >{{ statusLabel }}</span
          >
          <span
            v-if="view.bridge"
            class="pf-bar-secondary kr-badge-sm badge-info shrink-0 gap-1 rounded-xl font-semibold"
          >
            <Icon name="kind-icon:external-link" class="kr-icon-3" />External
            app
          </span>
          <div class="pf-bar-actions">
            <a
              v-if="launch"
              :href="launch.href"
              :target="launch.external ? '_blank' : undefined"
              :rel="launch.external ? 'noopener noreferrer' : undefined"
              class="kr-btn-primary-2xl gap-1.5"
            >
              <Icon
                :name="launch.icon || 'kind-icon:sparkles'"
                class="kr-icon-4"
              />
              {{ launch.label }}
            </a>
            <a
              v-for="link in view.links || []"
              :key="link.label"
              :href="link.href"
              :target="link.external ? '_blank' : undefined"
              :rel="link.external ? 'noopener noreferrer' : undefined"
              :title="link.label"
              :aria-label="link.label"
              class="btn btn-ghost btn-sm gap-1.5 rounded-2xl"
            >
              <Icon
                :name="link.icon || 'kind-icon:external-link'"
                class="kr-icon-4"
              />
              <span class="pf-bar-label">{{ link.label }}</span>
            </a>
          </div>
        </div>
      </header-page-bar>

      <section
        class="relative w-full overflow-hidden"
        :aria-label="view.title"
        data-testid="project-front-hero"
      >
        <div
          class="absolute inset-0 bg-gradient-to-br from-primary/25 via-secondary/15 to-accent/20"
        />
        <img
          v-if="!heroFailed"
          :src="heroSrc"
          :alt="view.title"
          class="absolute inset-0 h-full w-full object-cover"
          @error="onHeroError"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-base-200 via-base-200/50 to-transparent"
        />
        <div
          class="relative kr-container flex min-h-44 max-w-5xl flex-col justify-end gap-3 px-5 pb-5 pt-16 sm:min-h-64"
        >
          <p
            v-if="view.tagline"
            class="max-w-2xl text-base font-semibold text-base-content/85 sm:text-lg"
          >
            {{ view.tagline }}
          </p>

          <div
            v-if="view.stats && view.stats.length"
            class="flex flex-wrap gap-2"
          >
            <div
              v-for="stat in view.stats"
              :key="stat.label"
              class="flex items-center gap-2 kr-panel-flat bg-base-100/70 px-3 py-1.5 backdrop-blur"
            >
              <Icon
                v-if="stat.icon"
                :name="stat.icon"
                class="size-4 text-primary/70"
              />
              <span class="kr-text-black-sm leading-none text-base-content">{{
                stat.value
              }}</span>
              <span class="kr-text-dim-xs font-semibold">{{ stat.label }}</span>
            </div>
          </div>
        </div>
      </section>

      <div
        class="kr-container flex flex-col gap-5 px-5 pb-10 pt-5"
        :class="wide ? 'max-w-7xl' : 'max-w-5xl'"
      >
        <slot name="interactive" :project="project" />

        <ProjectGalleryStrip
          v-if="view.collectionLabel"
          :collection-label="view.collectionLabel"
          :title="`${view.title} gallery`"
        />

        <ProjectDeliverablesPanel
          v-if="showDeliverables"
          :project="project"
          :fallback="view.deliverables"
          :goal="view.description"
        />

        <section
          v-if="view.bridge && launch"
          class="flex flex-col items-center gap-3 rounded-3xl border border-info/30 bg-info/5 p-6 text-center"
        >
          <Icon name="kind-icon:external-link" class="kr-icon-8 text-info/70" />
          <p class="kr-text-dim-sm-70">
            This experience lives in its own app. Launch it to dive in.
          </p>
          <a
            :href="launch.href"
            :target="launch.external ? '_blank' : undefined"
            :rel="launch.external ? 'noopener noreferrer' : undefined"
            class="btn btn-info btn-sm gap-1.5 rounded-2xl"
          >
            <Icon
              :name="launch.icon || 'kind-icon:external-link'"
              class="kr-icon-4"
            />
            {{ launch.label }}
          </a>
        </section>

        <!-- Optional closing slot, last inside the scroll (e.g. room for a
           fixed bottom sheet the project's UI opens over the page) -->
        <slot name="footer" :project="project" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProjectStore } from '@/stores/projectStore'
import {
  projectAssetPath,
  projectAssetFallback,
  type ProjectFrontConfig,
  type ProjectFrontLink,
} from '@/components/conductor/projectFront'

const props = withDefaults(
  defineProps<{
    slug: string
    fallback: ProjectFrontConfig
    /** Hide the deliverables panel (e.g. flagship pages render their own). */
    showDeliverables?: boolean
    /** Let the interactive slot use a wider column. */
    wide?: boolean
  }>(),
  { showDeliverables: true, wide: false },
)

const projectStore = useProjectStore()
const project = computed(() => projectStore.projectForSlug(props.slug))

// Best-effort live fetch; the page renders fine on the fallback if this fails.
onMounted(async () => {
  if (project.value) return
  try {
    await projectStore.fetchProject(props.slug)
  } catch {
    /* fallback config carries the page */
  }
})

// Merge live record over the static fallback.
const view = computed(() => {
  const p = project.value
  const f = props.fallback
  return {
    title: p?.title || f.title,
    tagline: p?.flavorText || f.tagline,
    // Prefer the page's own authored copy over the live Project.description
    // field: it is seeded (server/api/conductor/sync.post.ts) from Conductor's
    // notesFromSilas -- Silas's raw internal planning dictation, not player-
    // facing copy -- and never refreshed after a Project row first exists.
    // cthulhuquarium/t-066: /play/aquarium was rendering that pitch text
    // verbatim ("Long time silly project planned... my inspiration is the
    // absolutely excellent mobile game insaniquarium...") because it happened
    // to have no authored fallback description at the time. Every current
    // caller of this component supplies one, so falling back to the live
    // value only when the page genuinely has no authored description of its
    // own keeps this component usable for a future page that hasn't written
    // one yet, without risking raw internal notes leaking onto any surface
    // that already has real copy.
    description: f.description || p?.description || undefined,
    icon: p?.icon || f.icon,
    status: p?.status ?? null,
    links: f.links,
    stats: f.stats,
    deliverables: f.deliverables,
    collectionLabel: f.collectionLabel,
    bridge: f.bridge,
  }
})

const launch = computed<ProjectFrontLink | null>(() => {
  if (props.fallback.launch) return props.fallback.launch
  const url = project.value?.liveUrl
  if (url) {
    const external = /^https?:\/\//.test(url)
    return {
      label: 'Open Project',
      href: url,
      icon: 'kind-icon:sparkles',
      external,
    }
  }
  return null
})

// Hero image: explicit override → live heroPath → local asset → conductor raw.
const heroCandidates = computed(() => {
  const list: string[] = []
  if (props.fallback.heroImage) list.push(props.fallback.heroImage)
  if (project.value?.heroPath) list.push(project.value.heroPath)
  list.push(projectAssetPath(props.slug, 'hero'))
  list.push(projectAssetFallback(props.slug, 'hero'))
  return list
})
const heroIndex = ref(0)
const heroFailed = ref(false)
const heroSrc = computed(() => heroCandidates.value[heroIndex.value])
function onHeroError() {
  if (heroIndex.value < heroCandidates.value.length - 1) {
    heroIndex.value += 1
  } else {
    heroFailed.value = true
  }
}

const statusLabel = computed(() => {
  const s = view.value.status
  if (!s) return null
  return String(s).charAt(0) + String(s).slice(1).toLowerCase()
})
const statusBadgeClass = computed(() => {
  switch (view.value.status) {
    case 'ACTIVE':
      return 'badge-success'
    case 'DONE':
      return 'badge-primary'
    case 'BRAINSTORM':
      return 'badge-secondary'
    case 'PAUSED':
      return 'badge-ghost'
    default:
      return 'badge-ghost'
  }
})
</script>

<style scoped>
.pf-bar {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  padding-inline: 0.25rem;
}
.pf-bar-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.75rem;
  background: color-mix(in oklch, var(--color-primary) 14%, transparent);
  color: var(--color-primary);
}
.pf-bar-actions {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
  overflow-x: auto;
  scrollbar-width: none;
}
.pf-bar-actions::-webkit-scrollbar {
  display: none;
}
.pf-bar-actions > * {
  flex: none;
}
@container (max-width: 640px) {
  .pf-bar-label {
    display: none;
  }
}
@container (max-width: 420px) {
  .pf-bar-secondary {
    display: none;
  }
}
</style>
