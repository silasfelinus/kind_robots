// /utils/scripts/verifyArtArchiveScanner.test.ts
//
// Self-test for the Art Archive scanner/metadata modules (art-archive/t-004):
// A1111 `parameters` parsing, a minimal ComfyUI prompt-graph parse, format
// detection for non-PNG files, and the scanner's root-confinement guard
// (a symlink planted inside the scan root that points outside it must be
// reported as an issue and excluded from the results, never followed).
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  contentHashOf,
  extractArchiveImageMetadata,
  parseA1111Parameters,
  parseComfyPromptGraph,
} from '../../server/utils/artArchiveMetadata'
import { scanArchiveRoot } from '../../server/utils/artArchiveScanner'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  return Buffer.concat([length, Buffer.from(type, 'ascii'), data, Buffer.alloc(4)])
}

function textChunk(keyword: string, text: string): Buffer {
  return pngChunk('tEXt', Buffer.concat([Buffer.from(`${keyword}\0`, 'latin1'), Buffer.from(text, 'latin1')]))
}

function fakePng(chunks: Buffer[]): Buffer {
  return Buffer.concat([PNG_SIGNATURE, pngChunk('IHDR', Buffer.alloc(13)), ...chunks, pngChunk('IEND', Buffer.alloc(0))])
}

const A1111_TEXT =
  'a cozy library, warm lighting, <lora:CozyStyle:0.8>\n' +
  'Negative prompt: worst quality, blurry\n' +
  'Steps: 24, Sampler: DPM++ 2M Karras, CFG scale: 6.5, Seed: 918273645, ' +
  'Size: 768x1152, Model hash: abcd1234, Model: someCheckpointV2, Version: v1.7.0'

function testA1111Parsing() {
  const parsed = parseA1111Parameters(A1111_TEXT)
  assert.equal(parsed.prompt, 'a cozy library, warm lighting, <lora:CozyStyle:0.8>')
  assert.equal(parsed.negativePrompt, 'worst quality, blurry')
  assert.equal(parsed.steps, 24)
  assert.equal(parsed.sampler, 'DPM++ 2M Karras')
  assert.equal(parsed.cfg, 6.5)
  assert.equal(parsed.seed, 918273645)
  assert.equal(parsed.checkpoint, 'someCheckpointV2')
  assert.equal(parsed.checkpointHash, 'abcd1234')
  assert.equal(parsed.size, '768x1152')
  assert.deepEqual(parsed.loraTokens, [{ name: 'CozyStyle', weight: 0.8 }])
  console.log('verifyArtArchiveScanner: A1111 parameters parsing passed')
}

function testPngExtractionRoundTrip() {
  const buffer = fakePng([textChunk('parameters', A1111_TEXT)])
  const metadata = extractArchiveImageMetadata(buffer, 'sample.png')
  assert.equal(metadata.format, 'png')
  assert.ok(metadata.supported)
  if (metadata.format === 'png') {
    assert.equal(metadata.rawTextChunks.parameters, A1111_TEXT)
    assert.ok(metadata.a1111)
    assert.equal(metadata.a1111?.checkpoint, 'someCheckpointV2')
    assert.equal(metadata.comfy, null)
  }
  console.log('verifyArtArchiveScanner: PNG tEXt chunk extraction passed')
}

const COMFY_GRAPH = {
  '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'realisticVision_v6.safetensors' } },
  '2': { class_type: 'LoraLoader', inputs: { lora_name: 'DetailTweaker.safetensors', strength_model: 0.6, model: ['1', 0] } },
  '3': { class_type: 'CLIPTextEncode', inputs: { text: 'a golden retriever in a meadow' } },
  '4': { class_type: 'CLIPTextEncode', inputs: { text: 'low quality, extra limbs' } },
  '5': {
    class_type: 'KSampler',
    inputs: {
      seed: 42,
      steps: 30,
      cfg: 7.5,
      sampler_name: 'euler',
      positive: ['3', 0],
      negative: ['4', 0],
      model: ['2', 0],
    },
  },
}

function testComfyGraphParsing() {
  const parsed = parseComfyPromptGraph(JSON.stringify(COMFY_GRAPH))
  assert.ok(parsed)
  assert.equal(parsed?.checkpoint, 'realisticVision_v6.safetensors')
  assert.deepEqual(parsed?.loraTokens, [{ name: 'DetailTweaker.safetensors', weight: 0.6 }])
  assert.equal(parsed?.seed, 42)
  assert.equal(parsed?.steps, 30)
  assert.equal(parsed?.cfg, 7.5)
  assert.equal(parsed?.sampler, 'euler')
  assert.equal(parsed?.positivePrompt, 'a golden retriever in a meadow')
  assert.equal(parsed?.negativePrompt, 'low quality, extra limbs')
  assert.deepEqual(parsed?.otherTexts, [])
  console.log('verifyArtArchiveScanner: ComfyUI prompt-graph parsing passed')
}

function testNonPngFormatDetection() {
  const jpegLike = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])
  const metadata = extractArchiveImageMetadata(jpegLike, 'photo.jpg')
  assert.equal(metadata.format, 'jpeg')
  assert.equal(metadata.supported, false)
  console.log('verifyArtArchiveScanner: non-PNG format detection passed')
}

function testContentHash() {
  const buffer = Buffer.from('hello archive')
  const expected = createHash('sha256').update(buffer).digest('hex')
  assert.equal(contentHashOf(buffer), expected)
  console.log('verifyArtArchiveScanner: content hash passed')
}

async function testScannerRootConfinement() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-scan-'))
  const outside = await mkdtemp(path.join(os.tmpdir(), 'art-archive-outside-'))
  try {
    await mkdir(path.join(root, 'nested', 'deeper'), { recursive: true })
    await writeFile(path.join(root, 'nested', 'deeper', 'one.png'), fakePng([textChunk('parameters', A1111_TEXT)]))
    await writeFile(path.join(root, 'ignored.txt'), 'not an image')
    await writeFile(path.join(outside, 'secret.png'), fakePng([]))
    await symlink(path.join(outside, 'secret.png'), path.join(root, 'escape.png'))

    const result = await scanArchiveRoot(root)

    assert.equal(result.files.length, 1, 'only the real nested PNG should be indexed')
    const [entry] = result.files
    assert.equal(entry?.relativePath, 'nested/deeper/one.png')
    assert.equal(entry?.parentFolder, 'nested/deeper')
    assert.ok(entry?.contentHash)
    assert.equal(entry?.metadata.format, 'png')

    const escaped = result.issues.find((issue) => issue.reason === 'escaped-root')
    assert.ok(escaped, 'the symlink pointing outside the root must be flagged, not followed')

    console.log('verifyArtArchiveScanner: root-confinement + recursive scan passed')
  } finally {
    await rm(root, { recursive: true, force: true })
    await rm(outside, { recursive: true, force: true })
  }
}

async function run() {
  testA1111Parsing()
  testPngExtractionRoundTrip()
  testComfyGraphParsing()
  testNonPngFormatDetection()
  testContentHash()
  await testScannerRootConfinement()
  console.log('verifyArtArchiveScanner: all assertions passed')
}

run()
