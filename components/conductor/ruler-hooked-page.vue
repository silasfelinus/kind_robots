<!-- The Ruler Is Hooked is a one-screen console experience.
     The shared application chrome supplies navigation and the tutorial.
     All game screens, including name/portrait selection, live inside this stage. -->
<template>
  <div class="kr-surface relative overflow-hidden bg-base-200">
    <div class="kr-stage">
      <RulerHookedGame />
    </div>
    <ClientOnly>
      <button
        v-if="pwa?.showInstallPrompt"
        type="button"
        class="absolute right-3 top-3 z-40 flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-amber-200/35 bg-slate-950/75 text-amber-50"
        title="Install The Ruler Is Hooked"
        aria-label="Install The Ruler Is Hooked"
        @click="pwa?.install()"
      >
        <Icon name="kind-icon:download" class="kr-icon-4" />
      </button>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const { $pwa: pwa } = useNuxtApp()
</script>
