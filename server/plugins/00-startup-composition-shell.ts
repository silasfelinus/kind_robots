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
          gap: 1.25rem;
          grid-auto-flow: row;
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

        .kr-boot-cover__media {
          width: clamp(14rem, 52vw, 30rem);
          max-width: 90vw;
          height: auto;
          object-fit: contain;
          -webkit-mask-image: radial-gradient(
            ellipse 47% 52% at 48% 49%,
            #000 0%,
            #000 42%,
            rgba(0, 0, 0, 0.62) 73%,
            transparent 100%
          );
          mask-image: radial-gradient(
            ellipse 47% 52% at 48% 49%,
            #000 0%,
            #000 42%,
            rgba(0, 0, 0, 0.62) 73%,
            transparent 100%
          );
        }

        .kr-boot-cover__title {
          max-width: 90vw;
          font-size: clamp(1.1rem, 2.2vw, 1.9rem);
          font-weight: 800;
          letter-spacing: 0.02em;
          text-align: center;
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
        <img
          src="/images/startup-animations/launch-04.webp"
          alt=""
          class="kr-boot-cover__media"
          width="720"
          height="720"
          fetchpriority="high"
          decoding="async"
        />
        <p class="kr-boot-cover__title">Building Kind Robots...</p>
      </div>
    `)
  })
})
