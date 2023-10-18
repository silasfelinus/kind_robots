<template>
  <div class="flex flex-col h-screen w-screen bg-gradient-to-r from-primary to-primary-dark">
    <!-- Header -->
    <new-dashboard />

    <div class="flex-grow flex items-center justify-center w-full">
      <!-- Main Slot -->
      <slot class="flex-grow bg-accent rounded-2xl p-2 m-2 shadow-lg" />

      <!-- Tooltip beside main slot -->
      <new-tooltip class="md:flex lg:flex-row sm-md:flex-col" />
    </div>
    <highlight-pages />
    <support-nav class="flex-grow w-full flex items-center justify-center" />
    <random-link class="flex items-center justify-center m-1" />
  </div>
</template>
