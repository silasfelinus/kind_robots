// Contract test: everything Kind Robots generates runs on Comfy.
//
// Silas, 2026-08-09, verbatim: "Nothing should be running a1111. We support it
// as in users can add an a1111 server, but it's not used by me to build the
// site. We are 100% comfy at this point ... any (all) gen tasks should be comfy,
// and comfy should generally be the default (to be more specific, we should
// have krea 2 with comfy, cfg 1, 8 steps, random seed, as the hard coded
// defaults for any txt2img gen, and sdxl img2img with sensible defaults and
// random seed for anything using img2img)."
//
// The distinction this file has to hold is narrow and easy to lose: A1111
// remains a SUPPORTED engine — a user who adds their own Automatic1111 server
// can still name it, and /api/art/generate still dials it — but nothing we
// build for the site may choose it, and nothing may choose it by default.
//
// It was not academic. Resource previews hardcoded `engine: 'A1111'` and every
// one of them died on a refused connection (ArtJob 8116, 2026-08-09: three
// attempts, two minutes, dead), and /api/art/enqueue defaulted an omitted
// engine to a1111, so "just enqueue this" meant "enqueue something that cannot
// render".
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildKrea2WorkflowFromRequest,
  KREA2_DEFAULT_CFG,
  KREA2_DEFAULT_STEPS,
} from '../../server/api/comfy/krea2/utils/workflow'
import {
  buildDefaultComfyWorkflow,
  buildSdxlImg2ImgWorkflow,
  patchComfyWorkflow,
} from '../../server/api/comfy/sdxl/utils/workflow'

type Nodes = Record<
  string,
  { class_type?: string; inputs?: Record<string, unknown> }
>

/**
 * Source with comments removed, so a prose mention of the thing being banned
 * does not read as the thing itself. The first version of this file failed on
 * its own explanation of why A1111 was removed.
 */
function code(path: string): string {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')
}

function sampler(workflow: unknown): Record<string, unknown> {
  const nodes = workflow as Nodes
  const node = Object.values(nodes).find((n) => n.class_type === 'KSampler')
  assert.ok(node?.inputs, 'workflow must contain a KSampler')
  return node.inputs
}

// ── txt2img: krea2, cfg 1, 8 steps ──────────────────────────────────────────

assert.equal(KREA2_DEFAULT_STEPS, 8, 'krea2 txt2img default is 8 steps')
assert.equal(KREA2_DEFAULT_CFG, 1, 'krea2 txt2img default is cfg 1')

const krea2 = sampler(
  buildKrea2WorkflowFromRequest({ prompt: 'a brass orrery on a workbench' })
    .workflow,
)
assert.equal(
  krea2.steps,
  8,
  'an unspecified krea2 render must execute at 8 steps',
)
assert.equal(krea2.cfg, 1, 'an unspecified krea2 render must execute at cfg 1')

// ── Random seed, everywhere, always ─────────────────────────────────────────
//
// "Random" is asserted as: two builds of an identical request differ, and
// neither emits the literal -1 that ComfyUI would take at face value. A fixed
// default seed is invisible — the image looks fine, it is just the SAME image
// every time, and "generate another" silently does nothing.

function seedOf(workflow: unknown): number {
  const value = sampler(workflow).seed
  assert.equal(typeof value, 'number', 'seed must be a resolved number')
  return value as number
}

for (const [label, build] of [
  [
    'krea2 txt2img',
    () => buildKrea2WorkflowFromRequest({ prompt: 'a lighthouse' }).workflow,
  ],
  [
    'comfy named-checkpoint txt2img',
    () =>
      buildDefaultComfyWorkflow({
        prompt: 'a lighthouse',
        cfgValue: 6,
        checkpoint: 'someCheckpoint.safetensors',
      }),
  ],
  [
    'sdxl img2img',
    () =>
      buildSdxlImg2ImgWorkflow({
        prompt: 'a lighthouse',
        imageName: 'source.png',
        checkpoint: 'someCheckpoint.safetensors',
      }).workflow,
  ],
] as Array<[string, () => unknown]>) {
  const first = seedOf(build())
  const second = seedOf(build())
  assert.notEqual(first, -1, `${label} must not emit a literal -1 seed`)
  assert.ok(first >= 0, `${label} seed must be non-negative`)
  assert.notEqual(
    first,
    second,
    `${label} must pick a fresh random seed per build`,
  )
}

// Explicit seeds are honoured (checked directly rather than inside the loop).
assert.equal(
  seedOf(buildKrea2WorkflowFromRequest({ prompt: 'x', seed: 4242 }).workflow),
  4242,
  'an explicit krea2 seed must be preserved',
)
assert.equal(
  seedOf(
    buildDefaultComfyWorkflow({
      prompt: 'x',
      cfgValue: 6,
      checkpoint: 'c.safetensors',
      seed: 4242,
    }),
  ),
  4242,
  'an explicit txt2img seed must be preserved',
)
assert.equal(
  seedOf(
    buildSdxlImg2ImgWorkflow({
      prompt: 'x',
      imageName: 's.png',
      checkpoint: 'c.safetensors',
      seed: 4242,
    }).workflow,
  ),
  4242,
  'an explicit img2img seed must be preserved',
)

