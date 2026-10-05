// /utils/scripts/verifyResourceFamily.test.ts
//
// Resource.generation spellings seen in the live catalog's base-model filter
// (2026-10-05), and the family each must browse under. The filter used to list
// these raw, so SD 1.5 alone appeared as "1.5", "SD 1.5" and, filed by folder,
// "ARCHIVE" and "base".
import assert from 'node:assert/strict'
import { resourceFamily } from '../resourceFamily'

const cases: Array<[Parameters<typeof resourceFamily>[0], string]> = [
  [{ generation: '1.5' }, 'sd15'],
  [{ generation: 'SD 1.5' }, 'sd15'],
  [{ generation: 'SDXL 1.0' }, 'sdxl'],
  [{ generation: 'base', localPath: 'SDXL/x.safetensors' }, 'sdxl'],
  [{ generation: 'ARCHIVE', localPath: 'SD15/rev.safetensors' }, 'sd15'],
  [{ generation: 'SDXL', localPath: 'SD15/duchaiten.safetensors' }, 'sd15'],
  [{ generation: 'Pony' }, 'pony'],
  [{ generation: 'Pony', localPath: 'SDXL/p.safetensors' }, 'pony'],
  [{ generation: 'Illustrious' }, 'illustrious'],
  [{ generation: 'NoobAI' }, 'illustrious'],
  [
    {
      generation: 'ARCHIVE',
      localPath: 'Illustrious/illustrij_v21.safetensors',
    },
    'illustrious',
  ],
  [{ generation: 'FLUX' }, 'flux1-dev'],
  [{ generation: 'Flux (from metadata)' }, 'flux1-dev'],
  [{ generation: 'Flux.1 D' }, 'flux1-dev'],
  [{ generation: 'Flux.1 S' }, 'flux1-schnell'],
  [{ generation: 'Flux.1 Kontext' }, 'flux1-kontext'],
  [{ generation: 'Flux.2 D' }, 'flux2'],
  [{ generation: 'Flux.2 Klein 9B' }, 'flux2'],
  [{ generation: 'Krea 2' }, 'krea2'],
  [{ generation: 'ZImageTurbo' }, 'zimage'],
  [{ generation: 'Qwen' }, 'qwen'],
  [{ generation: 'Anima' }, 'anima'],
  [{ generation: 'Hunyuan' }, 'hunyuan'],
  [{ generation: 'Wan Video' }, 'wan'],
  [{ generation: 'Other', localPath: 'Video/Wan/w.safetensors' }, 'wan'],
  [{ generation: 'LTX Video' }, 'ltx'],
  [{ generation: 'Audio' }, 'audio'],
  [{ generation: null, supportedServer: 'SD15' }, 'sd15'],
  [{ generation: 'ARCHIVE' }, 'other'],
  [{ generation: 'base' }, 'other'],
]

for (const [input, expected] of cases) {
  assert.equal(resourceFamily(input), expected, JSON.stringify(input))
}

console.log('verifyResourceFamily: all assertions passed')
