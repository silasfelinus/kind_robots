#!/usr/bin/env node
// scripts/db-write-repro.mjs
//
// Minimal reproduction harness for issue #324: deterministic per-table create
// failures ("Cannot execute new commands: connection closed") where the INSERT
// succeeds server-side but the connection is destroyed before COMMIT.
//
// Run this ON ALEXANDRIA (LAN access to ProxySQL + MariaDB) from a kind_robots
// checkout (the generated Prisma client is committed, so no generate step):
//
//   npm ci --ignore-scripts          # one-time; skips nuxi postinstall
//
//   # via ProxySQL (the failing production path):
//   DATABASE_URL='mysql://kindrobot:<pw>@127.0.0.1:5544/kindblank_fresh' \
//     node scripts/db-write-repro.mjs
//
//   # direct to MariaDB (bypasses ProxySQL — the discriminating run):
//   DATABASE_URL='mysql://kindrobot:<pw>@<mariadb-ip>:3306/kindblank_fresh' \
//     node scripts/db-write-repro.mjs
//
// Each run exercises text AND binary protocol, with and without include, on a
// control table (Todo — passes in prod) and two failing tables (Chat, Reward).
// Connector-level trace logging captures the FIRST internal error before the
// generic "Cannot execute new commands" surfaces. All created rows are deleted;
// on failure the row never commits, so nothing persists either way.

import { PrismaClient } from '../prisma/generated/prisma/client.js'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const stamp = Date.now()
const results = []

function buildAdapter(useTextProtocol) {
  const parsed = new URL(databaseUrl)
  return new PrismaMariaDb(
    {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\/+/, ''),
      connectionLimit: 5,
      connectTimeout: 5000,
      acquireTimeout: 10000,
      trace: true,
      // Surface every connector-level error with its ORIGINAL message/stack —
      // this is the evidence the production logs never show.
      logger: {
        error: (err) => console.error('  [connector:error]', err?.message, err?.cause?.message ?? ''),
        warning: (msg) => console.error('  [connector:warn]', msg),
      },
    },
    { useTextProtocol },
  )
}

async function attempt(label, fn, cleanup) {
  const t0 = Date.now()
  try {
    const created = await fn()
    const ms = Date.now() - t0
    try {
      await cleanup(created)
    } catch (cleanupError) {
      console.error(`  [cleanup-failed] ${label}: ${cleanupError.message}`)
    }
    results.push({ label, ok: true, ms })
    console.log(`  PASS ${label} (${ms}ms, id=${created.id})`)
  } catch (error) {
    const ms = Date.now() - t0
    results.push({ label, ok: false, ms, error: error.message?.split('\n')[0] })
    console.log(`  FAIL ${label} (${ms}ms): ${error.message?.split('\n')[0]}`)
  }
}

// Any real user id works for the FK; user 10 is the schema-wide default owner.
const USER_ID = Number(process.env.REPRO_USER_ID || 10)

async function runMatrixCell(useTextProtocol, withInclude) {
  const mode = `${useTextProtocol ? 'text' : 'binary'}/${withInclude ? 'include' : 'plain'}`
  console.log(`\n=== protocol=${useTextProtocol ? 'TEXT' : 'BINARY'} include=${withInclude} ===`)

  const prisma = new PrismaClient({ adapter: buildAdapter(useTextProtocol) })

  const rewardInclude = withInclude
    ? {
        include: {
          ArtImage: true,
          Characters: true,
          Dreams: true,
          Compositions: true,
          Reactions: true,
          User: { select: { id: true, username: true } },
        },
      }
    : {}

  await attempt(
    `todo.create [${mode}] (control — passes in prod)`,
    () => prisma.todo.create({ data: { title: `repro-${stamp}`, userId: USER_ID } }),
    (row) => prisma.todo.delete({ where: { id: row.id } }),
  )

  await attempt(
    `chat.create [${mode}] (fails in prod)`,
    () =>
      prisma.chat.create({
        data: {
          type: 'ToBot',
          sender: 'db-write-repro',
          content: `repro-${stamp}`,
          User: { connect: { id: USER_ID } },
        },
      }),
    (row) => prisma.chat.delete({ where: { id: row.id } }),
  )

  await attempt(
    `reward.create [${mode}] (fails in prod)`,
    () =>
      prisma.reward.create({
        data: {
          name: 'db-write-repro',
          slug: `repro-${stamp}-${mode.replace(/\W/g, '-')}`,
          rewardType: 'ITEM',
          rarity: 'COMMON',
          User: { connect: { id: USER_ID } },
        },
        ...rewardInclude,
      }),
    (row) => prisma.reward.delete({ where: { id: row.id } }),
  )

  await prisma.$disconnect().catch(() => {})
}

console.log(`db-write-repro against ${new URL(databaseUrl).host}`)

for (const useTextProtocol of [true, false]) {
  for (const withInclude of [true, false]) {
    await runMatrixCell(useTextProtocol, withInclude)
  }
}

console.log('\n=== SUMMARY ===')
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.label}${r.ok ? '' : `  — ${r.error}`}`)
}

const failed = results.filter((r) => !r.ok)
console.log(
  failed.length === 0
    ? '\nAll cells passed. If production still fails, the difference is the ' +
        'network path (Vercel→ProxySQL TLS) — rerun with the TLS options from ' +
        'server/utils/prisma.ts.'
    : `\n${failed.length} cell(s) failed. If the direct-to-MariaDB run also fails, ` +
        'this is a pure driver/adapter bug (check prisma/prisma and ' +
        'mariadb-connector-nodejs upstream issues, bisect mariadb 3.4.x vs 3.5.3). ' +
        'If only the ProxySQL run fails, capture the wire difference around the ' +
        'last statement before the connection is destroyed.',
)
