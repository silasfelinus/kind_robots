<template>
  <div
    class="taskmaster-backdrop pointer-events-none absolute inset-0 overflow-hidden"
    :class="compact ? 'taskmaster-backdrop--compact' : ''"
    aria-hidden="true"
  >
    <!--
      NO <img> HERE ANY MORE. This used to render the page's `image` thumbnail
      stretched to fill, as a stand-in for real backdrop art. Art now comes from
      kr-page-backdrop (mounted once in app.vue, driven by the
      backgroundMobile/Tablet/Desktop frontmatter keys), which gives Taskmaster
      a proper per-breakpoint image instead of an upscaled
      thumbnail — and gives every other page the same mechanism.

      What survives here is what was always the good part: the hand-built scene.
      Because kr-page-backdrop sits at z-0 in <main> and the page renders at
      z-10, this whole layer already paints ON TOP of that art with no slot or
      teleport needed — the islands, portal and path become foreground over the
      artwork, which is what the mockup shows.
    -->
    <div class="taskmaster-backdrop__sky absolute inset-0" />
    <div class="taskmaster-backdrop__portal absolute" />
    <div class="taskmaster-backdrop__island taskmaster-backdrop__island--one absolute" />
    <div class="taskmaster-backdrop__island taskmaster-backdrop__island--two absolute" />
    <div class="taskmaster-backdrop__cloud taskmaster-backdrop__cloud--one absolute" />
    <div class="taskmaster-backdrop__cloud taskmaster-backdrop__cloud--two absolute" />
    <div class="taskmaster-backdrop__path absolute" aria-hidden="true">
      <span v-for="step in 9" :key="step" />
    </div>
    <div class="taskmaster-backdrop__wash absolute inset-0" />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)
</script>

<style scoped>
.taskmaster-backdrop {
  background:
    radial-gradient(
      circle at 82% 16%,
      color-mix(in oklab, var(--color-secondary) 36%, transparent),
      transparent 27%
    ),
    radial-gradient(
      circle at 16% 8%,
      color-mix(in oklab, var(--color-info) 26%, transparent),
      transparent 34%
    ),
    linear-gradient(
      145deg,
      color-mix(in oklab, var(--color-base-100) 88%, var(--color-info)),
      color-mix(in oklab, var(--color-base-100) 72%, var(--color-secondary)) 54%,
      color-mix(in oklab, var(--color-base-100) 78%, var(--color-accent))
    );
}


.taskmaster-backdrop__sky {
  background:
    radial-gradient(
      circle at 72% 23%,
      transparent 0 11rem,
      color-mix(in oklab, var(--color-secondary) 16%, transparent) 16rem,
      transparent 25rem
    ),
    linear-gradient(
      90deg,
      color-mix(in oklab, var(--color-base-100) 96%, transparent) 0%,
      color-mix(in oklab, var(--color-base-100) 77%, transparent) 38%,
      color-mix(in oklab, var(--color-base-100) 24%, transparent) 72%,
      color-mix(in oklab, var(--color-base-100) 8%, transparent) 100%
    );
}

.taskmaster-backdrop__wash {
  background:
    linear-gradient(
      180deg,
      color-mix(in oklab, var(--color-base-100) 12%, transparent) 0%,
      transparent 34%,
      color-mix(in oklab, var(--color-base-100) 60%, transparent) 76%,
      var(--color-base-100) 100%
    ),
    radial-gradient(
      ellipse at center,
      transparent 30%,
      color-mix(in oklab, var(--color-base-100) 28%, transparent) 100%
    );
}

