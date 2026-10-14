<template>
  <div class="visitor-home flex h-full min-h-0 flex-col gap-2 overflow-hidden">
    <section
      class="relative isolate shrink-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200"
      aria-label="Welcome to Kind Robots"
    >
      <img
        src="/images/arcade/arcade-hall-backdrop.webp"
        alt=""
        class="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-base-300 via-base-300/90 to-base-300/35" />
      <div class="relative flex flex-wrap items-end justify-between gap-3 p-3 sm:p-4"
        :class="admin ? 'pt-12 sm:pt-4' : ''">
        <div class="max-w-xl space-y-1">
          <p class="text-[0.65rem] font-black uppercase tracking-[0.2em] text-primary">
            Play · Create · Discover
          </p>
          <h2 class="font-serif text-xl font-black leading-tight sm:text-3xl">
            Play something. Make something. Change something.
          </h2>
          <p class="text-xs leading-relaxed sm:text-sm">
            Games, illustrated worlds, art and experiments. A growing
            creative playground with plenty to explore for free.
          </p>
        </div>
        <NuxtLink to="/play/arcade" class="btn btn-primary btn-sm shrink-0">
          Enter the Arcade
          <Icon name="kind-icon:arrow-right" class="size-4" />
        </NuxtLink>
      </div>
    </section>

    <div
      role="tablist"
      aria-label="Explore the homepage"
      class="visitor-tabs grid shrink-0 grid-cols-3 gap-1 rounded-xl bg-base-200 p-1"
    >
      <button
        v-for="tab in sections"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="activeSection === tab.key"
        :aria-controls="'visitor-' + tab.key"
        class="rounded-lg px-2 py-2 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        :class="
          activeSection === tab.key
            ? 'bg-primary text-primary-content'
            : 'hover:bg-base-300'
        "
        @click="activeSection = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div
      class="kr-panes visitor-layout min-h-0 gap-2"
    >
      <section
        id="visitor-featured"
        role="tabpanel"
        aria-label="Featured experiences"
        class="visitor-pane visitor-featured min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100/95 p-3"
        :class="activeSection === 'featured' ? 'flex' : 'hidden'"
      >
        <header class="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="font-serif text-lg font-black">Featured experiences</h2>
            <p class="text-xs opacity-65">A handpicked tour of Kind Robots</p>
          </div>
          <NuxtLink
            to="/navigation"
            class="text-xs font-bold text-primary hover:underline"
          >
            All destinations →
          </NuxtLink>
        </header>
        <div class="mb-2 flex shrink-0 flex-wrap gap-1" aria-label="Filter experiences">
          <button
            v-for="filter in categories"
            :key="filter.key"
            type="button"
            class="rounded-full border px-3 py-1 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            :class="
              selectedCategory === filter.key
                ? 'border-primary bg-primary text-primary-content'
                : 'border-base-300 bg-base-200 hover:border-primary/60'
            "
            :aria-pressed="selectedCategory === filter.key"
            @click="selectedCategory = filter.key"
          >
            {{ filter.label }}
          </button>
        </div>
        <div class="kr-pane-scroll pr-1">
          <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
            <article
              v-for="feature in filteredFeatures"
              :key="feature.route"
              class="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-200/55 transition hover:border-primary/60 hover:shadow-md"
            >
              <NuxtLink
                :to="feature.route"
                class="flex min-w-0 flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div class="relative aspect-[16/10] overflow-hidden bg-base-300">
                  <img
                    :src="feature.image"
                    :alt="feature.title"
                    loading="lazy"
                    class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span
                    class="absolute bottom-1 left-1 rounded-md bg-base-100/95 px-1.5 py-0.5 text-[0.6rem] font-black text-base-content"
                  >
                    {{ feature.tag }}
                  </span>
                </div>
                <div class="min-w-0 flex-1 space-y-1 p-2">
                  <h3 class="text-sm font-black leading-tight group-hover:text-primary">
                    {{ feature.title }}
                  </h3>
                  <p class="text-xs leading-snug opacity-70">{{ feature.description }}</p>
                </div>
              </NuxtLink>
              <div
                v-if="feature.related.length"
                class="flex flex-wrap gap-1 border-t border-base-300 px-2 py-2"
                aria-label="More Zuzu adventures"
              >
                <NuxtLink
                  v-for="related in feature.related"
                  :key="related.route"
                  :to="related.route"
                  class="rounded-md bg-base-100 px-1.5 py-1 text-[0.65rem] font-semibold hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {{ related.title }}
                </NuxtLink>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        id="visitor-updates"
        role="tabpanel"
        aria-label="Recent improvements"
        class="visitor-pane min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100/95 p-3"
        :class="activeSection === 'updates' ? 'flex' : 'hidden'"
      >
        <header class="mb-2 shrink-0">
          <h2 class="font-serif text-lg font-black">Just updated</h2>
          <p class="text-xs opacity-65">Recent work on the experiences</p>
        </header>
        <div class="kr-pane-scroll space-y-2 pr-1">
          <article
            v-for="update in updates"
            :key="update.pr"
            class="rounded-xl border border-base-300 bg-base-200/55 p-2.5"
          >
            <div class="mb-1 flex flex-wrap items-center justify-between gap-1">
              <span class="text-[0.65rem] font-black uppercase tracking-wide text-primary">
                {{ update.category }}
              </span>
              <span class="text-[0.65rem] opacity-60">{{ update.date }}</span>
            </div>
            <NuxtLink
              :to="update.route"
              class="text-sm font-black leading-tight hover:text-primary hover:underline"
            >
              {{ update.title }} →
            </NuxtLink>
            <p class="mt-1 text-xs leading-snug opacity-75">{{ update.description }}</p>
            <a
              :href="'https://github.com/silasfelinus/kind_robots/pull/' + update.pr"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 inline-block text-[0.65rem] font-semibold text-primary hover:underline"
            >
              Development notes #{{ update.pr }}
              <span class="sr-only">(opens in a new tab)</span>
            </a>
          </article>
          <p class="text-[0.65rem] leading-snug opacity-60">
            These are merged development changes. Production availability can
            follow the code update.
          </p>
        </div>
      </section>

      <section
        id="visitor-creations"
        role="tabpanel"
        aria-label="Latest public creations"
        class="visitor-pane min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100/95 p-3"
        :class="activeSection === 'creations' ? 'flex' : 'hidden'"
      >
        <header class="mb-2 flex shrink-0 items-center justify-between gap-2">
          <div>
            <h2 class="font-serif text-lg font-black">Freshly made</h2>
            <p class="text-xs opacity-65">Art, characters and stories from the galleries</p>
          </div>
          <NuxtLink
            to="/art"
            class="shrink-0 text-xs font-bold text-primary hover:underline"
          >
            Art gallery →
          </NuxtLink>
        </header>
        <div class="kr-pane-scroll pr-1">
          <div
            v-if="newest.length"
            class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))] gap-2"
          >
            <NuxtLink
              v-for="card in newest"
              :key="card.kind + '-' + card.id"
              :to="showcaseHref(card)"
              class="group min-w-0 overflow-hidden rounded-lg border border-base-300 bg-base-200/55 hover:border-primary/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div class="aspect-square overflow-hidden">
                <kr-art-plate
                  :source="card.art"
                  variant="card"
                  shape="square"
                  frame="none"
                  :alt="card.title"
                  :fallback="defaultArtFor(card.kind + '-' + card.id)"
                  fit="cover"
                />
              </div>
              <div class="p-1.5">
                <p class="truncate text-[0.7rem] font-bold group-hover:text-primary">
                  {{ card.title }}
                </p>
                <p class="text-[0.6rem] uppercase opacity-60">{{ card.kind }}</p>
              </div>
            </NuxtLink>
          </div>
          <div
            v-else-if="!loaded"
            class="grid grid-cols-3 gap-2"
            aria-label="Loading new creations"
          >
            <div
              v-for="n in 6"
              :key="n"
              class="aspect-square animate-pulse rounded-lg bg-base-200"
            />
          </div>
          <div v-else class="space-y-2 rounded-xl bg-base-200 p-3 text-xs">
            <p>Today's public gallery has no new images to show yet.</p>
            <NuxtLink to="/dreams" class="font-bold text-primary hover:underline">
              Explore Daily Dreams →
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>

    <footer class="flex shrink-0 flex-wrap items-center justify-between gap-2 px-1 text-xs">
      <span class="opacity-70">Kind Robots builds creative tools for human benefit.</span>
      <div class="flex flex-wrap gap-x-3 gap-y-1 font-bold text-primary">
        <NuxtLink to="/about" class="hover:underline">Our mission</NuxtLink>
        <a
          href="https://www.againstmalaria.com/amibot"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:underline"
        >
          Fight malaria ↗
        </a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { defaultArtFor } from '@/utils/defaultArtPool'
