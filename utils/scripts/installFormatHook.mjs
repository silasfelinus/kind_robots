import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'

if (process.env.CI !== 'true') {
  const path = spawnSync('git', ['rev-parse', '--git-path', 'hooks'], {
    encoding: 'utf8',
  })
  const override = spawnSync('git', ['config', '--get', 'core.hooksPath'], {
    encoding: 'utf8',
  })

  if (path.status === 0 && override.status !== 0) {
    const hooks = resolve(path.stdout.trim())
    const target = resolve(hooks, 'pre-commit')
    const marker = '# Kind Robots changed-file format hook'
    const body = `#!/bin/sh
${marker}
node utils/scripts/formatChanged.mjs --staged --write
`

    if (!existsSync(target) || readFileSync(target, 'utf8').includes(marker)) {
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, body)
      chmodSync(target, 0o755)
      console.log('Installed Kind Robots staged-file Prettier hook.')
    } else {
      console.log('Existing pre-commit hook retained; use npm run format:changed before pushing.')
    }
  }
}
