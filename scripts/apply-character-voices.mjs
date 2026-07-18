#!/usr/bin/env node
// scripts/apply-character-voices.mjs
//
// Phase 4b: apply the generated per-character voice cards + sampleResponse lines
// (produced by the voice-designer subagents into cdraft_batch_*.json) to the
// live characters via PATCH /api/characters/[id]. Requires the Character.voice
// field + patch whitelist from Phase 4a to be deployed.
//
// Usage:
//   DRAFT_DIR=/path/to/scratchpad KR_API_TOKEN=... node scripts/apply-character-voices.mjs --dry-run
//   DRAFT_DIR=/path/to/scratchpad KR_API_TOKEN=... node scripts/apply-character-voices.mjs --commit

import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BASE = (process.env.APP_BASE_URL || 'https://kind-robots.vercel.app').replace(/\/$/, '')
const TOKEN = process.env.KR_API_TOKEN || ''
const DRAFT_DIR = process.env.DRAFT_DIR || '.'
const NUM_BATCHES = Number(process.env.NUM_BATCHES || 12)
const commit = process.argv.includes('--commit')

async function loadDrafts() {
  const all = []
  for (let i = 1; i <= NUM_BATCHES; i += 1) {
    const path = resolve(DRAFT_DIR, `cdraft_batch_${i}.json`)
    let raw
    try {
      raw = await readFile(path, 'utf8')
    } catch {
      console.warn(`(skipped missing ${path})`)
      continue
    }
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      throw new Error(`cdraft_batch_${i}.json is not valid JSON: ${e.message}`, {
        cause: e,
      })
    }
    if (!Array.isArray(parsed)) throw new Error(`cdraft_batch_${i}.json is not a JSON array`)
    all.push(...parsed)
  }
  if (all.length) return all

  // Fallback: read the committed seed when scratchpad drafts are gone.
  const seedPath = resolve(__dirname, '../stores/seeds/characterVoices.ts')
  let seedRaw
  try {
    seedRaw = await readFile(seedPath, 'utf8')
  } catch {
    return all
  }
  const match = seedRaw.match(/characterVoiceSeeds\s*=\s*(\[[\s\S]*\])\s*as const/)
  if (!match) throw new Error('Could not parse characterVoices seed file')
  const parsed = JSON.parse(match[1])
  if (Array.isArray(parsed)) all.push(...parsed)
  return all
}

function validate(rows) {
  const errors = []
  const ids = new Set()
  const samples = new Map()
  for (const [idx, r] of rows.entries()) {
    const ref = `${r?.name ?? '?'} (#${r?.id ?? '?'})`
    if (!Number.isInteger(r?.id) || r.id <= 0) errors.push(`[${idx}] ${ref}: bad id`)
    if (!r?.voice || r.voice.trim().length < 10) errors.push(`[${idx}] ${ref}: voice too short`)
    if (!r?.sampleResponse || r.sampleResponse.trim().length < 8) errors.push(`[${idx}] ${ref}: sampleResponse too short`)
    if (ids.has(r?.id)) errors.push(`[${idx}] ${ref}: duplicate id`)
    ids.add(r?.id)
    const norm = (r?.sampleResponse || '').trim().toLowerCase()
    if (norm && samples.has(norm)) errors.push(`[${idx}] ${ref}: sampleResponse identical to ${samples.get(norm)} (swap-test fail)`)
    samples.set(norm, ref)
  }
  return errors
}

async function patchOne(row) {
  const res = await fetch(`${BASE}/api/characters/${row.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ voice: row.voice.trim(), sampleResponse: row.sampleResponse.trim() }),
  })
  let body = null
  try {
    body = await res.json()
  } catch {
    /* non-JSON error body */
  }
  return { ok: res.ok && body?.success !== false, status: res.status, message: body?.message }
}

async function main() {
  const rows = await loadDrafts()
  console.log(`Loaded ${rows.length} character voice profile(s).`)

  const errors = validate(rows)
  if (errors.length) {
    console.error(`VALIDATION FAILED (${errors.length}):`)
    errors.slice(0, 40).forEach((e) => console.error('  - ' + e))
    process.exit(1)
  }
  console.log('Validation passed (id, voice, sampleResponse, swap test).')

  if (!commit) {
    console.log(`Dry run: ${rows.length} character(s) would be patched. No writes.`)
    return
  }

  let ok = 0
  const failures = []
  for (const row of rows) {
    let result
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      result = await patchOne(row)
      if (result.ok) break
      await new Promise((r) => setTimeout(r, attempt * 500))
    }
    if (result.ok) ok += 1
    else failures.push(`#${row.id} ${row.name}: HTTP ${result.status} ${result.message || ''}`)
  }

  console.log(`Patched ${ok}/${rows.length} character(s).`)
  if (failures.length) {
    console.log(`Failures (${failures.length}):`)
    failures.slice(0, 40).forEach((f) => console.log('  - ' + f))
    process.exit(failures.length === rows.length ? 1 : 0)
  }
}

main().catch((e) => {
  console.error(e?.message || e)
  process.exit(1)
})
