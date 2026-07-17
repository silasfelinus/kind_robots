// /utils/scripts/verifyCaptureGroupGuards.test.ts
//
// Regression test for scanCaptureGroupGuards() in verifyCaptureGroupGuards.ts
// (kind-robots/t-027 kaizen, t-031). Exercises the real function -- not a
// reimplementation -- against a hermetic temp git repo covering each of the
// four guard shapes t-027 documented as safe, each corresponding unguarded
// shape, and the "unindexed match/exec is never flagged" case, entirely
// offline with no dependency on this repo's own history.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { scanCaptureGroupGuards } from './verifyCaptureGroupGuards.js'

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

const BASE_CONTENT = `export const placeholder = true\n`

// One function per case, so an error message naming a line number is easy to
// attribute to a specific case by eye if this test ever fails.
const CANDIDATE_CONTENT = `export const placeholder = true

export function guardedOptionalChain(input: string): string {
  const match = input.match(/(\\d+)/)
  return match?.[1] ?? ''
}

export function guardedEarlyReturn(input: string): string {
  const match = input.match(/(\\d+)/)
  if (!match) return ''
  return match[1]
}

export function guardedNonNullAssertion(input: string): string {
  const match = input.match(/(\\d+)/)
  if (match) {
    return match![1]
  }
  return ''
}

export function guardedDestructureDefaults(input: string): [string, string] {
  const [, h = '0', s = '100'] = input.match(/(\\d+)-(\\d+)/) || []
  return [h, s]
}

export function unguardedScalar(input: string): string {
  const match = input.match(/(\\d+)/)
  return match[1]
}

export function unguardedInlineChain(input: string): string {
  return input.match(/(\\d+)/)[1]
}

export function unguardedDestructure(input: string): string {
  const [, h] = input.match(/(\\d+)-(\\d+)/)
  return h
}

export function truthinessOnly(input: string): boolean {
  return Boolean(input.match(/(\\d+)/))
}
`

const repo = mkdtempSync(join(tmpdir(), 'capture-group-guards-'))

try {
  git(repo, 'init', '--quiet', '--initial-branch=main')
  git(repo, 'config', 'user.email', 'test@example.com')
  git(repo, 'config', 'user.name', 'Capture Group Guards Test')

  writeFileSync(join(repo, 'sample.ts'), BASE_CONTENT)
  git(repo, 'add', 'sample.ts')
  git(repo, 'commit', '--quiet', '-m', 'base')
  git(repo, 'branch', 'base')

  writeFileSync(join(repo, 'sample.ts'), CANDIDATE_CONTENT)
  git(repo, 'add', 'sample.ts')
  git(repo, 'commit', '--quiet', '-m', 'add candidate call sites')

  const { errors, candidatesChecked } = scanCaptureGroupGuards(repo, 'base')

  assert.equal(
    candidatesChecked,
    8,
    `expected 8 new .exec(/.match( call sites checked, got ${candidatesChecked}: ${errors.join('; ')}`,
  )

  assert.equal(
    errors.length,
    3,
    `expected exactly 3 unguarded call sites flagged, got ${errors.length}:\n${errors.join('\n')}`,
  )

  for (const error of errors) {
    assert.match(
      error,
      /^sample\.ts:\d+:/,
      `expected error to point at sample.ts:<line>, got: ${error}`,
    )
  }
  const scalarError = errors.find((e) => e.includes('"match"'))
  assert.ok(
    scalarError,
    `expected an unguarded-scalar error, got: ${errors.join('\n')}`,
  )

  const inlineChainError = errors.find((e) => e.includes('directly (no `?.`)'))
  assert.ok(
    inlineChainError,
    `expected an unguarded inline-chain error, got: ${errors.join('\n')}`,
  )

  const destructureError = errors.find((e) => e.includes('destructures a'))
  assert.ok(
    destructureError,
    `expected an unguarded-destructure error, got: ${errors.join('\n')}`,
  )

  // Re-running against a base ref equal to HEAD (no diff) must report zero
  // candidates -- confirms the check only ever evaluates new/changed lines,
  // never falls back to a whole-file or whole-repo scan.
  git(repo, 'branch', '-f', 'base', 'HEAD')
  const noDiffResult = scanCaptureGroupGuards(repo, 'base')
  assert.equal(noDiffResult.candidatesChecked, 0)
  assert.equal(noDiffResult.errors.length, 0)

  console.log(
    'Capture-group guard checker verified: flags unguarded scalar/inline-chain/' +
      'destructure call sites, clears all four documented guard shapes and the ' +
      'unindexed-truthiness case, and only ever evaluates new/changed lines.',
  )
} finally {
  rmSync(repo, { recursive: true, force: true })
}
