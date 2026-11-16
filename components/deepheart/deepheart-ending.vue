<template>
  <article
    v-if="run && text && ending"
    class="dh-ending"
    data-testid="dh-ending"
  >
    <PlaybookKitArt
      :art="ending.art"
      tone="secondary"
      icon="kind-icon:star"
      class="dh-ending-art"
    />
    <div class="dh-ending-body">
      <p class="pf-kicker text-xs uppercase tracking-widest opacity-70">
        {{ ending.tone }} ending
      </p>
      <h2
        class="pf-display text-2xl text-primary"
        data-testid="dh-ending-title"
      >
        {{ text.title }}
      </h2>
      <p class="pk-prose">{{ text.text }}</p>
      <p v-if="text.romance && dh.romanceOn" class="pk-prose text-secondary">
        {{ text.romance }}
      </p>
      <ul class="dh-ending-facts">
        <li>{{ run.fights }} fights</li>
        <li>{{ run.puzzlesSolved }} puzzles</li>
        <li>{{ run.chests }} chests</li>
        <li>{{ run.gold }} gold</li>
        <li>{{ run.moments.length }} scrapbook moments</li>
      </ul>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-primary btn-sm rounded-2xl"
          data-testid="dh-again"
          @click="dh.finishedTo('builder')"
        >
          Delve again
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl border border-base-content/20"
          @click="dh.finishedTo('chronicle')"
        >
          Chronicle
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl"
          @click="kit.openPane('endings')"
        >
          Endings
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDeepheartStore } from '~/stores/deepheartStore'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { endingText } from '~/utils/deepheart/engine'
import { DEEPHEART } from '~/utils/playbookKit/games/deepheart'

const dh = useDeepheartStore()
const kit = usePlaybookKitStore()
const run = computed(() => dh.run)
const text = computed(() => (run.value ? endingText(run.value) : null))
const ending = computed(
  () => DEEPHEART.endings.find((e) => e.id === run.value?.ending) ?? null,
)
</script>

<style scoped>
.dh-ending {
  display: grid;
  gap: 0.75rem;
  max-width: 56rem;
  margin-inline: auto;
}
@container (min-width: 44rem) {
  .dh-ending {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: center;
  }
}
.dh-ending-art {
  aspect-ratio: 4 / 3;
  width: 100%;
  border-radius: var(--radius-box);
}
.dh-ending-body {
  display: grid;
  gap: 0.5rem;
}
.dh-ending-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.75rem;
  opacity: 0.8;
}
.dh-ending-facts li {
  border-radius: 999px;
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 20%, transparent);
  padding: 0.05rem 0.5rem;
}
</style>
