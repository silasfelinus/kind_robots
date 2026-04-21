<!-- /components/content/gallery/gallery-gallery.vue -->
<!--
  GalleryGallery
  ──────────────
  A vertical meta-gallery that renders each sub-gallery as a named,
  collapsible panel row. Designed to work at any container width:
  narrow sidebar, half-pane, full main content, phone portrait/landscape.

  Usage:
    <gallery-gallery />

  No props required. Edit the `galleries` array in <script setup> to
  add, remove, or reorder sections.
-->
<template>
  <!-- Root: fill whatever container we're placed in, never demand min-height -->
  <div class="flex flex-col min-h-0 w-full bg-base-200">
    <!-- ── Sticky header ──────────────────────────────────────────────── -->
    <header
      class="sticky top-0 z-30 bg-base-100 border-b border-base-300 shadow-sm shrink-0"
    >
      <div class="flex items-center gap-2 w-full px-3 py-2 sm:px-4 sm:py-2.5">
        <!-- Logo glyph: hidden when very narrow -->
        <span
          class="hidden xs:inline-block text-xl leading-none opacity-60 shrink-0 select-none"
          aria-hidden="true"
          >⬡</span
        >

        <!-- Title block -->
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

        <!-- Expand / Collapse All -->
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
        <button
          class="flex items-center w-full gap-2 sm:gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-base-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          :class="
            openMap[gallery.key]
              ? 'bg-base-200 border-b border-base-300 rounded-t-xl'
              : 'rounded-xl'
          "
          :aria-expanded="openMap[gallery.key]"
          @click="toggle(gallery.key)"
        >
          <!-- Emoji icon: fixed width keeps labels aligned across rows -->
          <span
            class="text-base leading-none shrink-0 w-6 text-center select-none"
            aria-hidden="true"
            >{{ gallery.icon }}</span
          >

          <!-- Name + description -->
          <span class="flex flex-col min-w-0 flex-1 gap-px">
            <span
              class="text-sm font-bold tracking-tight text-base-content truncate leading-snug"
            >
              {{ gallery.name }}
            </span>
            <!-- Description hidden below sm to keep rows slim on narrow containers -->
            <span
              class="hidden sm:block text-xs text-base-content/50 truncate leading-snug"
            >
              {{ gallery.description }}
            </span>
          </span>

          <!-- Chevron -->
          <span
            class="shrink-0 text-base-content/40 transition-transform duration-250 ease-in-out"
            :class="openMap[gallery.key] ? 'rotate-180 text-primary' : ''"
            aria-hidden="true"
          >
            <Icon name="kind-icon:chevron-down" class="w-4 h-4" />
          </span>
        </button>

        <!-- Collapsible panel body -->
        <Transition name="gg-panel">
          <div
            v-if="openMap[gallery.key]"
            class="gg-row-body overflow-y-auto overscroll-contain"
          >
            <!-- p-2/p-3 inner padding; min-h-0 prevents flex blowout -->
            <div class="gg-row-body-inner p-2 sm:p-3 min-h-0">
              <bot-gallery v-if="gallery.key === 'bots'" />
              <character-gallery v-else-if="gallery.key === 'characters'" />
              <chat-gallery v-else-if="gallery.key === 'chats'" />
              <checkpoint-gallery v-else-if="gallery.key === 'checkpoints'" />
              <collection-gallery v-else-if="gallery.key === 'collections'" />
              <dominion-gallery v-else-if="gallery.key === 'dominions'" />
              <icon-gallery v-else-if="gallery.key === 'icons'" />
              <lab-gallery v-else-if="gallery.key === 'lab'" />
              <pitch-gallery v-else-if="gallery.key === 'pitches'" />
              <reward-gallery v-else-if="gallery.key === 'rewards'" />
              <scenario-gallery v-else-if="gallery.key === 'scenarios'" />
              <server-gallery v-else-if="gallery.key === 'servers'" />
              <theme-gallery v-else-if="gallery.key === 'themes'" />
            </div>
          </div>
        </Transition>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'

