export type ViewportHydrationPriority = 'high' | 'low'

type HydrationCallback = (priority: ViewportHydrationPriority) => void

const callbacks = new WeakMap<Element, HydrationCallback>()
let observer: IntersectionObserver | null = null

function priorityFor(element: Element): ViewportHydrationPriority {
  if (typeof window === 'undefined') return 'low'
  const rect = element.getBoundingClientRect()
  const visible =
    rect.bottom >= 0 &&
    rect.top <= window.innerHeight &&
    rect.right >= 0 &&
    rect.left <= window.innerWidth
  return visible ? 'high' : 'low'
}

function sharedObserver(): IntersectionObserver | null {
  if (
    typeof window === 'undefined' ||
    typeof window.IntersectionObserver !== 'function'
  ) {
    return null
  }

  if (observer) return observer

  observer = new window.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const callback = callbacks.get(entry.target)
        if (!callback) continue
        callbacks.delete(entry.target)
        observer?.unobserve(entry.target)
        callback(priorityFor(entry.target))
      }
    },
    { rootMargin: '1800px 0px 1800px 0px' },
  )

  return observer
}

export function observeViewportHydration(
  element: Element,
  hydrate: HydrationCallback,
): () => void {
  const activeObserver = sharedObserver()
  if (!activeObserver) {
    hydrate('low')
    return () => undefined
  }

  callbacks.set(element, hydrate)
  activeObserver.observe(element)

  return () => {
    callbacks.delete(element)
    activeObserver.unobserve(element)
  }
}
