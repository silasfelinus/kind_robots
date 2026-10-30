<template>
  <Transition name="comic-panel">
    <div v-if="open" class="comic-overlay" data-testid="comic-character-intro">
      <section
        ref="panel"
        class="comic-sheet"
        :class="'comic-' + intro.motif"
        role="dialog"
        aria-modal="true"
        :aria-label="intro.role + ' introduction: ' + intro.name"
        tabindex="-1"
        @keydown.esc.prevent="emit('dismiss')"
      >
        <header class="comic-header">
          <span>COMET CITY <b>COMICS</b></span>
          <span>FIRST APPEARANCE <b>✦</b></span>
        </header>
        <div class="comic-stage">
          <img
            v-if="artSrc"
            class="comic-art"
            :src="artSrc"
            :alt="'Comic introduction artwork for ' + intro.name"
          />
          <div v-else class="comic-placeholder" aria-hidden="true">
            <span class="comic-burst">✦</span>
            <span class="comic-initials">{{
              intro.name.slice(0, 2).toUpperCase()
            }}</span>
          </div>
          <div class="comic-ink" aria-hidden="true" />
          <div class="comic-lettering">
            <small
              >{{ intro.role.toUpperCase() }} <span>★</span> COMET CITY</small
            >
            <h2>{{ intro.name }}<em>!</em></h2>
            <strong>{{ intro.tagline }}</strong>
          </div>
        </div>
        <footer class="comic-footer">
          <p>{{ intro.caption }}</p>
          <div class="comic-actions">
            <button
              type="button"
              data-testid="comic-intro-continue"
              @click="emit('dismiss')"
            >
              CONTINUE <span aria-hidden="true">➜</span>
            </button>
            <button
              v-if="allowSkipAll"
              type="button"
              class="comic-skip"
              data-testid="comic-intro-skip-all"
              @click="emit('skip-all')"
            >
              SKIP REVEALS
            </button>
          </div>
        </footer>
      </section>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { ComicIntro } from '~/utils/cometAcademy/comicIntroductions'

