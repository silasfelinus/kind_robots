<template>
  <div
    class="flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer"
    :class="cardColor"
    @click="handleClick"
  >
    <div v-if="label" class="text-lg font-semibold mb-2">{{ label }}</div>
    <div class="flex items-center justify-center">
      <img v-if="image" :src="image" class="h-16 w-16 mr-2" />
      <div>{{ description }}</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  image: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  colorId: {
    type: Number,
    default: 1
  },
  label: {
    type: String,
    default: ''
  }
})

const cardColor = computed(() => {
  const baseColors = ['bg-accent', 'bg-secondary', 'bg-accent', 'bg-warning']
  return baseColors[props.colorId - 1] || baseColors[0]
})

const handleClick = () => {
  emit('click')
}
</script>
