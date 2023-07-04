<template>
  <div>
    {{ randomItem }}
  </div>
</template>

<script setup>
const props = defineProps({
  file: {
    type: String,
    default: 'wildcards/dreams'
  }
})

const randomItem = ref('')

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)]
</script>
