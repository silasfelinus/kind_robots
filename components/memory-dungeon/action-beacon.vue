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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: block;
  width: clamp(1.5rem, 6cqw, 3rem);
  height: clamp(1.5rem, 6cqw, 3rem);
  pointer-events: none;
  perspective: 140px;
  filter: drop-shadow(0 3px 5px #07120e);
}

.md-action-beacon::before {
  content: '';
  position: absolute;
  inset: -17%;
  border: 2px solid #ffe6a97a;
  border-radius: 50%;
  background: radial-gradient(circle, #ffe6a953, transparent 65%);
  box-shadow: 0 0 12px #f5c77e55;
  animation: md-beacon-aura 2.6s ease-in-out infinite alternate;
}

.md-action-beacon-gem {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: md-beacon-turn 2.8s linear infinite;
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
  font-size: clamp(1rem, 3.4cqw, 1.75rem);
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

@keyframes md-beacon-aura {
  from { opacity: 0.52; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1.04); }
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
  .md-action-beacon::before { animation: none; }
  .md-action-beacon-gem {
    animation: none;
    transform: rotateX(-18deg) rotateY(-25deg);
  }
}
</style>
