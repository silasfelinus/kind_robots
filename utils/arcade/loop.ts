// /utils/arcade/loop.ts
//
// Fixed-timestep loop: games always advance in 1/60 s ticks whatever the
// display refresh rate, and render once per animation frame.

export const TICK_MS = 1000 / 60
/** Never run more than this many catch-up ticks per frame (tab was asleep). */
export const MAX_TICKS_PER_FRAME = 5

export function advanceClock(
  accumulator: number,
  elapsedMs: number,
  tickMs = TICK_MS,
  maxTicks = MAX_TICKS_PER_FRAME,
): { ticks: number; accumulator: number } {
  let acc = accumulator + Math.max(0, elapsedMs)
  let ticks = Math.floor(acc / tickMs)
  if (ticks > maxTicks) {
    ticks = maxTicks
    acc = 0
  } else {
    acc -= ticks * tickMs
  }
  return { ticks, accumulator: acc }
}

export type FixedLoop = { stop: () => void }

/**
 * Run `tick` at 60 Hz and `render` once a frame. A frame that throws is
 * handed to `onError` and the loop carries on: before, one exception ended
 * the animation frame chain and the cabinet froze with no way to tell why.
 */
export function startFixedLoop(
  tick: () => void,
  render: () => void,
  onError: (error: unknown) => void = (error) => console.error(error),
): FixedLoop {
  let running = true
  let last = performance.now()
  let accumulator = 0
  let handle = 0
  const frame = (now: number) => {
    if (!running) return
    // Ask for the next frame first, so nothing below can end the chain.
    handle = requestAnimationFrame(frame)
    const step = advanceClock(accumulator, now - last)
    last = now
    accumulator = step.accumulator
    try {
      for (let i = 0; i < step.ticks; i++) tick()
      render()
    } catch (error) {
      onError(error)
    }
  }
  handle = requestAnimationFrame(frame)
  return {
    stop: () => {
      running = false
      cancelAnimationFrame(handle)
    },
  }
}
