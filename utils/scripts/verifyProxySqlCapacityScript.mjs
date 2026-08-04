// /utils/scripts/verifyProxySqlCapacityScript.mjs
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const scriptUrl = new URL('../../scripts/proxysql-capacity-diagnostics.sh', import.meta.url)
const scriptPath = fileURLToPath(scriptUrl)
const source = readFileSync(scriptUrl, 'utf8')

execFileSync('bash', ['-n', scriptPath], { stdio: 'pipe' })

assert.match(source, /stats_mysql_connection_pool/)
assert.match(source, /stats_mysql_processlist/)
assert.match(source, /information_schema\.PROCESSLIST/)
assert.match(source, /information_schema\.INNODB_TRX/)
assert.match(source, /max_user_connections/)
assert.match(source, /multiplex_disabled/)
assert.doesNotMatch(source, /docker\s+(restart|stop|kill)/)

console.log('ProxySQL capacity diagnostic syntax and read-only contract verified.')
