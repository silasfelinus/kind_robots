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
          <section
            aria-labelledby="visitor-hero-title"
            class="visitor-hero relative mb-2 shrink-0 overflow-hidden rounded-xl border border-base-300 bg-neutral text-neutral-content"
          >
            <img
              src="/crystal-street/cover.webp"
              alt=""
              class="visitor-hero-art absolute inset-0 h-full w-full object-cover"
            />
            <div
              class="visitor-hero-shade absolute inset-0 bg-linear-to-r from-neutral via-neutral/85 to-neutral/40"
            />
            <div class="visitor-hero-copy relative flex flex-col gap-1.5 p-3">
              <h2
                id="visitor-hero-title"
                class="font-serif text-base font-black leading-tight"
              >
                Free handmade games and stories. No ads, no account needed.
              </h2>
              <p class="text-xs leading-snug opacity-85">
                Kind Robots raises money for the Against Malaria Foundation.
              </p>
              <div class="mt-0.5 flex flex-wrap gap-2">
                <NuxtLink
                  to="/play/crystal-street"
                  class="btn btn-primary btn-sm rounded-xl"
                >
                  <icon name="kind-icon:play" class="h-4 w-4" />
                  Play Terrors on Crystal Street
                </NuxtLink>
                <a
                  href="https://www.againstmalaria.com/amibot"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-outline btn-sm rounded-xl border-neutral-content/60 text-neutral-content hover:border-neutral-content hover:bg-neutral-content hover:text-neutral"
                >
                  <icon name="kind-icon:hand-heart" class="h-4 w-4" />
                  Give to fight malaria
                  <span aria-hidden="true">↗</span>
                  <span class="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            </div>
          </section>
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
          </div>
          <div class="visitor-featured-grid grid grid-cols-1 gap-2">
            <article
              v-for="feature in filteredFeatures"
              :key="feature.route"
              class="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-200/55 transition hover:border-primary/60 hover:shadow-md"
            >
              <NuxtLink
                :to="feature.route"
                class="flex min-w-0 flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div
                  class="relative aspect-[16/10] overflow-hidden bg-base-300"
                >
                  <img
                    v-if="feature.image"
                    :src="feature.image"
                    :alt="feature.title"
                    loading="lazy"
                    class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div
                    v-else
                    class="flex h-full w-full flex-col items-center justify-center gap-2 bg-linear-to-br p-3 text-center text-white transition duration-300 group-hover:scale-105"
                    :class="
                      feature.route === '/play/slime-city'
                        ? 'from-fuchsia-900 via-violet-950 to-slate-950'
                        : 'from-emerald-900 via-teal-950 to-indigo-950'
                    "
                  >
                    <Icon
                      :name="
                        feature.route === '/play/slime-city'
                          ? 'kind-icon:cat'
                          : 'kind-icon:dna'
                      "
                      class="h-12 w-12 drop-shadow-lg"
                      aria-hidden="true"
                    />
                    <span
                      class="text-lg font-black tracking-[0.12em] drop-shadow-lg"
                    >
                      {{ feature.title }}
                    </span>
                    <span class="text-[0.65rem] font-semibold opacity-75">
                      {{ feature.route === '/play/slime-city' ? 'BLACKOUT CCG' : 'FUSION LAB' }}
                    </span>
                  </div>
                  <span
                    class="absolute bottom-1 left-1 rounded-md bg-base-100/95 px-1.5 py-0.5 text-[0.6rem] font-black text-base-content"
                  >
                    {{ feature.tag }}
                  </span>
                </div>
                <div class="min-w-0 flex-1 space-y-1 p-2">
                  <h3
                    class="text-sm font-black leading-tight group-hover:text-primary"
                  >
                    {{ feature.title }}
                  </h3>
                  <p class="text-xs leading-snug opacity-70">
                    {{ feature.description }}
                  </p>
                </div>
              </NuxtLink>
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
  freshShowcaseCards,
  showcaseHref,
  type HomeShowcase,
  type LabeledShowcaseCard,
} from '@/utils/homeShowcase'

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

