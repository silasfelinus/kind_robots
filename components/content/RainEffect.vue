<template>
  <div class="weather-container">
    <div
      v-for="(_, index) in numberOfDrops"
      :key="index"
      class="rain-drop"
      :style="{
        left: randomXPosition() + 'px',
        top: randomYPosition() + 'px',
        animationDuration: calculateDuration(randomSize) + 's',
        animationDelay: randomDelay() + 's',
        width: randomSize + 'px',
        height: randomSize * 5 + 'px',
        transform: initialTransform(),
        backgroundColor: randomColor
      }"
    >
      <div class="splash" :style="{ animationDelay: calculateDuration(randomSize) + 's' }"></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  intensity: {
    type: Number,
    default: 2
  },
  numberOfDrops: {
    type: Number,
    default: 100
  },
  windAngle: {
    type: Number,
    default: 0
  }
})

const { randomColor } = useRandomColor()

const randomXPosition = () => Math.floor(Math.random() * window.innerWidth)
const randomYPosition = () => Math.floor(Math.random() * -window.innerHeight)
const calculateDuration = (size) => (window.innerHeight / (50 * props.intensity)) * (size / 2)
const randomDelay = () => Math.random() * 2
const randomSize = () => 1 + Math.random() * 3

const randomWindAngle = () => props.windAngle + Math.floor(Math.random() * 21) - 10

const initialTransform = () => {
  const randomAngle = randomWindAngle()
  document.documentElement.style.setProperty('--wind-angle', `${randomAngle}deg`)
  return `translateY(-100%) rotate(${randomAngle}deg)`
}

onMounted(() => {
  document.documentElement.style.setProperty('--wind-angle', `${props.windAngle}deg`)
})
</script>
