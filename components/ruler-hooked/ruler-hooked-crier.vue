<!-- The Town Crier's dawn proclamation: the daily kingdom event. Fen the Bard
     unrolls the day's news; one tap hears it and applies its small nudge.
     In-game days only: it waits, unheard, for as long as you like. -->
<template>
  <div
    class="rh-crier"
    role="dialog"
    aria-modal="true"
    aria-labelledby="rh-crier-title"
  >
    <div class="rh-crier__card">
      <RulerHookedArt
        class="rh-crier__portrait"
        :candidates="proclamationCandidates(event.key)"
        alt="Fen the Bard, town crier"
        eager
        fit="cover"
        position="center 20%"
      />
      <div class="rh-parchment rh-crier__scroll">
        <p class="rh-eyebrow">Day {{ day }} · The Town Crier</p>
        <h2 id="rh-crier-title" class="rh-title rh-title--big">
          {{ event.title }}
        </h2>
        <p class="rh-crier__cry">“{{ event.cry }}”</p>
        <p class="rh-crier__body">{{ event.body }}</p>
        <p v-if="chips.length" class="rh-crier__chips">
          <span
            v-for="chip in chips"
            :key="chip.key"
            class="rh-chip"
            :class="chip.value > 0 ? 'is-up' : 'is-down'"
          >
            <RulerHookedGlyph :name="chip.glyph" />{{ chip.value > 0 ? '+' : ''
            }}{{ chip.value }}
          </span>
        </p>
        <button
          ref="hearBtn"
          type="button"
          class="rh-btn rh-btn--gold rh-btn--big"
          @click="emit('hear')"
        >
          Hear, hear!
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DailyEvent } from '~/utils/rulerHooked/dailyEvents'
import { proclamationCandidates } from '~/utils/rulerHooked/artLibrary'
import type { AxisKey } from '~/types/ruler-hooked'

const props = defineProps<{ day: number; event: DailyEvent }>()
const emit = defineEmits<{ hear: [] }>()

const chips = computed(() => {
  const out: { key: string; glyph: AxisKey | 'coin'; value: number }[] =
    Object.entries(props.event.effect.sliders ?? {}).map(([key, value]) => ({
      key,
      glyph: key as AxisKey,
      value: value ?? 0,
    }))
  const coins = props.event.effect.counters?.coins
  if (coins) out.push({ key: 'coins', glyph: 'coin', value: coins })
  return out
})

const hearBtn = ref<HTMLButtonElement | null>(null)
onMounted(() => hearBtn.value?.focus())
</script>

<style scoped>
.rh-crier {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: radial-gradient(
    circle at 50% 40%,
    rgb(37 11 31 / 0.35),
    rgb(37 11 31 / 0.8)
  );
  animation: rh-fade 260ms ease;
}
.rh-crier__card {
  display: grid;
  width: min(44rem, 100%);
  max-height: 100%;
  overflow: hidden;
  border-radius: 1.2rem;
  border: 2px solid var(--rh-gold);
  box-shadow:
    0 0 0 4px rgb(59 21 48 / 0.8),
    0 20px 40px rgb(0 0 0 / 0.55);
  background: var(--rh-plum);
}
@container rhconsole (min-width: 640px) {
  .rh-crier__card {
    grid-template-columns: 38% 1fr;
  }
}
.rh-crier__portrait {
  min-height: 10rem;
  max-height: 30cqh;
}
@container rhconsole (min-width: 640px) {
  .rh-crier__portrait {
    max-height: none;
  }
}
.rh-crier__scroll {
  border-radius: 0;
  border: 0;
  box-shadow: none;
  display: grid;
  gap: 0.45rem;
  justify-items: start;
  overflow-y: auto;
}
.rh-crier__cry {
  font-family: var(--rh-display);
  font-style: italic;
  font-size: 1.1rem;
  line-height: 1.3;
  color: var(--rh-plum);
}
.rh-crier__chips {
  display: flex;
  gap: 0.3rem;
}
@keyframes rh-fade {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
}
@media (prefers-reduced-motion: reduce) {
  .rh-crier {
    animation: none;
  }
}
</style>
