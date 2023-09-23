<template>
  <div>
    <!-- Forward arrow icon -->
    <div class="mr-4" @click="goForward">
      <icon
        :name="'typcn:arrow-forward-outline'"
        :title="'Forward'"
        class="icon-effect transform transition-transform ease-in-out hover:scale-110 hover:shadow-lg"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goForward = () => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.go(1)
  } else {
    // Handle the case when there's no forward history
    console.warn('No forward history available.')
  }
}
</script>

<style scoped>
.icon-effect {
  @apply w-6 h-6 md:w-16 md:h-16 cursor-pointer transition-shadow;
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
