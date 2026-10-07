// /utils/arcade/pageLock.ts
//
// While a touch game is running, the page must neither scroll nor zoom. A
// stray pinch used to zoom the page in, and the game's own gesture capture
// then made it impossible to pinch back out. Locking stops page scrolling,
// pins the zoom to 1 through the viewport meta (which also snaps back any zoom
// the visitor already had), and cancels pinch gestures, including Safari's own
// gesture events, which ignore touch-action. Unlocking restores the page's own
// viewport, so zooming works again everywhere outside a game.

const LOCKED_VIEWPORT =
  'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'

let holders = 0
let savedViewport: string | null = null

function cancel(event: Event) {
  if (event.cancelable) event.preventDefault()
}

/** Two or more fingers moving is a pinch; game controls listen to pointer events, not this. */
function cancelPinch(event: TouchEvent) {
  if (event.touches.length > 1 && event.cancelable) event.preventDefault()
}

function viewportMeta(): HTMLMetaElement | null {
  return document.querySelector('meta[name="viewport"]')
}

function engage() {
  const root = document.documentElement
  root.style.overflow = 'hidden'
  root.style.overscrollBehavior = 'none'
  document.body.style.overflow = 'hidden'
  const meta = viewportMeta()
  if (meta) {
    savedViewport = meta.getAttribute('content')
    meta.setAttribute('content', LOCKED_VIEWPORT)
  }
  for (const type of ['gesturestart', 'gesturechange', 'gestureend'])
    document.addEventListener(type, cancel, { passive: false })
  document.addEventListener('touchmove', cancelPinch, { passive: false })
}

function release() {
  const root = document.documentElement
  root.style.overflow = ''
  root.style.overscrollBehavior = ''
  document.body.style.overflow = ''
  const meta = viewportMeta()
  if (meta && savedViewport !== null)
    meta.setAttribute('content', savedViewport)
  savedViewport = null
  for (const type of ['gesturestart', 'gesturechange', 'gestureend'])
    document.removeEventListener(type, cancel)
  document.removeEventListener('touchmove', cancelPinch)
}

/**
 * Lock (or release) the page for touch play. Each caller that locks must
 * release once; the page unlocks when the last one does.
 */
export function setGamePageLock(on: boolean) {
  if (typeof document === 'undefined') return
  if (on) {
    if (holders++ === 0) engage()
  } else if (holders > 0 && --holders === 0) {
    release()
  }
}