const props = withDefaults(
  defineProps<{
    open: boolean
    intro: ComicIntro
    artSrc?: string | null
    allowSkipAll?: boolean
  }>(),
  { artSrc: null, allowSkipAll: false },
)
const emit = defineEmits<{ dismiss: []; 'skip-all': [] }>()
const panel = ref<HTMLElement | null>(null)
let priorFocus: HTMLElement | null = null
watch(
  () => props.open,
  async (open, wasOpen) => {
    if (open && typeof document !== 'undefined') {
      priorFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      await nextTick()
      panel.value?.focus()
    } else if (!open && wasOpen) {
      await nextTick()
      priorFocus?.focus()
      priorFocus = null
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.comic-overlay {
  position: absolute;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: clamp(8px, 2vw, 24px);
  background: #070d1bee;
  isolation: isolate;
}
.comic-sheet {
  --paper: #fff1c9;
  --accent: #ffc04c;
  --shadow: #d35051;
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: min(100%, 860px);
  max-height: 100%;
  aspect-ratio: 1.32;
  padding: clamp(8px, 1.2vw, 18px);
  background: var(--paper);
  color: #101b30;
  border: 5px solid #111829;
  box-shadow:
    10px 13px 0 #030711,
    0 0 0 3px #ffe29d;
  transform: rotate(-0.6deg);
  overflow: hidden;
}
.comic-danger {
  --accent: #ff8974;
  --shadow: #7c2650;
}
.comic-underworld {
  --accent: #d9e981;
  --shadow: #624ca7;
}
.comic-command {
  --accent: #b1dfff;
  --shadow: #515bad;
}
.comic-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 3px 9px;
  font:
    900 clamp(0.58rem, 1.2vw, 0.88rem)/1.2 system-ui,
    sans-serif;
  letter-spacing: 0.09em;
}
.comic-header b {
  color: #a22c41;
}
.comic-stage {
  position: relative;
  min-height: 0;
  overflow: hidden;
  border: 4px solid #101829;
  background: repeating-conic-gradient(
    from 12deg at 46% 40%,
    #253b61 0 10deg,
    #445875 11deg 20deg
  );
}
.comic-art {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 28%;
  filter: contrast(1.08) saturate(1.07);
}
.comic-placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: radial-gradient(ellipse at 50% 45%, var(--accent), #38486b 70%);
}
.comic-burst {
  position: absolute;
  font-size: min(45vw, 22rem);
  line-height: 1;
  color: #ffffff6e;
}
.comic-initials {
  position: relative;
  font:
    900 clamp(3rem, 13vw, 9rem)/1 Impact,
    fantasy,
    sans-serif;
  color: #fff0d2;
  text-shadow: 7px 8px 0 #101829;
}
.comic-ink {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    115deg,
    transparent 0 15px,
    #10182916 16px 17px
  );
  pointer-events: none;
}
.comic-lettering {
  position: absolute;
  inset: auto 2% 5%;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 5px;
  transform: rotate(-2.5deg);
  max-width: 96%;
}
.comic-lettering small,
.comic-lettering strong {
  padding: 3px 8px;
  background: var(--paper);
  border: 2px solid #101829;
  font:
    900 clamp(0.54rem, 1.2vw, 0.9rem)/1.3 system-ui,
    sans-serif;
  letter-spacing: 0.04em;
}
.comic-lettering h2 {
  max-width: 100%;
  overflow-wrap: anywhere;
  margin: 0;
  padding: 1px 12px 5px;
  background: var(--accent);
  border: 4px solid #101829;
  box-shadow: 5px 6px 0 var(--shadow);
  color: #101829;
  font:
    900 clamp(1.6rem, 6vw, 5.3rem)/0.95 Impact,
    'Arial Black',
    sans-serif;
  letter-spacing: 0.018em;
  text-transform: uppercase;
  -webkit-text-stroke: 0.4px #101829;
}
.comic-lettering h2 em {
  font-style: normal;
  color: #c62840;
}
.comic-lettering small span {
  color: #c62840;
}
.comic-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 0;
  gap: 14px;
  padding: 10px 2px 0;
}
.comic-footer p {
  flex: 1;
  min-width: 0;
  max-height: 4.5em;
  overflow-y: auto;
  font:
    650 clamp(0.66rem, 1.35vw, 1rem)/1.45 system-ui,
    sans-serif;
}
.comic-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}
.comic-actions button {
  padding: 9px 12px;
  background: var(--accent);
  color: #101829;
  border: 3px solid #101829;
  font:
    900 0.76rem system-ui,
    sans-serif;
  white-space: nowrap;
  cursor: pointer;
}
.comic-actions button:focus-visible {
  outline: 4px solid #ffae19;
  outline-offset: 2px;
}
.comic-actions .comic-skip {
  background: #fff;
}
.comic-panel-enter-active {
  animation: comic-slam 0.42s cubic-bezier(0.2, 1.6, 0.35, 1);
}
.comic-panel-leave-active {
  transition: opacity 0.18s ease;
}
.comic-panel-leave-to {
  opacity: 0;
}
@keyframes comic-slam {
  from {
    opacity: 0;
    transform: scale(1.09) translateX(22px);
  }
  65% {
    opacity: 1;
    transform: scale(0.985) translateX(-4px);
  }
  to {
    transform: scale(1) translateX(0);
  }
}
@media (max-width: 650px) {
  .comic-sheet {
    aspect-ratio: auto;
    height: min(95%, 690px);
  }
  .comic-footer {
    align-items: stretch;
    flex-direction: column;
  }
  .comic-actions {
    justify-content: flex-end;
  }
}
@media (prefers-reduced-motion: reduce) {
  .comic-panel-enter-active,
  .comic-panel-leave-active {
    animation: none;
    transition: none;
  }
}
</style>