const features = [
  {
    title: 'The Arcade',
    tag: 'Free games',
    category: 'play',
    route: '/play/arcade',
    image: '/images/arcade/arcade-attract-splash.webp',
    description: 'Original cabinets, high scores and quick-fire challenges.',
  },
  {
    title: 'Prom of Doom',
    tag: 'Capes & Tassels · Playable superhero school',
    category: 'play',
    route: '/play/comet-city-academy',
    image: '/comet-city-academy/front/dashboard-highlight.webp',
    description: 'Pick a superpower, dispatch classmates, and survive prom.',
  },
  {
    title: 'Space Couch',
    tag: 'Playable space adventure',
    category: 'play',
    route: '/play/game-of-captains',
    image: '/game-of-captains/front/dashboard-highlight.webp',
    description:
      'Four spacers, one long red couch, an invisible force shield, and infinite trouble.',
  },
  {
    title: 'Slime City',
    tag: 'Sign-in playtest · BLACKOUT CCG',
    category: 'play',
    route: '/play/slime-city',
    image: '',
    description:
      'Command six mutant crews, battle with collectible cards and explore seven rival districts.',
  },
  {
    title: 'Hybridizer',
    tag: 'Sign-in playtest · Fusion lab',
    category: 'play',
    route: '/play/hybridizer',
    image: '',
    description:
      'Mix animals, fruit and monsters into new species, then fuse your discoveries again.',
  },
  {
    title: 'Terrors on Crystal Street',
    tag: 'New · 80s horror comedy',
    category: 'play',
    route: '/play/crystal-street',
    image: '/crystal-street/cover.webp',
    description:
      'Survive Halloween week, 1986, against twenty-three remixed nightmares.',
  },
  {
    title: 'Emperor of Dust',
    tag: 'Fortress adventure',
    category: 'play',
    route: '/play/emperor-of-dust',
    image: '/emperor-of-dust/intro/fortress.webp',
    description: 'Rule the wasteland, command followers and make hard choices.',
  },
  {
    title: 'Save the Plumber',
    tag: 'Playable preview',
    category: 'play',
    route: '/play/save-the-plumber',
    image: '/save-the-plumber/maps/world-1.webp',
    description:
      'Run, jump and rescue your plumber through eight strange worlds.',
  },
  {
    title: 'Rainbow Bullet Hell Space Princess',
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
    tag: 'Board adventure',
    category: 'play',
    route: '/play/zuzu-shifting-lands',
    image: '/shifting-lands/cards/the-map-in-ashes.webp',
    description:
      'Explore changing lands, encounter strangers and test your luck.',
  },
  {
    title: 'Zuzu Gamebook',
    tag: 'Illustrated gamebook',
    category: 'play',
    route: '/play/zuzu-gamebook',
    image: '/zuzu-gamebook/scenes/waterhole.webp',
    description:
      'Choose the koala ronin’s road through dice, danger and branching stories.',
  },
  {
    title: 'Ecotone: Weird Humboldt',
    tag: 'Comedy-horror adventure',
    category: 'play',
    route: '/play/ecotone',
    image: '/ecotone/title/key-art.webp',
    description:
      'A strange Humboldt festival weekend where your choices shape the county.',
  },
  {
    title: 'Shifting Desks',
    tag: 'Interactive satire',
    category: 'play',
    route: '/play/shifting-desks',
    image: '/shifting-desks/front-poster.svg',
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
    image: '/images/art/generate.webp',
    description: 'Browse finished work, or sign in to generate your own.',
  },
  {
    title: 'Cthulhuquarium',
    tag: 'Creature collecting',
    category: 'play',
    route: '/play/aquarium',
    image: '/images/channels/admin/aquarium.webp',
    description: 'Meet strange aquatic creatures and grow your own tank.',
  },
  {
    title: 'Memory Dungeon',
    tag: 'Card adventure',
    category: 'play',
    route: '/play/memory',
    image: '/images/background/memorydungeon.webp',
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

.visitor-hero-art {
  object-position: center 30%;
}

@container (min-width: 36rem) {
  .visitor-featured-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container (min-width: 40rem) {
  .visitor-hero-art {
    left: auto;
    right: 0;
    width: 62%;
  }

  .visitor-hero-copy {
    max-width: 34rem;
    padding: 0.875rem 1rem;
  }

  .visitor-hero h2 {
    font-size: 1.25rem;
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
