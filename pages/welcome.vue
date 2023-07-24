<template>
  <div class="min-h-screen bg-gradient-to-r from-primary to-secondary flex flex-col">
    <div class="flex-grow p-6 md:p-12 overflow-auto">
      <site-header>
        <slot name="headline"> </slot><site-title class="text-lg sm:text-xl font-bold"
      /></site-header>
    </div>
    <site-footer>
      <slot name="footer"></slot>
    </site-footer>
  </div>
</template>
