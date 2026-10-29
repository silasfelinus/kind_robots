<template>
  <main class="kr-surface">
    <div
      class="mx-auto flex h-full min-h-0 w-full max-w-[1500px] flex-col gap-2 p-2 sm:p-3"
    >
      <ConsoleTabs
        v-model="view"
        :tabs="views"
        label="Rainbow Space Princess"
        id-prefix="princess"
      >
        <button
          v-if="RAINBOW_OPENING"
          type="button"
          class="btn btn-circle btn-ghost shrink-0 border border-base-300 bg-base-200"
          aria-label="Play the opening music video"
          title="Opening"
          @click="replayOpening"
        >
          <Icon name="kind-icon:movie" class="kr-icon-5" />
        </button>
        <button
          type="button"
          class="btn btn-circle btn-ghost shrink-0 border border-base-300 bg-base-200"
          aria-label="Open the flight manual in the sidebar"
          title="Flight manual"
          @click="navStore.openWorkspaceSheet()"
        >
          <Icon name="kind-icon:question" class="kr-icon-5" />
        </button>
      </ConsoleTabs>

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
            :src="RAINBOW_HERO_ART"
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
              :src="pilot.portrait"
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
                    :src="rainbowSuperCutin(pilot.seat)"
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
              :src="stage.card"
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
import { computed, ref } from 'vue'
import { useNavStore } from '~/stores/navStore'
import {
  RAINBOW_HERO_ART,
  RAINBOW_KITTY_POWER,
  RAINBOW_PILOTS,
  RAINBOW_SQUADRON,
} from '~/utils/arcade/games/rainbowPilots'
import { rainbowSuperCutin } from '~/utils/arcade/games/rainbowGameArt'
import { RAINBOW_OPENING } from '~/utils/arcade/games/rainbowOpening'

const navStore = useNavStore()

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
const chosen = ref(0)
const pilot = computed(() => RAINBOW_PILOTS[chosen.value]!)

const STAGE_CARD_ROOT = '/rainbow-princess-art/stages'
const stages = [
  {
    name: 'Pinkwake Estuary',
    setting: 'A pink cloud sea of glass buoys, pearly shoals and coral.',
    scene: 'a pink cloud sea',
    card: `${STAGE_CARD_ROOT}/s01-card.webp`,
  },
  {
    name: 'Moonjelly Fields',
    setting:
      'A translucent nebula of floating bell towers and charged tendrils.',
    scene: 'a teal jellyfish nebula',
    card: `${STAGE_CARD_ROOT}/s02-card.webp`,
  },
  {
    name: 'Chromatic Trench',
    setting: 'An indigo void of volcanic vents and abandoned vaults.',
    scene: 'an indigo canyon of glowing vents',
    card: `${STAGE_CARD_ROOT}/s03-card.webp`,
  },
  {
    name: 'Rosefin Express',
    setting: 'Streaming aurora, transit rings and migrating light-rail trains.',
    scene: 'a rose and green aurora above light-rail trains',
    card: `${STAGE_CARD_ROOT}/s04-card.webp`,
  },
  {
    name: 'Blossom Wreckyard',
    setting: 'A starship graveyard of petal wreck slabs and dock machinery.',
    scene: 'a starship graveyard',
    card: `${STAGE_CARD_ROOT}/s05-card.webp`,
  },
  {
    name: 'Crown Reef',
    setting: 'A gold nebula of coral megastructures and glowing arches.',
    scene: 'golden coral arches',
    card: `${STAGE_CARD_ROOT}/s06-card.webp`,
  },
  {
    name: 'Glass Current',
    setting: 'A mirrored star canyon of crystal strata and fractured beams.',
    scene: 'a mirrored crystal canyon',
    card: `${STAGE_CARD_ROOT}/s07-card.webp`,
  },
  {
    name: 'Eclipse Palace',
    setting: 'An eclipse corona over captive armadas and pearl heart spires.',
    scene: 'an eclipsed pearl palace',
    card: `${STAGE_CARD_ROOT}/s08-card.webp`,
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
.princess-stage :deep(.cabinet-marquee),
.princess-stage :deep(.cabinet-title-plate),
.princess-stage :deep(.cabinet-hint) {
  display: none;
}
</style>
