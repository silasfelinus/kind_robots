<!-- /components/content/gallery/gallery-gallery.vue -->
<!--
  GalleryGallery
  ──────────────
  Vertical meta-gallery. Each row embeds a *-picker — a compact, width-agnostic
  selection widget — instead of the full gallery component. The "Full page" link
  takes the user to the rich gallery when they need it.

  Works from ~240px sidebar width up to full main-content pane.
-->
<template>
  <div class="flex flex-col min-h-0 w-full bg-base-200">
    <!-- ── Sticky header ──────────────────────────────────────────────── -->
    <header
      class="sticky top-0 z-30 bg-base-100 border-b border-base-300 shadow-sm shrink-0"
    >
      <div class="flex items-center gap-2 w-full px-3 py-2 sm:px-4 sm:py-2.5">
        <span
          class="hidden xs:inline-block text-xl leading-none opacity-60 shrink-0 select-none"
          aria-hidden="true"
          >⬡</span
        >

        <div class="min-w-0 flex-1">
          <h1
            class="text-sm sm:text-base font-extrabold tracking-tight leading-tight truncate text-base-content"
          >
            Gallery of Galleries
          </h1>
          <p
            class="hidden sm:block text-xs text-base-content/50 truncate mt-px leading-snug"
          >
            Browse every collection from one place
          </p>
        </div>

        <button
          class="shrink-0 btn btn-xs btn-outline rounded-full whitespace-nowrap"
          @click="toggleAll"
        >
          {{ allExpanded ? 'Collapse All' : 'Expand All' }}
        </button>
      </div>
    </header>

    <!-- ── Gallery rows ───────────────────────────────────────────────── -->
    <main
      class="flex-1 flex flex-col gap-1.5 p-2 sm:p-3 overflow-y-auto min-h-0"
    >
      <section
        v-for="gallery in galleries"
        :key="gallery.key"
        class="rounded-xl border border-base-300 bg-base-100 overflow-hidden transition-shadow duration-200"
        :class="openMap[gallery.key] ? 'shadow-md' : ''"
      >
        <!-- Toggle bar -->
        <div
          class="flex items-center w-full gap-2 sm:gap-3 px-3 py-2.5 transition-colors duration-150"
          :class="
            openMap[gallery.key]
              ? 'bg-base-200 border-b border-base-300 rounded-t-xl'
              : 'rounded-xl hover:bg-base-200'
          "
        >
          <!-- Left: icon + name + description (clicking opens picker) -->
          <button
            class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            :aria-expanded="openMap[gallery.key]"
            @click="toggle(gallery.key)"
          >
            <span
              class="text-base leading-none shrink-0 w-6 text-center select-none"
              aria-hidden="true"
              >{{ gallery.icon }}</span
            >

            <span class="flex flex-col min-w-0 flex-1 gap-px">
              <span
                class="text-sm font-bold tracking-tight text-base-content truncate leading-snug"
              >
                {{ gallery.name }}
              </span>
              <span
                class="hidden sm:block text-xs text-base-content/50 truncate leading-snug"
              >
                {{ gallery.description }}
              </span>
            </span>
          </button>

          <!-- Right: full-page link (slides in when open) + chevron -->
          <div class="flex items-center gap-1.5 shrink-0">
            <Transition name="gg-link-fade">
              <NuxtLink
                v-if="openMap[gallery.key]"
                :to="`/${gallery.page}`"
                class="btn btn-xs btn-ghost gap-1 rounded-lg text-primary hover:bg-primary/10 whitespace-nowrap"
                :title="`Open full ${gallery.name} page`"
                @click.stop
              >
                <Icon name="kind-icon:external-link" class="w-3 h-3" />
                <span class="hidden xs:inline">Full page</span>
              </NuxtLink>
            </Transition>

            <button
              class="flex items-center justify-center w-6 h-6 rounded text-base-content/40 hover:text-base-content/70 transition-transform duration-250 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              :class="openMap[gallery.key] ? 'rotate-180 text-primary' : ''"
              :aria-label="
                openMap[gallery.key]
                  ? `Collapse ${gallery.name}`
                  : `Expand ${gallery.name}`
              "
              @click="toggle(gallery.key)"
            >
              <Icon name="kind-icon:chevron-down" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Picker panel -->
        <Transition name="gg-panel">
          <div
            v-if="openMap[gallery.key]"
            class="gg-row-body overflow-y-auto overscroll-contain"
          >
            <div class="p-2 sm:p-3 min-h-0">
              <bot-picker v-if="gallery.key === 'bots'" />
              <character-picker v-else-if="gallery.key === 'characters'" />
              <chat-picker v-else-if="gallery.key === 'chats'" />
              <checkpoint-picker v-else-if="gallery.key === 'checkpoints'" />
              <collection-picker v-else-if="gallery.key === 'collections'" />
              <dominion-picker v-else-if="gallery.key === 'dominions'" />
              <gallery-picker v-else-if="gallery.key === 'galleries'" />
              <icon-picker v-else-if="gallery.key === 'icons'" />
              <lab-picker v-else-if="gallery.key === 'lab'" />
              <pitch-picker v-else-if="gallery.key === 'pitches'" />
              <prompt-picker v-else-if="gallery.key === 'prompts'" />
              <reward-picker v-else-if="gallery.key === 'rewards'" />
              <scenario-picker v-else-if="gallery.key === 'scenarios'" />
              <server-picker v-else-if="gallery.key === 'servers'" />
              <story-picker v-else-if="gallery.key === 'stories'" />
              <theme-picker v-else-if="gallery.key === 'themes'" />
            </div>
          </div>
        </Transition>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'

