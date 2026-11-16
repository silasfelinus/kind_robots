<template>
  <div v-if="run && puzzle" class="dh-puzzle" data-testid="dh-puzzle">
    <div class="dh-puzzle-head">
      <h2 class="pf-display text-xl text-primary">{{ TITLE[puzzle.kind] }}</h2>
      <p v-if="puzzle.hint" class="text-xs text-accent">
        Your party’s wits give you a hint.
      </p>
    </div>

    <template v-if="puzzle.riddle && riddle">
      <p class="pk-prose dh-puzzle-text">{{ riddle.text }}</p>
      <DeepheartHand
        :choices="riddleCards"
        :deal-key="`riddle-${riddle.id}`"
        :animate="animate"
        testid-prefix="dh-riddle"
        @play="(id: string) => dh.answerRiddle(id)"
      />
    </template>

    <template v-else-if="puzzle.runes">
      <p class="pk-prose dh-puzzle-text">
        Light every rune. Each one flips itself and its neighbours.
        {{ puzzle.runes.limit - puzzle.runes.moves }} presses before the trap
        fires.
      </p>
      <div class="dh-runes" role="group" aria-label="Rune grid">
        <button
          v-for="(lit, i) in puzzle.runes.lit"
          :key="i"
          type="button"
          class="dh-rune"
          :class="{ 'is-lit': lit, 'is-hint': puzzle.hint && hintRune === i }"
          :aria-pressed="lit"
          :aria-label="`Rune ${i + 1}, ${lit ? 'lit' : 'dark'}`"
          :data-testid="`dh-rune-${i}`"
          @click="dh.pressRune(i)"
        >
          {{ GLYPHS[i % GLYPHS.length] }}
        </button>
      </div>
    </template>

    <template v-else-if="puzzle.sequence">
      <p class="pk-prose dh-puzzle-text">
        {{
          watching
            ? 'Watch the runes light in order.'
            : 'Press them back in the same order.'
        }}
      </p>
      <div class="dh-sequence" aria-live="polite">
        <span
          v-for="(g, i) in puzzle.sequence.glyphs"
          :key="i"
          class="dh-seq-slot"
          :class="{
            'is-on': watching && showIndex === i,
            'is-done': i < puzzle.sequence.entered.length,
          }"
        >
          {{
            watching && showIndex === i
              ? GLYPHS[g]
              : i < puzzle.sequence.entered.length
                ? GLYPHS[puzzle.sequence.entered[i]!]
                : '·'
          }}
        </span>
      </div>
      <div class="dh-runes dh-glyph-pad" role="group" aria-label="Rune buttons">
        <button
          v-for="(glyph, g) in GLYPHS"
          :key="g"
          type="button"
          class="dh-rune is-lit"
          :disabled="watching"
          :data-testid="`dh-glyph-${g}`"
          @click="dh.pressGlyph(g)"
        >
          {{ glyph }}
        </button>
      </div>
      <button
        v-if="
          !watching &&
          puzzle.sequence.shows > 0 &&
          !puzzle.sequence.entered.length
        "
        type="button"
        class="btn btn-ghost btn-xs self-center rounded-2xl"
        @click="watch()"
      >
        Watch again ({{ puzzle.sequence.shows }})
      </button>
    </template>

    <template v-else-if="puzzle.scales">
      <p class="pk-prose dh-puzzle-text">
        Put exactly {{ puzzle.scales.target }} weight on the scale. Now:
        <strong class="tabular-nums">{{ scaleSum }}</strong>
      </p>
      <div class="dh-weights" role="group" aria-label="Weights">
        <button
          v-for="(w, i) in puzzle.scales.weights"
          :key="i"
          type="button"
          class="dh-weight"
          :class="{
            'is-on': puzzle.scales.picked.includes(i),
            'is-hint': puzzle.scales.hinted === i,
          }"
          :aria-pressed="puzzle.scales.picked.includes(i)"
          :data-testid="`dh-weight-${i}`"
          @click="dh.toggleWeight(i)"
        >
          {{ w }}
        </button>
      </div>
      <button
        type="button"
        class="btn btn-primary btn-sm self-center rounded-2xl"
        data-testid="dh-weigh"
        @click="dh.weigh()"
      >
        Weigh it
      </button>
    </template>

    <button
      type="button"
      class="btn btn-ghost btn-xs self-center rounded-2xl"
      @click="dh.leavePuzzle()"
    >
      Walk away
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch as watchValue } from 'vue'
import { useDeepheartStore } from '~/stores/deepheartStore'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { RIDDLE_BY_ID, runeSolution } from '~/utils/deepheart/engine'
import type { PuzzleKind } from '~/utils/deepheart/types'
import type { DhCard } from './deepheart-hand.vue'