import {
  showcaseHref,
  type HomeShowcase,
  type ShowcaseCard,
} from '@/utils/homeShowcase'

const props = defineProps<{
  showcase: HomeShowcase
  loaded: boolean
  admin: boolean
}>()

const sections = [
  { key: 'featured', label: 'Explore' },
  { key: 'updates', label: 'Just updated' },
  { key: 'creations', label: 'Fresh art' },
] as const

const activeSection = ref<(typeof sections)[number]['key']>('featured')
const categories = [
  { key: 'all', label: 'All' },
  { key: 'play', label: 'Play' },
  { key: 'create', label: 'Create' },
  { key: 'learn', label: 'Learn' },
] as const
const selectedCategory = ref<(typeof categories)[number]['key']>('all')

const features = [
  {
    title: 'The Arcade',
    tag: 'Free games',
    category: 'play',
    route: '/play/arcade',
    image: '/images/arcade/arcade-attract-splash.webp',
    description: 'Original cabinets, high scores and quick-fire challenges.',
    related: [],
  },
  {
    title: 'The World of Zuzu',
    tag: 'Adventure collection',
    category: 'play',
    route: '/play/zuzu-gamebook',
    image: '/zuzu-showdown-portraits/zuzu-vs-hd.webp',
    description: 'A koala ronin crosses the strange Shifting Lands.',
    related: [
      { title: 'Showdown', route: '/play/zuzu-showdown' },
      { title: 'Gamebook', route: '/play/zuzu-gamebook' },
      { title: 'Shifting Lands', route: '/play/zuzu-shifting-lands' },
      { title: 'Ghost Trail', route: '/play/zuzu-ghost-trail' },
      { title: 'Pinball', route: '/play/zuzu-pinball' },
    ],
  },
  {
    title: 'Shifting Desks',
    tag: 'Interactive satire',
    category: 'play',
    route: '/play/shifting-desks',
    image: '/shifting-desks/front-poster.svg',
    description:
      'Survive office politics, impossible choices and your first 90-day review.',
    related: [],
  },
  {
    title: 'Storybook',
    tag: 'Make stories',
    category: 'create',
    route: '/storybook',
    image: '/images/channels/play/channel.webp',
    description: 'Weave your own worlds, characters and branching tales.',
    related: [],
  },
  {
    title: 'Art Gallery & Studio',
    tag: 'Explore and create',
    category: 'create',
    route: '/art',
    image: '/images/art/generate.webp',
    description: 'Browse finished work, or sign in to generate your own.',
    related: [],
  },
  {
    title: 'Cthulhuquarium',
    tag: 'Creature collecting',
    category: 'play',
    route: '/play/aquarium',
    image: '/images/channels/admin/aquarium.webp',
    description: 'Meet strange aquatic creatures and grow your own tank.',
    related: [],
  },
  {
    title: 'Memory Dungeon',
    tag: 'Card adventure',
    category: 'play',
    route: '/play/memory',
    image: '/images/background/memorydungeon.webp',
    description: 'Match cards, survive the dungeon and collect rewards.',
    related: [],
  },
  {
    title: 'Daily Dreams',
    tag: 'Worlds and stories',
    category: 'create',
    route: '/dreams',
    image: '/images/splash/dreams.webp',
    description: 'A growing parade of shared creative universes.',
    related: [],
  },
  {
    title: 'Music Videos',
    tag: 'Watch and remix',
    category: 'create',
    route: '/play/music-video',
    image: '/images/channels/plan/video-generator.webp',
    description: 'Watch illustrated music videos and remix new drafts.',
    related: [],
  },
  {
    title: 'Mandarin Tutor',
    tag: 'Learn',
    category: 'learn',
    route: '/play/mandarin',
    image: '/images/mandarin-tutor/cards/v2/f24c02b7272a3d3004079114.webp',
    description: 'Discover how Chinese characters work, then practice.',
    related: [],
  },
  {
    title: 'Rebel Button',
    tag: 'Curiosity experiment',
    category: 'play',
    route: '/button',
    image: '/images/channels/play/button.webp',
    description: 'A button you have been expressly told not to press.',
    related: [],
  },
] as const