// The patcher must not undo the builder. sdxl/generate.post.ts calls
// patchComfyWorkflow immediately after buildDefaultComfyWorkflow with the same
// input, so a -1 here would overwrite the seed that was just resolved — the
// builder fix alone would have been invisible on that route.
const patched = buildDefaultComfyWorkflow({
  prompt: 'a lighthouse',
  cfgValue: 6,
  checkpoint: 'c.safetensors',
})
patchComfyWorkflow(patched, {
  prompt: 'a lighthouse',
  cfgValue: 6,
  checkpoint: 'c.safetensors',
  seed: null,
})
assert.notEqual(
  seedOf(patched),
  -1,
  'patchComfyWorkflow must resolve an unspecified seed, not write -1 over it',
)
assert.ok(seedOf(patched) >= 0)

patchComfyWorkflow(patched, {
  prompt: 'a lighthouse',
  cfgValue: 6,
  checkpoint: 'c.safetensors',
  seed: 99,
})
assert.equal(seedOf(patched), 99, 'an explicit seed still wins in the patcher')

// ── img2img: sdxl, sensible defaults ────────────────────────────────────────

const img2img = buildSdxlImg2ImgWorkflow({
  prompt: 'restyle this',
  imageName: 'source.png',
  checkpoint: 'someCheckpoint.safetensors',
})
const i2i = sampler(img2img.workflow)
assert.equal(i2i.steps, 8, 'sdxl img2img default steps')
assert.equal(i2i.cfg, 2, 'sdxl img2img default cfg')
assert.equal(i2i.sampler_name, 'dpmpp_sde', 'sdxl img2img default sampler')
assert.equal(i2i.scheduler, 'karras', 'sdxl img2img default scheduler')
assert.ok(
  typeof img2img.denoise === 'number' &&
    img2img.denoise > 0 &&
    img2img.denoise < 1,
  'img2img denoise must leave some of the original image intact',
)

// ── The named-checkpoint lane carries its LoRA ──────────────────────────────
//
// Resource previews are the reason this lane exists, and half of them are for
// a LoRA. Without the LoraLoader the preview renders the base checkpoint —
// a plausible image of the wrong thing, which is worse than an error.

const withLora = buildDefaultComfyWorkflow({
  prompt: 'showcase',
  cfgValue: 6,
  checkpoint: 'base.safetensors',
  loraName: 'style.safetensors',
  loraStrength: 1,
}) as Nodes
const loader = Object.values(withLora).find(
  (n) => n.class_type === 'LoraLoader',
)
assert.ok(loader, 'a named loraName must add a LoraLoader node')
assert.equal(loader.inputs?.lora_name, 'style.safetensors')
assert.deepEqual(
  sampler(withLora).model,
  ['10', 0],
  'the KSampler must take its model from the LoRA, not the bare checkpoint',
)
const positive = withLora['2']
assert.deepEqual(
  positive?.inputs?.clip,
  ['10', 1],
  'text encoding must take CLIP from the LoRA too',
)

const withoutLora = buildDefaultComfyWorkflow({
  prompt: 'showcase',
  cfgValue: 6,
  checkpoint: 'base.safetensors',
}) as Nodes
assert.ok(
  !Object.values(withoutLora).some((n) => n.class_type === 'LoraLoader'),
  'no LoRA node when none was asked for',
)
assert.deepEqual(sampler(withoutLora).model, ['1', 0])

// ── No site-building path may choose A1111 ──────────────────────────────────

const enqueue = code('server/api/art/enqueue.post.ts')
assert.ok(
  enqueue.includes("const DEFAULT_ENQUEUE_ENGINE: EnqueueEngine = 'krea2'"),
  'the enqueue default engine must be krea2',
)
assert.ok(
  !/String\(value \|\| 'a1111'\)/.test(enqueue),
  'enqueue must not fall back to a1111 for an omitted engine',
)
assert.ok(
  enqueue.includes("engine === 'a1111'"),
  'a1111 must remain a VALID engine — users can add their own A1111 server',
)

// Every ArtJob row we create for the site is COMFY. A1111 rows are only ever
// produced by a user naming that engine explicitly.
for (const file of [
  'server/api/resources/[id]/generate-preview.post.ts',
  'utils/scripts/enqueueTwistedFairyTalesArtPrompts.ts',
  'utils/scripts/migratePromptsToArtJobs.ts',
]) {
  const source = code(file)
  assert.ok(
    !/engine:\s*'A1111'/.test(source),
    `${file} must not create A1111 ArtJob rows — nothing on the relay serves A1111`,
  )
  assert.ok(
    /engine:\s*'COMFY'/.test(source),
    `${file} must create COMFY ArtJob rows`,
  )
}

// The synchronous relay-only surface is the ONE place A1111 survives on
// purpose: it dials a server the user added, and asserts as much.
const directRender = code('server/api/art/generate.post.ts')
assert.ok(
  directRender.includes('assertA1111Server'),
  'the direct A1111 render surface is user-server-only and stays supported',
)

console.log(
  'Comfy-only generation contract OK: krea2 8/1 txt2img, sdxl img2img, ' +
    'random seeds everywhere, no site path on A1111.',
)
