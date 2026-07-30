const startupParticles = [
  ['8%', '18%', '1.05rem', '8.2s', '-5.4s', '8vw', '-14vh'],
  ['16%', '72%', '0.55rem', '10.4s', '-2.1s', '-6vw', '-18vh'],
  ['24%', '42%', '0.8rem', '7.6s', '-4.8s', '10vw', '-10vh'],
  ['31%', '84%', '0.45rem', '9.8s', '-7.2s', '-8vw', '-20vh'],
  ['39%', '12%', '0.7rem', '11.2s', '-1.5s', '7vw', '-13vh'],
  ['47%', '64%', '1.15rem', '8.8s', '-6.1s', '-10vw', '-16vh'],
  ['54%', '30%', '0.5rem', '9.3s', '-3.7s', '9vw', '-19vh'],
  ['61%', '78%', '0.85rem', '10.8s', '-8.4s', '-7vw', '-12vh'],
  ['68%', '16%', '0.48rem', '7.9s', '-2.8s', '11vw', '-17vh'],
  ['74%', '54%', '1rem', '9.6s', '-5.9s', '-9vw', '-15vh'],
  ['82%', '86%', '0.62rem', '11.6s', '-9.1s', '6vw', '-21vh'],
  ['90%', '34%', '0.76rem', '8.5s', '-4.2s', '-11vw', '-11vh'],
  ['12%', '92%', '0.42rem', '12.1s', '-10.2s', '8vw', '-22vh'],
  ['28%', '24%', '0.58rem', '9.1s', '-6.7s', '-6vw', '-14vh'],
  ['44%', '90%', '0.72rem', '10.1s', '-3.3s', '10vw', '-18vh'],
  ['58%', '48%', '0.4rem', '8.1s', '-7.5s', '-8vw', '-12vh'],
  ['72%', '68%', '0.66rem', '11s', '-1.9s', '7vw', '-20vh'],
  ['86%', '8%', '0.52rem', '9.4s', '-5.1s', '-10vw', '-16vh'],
]

function renderParticles(): string {
  return startupParticles
    .map(
      ([x, y, size, duration, delay, driftX, driftY]) =>
        `<i style="--kr-x:${x};--kr-y:${y};--kr-size:${size};--kr-duration:${duration};--kr-delay:${delay};--kr-drift-x:${driftX};--kr-drift-y:${driftY}"></i>`,
    )
    .join('')
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    html.bodyPrepend.push(`
      <div class="kr-prehydrate-loader">
        <div class="kr-prehydrate-effect" aria-hidden="true">
          <div class="kr-prehydrate-effect__glow"></div>
          <div class="kr-prehydrate-effect__particles">${renderParticles()}</div>
        </div>

        <div class="kr-prehydrate-content">
          <div class="kr-prehydrate-heading">Building Kind Robots...</div>

          <div class="kr-prehydrate-visual">
            <img
              src="/images/startup-animations/launch-04.webp"
              alt="Kind Robots"
              class="kr-prehydrate-media"
              width="720"
              height="720"
              fetchpriority="high"
              decoding="async"
            />
          </div>

          <div class="kr-prehydrate-status">
            <span class="kr-prehydrate-spinner" aria-hidden="true">
              <i></i><i></i><i></i><i></i>
              <i></i><i></i><i></i><i></i>
            </span>

            <div class="kr-prehydrate-message" aria-live="polite">
              <span>Wiring robots for suspicious levels of charm...</span>
              <span>Downloading charm...</span>
              <span>Releasing digital butterflies...</span>
            </div>
          </div>
        </div>

        <div class="kr-prehydrate-controls">
          <span class="kr-prehydrate-controls__name">Startup animation</span>
          <button
            type="button"
            class="kr-prehydrate-controls__button"
            data-kr-startup-action="explore"
          >
            <span aria-hidden="true">✦</span>
            <span>Pause &amp; explore</span>
          </button>
        </div>
      </div>

      <script>
        (() => {
          const root = document.documentElement
          if (!root.classList.contains('kr-full-startup')) return

          root.classList.add('kr-startup-handoff')
          const queue = window.__KR_STARTUP_ACTION_QUEUE__ || []
          window.__KR_STARTUP_ACTION_QUEUE__ = queue

          document.addEventListener('click', (event) => {
            const source = event.target
            if (!(source instanceof Element)) return
            const control = source.closest('[data-kr-startup-action]')
            if (!(control instanceof HTMLElement)) return

            const action = control.dataset.krStartupAction
            if (!action) return

            event.preventDefault()

            if (root.classList.contains('kr-startup-controls-ready')) {
              window.dispatchEvent(
                new CustomEvent('kr-startup-action', { detail: action }),
              )
              return
            }

            queue.push(action)
          })

          window.setTimeout(() => {
            root.classList.remove('kr-startup-handoff')
          }, 8000)
        })()
      </script>
    `)
  })
})
