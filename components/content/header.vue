<template>
  <header
    class="site-header w-full bg-gradient-to-r from-primary to-primary-light text-white shadow-md px-4 py-1 sm:px-6 lg:px-8"
  >
    <div class="container mx-auto flex items-center justify-between">
      <bot-selector />
      <theme-manager />
      <site-title class="text-xl font-bold" />
      <nav class="space-x-4">
        <slot />
        <!-- AMI Link -->
        <ami-link class="z-190 fixed bottom-4 right-4 md:relative md:bottom-auto md:right-auto" />
      </nav>
      <nav id="sideNav" class="md:flex">
        <butterfly-toggle />
        <effects-viewer />
      </nav>
    </div>
  </header>
</template>
