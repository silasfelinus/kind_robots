const fs = require('node:fs')
const { execFileSync } = require('node:child_process')
const paths = [
  'utils/arcade/games/rainbowHitGeometry.ts',
  'utils/arcade/games/rainbowPrincessPreview.ts',
  'utils/scripts/verifyRainbowSuperBoundaries.test.ts',
]
execFileSync('node_modules/.bin/prettier', ['--write', ...paths], { stdio: 'ignore' })
for (const path of paths) {
  console.log('SUPER_FMT:' + JSON.stringify({ path, content: fs.readFileSync(path, 'utf8') }))
}
// Temporary formatting proof. This intentionally blocks merging until the
// exact formatted sources are committed and this diagnostic is removed.
process.exit(1)
