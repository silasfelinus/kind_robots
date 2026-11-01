<template>
  <section
    ref="reelRoot"
    class="couch-reel"
    :class="{ 'couch-reel--still': reducedMotion }"
    tabindex="-1"
    aria-label="Space Couch illustrated opening titles"
    data-testid="space-couch-opening-reel"
    @keydown.left.prevent="previous"
    @keydown.right.prevent="next"
    @keydown.esc="emit('close')"
  >
    <img
      :key="frame.key"
      :src="imageSource"
      :alt="
        imageSource === FALLBACK
          ? 'The long red Space Couch floats inside its protective force bubble'
          : frame.alt
      "
      class="couch-reel-art"
      @error="onImageError"
    />
    <div class="couch-reel-vignette" aria-hidden="true" />
    <header class="couch-reel-header">
      <span class="couch-reel-brand"
        >SPACE <em>COUCH</em> / OPENING TITLES</span
      >
      <span class="couch-reel-number" data-testid="space-couch-opening-count">
        {{ current + 1 }} / {{ SPACE_COUCH_OPENING.length }}
      </span>
      <button type="button" class="couch-reel-exit" @click="emit('close')">
        CLOSE ✕
      </button>
    </header>
    <div class="couch-reel-copy" aria-live="polite" aria-atomic="true">
      <p class="couch-reel-card">EPISODE ZERO · {{ frame.key.slice(8, 10) }}</p>
      <h2>{{ frame.title }}</h2>
      <p>{{ frame.line }}</p>
    </div>
    <footer class="couch-reel-controls">
      <button
        type="button"
        data-testid="space-couch-opening-previous"
        :disabled="current === 0"
        @click="previous"
      >
        ← PREVIOUS
      </button>
      <div
        class="couch-reel-meter"
        role="progressbar"
        :aria-valuenow="current + 1"
        :aria-valuemin="1"
        :aria-valuemax="SPACE_COUCH_OPENING.length"
        aria-label="Opening title scene"
      >
        <span :style="{ width: progress + '%' }" />
      </div>
      <button
        type="button"
        data-testid="space-couch-opening-next"
        @click="next"
      >
        {{ atEnd ? 'START VOYAGE ↗' : 'NEXT SCENE →' }}
      </button>
      <button type="button" class="couch-reel-skip" @click="emit('start')">
        SKIP TO CAPTAIN SELECTION
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { SPACE_COUCH_OPENING } from '~/utils/gameOfCaptains/openingReel'

const props = defineProps<{
  artwork: Record<string, string>
  reducedMotion: boolean
}>()
const emit = defineEmits<{ close: []; start: [] }>()
const FALLBACK = '/game-of-captains/space-couch-stage.svg'
const reelRoot = ref<HTMLElement | null>(null)
const current = ref(0)
const failed = ref<Record<string, boolean>>({})
const frame = computed(() => SPACE_COUCH_OPENING[current.value]!)
const atEnd = computed(() => current.value === SPACE_COUCH_OPENING.length - 1)
const progress = computed(
  () => ((current.value + 1) / SPACE_COUCH_OPENING.length) * 100,
)
const imageSource = computed(() =>
  failed.value[frame.value.key]
    ? FALLBACK
    : props.artwork[frame.value.key] || FALLBACK,
)
function onImageError() {
  failed.value[frame.value.key] = true
}
function previous() {
  if (current.value > 0) current.value -= 1
}
function next() {
  if (atEnd.value) emit('start')
  else current.value += 1
}
onMounted(() => reelRoot.value?.focus())
</script>

<style scoped>
.couch-reel {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  isolation: isolate;
  background: #07101e;
  color: #fff3dc;
}
.couch-reel-art {
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  animation: couch-reel-fade 280ms ease both;
}
.couch-reel-vignette {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    #07101fdb 0%,
    #07101f25 24%,
    #07101f13 40%,
    #070e20e6 82%,
    #06101efa 100%
  );
}
.couch-reel-header,
.couch-reel-controls {
  display: flex;
  align-items: center;
  gap: clamp(0.4rem, 1.5cqi, 1rem);
  padding: clamp(0.65rem, 2cqi, 1.5rem);
  position: relative;
  z-index: 1;
}
.couch-reel-header {
  justify-content: space-between;
}
.couch-reel-brand {
  min-width: 0;
  font-size: clamp(0.65rem, 1.3cqi, 1rem);
  font-weight: 900;
  letter-spacing: 0.08em;
}
.couch-reel-brand em {
  color: #ffc79b;
}
.couch-reel-number,
.couch-reel-card {
  color: #efc99c;
  font-size: clamp(0.58rem, 1cqi, 0.78rem);
  font-weight: 800;
  letter-spacing: 0.12em;
}
.couch-reel-exit,
.couch-reel-controls button {
  flex: none;
  min-height: 2.6rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid #d7bc8e;
  border-radius: 0.4rem;
  background: #10293fe8;
  color: #fff2dc;
  font-size: clamp(0.66rem, 1cqi, 0.9rem);
  font-weight: 800;
}
.couch-reel-controls button:focus-visible,
.couch-reel-exit:focus-visible {
  outline: 3px solid #ffe3aa;
  outline-offset: 2px;
}
.couch-reel-controls button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.couch-reel-copy {
  margin-top: auto;
  padding: clamp(1rem, 3.5cqi, 3rem);
  width: min(100%, 68rem);
  text-shadow: 0 3px 16px #040916;
}
.couch-reel-copy h2 {
  margin: 0.35rem 0;
  font:
    900 clamp(1.65rem, 5cqi, 4.7rem)/1 Georgia,
    serif;
  letter-spacing: -0.03em;
}
.couch-reel-copy > p:last-child {
  max-width: 43ch;
  font-size: clamp(0.9rem, 1.8cqi, 1.45rem);
  line-height: 1.35;
}
.couch-reel-meter {
  min-width: 2rem;
  max-width: 16rem;
  height: 0.4rem;
  flex: 1;
  overflow: hidden;
  border-radius: 1rem;
  background: #c1e7f955;
}
.couch-reel-meter span {
  display: block;
  height: 100%;
  background: #fbc997;
  transition: width 180ms ease;
}
@keyframes couch-reel-fade {
  from {
    opacity: 0.5;
  }
  to {
    opacity: 1;
  }
}
.couch-reel--still .couch-reel-art,
.couch-reel--still .couch-reel-meter span {
  animation: none;
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .couch-reel-art,
  .couch-reel-meter span {
    animation: none;
    transition: none;
  }
}
@media (max-width: 700px) {
  .couch-reel-copy {
    padding: 1rem;
  }
  .couch-reel-controls {
    flex-wrap: wrap;
  }
  .couch-reel-meter {
    order: -1;
    flex-basis: 100%;
    max-width: none;
  }
  .couch-reel-skip {
    flex-basis: 100%;
  }
}
@media (max-height: 560px) {
  .couch-reel-copy {
    padding-block: 0.4rem;
  }
  .couch-reel-copy h2 {
    font-size: clamp(1.3rem, 3cqi, 2.6rem);
  }
  .couch-reel-controls button,
  .couch-reel-exit {
    min-height: 2rem;
    padding: 0.25rem 0.5rem;
  }
}
</style>
