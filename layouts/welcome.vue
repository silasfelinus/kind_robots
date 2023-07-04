<template>
  <div class="min-h-screen bg-gradient-to-r from-primary to-secondary flex flex-col">
    <div class="flex-grow p-6 md:p-12 overflow-auto">
      <site-header> <slot name="headline"></slot></site-header>
      <slot name="subheadline"></slot>
      <slot name="main-image"></slot>
      <slot name="main-content"></slot>
      <slot name="additional-content"></slot>
    </div>
    <site-footer>
      <slot name="footer"></slot>
    </site-footer>
  </div>
</template>
