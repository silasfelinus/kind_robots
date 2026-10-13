const fs = require('node:fs')
const { execFileSync } = require('node:child_process')
const path = 'utils/scripts/verifyRainbowLocalCoop.test.ts'
execFileSync('node_modules/.bin/prettier', ['--write', path], { stdio: 'ignore' })
console.log('BENCH_FMT:' + JSON.stringify({ path, content: fs.readFileSync(path, 'utf8') }))
process.exit(1)
