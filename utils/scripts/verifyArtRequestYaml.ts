// utils/scripts/verifyArtRequestYaml.ts
//
// Regression guard for art-generator-connect/t-008.
//
// renderRequestEntry() / appendRequest() must emit block-sequence items whose
// `- ` marker sits at COLUMN 0 with 2-space continuation keys, matching the
// `requests:` list style in conductor's projects/art-prompts.yaml. kind_robots
// PR #84 shipped a version that indented list items 2 spaces, producing YAML
// conductor's PyYAML parser silently could not read — stalling the missing-image
// pipeline. This test asserts the indentation contract so that class of bug
// fails CI here instead of going undetected on the conductor side.
//
// Dependency-free on purpose: pure string assertions, no YAML lib, so it runs
// under bare `tsx` without the Nuxt/Prisma runtime.
//
// Run: npm run test:art-request-yaml   (tsx utils/scripts/verifyArtRequestYaml.ts)

import {
  type ArtQueueEntry,
  appendRequest,
  renderRequestEntry,
} from '../../server/utils/artRequestYaml'

let failures = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function sampleEntry(overrides: Partial<ArtQueueEntry> = {}): ArtQueueEntry {
  return {
    id: 'conductor-packmaker-icon-abc12345',
    source: 'kind-robots-missing-image',
    status: 'pending',
    target_repo: 'silasfelinus/conductor',
    image_path: 'projects/images/packmaker-icon.webp',
    source_url: '/images/packmaker-icon.webp',
    page_url: 'https://kindrobots.org/projects/packmaker',
    variant: 'icon',
    size: '256x256',
    label: 'Packmaker',
    prompt: 'flat minimal app icon for Packmaker,\nbold clean vector shapes, no text',
    ...overrides,
  }
}

// --- renderRequestEntry: column-0 list marker + 2-space continuation keys ----
console.log('renderRequestEntry indentation')
{
  const rendered = renderRequestEntry(sampleEntry())
  const lines = rendered.split('\n')

  check('first line is the list marker at column 0', lines[0]!.startsWith('- id: '), lines[0])
  check('no line contains a tab character', !rendered.includes('\t'))

  // Every non-first, non-empty line is either a 2-space key or the 4-space
  // folded-scalar body line for `prompt: >`. Nothing may sit at column 0
  // except the leading `- ` marker, and no key may be indented 4+ spaces.
  let sawFoldedHeader = false
  let indentationOk = true
  let badLine = ''
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!
    if (line.trim() === '') continue
    if (/^ {2}prompt: >$/.test(line)) {
      sawFoldedHeader = true
      continue
    }
    // The single folded body line sits at 4 spaces directly after the header.
    if (sawFoldedHeader && /^ {4}\S/.test(line)) {
      sawFoldedHeader = false
      continue
    }
    if (!/^ {2}\S/.test(line)) {
      indentationOk = false
      badLine = line
      break
    }
  }
  check('every continuation key is indented exactly 2 spaces', indentationOk, badLine)
  check('prompt renders as a folded scalar (`prompt: >`)', rendered.includes('\n  prompt: >\n    '))
  check('prompt folds newlines into a single line', !/\n {4}\S.*\n {4}\S/.test(rendered))
}

// --- optional fields omitted when empty -------------------------------------
console.log('optional field handling')
{
  const minimal = renderRequestEntry(
    sampleEntry({ page_url: '', size: '', label: '' }),
  )
  check('page_url omitted when empty', !minimal.includes('page_url:'))
  check('size omitted when empty', !minimal.includes('size:'))
  check('label omitted when empty', !minimal.includes('label:'))
  check('required keys still present', minimal.includes('  image_path: '))
}

// --- appendRequest: items land at column 0 for every seed shape --------------
console.log('appendRequest into each requests: shape')
{
  const entry = sampleEntry()
  const marker = `\n- id: ${JSON.stringify(entry.id)}`

  const intoInline = appendRequest('metadata: 1\nrequests: []\n', entry)
  check('requests: [] -> item at column 0', intoInline.includes(marker), intoInline)
  check('requests: [] -> no indented list marker', !/\n {1,}- id:/.test(intoInline))

  const intoEmpty = appendRequest('metadata: 1\nrequests:\n', entry)
  check('requests: (empty) -> item at column 0', intoEmpty.includes(marker), intoEmpty)

  const intoBare = appendRequest('metadata: 1\n', entry)
  check('no requests: key -> appends requests: block at column 0', /\nrequests:\n- id:/.test(intoBare), intoBare)

  // idempotency: same entry twice must not duplicate (dedup by id / image_path)
  const once = appendRequest('requests: []\n', entry)
  const twice = appendRequest(once, entry)
  check('appendRequest is idempotent by id', once === twice)
  check(
    'appendRequest is idempotent by image_path',
    appendRequest(once, sampleEntry({ id: 'different-id-99999999' })) === once,
  )
}

console.log('')
if (failures > 0) {
  console.error(`art-request YAML contract: ${failures} check(s) FAILED`)
  process.exit(1)
}
console.log('art-request YAML contract: all checks passed')
