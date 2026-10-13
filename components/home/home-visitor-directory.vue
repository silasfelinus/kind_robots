<template>
  <div class="space-y-7">
    <section
      class="relative overflow-hidden rounded-3xl border border-base-300 bg-base-200"
    >
      <img
        src="/images/arcade/arcade-hall-backdrop.webp"
        alt=""
        class="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div
        class="absolute inset-0 bg-gradient-to-r from-base-300 via-base-300/90 to-transparent"
      />
      <div class="relative max-w-2xl space-y-3 p-6 sm:p-10">
        <p class="text-xs font-black uppercase tracking-[0.24em] text-primary">
          Play · Create · Discover
        </p>
        <h2 class="font-serif text-3xl font-black sm:text-5xl">
          A whole world of strange and wonderful things
        </h2>
        <p class="text-sm leading-relaxed sm:text-base">
          Explore free arcade cabinets, illustrated adventures and creative
          tools. Everything below leads to something you can actually visit.
        </p>
        <NuxtLink class="btn btn-primary btn-sm" to="/play/arcade"
          >Enter the Arcade <Icon name="kind-icon:arrow-right" class="size-4"
        /></NuxtLink>
      </div>
    </section>
    <section class="space-y-3" aria-label="Featured experiences">
      <div class="flex items-end justify-between gap-2">
        <div>
          <h2 class="font-serif text-2xl font-black">Featured experiences</h2>
          <p class="text-xs opacity-70">
            A hand-picked doorway into Kind Robots
          </p>
        </div>
        <NuxtLink
          to="/navigation"
          class="text-sm font-bold text-primary hover:underline"
          >All destinations →</NuxtLink
        >
      </div>
      <div
        class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3"
      >
        <NuxtLink
          v-for="feature in features"
          :key="feature.route"
          :to="feature.route"
          class="group overflow-hidden rounded-2xl border border-base-300 bg-base-100 transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div class="relative aspect-[16/10] overflow-hidden bg-base-200">
            <img
              :src="feature.image"
              :alt="feature.title"
              loading="lazy"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span
              class="absolute bottom-2 left-2 rounded-full bg-base-100/90 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wider text-base-content"
              >{{ feature.category }}</span
            >
          </div>
          <div class="space-y-1 p-4">
            <h3 class="font-serif text-lg font-black group-hover:text-primary">
              {{ feature.title }}
            </h3>
            <p class="text-sm opacity-70">{{ feature.description }}</p>
          </div>
        </NuxtLink>
      </div>
    </section>
    <section
      v-if="newest.length"
      class="space-y-3"
      aria-label="Newest creations"
    >
      <div class="flex items-end justify-between gap-3">
        <div>
          <h2 class="font-serif text-2xl font-black">Freshly made</h2>
          <p class="text-xs opacity-70">
            Recent public creations, straight from the galleries
          </p>
        </div>
        <NuxtLink
          to="/art"
          class="text-sm font-bold text-primary hover:underline"
          >Art gallery →</NuxtLink
        >
      </div>
      <div
        class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-3"
      >
        <NuxtLink
          v-for="card in newest"
          :key="`${card.kind}-${card.id}`"
          :to="showcaseHref(card)"
          class="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 transition hover:border-primary/50 hover:shadow-lg"
        >
          <div class="aspect-square overflow-hidden">
            <kr-art-plate
              :source="card.art"
              variant="card"
              shape="square"
              frame="none"
              :alt="card.title"
              :fallback="defaultArtFor(`${card.kind}-${card.id}`)"
              fit="cover"
            />
          </div>
          <div class="space-y-1 p-2.5">
            <p class="truncate text-xs font-black group-hover:text-primary">
              {{ card.title }}
            </p>
            <p class="text-[0.65rem] uppercase tracking-wider opacity-60">
              {{ card.kind }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </section>
    <section
      v-else-if="!loaded"
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-3"
      aria-label="Loading recent creations"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="aspect-square animate-pulse rounded-xl bg-base-200"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { defaultArtFor } from '@/utils/defaultArtPool'
import {
  showcaseHref,
  type HomeShowcase,
  type ShowcaseCard,
} from '@/utils/homeShowcase'

const props = defineProps<{ showcase: HomeShowcase; loaded: boolean }>()

const features = [
  {
    title: 'The Arcade',
    category: 'Free games',
    route: '/play/arcade',
    image: '/images/arcade/arcade-attract-splash.webp',
    description: 'Original cabinets, strange challenges and high-score chases.',
  },
  {
    title: 'Zuzu Showdown',
    category: 'Fighting game',
    route: '/play/zuzu-showdown',
    image: '/zuzu-showdown-portraits/zuzu-vs-hd.webp',
    description:
      'Nine fighters and an ever-evolving journey across the wasteland.',
  },
  {
    title: 'Zuzu Gamebook',
    category: 'Interactive fiction',
    route: '/play/zuzu-gamebook',
    image: '/zuzu-gamebook/scenes/waterhole.webp',
    description:
      'Illustrated choices, dice rolls and many roads through a strange frontier.',
  },
  {
    title: 'Shifting Lands',
    category: 'Adventure board',
    route: '/play/zuzu-shifting-lands',
    image: '/zuzu-gamebook/scenes/waterhole.webp',
    description:
      'A changing board, illustrated encounters and choices with consequences.',
  },
  {
    title: 'Storybook',
    category: 'Make stories',
    route: '/storybook',
    image: '/images/channels/play/channel.webp',
    description: 'Create characters, worlds and interactive tales of your own.',
  },
  {
    title: 'Create Art',
    category: 'Art studio',
    route: '/art',
    image: '/images/art/generate.webp',
    description: 'Create, browse and remix colorful worlds and characters.',
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
