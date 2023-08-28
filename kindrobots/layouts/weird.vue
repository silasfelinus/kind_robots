<template>
  <div class="min-h-screen bg-black relative">
    <!-- Teleport Window Background -->
    <teleport-window class="absolute inset-0 z-0" />

    <!-- Eyeballs -->
    <creepy-eyeball position="top-left" class="absolute top-0 left-0" />
    <creepy-eyeball position="top-right" class="absolute top-0 right-0" />
    <creepy-eyeball position="bottom-left" class="absolute bottom-0 left-0" />
    <creepy-eyeball position="bottom-right" class="absolute bottom-0 right-0" />
    <slot />
  </div>
</template>
