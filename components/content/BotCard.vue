<template>
  <div class="bot-prompt"><bot-display /><slot /></div>
</template>
<style>
.slider {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  width: 100%;
}

.slide {
  flex: 0 0 auto;
  width: 100vw;
  height: 100vh;
  scroll-snap-align: start;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
