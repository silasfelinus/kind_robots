<script setup lang="ts">
import { reactive, onBeforeUnmount } from 'vue'

const props = defineProps({
  throttle: {
    type: Number,
    default: 200,
  },
  duration: {
    type: Number,
    default: 2000,
  },
  height: {
    type: Number,
    default: 3,
  },
})

// Options & Data
const data = reactive({
  percent: 0,
  show: true,
  canSucceed: true,
  left: '0px', // Include if needed
})

// Local variables
let _timer: ReturnType<typeof setInterval> | null = null
let _throttle: ReturnType<typeof setTimeout> | null = null
let _cut: number = 0 // Initialize with a default value

// Functions
const clear = () => {
  if (_timer !== null) {
    clearInterval(_timer)
  }
  if (_throttle !== null) {
    clearTimeout(_throttle)
  }
  _timer = null
  _throttle = null
}

const start = () => {
  clear()
  data.percent = 0
  data.canSucceed = true

  if (props.throttle) {
    _throttle = setTimeout(startTimer, props.throttle)
  } else {
    startTimer()
  }
}

const increase = (num: number) => {
  data.percent = Math.min(100, Math.floor(data.percent + num))
}

const finish = () => {
  data.percent = 100
  hide()
}

const hide = () => {
  clear()
  setTimeout(() => {
    data.show = false
    setTimeout(() => {
      data.percent = 0
    }, 400)
  }, 500)
}

const startTimer = () => {
  data.show = true
  // Ensure props.duration is always a number and set a default value if necessary
  const duration = Math.floor(props.duration)
  _cut = 10000 / duration
  _timer = setInterval(() => {
    increase(_cut)
  }, 100)
}

// Hooks
const nuxtApp = useNuxtApp()

nuxtApp.hook('page:start', start)
nuxtApp.hook('page:finish', finish)

onBeforeUnmount(() => clear())
</script>

<template>
  <div
    class="nuxt-progress"
    :class="{
      'nuxt-progress-failed': !data.canSucceed,
    }"
    :style="{
      width: data.percent + '%',
      left: data.left,
      height: props.height + 'px',
      opacity: data.show ? 1 : 0,
      backgroundSize:
        (data.percent > 0 ? (100 / data.percent) * 100 : 0) + '% auto',
    }"
  />
</template>

<style>
.nuxt-progress {
  position: fixed;
  top: 0px;
  left: 0px;
  right: 0px;
  width: 0%;
  opacity: 1;
  transition:
    width 0.1s,
    height 0.4s,
    opacity 0.4s;
  background: repeating-linear-gradient(
    to right,
    #00dc82 0%,
    #34cdfe 50%,
    #0047e1 100%
  );
  z-index: 999999;
}
</style>
