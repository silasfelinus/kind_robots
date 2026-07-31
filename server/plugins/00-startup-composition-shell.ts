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

        .kr-prehydrate-controls__group {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
        }

        .kr-prehydrate-controls__active-only {
          display: none;
        }

        .kr-prehydrate-controls--active .kr-prehydrate-controls__active-only {
          display: inline-flex;
        }

        .kr-prehydrate-controls--active .kr-prehydrate-controls__compact-only {
          display: none;
        }

        .kr-prehydrate-controls__exit {
          min-width: 1.65rem;
          justify-content: center;
          font-size: 1rem;
          line-height: 1;
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
          pointer-events: none !important;
        }

        /*
         * This is intentionally CSS-driven. On the iPad failure the main JS
         * thread stops servicing timers after hydration begins, while animated
         * images and compositor animations continue. The startup cover must
         * therefore become invisible without requiring another JS callback.
         */
        html.kr-full-startup .kr-startup-black-base,
        html.kr-full-startup .kr-prehydrate-content,
        html.kr-full-startup:not(.kr-startup-effect-ready) .kr-prehydrate-effect,
        html.kr-full-startup:not(.kr-startup-controls-ready) .kr-prehydrate-controls,
        html.kr-full-startup .kr-boot-curtain,
        html.kr-full-startup .loading-overlay,
        html.kr-full-startup .loader-root,
        html.kr-full-startup .startup-animation__stage,
        html.kr-full-startup .startup-animation__controls {
          animation: kr-startup-css-hard-stop 700ms ease 8300ms forwards !important;
        }

        html.kr-full-startup,
        html.kr-startup-handoff,
        html.kr-full-startup .kr-shell.bg-black {
          animation: kr-startup-css-root-release 1ms linear 9000ms forwards !important;
        }

        html.kr-startup-user-explore,
        html.kr-startup-user-explore .kr-startup-black-base,
        html.kr-startup-user-explore .kr-prehydrate-content,
        html.kr-startup-user-explore .kr-prehydrate-effect,
        html.kr-startup-user-explore .kr-prehydrate-controls,
        html.kr-startup-user-explore .kr-boot-curtain,
        html.kr-startup-user-explore .loading-overlay,
        html.kr-startup-user-explore .loader-root,
        html.kr-startup-user-explore .startup-animation__stage,
        html.kr-startup-user-explore .startup-animation__controls,
        html.kr-startup-user-explore .kr-shell.bg-black {
          animation-play-state: paused !important;
        }

        @keyframes kr-startup-css-hard-stop {
          from {
            opacity: 1;
            visibility: visible;
          }

          to {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }
        }

        @keyframes kr-startup-css-root-release {
          to {
            background-color: transparent;
          }
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

          .kr-prehydrate-controls__wide-label {
            display: none;
          }
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

          const FORCE_KEY = 'kind-robots-force-full-startup-v1'
          const STARTED_AT_KEY = 'kind-robots-startup-started-at-v1'
          /*
           * Emergency only, and deliberately NOT pushed further out. The
           * hydrated intro fades itself by ~5.7s worst case (loading-messages.vue
           * INTRO_MAX_MS + fade), so 9s already clears it. When hydration blocks
           * the main thread this watchdog and the CSS hard stop are the only
           * things that still work, so delaying them only lengthens the time a
           * user stares at a frozen launch screen.
           */
          const WATCHDOG_MS = 9000
          const FADE_MS = 700
          const BRIDGE_EVENT = 'kr-startup-action'
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
              prehydrateControls: Boolean(
                document.querySelector('.kr-prehydrate-controls'),
              ),
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

          const removeStartupNodes = () => {
            document
              .querySelectorAll(
                '.kr-prehydrate-loader, .kr-startup-black-base, .loading-overlay, .loader-root',
              )
              .forEach((element) => element.remove())
          }

          const clearStartupClasses = () => {
            root.classList.remove(
              'kr-full-startup',
              'kr-startup-active',
              'kr-startup-handoff',
              'kr-startup-fading',
              'kr-startup-effect-ready',
              'kr-startup-controls-ready',
              'kr-startup-user-explore',
            )
          }

          const beginShellExit = (reason) => {
            if (
              !root.classList.contains('kr-full-startup') &&
              !root.classList.contains('kr-startup-active')
            ) {
              return
            }

            window.__KR_STARTUP_USER_EXPLORE__ = false
            /*
             * Startup is over as far as this page load is concerned. On a slow
             * device the app can hydrate long after this runs; without this
             * flag kind-loader would mount and start a brand new startup
             * sequence on top of the one we just tore down — and every safety
             * net (this watchdog, the CSS hard stop) is gated on classes we are
             * about to remove, so that second sequence would have none. That is
             * the "animation loops forever" report.
             */
            window.__KR_STARTUP_ABANDONED__ = true
            root.classList.remove('kr-startup-user-explore')
            root.classList.add('kr-startup-fading')
            record('shell:begin-exit', { reason })

            window.setTimeout(() => {
              clearStartupClasses()
              removeStartupNodes()
              record('shell:exit-cleanup', { reason })
              flush('shell-exit-' + reason)
            }, FADE_MS)
          }

          /*
           * True only once the real Vue control tray has mounted and can take
           * over. Until then these server-rendered controls are on their own
           * and must be able to finish the sequence without it.
           */
          const bridgeAlive = () => window.__KR_STARTUP_BRIDGE_READY__ === true

          const forwardBridgeAction = (action) => {
            if (bridgeAlive()) {
              window.dispatchEvent(new CustomEvent(BRIDGE_EVENT, { detail: action }))
              return
            }

            const queue = window.__KR_STARTUP_ACTION_QUEUE__ || []
            queue.push(action)
            window.__KR_STARTUP_ACTION_QUEUE__ = queue
          }

          const setExploreMode = (enabled) => {
            window.__KR_STARTUP_USER_EXPLORE__ = enabled
            root.classList.toggle('kr-startup-user-explore', enabled)
            document
              .querySelector('.kr-prehydrate-controls')
              ?.classList.toggle('kr-prehydrate-controls--active', enabled)
          }

          window.__KR_STARTUP_TRACE__ = record
          window.__KR_STARTUP_TRACE_FLUSH__ = flush
          window.__KR_STARTUP_USER_EXPLORE__ = false
          window.__KR_STARTUP_ACTION_QUEUE__ =
            window.__KR_STARTUP_ACTION_QUEUE__ || []

          root.classList.add('kr-startup-active', 'kr-startup-handoff')
          record('shell:init')

          document.addEventListener(
            'click',
            (event) => {
              const target = event.target
              if (!(target instanceof Element)) return

              const button = target.closest('[data-kr-startup-action]')
              if (!button) return

              const action = button.getAttribute('data-kr-startup-action')
              if (!action) return

              record('shell:control-action', { action })

              if (action === 'explore') {
                setExploreMode(true)
              } else if (action === 'resume') {
                setExploreMode(false)
                /*
                 * Resume previously only forwarded to Vue. With no hydrated
                 * component to receive it the launch screen simply stayed up —
                 * and because 'explore' had already suppressed every watchdog,
                 * that was unrecoverable: a control tray that visibly responds
                 * to hover but whose buttons do nothing. Finish it here when
                 * nothing else can.
                 */
                if (!bridgeAlive()) beginShellExit('control-resume')
              } else if (action === 'exit') {
                beginShellExit('control-exit')
              }

              forwardBridgeAction(action)
              flush('control-' + action)
            },
            true,
          )

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
            /*
             * Explore mode may only suppress the hard stop while the hydrated
             * controls are actually alive to end it. Honouring the flag
             * unconditionally meant one click on the pre-hydration tray
             * disarmed the last exit from a page that never hydrated.
             */
            if (window.__KR_STARTUP_USER_EXPLORE__ === true && bridgeAlive()) {
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

            beginShellExit('watchdog')
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