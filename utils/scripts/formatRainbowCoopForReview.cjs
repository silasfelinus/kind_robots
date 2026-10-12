const fs = require('node:fs')
const { execFileSync } = require('node:child_process')
const files = [
  'components/arcade/arcade-cabinet.vue',
  'utils/arcade/games/rainbowLocalCoop.ts',
  'utils/arcade/games/rainbowPrincessPreview.ts',
  'utils/arcade/types.ts',
  'utils/scripts/verifyRainbowLocalCoop.test.ts',
  'content/channels/admin/rainbow-bullet-hell-space-princess.md',
]
execFileSync('node_modules/.bin/prettier', ['--write', ...files], { stdio: 'ignore' })
for (const path of files) {
  const content = fs.readFileSync(path, 'utf8')
  const total = Math.ceil(content.length / 8500)
  for (let index = 0; index < total; index++) {
    const chunk = content.slice(index * 8500, (index + 1) * 8500)
    console.log('COOP_FMT_CHUNK:' + JSON.stringify({ path, index, total, chunk }))
  }
}
// Temporary diagnostic; remove after committing output on the PR branch.
process.exit(1)
