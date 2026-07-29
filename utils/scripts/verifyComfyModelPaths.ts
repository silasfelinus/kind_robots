// /utils/scripts/verifyComfyModelPaths.ts
//
// Guard: no hardcoded model/LoRA/checkpoint filename in a Comfy workflow may
// contain a backslash. ComfyUI matches subfolder paths with forward slashes on
// every OS (even Windows), so a literal `ltx\ltx-...safetensors` is rejected
// with value_not_in_list. This exact bug shipped, got fixed, then regressed
// when the fix was dropped — this test keeps it dead.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const comfyDir = resolve(scriptDir, '../../server/api/comfy')

// Keys whose string values are Comfy filename combos (validated by ComfyUI).
const NAME_KEYS = [
  'ckpt_name',
  'lora_name',
  'unet_name',
  'vae_name',
  'clip_name',
  'clip_name1',
  'clip_name2',
  'text_encoder',
]
// A single-quoted literal that carries a backslash, e.g. 'ltx\\ltx-....'
// (one backslash in the actual string == '\\' in TS source).
const BACKSLASH_LITERAL = /'[^']*\\\\[^']*'/

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (full.endsWith('.ts') && !full.endsWith('.test.ts')) out.push(full)
  }
  return out
}

const offenders: string[] = []
for (const file of walk(comfyDir)) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, index) => {
    if (!NAME_KEYS.some((key) => line.includes(`${key}:`) || line.includes(`${key} =`))) {
      // Also catch exported constants like `LTX_CHECKPOINT = 'ltx\\...'`.
      if (!/[A-Z_]+(?:CHECKPOINT|LORA|MODEL|UNET|VAE|ENCODER)\s*=/.test(line)) return
    }
    if (BACKSLASH_LITERAL.test(line)) {
      offenders.push(`${relative(comfyDir, file)}:${index + 1}  ${line.trim()}`)
    }
  })
}

assert.equal(
  offenders.length,
  0,
  `Comfy model names must use forward slashes, not backslashes:\n${offenders.join('\n')}`,
)

console.log('✅ verifyComfyModelPaths: no backslash model paths in server/api/comfy')
