<!-- /components/content/builder/dream-builder.vue -->
<template>
  <section
    class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4"
  >
    <header class="flex items-center gap-3">
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"
      >
        <Icon name="kind-icon:moon" class="h-5 w-5" />
      </span>
      <div>
        <h2 class="text-2xl font-black text-base-content">Dream Builder</h2>
        <p class="text-sm text-base-content/60">
          Expand a pitch into a reusable setting with vibe, world logic, art,
          collections, characters, and scenario hooks.
        </p>
      </div>
    </header>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div class="rounded-2xl border border-base-300 bg-base-200/50 p-1">
        <dream-gallery />
      </div>
      <div class="rounded-2xl border border-base-300 bg-base-200/50 p-1">
        <dream-interact />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts"></script>
