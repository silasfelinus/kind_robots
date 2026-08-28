<!-- /components/home/home-page.vue -->
<!--
  The front door.

  Silas, 2026-08-28: "I want a home page that really shows off all the little
  parts of our website and its progress, and helps encourage me to play around
  and see what we've been building ... right now, all of our progress is buried
  under nav paths that a user might never see. These displays should always lead
  to something, not just static displays of images and text."

  So the page is built out of four movements, and every single thing in all four
  is a link:

    1. one quiet line of orientation (who you are, one way in, one refresh)
    2. THE HERO — the most recent dream whose art is finished, with its cast
    3. THE RAILS — one shelf per kind of thing the swarm makes, newest first
    4. THE FEED — the newsfeed, still whole, now sharing the page

  WHAT THIS COMPONENT DOES NOT DO. It renders no <h1>: workspace-header already
  puts "Kind Robots / Dashboard Room" at the top of every page from
  content/index.md's frontmatter, and a second title is a duplicate, not a
  heading (design brief rule 1, enforced by the one-header rule in
  verifyLayoutContract.ts). It owns no scroll region either — this mounts inside
  pages/[...slug].vue's content-host, which is already the page's single scroll
  owner, which is what .kr-unbound on the root declares.

  EMPTY RAILS ARE NOT RENDERED. A shelf with nothing on it is an apology; the
  store drops them, so a fresh database shows a shorter page rather than eight
  empty boxes. That is also how "if we are still making new animations, we
  should include those too" resolves itself: the animations rail appears on days
  the pipeline produced clips and is silently absent otherwise.
-->
<template>
  <div class="kr-unbound gap-6 p-1 pb-8 sm:gap-8">
    <!-- 1. Orientation. One row, no title — see the note above. -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-base-content/60">
        {{ greeting }}
      </p>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl"
          :disabled="showcaseStore.isLoading"
          :aria-busy="showcaseStore.isLoading"
          @click="showcaseStore.load(true)"
        >
          <span
            v-if="showcaseStore.isLoading"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:refresh" class="size-4" />
          Refresh
        </button>

        <NuxtLink
          v-if="isLoggedIn"
          to="/dashboard"
          class="btn btn-primary btn-sm rounded-xl"
        >
          <Icon name="kind-icon:dashboard" class="size-4" />
          Dashboard
        </NuxtLink>
        <NuxtLink v-else to="/login" class="btn btn-primary btn-sm rounded-xl">
          <Icon name="kind-icon:login" class="size-4" />
          Log in
        </NuxtLink>
      </div>
    </div>

    <div v-if="showcaseStore.errorMessage" class="kr-note kr-note-warning">
      {{ showcaseStore.errorMessage }}
    </div>

    <!-- 2. The hero. -->
    <home-dream-hero v-if="showcaseStore.hero" :hero="showcaseStore.hero" />

    <div
      v-else-if="!showcaseStore.hasLoaded"
      class="aspect-video w-full animate-pulse rounded-3xl bg-base-200"
      aria-hidden="true"
    />

    <!-- 3. The rails. -->
    <div v-if="visibleRails.length" class="flex flex-col gap-6 sm:gap-7">
      <home-rail
        v-for="entry in visibleRails"
        :key="entry.key"
        :label="entry.label"
        :blurb="entry.blurb"
        :items="entry.items"
        :see-all-href="entry.href"
        :shape="entry.shape"
        :plate-variant="entry.plateVariant"
        :placeholder-icon="entry.placeholderIcon"
      />
    </div>

    <div
      v-else-if="!showcaseStore.hasLoaded"
      class="flex gap-3 overflow-hidden"
      aria-hidden="true"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="h-52 w-36 shrink-0 animate-pulse rounded-2xl bg-base-200 sm:w-40"
      />
    </div>

    <!-- The projects strip: what is being built, and a way straight into it. -->
    <section v-if="showcaseStore.projects.length" class="flex flex-col gap-2">
      <header class="flex flex-wrap items-baseline justify-between gap-3">
        <h2 class="text-xs font-black uppercase tracking-[0.18em] text-primary">
          What we're building
        </h2>

        <NuxtLink
          to="/conductor"
          class="link link-hover text-xs font-bold text-base-content/60 hover:text-primary"
        >
          every project →
        </NuxtLink>
      </header>

      <div
        class="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))]"
      >
        <NuxtLink
          v-for="project in showcaseStore.projects"
          :key="project.id"
          :to="showcaseHref(project)"
          class="group flex items-center gap-3 kr-panel-flat p-3 transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
        >
          <div class="size-14 shrink-0">
            <kr-art-plate
              :source="project.art"
              variant="icon"
              shape="square"
              frame="thin"
              :alt="project.title"
              :fallback="fallbackFor(project)"
              placeholder-icon="kind-icon:blueprint"
              fit="cover"
            />
          </div>

          <div class="min-w-0 flex-1">
            <p class="flex items-center gap-1.5">
              <span
                class="truncate text-sm font-black group-hover:text-primary"
                :title="project.title"
              >
                {{ project.title }}
              </span>
              <span
                v-if="project.badge"
                class="badge badge-primary badge-xs shrink-0 font-bold"
              >
                {{ project.badge }}
              </span>
            </p>
            <p
              v-if="project.subtitle"
              class="truncate text-xs text-base-content/55"
              :title="project.subtitle"
            >
              {{ project.subtitle }}
            </p>
          </div>

          <Icon
            name="kind-icon:chevron-right"
            class="size-4 shrink-0 text-base-content/30 group-hover:text-primary"
          />
        </NuxtLink>
      </div>
    </section>

    <!-- 4. The feed, still whole. -->
    <section class="flex flex-col gap-2">
      <header class="flex flex-wrap items-baseline justify-between gap-3">
        <h2 class="text-xs font-black uppercase tracking-[0.18em] text-primary">
          From around the web
        </h2>

        <NuxtLink
          to="/plan/newsfeed"
          class="link link-hover text-xs font-bold text-base-content/60 hover:text-primary"
        >
          newsfeed lab →
        </NuxtLink>
      </header>

      <NewsfeedFeed
        class="kr-panel-flat p-4 shadow-sm sm:p-5"
        :initial-limit="9"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useHomeShowcaseStore } from '@/stores/homeShowcaseStore'
