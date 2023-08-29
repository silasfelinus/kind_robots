// src/composables/useRandomColor.ts
import { ref } from 'vue'

export function useRandomColor() {
  const randomColor = ref('')

  function generateRandomColor() {
    const randomHue = Math.floor(Math.random() * 361)
    randomColor.value = `hsl(${randomHue}, 100%, 50%)`
  }

  // Call the function to generate the initial color
  generateRandomColor()

  return {
    randomColor,
    generateRandomColor
  }
}
