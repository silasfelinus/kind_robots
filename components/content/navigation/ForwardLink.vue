<template>
  <div>
    <!-- Forward arrow icon: Shown only if canGoForward is true -->
    <div v-if="canGoForward" @click="goForward">
      <icon
        :name="'typcn:arrow-forward-outline'"
        :title="'Forward'"
        class="icon-effect w-6 h-6 md:w-12 md:h-12 cursor-pointer transform transition-transform ease-in-out hover:scale-110"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const canGoForward = ref(false)

const updateCanGoForward = () => {
  canGoForward.value =
    typeof window !== 'undefined' && window.history.length > 1
}

const goForward = () => {
  if (canGoForward.value) {
    router.go(1)
  } else {
    console.warn('No forward history available.')
  }
}

onMounted(() => {
  updateCanGoForward()
  window.addEventListener('popstate', updateCanGoForward)
})

onUnmounted(() => {
  window.removeEventListener('popstate', updateCanGoForward)
})
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