// ── Gallery manifest ─────────────────────────────────────────────────────────
// Add, remove, or reorder entries here. That's the only config needed.
const galleries = [
  {
    key: 'bots',
    name: 'Bots',
    icon: '🤖',
    description: 'Browse and activate available bots',
  },
  {
    key: 'characters',
    name: 'Characters',
    icon: '🎭',
    description: 'Filter and select character profiles',
  },
  {
    key: 'chats',
    name: 'Chats',
    icon: '💬',
    description: 'Search and navigate conversation history',
  },
  {
    key: 'checkpoints',
    name: 'Checkpoints',
    icon: '🧠',
    description: 'Select AI model checkpoints and samplers',
  },
  {
    key: 'collections',
    name: 'Collections',
    icon: '📁',
    description: 'Browse art grouped into named collections',
  },
  {
    key: 'dominions',
    name: 'Dominions',
    icon: '♟️',
    description: 'Manage and filter custom Dominion cards',
  },
  {
    key: 'icons',
    name: 'Icons',
    icon: '🔷',
    description: 'Configure smart bar icons and custom icon sets',
  },
  {
    key: 'lab',
    name: 'Lab',
    icon: '🧪',
    description: 'Explore Wonderlab component folders',
  },
  {
    key: 'pitches',
    name: 'Pitches',
    icon: '📣',
    description: 'Browse and search prompt pitches by type',
  },
  {
    key: 'rewards',
    name: 'Rewards',
    icon: '🌟',
    description: 'View, add, and manage reward cards',
  },
  {
    key: 'scenarios',
    name: 'Scenarios',
    icon: '🗺️',
    description: 'Filter and select scenario entries',
  },
  {
    key: 'servers',
    name: 'Servers',
    icon: '🖥️',
    description: 'Manage art and text inference servers',
  },
  {
    key: 'themes',
    name: 'Themes',
    icon: '🌈',
    description: 'Preview and apply DaisyUI and custom themes',
  },
] as const

type GalleryKey = (typeof galleries)[number]['key']

// ── Open / close state ────────────────────────────────────────────────────────
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
/*
  Only things Tailwind can't express live here:
    – responsive max-height on the panel body (including landscape-phone breakpoint)
    – scrollbar cosmetics
    – :deep() overrides that rein in child galleries' self-sizing patterns
    – the panel slide/fade transition
*/

/* ── Panel body: responsive max-height ───────────────────────────────────── */
/*
  We use viewport-relative heights rather than container-query heights so the
  panel behaves sensibly whether it's in a sidebar, a main pane, or fullscreen.
  Tweak these numbers if your layout gives the component a constrained height.
*/
.gg-row-body {
  max-height: 55vh;
} /* phone portrait      */
@media (min-width: 480px) {
  .gg-row-body {
    max-height: 60vh;
  }
} /* large phone   */
@media (min-width: 640px) {
  .gg-row-body {
    max-height: 65vh;
  }
} /* sm: sidebar   */
@media (min-width: 1024px) {
  .gg-row-body {
    max-height: 70vh;
  }
} /* lg: main pane */

/* Landscape phones: short viewport — keep panels shallow so the toggle bar
   stays visible without excessive scrolling */
@media (max-height: 500px) {
  .gg-row-body {
    max-height: 42vh;
  }
}

/* ── Thin scrollbar ──────────────────────────────────────────────────────── */
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

/* ── Child gallery containment ───────────────────────────────────────────── */
/*
  Many galleries lock their own height with Tailwind's h-screen, h-[100dvh],
  or inline calc(var(--vh) …) styles. Strip those so content flows inside
  our panel instead of overflowing it.
*/
.gg-row-body-inner :deep(.h-screen),
.gg-row-body-inner :deep(.h-\[100dvh\]),
.gg-row-body-inner :deep(.min-h-screen),
.gg-row-body-inner :deep([style*='height: calc']),
.gg-row-body-inner :deep([style*='height:calc']) {
  height: auto !important;
  min-height: 0 !important;
}

/*
  Fixed-position footers / overlays (bot-gallery active-bot bar, reward-gallery
  add-form) become absolute so they stay clipped inside their panel.
*/
.gg-row-body-inner :deep(.fixed) {
  position: absolute;
}

/* ── Panel slide + fade transition ──────────────────────────────────────── */
.gg-panel-enter-active,
.gg-panel-leave-active {
  transition:
    max-height 0.28s ease,
    opacity 0.22s ease;
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
/* max-height for enter-to / leave-from is inherited from the .gg-row-body
   responsive rules above — no duplication needed. */
</style>
