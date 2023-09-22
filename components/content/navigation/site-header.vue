<template>
  <header
    class="site-header w-full bg-gradient-to-r from-primary to-primary-light text-default shadow-md px-4 py-1 sm:px-6 lg:px-8"
  >
    <div class="container mx-auto flex items-center justify-between">
      <navigation-row />
      <bot-selector />
      <theme-toggle />
      <avatar-image class="text-xl font-bold" />
      <nav class="space-x-4">
        <slot />
        <!-- AMI Link -->
        <ami-link class="z-190 fixed bottom-4 right-4 md:relative md:bottom-auto md:right-auto" />
      </nav>
    </div>
  </header>
</template>
