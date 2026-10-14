import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

function git(args, cwd = process.cwd()) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  if (result.error || result.status !== 0) {
    throw new Error(
      `git ${args.join(' ')} failed: ${result.stderr || result.error?.message || result.status}`,
    )
  }
  return result.stdout
}

function pathsFromGit(args, cwd = process.cwd()) {
  return git([...args, '-z'], cwd)
    .split('\0')
    .filter(Boolean)
}

export function changedPaths({
  cwd = process.cwd(),
  staged = false,
  base = process.env.FORMAT_BASE_REF || 'origin/main',
} = {}) {
  const args = staged
    ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR']
    : ['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`]
  return pathsFromGit(args, cwd).filter((file) =>
    existsSync(resolve(cwd, file)),
  )
}

export function withoutGrandfathered(paths, violations) {
  const known = new Set(Object.values(violations).flat())
  return paths.filter((file) => !known.has(file))
}

export function unstagedPaths(cwd = process.cwd()) {
  return pathsFromGit(['diff', '--name-only'], cwd)
}

function prettier(files, mode) {
  return spawnSync(
    process.execPath,
    [
      'node_modules/prettier/bin/prettier.cjs',
      mode,
      '--ignore-unknown',
      ...files.map((file) => `./${file}`),
    ],
    { stdio: 'inherit' },
  )
}

function main() {
  const args = new Set(process.argv.slice(2))
  const staged = args.has('--staged')
  const write = args.has('--write')
  const baseline = JSON.parse(
    readFileSync(
      resolve('utils/scripts/prettier-ratchet-baseline.json'),
      'utf8',
    ),
  )
  const files = withoutGrandfathered(
    changedPaths({ staged }),
    baseline.violations,
  )

  if (staged && write) {
    const unstaged = new Set(unstagedPaths())
    const partial = files.filter((file) => unstaged.has(file))
    if (partial.length) {
      console.error(
        `Cannot autoformat partially staged files without including unstaged work:\n${partial.join('\n')}\nStage or stash those edits, then commit again.`,
      )
      process.exitCode = 1
      return
    }
  }

  if (!files.length) {
    console.log('No changed files need a Prettier check.')
    return
  }

  console.log(
    `Prettier ${write ? 'formatting' : 'checking'} ${files.length} changed file(s).`,
  )
  const result = prettier(files, write ? '--write' : '--check')
  if (result.error || result.status !== 0) {
    if (!write && args.has('--show-fix')) {
      console.error(
        'Prettier proposes this exact patch (checkout only, not committed):',
      )
      const fix = prettier(files, '--write')
      if (fix.status === 0) {
        const patch = git(['diff', '--', ...files])
        process.stderr.write(patch.slice(0, 60000) || 'No patch produced.\n')
      }
    }
    process.exitCode = result.status || 1
    return
  }

  if (staged && write) {
    git(['add', '--', ...files])
  }
}

if (process.argv[1]?.endsWith('formatChanged.mjs')) main()
