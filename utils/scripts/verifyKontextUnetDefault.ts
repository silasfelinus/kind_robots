// /utils/scripts/verifyKontextUnetDefault.ts
//
// Guard: no Kontext graph builder may default to the GGUF Kontext UNet.
//
// flux1-kontext-dev-Q5_K_M.gguf renders pure corrupted static regardless of
// prompt, T5 encoder, or sampler settings -- confirmed by Silas's own direct
// A/B on the render worker, 2026-09-22 ("if i just switch the gguf for
// safetensors, it works, no static"), comparing this exact GGUF UNet against
// flux1-dev-kontext_fp8_scaled.safetensors on the same box (coloring-book/t-039).
//
// This bug's own history (the sibling T5-encoder regression, #1870 -> #2750 ->
// #2977) shows the same defect landing back in a Kontext graph builder more
// than once, silently, because nothing pinned the fix. This scans the whole
// kontext/ directory rather than asserting about three known files, same as
// verifyKontextTextEncoder.ts.
//
// The `unetName`/`unetWeightDtype` override plumbing (kontext/utils/workflow.ts)
// is intentionally still generic -- it must keep accepting a `.gguf` name for
// future bisection -- so this guard only forbids the specific broken checkpoint
// as a hardcoded/default value, not the override mechanism itself.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const kontextDir = resolve(scriptDir, '../../server/api/comfy/kontext')

const BROKEN_UNET = 'flux1-kontext-dev-Q5_K_M.gguf'

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

const hardcodedBrokenUnet: string[] = []

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('//')) return
    if (line.includes(BROKEN_UNET)) {
      hardcodedBrokenUnet.push(
        `${relative(kontextDir, file)}:${index + 1}  ${trimmed}`,
      )
    }
  })
}

assert.equal(
  hardcodedBrokenUnet.length,
  0,
  `Kontext graph builders must not default/hardcode the ${BROKEN_UNET} UNet -- it renders ` +
    'pure corrupted static regardless of prompt/encoder/sampler settings (coloring-book/t-039, ' +
    `confirmed by direct A/B 2026-09-22):\n${hardcodedBrokenUnet.join('\n')}`,
)

console.log(
  `✅ verifyKontextUnetDefault: ${files.length} file(s) scanned under kontext/, ` +
    `no hardcoded/default reference to the broken GGUF UNet checkpoint`,
)
