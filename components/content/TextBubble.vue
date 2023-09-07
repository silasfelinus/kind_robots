<template>
  <div :style="bubbleStyle">Hello, I'm a butterfly! 🦋</div>
</template>

<script setup lang="ts">
import { ref, toRefs } from 'vue'

const props = withDefaults(
  defineProps<{
    x: number
    y: number
  }>(),
  {}
)

const { x, y } = toRefs(props)

const bubbleStyle = ref<Record<string, string>>({
  position: 'absolute',
  left: `${x.value}px`,
  top: `${y.value}px`
})
</script>
