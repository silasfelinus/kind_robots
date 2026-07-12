<!-- /components/conductor/project-front-page.vue -->
<!--
  Reusable public-facing shell for a project front page. Give it a conductor
  `slug` and a static `fallback` config; it pulls the live Project record when one
  exists and merges the two so the page always renders something styled. Project
  specific interactive UI goes in the #interactive slot.
-->
<template>
  <div
    class="flex h-full min-h-0 w-full flex-col overflow-y-auto overscroll-contain bg-base-200"
  >
    <!-- HERO -->
    <header class="relative w-full overflow-hidden">
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
        class="absolute inset-0 bg-gradient-to-t from-base-200 via-base-200/70 to-transparent"
      />
      <div
        class="relative mx-auto flex w-full max-w-5xl flex-col gap-4 px-5 pb-6 pt-16 sm:pt-24"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span
            v-if="view.icon"
            class="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-base-100/70 text-primary shadow-lg backdrop-blur"
          >
            <Icon :name="view.icon" class="size-6" />
          </span>
          <span
            v-if="statusLabel"
            class="badge badge-sm rounded-xl font-semibold"
            :class="statusBadgeClass"
            >{{ statusLabel }}</span
          >
          <span
            v-if="view.bridge"
            class="badge badge-info badge-sm rounded-xl font-semibold gap-1"
          >
            <Icon name="kind-icon:external-link" class="size-3" />External app
          </span>
        </div>

        <h1
          class="text-3xl font-black leading-tight text-base-content sm:text-5xl"
        >
          {{ view.title }}
        </h1>
        <p
          v-if="view.tagline"
          class="max-w-2xl text-base font-semibold text-base-content/80 sm:text-lg"
        >
          {{ view.tagline }}
        </p>

        <div class="flex flex-wrap items-center gap-2 pt-1">
          <a
            v-if="launch"
            :href="launch.href"
            :target="launch.external ? '_blank' : undefined"
            :rel="launch.external ? 'noopener noreferrer' : undefined"
            class="btn btn-primary btn-sm gap-1.5 rounded-2xl sm:btn-md"
          >
            <Icon :name="launch.icon || 'kind-icon:sparkles'" class="size-4" />
            {{ launch.label }}
          </a>
          <a
            v-for="link in view.links || []"
            :key="link.label"
            :href="link.href"
            :target="link.external ? '_blank' : undefined"
            :rel="link.external ? 'noopener noreferrer' : undefined"
            class="btn btn-ghost btn-sm gap-1.5 rounded-2xl border border-base-300 bg-base-100/60 backdrop-blur"
          >
            <Icon
              :name="link.icon || 'kind-icon:external-link'"
              class="size-4"
            />
            {{ link.label }}
          </a>
        </div>

        <!-- Stat strip -->
        <div
          v-if="view.stats && view.stats.length"
          class="mt-1 flex flex-wrap gap-2"
        >
          <div
            v-for="stat in view.stats"
            :key="stat.label"
            class="flex items-center gap-2 rounded-2xl border border-base-300 bg-base-100/70 px-3 py-1.5 backdrop-blur"
          >
            <Icon
              v-if="stat.icon"
              :name="stat.icon"
              class="size-4 text-primary/70"
            />
            <span class="text-sm font-black leading-none text-base-content">{{
              stat.value
            }}</span>
            <span class="text-xs font-semibold text-base-content/50">{{
              stat.label
            }}</span>
          </div>
        </div>
      </div>
    </header>

    <div class="mx-auto flex w-full max-w-5xl flex-col gap-5 px-5 pb-10 pt-5">
      <!-- Description -->
      <section
        v-if="view.description"
        class="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
      >
        <p class="text-sm leading-relaxed text-base-content/80 sm:text-base">
          {{ view.description }}
        </p>
      </section>

      <!-- Interactive slot — project-specific UI drops in here -->
      <slot name="interactive" :project="project" />

      <!-- Marketing / explainer sections -->
      <section
        v-if="view.sections && view.sections.length"
        class="grid gap-4 sm:grid-cols-2"
      >
        <article
          v-for="block in view.sections"
          :key="block.key"
          class="flex flex-col gap-2 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
        >
          <div class="flex items-center gap-2">
            <span
              class="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary"
            >
              <Icon :name="block.icon || 'kind-icon:sparkles'" class="size-5" />
            </span>
            <h3 class="text-base font-black text-base-content">
              {{ block.title }}
            </h3>
          </div>
          <p class="text-sm leading-relaxed text-base-content/70">
            {{ block.body }}
          </p>
        </article>
      </section>

      <!-- Gallery strip -->
      <ProjectGalleryStrip
        v-if="view.collectionLabel"
        :collection-label="view.collectionLabel"
        :title="`${view.title} gallery`"
      />

      <!-- Deliverables / status -->
      <ProjectDeliverablesPanel
        v-if="showDeliverables"
        :project="project"
        :fallback="view.deliverables"
        :goal="view.description"
      />

      <!-- Bottom launch banner for bridge projects -->
      <section
        v-if="view.bridge && launch"
        class="flex flex-col items-center gap-3 rounded-3xl border border-info/30 bg-info/5 p-6 text-center"
      >
        <Icon name="kind-icon:external-link" class="size-8 text-info/70" />
        <p class="text-sm text-base-content/70">
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
            class="size-4"
          />
          {{ launch.label }}
        </a>
      </section>
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
  }>(),
  { showDeliverables: true },
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
    description: p?.description || f.description,
    icon: p?.icon || f.icon,
    status: p?.status ?? null,
    links: f.links,
    sections: f.sections,
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
