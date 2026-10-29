<template>
  <main
    class="kr-surface cs @container h-full min-h-0 overflow-hidden bg-base-200 px-2 py-2 text-base-content sm:px-3"
    :class="[
      run?.phase === 'night' ? 'cs-night' : 'cs-day',
      store.settings.contrast === 'high' ? 'cs-high-contrast' : '',
      store.settings.motion === 'reduced' ? 'cs-motion-reduced' : '',
    ]"
    data-theme="crystal-street"
    data-layout="console-fixed"
  >
    <p
      v-if="store.storageWarning"
      class="kr-note kr-note-error p-2 text-sm"
      role="alert"
    >
      {{ store.storageWarning }}
    </p>

    <header
      v-if="store.loaded && menuScreen"
      class="kr-toolbar cs-bar"
      data-testid="cs-menu-bar"
    >
      <button
        type="button"
        class="cs-brand"
        aria-label="Back to the main menu"
        @click="view = 'title'"
      >
        <span class="cs-display hidden text-sm leading-none @3xl:block"
          >Crystal Street</span
        >
        <span
          class="flex items-center gap-1 cs-label font-bold uppercase tracking-widest"
        >
          <icon name="kind-icon:arrow-left" class="h-3 w-3" /> Menu
        </span>
      </button>
      <crystal-street-dial
        :items="dialItems"
        :model-value="view"
        label="Menu screens"
        @select="onDial"
      />
    </header>

    <header
      v-else-if="store.loaded && run && view !== 'title'"
      class="kr-toolbar cs-bar"
    >
      <button
        type="button"
        class="cs-brand"
        aria-label="Back to the main menu"
        @click="view = 'title'"
      >
        <span class="cs-display hidden text-sm leading-none @3xl:block"
          >Crystal Street</span
        >
        <span class="cs-label font-bold uppercase tracking-widest">
          {{
            run.ending
              ? 'Week over'
              : `Day ${run.day} · ${run.phase === 'night' ? 'Night' : 'Day'}`
          }}
        </span>
      </button>
      <div
        class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs"
        aria-label="Your state"
      >
        <span class="cs-meter" :title="`Nerve ${run.nerve} of ${MAX_NERVE}`">
          <icon name="kind-icon:heart" class="h-4 w-4 text-primary" />
          <strong>{{ run.nerve }}</strong>
          <span class="sr-only">nerve</span>
        </span>
        <span class="cs-meter" :title="`Dread ${run.dread} of ${MAX_DREAD}`">
          <icon name="kind-icon:ghost" class="h-4 w-4 text-secondary" />
          <span class="cs-dread" aria-hidden="true">
            <span :style="{ width: `${run.dread * 10}%` }" />
          </span>
          <span class="sr-only">dread {{ run.dread }}</span>
        </span>
        <span class="cs-meter hidden @md:flex" title="Quarters">
          <icon name="kind-icon:coin" class="h-4 w-4 text-accent" />{{
            run.quarters
          }}
        </span>
        <span class="cs-meter hidden @lg:flex" title="Night wins">
          <icon name="kind-icon:dice" class="h-4 w-4" />{{ run.wins }}
        </span>
        <crystal-street-standing :run="run" class="cs-meter" />
      </div>
      <crystal-street-dial
        :items="dialItems"
        :model-value="view"
        label="Game screens"
        @select="onDial"
      />
    </header>

    <crystal-street-tip v-if="store.loaded && view === 'stage'" />
    <div v-if="!store.loaded" class="kr-stage" aria-hidden="true" />
    <div v-else class="kr-stage">
      <crystal-street-credits
        v-if="view === 'credits'"
        @back="view = 'settings'"
      />
      <crystal-street-settings
        v-else-if="view === 'settings'"
        @credits="view = 'credits'"
      />
      <crystal-street-theme v-else-if="view === 'theme'" />
      <crystal-street-scrapbook v-else-if="view === 'scrapbook'" />
      <crystal-street-title
        v-else-if="view === 'title' || !run"
        :shared="shared"
        @resume="view = 'stage'"
        @started="view = 'stage'"
        @open="openMenu"
      />
      <section
        v-else-if="view === 'you'"
        class="kr-panes grid-cols-1"
        aria-label="Your character"
      >
        <div class="kr-pane-scroll">
          <crystal-street-character
            :avatar="run.avatar"
            :archetype="run.archetype"
            :name="run.name"
            :pronouns="run.pronouns"
            :skills="run.skills"
          />
          <section class="cs-frame mt-3 space-y-2 p-3" aria-label="Standing">
            <h3 class="cs-kicker">Standing in town</h3>
            <p class="text-xs opacity-75">
              If any of these hits zero the week ends its own way. Lose every
              friend and you face Halloween alone, as the Final Girl.
            </p>
            <crystal-street-standing :run="run" full />
          </section>
        </div>
      </section>
      <crystal-street-crew v-else-if="view === 'crew'" />
      <crystal-street-case v-else-if="view === 'case'" />
      <crystal-street-pack v-else-if="view === 'pack'" />
      <crystal-street-ending
        v-else-if="run.ending"
        @again="view = 'title'"
        @scrapbook="view = 'scrapbook'"
      />
      <div
        v-else-if="arrival"
        class="cs-frame kr-stage relative overflow-hidden"
      >
        <crystal-street-art
          class="absolute inset-0"
          frame="h-full"
          kind="villain"
          :seed="villain!.id"
          :src="`/crystal-street/villains/${villain!.id}-poster.webp`"
          :palette="villain!.palette"
          :sigil="villain!.sigil"
          :alt="villain!.poster"
        />
        <div
          class="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-4 pt-16 text-white"
        >
          <p class="cs-kicker text-secondary">
            Saturday night. Something wakes under Crystal Street.
          </p>
          <h2 class="cs-display text-3xl leading-tight sm:text-5xl">
            {{ villain!.name }}
          </h2>
          <p class="text-sm uppercase tracking-widest opacity-80">
            {{ villain!.epithet }}
          </p>
          <p class="text-xs uppercase tracking-widest text-secondary">
            {{ remixLine(villain!) }}
          </p>
          <p class="max-w-2xl">{{ villain!.logline }}</p>
          <p class="cs-quote max-w-2xl">“{{ villain!.taunts[0] }}”</p>
          <button
            type="button"
            class="btn btn-primary btn-sm rounded-2xl"
            data-testid="cs-face-night"
            @click="arrivalSeen = run.seed"
          >
            Face the night
          </button>
        </div>
      </div>
      <crystal-street-encounter v-else-if="store.encounter" />
      <crystal-street-draw v-else-if="store.drawing" />
      <crystal-street-map v-else />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import { useNavStore } from '~/stores/navStore'
