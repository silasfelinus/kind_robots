// utils/scripts/verifyAppAccountPrivileges.ts
//
// kind-robots/t-073. Makes the application/migration credential boundary
// TESTABLE instead of aspirational.
//
// The boundary was, until this script, entirely a code convention:
// prisma.config.ts refuses DATABASE_URL for migrate commands,
// prisma-migrate-deploy.mjs refuses it again, and a runbook explains why. All
// of it was carefully preventing something the application account could
// already do -- `kindrobot` holds ALL PRIVILEGES ON *.* WITH GRANT OPTION, so
// the permanently-running Nuxt process has server-wide superuser and can
// re-grant itself anything it likes. Code cannot enforce a database privilege;
// only the database can. This asks it.
//
// PASSWORD HASHES ARE REDACTED FROM ALL OUTPUT. `SHOW GRANTS` returns
// `IDENTIFIED BY PASSWORD '<hash>'`, and a mysql_native_password hash is
// sufficient to authenticate with some clients -- it is a credential, not a
// fingerprint. Leaking one into a terminal, a CI log, or an agent transcript is
// the same class of disclosure as leaking the password. That is not
// hypothetical: it is how this very problem was disclosed on 2026-08-25.
//
//   npx tsx utils/scripts/verifyAppAccountPrivileges.ts
//
// Exits 1 if the account the app connects as holds more than it needs.

import 'dotenv/config'
import { createScriptPrismaClient } from '../../scripts/lib/databaseRetry'

// What the web process actually executes, established by enumerating every raw
// SQL site in server/ (t-073 step 1). Runtime raw SQL is 10 SELECT, 1 INSERT,
// 1 UPDATE, 1 DELETE, plus `SELECT ... FOR UPDATE` and `GET_LOCK()`, neither of
// which needs a privilege beyond SELECT. There is NO DDL anywhere in the
// runtime path. `CREATE TEMPORARY TABLES` appears only in hand-run maintenance
// scripts under utils/scripts/, which are a different lane and should not
// widen this one.
const ALLOWED = new Set(['SELECT', 'INSERT', 'UPDATE', 'DELETE'])

// Privileges that make the two-lane design decorative if the app lane holds
// them. GRANT OPTION is the worst: it means any narrowing can be undone by the
// process the narrowing was meant to contain.
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
  // Strip the parenthesised column list BEFORE splitting on commas. A
  // column-scoped grant like `SELECT (id, name)` carries a comma INSIDE the
  // parentheses, so splitting first yields "SELECT (ID" and "NAME)" -- two
  // privileges that do not exist, one of which would be reported as an
  // unexpected privilege the account does not actually hold.
  return match[1]
    .replace(/\s*\([^)]*\)/g, '')
    .split(',')
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean)
}

/** Does this grant apply server-wide (*.*) rather than to one database? */
export function isGlobal(line: string): boolean {
  return /\sON\s+\*\.\*\s/i.test(line)
}

async function main() {
  const prisma = createScriptPrismaClient()
  const problems: string[] = []
  try {
    const rows =
      await prisma.$queryRawUnsafe<Record<string, string>[]>('SHOW GRANTS')
    const grants = rows.map((row) =>
      redactGrant(String(Object.values(row)[0] ?? '')),
    )

    console.log(`the application account holds ${grants.length} grant(s):`)
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
      if (isGlobal(grant) && privileges.some((p) => p !== 'USAGE')) {
        problems.push(
          `holds a server-wide (*.*) grant beyond USAGE -- ${grant}`,
        )
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
    console.error(`${problems.length} privilege problem(s):`)
    for (const problem of [...new Set(problems)])
      console.error(`  x ${problem}`)
    console.error(
      '\nThe application lane should hold SELECT, INSERT, UPDATE, DELETE on the ' +
        'database it serves, and nothing else. See ' +
        'docs/runbooks/app-account-privilege-narrowing.md -- and read its sequencing ' +
        'section before revoking anything, because a wrong revoke takes the site down.',
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
