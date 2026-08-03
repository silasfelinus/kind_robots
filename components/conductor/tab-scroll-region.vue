<!-- Scroll owner for conductor-manager.vue's dynamically-swapped tab
     children that use kr-unbound (interface-vision t-057/t-070): those
     children rely on a parent to own scroll in every context they mount in.
     Kept out of components/pages/ so this file isn't itself scanned as an
     independently MDC-mounted page -- conductor-manager.vue is already the
     MDC-mounted owner (content/conductor.md), and this is purely an internal
     implementation detail of its own template. -->
<template>
  <div class="kr-scroll">
    <slot />
  </div>
</template>
