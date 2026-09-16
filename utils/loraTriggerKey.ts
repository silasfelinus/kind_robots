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
