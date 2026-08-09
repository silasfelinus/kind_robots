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
  stage, a rotateY on the mover), and the reduced-motion escape hatch is copied
  from it verbatim. They diverge on `transform-style`: flip-card really does
  hold two stacked faces and needs `preserve-3d` to keep them apart, while this
  one has a single scrolling face and must NOT declare it -- see the note on
  `.kr-flip-panel` for why that one line cost three rounds of "cannot scroll".
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
        v-if="visible"
        class="kr-flip-backdrop"
        :class="{ 'is-shown': shown }"
        @click="close"
      >
        <div class="kr-flip-stage" @click.stop>
          <div
            ref="panelRef"
            class="kr-flip-panel"
            :class="{
              'is-shown': shown,
              'is-dismissing': leaving && exitMode === 'dismiss',
            }"
            role="dialog"
            aria-modal="true"
            :aria-label="label"
            tabindex="-1"
          >
            <div class="kr-flip-panel-scroll">
              <slot name="back" :close="close" :commit="commit" />
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
 * TWO flags, not one, because the panel has to outlive `modelValue`.
 *
 *   visible  owns the v-if, so it is what MOUNTS the panel
 *   shown    owns the animated class, so it is what MOVES it
 *
 * `shown` trails `visible` by a frame on the way in: the panel mounts turned
 * away and small, and only then gets the class that animates it. Mount it
 * already-open and the browser has no previous value to transition FROM, so
 * the flip and the growth are both skipped and it simply appears.
 *
 * On the way OUT the order reverses and the gap is a whole transition rather
 * than a frame -- `shown` goes false to play the turn backwards, and only when
 * that has finished does `visible` unmount it. Silas, 2026-08-08: "we need to
 * reverse the animation if the edit is okayed or canceled, or the user clicks
 * outside the card." Driving the v-if straight off `modelValue` made the panel
 * vanish instead, which is the one thing an animation like this cannot do --
 * the point of turning a card over is that you saw it turn.
 */
const visible = ref(false)
const shown = ref(false)

/*
 * TWO WAYS OUT, because they mean different things. Silas, 2026-08-08:
 * "clicking outside the card or canceling should probably just be a quick
 * cancel, reverse might be appropriate if clicking to save the edit, as it's
 * more of a grand choice."
 *
 *   dismiss  backdrop, Escape, Cancel -- nothing happened, so it just goes.
 *            A shrink and a fade, no rotation, out of the way in 160ms.
 *   commit   Save -- something happened, so the card turns back over and you
 *            watch it land. 340ms, the entrance played backwards.
 *
 * Both numbers must stay in step with the stylesheet below: they decide when
 * the panel unmounts, so a timer shorter than its CSS cuts the end off the
 * animation, and one longer leaves a finished panel sitting over the page.
 */
type ExitMode = 'dismiss' | 'commit'

const EXIT_MS: Record<ExitMode, number> = {
  dismiss: 160,
  commit: 340,
}

let exitTimer: ReturnType<typeof setTimeout> | null = null

function clearExitTimer(): void {
  if (exitTimer) clearTimeout(exitTimer)
  exitTimer = null
}

const exitMode = ref<ExitMode>('dismiss')
/*
 * `leaving` exists so the dismiss styling applies ONLY during a real exit.
 * Keying the class off `!shown` alone would also match the moment before the
 * entrance, when the panel is deliberately sitting in its turned-away state --
 * the quick-exit transform would overwrite that and the flip-in would be lost.
 */
const leaving = ref(false)

function open(): void {
  modelValue.value = true
}

/** Nothing happened: Escape, the backdrop, Cancel. Quick. */
function close(): void {
  exitMode.value = 'dismiss'
  modelValue.value = false
}

