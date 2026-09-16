// /utils/loraTriggerKey.ts
//
// Normalizing a LoRA trigger for COMPARISON only -- never for rendering.
//
// Lives in its own pure module so tests can import it without dragging in
// server/utils/artLoraResource.ts, which pulls Prisma with it.
//
// The escaping half exists because the dedup in appendResolvedTriggers was
// defeated by its own caller. The LoRA probe escapes parentheses so they carry
// no SD attention weight -- `she hulk\(marvel\)` -- while the catalog trigger
// is the raw `she hulk(marvel)`, so a plain substring test never matched and
// the term was appended a SECOND time, unescaped. That duplicate then did the
// exact thing the escaping existed to prevent: ArtJob 24571's prompt ended
// `..., she hulk(marvel)`, re-weighting `marvel`. A trailing comma in a
// catalog trigger broke the same test the same way.
export function loraTriggerKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\\([()[\]])/g, '$1')
    .replace(/[\s,;]+$/, '')
    .trim()
}

/**
 * A1111 LoRA invocation syntax, which ComfyUI has no parser for.
 *
 * `<lora:foo:1>` reaches the graph as literal prompt text: inert at best, and
 * on a tag lane it is a pile of tokens competing with the real trigger. The
 * probe already strips it, but appendResolvedTriggers used to re-add the raw
 * catalog trigger afterwards and put it straight back -- 41 queued probes
 * carried one on 2026-09-16.
 */
export function stripLoraInvocation(value: string): string {
  return value
    .replace(/<\s*lora\s*:[^>]*>/gi, ' ')
    .replace(/\s*,\s*(?:,\s*)+/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .trim()
}
