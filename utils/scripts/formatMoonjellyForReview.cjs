const fs = require('node:fs')
const { execFileSync } = require('node:child_process')
const files = [
  'utils/arcade/games/rainbowMoonjelly.ts',
  'utils/arcade/games/rainbowMoonjellyBoss.ts',
  'utils/arcade/games/rainbowPrincessPreview.ts',
  'utils/scripts/verifyRainbowMoonjelly.test.ts',
  'content/channels/admin/rainbow-bullet-hell-space-princess.md',
]
execFileSync('node_modules/.bin/prettier', ['--write', ...files], { stdio: 'ignore' })
for (const path of files) {
  const content = fs.readFileSync(path, 'utf8')
  const total = Math.ceil(content.length / 6000)
  for (let index = 0; index < total; index++) {
    console.log('R2FMT_CHUNK:' + JSON.stringify({
      path, index, total, chunk: content.slice(index * 6000, (index + 1) * 6000),
    }))
  }
}
process.exit(1)
