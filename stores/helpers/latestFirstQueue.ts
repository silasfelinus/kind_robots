// /stores/helpers/latestFirstQueue.ts
//
// A small concurrency limiter that serves the NEWEST waiting request first.
//
// Gallery tiles ask for their data as they scroll near the viewport. With a
// first-in-first-out queue, a fast scroll lines up every tile the viewer
// already passed, and the ones actually on screen wait behind all of them
// (Silas, 2026-09-29: "it's loading the past stuff rather than the current
// focus"). The most recent request is the best guess at what is in view, so it
// goes next; older requests still finish, just after it.
export function createLatestFirstQueue(limit: number) {
  const waiters: Array<() => void> = []
  let active = 0

  async function run<T>(work: () => Promise<T>): Promise<T> {
    if (active >= limit) {
      await new Promise<void>((resolve) => waiters.push(resolve))
    } else {
      active += 1
    }
    try {
      return await work()
    } finally {
      const next = waiters.pop()
      if (next) next()
      else active -= 1
    }
  }

  return { run }
}