import {
  MAX_DREAD,
  MAX_NERVE,
  characterFor,
  remixLine,
  sharedWeekFrom,
} from '~/utils/crystalStreet/rules'
import type { DialItem, MenuView } from '~/utils/crystalStreet/menu'
import { StreetSound, cuesFor } from '~/utils/crystalStreet/sound'

type MenuScreen = 'settings' | 'credits' | 'theme'
type View =
  | 'title'
  | 'stage'
  | 'you'
  | 'crew'
  | 'case'
  | 'pack'
  | 'scrapbook'
  | MenuScreen

const MENU_SCREENS = new Set<View>(['settings', 'credits', 'theme'])

const store = useCrystalStreetStore()
const navStore = useNavStore()
// Every screen sits on one dial across the top (Silas, 2026-10-24 PT:
// "settings, info, character bio, scrapbook can be reached via icons on the
// top, rotating for which is selected"). The scrapbook joins once a week has
// been finished; "?" opens the tutorial sidebar.
const dialItems = computed<DialItem[]>(() => {
  const r = run.value
  const items: DialItem[] = []
  if (r && !menuScreen.value) {
    const character = characterFor(r.avatar, r.archetype)
    items.push(
      { id: 'stage', label: 'Play', icon: 'kind-icon:map' },
      {
        id: 'you',
        label: character?.title ?? 'You',
        icon: 'kind-icon:user',
        image: character
          ? `/crystal-street/characters/${character.id}.webp`
          : undefined,
        fallback: r.avatar
          ? `/crystal-street/avatars/${r.avatar}.webp`
          : undefined,
      },
      {
        id: 'crew',
        label: 'Crew',
        icon: 'kind-icon:users',
        badge: String(r.crew.length),
      },
      {
        id: 'case',
        label: 'Case',
        icon: 'kind-icon:search',
        badge: `${r.clues.length}/3`,
      },
      { id: 'pack', label: 'Pack', icon: 'kind-icon:bag' },
    )
  }
  if (store.scrapbook.runs.length || (r && !menuScreen.value))
    items.push({ id: 'scrapbook', label: 'Scrapbook', icon: 'kind-icon:book' })
  if (!r || menuScreen.value)
    items.push({ id: 'theme', label: 'Trailer', icon: 'kind-icon:tv' })
  items.push(
    { id: 'settings', label: 'Settings', icon: 'kind-icon:settings' },
    { id: 'help', label: 'How to play', glyph: '?', action: true },
  )
  return items
})