/** Something happened: the slot saved. Turn the card back over. */
function commit(): void {
  exitMode.value = 'commit'
  modelValue.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

function releasePage(): void {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
}

watch(modelValue, async (isOpen) => {
  if (isOpen) {
    // Reopening mid-exit: cancel the pending unmount rather than letting it
    // fire later and tear down a panel that is on its way back in.
    clearExitTimer()

    leaving.value = false
    visible.value = true
    document.addEventListener('keydown', onKeydown)
    // The page behind must not scroll while a centred panel is up; otherwise
    // dismissing returns you somewhere other than where you opened it.
    document.body.style.overflow = 'hidden'

    /*
     * TWO FRAMES, not nextTick. Silas, 2026-08-08: "no animation effect."
     *
     * nextTick only guarantees Vue has patched the DOM. The browser may not
     * have computed style for the newly-inserted node yet, so setting
     * `is-shown` in the same frame leaves the transition no previous value to
     * animate FROM and it snaps straight to the end state -- the panel simply
     * appears, which is the one thing a card turning over must not do.
     *
     * The first rAF fires before the next paint; the second lands after it, by
     * which point the pre-flip transform is committed and the class change is
     * a real transition. Vue's own <Transition> does the same internally.
     */
    await nextTick()
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

    shown.value = true
    panelRef.value?.focus()
    return
  }

  // Scrolling is handed back at the START of the exit, not the end: the panel
  // is already leaving and holding the page frozen for another third of a
  // second reads as lag.
  releasePage()
  leaving.value = true
  shown.value = false

  clearExitTimer()
  exitTimer = setTimeout(() => {
    // Re-check rather than trusting the timer: a reopen inside the window
    // should win, and clearExitTimer alone cannot cover a race that resolved
    // between the two.
    if (!modelValue.value) visible.value = false
    exitTimer = null
  }, EXIT_MS[exitMode.value])
})

/*
 * Unmounting mid-flip would otherwise leave the listener attached and the body
 * unscrollable -- a navigation away with the panel open would lock the app.
 */
onBeforeUnmount(() => {
  clearExitTimer()
  releasePage()
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
   *
   * HEIGHT, not max-height, and that distinction is the whole bug. The panel
   * below caps itself with `max-height: 100%`, and a percentage resolves only
   * against a parent's DEFINITE height -- a stage sized `max-height: 100%` is
   * still auto-height, so that percentage computed to `none`, the panel grew
   * as tall as its content, and on a phone it ran off the bottom with nothing
   * to scroll. Silas, 2026-08-08: "on mobile and can't scroll ... Editing
   * brings to an overly large screen with no scroll."
   *
   * `min-height: 0` lets this shrink inside the backdrop's flex line instead
   * of being floored at its content height, which would put the bottom back
   * off-screen by another route.
   */
  height: 100%;
  min-height: 0;
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
  /*
   * NO `transform-style: preserve-3d` HERE, and its absence is the scroll fix.
   *
   * Silas reported "cannot scroll" on the edit view three times, on iOS each
   * time. The first two attempts chased the height chain -- a real bug, but
   * not THIS one. `preserve-3d` promotes an element's descendants into a 3D
   * rendering context, and in WebKit that stops `overflow-y: auto` on a child
   * from scrolling at all, which is also why the symptom was iOS-shaped.
   *
   * It was never needed. This element ROTATES ITSELF; there are no
   * 3D-positioned children to preserve depth for, unlike
   * navigation/flip-card.vue which really does hold two stacked faces. The
   * spec already forces `flat` when `overflow` is not `visible`, so the
   * declaration was a no-op that browsers disagreed about.
   */

  /* Turned away and small: the card is face-down and further off. */
  transform: rotateY(-180deg) scale(0.55);
  opacity: 0;
  /*
   * The COMMIT exit, and also the pre-entrance state -- an element transitions
   * out through its own rule, and the `.is-shown` rule below overrides it on
   * the way in. 340ms matches EXIT_MS.commit.
   */
  transition:
    transform 340ms cubic-bezier(0.4, 0.1, 0.2, 1),
    opacity 240ms ease;
}

/*
 * The DISMISS exit. It has to override the turned-away transform above rather
 * than share it: a cancel drops the card where it stands instead of rotating
 * it, so the only movement is a slight shrink. 160ms matches EXIT_MS.dismiss.
 */
.kr-flip-panel.is-dismissing {
  transform: scale(0.96);
  opacity: 0;
  transition:
    transform 160ms ease-in,
    opacity 160ms ease-in;
}

.kr-flip-panel.is-shown {
  transform: rotateY(0deg) scale(1);
  opacity: 1;
  transition:
    transform 520ms cubic-bezier(0.4, 0.1, 0.2, 1),
    opacity 260ms ease;
}

/* The panel clips; this scrolls. `min-height: 0` is the load-bearing half --
   a flex child defaults to `min-height: auto`, which refuses to shrink below
   its content, so without it a long edit form pushes the panel past the
   viewport instead of scrolling inside it. */
.kr-flip-panel-scroll {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  /* Momentum on older iOS, and a scroll that stops at its own edge rather than
     dragging the page behind the backdrop along with it. */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
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
