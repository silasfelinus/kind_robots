<!-- /components/content/gallery/gallery-gallery.vue -->
<template>
  <div class="flex min-h-0 w-full flex-col bg-base-200">
    <header
      class="sticky top-0 z-30 shrink-0 border-b border-base-300 bg-base-100 shadow-sm"
    >
      <div class="flex w-full items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
        <span
          class="hidden shrink-0 select-none text-xl leading-none opacity-60 xs:inline-block"
          aria-hidden="true"
        >
          ⬡
        </span>

        <div class="min-w-0 flex-1">
          <h1
            class="truncate text-sm font-extrabold leading-tight tracking-tight text-base-content sm:text-base"
          >
            Gallery of Galleries
          </h1>

          <p
            class="mt-px hidden truncate text-xs leading-snug text-base-content/50 sm:block"
          >
            Browse every major gallery from one place
          </p>
        </div>

        <button
          class="btn btn-xs btn-outline shrink-0 rounded-full whitespace-nowrap"
          type="button"
          @click="toggleAll"
        >
          {{ allExpanded ? 'Collapse All' : 'Expand All' }}
        </button>
      </div>
    </header>

    <main class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 sm:p-3">
      <section
        v-for="gallery in galleries"
        :key="gallery.key"
        class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 transition-shadow duration-200"
        :class="openMap[gallery.key] ? 'shadow-md' : ''"
      >
        <div
          class="flex w-full items-center gap-2 px-3 py-2.5 transition-colors duration-150 sm:gap-3"
          :class="
            openMap[gallery.key]
              ? 'rounded-t-2xl border-b border-base-300 bg-base-200'
              : 'rounded-2xl hover:bg-base-200'
          "
        >
          <button
            class="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:gap-3"
            type="button"
            :aria-expanded="openMap[gallery.key]"
            @click="toggle(gallery.key)"
          >
            <span
              class="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-xl bg-primary/10 text-base leading-none text-primary"
              aria-hidden="true"
            >
              <Icon
                v-if="gallery.icon.startsWith('kind-icon:')"
                :name="gallery.icon"
                class="h-5 w-5"
              />
              <span v-else>{{ gallery.icon }}</span>
            </span>

            <span class="flex min-w-0 flex-1 flex-col gap-px">
              <span
                class="truncate text-sm font-bold leading-snug tracking-tight text-base-content"
              >
                {{ gallery.name }}
              </span>

              <span
                class="hidden truncate text-xs leading-snug text-base-content/50 sm:block"
              >
                {{ gallery.description }}
              </span>
            </span>
          </button>

          <div class="flex shrink-0 items-center gap-1.5">
            <Transition name="gg-link-fade">
              <NuxtLink
                v-if="openMap[gallery.key]"
                :to="`/${gallery.page}`"
                class="btn btn-xs btn-ghost gap-1 rounded-lg text-primary hover:bg-primary/10 whitespace-nowrap"
                :title="`Open full ${gallery.name} page`"
                @click.stop
              >
                <Icon name="kind-icon:external-link" class="h-3 w-3" />
                <span class="hidden xs:inline">Full page</span>
              </NuxtLink>
            </Transition>

            <button
              class="flex h-7 w-7 items-center justify-center rounded-xl text-base-content/40 transition hover:bg-base-300 hover:text-base-content/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              type="button"
              :class="openMap[gallery.key] ? 'rotate-180 text-primary' : ''"
              :aria-label="
                openMap[gallery.key]
                  ? `Collapse ${gallery.name}`
                  : `Expand ${gallery.name}`
              "
              @click="toggle(gallery.key)"
            >
              <Icon name="kind-icon:chevron-down" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <Transition name="gg-panel">
          <div
            v-if="openMap[gallery.key]"
            class="gg-row-body min-h-0 overflow-y-auto overscroll-contain bg-base-200"
          >
            <div class="min-h-0 p-2 sm:p-3">
              <bot-gallery
                v-if="gallery.key === 'bots'"
                variant="row"
                title="Bots"
                subtitle="Browse and activate available bots."
                :show-controls="true"
                :show-toolbar="true"
                :show-card-actions="true"
                :show-launch-button="true"
                :show-server="false"
                :compact="true"
              />

              <character-gallery v-else-if="gallery.key === 'characters'" />

              <chat-gallery v-else-if="gallery.key === 'chats'" />

              <checkpoint-gallery v-else-if="gallery.key === 'checkpoints'" />

              <collection-gallery
                v-else-if="gallery.key === 'collections'"
                title="Collections"
                subtitle="Browse art grouped into named collections."
                :compact="true"
                :show-controls="true"
                :show-toolbar="true"
                :show-card-actions="true"
                :show-stats="true"
              />

              <art-gallery
                v-else-if="gallery.key === 'art'"
                title="Art Gallery"
                subtitle="Browse generated art and image records."
                :compact="true"
                :show-controls="true"
                :show-toolbar="true"
              />

              <icon-gallery v-else-if="gallery.key === 'icons'" />

              <lab-gallery v-else-if="gallery.key === 'lab'" />

              <pitch-gallery v-else-if="gallery.key === 'pitches'" />

              <prompt-gallery v-else-if="gallery.key === 'prompts'" />

              <reward-gallery v-else-if="gallery.key === 'rewards'" />

              <scenario-gallery v-else-if="gallery.key === 'scenarios'" />

              <server-gallery
                v-else-if="gallery.key === 'servers'"
                variant="row"
                title="Servers"
                subtitle="Manage art and text inference servers."
                :show-controls="true"
                :show-toolbar="true"
                :compact="true"
              />

              <story-gallery v-else-if="gallery.key === 'stories'" />

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

