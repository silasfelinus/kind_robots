<template>
  <main class="kr-surface">
    <div class="kr-scroll mx-auto max-w-[1500px] space-y-5 px-3 py-5 sm:px-6">
      <div v-if="!user.initialized" class="grid min-h-96 place-items-center">
        <span class="kr-spinner-lg-primary" />
      </div>
      <div
        v-else-if="!user.isAdmin"
        class="kr-note kr-note-error mx-auto mt-12 max-w-xl p-8 text-center"
      >
        This pinball table is in its private engineering workshop.
      </div>
      <template v-else>
        <section
          class="relative overflow-hidden rounded-3xl border border-base-content/15 bg-base-300"
          aria-label="Zuzu Pinball art direction"
        >
          <img
            src="/images/arcade/games/zuzu-ghost-trail-title.webp"
            alt="Zuzu's haunted frontier, the starting point for the pinball art"
            class="absolute inset-0 h-full w-full object-cover object-center opacity-55"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-base-300 via-base-300/90 to-base-300/20" />
          <div class="relative flex min-h-56 flex-col justify-end gap-2 p-5 sm:p-8">
            <p class="text-xs font-bold uppercase tracking-[.25em] text-warning">
              Zuzu · The Last Bell · Private pinball workshop
            </p>
            <h2 class="max-w-lg font-serif text-3xl font-black sm:text-5xl">
              The water has teeth.
            </h2>
            <p class="max-w-xl text-sm leading-relaxed">
              A playable physics foundation for a haunted frontier pinball machine.
              Aim for the River Croc's mouth, strike the Abbey approach, and help
              turn this greybox into a fully detailed, multi-level table.
            </p>
          </div>
        </section>

        <div v-if="!webglReady" class="kr-note kr-note-error p-5">
          This private 3D preview requires a browser with WebGL enabled.
        </div>
        <div v-else class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(250px,330px)]">
          <div class="min-w-0">
            <ArcadeCabinet slug="zuzu-pinball" />
          </div>
          <aside class="space-y-4">
            <section class="kr-panel space-y-3 p-5">
              <p class="text-xs font-bold uppercase tracking-widest text-warning">
                Current slice · physics greybox
              </p>
              <h3 class="font-serif text-xl font-bold">Under construction</h3>
              <p class="text-sm leading-relaxed opacity-85">
                The prototype uses its own three-dimensional colliders, two lower
                flippers, shooter lane, River Croc mouth scoop, pop bumpers and
                side orbit switches. The shared AMI scoring rules are temporary,
                not Zuzu's final game system.
              </p>
              <p class="text-sm leading-relaxed opacity-85">
                Next: shaped copper ramps, a raised Abbey with independently
                controlled upper flippers, a sculpted snapping Croc jaw,
                Death Roll jackpots and the hidden undercrypt.
              </p>
            </section>
            <section class="kr-panel space-y-3 p-5">
              <h3 class="font-serif text-xl font-bold">Plunge and play</h3>
              <p class="text-sm">Left and right arrows flip. Hold Down, then release for the plunger. Up nudges; B changes the camera.</p>
              <p class="text-xs opacity-70">
                Scoring and leaderboards are deliberately disabled for the
                private preview. This is a physically interactive build stage,
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
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { canRenderWebGL } from '~/utils/arcade/games'

const user = useUserStore()
const webglReady = ref(true)

onMounted(async () => {
  webglReady.value = canRenderWebGL()
  await user.initialize()
})
</script>
