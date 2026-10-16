<template>
  <main class="kr-surface">
    <div v-if="!user.initialized" class="grid min-h-96 place-items-center">
      <span class="kr-spinner-lg-primary" />
    </div>
    <div
      v-else-if="!user.isAdmin"
      class="kr-note kr-note-error mx-auto mt-12 max-w-xl p-8 text-center"
    >
      This starport is a private development preview.
    </div>
    <div
      v-else
      class="kr-scroll mx-auto max-w-[1500px] space-y-6 px-3 py-5 sm:px-6"
    >
      <section
        class="relative isolate overflow-hidden rounded-[2rem] border border-pink-200/40 bg-[#251345] text-white shadow-2xl"
        aria-label="Rainbow Space Princess introduction"
      >
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <img
            :src="RAINBOW_HERO_ART"
            alt=""
            width="1344"
            height="768"
            class="h-full w-full object-cover object-[70%_center]"
          />
          <div
            class="absolute inset-0 bg-gradient-to-r from-[#251345] via-[#251345]/75 to-transparent"
          />
        </div>
        <div
          class="relative flex min-h-[340px] flex-col justify-center gap-4 px-6 py-12 sm:px-10"
        >
          <p
            class="w-fit rounded-full border border-pink-200/35 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-[.22em] text-pink-100"
          >
            Private Arcade flight deck · development preview
          </p>
          <h2
            class="max-w-[660px] font-black leading-[.95] tracking-tight text-4xl sm:text-6xl lg:text-7xl"
          >
            RAINBOW<br /><span class="text-pink-200">BULLET HELL</span
            ><br />SPACE PRINCESS
          </h2>
          <p
            class="max-w-[520px] text-sm leading-relaxed text-pink-50/90 sm:text-base"
          >
            Four princess pilots. One luminous ocean in peril. Ocean-born
            starships, impossible colors, and enough firepower to make a nebula
            blush.
          </p>
          <div class="flex flex-wrap gap-3">
            <a
              href="#princess-flight"
              class="btn border-0 bg-pink-200 text-[#37204e] hover:bg-white"
              >Enter flight simulator ↓</a
            >
            <a
              href="#princess-pilots"
              class="btn border-white/40 bg-white/10 text-white hover:bg-white/20"
              >Meet the pilots</a
            >
            <a
              href="#princess-mission"
              class="btn border-white/40 bg-white/10 text-white hover:bg-white/20"
              >Explore the mission</a
            >
          </div>
          <p class="text-xs text-pink-100/75">
            Acts I and II are playable previews with bosses. The full campaign
            and online co-op are still being built.
          </p>
        </div>
      </section>

      <section
        id="princess-pilots"
        class="space-y-4"
        aria-labelledby="princess-pilots-title"
      >
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-widest text-secondary">
              Flight roster · P1–P4
            </p>
            <h3 id="princess-pilots-title" class="text-2xl font-bold">
              Choose your princess
            </h3>
          </div>
          <p class="max-w-md text-sm opacity-75">
            Every pilot flies the same fair hitbox. Pick by play style, not by
            size: the glyph and number follow you into battle.
          </p>
        </div>
        <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <li
            v-for="pilot in RAINBOW_PILOTS"
            :key="pilot.key"
            class="group relative overflow-hidden rounded-2xl border-2 bg-[#251345] text-white shadow-lg"
            :style="{ borderColor: pilot.color }"
          >
            <div class="relative aspect-[832/1216] overflow-hidden">
              <img
                :src="pilot.portrait"
                :alt="pilot.portraitAlt"
                width="576"
                height="842"
                loading="lazy"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div
                class="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-[#251345]/85 py-1 pl-1 pr-3 text-sm font-black"
              >
                <span
                  class="grid h-8 w-8 place-items-center rounded-full"
                  :style="{ backgroundColor: pilot.color }"
                >
                  <svg
                    viewBox="0 0 24 24"
                    class="h-5 w-5"
                    role="img"
                    :aria-label="pilot.glyphName"
                  >
                    <path
                      v-if="pilot.glyph.shape === 'path'"
                      :d="pilot.glyph.d"
                      fill="#251345"
                    />
                    <g v-else fill="none" stroke="#251345" stroke-width="2.5">
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="4.5" />
                    </g>
                  </svg>
                </span>
                P{{ pilot.seat + 1 }}
              </div>
              <div
                class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#251345] via-[#251345]/85 to-transparent px-4 pb-4 pt-16"
              >
                <h4
                  class="text-2xl font-black leading-tight"
                  :style="{ color: pilot.color }"
                >
                  {{ pilot.name }}
                </h4>
                <p class="text-xs uppercase tracking-widest text-white/75">
                  {{ pilot.pronouns }} · {{ pilot.colorName }}
                </p>
              </div>
            </div>
            <dl class="space-y-2 p-4 text-sm">
              <div>
                <dt class="text-xs uppercase tracking-widest text-white/60">
                  Ship
                </dt>
                <dd>
                  <span class="font-bold">{{ pilot.ship }}</span> ·
                  {{ pilot.shipShape }}
                </dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-widest text-white/60">
                  Fire
                </dt>
                <dd>{{ pilot.primary }}</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-widest text-white/60">
                  Super
                </dt>
                <dd>
                  <img
                    :src="rainbowSuperCutin(pilot.seat)"
                    :alt="`${pilot.name} firing ${pilot.superName}`"
                    width="360"
                    height="124"
                    loading="lazy"
                    class="mb-2 aspect-[360/124] w-full rounded-lg border border-white/15 object-cover"
                  />
                  <span class="font-bold">{{ pilot.superName }}</span
                  >:
                  {{ pilot.superDetail }}
                </dd>
              </div>
              <p class="pt-1 leading-relaxed text-white/85">{{ pilot.hook }}</p>
            </dl>
          </li>
        </ul>
      </section>

      <div id="princess-mission" class="grid gap-4 lg:grid-cols-3">
        <article
          v-for="card in missionCards"
          :key="card.title"
          class="rounded-2xl border border-primary/20 bg-base-200 p-5 shadow-sm"
        >
          <p class="text-xs font-bold uppercase tracking-widest text-secondary">
            {{ card.kicker }}
          </p>
          <h3 class="mt-2 text-xl font-black">{{ card.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed opacity-80">
            {{ card.detail }}
          </p>
        </article>
      </div>

      <div
        id="princess-flight"
        class="grid scroll-mt-8 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <section class="min-w-0 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-widest text-secondary">
                01 / Pinkwake Estuary
              </p>
              <h3 class="text-2xl font-bold">The flight simulator</h3>
            </div>
            <span class="badge badge-outline">Playable engine slice</span>
          </div>
          <ArcadeCabinet slug="rainbow-bullet-hell-space-princess" />
        </section>
        <aside class="space-y-4" aria-label="Flight notes">
          <section class="kr-panel space-y-3 p-5">
            <h3 class="text-xl font-bold">Flight school</h3>
            <p class="text-sm leading-relaxed opacity-80">
              Choose one to four pilots on the cabinet attract screen. Move with
              arrows or your assigned controls; hold A to fire. Your ship marker
              is numbered, so it reads through the spectacle.
            </p>
            <p class="text-sm leading-relaxed opacity-80">
              Hold B to focus: you fly slower, fire a tight fast stream and see
              your exact hitbox. Downing shoals fills your charge; tap B at 100%
              for your super, which clears every enemy shot on screen.
            </p>
            <p class="text-sm leading-relaxed opacity-80">
              Act I Pinkwake and Act II Moonjelly are playable previews, each
              with a rescue, pilot comms and a three-phase boss. They are
              shortened slices of the eight-stage campaign, and scores stay
              private.
            </p>
          </section>
        </aside>
      </div>

      <section
        id="princess-expedition"
        class="space-y-4"
        aria-labelledby="princess-expedition-title"
      >
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-widest text-secondary">
              The full expedition · S01–S08
            </p>
            <h3 id="princess-expedition-title" class="text-2xl font-bold">
              Eight seas to the Eclipse Palace
            </h3>
          </div>
          <p class="max-w-md text-sm opacity-75">
            Pinkwake and Moonjelly fly today. The other six seas are being
            painted and built.
          </p>
        </div>
        <ol class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <li
            v-for="(stage, index) in stages"
            :key="stage.name"
            class="overflow-hidden rounded-2xl border border-primary/20 bg-[#251345] text-white shadow-sm"
          >
            <div
              class="relative aspect-[640/366] overflow-hidden bg-gradient-to-br from-[#3b2470] via-[#251345] to-[#0f2a4a]"
            >
              <img
                v-if="stage.card"
                :src="stage.card"
                :alt="`${stage.name} title card: the four pilot ships over ${stage.scene}`"
                width="640"
                height="366"
                loading="lazy"
                class="h-full w-full object-cover"
              />
              <span
                class="absolute left-3 top-3 rounded-full bg-[#251345]/85 px-3 py-1 font-mono text-xs font-bold"
                >S{{ String(index + 1).padStart(2, '0') }}</span
              >
              <span
                class="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold"
                :class="
                  stage.playable
                    ? 'bg-pink-200 text-[#37204e]'
                    : 'bg-[#251345]/85 text-white'
                "
                >{{
                  stage.playable ? 'Playable preview' : 'In production'
                }}</span
              >
            </div>
            <div class="space-y-1 p-4">
              <h4 class="text-lg font-black">{{ stage.name }}</h4>
              <p class="text-sm leading-relaxed text-white/80">
                {{ stage.setting }}
              </p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '~/stores/userStore'
import {
  RAINBOW_HERO_ART,
  RAINBOW_PILOTS,
} from '~/utils/arcade/games/rainbowPilots'
import { rainbowSuperCutin } from '~/utils/arcade/games/rainbowGameArt'

const user = useUserStore()
const missionCards = [
  {
    kicker: '01 / Fight with grace',
    title: 'Fair, ferocious patterns',
    detail:
      'Telegraphed attacks, real escape lanes and true precision hitboxes. Challenging should never mean invisible danger.',
  },
  {
    kicker: '02 / A sky full of sea life',
    title: 'Techno-oceanic armada',
    detail:
      'Jellyfish cruisers, seahorse scouts, shrimp railguns, shark destroyers and a machine-whale finale.',
  },
  {
    kicker: '03 / Fly with friends',
    title: 'A four-pilot promise',
    detail:
      'Simultaneous 1–4 player combat is the goal. Local pilots work in this engine preview; online rooms come later.',
  },
]
const STAGE_CARD_ROOT = '/rainbow-princess-art/stages'
const stages = [
  {
    name: 'Pinkwake Estuary',
    setting: 'A pink cloud sea of glass buoys, pearly shoals and coral.',
    scene: 'a pink cloud sea',
    card: `${STAGE_CARD_ROOT}/s01-card.webp`,
    playable: true,
  },
  {
    name: 'Moonjelly Fields',
    setting:
      'A translucent nebula of floating bell towers and charged tendrils.',
    scene: 'a teal jellyfish nebula',
    card: `${STAGE_CARD_ROOT}/s02-card.webp`,
    playable: true,
  },
  {
    name: 'Chromatic Trench',
    setting: 'An indigo void of volcanic vents and abandoned vaults.',
    scene: 'an indigo canyon of glowing vents',
    card: `${STAGE_CARD_ROOT}/s03-card.webp`,
    playable: false,
  },
  {
    name: 'Rosefin Express',
    setting: 'Streaming aurora, transit rings and migrating light-rail trains.',
    scene: 'a rose and green aurora above light-rail trains',
    card: `${STAGE_CARD_ROOT}/s04-card.webp`,
    playable: false,
  },
  {
    name: 'Blossom Wreckyard',
    setting: 'A starship graveyard of petal wreck slabs and dock machinery.',
    scene: 'a starship graveyard',
    card: null,
    playable: false,
  },
  {
    name: 'Crown Reef',
    setting: 'A gold nebula of coral megastructures and glowing arches.',
    scene: 'golden coral arches',
    card: `${STAGE_CARD_ROOT}/s06-card.webp`,
    playable: false,
  },
  {
    name: 'Glass Current',
    setting: 'A mirrored star canyon of crystal strata and fractured beams.',
    scene: 'a mirrored crystal canyon',
    card: null,
    playable: false,
  },
  {
    name: 'Eclipse Palace',
    setting: 'An eclipse corona over captive armadas and pearl heart spires.',
    scene: 'an eclipsed pearl palace',
    card: null,
    playable: false,
  },
]
onMounted(() => {
  void user.initialize()
})
useHead({ title: 'Rainbow Bullet Hell Space Princess · Private Arcade' })
</script>
