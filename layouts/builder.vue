<template>
  <div class="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-base-200">
    <dashboard-shell class="shrink-0" />

    <main class="min-h-0 flex-1 overflow-hidden p-2 sm:p-3">
      <div class="h-full min-h-0 overflow-hidden rounded-2xl">
        <slot />
      </div>
    </main>
  </div>
</template>
