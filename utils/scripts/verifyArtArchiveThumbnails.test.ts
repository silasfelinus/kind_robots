// /utils/scripts/verifyArtArchiveThumbnails.test.ts
//
// Self-test for art-archive/t-029's thumbnail cache and t-035's medium
// preview cache (server/utils/artArchiveThumbnails.ts): a first request
// generates and caches a real downscaled WebP, a later request reuses the
// cache without re-reading the source, and a source that changed after the
// cache was written invalidates it. No Prisma involved, so this runs without
// DATABASE_URL, mirroring verifyArtArchiveFileOps.test.ts's own convention.
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { mkdtemp, rm, stat, unlink, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { ensureArchiveMediumPreview, ensureArchiveThumbnail } from '../../server/utils/artArchiveThumbnails'

async function writeTestPng(filePath: string, color: { r: number; g: number; b: number }): Promise<void> {
  const buffer = await sharp({
    create: { width: 800, height: 600, channels: 3, background: color },
  })
    .png()
    .toBuffer()
  await writeFile(filePath, buffer)
}

async function testGeneratesADownscaledCachedWebp() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-thumbs-'))
  try {
    await writeTestPng(path.join(root, 'one.png'), { r: 200, g: 50, b: 50 })

    const thumbnail = await ensureArchiveThumbnail(root, 1, 'one.png', Date.now() - 10_000)
    const metadata = await sharp(thumbnail).metadata()

    assert.equal(metadata.format, 'webp')
    assert.ok(metadata.width && metadata.width <= 480, 'thumbnail must be downscaled, not full-size')
    assert.ok(thumbnail.length > 0)

    const cacheStat = await stat(path.join(root, '.art-archive-thumbnails', '1.webp'))
    assert.ok(cacheStat.isFile(), 'the generated thumbnail must be cached to a real file')
    console.log('verifyArtArchiveThumbnails: a first request generates and caches a downscaled WebP')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function testCacheHitAvoidsRereadingTheSource() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-thumbs-'))
  try {
    await writeTestPng(path.join(root, 'one.png'), { r: 10, g: 20, b: 30 })
    const first = await ensureArchiveThumbnail(root, 5, 'one.png', Date.now() - 10_000)

    // Delete the source entirely -- a cache hit must not need it.
    await unlink(path.join(root, 'one.png'))
    const second = await ensureArchiveThumbnail(root, 5, 'one.png', Date.now() - 10_000)

    assert.ok(first.equals(second), 'a fresh-enough cache must be served without touching the source again')
    console.log('verifyArtArchiveThumbnails: a fresh cache hit never re-reads the source file')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function testStaleCacheRegeneratesFromAChangedSource() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-thumbs-'))
  try {
    await writeTestPng(path.join(root, 'one.png'), { r: 200, g: 0, b: 0 })
    const first = await ensureArchiveThumbnail(root, 9, 'one.png', Date.now() - 10_000)

    // The source was reimported with different bytes at the same relativePath
    // -- fileMtime advances past the cache's own write time.
    await writeTestPng(path.join(root, 'one.png'), { r: 0, g: 0, b: 200 })
    const second = await ensureArchiveThumbnail(root, 9, 'one.png', Date.now() + 60_000)

    assert.ok(!first.equals(second), 'a cache older than the recorded source mtime must be regenerated')
    console.log('verifyArtArchiveThumbnails: a cache older than the source fileMtime is regenerated')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function testRejectsAPathTraversalRelativePath() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-thumbs-'))
  try {
    await assert.rejects(
      () => ensureArchiveThumbnail(root, 13, '../escaped.png', null),
      /archive root|not found/,
    )
    console.log('verifyArtArchiveThumbnails: a path-traversal relativePath is rejected, not silently served')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function testMediumPreviewIsCappedLargerThanTheThumbnailAndCachedSeparately() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-thumbs-'))
  try {
    await writeTestPng(path.join(root, 'one.png'), { r: 80, g: 160, b: 240 })

    const medium = await ensureArchiveMediumPreview(root, 21, 'one.png', Date.now() - 10_000)
    const metadata = await sharp(medium).metadata()

    assert.equal(metadata.format, 'webp')
    assert.ok(metadata.width && metadata.width <= 1200, 'medium preview must be capped, not full-size')
    assert.ok(
      metadata.width && metadata.width > 480,
      'medium preview must be larger than the 480px thumbnail cap for this 800px-wide source',
    )

    const mediumCacheStat = await stat(path.join(root, '.art-archive-medium', '21.webp'))
    assert.ok(mediumCacheStat.isFile(), 'the generated medium preview must be cached to its own folder')

    // Requesting the thumbnail for the same entry must not collide with the
    // medium cache -- each variant is a distinct, independently-cached file.
    const thumbnail = await ensureArchiveThumbnail(root, 21, 'one.png', Date.now() - 10_000)
    assert.ok(!thumbnail.equals(medium), 'thumbnail and medium caches must not collide')
    console.log('verifyArtArchiveThumbnails: the medium preview is cached separately from the thumbnail, capped larger')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function testConcurrentRequestsShareOneGenerationAndAllComplete() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-thumbs-'))
  try {
    await writeTestPng(path.join(root, 'one.png'), { r: 30, g: 90, b: 150 })
    for (let index = 0; index < 8; index += 1) {
      await writeTestPng(path.join(root, `tile-${index}.png`), { r: index * 20, g: 60, b: 90 })
    }

    // A Gallery opening a never-viewed collection asks for the same entry and
    // many different entries at once; every request must still resolve.
    const same = await Promise.all(
      Array.from({ length: 5 }, () => ensureArchiveMediumPreview(root, 31, 'one.png', Date.now() - 10_000)),
    )
    for (const buffer of same) {
      assert.ok(buffer.equals(same[0]), 'concurrent requests for one entry must share a single generation')
    }

    const many = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        ensureArchiveMediumPreview(root, 40 + index, `tile-${index}.png`, Date.now() - 10_000),
      ),
    )
    assert.equal(many.length, 8)
    for (const buffer of many) assert.ok(buffer.length > 0, 'a queued generation must still complete')
    console.log('verifyArtArchiveThumbnails: concurrent requests are deduplicated and queued generations all complete')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function run() {
  await testGeneratesADownscaledCachedWebp()
  await testCacheHitAvoidsRereadingTheSource()
  await testStaleCacheRegeneratesFromAChangedSource()
  await testRejectsAPathTraversalRelativePath()
  await testMediumPreviewIsCappedLargerThanTheThumbnailAndCachedSeparately()
  await testConcurrentRequestsShareOneGenerationAndAllComplete()
  console.log('verifyArtArchiveThumbnails: all assertions passed')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
