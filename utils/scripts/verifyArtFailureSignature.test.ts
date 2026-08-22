// /utils/scripts/verifyArtFailureSignature.test.ts
//
// Regression test for ai-art-academy/t-073 (GET /api/art/queue/stats
// recentFailed grouped by normalized error signature). Exercises
// server/utils/artFailureSignature.ts's pure classification/grouping core
// directly -- no prisma, no database, no Nuxt/H3 runtime -- same discipline
// as utils/scripts/verifyRevenueSplit.test.ts.
//
// Fixture error strings below are real, byte-for-byte examples pulled from
// conductor's RENDER-BACKLOG.md / ai-art-academy/roadmap.yaml RECHECK
// history (t-044's lora_name rejection and charmap crash, t-068's
// hostbuf_file_reader_read burst, and the recurring connection-refused
// flakiness) -- not invented text, so the matchers are proven against the
// actual failure signatures this task exists to distinguish.
import assert from 'node:assert/strict'

import {
  classifyArtFailureSignature,
  groupArtFailuresBySignature,
} from '../../server/utils/artFailureSignature.js'

// --- classifyArtFailureSignature: known signatures -------------------------

{
  const { signature, label } = classifyArtFailureSignature(
    'ComfyUI reported a workflow error: node 3 (CLIPTextEncode): hostbuf_file_reader_read failed',
  )
  assert.equal(signature, 'hostbuf-file-reader-read')
  assert.match(label, /hostbuf_file_reader_read/)
}

{
  const { signature } = classifyArtFailureSignature(
    "lora_name: 'Flux/SFW/3D_Cartoon_Vision_flux_v1.safetensors' not in (list of length 2231)",
  )
  assert.equal(signature, 'lora-not-in-list')
}

{
  const { signature } = classifyArtFailureSignature(
    "'charmap' codec can't encode character '\\U0001f527' in position 34: character maps to <undefined>",
  )
  assert.equal(signature, 'charmap-codec')
}

{
  const { signature } = classifyArtFailureSignature(
    'connection to http://127.0.0.1:8188 actively refused it (WinError 10061)',
  )
  assert.equal(signature, 'connection-refused')
}

// A generic ComfyUI workflow error that does NOT match any specific known
// node/exception pattern still falls into the explicit "other" bucket, not
// silently merged with hostbuf_file_reader_read -- this is the exact
// over-collapsing bug recheck_render_queue.py's original substring match had
// (checking "workflow error" before any specific signature).
{
  const { signature } = classifyArtFailureSignature(
    'ComfyUI reported a workflow error: node 7 (VAEDecode): CUDA out of memory',
  )
  assert.equal(signature, 'workflow-error-other')
  assert.notEqual(signature, 'hostbuf-file-reader-read')
}

{
  const { signature, label } = classifyArtFailureSignature(null)
  assert.equal(signature, 'no-error-text')
  assert.equal(label, '(no error text)')
}

{
  const { signature, label } = classifyArtFailureSignature(
    'a completely unrecognized failure mode with id 48213 and path /tmp/foo/bar.png',
  )
  assert.equal(signature, 'other')
  assert.ok(label.length > 0 && label.length <= 120)
}

// --- classifyArtFailureSignature: specificity ordering ----------------------
// hostbuf_file_reader_read failures are also, textually, "a workflow error"
// -- the fix must check the specific pattern first so it isn't swallowed by
// the generic bucket.
{
  const { signature } = classifyArtFailureSignature(
    'ComfyUI reported a workflow error: node 3 (CLIPTextEncode): hostbuf_file_reader_read failed',
  )
  assert.equal(signature, 'hostbuf-file-reader-read')
}

// --- groupArtFailuresBySignature: per-signature, per-projectSlug counts ----

{
  const recentFailed = [
    {
      error:
        'ComfyUI reported a workflow error: node 3 (CLIPTextEncode): hostbuf_file_reader_read failed',
      projectSlug: 'facet-catalog',
    },
    {
      error:
        'ComfyUI reported a workflow error: node 3 (CLIPTextEncode): hostbuf_file_reader_read failed',
      projectSlug: 'facet-catalog',
    },
    {
      error:
        'ComfyUI reported a workflow error: node 3 (CLIPTextEncode): hostbuf_file_reader_read failed',
      projectSlug: 'dream-cycle',
    },
    { error: null, projectSlug: 'academy-remix' },
  ]

  const groups = groupArtFailuresBySignature(recentFailed)
  assert.ok(groups.length > 0)
  const topGroup = groups[0]!

  // hostbuf group should dominate (3/4) and be sorted first.
  assert.equal(topGroup.signature, 'hostbuf-file-reader-read')
  assert.equal(topGroup.count, 3)
  assert.deepEqual(topGroup.projectSlugs, [
    { projectSlug: 'facet-catalog', count: 2 },
    { projectSlug: 'dream-cycle', count: 1 },
  ])

  const noErrorGroup = groups.find((g) => g.signature === 'no-error-text')
  assert.ok(noErrorGroup)
  assert.equal(noErrorGroup!.count, 1)
  assert.deepEqual(noErrorGroup!.projectSlugs, [
    { projectSlug: 'academy-remix', count: 1 },
  ])

  // Total across all groups equals the input length -- no entry dropped or
  // double-counted.
  const total = groups.reduce((sum, g) => sum + g.count, 0)
  assert.equal(total, recentFailed.length)
}

// A clean render on a different project/workflow (t-069's ArtJob 9009) is
// never conflated with an unrelated project's known-bad signature -- the
// exact manual-scan pain point this task fixes.
{
  const recentFailed = [
    {
      error:
        'ComfyUI reported a workflow error: node 3 (CLIPTextEncode): hostbuf_file_reader_read failed',
      projectSlug: 'dream-cycle',
    },
  ]
  const groups = groupArtFailuresBySignature(recentFailed)
  assert.equal(groups.length, 1)
  assert.equal(groups[0]!.signature, 'hostbuf-file-reader-read')
  // 'academy' (the project a fresh render belongs to) never appears --
  // grouping is purely a function of what's actually in the input.
  assert.ok(
    !groups.some((g) =>
      g.projectSlugs.some((p) => p.projectSlug === 'academy'),
    ),
  )
}

// Empty input -> empty output, not an error.
assert.deepEqual(groupArtFailuresBySignature([]), [])

console.log('verifyArtFailureSignature: all assertions passed')
