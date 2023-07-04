<template>
  <header
    class="site-header w-full bg-gradient-to-r from-primary to-primary-light text-white shadow-md px-4 py-1 sm:px-6 lg:px-8"
  >
    <div class="container mx-auto flex items-center justify-between">
      <site-title class="text-xl font-bold" />
      <dream-status class="hidden md:block" />
      <nav class="space-x-4">
        <slot />
        <!-- AMI Link -->
        <AmiLink2 class="z-190 fixed bottom-4 right-4 md:relative md:bottom-auto md:right-auto" />
      </nav>
      <div class="flex items-center justify-end">
        <ThemeChange />
      </div>
    </div>
  </header>
</template>
