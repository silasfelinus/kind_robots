<template>
  <main class="kr-surface">
    <div
      class="mx-auto flex h-full min-h-0 w-full max-w-[1500px] flex-col gap-2 p-2 sm:p-3"
    >
      <header-page-bar>
        <ConsoleTabs
          v-model="view"
          :tabs="views"
          label="Rainbow Space Princess"
          id-prefix="princess"
        >
          <button
            type="button"
            class="btn btn-sm shrink-0 gap-1.5 rounded-full border-2 font-black"
            :class="
              look === 'fever'
                ? 'fever-pill border-white/70 text-white'
                : 'btn-ghost border-base-300'
            "
            :aria-pressed="look === 'fever'"
            :title="
              look === 'fever'
                ? 'Fever Dream look is on: switch back to the classic painted art'
                : 'Switch to the Fever Dream look: neon airbrush doodles'
            "
            @click="toggleLook"
          >
            <Icon name="kind-icon:rainbow" class="kr-icon-5" />
            <span class="hidden sm:inline">Fever Dream</span>
            <span class="sr-only sm:hidden">Fever Dream look</span>
          </button>
          <button
            v-if="RAINBOW_OPENING"
            type="button"
            class="btn btn-circle btn-ghost btn-sm shrink-0"
            aria-label="Play the opening music video"
            title="Opening"
            @click="replayOpening"
          >
            <Icon name="kind-icon:movie" class="kr-icon-5" />
          </button>
        </ConsoleTabs>
      </header-page-bar>

      <section
        v-show="view === 'flight'"
        id="princess-flight"
        role="tabpanel"
        aria-labelledby="princess-flight-tab"
        class="princess-stage relative flex min-h-0 flex-1 flex-col"
      >
        <ArcadeCabinet
          slug="rainbow-bullet-hell-space-princess"
          contained
          :suspended="view !== 'flight' || openingShowing"
        />
        <RainbowOpening
          v-if="RAINBOW_OPENING"
          ref="opening"
          :opening="RAINBOW_OPENING"
          @showing="openingShowing = $event"
        />
      </section>

      <section
        v-show="view === 'pilots'"
        id="princess-pilots"
        role="tabpanel"
        aria-labelledby="princess-pilots-tab"
        class="@container relative isolate flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-base-300 bg-[#251345] text-white"
      >
        <div
          class="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <img
            :src="rainbowHeroArt(RAINBOW_HERO_ART, look)"
            alt=""
            width="1344"
            height="768"
            class="h-full w-full object-cover object-[70%_center]"
          />
          <div
            class="absolute inset-0 bg-gradient-to-r from-[#251345] via-[#251345]/90 to-[#251345]/60"
          />
        </div>

        <div
          class="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 p-3 @2xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @2xl:grid-rows-1"
        >
          <figure
            class="relative min-h-0 overflow-hidden rounded-2xl border-4 bg-[#1a0d33]"
            :style="{ borderColor: pilot.color }"
          >
            <img
              :key="pilot.key"
              :src="rainbowPortrait(pilot.portrait, look)"
              :alt="pilot.portraitAlt"
              width="576"
              height="842"
              class="h-full w-full object-cover object-[center_18%]"
            />
          </figure>

          <article
            class="kr-scroll space-y-3 rounded-2xl border border-white/10 bg-[#1a0d33] p-4"
          >
            <header>
              <p
                class="text-xs font-bold uppercase tracking-widest text-white/60"
              >
                {{ RAINBOW_SQUADRON.name }} · P{{ pilot.seat + 1 }} ·
                {{ pilot.pronouns }} · {{ pilot.colorName }}
              </p>
              <h3
                class="text-3xl font-black leading-tight @2xl:text-4xl"
                :style="{ color: pilot.color }"
              >
                {{ pilot.name }}
              </h3>
            </header>
            <p class="text-base leading-relaxed text-white/90">
              {{ pilot.hook }}
            </p>
            <dl class="grid gap-3 text-sm @lg:grid-cols-2">
              <div class="rounded-xl bg-white/5 p-3">
                <dt class="text-xs uppercase tracking-widest text-white/60">
                  Ship
                </dt>
                <dd>
                  <span class="font-bold">{{ pilot.ship }}</span> ·
                  {{ pilot.shipShape }}
                </dd>
              </div>
              <div class="rounded-xl bg-white/5 p-3">
                <dt class="text-xs uppercase tracking-widest text-white/60">
                  Fire
                </dt>
                <dd>{{ pilot.primary }}</dd>
              </div>
              <div class="rounded-xl bg-white/5 p-3 @lg:col-span-2">
                <dt class="text-xs uppercase tracking-widest text-white/60">
                  Cat co-pilot
                </dt>
                <dd>
                  <span class="font-bold">{{ pilot.copilot.name }}</span
                  >, {{ pilot.copilot.cat }}, who leaps in for her
                  {{ RAINBOW_KITTY_POWER.toLowerCase() }}. Flying for the
                  Motherland in {{ RAINBOW_SQUADRON.name }} ({{
                    RAINBOW_SQUADRON.stands
                  }}).
                </dd>
              </div>
              <div class="rounded-xl bg-white/5 p-3 @lg:col-span-2">
                <dt class="text-xs uppercase tracking-widest text-white/60">
                  Super · {{ pilot.superName }}
                </dt>
                <dd>
                  <img
                    :src="rainbowSuperCutin(pilot.seat, look)"
                    :alt="`${pilot.name} firing ${pilot.superName}`"
                    width="360"
                    height="124"
                    class="my-2 aspect-[360/124] w-full rounded-lg border border-white/15 object-cover"
                  />
                  {{ pilot.superDetail }}
                </dd>
              </div>
            </dl>
          </article>
        </div>

        <ul
          class="grid shrink-0 grid-cols-4 gap-2 px-3 pb-3"
          aria-label="Pilots"
        >
          <li v-for="option in RAINBOW_PILOTS" :key="option.key">
            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-full border-2 bg-[#1a0d33] py-1.5 pl-1.5 pr-3 text-sm font-black transition-colors @2xl:justify-start"
              :class="
                option.key === pilot.key
                  ? 'text-[#251345]'
                  : 'border-white/15 text-white hover:border-white/40'
              "
              :style="
                option.key === pilot.key
                  ? { backgroundColor: option.color, borderColor: option.color }
                  : {}
              "
              :aria-pressed="option.key === pilot.key"
              @click="chosen = option.seat"
            >
              <span
                class="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                :style="{
                  backgroundColor:
                    option.key === pilot.key ? '#251345' : option.color,
                }"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="h-5 w-5"
                  role="img"
                  :aria-label="option.glyphName"
                >
                  <path
                    v-if="option.glyph.shape === 'path'"
                    :d="option.glyph.d"
                    :fill="option.key === pilot.key ? option.color : '#251345'"
                  />
                  <g
                    v-else
                    fill="none"
                    :stroke="
                      option.key === pilot.key ? option.color : '#251345'
                    "
                    stroke-width="2.5"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4.5" />
                  </g>
                </svg>
              </span>
              <span>P{{ option.seat + 1 }}</span>
              <span class="hidden truncate @2xl:inline">{{ option.name }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section
        v-show="view === 'seas'"
        id="princess-expedition"
        role="tabpanel"
        aria-labelledby="princess-seas-tab"
        class="@container flex min-h-0 flex-1 flex-col"
      >
        <ol
          class="grid min-h-0 flex-1 grid-cols-2 grid-rows-4 gap-2 @3xl:grid-cols-4 @3xl:grid-rows-2"
        >
          <li
            v-for="(stage, index) in stages"
            :key="stage.name"
            class="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-[#251345] text-white"
          >
            <img
              :src="rainbowStageCard(stage.strip, look)"
              :alt="`${stage.name} title card: the four pilot ships over ${stage.scene}`"
              width="640"
              height="366"
              loading="lazy"
              class="min-h-0 w-full flex-1 object-cover"
            />
            <div class="flex shrink-0 items-center gap-2 px-3 py-2">
              <span
                class="rounded-full bg-pink-200 px-2 py-0.5 font-mono text-xs font-bold text-[#37204e]"
                >S{{ String(index + 1).padStart(2, '0') }}</span
              >
              <div class="min-w-0">
                <h3 class="truncate text-sm font-black @3xl:text-base">
                  {{ stage.name }}
                </h3>
                <p class="hidden truncate text-xs text-white/70 @5xl:block">
                  {{ stage.setting }}
                </p>
              </div>
            </div>
          </li>
        </ol>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  RAINBOW_HERO_ART,
  RAINBOW_KITTY_POWER,
  RAINBOW_PILOTS,
  RAINBOW_SQUADRON,
} from '~/utils/arcade/games/rainbowPilots'
import {
  loadRainbowLook,
  RAINBOW_DEFAULT_LOOK,
  rainbowHeroArt,
  rainbowPortrait,
  rainbowStageCard,
  rainbowSuperCutin,
  setRainbowLook,
  type RainbowLook,
} from '~/utils/arcade/games/rainbowGameArt'
import { RAINBOW_OPENING } from '~/utils/arcade/games/rainbowOpening'

const views = [
  { key: 'flight', label: 'Fly', icon: 'kind-icon:rocket' },
  { key: 'pilots', label: 'Pilots', icon: 'kind-icon:users' },
  { key: 'seas', label: 'Seas', icon: 'kind-icon:map' },
] as const
const view = ref<string>('flight')
const opening = ref<{ offer: () => void; play: () => void } | null>(null)
const openingShowing = ref(false)

function replayOpening() {
  view.value = 'flight'
  opening.value?.play()
}
// Classic or Fever Dream: the cabinet reads the look every frame, so switching mid-flight just repaints.
const look = ref<RainbowLook>(RAINBOW_DEFAULT_LOOK)
onMounted(() => {
  look.value = loadRainbowLook()
})
function toggleLook() {
  look.value = look.value === 'fever' ? 'classic' : 'fever'
  setRainbowLook(look.value)
}

const chosen = ref(0)
const pilot = computed(() => RAINBOW_PILOTS[chosen.value]!)

const stages = [
  {
    name: 'Pinkwake Estuary',
    setting: 'A pink cloud sea of glass buoys, pearly shoals and coral.',
    scene: 'a pink cloud sea',
    strip: 's01' as const,
  },
  {
    name: 'Moonjelly Fields',
    setting:
      'A translucent nebula of floating bell towers and charged tendrils.',
    scene: 'a teal jellyfish nebula',
    strip: 's02' as const,
  },
  {
    name: 'Chromatic Trench',
    setting: 'An indigo void of volcanic vents and abandoned vaults.',
    scene: 'an indigo canyon of glowing vents',
    strip: 's03' as const,
  },
  {
    name: 'Rosefin Express',
    setting: 'Streaming aurora, transit rings and migrating light-rail trains.',
    scene: 'a rose and green aurora above light-rail trains',
    strip: 's04' as const,
  },
  {
    name: 'Blossom Wreckyard',
    setting: 'A starship graveyard of petal wreck slabs and dock machinery.',
    scene: 'a starship graveyard',
    strip: 's05' as const,
  },
  {
    name: 'Crown Reef',
    setting: 'A gold nebula of coral megastructures and glowing arches.',
    scene: 'golden coral arches',
    strip: 's06' as const,
  },
  {
    name: 'Glass Current',
    setting: 'A mirrored star canyon of crystal strata and fractured beams.',
    scene: 'a mirrored crystal canyon',
    strip: 's07' as const,
  },
  {
    name: 'Eclipse Palace',
    setting: 'An eclipse corona over captive armadas and pearl heart spires.',
    scene: 'an eclipsed pearl palace',
    strip: 's08' as const,
  },
]
useSeoMeta(
  gameLinkPreviewMeta(
    'rainbow-bullet-hell-space-princess',
    useRuntimeConfig().public.appBaseUrl,
  ) ?? {},
)
useHead({ title: 'Rainbow Bullet Hell Space Princess · Work in progress' })
</script>

<style scoped>
.fever-pill {
  background: linear-gradient(
    100deg,
    #ff3fa4,
    #ff8a2a,
    #ffe03a,
    #7dff4a,
    #2ee6ff,
    #a64dff
  );
  text-shadow: 0 1px 2px #5a0f7a;
}
.princess-stage :deep(.cabinet-marquee),
.princess-stage :deep(.cabinet-title-plate),
.princess-stage :deep(.cabinet-hint) {
  display: none;
}
</style>
