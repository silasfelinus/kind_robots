<template>
  <div
    class="mq-cutscene flex size-full min-h-0 flex-col"
    data-testid="monstrique-cutscene"
    :data-cutscene="cutscene.id"
  >
    <div class="mq-letterbox shrink-0" aria-hidden="true" />
    <div class="mq-panel relative min-h-0 flex-1 overflow-hidden">
      <div
        class="mq-backdrop absolute inset-0"
        :data-shot="shot.id"
        aria-hidden="true"
      >
        <div class="mq-rain" />
      </div>
      <p class="mq-slug absolute left-3 top-3 z-10">
        {{ cutscene.title }} · {{ shot.title }}
      </p>
      <p
        v-if="shot.sfx"
        :key="shot.id + '-sfx'"
        class="mq-sfx absolute right-4 top-10 z-10"
      >
        {{ shot.sfx }}
      </p>
      <div class="mq-stage absolute inset-x-0 bottom-0 top-8">
        <MonstriqueCharacterSprite
          v-for="slot in shot.cast"
          :key="shot.id + slot.character"
          class="mq-actor absolute bottom-[4%]"
          :style="{
            left: slot.x + '%',
            height: 78 * castScale(slot.character) + '%',
          }"
          :character="slot.character"
          :mood="slot.expression"
          :living="slot.living"
          :talking="speaker === slot.character"
          :facing="slot.x > 55 ? 'left' : 'right'"
        />
        <div
          v-if="!shot.cast.length"
          class="mq-insert absolute inset-0 grid place-items-center"
          aria-hidden="true"
        >
          <span class="mq-knife">🗡</span>
        </div>
      </div>
      <aside
        v-if="director"
        class="mq-director absolute bottom-3 right-3 z-10 max-w-[18rem]"
        data-testid="monstrique-director-notes"
      >
        <strong>3D · {{ shot.framing }}</strong>
        <span
          >{{ shot.camera.move }} · {{ shot.camera.lensMm }}mm ·
          {{ shot.camera.seconds }}s</span
        >
        <span>{{ shot.camera.animation }}</span>
      </aside>
    </div>
    <div class="mq-caption shrink-0 space-y-2 px-4 py-3" aria-live="polite">
      <p class="font-serif text-base leading-snug @md:text-lg">
        {{ shot.caption }}
      </p>
      <p v-if="shot.line" class="mq-line">{{ shot.line }}</p>
      <p v-if="shot.gag" class="mq-gag">{{ shot.gag }}</p>
      <div class="flex flex-wrap items-center gap-2 pt-1">
        <span class="mq-count mr-auto">
          SHOT {{ index + 1 }} / {{ cutscene.shots.length }}
        </span>
        <button type="button" class="mq-button" @click="emit('done')">
          Skip
        </button>
        <button
          type="button"
          class="mq-button is-primary"
          data-testid="monstrique-cutscene-next"
          @click="advance"
        >
          {{ index === cutscene.shots.length - 1 ? endLabel : 'Next' }}
        </button>
      </div>
    </div>
    <div class="mq-letterbox shrink-0" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  CHARACTER_MODELS,
  speakerOf,
  type MonstriqueCharacterId,
} from '~/utils/monstrique/characterModels'
import type { Cutscene } from '~/utils/monstrique/cutscenes'

const props = defineProps<{
  cutscene: Cutscene
  director?: boolean
  endLabel?: string
}>()
const emit = defineEmits<{ done: [] }>()
const index = ref(0)
const shot = computed(() => props.cutscene.shots[index.value]!)
const speaker = computed(() =>
  shot.value.line ? (speakerOf(shot.value.line)?.id ?? null) : null,
)

watch(
  () => props.cutscene.id,
  () => {
    index.value = 0
  },
)

function castScale(id: MonstriqueCharacterId): number {
  return CHARACTER_MODELS[id].sprite.height
}

function advance(): void {
  if (index.value < props.cutscene.shots.length - 1) index.value += 1
  else emit('done')
}
</script>

<style scoped>
.mq-cutscene {
  background: #07070c;
  color: #f6eef4;
}
.mq-letterbox {
  height: clamp(0.75rem, 4cqh, 2.25rem);
  background: #000;
}
.mq-backdrop {
  background:
    radial-gradient(circle at 78% 18%, #e9c5a855, transparent 22%),
    linear-gradient(180deg, #1d2342 0%, #3b2a48 55%, #5c2f47 100%);
}
.mq-backdrop[data-shot^='elbow'] {
  background: linear-gradient(180deg, #16344a, #3d6f88 60%, #594756);
}
.mq-backdrop[data-shot^='car'] {
  background: linear-gradient(180deg, #120f2a, #41205c 55%, #d14b8f 100%);
}
.mq-backdrop[data-shot^='kiss'] {
  background: radial-gradient(circle at 50% 40%, #b9a3e3aa, #2a1a3c 70%);
}
.mq-backdrop[data-shot='cold-open-3'] {
  background: radial-gradient(circle at 50% 50%, #3a2c40, #050508 80%);
}
.mq-rain {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    105deg,
    transparent 0 14px,
    rgb(200 220 255 / 0.08) 14px 15px
  );
  animation: mq-rain 0.6s linear infinite;
}
.mq-actor {
  translate: -50% 0;
}
.mq-knife {
  font-size: clamp(3rem, 18cqh, 9rem);
  filter: drop-shadow(0 0 1.2rem #ffd9a0);
  animation: mq-hover 2.4s ease-in-out infinite;
}
.mq-slug,
.mq-count {
  font-size: 0.62rem;
  font-weight: 850;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.8;
}
.mq-sfx {
  font-family: 'Impact', 'Arial Black', sans-serif;
  font-size: clamp(1rem, 3.4cqw, 2rem);
  color: #ffd84d;
  text-shadow:
    3px 3px 0 #c21d5a,
    -1px -1px 0 #000;
  rotate: -6deg;
  animation: mq-pop 0.35s ease-out;
}
.mq-caption {
  background: #120d18;
  border-top: 1px solid rgb(255 255 255 / 0.1);
}
.mq-line {
  font-weight: 700;
  color: #ffd1e3;
}
.mq-gag {
  font-size: 0.85rem;
  font-style: italic;
  opacity: 0.75;
}
.mq-director {
  display: grid;
  gap: 0.2rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.75rem;
  background: rgb(0 0 0 / 0.7);
  font-size: 0.68rem;
  line-height: 1.3;
}
.mq-button {
  border-radius: 0.6rem;
  padding: 0.45rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 800;
  background: rgb(255 255 255 / 0.08);
}
.mq-button.is-primary {
  background: #e3477f;
  color: #fff;
}
@keyframes mq-rain {
  to {
    background-position: -15px 40px;
  }
}
@keyframes mq-hover {
  50% {
    translate: 0 -6%;
    rotate: 8deg;
  }
}
@keyframes mq-pop {
  from {
    scale: 0.4;
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mq-rain,
  .mq-knife,
  .mq-sfx {
    animation: none;
  }
}
</style>
