// /utils/scripts/ratchetBaseline.ts
//
// The baseline-ratchet shape, shared.
//
// interface-vision t-095: verifyLayoutContract.ts and auditWonderLabPreviews.ts
// had each hand-rolled the same four moves -- load a JSON allow-list, diff
// today's findings against it, fail only on entries not already listed, and
// support an `--update` that writes a SMALLER list but refuses a larger one.
// A third check wanting the same pattern would have copy-pasted it again.
//
// DELIBERATELY NOT a file format. The two callers store different shapes on
// disk (`violations`, a per-rule Record; `uncovered`, a flat list) and t-095 is
// explicitly a pure refactor with no behaviour change, so normalising those
// files would have exceeded it. Everything here works on an in-memory
// Record<string, string[]> -- a flat list is simply one bucket -- and each
// caller serialises its own shape. The ratchet LOGIC is what was duplicated;
// the storage never was.

import { readFileSync, writeFileSync } from 'node:fs'

/** Buckets of offending entries, keyed however the caller groups them. */
export type RatchetEntries = Record<string, string[]>

/**
 * Read a baseline, or null when it is absent or unparseable.
 *
 * Both callers treated "no file" and "corrupt file" identically -- as "no
 * baseline yet" -- so that behaviour is preserved rather than tightened. A
 * checker that hard-failed on a malformed allow-list would block the very
 * `--update` run that rewrites it.
 */
export function loadRatchetBaseline<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch {
    return null
  }
}

/**
 * The buckets that got WORSE — the ones that make `--update` refuse.
 *
 * A missing bucket in the baseline counts as zero, so a newly-added rule with
 * any violations correctly reads as growth rather than being silently accepted.
 */
export function grownRatchetBuckets(
  current: RatchetEntries,
  baseline: RatchetEntries | null,
): string[] {
  if (!baseline) return []
  return Object.keys(current).filter(
    (key) => (current[key]?.length ?? 0) > (baseline[key]?.length ?? 0),
  )
}

/** `  (-3) ✅` / `  (+2) ❌` / `  (unchanged)`, or nothing with no baseline. */
export function ratchetDelta(now: number, was: number | undefined): string {
  if (was === undefined) return ''
  if (now === was) return '  (unchanged)'
  return now < was ? `  (-${was - now}) ✅` : `  (+${now - was}) ❌`
}

/** The standard warning, so every allow-list explains itself the same way. */
export function ratchetNote(subject: string, script: string): string {
  return (
    `${subject} RATCHET: this file may only ever shrink. ` +
    `--update refuses to record a larger count. See ${script}.`
  )
}

/** Today, as the `recorded` stamp both baselines carry. */
export function ratchetRecordedAt(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Write a baseline payload in the caller's own shape. */
export function writeRatchetBaseline(path: string, payload: unknown): void {
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`)
}
