<!-- /layouts/builder.vue -->
<template>
  <div class="flex h-dvh max-h-dvh min-h-0 w-full overflow-hidden bg-base-200">
    <main class="flex min-h-0 w-full overflow-hidden p-2 sm:p-3 lg:p-4">
      <div class="min-h-0 w-full overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl">
        <slot />
      </div>
    </main>
  </div>
</template>