<!-- components/cthulhuquarium/cthulhuquarium-guide.vue
     The illustrated how-to deck. Opens once after Charlotte's welcome (or on
     a returning player's next visit) and again from the system bar's "?",
     which the game registers through page-help. One plate, one idea, one
     control per card -- the console tutorial, not a help article. -->
<template>
  <Teleport to="body">
    <Transition name="cq-guide">
      <div
        v-if="tankStore.guideOpen && step"
        class="cq-guide fixed inset-0 z-[65] flex items-center justify-center p-2 sm:p-6"
        data-theme="cthulhuquarium"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cq-guide-title"
        @keydown.esc.prevent="finish"
        @keydown.left.prevent="go(-1)"
        @keydown.right.prevent="go(1)"
      >
        <div class="cq-guide-shade" aria-hidden="true" @click="finish" />
        <section class="cq-guide-card">
          <div class="cq-guide-art">
            <img
              v-if="step.art"
              :key="step.id"
              :src="step.art"
              alt=""
              class="cq-guide-plate"
            />
            <div v-else class="cq-guide-plate cq-guide-fallback">
              <Icon :name="step.icon" class="size-16 opacity-60" />
            </div>
            <div class="cq-guide-art-fade" aria-hidden="true" />
            <span class="cq-guide-control">
              <Icon :name="step.icon" class="size-4" />
              {{ step.control }}
            </span>
          </div>

          <div class="cq-guide-body">
            <p class="cq-guide-overline">
              How to tend the tank · {{ index + 1 }} of {{ steps.length }}
            </p>
            <h2 id="cq-guide-title" class="font-serif text-2xl font-black">
              {{ step.title }}
            </h2>
            <p class="text-sm leading-relaxed opacity-85 sm:text-base">
              {{ step.body }}
            </p>

            <div
              v-if="step.voice"
              class="flex items-end gap-2"
              :class="step.voice.speaker === 'wilbur' ? 'flex-row-reverse' : ''"
            >
              <img
                :src="
                  portraitFor(step.voice.speaker, step.voice.pose) ?? undefined
                "
                :alt="speakerName(step.voice.speaker)"
                class="size-12 shrink-0 rounded-full border-2 border-secondary/60 bg-base-200 object-cover object-top"
              />
              <p
                class="rounded-2xl border border-base-300 bg-base-200/80 px-3 py-2 font-serif text-sm italic leading-snug"
              >
                “{{ step.voice.text }}”
              </p>
            </div>

            <div class="mt-auto flex flex-col gap-3 pt-2">
              <div
                class="flex justify-center gap-1.5"
                role="tablist"
                aria-label="Tutorial cards"
              >
                <button
                  v-for="(entry, dot) in steps"
                  :key="entry.id"
                  type="button"
                  role="tab"
                  class="cq-guide-dot"
                  :class="{ 'cq-guide-dot-on': dot === index }"
                  :aria-selected="dot === index"
                  :aria-label="entry.title"
                  @click="index = dot"
                />
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn btn-ghost min-h-12"
                  :disabled="index === 0"
                  @click="go(-1)"
                >
                  <Icon name="kind-icon:chevron-left" class="kr-icon-4" />
                  Back
                </button>
                <button
                  v-if="index === steps.length - 1"
                  type="button"
                  class="btn btn-ghost min-h-12 flex-1"
                  @click="replayWelcome"
                >
                  <Icon name="kind-icon:play" class="kr-icon-4" />
                  Replay the welcome
                </button>
                <button
                  ref="nextButton"
                  type="button"
                  class="btn btn-primary min-h-12 flex-1"
                  @click="go(1)"
                >
                  {{ index === steps.length - 1 ? 'Into the tank' : 'Next' }}
                  <Icon name="kind-icon:chevron-right" class="kr-icon-4" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2 z-10 min-h-11 min-w-11 bg-base-100/70"
            aria-label="Close the tutorial"
            @click="finish"
          >
            <Icon name="kind-icon:close" class="kr-icon-4" />
          </button>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useCthulhuquariumTankStore } from '@/stores/cthulhuquariumTankStore'
import {
  artByName,
  artForSetKind,
  backgroundArt,
  plateArt,
  portraitFor,
} from '~/utils/cthulhuquariumArt'
import {
  CTHULHUQUARIUM_CHARACTERS,
  type CanonSpeaker,
} from '~/utils/cthulhuquariumCanon.generated'

type GuideStep = {
  id: string
  title: string
  body: string
  control: string
  icon: string
  art: string | null
  voice?: { speaker: CanonSpeaker; pose: string; text: string }
}

const tankStore = useCthulhuquariumTankStore()

