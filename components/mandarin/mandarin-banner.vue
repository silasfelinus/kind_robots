<template>
  <section
    class="mandarin-banner relative isolate overflow-hidden rounded-3xl border border-base-300 shadow-sm"
  >
    <!-- Painted ground. Three pigment washes over warm paper, so the banner
         carries the tutor's picture-book identity even with zero rendered
         card art -- which is the state a fresh deck is always in. -->
    <div class="mandarin-banner__wash" aria-hidden="true" />

    <!-- Ink-wash hills and a low sun: one brush gesture, not a scene. -->
    <svg
      class="mandarin-banner__ink"
      viewBox="0 0 480 160"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <!-- Drawn before the hills so they cut across it: a low sun, not a blob. -->
      <circle cx="76" cy="98" r="24" class="mandarin-banner__sun" />
      <path
        d="M0 132 C 58 96, 96 122, 142 104 C 188 86, 214 118, 262 108 C 318 96, 352 126, 400 112 C 436 101, 462 118, 480 110 L 480 160 L 0 160 Z"
        class="mandarin-banner__hill mandarin-banner__hill--far"
      />
      <path
        d="M0 148 C 64 124, 118 146, 176 134 C 240 121, 286 148, 348 138 C 410 128, 448 148, 480 140 L 480 160 L 0 160 Z"
        class="mandarin-banner__hill mandarin-banner__hill--near"
      />
    </svg>

    <div class="mandarin-banner__grain" aria-hidden="true" />

    <div
      class="relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,21rem),1fr))] items-center gap-5 p-5"
    >
      <div class="flex min-w-0 flex-col gap-3">
        <div class="flex items-center gap-3">
          <!-- A carved seal, the way a Chinese picture book signs a page. -->
          <span class="mandarin-banner__seal" aria-hidden="true">学</span>
          <div class="min-w-0">
            <p class="mandarin-banner__title">Mandarin Tutor</p>
            <p class="mandarin-banner__subtitle">
              Learn the word, hear it, picture it, then open the character and see how it works.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <span class="mandarin-banner__stat">{{ cardCount }} cards</span>
          <span class="mandarin-banner__stat">{{ setCount }} decks</span>
          <span v-if="requestedCount" class="mandarin-banner__stat">
            {{ requestedCount }} requested
          </span>
          <span v-if="activeSetLabel" class="mandarin-banner__stat mandarin-banner__stat--active">
            {{ activeSetLabel }} · {{ activeSetSize }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,5rem),1fr))] gap-3">
        <figure v-for="tile in tiles" :key="tile.key" class="mandarin-banner__tile">
          <MandarinCardArt
            :card-key="tile.key"
            :simplified="tile.simplified"
            :meaning="tile.meaning"
            :art="tile.art"
            eager
            @error="emit('artError', tile.key)"
          >
            <figcaption class="mandarin-banner__caption">
              <!-- The glyph fallback is already the whole tile; repeating the
                   character under it just crowds the strip. -->
              <b v-if="tile.art" class="text-base leading-none">{{ tile.simplified }}</b>
              <span class="truncate text-xs opacity-85">{{ tile.pinyin }}</span>
            </figcaption>
          </MandarinCardArt>
        </figure>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
export type MandarinBannerTile = {
  key: string
  simplified: string
  pinyin: string
  meaning: string
  /** Rendered illustration, when one exists. Empty falls back to the glyph. */
  art: string
}

withDefaults(
  defineProps<{
    tiles: MandarinBannerTile[]
    cardCount: number
    setCount: number
    requestedCount?: number
    activeSetLabel?: string
    activeSetSize?: number
  }>(),
  {
    requestedCount: 0,
    activeSetLabel: '',
    activeSetSize: 0,
  },
)

const emit = defineEmits<{ artError: [cardKey: string] }>()
</script>

<style scoped>
/*
 * Pigments, not theme tokens. The banner is a painted object -- the same warm
 * gouache palette the card art is generated in -- so it holds its identity
 * across every DaisyUI theme instead of restating whichever one is active. All
 * text inside it is set against these colours, never against the page surface.
 */
.mandarin-banner {
  --ink: #21303c;
  --indigo: #2c4a78;
  --jade: #3d7d69;
  --persimmon: #e0663f;
  --ochre: #d8a441;
  --seal: #b8342b;
  --paper: #f7f0e0;
  min-height: 11rem;
  color: var(--paper);
}

.mandarin-banner__wash {
  position: absolute;
  inset: 0;
  z-index: -3;
  background:
    radial-gradient(115% 150% at 4% 0%, var(--indigo) 0%, transparent 58%),
    radial-gradient(85% 120% at 98% 4%, var(--persimmon) 0%, transparent 52%),
    radial-gradient(120% 130% at 62% 108%, var(--jade) 0%, transparent 62%),
    linear-gradient(115deg, var(--ink) 0%, #35506b 45%, #6d7f63 100%);
}

.mandarin-banner__ink {
  position: absolute;
  inset: auto 0 0 0;
  z-index: -2;
  width: 100%;
  height: 62%;
}

.mandarin-banner__sun {
  fill: var(--ochre);
  opacity: 0.5;
}

.mandarin-banner__hill {
  fill: var(--ink);
}

.mandarin-banner__hill--far {
  opacity: 0.22;
}

.mandarin-banner__hill--near {
  opacity: 0.38;
}

/* Paper tooth. Generated inline so the banner pulls no external asset. */
.mandarin-banner__grain {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.14;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23g)'/%3E%3C/svg%3E");
}

.mandarin-banner__seal {
  display: grid;
  place-items: center;
  flex: none;
  width: 3rem;
  height: 3rem;
  border-radius: 0.6rem;
  background: var(--seal);
  color: var(--paper);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  transform: rotate(-4deg);
  box-shadow: 0 2px 10px rgb(0 0 0 / 0.28);
}

.mandarin-banner__title {
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1.1;
  text-shadow: 0 1px 12px rgb(0 0 0 / 0.45);
}

.mandarin-banner__subtitle {
  margin-top: 0.25rem;
  max-width: 34rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  opacity: 0.86;
  text-shadow: 0 1px 8px rgb(0 0 0 / 0.4);
}

.mandarin-banner__stat {
  border-radius: 999px;
  border: 1px solid rgb(247 240 224 / 0.35);
  background: rgb(33 48 60 / 0.35);
  padding: 0.15rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.mandarin-banner__stat--active {
  border-color: var(--ochre);
  background: rgb(216 164 65 / 0.28);
}

.mandarin-banner__tile {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid rgb(247 240 224 / 0.3);
  box-shadow: 0 6px 18px rgb(0 0 0 / 0.25);
}

.mandarin-banner__caption {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0.3rem 0.5rem;
  background: linear-gradient(to top, rgb(20 28 36 / 0.82), transparent);
  color: var(--paper);
}
</style>
