<!-- RotatingIcon.vue -->
<template>
  <div ref="pedestal" class="pedestal">
    <Icon ref="rotatingIcon" :name="Icon" class="rotating-Icon" />
    <div ref="glitter" class="glitter" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'

const props = defineProps<{
  icon?: string
}>()

const Icon = props.icon || 'mdi:default-Icon' // Replace 'mdi:default-Icon' with your actual default Icon

const pedestal = ref(null)
const rotatingIcon = ref(null)
const glitter = ref(null)

onMounted(() => {
  // Basic 3D rotation
  gsap.to(rotatingIcon.value, {
    duration: 10,
    rotationY: 360,
    repeat: -1,
    ease: 'none',
  })

  // Glitter effect
  gsap.to(glitter.value, {
    duration: 0.5,
    opacity: 1,
    yoyo: true,
    repeat: -1,
    ease: 'power1.inOut',
  })
})
</script>

<style scoped>
.pedestal {
  perspective: 1000px;
  position: relative;
}

.rotating-Icon {
  transform-style: preserve-3d;
}

.glitter {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1),
    rgba(255, 255, 255, 0)
  );
  opacity: 0;
}
</style>
