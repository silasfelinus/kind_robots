<!-- /components/content/screenfx/toaster-effect.vue -->
<template>
  <div class="toaster-stage">
    <div
      v-for="item in items"
      :key="item.id"
      class="toaster-item"
      :style="itemStyle(item)"
    >
      <Icon :name="item.icon" class="toaster-icon" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface ToasterItem {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  size: number
  icon: string
}

// Mix of icons likely to exist in kind-icons; swap any that don't resolve
const ICONS = [
  'kind-icon:toast',
  'kind-icon:star',
  'kind-icon:butterfly',
  'kind-icon:sparkle',
  'kind-icon:cloud',
  'kind-icon:heart',
  'kind-icon:flame',
  'kind-icon:pizza',
  'kind-icon:diamond',
]

const items = ref<ToasterItem[]>([])
let rafId: number | null = null

const itemStyle = (item: ToasterItem) => ({
  left: `${item.x}px`,
  top: `${item.y}px`,
  width: `${item.size}px`,
  height: `${item.size}px`,
  transform: `rotate(${item.rot}deg)`,
})

onMounted(() => {
  const w = window.innerWidth
  const h = window.innerHeight

  items.value = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    x: Math.random() * w,
    y: Math.random() * h,
    vx: -(1 + Math.random() * 1.8),
    vy: 0.7 + Math.random() * 1.5,
    rot: Math.random() * 360,
    vr: (Math.random() - 0.5) * 3,
    size: 28 + Math.floor(Math.random() * 28),
    icon: ICONS[Math.floor(Math.random() * ICONS.length)]!,
  }))

  const tick = () => {
    const W = window.innerWidth
    const H = window.innerHeight
    for (const t of items.value) {
      t.x += t.vx
      t.y += t.vy
      t.rot += t.vr
      if (t.x < -80) t.x = W + 10
      if (t.y > H + 80) {
        t.y = -30
        t.x = Math.random() * W
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.toaster-stage {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  overflow: hidden;
  z-index: 55;
}

.toaster-item {
  position: absolute;
  will-change: transform;
}

.toaster-icon {
  width: 100%;
  height: 100%;
  color: var(--color-accent, #a78bfa);
  opacity: 0.85;
}
</style>
