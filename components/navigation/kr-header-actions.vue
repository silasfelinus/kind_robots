<!-- /components/navigation/kr-header-actions.vue -->
<!--
  PUT A PAGE'S OWN CONTROLS IN THE HEADER ROW, not in a band above the content.

  Silas, 2026-08-10, with screenshots of /stories, /facets and /characters:
  "Same dead band holds refresh and log out on some pages. Fold them into the
  header row too, so there is no strip between header and content."

  The band was a real element, not a spacing bug: user-manager.vue opened with a
  full page-width `justify-end` row containing nothing but Refresh and Log Out,
  so /dashboard, /themes and /achievements each spent a row of vertical space on
  two buttons and a lot of emptiness. A page renders inside <NuxtPage>, well
  below workspace-header in the tree, so it has no ordinary way to reach the
  header row — which left only two bad options, keep the band or delete the
  controls and lose the capability. This is the third one.

  WHY A TELEPORT RATHER THAN A STORE
  ----------------------------------
  The alternative shape is a store of action descriptors that the header
  renders. That works right up to the first action that needs its own state --
  user-manager's Log Out shows a spinner and a "Logging out…" label from a local
  ref -- and then the descriptors grow icon, label, disabled, busy, busyLabel,
  variant, and the header ends up reimplementing buttons. A teleport moves the
  page's real button, with its real state, and the header stays a layout.

  CLIENT-ONLY, and that is not a preference. icon-gallery.vue documents what
  happened the one time this repo SSR'd a teleport: the hydration anchors it
  emitted into <body> consumed the boot cover's inline <style>, the cover lost
  `position: fixed`, and a 749px black block shoved the whole shell down the
  page -- read there as a "122% chrome budget" on /icons for days. Nothing that
  belongs in this slot needs to exist before hydration; these are account and
  refresh controls, and the header row is already sized without them.

  `defer` is what makes the target resolvable at all. workspace-header and
  <NuxtPage> mount in the SAME render cycle, so a plain teleport looks for
  #kr-header-actions before the header has created it, warns, and renders
  nothing. `defer` (Vue 3.5+) postpones the lookup until after the cycle, which
  is exactly the ordering this needs.

  USAGE — wrap the buttons that were in the band, and delete the band:

    <kr-header-actions>
      <button class="btn btn-ghost btn-sm" @click="refresh">…</button>
    </kr-header-actions>

  Anything slotted here becomes a direct flex item of the header's control strip
  (the target is `display: contents`), so it inherits that row's gap and the
  strip's own compact-button sizing. Keep what you slot to icon-first buttons
  with a `hidden sm:inline` label; a wide control here starves the tab strip,
  which is the shrinkable thing in that row.
-->
<template>
  <ClientOnly>
    <Teleport defer to="#kr-header-actions">
      <slot />
    </Teleport>
  </ClientOnly>
</template>
