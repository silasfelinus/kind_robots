<!-- /components/content/icons/icon-shell.vue -->

<template>
  <div
    class="group relative flex items-center justify-center snap-start h-[6rem] w-[4rem] select-none"
  >
    <div class="relative w-full h-full flex items-center justify-center">
      <div
        class="w-[3rem] h-[3rem] flex items-center justify-center overflow-hidden"
      >
        <slot name="icon" />
      </div>

      <div
        class="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.25rem] w-full flex items-center justify-center pointer-events-none z-40"
      >
        <slot name="label" />
      </div>
    </div>
  </div>
</template>