import { useUserStore } from '@/stores/userStore'
import {
  showcaseHref,
  type ShowcaseCard,
  type ShowcaseRailKey,
} from '@/utils/homeShowcase'
import { defaultArtFor } from '@/utils/defaultArtPool'
import type { ArtVariant } from '@/utils/artImageSrc'
import type { ArtPlateShape } from '@/utils/galleryVocabulary'

type RailDefinition = {
  key: ShowcaseRailKey
  label: string
  blurb: string
  /** Shown inside a plate that resolved no art at all -- never in the header. */
  placeholderIcon: string
  href: string
  shape: ArtPlateShape
  plateVariant: ArtVariant
}

const showcaseStore = useHomeShowcaseStore()
const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)

const greeting = computed(() =>
  isLoggedIn.value
    ? 'Everything the swarm made lately, newest first.'
    : 'Welcome in — everything below is live, and all of it is yours to poke at.',
)

/*
 * ORDER IS THE ARGUMENT. Art first because it is the most immediately legible
 * proof that something is happening here; the six schema objects next, in the
 * order the dream cycle itself creates them (dream, character, reward,
 * scenario, facet), with bots alongside; animations wherever they exist.
 *
 * Shapes differ on purpose: renders and clips are landscape work and get the
 * wide plate, authored objects are portrait cards. A rail of mismatched aspect
 * ratios reads as a junk drawer.
 */
const RAILS: RailDefinition[] = [
  {
    key: 'art',
    label: 'Fresh from the art queue',
    blurb: 'The newest renders the swarm finished.',
    placeholderIcon: 'kind-icon:palette-color',
    href: '/art',
    shape: 'wide',
    plateVariant: 'card',
  },
  {
    key: 'animations',
    label: 'Moving pictures',
    blurb: 'Clips out of the animation pipeline.',
    placeholderIcon: 'kind-icon:movie',
    href: '/art',
    shape: 'wide',
    plateVariant: 'card',
  },
  {
    key: 'dreams',
    label: 'New dreams',
    blurb: 'Pitches, worlds, and whatever else the cycle dreamt up.',
    placeholderIcon: 'kind-icon:dream',
    href: '/dreams',
    shape: 'card',
    plateVariant: 'card',
  },
  {
    key: 'characters',
    label: 'New characters',
    blurb: 'Faces to put in a story.',
    placeholderIcon: 'kind-icon:character',
    href: '/characters',
    shape: 'card',
    plateVariant: 'card',
  },
  {
    key: 'scenarios',
    label: 'New scenarios',
    blurb: 'Situations waiting for someone to walk into them.',
    placeholderIcon: 'kind-icon:scenario',
    href: '/stories',
    shape: 'card',
    plateVariant: 'card',
  },
  {
    key: 'rewards',
    label: 'New items and skills',
    blurb: 'Things to find, and things to learn.',
    placeholderIcon: 'kind-icon:treasure',
    href: '/rewards',
    shape: 'card',
    plateVariant: 'card',
  },
  {
    key: 'bots',
    label: 'New bots',
    blurb: 'Everyone who will talk back.',
    placeholderIcon: 'kind-icon:robot',
    href: '/bots',
    shape: 'card',
    plateVariant: 'card',
  },
  {
    key: 'facets',
    label: 'New facets',
    blurb: 'The ingredients everything else is mixed from.',
    placeholderIcon: 'kind-icon:shapes',
    href: '/facets',
    shape: 'card',
    plateVariant: 'card',
  },
]

const visibleRails = computed(() =>
  RAILS.map((definition) => ({
    ...definition,
    items: showcaseStore.rail(definition.key),
  })).filter((entry) => entry.items.length > 0),
)

function fallbackFor(card: ShowcaseCard): string {
  return defaultArtFor(`${card.kind}-${card.id}`)
}

onMounted(() => {
  void showcaseStore.load()
})
</script>
