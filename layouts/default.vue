<!-- /layouts/default.vue -->
<template>
  <div class="flex min-h-dvh w-full flex-col overflow-hidden bg-secondary">
    <div class="p-8 space-y-4">
      <div class="bg-red-500 text-white p-4 rounded-2xl">Tailwind red</div>
      <div class="bg-primary text-primary-content p-4 rounded-2xl">
        Daisy primary
      </div>
      <button class="btn btn-primary">Daisy button</button>
    </div>
    <main
      class="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain"
    >
      <slot />
    </main>
  </div>
</template>
