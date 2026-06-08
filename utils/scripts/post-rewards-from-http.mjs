#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

function parseArgs(argv) {
  const args = {
    file: 'rewards.http',
    baseUrl: '',
    endpoint: '/api/rewards',
    chunkSize: 10,
    dryRun: false,
    out: '',
  }

  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true
    else if (arg.startsWith('--baseUrl='))
      args.baseUrl = arg.slice('--baseUrl='.length)
    else if (arg.startsWith('--endpoint='))
      args.endpoint = arg.slice('--endpoint='.length)
    else if (arg.startsWith('--chunkSize='))
      args.chunkSize = Number(arg.slice('--chunkSize='.length))
    else if (arg.startsWith('--out=')) args.out = arg.slice('--out='.length)
    else if (!arg.startsWith('--')) args.file = arg
  }

  return args
}

function getBaseUrl(text) {
  const match = text.match(/^\s*@baseUrl\s*=\s*(.+?)\s*$/m)
  return match?.[1]?.trim() || ''
}

function scanJsonObject(text, start) {
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i += 1) {
    const char = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') depth += 1

    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
    }
  }

  return ''
}

function extractJsonObjects(text) {
  const rewards = []

  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== '{') continue

    const block = scanJsonObject(text, i)
    if (!block) continue

    try {
      const parsed = JSON.parse(block)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        rewards.push(parsed)
        i += block.length - 1
      }
    } catch {}
  }

  return rewards
}

function chunkItems(items, size) {
  const chunks = []

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }

  return chunks
}

async function postReward({ reward, url, index, total, adminToken }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
    body: JSON.stringify(reward),
  })

  let body = null

  try {
    body = await response.json()
  } catch {
    body = await response.text()
  }

  return {
    ok: response.ok,
    status: response.status,
    index,
    total,
    slug: reward.slug,
    name: reward.name,
    body,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const text = await readFile(args.file, 'utf8')
  const rewards = extractJsonObjects(text)
  const baseUrl = args.baseUrl || getBaseUrl(text)

  const adminToken = process.env.ADMIN_TOKEN

  if (!rewards.length) {
    console.error(`No JSON reward objects found in ${args.file}`)
    process.exit(1)
  }

  const duplicateSlugs = rewards
    .map((reward) => reward.slug)
    .filter(Boolean)
    .filter((slug, index, slugs) => slugs.indexOf(slug) !== index)

  if (duplicateSlugs.length) {
    console.error(
      `Duplicate slugs found: ${[...new Set(duplicateSlugs)].join(', ')}`,
    )
    process.exit(1)
  }

  if (args.out) {
    await writeFile(args.out, `${JSON.stringify(rewards, null, 2)}\n`, 'utf8')
    console.log(`Wrote ${rewards.length} rewards to ${args.out}`)
  }

  if (args.dryRun) {
    console.log(`Dry run complete. Found ${rewards.length} rewards.`)
    process.exit(0)
  }

  if (!baseUrl) {
    console.error(
      'Missing baseUrl. Add @baseUrl to the .http file or pass --baseUrl=http://localhost:3000',
    )
    process.exit(1)
  }

  const url = `${baseUrl.replace(/\/$/, '')}${args.endpoint}`
  const chunks = chunkItems(rewards, args.chunkSize)
  const failures = []

  console.log(`Posting ${rewards.length} rewards to ${url}`)

  let posted = 0

  for (const group of chunks) {
    const results = await Promise.all(
      group.map((reward, offset) =>
        postReward({
          reward,
          url,
          index: posted + offset + 1,
          total: rewards.length,
          adminToken,
        }),
      ),
    )

    for (const result of results) {
      if (result.ok) {
        console.log(
          `[${result.index}/${result.total}] OK ${result.slug || result.name}`,
        )
      } else {
        failures.push(result)
        console.error(
          `[${result.index}/${result.total}] FAILED ${result.status} ${result.slug || result.name}`,
        )
      }
    }

    posted += group.length
  }

  if (failures.length) {
    await writeFile(
      'reward-post-failures.json',
      `${JSON.stringify(failures, null, 2)}\n`,
      'utf8',
    )
    console.error(
      `${failures.length} rewards failed. Details written to reward-post-failures.json`,
    )
    process.exit(1)
  }

  console.log(`Done. Posted ${rewards.length} rewards.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
