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
import { ARCHIVE_TRASH_FOLDER } from '../../server/utils/artArchiveFileOps'

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
  assert.equal(metadata.supported, false, 'a JPEG with no EXIF/XMP/COM segments carries nothing to report')
  console.log('verifyArtArchiveScanner: non-PNG format detection passed')
}

/** Builds a minimal TIFF/EXIF buffer with an ImageDescription and a UserComment. */
function buildExifTiff(imageDescription: string, userComment: string): Buffer {
  const descBytes = Buffer.from(`${imageDescription}\0`, 'latin1')
  const ucHeader = Buffer.from('ASCII\0\0\0', 'latin1') // exactly 8 bytes, per the EXIF UserComment header
  const ucBytes = Buffer.concat([ucHeader, Buffer.from(userComment, 'latin1')])

  const OFFSET_DESC = 56
  const OFFSET_UC = OFFSET_DESC + descBytes.length
  const buf = Buffer.alloc(OFFSET_UC + ucBytes.length)

  buf.write('II', 0, 'latin1')
  buf.writeUInt16LE(0x002a, 2)
  buf.writeUInt32LE(8, 4) // IFD0 offset

  buf.writeUInt16LE(2, 8) // IFD0: 2 entries
  buf.writeUInt16LE(0x010e, 10) // ImageDescription
  buf.writeUInt16LE(2, 12) // ASCII
  buf.writeUInt32LE(descBytes.length, 14)
  buf.writeUInt32LE(OFFSET_DESC, 18)
  buf.writeUInt16LE(0x8769, 22) // ExifIFDPointer
  buf.writeUInt16LE(4, 24) // LONG
  buf.writeUInt32LE(1, 26)
  buf.writeUInt32LE(38, 30) // Exif sub-IFD offset
  buf.writeUInt32LE(0, 34) // no next IFD

  buf.writeUInt16LE(1, 38) // Exif sub-IFD: 1 entry
  buf.writeUInt16LE(0x9286, 40) // UserComment
  buf.writeUInt16LE(7, 42) // UNDEFINED
  buf.writeUInt32LE(ucBytes.length, 44)
  buf.writeUInt32LE(OFFSET_UC, 48)
  buf.writeUInt32LE(0, 52) // no next IFD

  descBytes.copy(buf, OFFSET_DESC)
  ucBytes.copy(buf, OFFSET_UC)
  return buf
}

function jpegSegment(marker: number, payload: Buffer): Buffer {
  const length = Buffer.alloc(2)
  length.writeUInt16BE(payload.length + 2, 0)
  return Buffer.concat([Buffer.from([0xff, marker]), length, payload])
}

function fakeJpeg(segments: Buffer[]): Buffer {
  return Buffer.concat([Buffer.from([0xff, 0xd8]), ...segments, Buffer.from([0xff, 0xda])])
}

function testJpegExifAndCommentExtraction() {
  const tiff = buildExifTiff('a legacy description', 'hello from user comment')
  const app1 = jpegSegment(0xe1, Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]))
  const com = jpegSegment(0xfe, Buffer.from('legacy comment text', 'latin1'))
  const metadata = extractArchiveImageMetadata(fakeJpeg([app1, com]), 'legacy.jpg')

  assert.equal(metadata.format, 'jpeg')
  assert.ok(metadata.supported)
  if (metadata.format === 'jpeg' && metadata.supported) {
    assert.equal(metadata.exifImageDescription, 'a legacy description')
    assert.equal(metadata.exifUserComment, 'hello from user comment')
    assert.equal(metadata.xmp, null)
    assert.deepEqual(metadata.comments, ['legacy comment text'])
  }
  console.log('verifyArtArchiveScanner: JPEG EXIF + COM extraction passed')
}

function riffChunk(fourCC: string, data: Buffer): Buffer {
  const size = Buffer.alloc(4)
  size.writeUInt32LE(data.length, 0)
  const padded = data.length % 2 === 1 ? Buffer.concat([data, Buffer.from([0])]) : data
  return Buffer.concat([Buffer.from(fourCC, 'ascii'), size, padded])
}

function fakeWebp(chunks: Buffer[]): Buffer {
  const body = Buffer.concat(chunks)
  const header = Buffer.alloc(12)
  header.write('RIFF', 0, 'ascii')
  header.writeUInt32LE(4 + body.length, 4)
  header.write('WEBP', 8, 'ascii')
  return Buffer.concat([header, body])
}

function testWebpExifAndXmpExtraction() {
  const tiff = buildExifTiff('a webp description', 'webp user comment')
  const xmpText = '<x:xmpmeta>test</x:xmpmeta>'
  const buffer = fakeWebp([riffChunk('EXIF', tiff), riffChunk('XMP ', Buffer.from(xmpText, 'utf8'))])
  const metadata = extractArchiveImageMetadata(buffer, 'legacy.webp')

  assert.equal(metadata.format, 'webp')
  assert.ok(metadata.supported)
  if (metadata.format === 'webp' && metadata.supported) {
    assert.equal(metadata.exifImageDescription, 'a webp description')
    assert.equal(metadata.exifUserComment, 'webp user comment')
    assert.equal(metadata.xmp, xmpText)
    assert.deepEqual(metadata.comments, [])
  }
  console.log('verifyArtArchiveScanner: WebP EXIF + XMP extraction passed')
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

async function testTrashFolderNeverRescanned() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-scan-'))
  try {
    await mkdir(path.join(root, ARCHIVE_TRASH_FOLDER), { recursive: true })
    await writeFile(
      path.join(root, ARCHIVE_TRASH_FOLDER, '1-quarantined.png'),
      fakePng([textChunk('parameters', A1111_TEXT)]),
    )
    await writeFile(path.join(root, 'live.png'), fakePng([textChunk('parameters', A1111_TEXT)]))

    const result = await scanArchiveRoot(root)

    assert.equal(result.files.length, 1, 'only the live file should be indexed')
    assert.equal(result.files[0]?.relativePath, 'live.png')
    console.log('verifyArtArchiveScanner: a quarantined file in the trash subtree is never rescanned')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function run() {
  testA1111Parsing()
  testPngExtractionRoundTrip()
  testComfyGraphParsing()
  testNonPngFormatDetection()
  testJpegExifAndCommentExtraction()
  testWebpExifAndXmpExtraction()
  testContentHash()
  await testScannerRootConfinement()
  await testTrashFolderNeverRescanned()
  console.log('verifyArtArchiveScanner: all assertions passed')
}

run()
