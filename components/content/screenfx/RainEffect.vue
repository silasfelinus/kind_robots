<template>
  <div class="container mx-auto p-4 relative h-full flex flex-col">
    <!-- Main container for the rain effect -->
    <div class="flex flex-col md:flex-row flex-grow">
      <div class="flex-grow p-2 rounded-2xl m-2 relative">
        <!-- Rain Effect Area -->
        <div class="rain-container absolute inset-0 overflow-hidden">
          <div
            v-for="drop in rainDrops"
            :key="drop.id"
            class="rain-drop absolute z-50 rounded-full bg-white/80 pointer-events-none"
            :style="rainDropStyle(drop)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface RainDrop {
  id: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  size: number;
  angle: number;
}

const props = defineProps({
  intensity: { type: Number, default: 2 },
  numberOfDrops: { type: Number, default: 100 },
  windAngle: { type: Number, default: 0 },
});

const rainDrops = ref<RainDrop[]>([]);

const updateRainDrops = () => {
  if (typeof window !== "undefined") {
    const { innerWidth, innerHeight } = window;
    rainDrops.value = Array.from({ length: props.numberOfDrops }, (_, id) => {
      const size = 1 + Math.random() * 2; // Size of raindrop
      return {
        id,
        x: Math.random() * innerWidth,
        y: -Math.random() * innerHeight,
        duration: Math.random() * 2 + 4, // More variation
        delay: Math.random() * 3,
        size,
        angle: props.windAngle + (Math.random() - 0.5) * 20, // Small random wind effect
      };
    });
  }
};

const rainDropStyle = (drop: RainDrop) => ({
  left: `${drop.x}px`,
  top: `${drop.y}px`,
  animationDuration: `${drop.duration}s`,
  animationDelay: `${drop.delay}s`,
  width: `${drop.size}px`,
  height: `${drop.size * 6}px`,
  transform: `translateY(-120%) rotate(${drop.angle}deg)`,
});

const handleResize = () => {
  updateRainDrops();
};

onMounted(() => {
  updateRainDrops();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>


<style scoped>
@keyframes fall {
  0% {
    transform: translateY(-120%) rotate(0deg);
  }
  100% {
    transform: translateY(120vh) rotate(0deg);
  }
}

.rain-drop {
  animation: fall linear infinite;
}
</style>

