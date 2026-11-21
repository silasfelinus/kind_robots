<!-- components/cthulhuquarium/cthulhuquarium-title-card.vue
     The title card (conductor cthulhuquarium/t-100, the main-game standard):
     once per browser session, after the first intro, the shop's arrival plate
     with the wordmark and four ways in. One tap and the tank is back; it never
     blocks a returning keeper for more than that. -->
<template>
  <Teleport to="body">
    <div
      v-if="tankStore.titleOpen"
      class="cq-title fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cq-title-wordmark"
      @keydown.esc="enter"
    >
      <img v-if="plate" :src="plate" alt="" class="cq-title-plate" />
      <div class="cq-title-veil" aria-hidden="true" />
      <div class="cq-title-body">
        <p class="cq-title-eyebrow">The Portsmouth Fishmongers present</p>
        <h1 id="cq-title-wordmark" class="cq-title-wordmark">Cthulhuquarium</h1>
        <p v-if="floorLine" class="cq-title-floor">{{ floorLine }}</p>
        <nav class="cq-title-actions" aria-label="Title">
          <button
            ref="enterRef"
            type="button"
            class="btn btn-primary btn-lg min-w-48"
            @click="enter"
          >
            Enter the tank
          </button>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              @click="choose('memories')"
            >
              <Icon name="kind-icon:book" class="size-4" />
              Memory Book
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              @click="choose('settings')"
            >
              <Icon name="kind-icon:settings" class="size-4" />
              Settings
            </button>
            <NuxtLink to="/achievements" class="btn btn-ghost btn-sm">
              <Icon name="kind-icon:trophy" class="size-4" />
              Achievements
            </NuxtLink>
          </div>
        </nav>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useCthulhuquariumTankStore } from '~/stores/cthulhuquariumTankStore'
import { movingArt, plateArt } from '~/utils/cthulhuquariumArt'
import { prefersReducedMotion } from '~/utils/cthulhuquariumSprites'

const emit = defineEmits<{ open: [what: 'memories' | 'settings'] }>()
const tankStore = useCthulhuquariumTankStore()
const enterRef = ref<HTMLButtonElement | null>(null)

const plate = computed(
  () =>
    (prefersReducedMotion() ? null : movingArt('screen-arrival')) ??
    plateArt('screen-arrival'),
)
const floorLine = computed(() => {
  const status = tankStore.floorStatus
  return status ? `Floor ${status.numeral} · ${status.name}` : ''
})

watch(
  () => tankStore.titleOpen,
  async (open) => {
    if (!open) return
    await nextTick()
    enterRef.value?.focus()
  },
)

function enter() {
  tankStore.closeTitle()
}

function choose(what: 'memories' | 'settings') {
  tankStore.closeTitle()
  emit('open', what)
}
</script>

<style scoped>
.cq-title {
  display: grid;
  place-items: end center;
  background: #050c16;
  overflow: hidden;
}
.cq-title-plate {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
}
.cq-title-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgb(3 10 18 / 0.15) 0%,
    rgb(3 10 18 / 0.35) 45%,
    rgb(3 10 18 / 0.95) 100%
  );
}
.cq-title-body {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  padding: 0 1rem max(2.5rem, env(safe-area-inset-bottom));
  text-align: center;
  color: white;
}
.cq-title-eyebrow {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgb(153 246 228);
}
.cq-title-wordmark {
  font-family: var(--cq-display, ui-serif, Georgia, serif);
  font-size: clamp(2.6rem, 9vw, 5.5rem);
  font-weight: 900;
  line-height: 0.95;
  text-shadow: 0 0.3rem 1.5rem rgb(0 0 0 / 0.8);
}
.cq-title-floor {
  font-variant: small-caps;
  letter-spacing: 0.06em;
  color: rgb(216 181 106);
}
.cq-title-actions {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
</style>