/*
 * COMPOSING OVER REAL BACKDROP ART.
 *
 * Three layers above are opaque where it matters — the root's 145deg base, the
 * sky's 96% left edge, and the wash's fully-opaque bottom stop. That is correct
 * when this scene IS the background, and wrong the moment kr-page-backdrop is
 * painting a photograph underneath: the art would be completely hidden and the
 * whole per-breakpoint mechanism would silently do nothing on this page.
 *
 * `[data-kr-backdrop]` is set on <main> by app.vue only when the page actually
 * declares backdrop art, so these overrides engage exactly when there is
 * something behind to protect — the same signal the surface tokens use, for the
 * same reason. With no art declared, none of this applies and the scene renders
 * precisely as it did before.
 *
 * Only the GROUNDS are thinned. The portal, islands, clouds and path keep their
 * own opacities untouched: they are the foreground, and over real artwork they
 * are the point.
 */
[data-kr-backdrop] .taskmaster-backdrop {
  background:
    radial-gradient(
      circle at 82% 16%,
      color-mix(in oklab, var(--color-secondary) 26%, transparent),
      transparent 27%
    ),
    radial-gradient(
      circle at 16% 8%,
      color-mix(in oklab, var(--color-info) 18%, transparent),
      transparent 34%
    );
}

[data-kr-backdrop] .taskmaster-backdrop__sky {
  background:
    radial-gradient(
      circle at 72% 23%,
      transparent 0 11rem,
      color-mix(in oklab, var(--color-secondary) 16%, transparent) 16rem,
      transparent 25rem
    ),
    linear-gradient(
      90deg,
      color-mix(in oklab, var(--color-base-100) 62%, transparent) 0%,
      color-mix(in oklab, var(--color-base-100) 44%, transparent) 38%,
      color-mix(in oklab, var(--color-base-100) 14%, transparent) 72%,
      transparent 100%
    );
}

[data-kr-backdrop] .taskmaster-backdrop__wash {
  background:
    linear-gradient(
      180deg,
      color-mix(in oklab, var(--color-base-100) 8%, transparent) 0%,
      transparent 34%,
      color-mix(in oklab, var(--color-base-100) 34%, transparent) 76%,
      color-mix(in oklab, var(--color-base-100) 62%, transparent) 100%
    ),
    radial-gradient(
      ellipse at center,
      transparent 30%,
      color-mix(in oklab, var(--color-base-100) 18%, transparent) 100%
    );
}

.taskmaster-backdrop__portal {
  right: clamp(1.25rem, 5vw, 5rem);
  top: clamp(2rem, 6vw, 5.5rem);
  width: clamp(5.5rem, 12vw, 10.5rem);
  aspect-ratio: 0.82;
  border: clamp(0.35rem, 0.6vw, 0.7rem) solid
    color-mix(in oklab, var(--color-warning) 76%, var(--color-secondary));
  border-radius: 48% 48% 42% 42% / 42% 42% 58% 58%;
  background:
    radial-gradient(
      ellipse,
      color-mix(in oklab, var(--color-base-100) 72%, transparent) 0 8%,
      color-mix(in oklab, var(--color-secondary) 76%, transparent) 9% 25%,
      color-mix(in oklab, var(--color-primary) 74%, transparent) 26% 44%,
      color-mix(in oklab, var(--color-info) 58%, transparent) 45% 58%,
      transparent 60%
    );
  box-shadow:
    0 0 0 0.35rem color-mix(in oklab, var(--color-secondary) 22%, transparent),
    0 0 3.5rem color-mix(in oklab, var(--color-secondary) 52%, transparent);
  opacity: 0.54;
  transform: rotate(2deg);
}

.taskmaster-backdrop__portal::after {
  content: '';
  position: absolute;
  inset: 12% 15%;
  border: 2px dashed color-mix(in oklab, var(--color-base-100) 76%, transparent);
  border-radius: inherit;
  animation: taskmaster-portal-spin 22s linear infinite;
}

.taskmaster-backdrop__island {
  width: clamp(8rem, 18vw, 17rem);
  height: clamp(2.5rem, 5vw, 4.5rem);
  border-radius: 50%;
  background:
    radial-gradient(
      ellipse at 50% 10%,
      color-mix(in oklab, var(--color-success) 48%, var(--color-base-100)),
      color-mix(in oklab, var(--color-success) 30%, var(--color-base-300)) 48%,
      transparent 51%
    );
  filter: drop-shadow(
    0 1.25rem 1.2rem color-mix(in oklab, var(--color-primary) 20%, transparent)
  );
  opacity: 0.28;
}

