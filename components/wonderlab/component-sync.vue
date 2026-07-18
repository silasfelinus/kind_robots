<!-- /components/wonderlab/component-sync.vue -->
<template>
  <section
    class="rounded-2xl border border-warning/40 bg-warning/10 p-4 shadow-sm"
  >
    <div class="flex items-start gap-3">
      <Icon
        name="kind-icon:alert"
        class="mt-0.5 size-5 shrink-0 text-warning"
      />

      <div class="min-w-0 flex-1">
        <h2 class="text-base font-black text-base-content">
          Component reconciliation paused
        </h2>

        <p class="mt-2 text-sm leading-relaxed text-base-content/75">
          The previous browser-side sync could delete museum records that were
          absent from a stale or incomplete component manifest. It has been
          disabled while WonderLab moves to an explicit server-side dry-run and
          apply workflow.
        </p>

        <p class="mt-2 text-xs leading-relaxed text-base-content/60">
          Browsing, previews, notes, and reactions remain available. Existing
          component records will not be modified from this control.
        </p>
      </div>
    </div>
  </section>
</template>
