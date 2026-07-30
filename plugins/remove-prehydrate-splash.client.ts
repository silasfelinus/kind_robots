export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const splash = document.getElementById('kr-prehydrate-splash')
        if (!splash) return

        splash.classList.add('kr-prehydrate-splash--fade')

        window.setTimeout(() => {
          splash.remove()
        }, 220)
      })
    })
  })
})
