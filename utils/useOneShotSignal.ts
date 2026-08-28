// @/utils/useOneShotSignal.ts
//
// cthulhuquarium/t-056 (kaizen from t-053's generic milestone toast, kind_robots
// PR #2169): stores/cthulhuquariumTankStore.ts's unlock()/hatchEgg()/breed() and
// the separate purchaseFinale() each hand-rolled the same "read a one-shot
// signal off a purchase response, stash it for the game component to consume,
// let it clear via a dismiss function, never re-derive it from a later reload"
// shape three times over: bestiaryJustCompleted (t-024, a bare boolean flag),
// milestoneToastQueue (t-053, a real FIFO queue of FiredMilestone), and
// finaleJustTriggered (t-039, another bare boolean flag). This is the one
// shared primitive all three now build on -- presentation-only extraction, no
// behavior change, no new signals.
//
// Deliberately framework-light (just Vue's reactivity, no pinia/fetch) so it
// composes cleanly inside any setup-style store, same discipline as
// utils/useRandomColor.ts.

import { computed, ref, type ComputedRef, type Ref } from 'vue'

// The base primitive: a FIFO queue of one-shot values. `next` is the front
// entry (or null when empty) -- a consumer reads `next`, shows it, then
// calls `dismiss()` once shown. Mirrors milestoneToastQueue's original
// push(...)/shift() shape exactly.
export function useOneShotQueue<T>(): {
  queue: Ref<T[]>
  next: ComputedRef<T | null>
  push: (...items: T[]) => void
  dismiss: () => void
} {
  const queue = ref<T[]>([]) as Ref<T[]>
  const next = computed<T | null>(() => queue.value[0] ?? null)

  function push(...items: T[]): void {
    if (items.length) queue.value.push(...items)
  }

  function dismiss(): void {
    queue.value.shift()
  }

  return { queue, next, push, dismiss }
}

// The boolean specialization -- bestiaryJustCompleted and finaleJustTriggered
// are both really a one-entry queue of `true`: `trigger()` sets the flag (a
// no-op if it's already set, since neither original call site ever needed
// more than "has this fired"), `flag` reads whether it's active, and
// `dismiss()` clears it. Built on useOneShotQueue rather than a second
// bespoke ref so both shapes share the same underlying primitive.
export function useOneShotFlag(): {
  flag: ComputedRef<boolean>
  trigger: () => void
  dismiss: () => void
} {
  const { next, push, dismiss } = useOneShotQueue<true>()
  const flag = computed(() => next.value === true)

  function trigger(): void {
    if (!flag.value) push(true)
  }

  return { flag, trigger, dismiss }
}
