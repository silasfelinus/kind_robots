#!/usr/bin/env node
// scripts/deepen-remaining-threads.mjs
//
// Phase 3 content pass: voice the three "gateway" topics (running-a-story,
// make-something, kind-robots) for the remaining 33 narrators (everyone except
// the 5 flagships already done in Phase 2). Reads the per-batch drafts produced
// by the voice-writing subagents, validates + assembles one payload, and
// upserts via POST /api/bots/threads (idempotent on botId+topicId, so the
// already-voiced background/purpose/the-world threads are never touched).
//
// Usage:
//   DRAFT_DIR=/path/to/scratchpad KR_API_TOKEN=... node scripts/deepen-remaining-threads.mjs --dry-run
//   DRAFT_DIR=/path/to/scratchpad KR_API_TOKEN=... node scripts/deepen-remaining-threads.mjs --commit

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const BASE = (process.env.APP_BASE_URL || 'https://kind-robots.vercel.app').replace(/\/$/, '')
const TOKEN = process.env.KR_API_TOKEN || ''
const DRAFT_DIR = process.env.DRAFT_DIR || '.'
const commit = process.argv.includes('--commit')

const GATEWAYS = new Set(['running-a-story', 'make-something', 'kind-robots'])
const SORT = { 'running-a-story': 40, 'make-something': 50, 'kind-robots': 60 }
const GUIDANCE = {
  'running-a-story': 'Begin an interactive story; protagonist is not the narrator; end on choices.',
  'make-something': 'Offer batch generation in voice; ask how many.',
  'kind-robots': 'Warm confession bridging fiction to the real fundraiser. Offer the link.',
}

async function loadDrafts() {
  const all = []
  for (let i = 1; i <= 6; i += 1) {
    const path = resolve(DRAFT_DIR, `draft_batch_${i}.json`)
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
      throw new Error(`draft_batch_${i}.json is not valid JSON: ${e.message}`, {
        cause: e,
      })
    }
    if (!Array.isArray(parsed)) throw new Error(`draft_batch_${i}.json is not a JSON array`)
    all.push(...parsed)
  }
  return all
}

function validate(rows) {
  const errors = []
  const seen = new Set()
  const openings = new Map()
  for (const [idx, r] of rows.entries()) {
    const ref = `${r?.botName ?? '?'} / ${r?.topicSlug ?? '?'}`
    if (!r?.botName) errors.push(`[${idx}] missing botName`)
    if (!GATEWAYS.has(r?.topicSlug)) errors.push(`[${idx}] ${ref}: bad topicSlug`)
    if (!r?.openingText || r.openingText.trim().length < 20) errors.push(`[${idx}] ${ref}: openingText too short`)
    if (!Array.isArray(r?.starterPrompts) || !r.starterPrompts.length) errors.push(`[${idx}] ${ref}: no starterPrompts`)
    if (r?.topicSlug === 'kind-robots' && !(r.openingText || '').includes('againstmalaria.com/amibot')) {
      errors.push(`[${idx}] ${ref}: kind-robots opening missing the fundraiser link`)
    }
    const key = `${r?.botName}::${r?.topicSlug}`
    if (seen.has(key)) errors.push(`[${idx}] ${ref}: duplicate botName+topicSlug in drafts`)
    seen.add(key)
    // swap test: no two narrators share an identical opening
    const norm = (r?.openingText || '').trim().toLowerCase()
    if (norm && openings.has(norm) && openings.get(norm) !== r.botName) {
      errors.push(`[${idx}] ${ref}: openingText identical to ${openings.get(norm)} (swap-test fail)`)
    }
    openings.set(norm, r?.botName)
  }
  return errors
}

function toPayload(rows) {
  return rows.map((r) => ({
    botName: r.botName,
    topicSlug: r.topicSlug,
    openingText: r.openingText.trim(),
    guidance: GUIDANCE[r.topicSlug] ?? null,
    starterPrompts: r.starterPrompts.map((s) => ({
      label: String(s.label ?? '').trim(),
      prompt: String(s.prompt ?? '').trim(),
      action: s.action === 'chat' || s.action === 'navigate' ? s.action : 'generate',
      ...(s.path ? { path: s.path } : {}),
    })),
    sortOrder: SORT[r.topicSlug],
    isActive: true,
  }))
}

async function postThreads(threads, dryRun) {
  const res = await fetch(`${BASE}/api/bots/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ threads, dryRun }),
  })
  return res.json()
}

async function main() {
  const rows = await loadDrafts()
  const byBot = new Set(rows.map((r) => r.botName))
  console.log(`Loaded ${rows.length} draft thread(s) across ${byBot.size} narrator(s).`)

  const errors = validate(rows)
  if (errors.length) {
    console.error(`VALIDATION FAILED (${errors.length}):`)
    errors.slice(0, 40).forEach((e) => console.error('  - ' + e))
    process.exit(1)
  }
  console.log('Validation passed (shape, uniqueness, swap test, fundraiser link).')

  const payload = toPayload(rows)
  const result = await postThreads(payload, !commit)
  console.log(JSON.stringify(result, null, 2).slice(0, 1400))
}

main().catch((e) => {
  console.error(e?.message || e)
  process.exit(1)
})
