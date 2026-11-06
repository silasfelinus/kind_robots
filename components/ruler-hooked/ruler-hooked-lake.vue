<!-- components/ruler-hooked/ruler-hooked-lake.vue
     The Lake tab of the console (t-054). The composited lake behind the frame
     is the first-person stage; this fills the right-hand column with the line
     while a fish is on it, and otherwise with the last catch, the steward's
     word and the one next action (cast, or answer the waiting petition). -->
<template>
  <div class="contents">
    <section
      class="rh-aside flex flex-col gap-2 overflow-y-auto overscroll-contain kr-scroll"
    >
      <RulerHookedFishingEncounter
        v-if="store.activeFishing"
        ref="encounterEl"
        :encounter="store.activeFishing"
        @stop="store.fishingStop($event)"
        @tap="store.reelFishing('TAP')"
        @release="store.reelFishing('RELEASE')"
      />
      <template v-else>
        <div v-if="store.lastCatch" class="rh-broadside p-3">
          <RulerHookedCatch :catch-result="store.lastCatch" />
        </div>
        <div
          v-else-if="store.lastEscape"
          class="rh-broadside p-3"
          role="status"
        >
          <p class="rh-broadside-head text-sm">The line went slack</p>
          <p class="mt-1 text-lg font-bold">
            {{ store.lastEscape.fishName }} escaped
          </p>
          <p class="text-sm">{{ store.lastEscape.cue }}</p>
        </div>

        <div class="rh-panel flex flex-col gap-2 p-3">
          <template v-if="!store.lastCatch && !store.lastEscape">
            <p class="rh-lake-eyebrow">Castle Lake</p>
            <h2 class="rh-lake-title">Just one more cast.</h2>
          </template>
          <button
            v-if="store.activeCard"
            type="button"
            class="rh-lake-action"
            data-testid="rh-answer"
            @click="emit('court')"
          >
            <kbd class="rh-key">A</kbd> Answer the petition
          </button>
          <button
            v-else-if="store.canFish"
            type="button"
            class="rh-lake-action"
            data-testid="rh-cast"
            @click="store.startFishing()"
          >
            <kbd class="rh-key">A</kbd> Cast a line
          </button>
          <p v-else class="text-sm italic">
            {{
              store.pendingEnding
                ? 'The court waits on how this reign ends.'
                : 'This reign has ended. Begin another from Saves.'
            }}
          </p>
          <RulerHookedAdvisor />
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'

const emit = defineEmits<{ court: [] }>()
const store = useRulerHookedStore()
const encounterEl = ref<{ press: () => void; slack: () => void } | null>(null)

function press() {
  if (store.activeFishing) encounterEl.value?.press()
  else if (store.activeCard) emit('court')
  else if (store.canFish) store.startFishing()
}

function slack() {
  encounterEl.value?.slack()
}

defineExpose({ press, slack })
</script>

<style scoped>
.rh-lake-eyebrow {
  color: var(--rh-vermilion);
  font-size: 0.72rem;
  font-variant: small-caps;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.rh-lake-title {
  color: var(--rh-lapis);
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.1;
}
.rh-lake-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 3.2rem;
  border: 0;
  border-radius: 0.3rem;
  background: linear-gradient(180deg, var(--rh-lapis), var(--rh-lapis-deep));
  color: var(--rh-gold-hi);
  font-family: var(--rh-chronicle);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1px var(--rh-gold-hi),
    inset 0 0 0 3px var(--rh-gold),
    0 4px 10px #0008;
}
.rh-lake-action:hover,
.rh-lake-action:focus-visible {
  outline: none;
  filter: brightness(1.12);
}
.rh-lake-action:focus-visible {
  box-shadow:
    inset 0 0 0 1px var(--rh-gold-hi),
    inset 0 0 0 3px var(--rh-gold),
    0 0 0 3px var(--rh-gold-hi);
}
</style>
