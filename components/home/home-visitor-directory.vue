<template>
  <div class="visitor-home flex h-full min-h-0 flex-col gap-2 overflow-hidden">
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

    <div class="kr-panes visitor-layout min-h-0 gap-2">
      <section
        id="visitor-featured"
        role="tabpanel"
        aria-label="Featured experiences"
        class="visitor-pane visitor-featured min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100/95 p-3"
        :class="activeSection === 'featured' ? 'flex' : 'hidden'"
      >
        <div class="kr-pane-scroll min-h-0 pr-1">
          <aside
            aria-label="Against Malaria Foundation"
            class="visitor-mission mb-2 flex shrink-0 items-center justify-between gap-2 rounded-xl border border-base-300 bg-base-200/75 px-3 py-2"
          >
            <p
              class="visitor-mission-line min-w-0 text-[0.7rem] font-semibold leading-snug text-pretty sm:text-xs"
            >
              Free games. No ads. Helping fund mosquito nets.
            </p>
            <a
              href="https://www.againstmalaria.com/amibot"
              target="_blank"
              rel="noopener noreferrer"
              class="shrink-0 whitespace-nowrap text-xs font-black text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              Fight malaria ↗
              <span class="sr-only">(opens in a new tab)</span>
            </a>
          </aside>
          <header
            class="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2"
          >
            <div>
              <h2 class="font-serif text-lg font-black">
                Featured experiences
              </h2>
              <p class="text-xs opacity-65">A handpicked tour of Kind Robots</p>
            </div>
            <div class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
              <button
                v-if="admin"
                type="button"
                class="text-xs font-bold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                @click="$emit('openDashboard')"
              >
                Admin dashboard →
              </button>
              <NuxtLink
                to="/navigation"
                class="text-xs font-bold text-primary hover:underline"
              >
                All destinations →
              </NuxtLink>
            </div>
          </header>
          <div
            class="mb-2 flex shrink-0 flex-wrap gap-1"
            aria-label="Filter experiences"
          >
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
            <button
              type="button"
              class="rounded-full border px-3 py-1 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              :class="
                showPosters
                  ? 'border-primary bg-primary text-primary-content'
                  : 'border-base-300 bg-base-200 hover:border-primary/60'
              "
              :aria-pressed="showPosters"
              data-testid="visitor-poster-toggle"
              @click="showPosters = !showPosters"
            >
              {{ showPosters ? 'Show experiences' : 'View posters' }}
            </button>
          </div>
          <div
            v-if="!showPosters"
            class="visitor-featured-grid grid grid-cols-1 gap-2"
          >
            <article
              v-for="feature in filteredFeatures"
              :key="feature.route"
              class="visitor-feature-card group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-200 transition duration-300 hover:-translate-y-0.5 hover:border-primary/70 hover:shadow-xl"
              :class="{
                'visitor-feature-card--lead': feature.route === '/play/arcade',
              }"
              :style="featureStyle(feature)"
            >
              <NuxtLink
                :to="feature.route"
                class="flex min-w-0 flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div
                  class="visitor-feature-art relative aspect-[16/11] overflow-hidden bg-neutral"
                >
                  <div
                    v-if="
                      feature.montage?.length && !hasCuratedFeatureHero(feature)
                    "
                    role="img"
                    :aria-label="feature.title + ' illustrated game art'"
                    class="visitor-montage grid h-full w-full grid-cols-3 overflow-hidden"
                    :class="{
                      'visitor-montage--arcade':
                        feature.route === '/play/arcade',
                    }"
                  >
                    <img
                      v-for="src in feature.montage"
                      :key="src"
                      :src="src"
                      alt=""
                      loading="lazy"
                      class="h-full w-full min-w-0 object-cover"
                    />
                  </div>
                  <img
                    v-else-if="featureArt(feature)"
                    :src="featureArt(feature)"
                    :alt="feature.title + ' cover artwork'"
                    loading="lazy"
                    class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div
                    v-else
                    class="flex h-full items-center justify-center bg-linear-to-br from-indigo-950 via-fuchsia-950 to-slate-950 p-4 text-center text-white"
                  >
                    <span class="font-serif text-2xl font-black">
                      {{ feature.title }}
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/95 via-black/25 to-transparent"
                  />
                  <span
                    class="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-md border border-white/30 bg-black/55 px-2 py-1 text-[0.65rem] font-bold text-white backdrop-blur-sm"
                  >
                    {{ feature.tag }}
                  </span>
                  <div class="absolute inset-x-0 bottom-0 p-3 text-white">
                    <p
                      class="mb-1 text-[0.6rem] font-black uppercase tracking-[0.17em] text-white/80"
                    >
                      {{
                        feature.category === 'play'
                          ? 'Play'
                          : feature.category === 'create'
                            ? 'Create'
                            : 'Learn'
                      }}
                      / Kind Robots
                    </p>
                    <h3
                      class="visitor-feature-title font-serif text-2xl font-black leading-none drop-shadow-lg"
                    >
                      {{ feature.title }}
                    </h3>
                  </div>
                </div>
                <div
                  class="flex min-w-0 items-center justify-between gap-2 px-3 py-2.5"
                >
                  <p
                    class="line-clamp-2 min-w-0 text-xs leading-relaxed opacity-75"
                  >
                    {{ feature.description }}
                  </p>
                  <span
                    aria-hidden="true"
                    class="shrink-0 text-lg font-black text-primary transition group-hover:translate-x-0.5"
                    >↗</span
                  >
                </div>
              </NuxtLink>
            </article>
          </div>
          <div
            v-else
            class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))] gap-3"
            data-testid="visitor-poster-gallery"
          >
            <NuxtLink
              v-for="view in advertStore.posters"
              :key="view.poster.slug"
              :to="advertPlayPath(view.poster)"
              class="group min-w-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-1.5 transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              :aria-label="`Play ${view.poster.name}`"
            >
              <advert-poster :poster="view.poster" :images="view.images" />
              <p
                class="truncate px-1 py-1 text-sm font-bold group-hover:text-primary"
              >
                {{ view.poster.name }}
              </p>
            </NuxtLink>
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
              <span
                class="text-[0.65rem] font-black uppercase tracking-wide text-primary"
              >
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
            <p class="mt-1 text-xs leading-snug opacity-75">
              {{ update.description }}
            </p>
            <a
              v-if="admin"
              :href="
                'https://github.com/silasfelinus/kind_robots/pull/' + update.pr
              "
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 inline-block text-[0.65rem] font-semibold text-primary hover:underline"
            >
              Development notes #{{ update.pr }}
              <span class="sr-only">(opens in a new tab)</span>
            </a>
          </article>
          <p v-if="admin" class="text-[0.65rem] leading-snug opacity-60">
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
            <p class="text-xs opacity-65">
              Art, characters and stories from the galleries
            </p>
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
                  :alt="card.label"
                  :fallback="defaultArtFor(card.kind + '-' + card.id)"
                  fit="cover"
                />
              </div>
              <div class="p-1.5">
                <p
                  class="truncate text-[0.7rem] font-bold group-hover:text-primary"
                >
                  {{ card.label }}
                </p>
                <p class="text-[0.6rem] uppercase opacity-60">
                  {{ card.kind }}
                </p>
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
            <NuxtLink
              to="/dreams"
              class="font-bold text-primary hover:underline"
            >
              Explore Daily Dreams →
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>

    <footer
      class="flex shrink-0 flex-wrap items-center justify-between gap-2 px-1 text-xs"
    >
      <span class="opacity-70"
        >Kind Robots builds creative tools for human benefit.</span
      >
      <NuxtLink to="/about" class="font-bold text-primary hover:underline">
        Our mission →
      </NuxtLink>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAdvertStore } from '@/stores/advertStore'
