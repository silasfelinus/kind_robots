<template>
  <span class="sc-sick" aria-hidden="true" data-testid="slime-summoning-sick">
    <span class="sc-sick-banner">
      <strong>NO ATTACK</strong>
      <small>SUMMONING SICKNESS</small>
    </span>
  </span>
</template>

<style scoped>
.sc-sick {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  border-radius: inherit;
  background: radial-gradient(ellipse, #10223355, transparent 75%);
  pointer-events: none;
}
.sc-sick-banner {
  display: grid;
  gap: 0.15rem;
  width: 94%;
  padding: 0.35rem 0.05rem;
  border-block: 2px solid #ffd18a;
  background: #23180ded;
  color: #ffe3ac;
  text-align: center;
  line-height: 1.05;
  box-shadow: 0 0 0.9rem #ffaf3977;
  transform: rotate(-5deg);
  animation: sc-sick-glow 2.4s ease-in-out infinite alternate;
}
.sc-sick-banner strong {
  font-size: clamp(0.55rem, 1.65vw, 1.25rem);
  font-weight: 950;
}
.sc-sick-banner small {
  font-size: clamp(0.36rem, 0.85vw, 0.65rem);
  font-weight: 800;
  letter-spacing: 0.02em;
}
@keyframes sc-sick-glow {
  to {
    box-shadow: 0 0 1.25rem #ffaf39bb;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sc-sick-banner {
    animation: none;
  }
}
</style>
