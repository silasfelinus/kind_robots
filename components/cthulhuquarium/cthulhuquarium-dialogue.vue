<!-- components/cthulhuquarium/cthulhuquarium-dialogue.vue
     Charlotte and Wilbur, in person: the intro tutorial and every special
     moment (the canon's story/scenes.yaml, played by the tank store's story
     queue). A bottom sheet rather than a modal, so the player can still reach
     the button a beat is pointing at. -->
<template>
  <Transition name="cq-dialogue">
    <div
      v-if="beat && scene && tankStore.storyShowing"
      class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3"
      role="dialog"
      aria-live="polite"
      :aria-label="`${speakerName} speaks`"
    >
      <div class="pointer-events-auto relative w-full max-w-3xl">
        <img
          v-if="plateUrl"
          :src="plateUrl"
          alt=""
          class="mb-2 aspect-[16/9] max-h-56 w-full rounded-2xl border border-base-300 object-cover shadow-xl"
        />
        <div
          class="relative flex min-h-36 items-end gap-3 rounded-2xl border-2 border-base-content/20 bg-base-100/95 p-3 shadow-2xl backdrop-blur"
          :class="isCharlotte ? 'flex-row' : 'flex-row-reverse'"
        >
          <img
            :key="portraitUrl ?? beat.pose"
            :src="portraitUrl ?? undefined"
            :alt="`${speakerName}, ${beat.pose}`"
            class="cq-portrait -mt-28 h-52 w-36 shrink-0 object-contain object-bottom drop-shadow-xl sm:h-64 sm:w-44"
            :class="isCharlotte ? '-ml-1' : '-mr-1'"
          />
          <div class="flex min-w-0 flex-1 flex-col gap-2 self-stretch">
            <div
              class="flex items-baseline gap-2"
              :class="isCharlotte ? '' : 'flex-row-reverse text-right'"
            >
              <p class="kr-text-bold-sm">{{ speakerName }}</p>
              <p class="text-xs italic opacity-60">{{ speakerRole }}</p>
            </div>
            <p
              class="flex-1 font-serif text-base leading-snug"
              :class="isCharlotte ? '' : 'text-right'"
            >
              {{ beat.text }}
            </p>

            <div
              v-if="handover && isLastBeat"
              class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-2"
            >
              <img
                v-if="handoverUrl"
                :src="handoverUrl"
                alt=""
                class="aspect-[16/9] w-28 shrink-0 rounded-lg object-cover"
              />
              <div class="min-w-0 flex-1">
                <p class="text-xs uppercase tracking-wide opacity-60">
                  A new background
                </p>
                <p class="kr-text-bold-sm truncate">{{ handover.name }}</p>
              </div>
              <button
                type="button"
                class="btn btn-primary btn-sm min-h-11"
                :disabled="tankStore.backgroundSaving"
                @click="hangHandover"
              >
                Hang it
              </button>
            </div>

            <div
              class="flex items-center gap-2"
              :class="isCharlotte ? 'justify-end' : 'justify-start'"
            >
              <p v-if="awaitHint" class="text-xs italic opacity-70">
                {{ awaitHint }}
              </p>
              <button
                v-if="beat.await"
                type="button"
                class="btn btn-ghost btn-xs min-h-11"
                @click="tankStore.advanceBeat()"
              >
                Skip
              </button>
              <button
                v-else
                type="button"
                class="btn btn-primary btn-sm min-h-11 min-w-24"
                @click="tankStore.advanceBeat()"
              >
                {{ isLastBeat ? 'Thank you' : 'Go on' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCthulhuquariumTankStore } from '@/stores/cthulhuquariumTankStore'
import {
  backgroundArt,
  movingArt,
  plateArt,
  portraitFor,
} from '~/utils/cthulhuquariumArt'
import {
  CTHULHUQUARIUM_BACKGROUNDS,
  CTHULHUQUARIUM_CHARACTERS,
} from '~/utils/cthulhuquariumCanon.generated'

const tankStore = useCthulhuquariumTankStore()

const scene = computed(() => tankStore.activeScene)
const beat = computed(() => tankStore.activeBeat)
const isLastBeat = computed(() => tankStore.isLastBeat)
const isCharlotte = computed(() => beat.value?.speaker === 'charlotte')
const speakerName = computed(() =>
  beat.value ? CTHULHUQUARIUM_CHARACTERS[beat.value.speaker].name : '',
)
const speakerRole = computed(() =>
  beat.value ? CTHULHUQUARIUM_CHARACTERS[beat.value.speaker].role : '',
)
const portraitUrl = computed(() =>
  beat.value ? portraitFor(beat.value.speaker, beat.value.pose) : null,
)

const firstFocusIndex = computed(() => {
  const index = scene.value?.beats.findIndex((entry) => entry.focus) ?? -1
  return index === -1 ? Number.POSITIVE_INFINITY : index
})
const plateUrl = computed(() =>
  scene.value?.plate && tankStore.beatIndex < firstFocusIndex.value
    ? (movingArt(scene.value.plate) ?? plateArt(scene.value.plate))
    : null,
)

const handover = computed(() =>
  scene.value?.background
    ? (CTHULHUQUARIUM_BACKGROUNDS.find(
        (entry) => entry.key === scene.value?.background,
      ) ?? null)
    : null,
)
const handoverUrl = computed(() => backgroundArt(handover.value?.key))

const AWAIT_HINTS: Record<string, string> = {
  unlock: 'Choose a free creature in the shop below.',
  feed: 'Press Feed hungriest.',
  clean: 'Press Clean.',
}
const awaitHint = computed(() =>
  beat.value?.await ? (AWAIT_HINTS[beat.value.await] ?? '') : '',
)

async function hangHandover() {
  if (!handover.value) return
  await tankStore.chooseBackground(handover.value.key)
  await tankStore.advanceBeat()
}
</script>

<style scoped>
.cq-dialogue-enter-active,
.cq-dialogue-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.cq-dialogue-enter-from,
.cq-dialogue-leave-to {
  opacity: 0;
  transform: translateY(1.5rem);
}
.cq-portrait {
  animation: cq-portrait-in 0.35s ease-out;
}
@keyframes cq-portrait-in {
  from {
    opacity: 0;
    transform: translateY(0.75rem);
  }
}
</style>