// ── Manifest ──────────────────────────────────────────────────────────────────
// `page` = Nuxt route segment (pluralised noun).
// Override if a route doesn't match the simple plural.
const galleries = [
  {
    key: 'bots',
    name: 'Bots',
    page: 'bots',
    icon: '🤖',
    description: 'Browse and activate available bots',
  },
  {
    key: 'characters',
    name: 'Characters',
    page: 'characters',
    icon: '🎭',
    description: 'Filter and select character profiles',
  },
  {
    key: 'chats',
    name: 'Chats',
    page: 'chats',
    icon: '💬',
    description: 'Search and navigate conversation history',
  },
  {
    key: 'checkpoints',
    name: 'Checkpoints',
    page: 'checkpoints',
    icon: '🧠',
    description: 'Select AI model checkpoints and samplers',
  },
  {
    key: 'collections',
    name: 'Collections',
    page: 'artgallery',
    icon: '📁',
    description: 'Browse art grouped into named collections',
  },
  {
    key: 'dominions',
    name: 'Dominions',
    page: 'dominions',
    icon: 'kind-icon:frame',
    description: 'Manage and filter custom Dominion cards',
  },
  {
    key: 'galleries',
    name: 'Galleries',
    page: 'galleries',
    icon: '♟️',
    description: 'Browse the ai art that inspired Kind Robots',
  },
  {
    key: 'icons',
    name: 'Icons',
    page: 'icons',
    icon: '🔷',
    description: 'Configure smart bar icons and custom icon sets',
  },
  {
    key: 'lab',
    name: 'Lab',
    page: 'lab',
    icon: '🧪',
    description: 'Explore Wonderlab component folders',
  },
  {
    key: 'pitches',
    name: 'Pitches',
    page: 'pitches',
    icon: '📣',
    description: 'Browse and search prompt pitches by type',
  },
  {
    key: 'prompts',
    name: 'Prompts',
    page: 'prompts',
    icon: '♟️',
    description: 'Create and organizer brainstormed prompts',
  },
  {
    key: 'rewards',
    name: 'Rewards',
    page: 'rewards',
    icon: '🌟',
    description: 'View, add, and manage reward cards',
  },
  {
    key: 'scenarios',
    name: 'Scenarios',
    page: 'scenarios',
    icon: '🗺️',
    description: 'Filter and select scenario entries',
  },
  {
    key: 'servers',
    name: 'Servers',
    page: 'servers',
    icon: '🖥️',
    description: 'Manage art and text inference servers',
  },
  {
    key: 'stories',
    name: 'Stories',
    page: 'stories',
    icon: '📖',
    description: 'Story Generator',
  },
  {
    key: 'themes',
    name: 'Themes',
    page: 'themes',
    icon: '🌈',
    description: 'Preview and apply DaisyUI and custom themes',
  },
] as const

type GalleryKey = (typeof galleries)[number]['key']

const openMap = reactive<Record<GalleryKey, boolean>>(
  Object.fromEntries(galleries.map((g) => [g.key, false])) as Record<
    GalleryKey,
    boolean
  >,
)

const allExpanded = computed(() => galleries.every((g) => openMap[g.key]))

function toggle(key: GalleryKey) {
  openMap[key] = !openMap[key]
}

function toggleAll() {
  const next = !allExpanded.value
  galleries.forEach((g) => {
    openMap[g.key] = next
  })
}
</script>

<style scoped>
/* ── Panel body max-height ───────────────────────────────────────────────── */
/*
  Pickers are dense lists so don't need as much height as the old card galleries.
  These are still viewport-relative because the component doesn't know its own
  container height.
*/
.gg-row-body {
  max-height: 40vh;
}
@media (min-width: 480px) {
  .gg-row-body {
    max-height: 45vh;
  }
}
@media (min-width: 640px) {
  .gg-row-body {
    max-height: 50vh;
  }
}
@media (min-width: 1024px) {
  .gg-row-body {
    max-height: 55vh;
  }
}
@media (max-height: 500px) {
  .gg-row-body {
    max-height: 35vh;
  }
}

/* ── Scrollbar ───────────────────────────────────────────────────────────── */
.gg-row-body::-webkit-scrollbar {
  width: 4px;
}
.gg-row-body::-webkit-scrollbar-track {
  background: transparent;
}
.gg-row-body::-webkit-scrollbar-thumb {
  background: oklch(var(--b3));
  border-radius: 2px;
}
.gg-row-body::-webkit-scrollbar-thumb:hover {
  background: oklch(var(--bc) / 0.22);
}

/* ── Panel transition ────────────────────────────────────────────────────── */
.gg-panel-enter-active,
.gg-panel-leave-active {
  transition:
    max-height 0.25s ease,
    opacity 0.2s ease;
  overflow: hidden;
}
.gg-panel-enter-from,
.gg-panel-leave-to {
  max-height: 0 !important;
  opacity: 0;
}
.gg-panel-enter-to,
.gg-panel-leave-from {
  opacity: 1;
}

/* ── Full-page link fade ─────────────────────────────────────────────────── */
.gg-link-fade-enter-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.gg-link-fade-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.gg-link-fade-enter-from {
  opacity: 0;
  transform: translateX(4px);
}
.gg-link-fade-leave-to {
  opacity: 0;
  transform: translateX(4px);
}
</style>
