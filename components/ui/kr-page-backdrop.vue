<!-- /components/ui/kr-page-backdrop.vue -->
<!--
  Full-bleed art behind the page, one variant per breakpoint.

  Silas, 2026-08-05, opening Stage 3 ("make it pretty"):

    "I think a background image for each page, adjusted for mobile, tablet, or
     desktop layout, will help A LOT, and we're starting with that."

  and, on naming:

    "backgroundMobile, backgroundTablet, and background desktop would be less
     ambiguous"

  THIS COMPONENT IS RAILS, NOT LOOKS. A separate agent owns the Stage 3
  aesthetic. Everything here that could be a design decision is a prop with a
  neutral default, or a token in tailwind.css — scrim strength, blur, surface
  translucency. Nothing about the house style is baked in.

  MOUNTED ONCE, in app.vue, rather than per page. Pages declare art in
  frontmatter and pageStore carries it here, so no page component changes and
  no page root is touched — which is what keeps verifyLayoutContract's
  `root-surface` rule out of this entirely. It sits beside <fx-region>, which
  has been rendering a full-bleed layer in this exact slot for a while; this is
  a second tenant of a proven arrangement, not a new idea.

  THE VARIANT IS CHOSEN IN CSS, NEVER IN JS. See the .kr-backdrop rules in
  assets/css/tailwind.css. Reading window.innerWidth here would render one
  variant on the server and swap on the client: hydration mismatch plus a flash
  on every load. Inline styles cannot carry media queries, so this sets only
  the custom properties it has and the stylesheet resolves which one wins. That
  also means exactly one image is fetched, not three.

  MISSING ART IS NOT A FAILURE. Most pages will have one variant long before
  three, and many will have none for a while yet. Undeclared variants leave
  their custom property unset, the CSS falls back to a sibling variant, and a
  page with nothing declared renders no backdrop and no scrim at all — byte
  identical to before this component existed.
-->
<template>
  <!--
    Renders NOTHING when the page declares no art. Not an empty div, not a
    transparent scrim — the whole subtree is absent, so a page without a
    backdrop cannot be visually or structurally affected by this at all.
  -->
  <div
    v-if="hasBackdrop"
    class="kr-backdrop pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat"
    :style="backdropVars"
    aria-hidden="true"
  >
    <!--
      SCRIM. Art is chosen for mood, not for contrast against body text, so
      something has to guarantee legibility. Strength is a prop because the
      right amount depends on the artwork, and Stage 3 owns that call.

      `bg-linear-to-b`, not `bg-gradient-to-b` — Tailwind v4 renamed it, and the
      old spelling silently produces no gradient rather than erroring.
    -->
    <div v-if="scrim !== 'none'" class="absolute inset-0" :class="scrimClass" />

    <!-- Decorative extras from the mockups: butterflies, sparkles, compass
         roses. Above the scrim so they read as part of the scene rather than
         being washed out by it. -->
    <slot name="overlay" />

    <!--
      Character art (the transparent Serendipity PNG in the Taskmaster mockup).
      Its own slot rather than part of #overlay because it is anchored, not
      scattered — the mockup pins it bottom-right on desktop, and a caller will
      want to move or hide it per breakpoint without touching the sparkles.
    -->
    <slot name="character" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { pageImageCssUrl } from '@/utils/pageImagePath'

const props = withDefaults(
  defineProps<{
    /** Bare frontmatter paths; resolved through pageImagePath. */
    mobile?: string
    tablet?: string
    desktop?: string
    /** Legibility wash over the art. Stage 3 picks per page. */
    scrim?: 'none' | 'soft' | 'medium' | 'strong'
  }>(),
  {
    mobile: '',
    tablet: '',
    desktop: '',
    scrim: 'soft',
  },
)

const hasBackdrop = computed(
  () => Boolean(props.mobile || props.tablet || props.desktop),
)

/**
 * Only the variants that exist become custom properties.
 *
 * An UNSET property is what makes the CSS fallback chain work — `var(--a, var(--b))`
 * reaches for `--b` when `--a` is unset, but an empty string is a *set* value
 * and would resolve to nothing at all, painting no art while another variant
 * sat available. So absent keys must be genuinely absent, not empty.
 */
const backdropVars = computed(() => {
  const vars: Record<string, string> = {}

  const mobile = pageImageCssUrl(props.mobile)
  const tablet = pageImageCssUrl(props.tablet)
  const desktop = pageImageCssUrl(props.desktop)

  if (mobile) vars['--kr-bg-mobile'] = mobile
  if (tablet) vars['--kr-bg-tablet'] = tablet
  if (desktop) vars['--kr-bg-desktop'] = desktop

  return vars
})

const SCRIM_CLASS: Record<string, string> = {
  soft: 'bg-linear-to-b from-base-300/10 via-base-300/15 to-base-300/45',
  medium: 'bg-linear-to-b from-base-300/25 via-base-300/35 to-base-300/60',
  strong: 'bg-linear-to-b from-base-300/45 via-base-300/55 to-base-300/75',
}

const scrimClass = computed(() => SCRIM_CLASS[props.scrim] ?? SCRIM_CLASS.soft)

defineExpose({ hasBackdrop })
</script>
