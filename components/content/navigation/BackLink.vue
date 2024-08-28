<template>
  <div>
    <!-- Back arrow icon -->
    <div class="mr-4" @click="goBack">
      <icon
        :name="'typcn:arrow-back-outline'"
        :title="'Back'"
        class="icon-effect w-6 h-6 md:w-12 md:h-12 cursor-pointer transform transition-transform ease-in-out hover:scale-110"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.icon-effect {
  @apply cursor-pointer transition-shadow;
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
