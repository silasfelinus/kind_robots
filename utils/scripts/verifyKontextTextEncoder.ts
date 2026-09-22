// /utils/scripts/verifyKontextTextEncoder.ts
//
// Guard: no Kontext graph may load the ORDINARY Flux text-encoder pair.
//
// Kontext is the one Flux-family lane where the GGUF T5 does not work. #1870
// (2026-08-14) switched every Flux workflow to t5-v1_1-xxl-encoder-Q5_K_S.gguf
// for the 1.73 GB VRAM win; on the image-edit path it renders pure static.
// #2750 (2026-09-15) carved Kontext back out to
// t5xxl_fp8_e4m3fn_scaled.safetensors -- but only in the QUEUE builder
// (kontext/utils/workflow.ts) and artJobRetry's normalizer. The two direct
// routes, kontext/generate.post.ts and kontext/kombine.post.ts, kept calling
// fluxDualClipLoaderNode() and went on building Kontext graphs around the
// encoder that had just been removed for producing static.
//
// The failure is silent in the worst way: the graph validates, the job runs to
// completion, and the render comes back as well-formed noise. Nothing errors,
// so nothing points at the encoder.
//
// fluxTextEncoders.ts's own header already warns about this shape -- "Retry
// normalization must use the same engine-specific choice as fresh jobs or a
// healthy Kontext job can be silently rewritten back onto the broken encoder
// path." The same sentence applies to any other caller, which is why this is a
// scan of the directory rather than an assertion about three known files.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const kontextDir = resolve(scriptDir, '../../server/api/comfy/kontext')

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (full.endsWith('.ts') && !full.endsWith('.test.ts')) out.push(full)
  }
  return out
}

const files = walk(kontextDir)
assert.ok(files.length > 0, `no .ts files found under ${kontextDir}`)

// 1. Nothing under kontext/ may reach for the ordinary Flux encoder pair.
const wrongLoader: string[] = []
// 2. Nor may it hardcode the GGUF T5 by name, bypassing the module entirely.
const hardcodedGgufT5: string[] = []

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, index) => {
    const where = `${relative(kontextDir, file)}:${index + 1}  ${line.trim()}`
    if (/\bfluxDualClipLoaderNode\b|\bFLUX_T5_ENCODER\b/.test(line)) {
      wrongLoader.push(where)
    }
    if (/t5-v1_1-xxl-encoder/.test(line) && !line.trim().startsWith('//')) {
      hardcodedGgufT5.push(where)
    }
  })
}

assert.equal(
  wrongLoader.length,
  0,
  'Kontext graphs must use kontextDualClipLoaderNode()/KONTEXT_T5_ENCODER, not the ' +
    'ordinary Flux pair — the GGUF T5 renders pure static on the image-edit path ' +
    `(#1870 introduced it, #2750 carved Kontext back out):\n${wrongLoader.join('\n')}`,
)

assert.equal(
  hardcodedGgufT5.length,
  0,
  'Kontext graphs must not name the GGUF T5 encoder directly — it renders pure ' +
    `static on the image-edit path:\n${hardcodedGgufT5.join('\n')}`,
)

// Every builder that encodes a Kontext prompt must actually pull in the Kontext
// pair. Without this half, deleting the loader line altogether would pass.
const builders = files.filter((file) =>
  /CLIPTextEncode/.test(readFileSync(file, 'utf8')),
)
assert.ok(
  builders.length > 0,
  'expected at least one Kontext graph builder containing a CLIPTextEncode node',
)

// The CALL, not the import. Deleting the loader line while leaving
// `import { kontextDualClipLoaderNode }` in place is a real regression shape,
// and matching the bare identifier anywhere in the file would let it through.
function callsKontextLoader(file: string): boolean {
  return readFileSync(file, 'utf8')
    .split('\n')
    .some(
      (line) =>
        !/^\s*import\b/.test(line) &&
        !line.trim().startsWith('//') &&
        /kontextDualClipLoaderNode\s*\(/.test(line),
    )
}

const missingKontextLoader = builders
  .filter((file) => !callsKontextLoader(file))
  .map((file) => relative(kontextDir, file))

assert.equal(
  missingKontextLoader.length,
  0,
  'these Kontext graph builders encode a prompt but never load the Kontext text ' +
    `encoder pair:\n${missingKontextLoader.join('\n')}`,
)

console.log(
  `✅ verifyKontextTextEncoder: ${builders.length} Kontext graph builder(s) load the Kontext T5 pair; ` +
    `${files.length} file(s) scanned, no ordinary-Flux encoder references`,
)
