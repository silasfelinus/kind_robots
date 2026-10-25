<template>
  <section class="kr-panes grid-cols-1" aria-label="Credits">
    <div class="kr-pane cs-frame">
      <div class="kr-toolbar px-3 pt-3">
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-2xl"
          @click="$emit('back')"
        >
          <icon name="kind-icon:arrow-left" class="h-4 w-4" /> Settings
        </button>
        <h2 class="cs-display text-xl">Credits</h2>
      </div>
      <div class="kr-pane-scroll space-y-3 p-3" data-testid="cs-credits">
        <article class="cs-card space-y-1 p-3">
          <h3 class="cs-kicker">Made at Kind Robots</h3>
          <p class="text-sm leading-relaxed">
            Terrors on Crystal Street was dreamed up by Silas Knight and built
            with AI collaborators at Kind Robots, a project about turning AI
            toward creativity and human benefit. It runs entirely in your
            browser: no accounts, no tracking, your weeks saved on this device.
          </p>
        </article>
        <article class="cs-card space-y-1 p-3">
          <h3 class="cs-kicker">The art and the theme</h3>
          <p class="text-sm leading-relaxed">
            Every nightmare, friend and place was painted from a written prompt
            in the Kind Robots art studio, and the theme song was written and
            sung in its music studio. The cover is Masking Up from the Hollywood
            Monsters Recast coloring book. Scenes still waiting for paint are
            drawn live in code.
          </p>
        </article>
        <article class="cs-card space-y-1 p-3">
          <h3 class="cs-kicker">The remix</h3>
          <p class="text-sm leading-relaxed">
            Many of the nightmares start from classic horror villains, flipped
            or bent to ask what the old scripts leaned on and what a queerer
            angle gives back. Queerness is never the monster here. Every
            character is original; the films below are homage, not license.
          </p>
          <p class="text-xs leading-relaxed opacity-80">{{ films }}</p>
        </article>
        <article class="cs-card space-y-1 p-3">
          <h3 class="cs-kicker">Thanks</h3>
          <p class="text-sm leading-relaxed">
            To every midnight-movie audience that ever talked back to the
            screen, and to everyone who survived the 80s by finding their crew.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { VILLAINS } from '~/utils/crystalStreet/rules'

defineEmits<{ back: [] }>()

const films = [
  ...new Set(
    VILLAINS.map((v) => `${v.inspiration.film} (${v.inspiration.year})`),
  ),
]
  .sort()
  .join(' · ')
</script>
