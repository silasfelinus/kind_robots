<template>
  <main class="kr-surface">
    <div class="kr-scroll mx-auto max-w-[1500px] space-y-5 px-3 py-5 sm:px-6">
      <template>
        <section
          class="relative overflow-hidden rounded-3xl border border-base-content/15 bg-base-300"
          aria-label="Zuzu Pinball art direction"
        >
          <img
            src="/images/pinball/zuzu-last-bell-backglass.webp"
            alt="Zuzu the koala ronin on a ridge above the haunted abbey, the River Croc in the river below"
            class="absolute inset-0 h-full w-full object-cover object-center opacity-55"
          />
          <div
            class="absolute inset-0 bg-gradient-to-r from-base-300 via-base-300/90 to-base-300/20"
          />
          <div
            class="relative flex min-h-56 flex-col justify-end gap-2 p-5 sm:p-8"
          >
            <p
              class="text-xs font-bold uppercase tracking-[.25em] text-warning"
            >
              Zuzu · The Last Bell · Playable pinball workshop
            </p>
            <h2 class="max-w-lg font-serif text-3xl font-black sm:text-5xl">
              The water has teeth.
            </h2>
            <p class="max-w-xl text-sm leading-relaxed">
              A playable physics foundation for a haunted frontier pinball
              machine. Aim for the River Croc's mouth, strike the Abbey
              approach, and help turn this greybox into a fully detailed,
              multi-level table.
            </p>
          </div>
        </section>

        <div v-if="!webglReady" class="kr-note kr-note-error p-5">
          This 3D table requires a browser with WebGL enabled.
        </div>
        <div
          v-else
          class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(250px,330px)]"
        >
          <div class="min-w-0">
            <ArcadeCabinet slug="zuzu-pinball" />
          </div>
          <aside class="space-y-4">
            <section class="kr-panel space-y-3 p-5">
              <p
                class="text-xs font-bold uppercase tracking-widest text-warning"
              >
                Current slice · playable table, Zuzu's own rules
              </p>
              <h3 class="font-serif text-xl font-bold">Under construction</h3>
              <p class="text-sm leading-relaxed opacity-85">
                Every shot on the table is made by a real flip on the real
                physics. The Mortuary tells the story's five chapters in order,
                Homestead in Ash to The Last Bell, and each one finished breaks
                a seal on the track. Ring the bell lane to open the Mortuary
                again; knock down all four Abbey seals to raise the bonus
                multiplier and bare the captive relic ball behind them, whose
                strikes raise it again. The River Croc always pays, and his
                fifth swallow lights an extra ball. Feed him during Homestead to
                open the Watering Hole, where an orbit lights his mouth for a
                Death Roll jackpot that grows each time. Ring the bell lane to
                lock balls in the Citadel: three start Harvest Moon. Broken
                seals and both orbits start the four-ball Storm Crow, and the
                fifth story seal rings The Last Bell, all six balls. A soft
                plunge into the Mortuary is the skill shot.
              </p>
              <p class="text-sm leading-relaxed opacity-85">
                The Bell spiral climbs to the raised Abbey deck, where two upper
                flippers ring its three hollow bells; they flip with the lower
                pair, or alone while you hold B (Shift). Strike the captive
                relic three times and the Mortuary opens the hidden undercrypt
                behind the backbox, a mini-table with its own flippers, three
                skulls and a HOME saucer.
              </p>
            </section>
            <section class="kr-panel space-y-3 p-5">
              <h3 class="font-serif text-xl font-bold">Plunge and play</h3>
              <p class="text-sm">
                Left and right arrows flip. Hold Down, then release for the
                plunger. Up nudges; hold B (Shift) to flip the Abbey's upper
                flippers alone.
              </p>
              <p class="text-xs opacity-70">
                Scoring and leaderboards are deliberately disabled for the
                in-progress preview. This is a physically interactive build stage,
                not a finished FX3-quality release.
              </p>
              <a
                class="link link-primary text-sm"
                href="https://github.com/silasfelinus/conductor/blob/main/projects/zuzu-pinball/DESIGN-BRIEF.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                Full table design and shot-map specification ↗
              </a>
            </section>
          </aside>
        </div>
        <ArcadePinballLightMap :table="ZUZU_LAST_BELL_GREYBOX" />
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { canRenderWebGL } from '~/utils/arcade/games'
import { ZUZU_LAST_BELL_GREYBOX } from '~/utils/arcade/pinball/tables/zuzuLastBell/table'

const webglReady = ref(true)

onMounted(async () => {
  webglReady.value = canRenderWebGL()
})
</script>
