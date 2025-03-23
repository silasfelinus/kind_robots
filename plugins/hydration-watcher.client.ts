// plugins/hydration-watcher.client.ts
export default defineNuxtPlugin(() => {
  const original = console.warn
  console.warn = (...args) => {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      args[0].includes('Hydration')
    ) {
      console.log('🔎 Hydration Mismatch Detected:', ...args)
    }
    original(...args)
  }
})
