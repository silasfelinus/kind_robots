import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { changedPaths, unstagedPaths } from './formatChanged.mjs'

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
}

test('changed-file formatter targets new and modified files, not deletions or unrelated old files', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'kr-format-changed-'))
  try {
    git(cwd, 'init', '-b', 'main')
    git(cwd, 'config', 'user.email', 'test@example.invalid')
    git(cwd, 'config', 'user.name', 'Formatting Test')
    mkdirSync(join(cwd, 'src'))
    writeFileSync(join(cwd, 'src', 'old.ts'), 'const old=1\n')
    writeFileSync(join(cwd, 'src', 'delete.ts'), 'const removed=1\n')
    git(cwd, 'add', '.')
    git(cwd, '-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'baseline')
    git(cwd, 'switch', '-c', 'feature')

    writeFileSync(join(cwd, 'src', 'old.ts'), 'const old=2\n')
    writeFileSync(join(cwd, 'src', 'space name.ts'), 'const x=1\n')
    rmSync(join(cwd, 'src', 'delete.ts'))
    git(cwd, 'add', '-A')
    assert.deepEqual(changedPaths({ cwd, staged: true }).sort(), [
      'src/old.ts',
      'src/space name.ts',
    ])
    git(cwd, '-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'feature')

    assert.deepEqual(changedPaths({ cwd, base: 'main' }).sort(), [
      'src/old.ts',
      'src/space name.ts',
    ])
    assert.deepEqual(unstagedPaths(cwd), [])
    writeFileSync(join(cwd, 'src', 'old.ts'), 'const old=3\n')
    assert.deepEqual(unstagedPaths(cwd), ['src/old.ts'])
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
