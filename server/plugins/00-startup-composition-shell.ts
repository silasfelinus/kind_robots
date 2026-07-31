/*
 * The boot cover, and nothing else.
 *
 * This used to render a full pre-hydration launch experience: an animated
 * background, loading messages, an interactive control tray, a click bridge
 * with an action queue, lifecycle tracing, and a JS watchdog — all of which
 * then had to hand off to the Vue components that render the same things.
 * Every startup bug we chased lived in that seam, never in the intro itself.
 *
 * The failure it kept producing: the pre-hydration screen covers the app, and
 * everything that could remove it (watchdog, handoff classes, control clicks)
 * depends on JS that may never run or may run too late. Once it had covered
 * the page, nothing underneath could rescue it.
 *
 * So the cover now does exactly one job — hide the server-rendered site until
 * the app is ready — and it does it without a single line of JavaScript:
 *
 *   - Vue adds `kr-app-ready` to <html> when it mounts, fading the cover out.
 *   - If that never happens, a CSS animation releases it anyway.
 *
 * A CSS animation cannot be starved by a busy main thread, blocked hydration,
 * or a failed chunk, so there is no state in which this traps the user. The
 * intro itself (messages, animation, control tray) is owned entirely by Vue
 * and starts only once the app is actually running.
 */

const RELEASE_DELAY_MS = 6000
const RELEASE_FADE_MS = 500

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    html.bodyPrepend.unshift(`
      <style>
        .kr-boot-cover {
          position: fixed;
          inset: 0;
          z-index: 30;
          display: grid;
          place-items: center;
          padding: 1rem;
          background: #000;
          color: #fff;
          opacity: 1;
          pointer-events: none;
          animation: kr-boot-cover-release ${RELEASE_FADE_MS}ms ease ${RELEASE_DELAY_MS}ms forwards;
        }

        /*
         * The app mounted and is rendering its own intro on top, so retire the
         * cover early. Whichever of these two happens first wins; neither can
         * prevent the other.
         */
        html.kr-app-ready .kr-boot-cover {
          opacity: 0;
          visibility: hidden;
          transition:
            opacity 300ms ease,
            visibility 0s linear 300ms;
          animation: none;
        }

        /*
         * Match loading-messages.vue closely enough that the boot-cover cameo
         * and the real Vue intro occupy the same visual slots. On a normal
         * launch the handoff should read as one continuous logo, not a second
         * logo loading at a new size or position. On browser refresh, where the
         * full intro is intentionally skipped, this is the brief logo cameo.
         */
        .kr-boot-cover__content {
          display: grid;
          width: min(98vw, 64rem);
          height: min(92vh, 52rem);
          grid-template-rows: minmax(3.75rem, auto) minmax(0, 1fr) 8rem;
          place-items: center;
        }

        .kr-boot-cover__title {
          display: flex;
          width: fit-content;
          max-width: min(90vw, 44rem);
          min-height: 3.75rem;
          align-items: center;
          justify-content: center;
          padding: 0.65rem 1.2rem;
          background: rgba(0, 0, 0, 0.78);
          color: #fff;
          font-size: clamp(1.2rem, 2.25vw, 2rem);
          font-weight: 800;
          letter-spacing: 0.02em;
          text-align: center;
          box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.42);
        }

        .kr-boot-cover__media-frame {
          display: grid;
          width: 100%;
          height: 100%;
          min-height: 0;
          place-items: center;
        }

        .kr-boot-cover__media {
          width: clamp(16rem, 58vw, 34rem);
          max-height: 100%;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 1.5rem 3rem rgba(255, 255, 255, 0.2));
          -webkit-mask-image: radial-gradient(
            ellipse 50% 47% at 52% 49%,
            #000 42%,
            rgba(0, 0, 0, 0.86) 58%,
            rgba(0, 0, 0, 0.34) 76%,
            transparent 96%
          );
          mask-image: radial-gradient(
            ellipse 50% 47% at 52% 49%,
            #000 42%,
            rgba(0, 0, 0, 0.86) 58%,
            rgba(0, 0, 0, 0.34) 76%,
            transparent 96%
          );
        }

        .kr-boot-cover__status-spacer {
          width: 100%;
          min-height: 8rem;
        }

        @keyframes kr-boot-cover-release {
          to {
            opacity: 0;
            visibility: hidden;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          html.kr-app-ready .kr-boot-cover {
            transition: none;
          }
        }
      </style>

      <div class="kr-boot-cover" aria-hidden="true">
        <div class="kr-boot-cover__content">
          <p class="kr-boot-cover__title">Building Kind Robots...</p>

          <div class="kr-boot-cover__media-frame">
            <img
              src="/images/startup-animations/launch-04.webp"
              alt=""
              class="kr-boot-cover__media"
              width="720"
              height="720"
              fetchpriority="high"
              decoding="async"
            />
          </div>

          <div class="kr-boot-cover__status-spacer"></div>
        </div>
      </div>
    `)
  })
})
