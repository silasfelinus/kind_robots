// /utils/scripts/verifySceneAnimatorHealth.test.ts
//
// scene-animator/t-003: exercises the real readSceneAnimatorRootStatus() and
// getSceneAnimatorRootSource() against a hermetic temp directory instead of
// re-describing their behaviour. Before this, an unreachable ANIMATE_PATH
// only surfaced as an uncaught 503 buried inside the folder-listing request
// (index.get.ts hardcoded `rootAvailable: true` unconditionally) -- this
// asserts the replacement actually reports the unavailable case instead of
// throwing, and that it names the right source for each of the two ways the
// root can be configured, plus the unconfigured case (scene-animator/t-007:
// getSceneAnimatorRoot() now throws rather than resolving a cwd-based
// fallback when neither env var is set, and this function must still catch
// that and report it rather than let it escape).
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  getSceneAnimatorRootSource,
  readSceneAnimatorRootStatus,
} from '../../server/utils/sceneAnimator.js'

const ORIGINAL_ANIMATE_PATH = process.env.ANIMATE_PATH
const ORIGINAL_IMAGES_PATH = process.env.IMAGES_PATH

function resetEnv(): void {
  delete process.env.ANIMATE_PATH
  delete process.env.IMAGES_PATH
}

async function run(): Promise<void> {
  const workDir = mkdtempSync(join(tmpdir(), 'scene-animator-health-'))

  try {
    // --- source attribution, independent of what's actually on disk -------
    resetEnv()
    assert.equal(
      getSceneAnimatorRootSource(),
      'unconfigured',
      'with neither env var set, the source must be reported as unconfigured',
    )

    process.env.IMAGES_PATH = join(workDir, 'images')
    assert.equal(
      getSceneAnimatorRootSource(),
      'IMAGES_PATH-derived',
      'IMAGES_PATH alone must be reported as IMAGES_PATH-derived',
    )

    process.env.ANIMATE_PATH = join(workDir, 'animate')
    assert.equal(
      getSceneAnimatorRootSource(),
      'ANIMATE_PATH',
      'ANIMATE_PATH must win over IMAGES_PATH and be reported as such',
    )

    // --- unavailable root: reported, not thrown ----------------------------
    resetEnv()
    process.env.ANIMATE_PATH = join(workDir, 'does-not-exist')
    const missing = await readSceneAnimatorRootStatus()
    assert.equal(
      missing.available,
      false,
      'a nonexistent ANIMATE_PATH must be reported as unavailable, not thrown',
    )
    assert.equal(missing.source, 'ANIMATE_PATH')
    assert.deepEqual(missing.folders, [])
    assert.ok(
      missing.reason && missing.reason.length > 0,
      'an unavailable root must carry a human-readable reason',
    )

    // --- unconfigured root: reported, not thrown, no cwd fallback ----------
    //
    // scene-animator/t-007: getSceneAnimatorRoot() used to resolve
    // process.cwd() + 'animate' here -- inside the application directory,
    // which is exactly where Silas said mature animation content must never
    // live. It now throws instead, but readSceneAnimatorRootStatus() must
    // still catch that and report it like any other unavailable-root case,
    // not let it escape as an uncaught exception.
    resetEnv()
    const unconfigured = await readSceneAnimatorRootStatus()
    assert.equal(
      unconfigured.available,
      false,
      'an unconfigured root must be reported as unavailable, not thrown',
    )
    assert.equal(unconfigured.source, 'unconfigured')
    assert.deepEqual(unconfigured.folders, [])
    assert.ok(
      unconfigured.reason?.includes('ANIMATE_PATH'),
      'the unconfigured reason must name ANIMATE_PATH so an operator knows what to set',
    )

    // --- available root: real folders and counts ---------------------------
    const animateRoot = join(workDir, 'animate')
    const projectA = join(animateRoot, 'project-a')
    mkdirSync(projectA, { recursive: true })
    writeFileSync(join(projectA, 'scene-001.png'), Buffer.from([0]))
    writeFileSync(join(projectA, 'scene-002.webp'), Buffer.from([0]))
    writeFileSync(join(projectA, 'notes.txt'), 'not an image')

    resetEnv()
    process.env.ANIMATE_PATH = animateRoot
    const available = await readSceneAnimatorRootStatus()
    assert.equal(available.available, true)
    assert.equal(available.reason, null)
    assert.deepEqual(
      available.folders,
      [{ name: 'project-a', imageCount: 2 }],
      'non-image files must not count toward imageCount',
    )
  } finally {
    resetEnv()
    if (ORIGINAL_ANIMATE_PATH !== undefined) process.env.ANIMATE_PATH = ORIGINAL_ANIMATE_PATH
    if (ORIGINAL_IMAGES_PATH !== undefined) process.env.IMAGES_PATH = ORIGINAL_IMAGES_PATH
    rmSync(workDir, { recursive: true, force: true })
  }

  console.log('Scene Animator health status verified: source attribution and availability both hold.')
}

await run()
