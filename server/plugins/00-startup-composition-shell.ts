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

        .startup-animation__controls {
          z-index: 2147483000 !important;
          display: flex !important;
          visibility: visible !important;
          isolation: isolate;
        }

        .startup-animation__controls,
        .startup-animation__controls button {
          pointer-events: auto !important;
          touch-action: manipulation;
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
        html.kr-startup-fading .startup-animation__stage,
        html.kr-startup-fading .startup-animation__controls,
        html:has(.loading-overlay--fade) .startup-animation__stage,
        html:has(.loading-overlay--fade) .startup-animation__controls {
          opacity: 0 !important;
          transition: opacity 650ms ease !important;
          pointer-events: none !important;
        }

        @media (max-width: 639px) {
          .startup-animation__controls {
            right: 0.75rem !important;
            bottom: max(0.75rem, env(safe-area-inset-bottom)) !important;
            left: 0.75rem !important;
            max-width: calc(100vw - 1.5rem) !important;
          }

          .loading-content {
            height: calc(100dvh - 1rem) !important;
            max-height: none !important;
            grid-template-rows:
              minmax(3.25rem, auto)
              minmax(0, 1fr)
              14rem !important;
          }

          .loading-status {
            box-sizing: border-box;
            min-height: 14rem !important;
            grid-template-rows: 4rem minmax(4rem, auto) !important;
            padding-bottom: 6rem !important;
          }

          .loading-message {
            max-width: calc(100vw - 1.5rem) !important;
            font-size: clamp(0.95rem, 4.5vw, 1.25rem) !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .kr-startup-black-base,
          html.kr-startup-fading .loading-overlay,
          html.kr-startup-fading .kr-prehydrate-effect,
          html.kr-startup-fading .kr-prehydrate-content,
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

          const FORCE_KEY = 'kind-robots-force-full-startup-v1'
          const STARTED_AT_KEY = 'kind-robots-startup-started-at-v1'
          const WATCHDOG_MS = 9000
          const FADE_MS = 700
          const traceState = {
            traceId:
              Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
            events: [],
            sentCount: 0,
          }

          const snapshot = () => ({
            readyState: document.readyState,
            visibility: document.visibilityState,
            classes: Array.from(root.classList),
            viewport: [window.innerWidth, window.innerHeight],
            dom: {
              prehydrate: Boolean(document.querySelector('.kr-prehydrate-loader')),
              blackBase: Boolean(document.querySelector('.kr-startup-black-base')),
              loaderRoot: Boolean(document.querySelector('.loader-root')),
              overlay: Boolean(document.querySelector('.loading-overlay')),
              overlayFading: Boolean(
                document.querySelector('.loading-overlay--fade'),
              ),
              stage: Boolean(document.querySelector('.startup-animation__stage')),
              controls: Boolean(
                document.querySelector('.startup-animation__controls'),
              ),
              controlsActive: Boolean(
                document.querySelector('.startup-animation__controls--active'),
              ),
            },
            userExplore: window.__KR_STARTUP_USER_EXPLORE__ === true,
          })

          const record = (name, detail) => {
            const entry = {
              at: Math.round(performance.now()),
              name,
              detail: detail || null,
              snapshot: snapshot(),
            }
            traceState.events.push(entry)
            console.info('[startup-trace]', entry)
          }

          const flush = (reason) => {
            const events = traceState.events.slice(traceState.sentCount)
            if (!events.length) return
            traceState.sentCount = traceState.events.length

            fetch('/api/startup/trace', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                traceId: traceState.traceId,
                buildId: window.__NUXT__?.config?.public?.buildId,
                reason,
                events,
                snapshot: snapshot(),
                userAgent: navigator.userAgent,
              }),
              keepalive: true,
            }).catch(() => {})
          }

          window.__KR_STARTUP_TRACE__ = record
          window.__KR_STARTUP_TRACE_FLUSH__ = flush
          window.__KR_STARTUP_USER_EXPLORE__ = false

          root.classList.add('kr-startup-active', 'kr-startup-handoff')
          record('shell:init')

          ;[1500, 3500, 6000, 9000, 12000].forEach((delay) => {
            window.setTimeout(() => {
              record('shell:snapshot', { delay })
              flush('snapshot-' + delay)
            }, delay)
          })

          window.addEventListener(
            'error',
            (event) => {
              record('window:error', {
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
              })
              flush('window-error')
            },
            true,
          )

          window.addEventListener('unhandledrejection', (event) => {
            record('window:unhandledrejection', {
              reason: String(event.reason),
            })
            flush('unhandled-rejection')
          })

          window.__KR_STARTUP_SHELL_WATCHDOG__ = window.setTimeout(() => {
            if (window.__KR_STARTUP_USER_EXPLORE__ === true) {
              record('shell:watchdog-preserved-user-explore')
              flush('watchdog-user-explore')
              return
            }

            if (
              !root.classList.contains('kr-full-startup') &&
              !root.classList.contains('kr-startup-active')
            ) {
              record('shell:watchdog-already-cleared')
              flush('watchdog-already-cleared')
              return
            }

            record('shell:watchdog-fire')

            try {
              sessionStorage.removeItem(FORCE_KEY)
              sessionStorage.removeItem(STARTED_AT_KEY)
            } catch {}

            root.classList.add('kr-startup-fading')

            window.setTimeout(() => {
              root.classList.remove(
                'kr-full-startup',
                'kr-startup-active',
                'kr-startup-handoff',
                'kr-startup-fading',
                'kr-startup-effect-ready',
                'kr-startup-controls-ready',
              )

              document
                .querySelectorAll(
                  '.kr-prehydrate-loader, .kr-startup-black-base, .loading-overlay, .loader-root',
                )
                .forEach((element) => element.remove())

              record('shell:watchdog-cleanup')
              flush('watchdog-cleanup')
            }, FADE_MS)
          }, WATCHDOG_MS)

          window.addEventListener('pagehide', () => flush('pagehide'), {
            once: true,
          })
        })()
      </script>

      <div class="kr-startup-black-base" aria-hidden="true"></div>
    `)
  })
})
