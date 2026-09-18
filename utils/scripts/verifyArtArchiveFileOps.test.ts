// /utils/scripts/verifyArtArchiveFileOps.test.ts
//
// Self-test for art-archive/t-009's filesystem-safety helpers
// (server/utils/artArchiveFileOps.ts): root-confined move, rejection of a
// path-traversal target, rejection of a symlinked-directory escape, refusal
// to overwrite an existing destination, and quarantine-not-delete. Exercises
// a real temp directory (mirroring verifyArtArchiveScanner.test.ts's own
// convention) -- no Prisma involved, so this runs without DATABASE_URL.
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import {
  moveConfinedArchiveFile,
  quarantineConfinedArchiveFile,
  quarantineRelativePathFor,
  resolveConfinedTargetPath,
  restoreConfinedArchiveFile,
} from '../../server/utils/artArchiveFileOps'

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

async function testMovesFileAndCreatesNewFolders() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-fileops-'))
  try {
    await writeFile(path.join(root, 'one.png'), 'bytes')
    await moveConfinedArchiveFile(root, 'one.png', 'nested/deeper/one.png')

    assert.equal(await exists(path.join(root, 'one.png')), false)
    assert.equal((await readFile(path.join(root, 'nested', 'deeper', 'one.png'), 'utf8')), 'bytes')
    console.log('verifyArtArchiveFileOps: a move relocates the real file and creates new intermediate folders')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function testRejectsPathTraversalTarget() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-fileops-'))
  try {
    await writeFile(path.join(root, 'one.png'), 'bytes')
    await assert.rejects(
      () => moveConfinedArchiveFile(root, 'one.png', '../escaped.png'),
      /escapes the archive root/,
    )
    assert.equal(await exists(path.join(root, 'one.png')), true, 'the source file must be untouched on rejection')
    console.log('verifyArtArchiveFileOps: a ../-style target is rejected before any filesystem write')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function testRejectsSymlinkedDirectoryEscape() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-fileops-'))
  const outside = await mkdtemp(path.join(os.tmpdir(), 'art-archive-fileops-outside-'))
  try {
    await writeFile(path.join(root, 'one.png'), 'bytes')
    await symlink(outside, path.join(root, 'escape-link'))
    await assert.rejects(
      () => moveConfinedArchiveFile(root, 'one.png', 'escape-link/new-subdir/one.png'),
      /escapes the archive root/,
    )
    assert.equal(await exists(path.join(outside, 'new-subdir')), false, 'nothing should be created outside the root')
    console.log('verifyArtArchiveFileOps: a symlinked intermediate directory pointing outside the root is rejected')
  } finally {
    await rm(root, { recursive: true, force: true })
    await rm(outside, { recursive: true, force: true })
  }
}

async function testRefusesToOverwriteExistingDestination() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-fileops-'))
  try {
    await writeFile(path.join(root, 'one.png'), 'first')
    await writeFile(path.join(root, 'two.png'), 'second')
    await assert.rejects(() => moveConfinedArchiveFile(root, 'two.png', 'one.png'), /already exists/)
    assert.equal((await readFile(path.join(root, 'one.png'), 'utf8')), 'first', 'the destination must be untouched')
    console.log('verifyArtArchiveFileOps: a move never silently overwrites an existing destination file')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function testQuarantineRelocatesRatherThanDeletes() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-fileops-'))
  try {
    await mkdir(path.join(root, 'a'), { recursive: true })
    await writeFile(path.join(root, 'a', 'one.png'), 'bytes')

    const trashRelativePath = await quarantineConfinedArchiveFile(root, 42, 'a/one.png')

    assert.equal(trashRelativePath, quarantineRelativePathFor(42, 'a/one.png'))
    assert.equal(await exists(path.join(root, 'a', 'one.png')), false)
    assert.equal((await readFile(path.join(root, trashRelativePath), 'utf8')), 'bytes', 'bytes must survive quarantine untouched')
    console.log('verifyArtArchiveFileOps: quarantine relocates the file into the trash subtree instead of deleting it')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function testQuarantinePathIsKeyedOnEntryIdNotBasename() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-fileops-'))
  try {
    await mkdir(path.join(root, 'a'), { recursive: true })
    await mkdir(path.join(root, 'b'), { recursive: true })
    await writeFile(path.join(root, 'a', 'same.png'), 'first')
    await writeFile(path.join(root, 'b', 'same.png'), 'second')

    const trashOne = await quarantineConfinedArchiveFile(root, 1, 'a/same.png')
    const trashTwo = await quarantineConfinedArchiveFile(root, 2, 'b/same.png')

    assert.notEqual(trashOne, trashTwo)
    assert.equal((await readFile(path.join(root, trashOne), 'utf8')), 'first')
    assert.equal((await readFile(path.join(root, trashTwo), 'utf8')), 'second')
    console.log('verifyArtArchiveFileOps: two entries sharing a basename never collide in the trash folder')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function testRestoreMovesFileBackToOriginalPath() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-fileops-'))
  try {
    await mkdir(path.join(root, 'a'), { recursive: true })
    await writeFile(path.join(root, 'a', 'one.png'), 'bytes')

    const trashRelativePath = await quarantineConfinedArchiveFile(root, 7, 'a/one.png')
    await restoreConfinedArchiveFile(root, trashRelativePath, 'a/one.png')

    assert.equal(await exists(path.join(root, trashRelativePath)), false)
    assert.equal(
      (await readFile(path.join(root, 'a', 'one.png'), 'utf8')),
      'bytes',
      'bytes must survive the round trip untouched',
    )
    console.log('verifyArtArchiveFileOps: restore moves a quarantined file back to its original path')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function testRestoreRefusesToOverwriteAPathReoccupiedSinceQuarantine() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-fileops-'))
  try {
    await mkdir(path.join(root, 'a'), { recursive: true })
    await writeFile(path.join(root, 'a', 'one.png'), 'original')

    const trashRelativePath = await quarantineConfinedArchiveFile(root, 9, 'a/one.png')
    // A new, unrelated file has since been scanned into the same original path.
    await writeFile(path.join(root, 'a', 'one.png'), 'someone else now')

    await assert.rejects(
      () => restoreConfinedArchiveFile(root, trashRelativePath, 'a/one.png'),
      /already exists/,
    )
    assert.equal(
      (await readFile(path.join(root, 'a', 'one.png'), 'utf8')),
      'someone else now',
      'the reoccupying file must be untouched',
    )
    assert.equal(
      (await readFile(path.join(root, trashRelativePath), 'utf8')),
      'original',
      'the quarantined file must stay in the trash rather than being lost',
    )
    console.log('verifyArtArchiveFileOps: restore refuses to overwrite a path reoccupied since quarantine')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function testResolveConfinedTargetAcceptsNewNestedPath() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'art-archive-fileops-'))
  try {
    const resolved = await resolveConfinedTargetPath(root, 'brand/new/path.png')
    assert.equal(resolved, path.join(root, 'brand', 'new', 'path.png'))
    console.log('verifyArtArchiveFileOps: a not-yet-existing nested target under the root resolves cleanly')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function run() {
  await testMovesFileAndCreatesNewFolders()
  await testRejectsPathTraversalTarget()
  await testRejectsSymlinkedDirectoryEscape()
  await testRefusesToOverwriteExistingDestination()
  await testQuarantineRelocatesRatherThanDeletes()
  await testQuarantinePathIsKeyedOnEntryIdNotBasename()
  await testRestoreMovesFileBackToOriginalPath()
  await testRestoreRefusesToOverwriteAPathReoccupiedSinceQuarantine()
  await testResolveConfinedTargetAcceptsNewNestedPath()
  console.log('verifyArtArchiveFileOps: all assertions passed')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
