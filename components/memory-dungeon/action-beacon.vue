<template>
  <span class="md-action-beacon" aria-hidden="true">
    <span class="md-action-beacon-gem">
      <span class="md-action-beacon-face md-action-beacon-front">✦</span>
      <span class="md-action-beacon-face md-action-beacon-back">✦</span>
      <span class="md-action-beacon-face md-action-beacon-left"></span>
      <span class="md-action-beacon-face md-action-beacon-right"></span>
    </span>
  </span>
</template>

<style scoped>
.md-action-beacon {
  position: absolute;
  z-index: 30;
  top: 5%;
  left: 5%;
  display: block;
  width: clamp(0.9rem, 2.5cqw, 1.65rem);
  height: clamp(0.9rem, 2.5cqw, 1.65rem);
  pointer-events: none;
  perspective: 110px;
  filter: drop-shadow(0 2px 3px #07120e);
}

.md-action-beacon-gem {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: md-beacon-turn 3.2s linear infinite;
}

.md-action-beacon-face {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border: 1px solid #fff3ae;
  border-radius: 35%;
  background: linear-gradient(145deg, #fff1aa, #e4a34b 55%, #815b4e);
  color: #403022;
  font-size: clamp(0.65rem, 1.65cqw, 1.1rem);
  line-height: 1;
  backface-visibility: hidden;
}

.md-action-beacon-front {
  transform: translateZ(0.35rem);
}

.md-action-beacon-back {
  transform: rotateY(180deg) translateZ(0.35rem);
}

.md-action-beacon-left {
  background: #a56c55;
  transform: rotateY(-90deg) translateZ(0.35rem);
}

.md-action-beacon-right {
  background: #f6d587;
  transform: rotateY(90deg) translateZ(0.35rem);
}

@keyframes md-beacon-turn {
  from {
    transform: rotateX(-18deg) rotateY(0deg);
  }
  to {
    transform: rotateX(-18deg) rotateY(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .md-action-beacon-gem {
    animation: none;
    transform: rotateX(-18deg) rotateY(-25deg);
  }
}
</style>
