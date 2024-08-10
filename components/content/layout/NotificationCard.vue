<template>
  <transition name="slide-fade">
    <div
      v-if="isVisible"
      ref="notificationCard"
      class="notification-card fixed bottom-0 left-1/2 transform -translate-x-1/2 mb-4 px-6 py-4 rounded-lg shadow-xl bg-white text-center"
      :class="{ 'bg-red-500 text-default': isError, 'bg-green-500 text-default': !isError }"
    >
      <p class="text-lg">
        {{ message }}
      </p>
      <button
        class="absolute top-1 right-1 text-2xl"
        @click="hideCard"
      >
        ✕
      </button>
    </div>
  </transition>
</template>

<script setup>
import { ref, watchEffect, onMounted } from 'vue'
import interact from '@interactjs/interact'

const props = defineProps({
  message: {
    type: String,
    default: '',
  },
  isError: {
    type: Boolean,
    default: false,
  },
  displayTime: {
    type: Number,
    default: 5000,
  },
})

const isVisible = ref(!!props.message)
const notificationCard = ref(null)

watchEffect(() => {
  isVisible.value = !!props.message
  if (isVisible.value) {
    setTimeout(() => {
      isVisible.value = false
    }, props.displayTime)
  }
})

const hideCard = () => {
  isVisible.value = false
}

onMounted(() => {
  interact(notificationCard.value).draggable({
    inertia: true,
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: 'parent',
        endOnly: true,
      }),
    ],
    autoScroll: true,
    onmove: function (event) {
      const target = event.target
      const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
      const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

      target.style.webkitTransform = target.style.transform = `translate(${x}px, ${y}px)`

      target.setAttribute('data-x', x)
      target.setAttribute('data-y', y)
    },
  })
})
</script>

<style scoped>
.notification-card {
  border: 2px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
.slide-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
