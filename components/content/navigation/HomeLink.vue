<template>
  <div>
    <!-- Home icon wrapped with nuxt-link -->
    <NuxtLink to="/" class="mr-4">
      <icon
        :name="'line-md:home-md-twotone'"
        :title="'Home'"
        class="icon-effect transform transition-transform ease-in-out hover:scale-110 hover:shadow-lg"
      />
    </NuxtLink>

    <!-- Add your other icons here in the same format as before -->
  </div>
</template>

<style scoped>
.icon-effect {
  @apply w-6 h-6 md:w-24 md:h-24 cursor-pointer transition-shadow;
}

/* Glow animation */
@keyframes glow {
  0% {
    box-shadow: 0 0 5px #fff;
  }
  50% {
    box-shadow:
      0 0 20px #fff,
      0 0 30px #ff73fd;
  }
  100% {
    box-shadow: 0 0 5px #fff;
  }
}

.glow-animation {
  animation: glow 1.5s infinite;
}
</style>