.taskmaster-backdrop__island--one {
  right: 22%;
  top: 30%;
  transform: rotate(-5deg);
}

.taskmaster-backdrop__island--two {
  right: 4%;
  top: 48%;
  transform: scale(0.72) rotate(8deg);
}

.taskmaster-backdrop__cloud {
  width: clamp(10rem, 24vw, 24rem);
  height: clamp(3rem, 8vw, 7rem);
  border-radius: 50%;
  background: color-mix(in oklab, var(--color-base-100) 76%, transparent);
  filter: blur(1rem);
  opacity: 0.4;
}

.taskmaster-backdrop__cloud--one {
  left: -5%;
  top: 5%;
}

.taskmaster-backdrop__cloud--two {
  right: 12%;
  top: 8%;
  transform: scale(0.72);
}

.taskmaster-backdrop__path {
  right: clamp(1rem, 7vw, 7rem);
  top: clamp(12rem, 30vw, 25rem);
  display: flex;
  width: clamp(7rem, 16vw, 15rem);
  transform: rotate(72deg);
  align-items: center;
  justify-content: space-between;
  opacity: 0.62;
}

.taskmaster-backdrop__path span {
  width: clamp(0.45rem, 0.75vw, 0.8rem);
  aspect-ratio: 1;
  border: 2px solid color-mix(in oklab, var(--color-warning) 80%, var(--color-base-100));
  border-radius: 9999px;
  background: color-mix(in oklab, var(--color-base-100) 72%, transparent);
  box-shadow: 0 0 0.85rem color-mix(in oklab, var(--color-warning) 60%, transparent);
}


.taskmaster-backdrop--compact .taskmaster-backdrop__portal {
  opacity: 0.34;
  transform: scale(0.78) rotate(2deg);
  transform-origin: top right;
}

.taskmaster-backdrop--compact .taskmaster-backdrop__path {
  opacity: 0.32;
}

@keyframes taskmaster-portal-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 767px) {

  .taskmaster-backdrop__sky {
    background:
      linear-gradient(
        180deg,
        color-mix(in oklab, var(--color-base-100) 12%, transparent) 0%,
        color-mix(in oklab, var(--color-base-100) 26%, transparent) 34%,
        color-mix(in oklab, var(--color-base-100) 82%, transparent) 66%,
        var(--color-base-100) 100%
      );
  }

  /*
   * The phone sky above ends on a fully-opaque stop, which would bury the
   * bottom half of the mobile artwork — the variant most likely to exist first,
   * since a phone is where Silas actually looks at this.
   */
  [data-kr-backdrop] .taskmaster-backdrop__sky {
    background: linear-gradient(
      180deg,
      color-mix(in oklab, var(--color-base-100) 8%, transparent) 0%,
      color-mix(in oklab, var(--color-base-100) 18%, transparent) 34%,
      color-mix(in oklab, var(--color-base-100) 44%, transparent) 66%,
      color-mix(in oklab, var(--color-base-100) 66%, transparent) 100%
    );
  }

  .taskmaster-backdrop__portal {
    right: 0.9rem;
    top: 2.25rem;
    opacity: 0.42;
  }

  .taskmaster-backdrop__island--one {
    right: 28%;
    top: 20%;
  }

  .taskmaster-backdrop__island--two,
  .taskmaster-backdrop__cloud--two {
    display: none;
  }

  .taskmaster-backdrop__path {
    right: -1.5rem;
    top: 14rem;
    transform: rotate(88deg) scale(0.8);
  }
}

@media (prefers-reduced-motion: reduce) {
  .taskmaster-backdrop__portal::after {
    animation: none;
  }
}
</style>