import { advertPlayPath } from '@/utils/adverts/posters'
import { defaultArtFor } from '@/utils/defaultArtPool'
import {
  freshShowcaseCards,
  showcaseHref,
  type HomeShowcase,
  type LabeledShowcaseCard,
} from '@/utils/homeShowcase'

const advertStore = useAdvertStore()
onMounted(() => void advertStore.loadPublicSelections())

const props = defineProps<{
  showcase: HomeShowcase
  loaded: boolean
  admin: boolean
}>()

defineEmits<{ openDashboard: [] }>()

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
const showPosters = ref(false)

type FeaturedExperience = {
  title: string
  tag: string
  category: 'play' | 'create' | 'learn'
  route: string
  image?: string
  posterSlug?: string
  montage?: readonly string[]
  description: string
}

const features: FeaturedExperience[] = [
  {
    title: 'The Arcade',
    tag: 'Free games',
    category: 'play',
    route: '/play/arcade',
    posterSlug: 'arcade',
    montage: [
      '/images/arcade/games/zuzu-ghost-trail-title.webp',
      '/images/arcade/games/prize-show-panic-title.webp',
      '/images/arcade/games/zuzu-last-bell-title.webp',
    ],
    description: 'Original cabinets, high scores and quick-fire challenges.',
  },
  {
    title: 'Chessweeper',
    posterSlug: 'chessweeper',
    tag: 'Three dangerous worlds · Chess, mines & sawblades',
    category: 'play',
    route: '/play/chessweeper',
    image: '/chessweeper/link-preview.webp',
    description:
      'Outmaneuver enemy kings, hidden mines and moving sawblades in three outrageous worlds.',
  },
  {
    title: 'Prom of Doom',
    posterSlug: 'prom-of-doom',
    tag: 'Capes & Tassels · Playable superhero school',
    category: 'play',
    route: '/play/comet-city-academy',
    image: '/comet-city-academy/front/dashboard-highlight.webp',
    description: 'Pick a superpower, dispatch classmates, and survive prom.',
  },
  {
    title: 'Space Couch',
    posterSlug: 'space-couch',
    tag: 'Playable space adventure',
    category: 'play',
    route: '/play/game-of-captains',
    image: '/game-of-captains/front/dashboard-highlight.webp',
    description:
      'Four spacers, one long red couch, an invisible force shield, and infinite trouble.',
  },
  {
    title: 'Slime City',
    posterSlug: 'slime-city',
    tag: 'Sign-in playtest · BLACKOUT CCG',
    category: 'play',
    route: '/play/slime-city',
    image: '/api/art/images/272640/file',
    description:
      'Command six mutant crews, battle with collectible cards and explore seven rival districts.',
  },
  {
    title: 'Hybridizer',
    posterSlug: 'hybridizer',
    tag: 'Browse free · Fusion lab',
    category: 'play',
    route: '/play/hybridizer',
    montage: [
      '/api/art/images/258076/file',
      '/api/art/images/258083/file',
      '/api/art/images/258078/file',
    ],
    description:
      'Mix animals, fruit and monsters into new species, then fuse your discoveries again.',
  },
  {
    title: 'Terrors on Crystal Street',
    posterSlug: 'crystal-street',
    tag: 'New · 80s horror comedy',
    category: 'play',
    route: '/play/crystal-street',
    image: '/api/art/images/272634/file',
    description:
      'Survive Halloween week, 1986, against twenty-three remixed nightmares.',
  },
  {
    title: 'Emperor of Dust',
    posterSlug: 'emperor-of-dust',
    tag: 'Fortress adventure',
    category: 'play',
    route: '/play/emperor-of-dust',
    image: '/emperor-of-dust/intro/fortress.webp',
    description: 'Rule the wasteland, command followers and make hard choices.',
  },
  {
    title: 'Save the Plumber',
    posterSlug: 'save-the-plumber',
    tag: 'Playable preview',
    category: 'play',
    route: '/play/save-the-plumber',
    image: '/save-the-plumber/maps/world-1.webp',
    description:
      'Run, jump and rescue your plumber through eight strange worlds.',
  },
  {
    title: 'Rainbow Bullet Hell Space Princess',
    posterSlug: 'rainbow-princess',
    tag: 'Playable preview',
    category: 'play',
    route: '/play/rainbow-bullet-hell-space-princess',
    image: '/rainbow-princess-art/hero-pearl-palace.webp',
    description:
      'Pilot a pastel starfighter through ocean-born fleets and spectacular boss battles.',
  },
  {
    title: 'Zuzu Pinball',
    tag: 'Haunted pinball',
    category: 'play',
    route: '/play/zuzu-pinball',
    image: '/zuzu-pinball/last-bell-cover.webp',
    description:
      'Ring the Last Bell and brave the River Croc on a 3D pinball table.',
  },
  {
    title: 'Zuzu: Shifting Lands',
    posterSlug: 'shifting-lands',
    tag: 'Board adventure',
    category: 'play',
    route: '/play/zuzu-shifting-lands',
    image: '/shifting-lands/cards/the-map-in-ashes.webp',
    description:
      'Explore changing lands, encounter strangers and test your luck.',
  },
  {
    title: 'Zuzu Gamebook',
    posterSlug: 'zuzu-gamebook',
    tag: 'Illustrated gamebook',
    category: 'play',
    route: '/play/zuzu-gamebook',
    image: '/zuzu-gamebook/scenes/waterhole.webp',
    description:
      'Choose the koala ronin’s road through dice, danger and branching stories.',
  },
  {
    title: 'Ecotone: Weird Humboldt',
    posterSlug: 'ecotone',
    tag: 'Comedy-horror adventure',
    category: 'play',
    route: '/play/ecotone',
    image: '/ecotone/title/key-art.webp',
    description:
      'A strange Humboldt festival weekend where your choices shape the county.',
  },
  {
    title: 'Downward Mobility',
    tag: 'Interactive satire',
    category: 'play',
    route: '/play/shifting-desks',
    posterSlug: 'the-elevator-only-goes-down',
    image: '/api/art/images/272631/file',
    description:
      'Survive office politics, impossible choices and your first 90-day review.',
  },
  {
    title: 'Storybook',
    tag: 'Make stories',
    category: 'create',
    route: '/storybook',
    image: '/storybook-art/dashboard-highlight.webp',
    description: 'Weave your own worlds, characters and branching tales.',
  },
  {
    title: 'Art Gallery & Studio',
    tag: 'Explore and create',
    category: 'create',
    route: '/art',
    image: '/art-gallery/link-preview.webp',
    description: 'Browse finished work, or sign in to generate your own.',
  },
  {
    title: 'Cthulhuquarium',
    posterSlug: 'aquarium',
    tag: 'Creature collecting',
    category: 'play',
    route: '/play/aquarium',
    image: '/images/channels/admin/aquarium.webp',
    description: 'Meet strange aquatic creatures and grow your own tank.',
  },
  {
    title: 'Memory Dungeon',
    posterSlug: 'memory-dungeon',
    tag: 'Card adventure',
    category: 'play',
    route: '/play/memory',
    image: '/memory-dungeon/link-preview.webp',
    description: 'Match cards, survive the dungeon and collect rewards.',
  },
  {
    title: 'Daily Dreams',
    tag: 'Featured today',
    category: 'create',
    route: '/?view=dashboard',
    image: '/images/splash/dreams.webp',
    description: 'See the daily Dream and the original dashboard of creations.',
  },
  {
    title: 'Music Videos',
    tag: 'Watch and remix',
    category: 'create',
    route: '/play/video-generator?studio=music',
    image: '/images/channels/plan/video-generator.webp',
    description: 'Watch illustrated music videos and remix new drafts.',
  },
  {
    title: 'Mandarin Tutor',
    tag: 'Learn',
    category: 'learn',
    route: '/play/mandarin',
    image: '/images/mandarin-tutor/cards/v2/f24c02b7272a3d3004079114.webp',
    description: 'Discover how Chinese characters work, then practice.',
  },
  {
    title: 'Kind Robots Pinball',
    tag: 'Arcade pinball',
    category: 'play',
    route: '/play/arcade?game=kind-pinball',
    image: '/images/arcade/games/kind-pinball-title.webp',
    description:
      'Flip into AMI Village Rescue, the original arcade pinball table.',
  },
]

