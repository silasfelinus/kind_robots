<!-- /layouts/default.vue -->
<template>
  <div class="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-base-200">
    <div class="min-h-0 flex-1 overflow-hidden p-2 sm:p-3">
      <main
        class="relative flex h-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <dashboard-shell>
          <slot />
        </dashboard-shell>
      </main>
    </div>
  </div>
</template>
