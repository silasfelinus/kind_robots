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

        .kr-prehydrate-media,
        .loading-logo {
          -webkit-mask-image: radial-gradient(
            ellipse 47% 52% at 48% 49%,
            #000 0%,
            #000 42%,
            rgba(0, 0, 0, 0.94) 57%,
            rgba(0, 0, 0, 0.62) 73%,
            rgba(0, 0, 0, 0.18) 88%,
            transparent 100%
          ) !important;
          mask-image: radial-gradient(
            ellipse 47% 52% at 48% 49%,
            #000 0%,
            #000 42%,
            rgba(0, 0, 0, 0.94) 57%,
            rgba(0, 0, 0, 0.62) 73%,
            rgba(0, 0, 0, 0.18) 88%,
            transparent 100%
          ) !important;
          -webkit-mask-position: center;
          mask-position: center;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-size: 112% 108%;
          mask-size: 112% 108%;
        }

        html.kr-startup-fading .kr-startup-black-base,
        html:has(.loading-overlay--fade) .kr-startup-black-base {
          opacity: 0;
        }

        html.kr-startup-fading .loading-overlay,
        html.kr-startup-fading .kr-prehydrate-effect,
        html.kr-startup-fading .kr-prehydrate-content,
        html.kr-startup-fading .kr-prehydrate-controls,
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
          html.kr-startup-fading .loading-overlay,
          html.kr-startup-fading .kr-prehydrate-effect,
          html.kr-startup-fading .kr-prehydrate-content,
          html.kr-startup-fading .kr-prehydrate-controls,
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