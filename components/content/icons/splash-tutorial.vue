<div class="relative min-h-fit w-full">
  <div class="relative z-20 w-full max-w-4xl flex flex-col mx-auto px-4 py-4 space-y-6">
    <!-- ... the rest of your content ... -->
  </div>

  <!-- Parallax Background (move it inside this wrapper) -->
  <div
    class="absolute inset-0 -z-10 will-change-transform transition-transform duration-300"
    :style="`transform: translateY(${parallaxOffset}px);`"
  >
    <img
      v-if="image"
      :src="`/images/${image}`"
      class="w-full h-full object-cover"
      alt="Ambient Background"
    />
    <div
      class="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm pointer-events-none"
    />
  </div>
</div>
