// utils/scripts/verifyAppAccountPrivileges.ts
//
// kind-robots/t-073. Makes the application/migration credential boundary
// testable at the database layer instead of relying only on code conventions.
//
// Live recheck on 2026-08-27 confirmed the worst historical grant had already
// been removed manually on Alexandria: `kindrobot` now has only USAGE on *.* and
// no GRANT OPTION. The remaining drift is narrower but still real: the app user
// holds ALL PRIVILEGES on kindrobots, kindblank, kindblank_fresh, and
// kindblank_shadow. The permanently-running web process should only have DML on
// the database it actually serves. This verifier enforces that target.
//
// PASSWORD HASHES ARE REDACTED FROM ALL OUTPUT. `SHOW GRANTS` can return
// `IDENTIFIED BY PASSWORD '<hash>'`, and a mysql_native_password hash can be
// credential material. It must not reach terminal logs, CI logs, or transcripts.
//
//   npx tsx utils/scripts/verifyAppAccountPrivileges.ts
//
// Exits 1 if the account the app connects as holds more than it needs.

import 'dotenv/config'
import { createScriptPrismaClient } from '../../scripts/lib/databaseRetry'

// What the web process actually executes, established by enumerating every raw
// SQL site in server/ (t-073 step 1). Runtime raw SQL is 10 SELECT, 1 INSERT,
// 1 UPDATE, 1 DELETE, plus `SELECT ... FOR UPDATE` and `GET_LOCK()`, neither of
// which needs a privilege beyond SELECT. There is no DDL in the runtime path.
// `CREATE TEMPORARY TABLES` appears only in hand-run maintenance scripts under
// utils/scripts/, which are a different lane and should not widen this one.
const ALLOWED = new Set(['SELECT', 'INSERT', 'UPDATE', 'DELETE'])

const FORBIDDEN = [
  'ALL PRIVILEGES',
  'GRANT OPTION',
  'SUPER',
  'FILE',
  'PROCESS',
  'SHUTDOWN',
]

/** Strip credential material from a grant line before it can reach any log. */
export function redactGrant(line: string): string {
  return line
    .replace(
      /IDENTIFIED BY PASSWORD\s+'[^']*'/gi,
      "IDENTIFIED BY PASSWORD '<redacted>'",
    )
    .replace(/IDENTIFIED BY\s+'[^']*'/gi, "IDENTIFIED BY '<redacted>'")
    .replace(
      /IDENTIFIED VIA\s+\S+\s+USING\s+'[^']*'/gi,
      'IDENTIFIED VIA <redacted>',
    )
}

/** Privilege names in the grant, e.g. "GRANT SELECT, INSERT ON `db`.* TO ..." */
export function privilegesIn(line: string): string[] {
  const match = /^GRANT\s+(.+?)\s+ON\s+/i.exec(line)
  if (!match) return []
  // Strip the parenthesised column list before splitting on commas. A
  // column-scoped grant like `SELECT (id, name)` carries a comma inside the
  // parentheses, so splitting first invents privilege names that do not exist.
  return match[1]!
    .replace(/\s*\([^)]*\)/g, '')
    .split(',')
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean)
}

/** Does this grant apply server-wide (*.*) rather than to one database? */
export function isGlobal(line: string): boolean {
  return /\sON\s+\*\.\*\s/i.test(line)
}

/**
 * Return the database name for an exact database-wide grant (`db`.*).
 * Table/column scopes intentionally return null because the target state is one
 * simple database-wide DML grant, not a collection of bespoke sub-grants.
 */
export function databaseScopeIn(line: string): string | null {
  const match = /\sON\s+(.+?)\s+TO\s+/i.exec(line)
  const scope = match?.[1]?.trim()
  if (!scope || scope === '*.*') return null

  const quoted = /^`([^`]+)`\.\*$/.exec(scope)
  if (quoted?.[1]) return quoted[1]

  const bare = /^([A-Za-z0-9_]+)\.\*$/.exec(scope)
  return bare?.[1] ?? null
}

async function main() {
  const prisma = createScriptPrismaClient()
  const problems: string[] = []
  try {
    const databaseRows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      'SELECT DATABASE() AS database_name',
    )
    const activeDatabase = String(
      databaseRows[0]?.database_name ?? Object.values(databaseRows[0] ?? {})[0] ?? '',
    )
    if (!activeDatabase) {
      throw new Error('could not determine the application database')
    }

    const rows =
      await prisma.$queryRawUnsafe<Record<string, string>[]>('SHOW GRANTS')
    const grants = rows.map((row) =>
      redactGrant(String(Object.values(row)[0] ?? '')),
    )

    console.log(
      `the application account holds ${grants.length} grant(s); active database is ${activeDatabase}:`,
    )
    for (const grant of grants) console.log(`  ${grant}`)
    console.log()

    for (const grant of grants) {
      const privileges = privilegesIn(grant)
      const upper = grant.toUpperCase()

      for (const forbidden of FORBIDDEN) {
        if (upper.includes(forbidden)) {
          problems.push(`holds ${forbidden} -- ${grant}`)
        }
      }

      if (isGlobal(grant)) {
        if (privileges.some((p) => p !== 'USAGE')) {
          problems.push(
            `holds a server-wide (*.*) grant beyond USAGE -- ${grant}`,
          )
        }
      } else if (privileges.some((p) => p !== 'USAGE')) {
        const databaseScope = databaseScopeIn(grant)
        if (databaseScope !== activeDatabase) {
          problems.push(
            `grant is not database-wide DML on ${activeDatabase} -- ${grant}`,
          )
        }
      }

      for (const privilege of privileges) {
        if (privilege === 'USAGE' || ALLOWED.has(privilege)) continue
        problems.push(
          `holds ${privilege}, which the runtime never uses -- ${grant}`,
        )
      }
    }
  } finally {
    await prisma.$disconnect()
  }

  if (problems.length) {
    const uniqueProblems = [...new Set(problems)]
    console.error(`${uniqueProblems.length} privilege problem(s):`)
    for (const problem of uniqueProblems) console.error(`  x ${problem}`)
    console.error(
      '\nThe application lane should hold SELECT, INSERT, UPDATE, DELETE on the ' +
        'database it serves, and nothing else. See ' +
        'docs/runbooks/app-account-privilege-narrowing.md before changing grants.',
    )
    process.exit(1)
  }
  console.log('application account holds only DML on its own database')
}

if (process.argv[1]?.endsWith('verifyAppAccountPrivileges.ts')) {
  main().catch((error) => {
    console.error(
      redactGrant(error instanceof Error ? error.message : String(error)),
    )
    process.exit(1)
  })
}
