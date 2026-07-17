// /utils/scripts/verifyPackScaffoldExtraction.test.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

import ts from 'typescript'

const storeSource = readFileSync(
  new URL('../../stores/packStore.ts', import.meta.url),
  'utf8',
)

// The schema validator + its constants, extracted the same way
// verifyPackManifest.test.ts does — generatePackScaffold's extraction slice
// below calls validatePackManifest, so it needs to be in scope too.
const validatorStart = storeSource.indexOf('const ITEM_SHAPES')
const validatorEnd = storeSource.indexOf('export const usePackStore')
assert.ok(validatorStart >= 0, 'packStore.ts must define ITEM_SHAPES')
assert.ok(
  validatorEnd > validatorStart,
  'packStore.ts must export usePackStore',
)
const validatorSource = storeSource
  .slice(validatorStart, validatorEnd)
  .replace(
    'export function validatePackManifest',
    'function validatePackManifest',
  )

// generatePackScaffold's JSON-extraction/validation segment: fence/prose
// tolerant brace-slicing, JSON.parse, then schema validation. Bounded by
// unique markers — this is the pure logic (no fetch/store dependency) the
// success/failure branches hinge on; the final uniquePackId() step is left
// out since it reads live store state and isn't part of what this test
// covers (packmaker/t-010 kaizen: test the extraction path itself).
const extractionStart = storeSource.indexOf("const start = raw.indexOf('{')")
const extractionEndMarker =
  'The generated manifest failed validation (${problem}) — try again.`,'
const extractionEndIndex = storeSource.indexOf(extractionEndMarker)
assert.ok(
  extractionStart >= 0,
  'packStore.ts must define the scaffold extraction start',
)
assert.ok(
  extractionEndIndex > extractionStart,
  'packStore.ts must define the scaffold extraction failure message',
)
const extractionSource = storeSource.slice(
  extractionStart,
  extractionEndIndex + extractionEndMarker.length,
)

const compiled = ts.transpileModule(
  `${validatorSource}
function extractManifest(raw) {
  ${extractionSource}
      }
    }
  return { success: true, parsed }
}
extractionResult = extractManifest(raw)`,
  {
    compilerOptions: {
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText

type ExtractionResult =
  { success: true; parsed: unknown } | { success: false; message: string }

function extract(raw: string): ExtractionResult {
  const context: { raw: string; extractionResult: ExtractionResult | null } = {
    raw,
    extractionResult: null,
  }
  runInNewContext(compiled, context)
  // The vm context is a separate realm — its objects have a different
  // Object.prototype, which trips up assert.deepEqual on the `parsed` payload
  // even though the data is structurally identical. Round-trip through JSON
  // to normalize back into this realm's plain objects before comparing.
  return JSON.parse(
    JSON.stringify(context.extractionResult),
  ) as ExtractionResult
}

const validManifest = {
  schemaVersion: 1,
  id: 'test-pack',
  title: 'Test Pack',
  description: 'A focused scaffold-extraction fixture.',
  owner: 'silas',
  visibility: 'draft',
  price: { hook: 'dlc' },
  items: [
    {
      id: 'test-location',
      type: 'location',
      itemShape: 'dream',
      draftPayload: {
        title: 'Test Location',
        description: 'A place used only by this regression test.',
      },
    },
  ],
}

// Plain valid JSON, no surrounding prose or fences.
assert.deepEqual(extract(JSON.stringify(validManifest)), {
  success: true,
  parsed: validManifest,
})

// Markdown-fenced JSON with stray prose — the naive first-'{'/last-'}' slice
// should still recover the object cleanly.
const fenced = `Sure, here's the manifest:\n\`\`\`json\n${JSON.stringify(validManifest)}\n\`\`\`\nLet me know if you'd like changes.`
assert.deepEqual(extract(fenced), { success: true, parsed: validManifest })

// No JSON object anywhere in the response.
assert.deepEqual(extract('I cannot help with that request.'), {
  success: false,
  message: 'The model did not return JSON.',
})

// A '{'/'}' pair is present but the sliced text isn't valid JSON.
assert.deepEqual(extract('{ this is not json }'), {
  success: false,
  message: 'The generated manifest was not valid JSON — try again.',
})

// Valid JSON that fails schema validation (missing required "title").
const invalidManifest = { ...validManifest, title: '' }
assert.deepEqual(extract(JSON.stringify(invalidManifest)), {
  success: false,
  message:
    'The generated manifest failed validation (Pack "title" is required.) — try again.',
})

// Trailing prose containing a stray '}' after the fence should not corrupt
// the slice, since the object's own closing brace is JSON.stringify's last
// character and comes before any prose brace.
const fencedWithTrailingBrace = `\`\`\`json\n${JSON.stringify(validManifest)}\n\`\`\`\n(this is a note in braces {like this})`
assert.deepEqual(extract(fencedWithTrailingBrace), {
  success: false,
  message: 'The generated manifest was not valid JSON — try again.',
})

console.log(
  "Pack scaffold extraction verified from packStore.ts source: recovers valid JSON from plain and markdown-fenced LLM responses, and reports the right message for no-JSON, invalid-JSON, and schema-invalid cases — including the naive brace-slice's known limitation with trailing prose braces.",
)
