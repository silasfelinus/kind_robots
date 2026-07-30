export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    html.bodyPrepend.unshift(`
      <style>
        .kr-startup-black-base {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 47;
          background: #000;
          opacity: 1;
          pointer-events: none;
          transition: opacity 650ms ease;
          will-change: opacity;
        }

        html.kr-full-startup .kr-startup-black-base,
        html.kr-startup-active .kr-startup-black-base {
          display: block;
        }

        html.kr-startup-fading .kr-startup-black-base,
        html:has(.loading-overlay--fade) .kr-startup-black-base {
          opacity: 0;
        }

        html.kr-startup-fading .startup-animation__stage,
        html.kr-startup-fading .startup-animation__controls,
        html:has(.loading-overlay--fade) .startup-animation__stage,
        html:has(.loading-overlay--fade) .startup-animation__controls {
          opacity: 0 !important;
          transition: opacity 650ms ease !important;
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .kr-startup-black-base,
          html.kr-startup-fading .startup-animation__stage,
          html.kr-startup-fading .startup-animation__controls,
          html:has(.loading-overlay--fade) .startup-animation__stage,
          html:has(.loading-overlay--fade) .startup-animation__controls {
            transition: none !important;
          }
        }
      </style>

      <script>
        (() => {
          const root = document.documentElement
          if (!root.classList.contains('kr-full-startup')) return

          root.classList.add('kr-startup-active', 'kr-startup-handoff')
        })()
      </script>

      <div class="kr-startup-black-base" aria-hidden="true"></div>
    `)
  })
})