const filteredFeatures = computed(() =>
  features.filter(
    (feature) =>
      selectedCategory.value === 'all' ||
      feature.category === selectedCategory.value,
  ),
)

const updates = [
  {
    title: 'A clearer Zuzu Pinball entrance',
    description: 'The public table opens without the oversized introduction.',
    category: 'Zuzu Pinball',
    date: 'Oct 13',
    route: '/play/zuzu-pinball',
    pr: 3669,
  },
  {
    title: 'More illustrated Shifting Desks choices',
    description: 'New selectable art styles and a more visual front desk.',
    category: 'Shifting Desks',
    date: 'Oct 13',
    route: '/play/shifting-desks',
    pr: 3672,
  },
  {
    title: 'Better play-screen layouts',
    description: 'A viewport-first pass across Zuzu and other game screens.',
    category: 'Games',
    date: 'Oct 13',
    route: '/play/zuzu-shifting-lands',
    pr: 3673,
  },
  {
    title: 'An expanded arcade adventure',
    description: 'Bumper Bubbles gained new wings, bosses and endings.',
    category: 'Arcade',
    date: 'Oct 13',
    route: '/play/arcade',
    pr: 3649,
  },
] as const

const newest = computed<ShowcaseCard[]>(() =>
  [
    ...props.showcase.rails.art,
    ...props.showcase.rails.dreams,
    ...props.showcase.rails.characters,
    ...props.showcase.rails.scenarios,
    ...props.showcase.rails.rewards,
  ]
    .filter((card) =>
      Boolean(card.art.imagePath || card.art.cardPath || card.art.heroPath),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12),
)
</script>

<style scoped>
.visitor-home {
  container-type: inline-size;
}

.visitor-layout {
  grid-template-columns: minmax(0, 1fr);
}

@container (min-width: 56rem) {
  .visitor-tabs {
    display: none;
  }

  .visitor-layout {
    grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  }

  .visitor-pane {
    display: flex !important;
  }

  .visitor-featured {
    grid-row: span 2 / span 2;
  }
}
</style>
