<!-- /components/gallery/kr-card-flip.vue -->
<!--
  Turn a card over to reveal its editing surface.

  WHY THIS EXISTS. Silas, 2026-08-08, of the Resource gallery: "selecting edit
  just creates the edit window at the very top of the gallery, which is not
  ideal. What should happen is ... selecting to edit the image should do a
  flip-card effect ... and do a growth effect so it looks like it's closer to
  the user, centered, and show us the editable info." He also asked for it as a
  general gallery behaviour rather than a Resources one-off, "as I believe it
  will take logic out of our galleries and towards the cards themselves".

  So this owns the whole gesture -- backdrop, centring, the flip, the growth,
  focus, Escape, scroll lock -- and a gallery supplies only the two faces.

  WHAT IT DELIBERATELY DOES NOT OWN. No store, no fetch, no save. It is the
  same split kr-gallery keeps and for the same reason: a shell that owns a
  consequence cannot be reused by the next caller. `saved`/`close` stay the
  caller's business; this just stops showing the back when asked.

  NOT components/navigation/flip-card.vue, which already existed and is a
  different animation: that one spins a full 360deg and lands back on its
  front, as a transition for dealing a card into place. This one is stateful --
  it turns to the back and STAYS there until dismissed -- so the two cannot be
  collapsed. The 3D mechanics are the same family on purpose (perspective on a
  stage, preserve-3d on the mover, backface-visibility on each face), and the
  reduced-motion escape hatch is copied from it verbatim.
-->
<template>
  <div class="contents">
    <!-- The front stays exactly where the grid put it. Flipping must not
         reflow the grid: a card that vacates its cell makes every sibling jump
         at the moment the user is trying to look at one thing. -->
    <slot :open="open" :is-open="modelValue" />

    <Teleport to="body">
      <!--
        Teleported because the panel has to escape the gallery's scroll owner
        and its stacking context. kr-gallery's toolbar is `sticky z-20` inside
        that scroller, so a panel rendered in place would be clipped by the
        scroll container and could sit UNDER the toolbar. Centring on the
        viewport is only meaningful from the body.
      -->
      <div
        v-if="modelValue"
        class="kr-flip-backdrop"
        :class="{ 'is-shown': shown }"
        @click="close"
      >
        <div class="kr-flip-stage" @click.stop>
          <div
            ref="panelRef"
            class="kr-flip-panel"
            :class="{ 'is-shown': shown }"
            role="dialog"
            aria-modal="true"
            :aria-label="label"
            tabindex="-1"
          >
            <div class="kr-flip-panel-scroll">
              <slot name="back" :close="close" />
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

withDefaults(
  defineProps<{
    /** Accessible name for the dialog; say what is being edited. */
    label?: string
  }>(),
  { label: 'Edit' },
)

const modelValue = defineModel<boolean>({ default: false })

const panelRef = ref<HTMLElement | null>(null)
/*
 * `shown` trails `modelValue` by a frame ON PURPOSE. The panel mounts in its
 * pre-flip state (turned away and small) and only then gets the class that
 * animates it in -- mount it already-open and the browser has no previous
 * value to transition FROM, so the flip and the growth are both skipped and it
 * simply appears.
 */
const shown = ref(false)

function open(): void {
  modelValue.value = true
}

function close(): void {
  modelValue.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

watch(modelValue, async (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', onKeydown)
    // The page behind must not scroll while a centred panel is up; otherwise
    // dismissing returns you somewhere other than where you opened it.
    document.body.style.overflow = 'hidden'

    await nextTick()
    shown.value = true
    panelRef.value?.focus()
    return
  }

  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  shown.value = false
})

/*
 * Unmounting mid-flip would otherwise leave the listener attached and the body
 * unscrollable -- a navigation away with the panel open would lock the app.
 */
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.kr-flip-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: oklch(0% 0 0 / 0.55);
  opacity: 0;
  transition: opacity 260ms ease;
}

.kr-flip-backdrop.is-shown {
  opacity: 1;
}

/* Perspective belongs to the STAGE, not the mover: on the mover it would be
   recomputed as the element scales, which reads as a wobble rather than a
   turn. */
.kr-flip-stage {
  perspective: 1600px;
  display: flex;
  width: 100%;
  max-width: 44rem;
  /*
   * `100%` of the backdrop, NOT a dvh. The backdrop is `fixed; inset: 0` with
   * 1rem of padding, so its content box already IS the viewport less the
   * gutter -- and verifyLayoutContract forbids viewport units nested inside
   * the h-dvh shell, which caught the `calc(100dvh - 2rem)` this replaced.
   */
  max-height: 100%;
  align-items: center;
  justify-content: center;
}

.kr-flip-panel {
  display: flex;
  width: 100%;
  min-height: 0;
  max-height: 100%;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1.5rem;
  background: var(--color-base-100, #fff);
  box-shadow: 0 25px 60px oklch(0% 0 0 / 0.45);
  transform-style: preserve-3d;
  /* Turned away and small: the card is face-down and further off. */
  transform: rotateY(-180deg) scale(0.55);
  opacity: 0;
  transition:
    transform 520ms cubic-bezier(0.4, 0.1, 0.2, 1),
    opacity 260ms ease;
}

.kr-flip-panel.is-shown {
  transform: rotateY(0deg) scale(1);
  opacity: 1;
}

/* The panel clips; this scrolls. `min-height: 0` is the load-bearing half --
   a flex child defaults to `min-height: auto`, which refuses to shrink below
   its content, so without it a long edit form pushes the panel past the
   viewport instead of scrolling inside it. */
.kr-flip-panel-scroll {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
}

@media (prefers-reduced-motion: reduce) {
  .kr-flip-panel,
  .kr-flip-backdrop {
    transition: none;
  }

  .kr-flip-panel {
    transform: none;
    opacity: 1;
  }
}
</style>