const galleries = [
  {
    key: 'bots',
    name: 'Bots',
    page: 'bots',
    icon: 'kind-icon:robot',
    description: 'Browse and activate available bots',
  },
  {
    key: 'characters',
    name: 'Characters',
    page: 'characters',
    icon: 'kind-icon:theater',
    description: 'Filter and select character profiles',
  },
  {
    key: 'chats',
    name: 'Chats',
    page: 'chats',
    icon: 'kind-icon:chat',
    description: 'Search and navigate conversation history',
  },
  {
    key: 'checkpoints',
    name: 'Checkpoints',
    page: 'checkpoints',
    icon: 'kind-icon:brain',
    description: 'Select AI model checkpoints and samplers',
  },
  {
    key: 'collections',
    name: 'Collections',
    page: 'collections',
    icon: 'kind-icon:folder',
    description: 'Browse art grouped into named collections',
  },
  {
    key: 'art',
    name: 'Art',
    page: 'art',
    icon: 'kind-icon:image',
    description: 'Browse the AI art that inspired Kind Robots',
  },
  {
    key: 'icons',
    name: 'Icons',
    page: 'icons',
    icon: 'kind-icon:sparkles',
    description: 'Configure smart bar icons and custom icon sets',
  },
  {
    key: 'lab',
    name: 'Lab',
    page: 'lab',
    icon: 'kind-icon:flask',
    description: 'Explore WonderLab component folders',
  },
  {
    key: 'pitches',
    name: 'Pitches',
    page: 'pitches',
    icon: 'kind-icon:megaphone',
    description: 'Browse and search brainstorm pitches by type',
  },
  {
    key: 'prompts',
    name: 'Prompts',
    page: 'prompts',
    icon: 'kind-icon:terminal',
    description: 'Create and organize brainstormed prompts',
  },
  {
    key: 'rewards',
    name: 'Rewards',
    page: 'rewards',
    icon: 'kind-icon:trophy',
    description: 'View, add, and manage reward cards',
  },
  {
    key: 'scenarios',
    name: 'Scenarios',
    page: 'scenarios',
    icon: 'kind-icon:map',
    description: 'Filter and select scenario entries',
  },
  {
    key: 'servers',
    name: 'Servers',
    page: 'servers',
    icon: 'kind-icon:server',
    description: 'Manage art and text inference servers',
  },
  {
    key: 'stories',
    name: 'Stories',
    page: 'stories',
    icon: 'kind-icon:book',
    description: 'Story generator and narrative tools',
  },
  {
    key: 'themes',
    name: 'Themes',
    page: 'themes',
    icon: 'kind-icon:palette',
    description: 'Preview and apply DaisyUI and custom themes',
  },
] as const

type GalleryKey = (typeof galleries)[number]['key']

const openMap = reactive<Record<GalleryKey, boolean>>(
  Object.fromEntries(
    galleries.map((gallery) => [gallery.key, false]),
  ) as Record<GalleryKey, boolean>,
)

const allExpanded = computed(() => {
  return galleries.every((gallery) => openMap[gallery.key])
})

function toggle(key: GalleryKey) {
  openMap[key] = !openMap[key]
}

function toggleAll() {
  const next = !allExpanded.value

  galleries.forEach((gallery) => {
    openMap[gallery.key] = next
  })
}
</script>

<style scoped>
.gg-row-body {
  max-height: 68vh;
}

@media (min-width: 480px) {
  .gg-row-body {
    max-height: 70vh;
  }
}

@media (min-width: 640px) {
  .gg-row-body {
    max-height: 72vh;
  }
}

@media (min-width: 1024px) {
  .gg-row-body {
    max-height: 76vh;
  }
}

@media (max-height: 500px) {
  .gg-row-body {
    max-height: 55vh;
  }
}

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

.gg-panel-enter-active,
.gg-panel-leave-active {
  overflow: hidden;
  transition:
    max-height 0.25s ease,
    opacity 0.2s ease;
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
