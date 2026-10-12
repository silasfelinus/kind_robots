const fs = require('node:fs')
const { execFileSync } = require('node:child_process')
const paths = [
  'utils/arcade/games/rainbowPinkwake.ts',
  'utils/arcade/games/rainbowPinkwakeBoss.ts',
  'utils/arcade/games/rainbowPrincessPreview.ts',
  'utils/scripts/verifyRainbowPinkwake.test.ts',
]
execFileSync('node_modules/.bin/prettier', ['--write', ...paths], { stdio: 'ignore' })
for (const path of paths) {
  console.log('RAINBOW_FORMATTED:' + JSON.stringify({ path, content: fs.readFileSync(path, 'utf8') }))
}
// Temporary diagnostic. Remove both this script and the test invocation
// after committing the four formatted files; final CI must run normally.
process.exit(1)
