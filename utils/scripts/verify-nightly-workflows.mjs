// utils/scripts/verify-nightly-workflows.mjs
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const lowerFirst = (value) => value[0].toLowerCase() + value.slice(1)
const failures = []

const schema = read('prisma/schema.prisma')
const schemaDelegates = new Set(
  [...schema.matchAll(/^model\s+([A-Za-z][A-Za-z0-9_]*)/gm)].map((match) =>
    lowerFirst(match[1]),
  ),
)
const snapshotSource = read('utils/scripts/snapshotFallback.ts')
const snapshotDelegates = [
  ...snapshotSource.matchAll(/delegate:\s*'([A-Za-z][A-Za-z0-9_]*)'/g),
].map((match) => match[1])
const unknownDelegates = snapshotDelegates.filter(
  (delegate) => !schemaDelegates.has(delegate),
)

if (unknownDelegates.length) {
  failures.push(
    `snapshotFallback.ts references Prisma delegate(s) absent from schema.prisma: ${unknownDelegates.join(', ')}`,
  )
}

const davinciWorkflow = read('.github/workflows/davinci-seed-verify.yml')
const databaseUrl = davinciWorkflow.match(
  /^\s+DATABASE_URL:\s*(\S+)\s*$/m,
)?.[1]
const migrationDatabaseUrl = davinciWorkflow.match(
  /^\s+MIGRATION_DATABASE_URL:\s*(\S+)\s*$/m,
)?.[1]

if (!/run:\s+\.\/node_modules\/.bin\/prisma db push/.test(davinciWorkflow)) {
  failures.push('Da Vinci verification no longer exercises prisma db push')
}
if (!databaseUrl) {
  failures.push('Da Vinci verification is missing its scratch DATABASE_URL')
} else if (migrationDatabaseUrl !== databaseUrl) {
  failures.push(
    'Da Vinci verification must give prisma db push an explicit MIGRATION_DATABASE_URL equal to its disposable scratch DATABASE_URL',
  )
}

if (failures.length) {
  console.error(`Nightly workflow contract failed with ${failures.length} problem(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `Nightly workflow contract passed: ${snapshotDelegates.length} snapshot delegate(s) exist in Prisma and Da Vinci schema writes use the disposable migration URL.`,
)