function onDial(id: string): void {
  if (id === 'help') return openTutorial()
  if (!menuScreen.value && run.value) fromGame.value = true
  view.value = id as View
}

function openTutorial(): void {
  navStore.openWorkspaceSheet()
}
const TEXT_SCALE = { small: '93.75%', medium: '', large: '112.5%' } as const

useSeoMeta(
  gameLinkPreviewMeta('crystal-street', useRuntimeConfig().public.appBaseUrl) ??
    {},
)
useHead({
  title: 'Terrors on Crystal Street',
  htmlAttrs: {
    style: computed(() => {
      const size = TEXT_SCALE[store.settings.textSize]
      return size ? `font-size: ${size}` : undefined
    }),
  },
})

const run = computed(() => store.run)
const villain = computed(() => store.villain)
// A friend's shared week (?week=<seed>&nightmare=<id>), offered on the title.
const route = useRoute()
const shared = computed(() => sharedWeekFrom(route.query))
const view = ref<View>('title')
// Settings or credits opened from the in-game dial keep the game's header,
// so Play is one tap away instead of Menu > title > Continue (roadmap #4143,
// UI torture). From the title they stay menu screens.
const fromGame = ref(false)
const menuScreen = computed(
  () =>
    (MENU_SCREENS.has(view.value) && !fromGame.value) ||
    (view.value === 'scrapbook' && !run.value),
)
watch(view, (next) => {
  if (next === 'title') fromGame.value = false
})

// Sound effects follow the week's moves (conductor crystal-street t-016).
const sound = new StreetSound()
watch(run, (next, prev) => {
  if (store.settings.sound === 'on') sound.play(cuesFor(prev, next))
})
onBeforeUnmount(() => sound.dispose())

function openMenu(target: MenuView): void {
  fromGame.value = false
  view.value = target
}
// Remembered for the tab, so a refresh on night one doesn't replay the
// arrival poster over a draw or a roll.
const ARRIVAL_KEY = 'crystal-street-arrival-seen'
const arrivalSeen = ref('')
watch(arrivalSeen, (seed) => {
  try {
    sessionStorage.setItem(ARRIVAL_KEY, seed)
  } catch {
    // Private mode: the poster may show again after a refresh.
  }
})
const arrival = computed(
  () =>
    !!run.value &&
    run.value.phase === 'night' &&
    run.value.day === 1 &&
    run.value.log.every((l) => l.phase === 'day') &&
    !run.value.pending &&
    arrivalSeen.value !== run.value.seed,
)

onMounted(() => {
  try {
    arrivalSeen.value = sessionStorage.getItem(ARRIVAL_KEY) ?? ''
  } catch {
    // Storage blocked: start unseen.
  }
  store.load()
  if (store.run && !store.run.ending) view.value = 'stage'
})
</script>

