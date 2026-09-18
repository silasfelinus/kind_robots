// /utils/scripts/verifyPreviewSourceGuard.test.ts
//
// THE PREVIEW SOURCE LOADER MUST NOT BECOME AN OPEN PROXY.
//
// /api/resources/previews/:id/source fetches an image from image.civitai.com
// and hands the bytes back as a data: URI, so a Civitai sample can be used as
// the starting image for a generation (Silas, 2026-09-18: "we should be able to
// select them and modify them, even if they come from a civitai sample").
//
// A server that fetches a url on request is a server-side request forgery
// waiting to happen. Two defences, and this pins the second:
//
//   1. The caller names a ResourcePreview ROW, never a url. Enforced by the
//      route's shape -- there is no url parameter to pass.
//   2. The url read out of that row is still checked, because the row was
//      written by a backfill script talking to a third party and could be
//      edited later.
import assert from 'node:assert/strict'

import { isFetchablePreviewUrl } from '../previewSource'

function main() {
  // The real thing.
  assert.equal(
    isFetchablePreviewUrl(
      'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/68aa72cd/original=true/9952963.jpeg',
    ),
    true,
  )

  // Plain http, even on the right host: a downgrade is not a fetch we make.
  assert.equal(isFetchablePreviewUrl('http://image.civitai.com/x.jpeg'), false)

  // THE SUFFIX TRAP. `image.civitai.com.evil.test` ends with `civitai.com`, and
  // a host check written with endsWith would accept it.
  assert.equal(
    isFetchablePreviewUrl('https://image.civitai.com.evil.test/x.jpeg'),
    false,
  )
  assert.equal(isFetchablePreviewUrl('https://evilcivitai.com/x.jpeg'), false)

  // A subdomain of the allowed host is still not the allowed host.
  assert.equal(
    isFetchablePreviewUrl('https://a.image.civitai.com/x.jpeg'),
    false,
  )

  // Civitai's own site is not its image host; only the image host is listed.
  assert.equal(isFetchablePreviewUrl('https://civitai.com/x.jpeg'), false)

  // The addresses this guard exists for.
  assert.equal(isFetchablePreviewUrl('https://localhost/x.jpeg'), false)
  assert.equal(isFetchablePreviewUrl('https://127.0.0.1/x.jpeg'), false)
  assert.equal(
    isFetchablePreviewUrl('https://169.254.169.254/latest/meta-data/'),
    false,
  )
  assert.equal(isFetchablePreviewUrl('https://10.0.0.5/x.jpeg'), false)

  // Other schemes that can read local state.
  assert.equal(isFetchablePreviewUrl('file:///etc/passwd'), false)
  assert.equal(isFetchablePreviewUrl('data:image/png;base64,AAAA'), false)
  assert.equal(isFetchablePreviewUrl('gopher://image.civitai.com/'), false)

  // Credentials in the authority are a classic way to disguise the real host;
  // URL parsing puts the host where it belongs, so this is a host mismatch.
  assert.equal(
    isFetchablePreviewUrl('https://image.civitai.com@evil.test/x.jpeg'),
    false,
  )

  // Nothing at all.
  assert.equal(isFetchablePreviewUrl(''), false)
  assert.equal(isFetchablePreviewUrl(null), false)
  assert.equal(isFetchablePreviewUrl(undefined), false)
  assert.equal(isFetchablePreviewUrl('not a url'), false)
  assert.equal(isFetchablePreviewUrl('/images/local.webp'), false)

  console.log('verifyPreviewSourceGuard: all assertions passed')
}

main()
