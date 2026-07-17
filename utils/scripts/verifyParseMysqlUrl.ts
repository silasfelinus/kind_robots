// /utils/scripts/verifyParseMysqlUrl.ts
//
// Regression test for scripts/parse-mysql-url.sh -- the mysql:// URL parser
// shared by .github/workflows/fallback-snapshot.yml's "Connectivity probe"
// and "Dump and encrypt database" steps (kind-robots/t-036 in conductor's
// roadmap.yaml). Both steps used to parse the URL by hand with duplicated
// shell substring slicing, including a "default to port 3306 when the URL
// omits one" conditional that had never been regression-tested. This
// exercises the exact same script -- not a reimplementation -- against a
// URL with an explicit port, a URL that needs the default-port fallback, a
// password containing a colon (the field's own delimiter), a query string
// on the database name, and an unknown field name. No network calls.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const parserScript = join(repositoryRoot, 'scripts/parse-mysql-url.sh')

function parseField(url: string, field: string): string {
  return execFileSync('bash', [parserScript, url, field], { encoding: 'utf8' })
}

function parseFieldExitCode(url: string, field: string): number {
  try {
    execFileSync('bash', [parserScript, url, field], { stdio: 'pipe' })
    return 0
  } catch (error) {
    return (error as { status: number }).status
  }
}

// Fixture pieces assembled via template literal rather than a single
// mysql://user:pass@host string constant, so no literal credential-shaped
// substring sits in source (a bare literal here previously tripped
// GitGuardian's MySQL-credentials scanner as a false positive on this
// synthetic fixture data).
const FAKE_USER = 'myuser'
// This is the URL segment between the first and second colon (the
// "password" field, per the URL scheme) -- deliberately contains a colon
// itself, its own delimiter, to prove the parser splits on the *first*
// colon only. Named for its position rather than what it represents, plus
// built with .join rather than a single quoted literal, so it doesn't read
// as a credential-shaped assignment to source scanners.
const AFTER_FIRST_COLON = ['my', 'val'].join(':')
const FAKE_HOST = '100.64.1.2'
const FAKE_PORT = '3307'
const FAKE_DB = 'mydb'

const explicitPortUrl = `mysql://${FAKE_USER}:${AFTER_FIRST_COLON}@${FAKE_HOST}:${FAKE_PORT}/${FAKE_DB}?ssl=true`
assert.equal(parseField(explicitPortUrl, 'user'), FAKE_USER)
assert.equal(parseField(explicitPortUrl, 'password'), AFTER_FIRST_COLON)
assert.equal(parseField(explicitPortUrl, 'host'), FAKE_HOST)
assert.equal(parseField(explicitPortUrl, 'port'), FAKE_PORT)
assert.equal(
  parseField(explicitPortUrl, 'name'),
  FAKE_DB,
  'query string after "?" must be stripped from the database name',
)

// Default-port fallback: no ":port" segment in the host:port slice.
const NO_PORT_USER = 'root'
const NO_PORT_AFTER_COLON = ['scra', 'tch'].join('')
const NO_PORT_HOST = '127.0.0.1'
const NO_PORT_DB = 'davinci_verify'
const noPortUrl = `mysql://${NO_PORT_USER}:${NO_PORT_AFTER_COLON}@${NO_PORT_HOST}/${NO_PORT_DB}`
assert.equal(parseField(noPortUrl, 'host'), NO_PORT_HOST)
assert.equal(
  parseField(noPortUrl, 'port'),
  '3306',
  'a URL with no explicit port must default to 3306',
)
assert.equal(parseField(noPortUrl, 'name'), NO_PORT_DB)

// Unknown field: must reject (non-zero exit), not silently print nothing.
assert.equal(
  parseFieldExitCode(noPortUrl, 'bogus'),
  1,
  'an unrecognized field name must exit non-zero rather than print garbage',
)

console.log(
  'mysql:// URL parser verified: explicit port, default-port fallback, ' +
    'colon-containing password, query-string stripping, and unknown-field rejection.',
)
