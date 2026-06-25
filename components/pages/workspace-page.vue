<!-- /components/content/workspace-page.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden">
    <header v-if="showHeader" class="flex shrink-0 items-center gap-2">
      <Icon name="kind-icon:gearhammer" class="size-5" />
      <h2 class="text-lg font-semibold">Conductor Workspace</h2>
    </header>

    <div
      class="min-h-0 flex-1 overflow-auto rounded-2xl border border-base-300 bg-base-200 p-4"
    >
      <!-- Drop workspace content here (or pass it via the default slot). -->
      <slot>
        <div
          class="flex h-full items-center justify-center text-center text-base-content/60"
        >
          <div>
            <Icon
              name="kind-icon:gearhammer"
              class="mx-auto mb-2 size-8 opacity-60"
            />
            <p>Workspace coming online.</p>
            <p class="text-sm">
              Steering, pitches, and project status will live here.
            </p>
          </div>
        </div>
      </slot>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    showHeader?: boolean
  }>(),
  {
    showHeader: true,
  },
)
</script>
