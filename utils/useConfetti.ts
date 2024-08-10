// @/utils/useConfetti.ts
import confetti from 'canvas-confetti'

export function useConfetti() {
  const triggerConfetti = ({ particleCount = 100, spread = 70, origin = { x: 0.5, y: 0.5 } } = {}) => {
    confetti({
      particleCount,
      spread,
      origin,
    })
  }

  return {
    triggerConfetti,
  }
}