function posterForFeature(feature: FeaturedExperience) {
  return advertStore.posters.find(
    (view) => view.poster.slug === feature.posterSlug,
  )
}

function hasCuratedFeatureHero(feature: FeaturedExperience): boolean {
  const view = posterForFeature(feature)
  const hero = view?.poster.hero
  return Boolean(
    hero && view?.images[hero.key] && view.images[hero.key] !== hero.defaultSrc,
  )
}

function featureArt(feature: FeaturedExperience): string | undefined {
  const view = posterForFeature(feature)
  return (
    (view?.poster.hero && view.images[view.poster.hero.key]) || feature.image
  )
}

function featureStyle(feature: FeaturedExperience) {
  const accent = posterForFeature(feature)?.poster.palette.a1
  return accent ? { '--visitor-accent': accent } : undefined
}

const filteredFeatures = computed(() =>
  features.filter(
    (feature) =>
      selectedCategory.value === 'all' ||
      feature.category === selectedCategory.value,
  ),
)

const updates = [
  {
    title: 'Terrors on Crystal Street opens',
    description:
      'A painted cast of nightmares and friends, a monster gallery and endings.',
    category: 'Crystal Street',
    date: 'Oct 24',
    route: '/play/crystal-street',
    pr: 4128,
  },
  {
    title: 'A clearer Zuzu Pinball entrance',
    description: 'The public table opens without the oversized introduction.',
    category: 'Zuzu Pinball',
    date: 'Oct 13',
    route: '/play/zuzu-pinball',
    pr: 3669,
  },
  {
    title: 'More illustrated choices in Downward Mobility',
    description: 'New selectable art styles and a more visual front desk.',
    category: 'Downward Mobility',
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

const newest = computed<LabeledShowcaseCard[]>(() =>
  freshShowcaseCards([
    ...props.showcase.rails.art,
    ...props.showcase.rails.dreams,
    ...props.showcase.rails.characters,
    ...props.showcase.rails.scenarios,
    ...props.showcase.rails.rewards,
  ]),
)
</script>

<style scoped>
.visitor-home {
  container-type: inline-size;
}

.visitor-layout {
  grid-template-columns: minmax(0, 1fr);
}

.visitor-feature-card {
  isolation: isolate;
}

.visitor-feature-art::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: 1px solid
    color-mix(in srgb, var(--visitor-accent, white) 38%, transparent);
  border-radius: inherit;
}

.visitor-feature-card:hover .visitor-feature-title {
  color: var(--visitor-accent, white);
}

.visitor-montage--arcade {
  gap: 0.65rem;
  padding: 0.85rem;
  background: radial-gradient(circle at 50% 0%, #79255c, #101027 76%);
}

.visitor-montage--arcade img {
  border: 1px solid rgb(255 255 255 / 40%);
  border-radius: 0.5rem;
  box-shadow: 0 0.75rem 1.5rem rgb(0 0 0 / 55%);
  transform: rotate(-5deg) translateY(7%);
}

.visitor-montage--arcade img:nth-child(2) {
  transform: rotate(4deg) translateY(-3%) scale(1.07);
}

.visitor-montage--arcade img:nth-child(3) {
  transform: rotate(7deg) translateY(9%);
}

@container (min-width: 36rem) {
  .visitor-featured-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .visitor-feature-card--lead {
    grid-column: span 2;
  }

  .visitor-feature-card--lead .visitor-feature-art {
    aspect-ratio: 16 / 7;
  }

  .visitor-feature-card--lead .visitor-feature-title {
    font-size: 2.75rem;
  }
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

  .visitor-featured-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-content: start;
  }

  .visitor-featured-grid h3 {
    font-size: 1rem;
    line-height: 1.35;
  }

  .visitor-featured-grid article p {
    font-size: 0.8125rem;
    line-height: 1.4;
  }
}
@container (min-width: 84rem) {
  .visitor-featured-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