<style>
.cs .cs-frame {
  border-radius: 1rem;
  border: 1px solid color-mix(in oklch, var(--color-primary) 35%, transparent);
  background: color-mix(in oklch, var(--color-base-100) 92%, transparent);
  box-shadow:
    0 0 0 1px color-mix(in oklch, var(--color-secondary) 12%, transparent),
    0 10px 30px -12px color-mix(in oklch, var(--color-primary) 45%, transparent);
}
.cs .cs-poster {
  background: linear-gradient(#0d0221, #2a0a4a 45%, #7a1268 75%, #ff3d8b);
}
.cs.cs-night {
  background:
    radial-gradient(
      circle at 80% 0%,
      color-mix(in oklch, var(--color-primary) 22%, transparent),
      transparent 55%
    ),
    var(--color-base-200);
}
.cs.cs-day {
  background:
    radial-gradient(
      circle at 20% 0%,
      color-mix(in oklch, var(--color-secondary) 18%, transparent),
      transparent 55%
    ),
    var(--color-base-200);
}
.cs .cs-display {
  font-family: Impact, 'Arial Black', 'Helvetica Neue', sans-serif;
  letter-spacing: 0.02em;
  color: var(--color-accent);
  text-shadow: 0 0 12px
    color-mix(in oklch, var(--color-primary) 60%, transparent);
}
.cs .cs-terrors {
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #ff2d55;
  -webkit-text-stroke: 1.5px #1a0005;
  text-shadow:
    0 3px 0 #1a0005,
    0 0 24px rgb(255 45 85 / 0.55);
}
.cs .cs-on-street {
  margin-top: 0.35rem;
  font-size: clamp(0.95rem, 1.6cqi + 0.6rem, 1.6rem);
  font-weight: 700;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 0 2px 6px rgb(0 0 0 / 0.8);
}
/* The type scale's two smallest steps, in rem so the Text size setting
   scales them with everything else (pixel sizes ignored it). */
.cs .cs-label {
  font-size: 0.6875rem;
}
.cs .cs-micro {
  font-size: 0.625rem;
}
.cs .cs-kicker {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-secondary);
}
.cs .cs-bar {
  border-radius: 1rem;
  padding: 0.35rem 0.5rem;
  background: color-mix(in oklch, var(--color-base-100) 90%, transparent);
  border: 1px solid color-mix(in oklch, var(--color-primary) 30%, transparent);
}
.cs .cs-brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  padding: 0.2rem 0.6rem;
  border-radius: 0.8rem;
  background: color-mix(in oklch, var(--color-primary) 18%, transparent);
}
.cs .cs-meter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.cs .cs-dread {
  display: block;
  width: 3rem;
  height: 0.45rem;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-content) 15%, transparent);
  overflow: hidden;
}
.cs .cs-dread > span {
  display: block;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-secondary),
    var(--color-primary)
  );
}
.cs .cs-menu-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  border-radius: 1rem;
  padding: 0.65rem 0.85rem;
  text-align: left;
  border: 1px solid color-mix(in oklch, var(--color-secondary) 30%, transparent);
  background: color-mix(in oklch, var(--color-base-300) 55%, transparent);
  transition:
    transform 120ms ease,
    border-color 120ms ease;
}
.cs .cs-menu-item:hover,
.cs .cs-menu-item:focus-visible {
  border-color: var(--color-primary);
  transform: translateX(2px);
}
.cs .cs-menu-glass {
  background: rgb(10 2 24 / 0.62);
  backdrop-filter: blur(6px);
  color: #fff;
}
.cs .cs-wizard {
  border-radius: 1rem;
  border: 1px solid color-mix(in oklch, var(--color-primary) 45%, transparent);
  background: color-mix(in oklch, var(--color-base-100) 94%, transparent);
  backdrop-filter: blur(8px);
}
.cs .cs-help {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  font-size: 1.5rem;
  font-weight: 900;
  color: #fff;
  background: rgb(10 2 24 / 0.65);
  border: 2px solid var(--color-primary);
  backdrop-filter: blur(6px);
}
.cs .cs-help-sm {
  width: 2rem;
  height: 2rem;
  font-size: 1.1rem;
}
.cs .cs-menu-primary {
  background: color-mix(in oklch, var(--color-primary) 30%, transparent);
  border-color: var(--color-primary);
}
.cs.cs-high-contrast .cs-frame,
.cs.cs-high-contrast .cs-card,
.cs.cs-high-contrast .cs-bar,
.cs.cs-high-contrast .cs-choice,
.cs.cs-high-contrast .cs-menu-item {
  background: var(--color-base-100);
  border-color: var(--color-base-content);
  box-shadow: none;
}
.cs.cs-high-contrast [class*='opacity-'] {
  opacity: 1;
}
.cs.cs-high-contrast .cs-display {
  text-shadow: none;
}
.cs.cs-motion-reduced *,
.cs.cs-motion-reduced *::before,
.cs.cs-motion-reduced *::after {
  animation: none !important;
  transition: none !important;
}
.cs .cs-choice {
  display: block;
  border-radius: 1rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid color-mix(in oklch, var(--color-secondary) 35%, transparent);
  background: color-mix(in oklch, var(--color-base-300) 55%, transparent);
  transition:
    transform 120ms ease,
    border-color 120ms ease;
}
.cs .cs-choice:hover:not(:disabled),
.cs .cs-choice:focus-visible {
  border-color: var(--color-primary);
  transform: translateY(-1px);
}
.cs :is(button, a, [tabindex]):focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.cs .cs-choice:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.cs .cs-card {
  border-radius: 1rem;
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 15%, transparent);
  background: color-mix(in oklch, var(--color-base-300) 45%, transparent);
}
.cs .cs-pill {
  display: inline-block;
  border-radius: 999px;
  padding: 0.05rem 0.5rem;
  font-size: 0.6875rem;
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 25%, transparent);
}
.cs .cs-pill-good {
  border-color: var(--color-success);
  color: var(--color-success);
}
.cs .cs-pill-bad {
  border-color: var(--color-error);
  color: var(--color-error);
}
.cs .cs-pill-info,
.cs .cs-pill-odds {
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}
.cs .cs-tag {
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  background: rgb(0 0 0 / 0.6);
  color: #fff;
}
.cs .cs-tag-ward {
  background: color-mix(in oklch, var(--color-success) 70%, black);
}
.cs .cs-die {
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.6rem;
  font-weight: 800;
  font-size: 1.1rem;
  background: #fff;
  color: #1b0b33;
  box-shadow: 0 4px 0 rgb(0 0 0 / 0.4);
}
.cs .cs-die-win {
  outline: 3px solid var(--color-success);
}
.cs .cs-die-lose {
  outline: 3px solid var(--color-error);
}
.cs .cs-verdict {
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.cs .cs-verdict-win {
  color: var(--color-success);
}
.cs .cs-verdict-lose {
  color: var(--color-error);
}
.cs .cs-quote {
  font-style: italic;
  border-left: 3px solid var(--color-primary);
  padding-left: 0.6rem;
}
.cs .cs-stamp {
  border-radius: 0.6rem;
  padding: 0.25rem 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  transform: rotate(-4deg);
  background: rgb(0 0 0 / 0.7);
  border: 2px solid currentColor;
}
.cs .cs-stamp-best {
  color: var(--color-accent);
}
.cs .cs-bar-best {
  background-color: var(--color-accent);
}
.cs .cs-stamp-good {
  color: var(--color-success);
}
.cs .cs-bar-good {
  background-color: var(--color-success);
}
.cs .cs-stamp-bittersweet {
  color: var(--color-secondary);
}
.cs .cs-bar-bittersweet {
  background-color: var(--color-secondary);
}
.cs .cs-stamp-bad {
  color: var(--color-error);
}
.cs .cs-bar-bad {
  background-color: var(--color-error);
}
.cs .cs-polaroid {
  background: #f8f4ec;
  color: #1b0b33;
  padding: 0.6rem 0.6rem 0.9rem;
  border-radius: 0.4rem;
  box-shadow: 0 8px 18px rgb(0 0 0 / 0.45);
}
.cs .cs-polaroid:nth-child(odd) {
  transform: rotate(-1.2deg);
}
.cs .cs-polaroid:nth-child(even) {
  transform: rotate(1deg);
}
/* Windows high contrast blanks mask-drawn icons, the dread bar and the
   standing pips; keep their own colors so the HUD still reads. */
@media (forced-colors: active) {
  .cs .iconify,
  .cs .cs-dread > span,
  .cs [data-testid='cs-standing'] li > span > span {
    forced-color-adjust: none;
  }
  /* One-color icons take the system text color; full-color ones keep theirs. */
  .cs .iconify {
    color: CanvasText;
  }
  .cs .cs-dread {
    border: 1px solid CanvasText;
  }
}
/* The system setting does what the in-game Motion setting does. */
@media (prefers-reduced-motion: reduce) {
  .cs *,
  .cs *::before,
  .cs *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
