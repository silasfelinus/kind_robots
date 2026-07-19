// /utils/scripts/verifyNoUnquotedReservedWordTables.ts
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Regression guard: CHARACTER is a reserved word in MariaDB's grammar. An
// unquoted `FROM Character` / `LEFT JOIN Character c ON ...` in raw SQL
// ($queryRaw/$queryRawUnsafe/$executeRaw/$executeRawUnsafe, or a raw driver
// `.query()`) throws ER_PARSE_ERROR at query time -- it typechecks fine
// locally since Prisma's generated client and this contract's own mocks
// never exercise real MariaDB grammar. This exact shape shipped across four
// call sites in kind_robots (a migration-repair script that runs during
// `npm run vercel-build`, plus three API/util files) before anyone noticed;
// the migration-repair one broke every production deploy until it was fixed
// by quoting the identifier with backticks (`` `Character` ``). Add new
// reserved words here as they're found to bite a real call site -- keep the
// list narrow (grep false positives on a common word like "Character" are
// expensive to review) rather than importing the full MariaDB reserved-word
// list up front.
const RESERVED_WORD_TABLE_NAMES = ['Character']

const RAW_SQL_TRIGGERS = [
  '$queryRaw',
  '$queryRawUnsafe',
  '$executeRaw',
  '$executeRawUnsafe',
  '.query(',
]

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const SCAN_EXTENSIONS = ['.ts', '.tsx', '.vue', '.js', '.mjs', '.cjs']
const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  '.nuxt',
  '.output',
  '.vercel',
  'node_modules',
  'dist',
  'coverage',
  'cypress',
  'prisma/generated',
])
// This file documents/references the exact triggers and words it scans for
// -- exclude it from its own scan rather than obscuring the pattern to dodge
// a self-match.
const EXCLUDED_FILES = new Set([
  'utils/scripts/verifyNoUnquotedReservedWordTables.ts',
])

// A reserved word directly after FROM/JOIN/INTO/UPDATE/TABLE with no
// backtick in between is the unquoted, unsafe form. `\s+` cannot match a
// backtick, so a correctly quoted `` FROM `Character` `` never matches this
// pattern -- the identifier immediately following the whitespace would be a
// backtick, not the bare word.
function buildUnquotedPattern(word: string): RegExp {
  return new RegExp(`\\b(?:FROM|JOIN|INTO|UPDATE|TABLE)\\s+(${word})\\b`, 'g')
}

function isExcluded(relativePath: string): boolean {
  if (EXCLUDED_FILES.has(relativePath)) return true
  return [...EXCLUDED_DIRECTORIES].some(
    (excluded) =>
      relativePath === excluded || relativePath.startsWith(`${excluded}/`),
  )
}

function listSourceFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const path = join(directory, entry.name)
    const relativePath = relative(repositoryRoot, path)
    if (isExcluded(relativePath)) continue

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(path))
      continue
    }

    if (entry.isFile() && SCAN_EXTENSIONS.some((ext) => path.endsWith(ext))) {
      files.push(path)
    }
  }

  return files
}

function lineNumberAt(content: string, index: number): number {
  let line = 1
  for (let i = 0; i < index; i += 1) {
    if (content[i] === '\n') line += 1
  }
  return line
}

function main(): void {
  const files = listSourceFiles(repositoryRoot)
  const errors: string[] = []
  let scannedRawSqlFiles = 0

  for (const file of files) {
    const relativeFile = relative(repositoryRoot, file)
    const content = readFileSync(file, 'utf8')

    // Cheap pre-filter: only files that actually issue raw SQL can hit this
    // bug class, so skip the (much larger) set of files that merely mention
    // "Character" in TypeScript types, Vue templates, comments, etc.
    if (!RAW_SQL_TRIGGERS.some((trigger) => content.includes(trigger))) {
      continue
    }
    scannedRawSqlFiles += 1

    for (const word of RESERVED_WORD_TABLE_NAMES) {
      const pattern = buildUnquotedPattern(word)
      let match: RegExpExecArray | null
      while ((match = pattern.exec(content)) !== null) {
        const line = lineNumberAt(content, match.index)
        errors.push(
          `${relativeFile}:${line}: unquoted reserved-word table identifier ` +
            `\`${word}\` in raw SQL ("${match[0]}") -- MariaDB will throw ` +
            `ER_PARSE_ERROR at query time. Quote it: \`\`${word}\`\`.`,
        )
      }
    }
  }

  if (errors.length) {
    console.error(
      `Unquoted reserved-word table contract failed with ${errors.length} error(s):`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Unquoted reserved-word table contract passed: ${scannedRawSqlFiles} raw-SQL ` +
      `source file(s) checked, no unquoted ${RESERVED_WORD_TABLE_NAMES.join(', ')} ` +
      'table identifiers found.',
  )
}

main()
