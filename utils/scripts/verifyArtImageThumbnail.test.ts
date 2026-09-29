// /utils/scripts/verifyArtImageThumbnail.test.ts
//
// Self-test for the image feed's one-url-per-tile thumbnail
// (server/utils/artImageThumbnail.ts) and its signed url
// (galleryThumbnailUrl in server/utils/artGalleryArchiveMedia.ts): a file
// under the public image root and an inline base64 row both come back as a
// downscaled cached WebP, a remote url redirects, a row with nothing behind it
// is a 404 rather than a hang, and a thumbnail signature cannot be replayed
// for another image. No Prisma involved, so this runs without DATABASE_URL.
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const imagesRoot = await mkdtemp(path.join(os.tmpdir(), 'art-feed-images-'))
const cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'art-feed-cache-'))
process.env.IMAGES_PATH = imagesRoot
process.env.ART_THUMBNAIL_CACHE_PATH = cacheRoot
process.env.ARCHIVE_MEDIA_SECRET = 'verify-art-image-thumbnail'

const { publicImageRelativePath, resolveArtImageThumbnail } =
  await import('../../server/utils/artImageThumbnail')
const { galleryThumbnailUrl, verifyGalleryThumbnail } =
  await import('../../server/utils/artGalleryArchiveMedia')

async function testPng(color: { r: number; g: number; b: number }) {
  return sharp({
    create: { width: 1600, height: 1200, channels: 3, background: color },
  })
    .png()
    .toBuffer()
}

function row(overrides: Record<string, unknown>) {
  return {
    id: 1,
    updatedAt: new Date('2026-09-29T00:00:00Z'),
    designer: null,
    imagePath: null,
    path: null,
    fileName: null,
    imageData: null,
    ...overrides,
  }
}

async function assertSmallWebp(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata()
  assert.equal(metadata.format, 'webp')
  assert.ok(metadata.width && metadata.width <= 480, 'must be downscaled')
}

function testRelativePathShapes() {
  assert.equal(
    publicImageRelativePath('/images/academy/a.webp'),
    'academy/a.webp',
  )
  assert.equal(
    publicImageRelativePath('images/academy/a.webp'),
    'academy/a.webp',
  )
  assert.equal(
    publicImageRelativePath('https://kindrobots.org/images/academy/a%20b.webp'),
    'academy/a b.webp',
  )
  assert.equal(publicImageRelativePath('/public/images/x.png'), 'x.png')
  assert.equal(publicImageRelativePath('bare.png'), 'bare.png')
  assert.equal(
    publicImageRelativePath('https://cdn.example.com/other/x.png'),
    null,
  )
  assert.equal(publicImageRelativePath('data:image/png;base64,AAAA'), null)
  assert.equal(publicImageRelativePath(''), null)
  console.log(
    'verifyArtImageThumbnail: stored path shapes map onto the public image root',
  )
}

async function testPublicFolderImage() {
  await mkdir(path.join(imagesRoot, 'academy'), { recursive: true })
  await writeFile(
    path.join(imagesRoot, 'academy', 'one.png'),
    await testPng({ r: 200, g: 40, b: 40 }),
  )
  const result = await resolveArtImageThumbnail(
    row({ id: 11, imagePath: '/images/academy/one.png' }),
  )
  assert.equal(result.kind, 'bytes')
  if (result.kind === 'bytes') await assertSmallWebp(result.buffer)
  const cached = await readdir(cacheRoot)
  assert.ok(
    cached.some((name) => name.startsWith('11-')),
    'the thumbnail must be cached',
  )
  console.log(
    'verifyArtImageThumbnail: a public-folder image becomes a cached WebP thumbnail',
  )
}

async function testInlineImage() {
  const base64 = (await testPng({ r: 20, g: 160, b: 60 })).toString('base64')
  const result = await resolveArtImageThumbnail(
    row({ id: 12, imagePath: '/images/missing/nope.png', imageData: base64 }),
  )
  assert.equal(
    result.kind,
    'bytes',
    'a missing path must fall through to inline data',
  )
  if (result.kind === 'bytes') await assertSmallWebp(result.buffer)
  console.log(
    'verifyArtImageThumbnail: inline base64 is used when the stored path is missing',
  )
}

async function testRemoteRedirect() {
  const result = await resolveArtImageThumbnail(
    row({ id: 13, imagePath: 'https://cdn.example.com/art/13.png' }),
  )
  assert.deepEqual(result, {
    kind: 'redirect',
    url: 'https://cdn.example.com/art/13.png',
  })
  console.log('verifyArtImageThumbnail: an off-site url redirects')
}

async function testNothingStoredIs404() {
  await assert.rejects(
    () =>
      resolveArtImageThumbnail(row({ id: 14, fileName: 'never-existed.png' })),
    (error: { statusCode?: number }) => error.statusCode === 404,
  )
  console.log('verifyArtImageThumbnail: a row with no pixels anywhere is a 404')
}

async function testTraversalIsConfined() {
  await writeFile(
    path.join(cacheRoot, 'secret.png'),
    await testPng({ r: 1, g: 2, b: 3 }),
  )
  await assert.rejects(
    () =>
      resolveArtImageThumbnail(
        row({
          id: 15,
          imagePath: `/images/../${path.basename(cacheRoot)}/secret.png`,
        }),
      ),
    (error: { statusCode?: number }) => error.statusCode === 404,
  )
  console.log(
    'verifyArtImageThumbnail: a path escaping the image root is refused',
  )
}

function testSignedUrl() {
  const now = Date.now()
  const url = new URL(galleryThumbnailUrl(42, now), 'https://kindrobots.org')
  assert.equal(url.pathname, '/api/art/image/42/thumbnail')
  const exp = url.searchParams.get('exp')
  const sig = url.searchParams.get('sig')
  assert.equal(verifyGalleryThumbnail(42, exp, sig, now), true)
  assert.equal(
    verifyGalleryThumbnail(43, exp, sig, now),
    false,
    'bound to the image id',
  )
  assert.equal(
    galleryThumbnailUrl(42, now),
    galleryThumbnailUrl(42, now + 1000),
    'urls inside one hour must be identical so the browser cache hits',
  )
  console.log(
    'verifyArtImageThumbnail: thumbnail urls are signed, id-bound and cache-stable',
  )
}

try {
  testRelativePathShapes()
  await testPublicFolderImage()
  await testInlineImage()
  await testRemoteRedirect()
  await testNothingStoredIs404()
  await testTraversalIsConfined()
  testSignedUrl()
  console.log('verifyArtImageThumbnail: all checks passed')
} finally {
  await rm(imagesRoot, { recursive: true, force: true })
  await rm(cacheRoot, { recursive: true, force: true })
}