const dh = useDeepheartStore()
const kit = usePlaybookKitStore()
const run = computed(() => dh.run)
const puzzle = computed(() => run.value?.puzzle ?? null)
const animate = computed(() => kit.settings.motion !== 'reduced')

const GLYPHS = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ']
const TITLE: Record<PuzzleKind, string> = {
  riddle: 'The Riddling Door',
  runes: 'The Rune Lock',
  sequence: 'The Singing Runes',
  scales: 'The Balance Door',
}

const riddle = computed(() =>
  puzzle.value?.riddle
    ? (RIDDLE_BY_ID.get(puzzle.value.riddle.id) ?? null)
    : null,
)

const riddleCards = computed<DhCard[]>(() => {
  const r = puzzle.value?.riddle
  if (!r) return []
  return r.options.map((o) => ({
    id: o,
    label: o,
    icon: '?',
    disabled: r.removed === o,
    hint: r.removed === o ? 'Your wits rule this out' : '',
  }))
})

const hintRune = computed(() =>
  puzzle.value?.runes ? (runeSolution(puzzle.value.runes.lit)[0] ?? -1) : -1,
)

const scaleSum = computed(() => {
  const s = puzzle.value?.scales
  return s ? s.picked.reduce((sum, i) => sum + s.weights[i]!, 0) : 0
})

const watching = ref(false)
const showIndex = ref(-1)
let timer: ReturnType<typeof setTimeout> | null = null

function stop() {
  if (timer) clearTimeout(timer)
  timer = null
}

function watch() {
  const seq = puzzle.value?.sequence
  if (!seq || seq.shows <= 0) return
  dh.replaySequence()
  stop()
  watching.value = true
  showIndex.value = -1
  const pace = kit.settings.motion === 'reduced' ? 1100 : 750
  const tick = (i: number) => {
    showIndex.value = i
    timer = setTimeout(() => {
      if (i + 1 < seq.glyphs.length) tick(i + 1)
      else {
        watching.value = false
        showIndex.value = -1
      }
    }, pace)
  }
  tick(0)
}

watchValue(
  () => (puzzle.value?.sequence ? `${run.value?.turns}` : ''),
  (key) => {
    if (key) watch()
  },
  { immediate: true },
)

onBeforeUnmount(stop)
</script>

<style scoped>
.dh-puzzle {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.dh-puzzle-head,
.dh-puzzle-text {
  max-width: 40rem;
  margin-inline: auto;
  text-align: center;
}
.dh-runes {
  display: grid;
  grid-template-columns: repeat(3, 3.5rem);
  gap: 0.4rem;
  justify-content: center;
}
.dh-glyph-pad {
  grid-template-columns: repeat(3, 3.25rem);
}
.dh-rune {
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  border-radius: var(--radius-box);
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 20%, transparent);
  background: var(--color-base-300);
  font-size: 1.5rem;
  color: color-mix(in oklch, var(--color-base-content) 40%, transparent);
  transition:
    background 150ms ease,
    color 150ms ease;
}
.dh-rune.is-lit {
  background: color-mix(
    in oklch,
    var(--color-primary) 30%,
    var(--color-base-200)
  );
  color: var(--color-primary);
  box-shadow: 0 0 14px
    color-mix(in oklch, var(--color-primary) 40%, transparent);
}
.dh-rune.is-hint,
.dh-weight.is-hint {
  outline: 2px dashed var(--color-accent);
  outline-offset: 2px;
}
.dh-sequence {
  display: flex;
  justify-content: center;
  gap: 0.35rem;
}
.dh-seq-slot {
  display: grid;
  width: 2.4rem;
  aspect-ratio: 1;
  place-items: center;
  border-radius: var(--radius-box);
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 20%, transparent);
  font-size: 1.25rem;
}
.dh-seq-slot.is-on {
  background: var(--color-primary);
  color: var(--color-primary-content);
}
.dh-seq-slot.is-done {
  color: var(--color-accent);
}
.dh-weights {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
}
.dh-weight {
  display: grid;
  width: 3rem;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 50%;
  border: 2px solid
    color-mix(in oklch, var(--color-base-content) 25%, transparent);
  background: var(--color-base-300);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.dh-weight.is-on {
  border-color: var(--color-primary);
  background: color-mix(
    in oklch,
    var(--color-primary) 30%,
    var(--color-base-200)
  );
}
@media (prefers-reduced-motion: reduce) {
  .dh-rune {
    transition: none;
  }
}
</style>