const steps = computed<GuideStep[]>(() => [
  {
    id: 'tank',
    title: 'This tank is yours',
    body: 'Everything you keep swims here, and it keeps swimming while you are away. A fed creature is a paying creature.',
    control: 'The tank',
    icon: 'kind-icon:fish',
    art: plateArt('screen-arrival') ?? backgroundArt('parlour'),
    voice: {
      speaker: 'wilbur',
      pose: 'greeting',
      text: "It's empty, which is the best way for a tank to start.",
    },
  },
  {
    id: 'coins',
    title: 'Tap the coins',
    body: 'Every fed creature drops coins. Tap them before they fade to bank them. Tap near a creature to startle it.',
    control: 'Tap the water',
    icon: 'kind-icon:coin',
    art: plateArt('upgrade-drops') ?? artForSetKind('roaming_collector'),
    voice: {
      speaker: 'charlotte',
      pose: 'delighted',
      text: 'Nobody knows why. Nobody has ever needed to.',
    },
  },
  {
    id: 'feed',
    title: 'Feed the hungry',
    body: 'Hungry creatures stop paying. Feed always serves the hungriest first, and the button tells you how many are waiting.',
    control: 'Feed',
    icon: 'kind-icon:fish',
    art: plateArt('upgrade-food') ?? artByName('set-heavier-feed'),
  },
  {
    id: 'clean',
    title: 'Keep the glass clean',
    body: 'Debris settles on the bottom and fills the meter on the Clean button. A clean tank works better for everyone in it.',
    control: 'Clean',
    icon: 'kind-icon:brush',
    art: artByName('set-glass-brush'),
    voice: {
      speaker: 'wilbur',
      pose: 'explaining',
      text: 'Some of it is gravel.',
    },
  },
  {
    id: 'market',
    title: 'The fish market',
    body: 'A new slate of specimens arrives every day. Spend coins on creatures, a bigger tank, faster shedding and cheaper food.',
    control: 'Fish market',
    icon: 'kind-icon:coin',
    art: artByName('screen-shop'),
  },
  {
    id: 'book',
    title: 'Fill the book',
    body: 'The Ichthyonomicon records every species you have kept. The more you know, the more of the shop opens: relics, decorations and new rooms behind the glass.',
    control: 'The bestiary',
    icon: 'kind-icon:book',
    art: artByName('ichthyonomicon'),
    voice: {
      speaker: 'charlotte',
      pose: 'confiding',
      text: 'I shall be around. I am always around.',
    },
  },
])

const index = ref(0)
const step = computed(() => steps.value[index.value] ?? null)
const nextButton = ref<HTMLButtonElement | null>(null)

watch(
  () => tankStore.guideOpen,
  async (open) => {
    if (!open) return
    index.value = 0
    await nextTick()
    nextButton.value?.focus()
  },
)

function speakerName(speaker: CanonSpeaker): string {
  return CTHULHUQUARIUM_CHARACTERS[speaker].name
}

function go(delta: number) {
  const next = index.value + delta
  if (next >= steps.value.length) {
    finish()
    return
  }
  index.value = Math.max(0, next)
}

function finish() {
  tankStore.closeGuide()
}

function replayWelcome() {
  tankStore.closeGuide()
  tankStore.replayIntro()
}
</script>

<style scoped>
.cq-guide {
  container-type: inline-size;
}
.cq-guide-shade {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgb(3 18 26 / 0.7) 0%,
    rgb(2 8 14 / 0.92) 100%
  );
  backdrop-filter: blur(6px);
}
.cq-guide-card {
  position: relative;
  display: grid;
  width: min(100%, 60rem);
  max-height: 100%;
  grid-template-rows: minmax(10rem, 42%) minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid color-mix(in oklab, var(--color-primary) 45%, transparent);
  border-radius: 1.5rem;
  background: var(--color-base-100);
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.4),
    0 0 3rem color-mix(in oklab, var(--color-primary) 18%, transparent),
    0 2rem 5rem rgb(0 0 0 / 0.6);
}
.cq-guide-art {
  position: relative;
  min-height: 0;
  overflow: hidden;
  background: var(--color-base-300);
}
.cq-guide-plate {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
  animation: cq-guide-plate-in 0.45s ease-out;
}
.cq-guide-fallback {
  display: grid;
  place-items: center;
}
.cq-guide-art-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 55%,
    var(--color-base-100) 100%
  );
}
.cq-guide-control {
  position: absolute;
  bottom: 0.75rem;
  left: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border: 1px solid color-mix(in oklab, var(--color-secondary) 60%, transparent);
  border-radius: 999px;
  background: color-mix(in oklab, var(--color-base-200) 85%, transparent);
  color: var(--color-secondary);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.cq-guide-body {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1rem clamp(1rem, 4cqi, 2rem) 1.25rem;
}
.cq-guide-overline {
  color: var(--color-primary);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.cq-guide-dot {
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 999px;
  background: var(--color-base-300);
  transition:
    width 0.2s ease,
    background 0.2s ease;
}
.cq-guide-dot-on {
  width: 1.75rem;
  background: var(--color-primary);
  box-shadow: 0 0 0.6rem
    color-mix(in oklab, var(--color-primary) 70%, transparent);
}
@container (min-width: 46rem) {
  .cq-guide-card {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    grid-template-rows: minmax(26rem, 1fr);
  }
  .cq-guide-art-fade {
    background: linear-gradient(
      90deg,
      transparent 65%,
      var(--color-base-100) 100%
    );
  }
  .cq-guide-body {
    padding-top: 2.75rem;
  }
}
.cq-guide-enter-active,
.cq-guide-leave-active {
  transition: opacity 0.25s ease;
}
.cq-guide-enter-active .cq-guide-card,
.cq-guide-leave-active .cq-guide-card {
  transition: transform 0.25s ease;
}
.cq-guide-enter-from,
.cq-guide-leave-to {
  opacity: 0;
}
.cq-guide-enter-from .cq-guide-card,
.cq-guide-leave-to .cq-guide-card {
  transform: translateY(1rem) scale(0.98);
}
@keyframes cq-guide-plate-in {
  from {
    opacity: 0;
    transform: scale(1.04);
  }
}
@media (prefers-reduced-motion: reduce) {
  .cq-guide-plate,
  .cq-guide-enter-active,
  .cq-guide-leave-active,
  .cq-guide-enter-active .cq-guide-card,
  .cq-guide-leave-active .cq-guide-card {
    animation: none;
    transition: none;
  }
}
</style>
