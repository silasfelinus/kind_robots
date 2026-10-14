import { existsSync, statSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'

export function zuzuPublicRoots(cwd = process.cwd()): string[] {
  return [join(cwd, '.output', 'public'), join(cwd, 'public')].filter(
    (root) => {
      try {
        return statSync(root).isDirectory()
      } catch {
        return false
      }
    },
  )
}

export function zuzuRepoFileProbe(
  roots: readonly string[],
): (repoKey: string) => boolean | null {
  return (repoKey) => {
    if (!roots.length) return null
    if (!repoKey.startsWith('public/')) return false
    const relative = repoKey.slice('public/'.length)
    for (const root of roots) {
      const base = resolve(root)
      const full = resolve(base, relative)
      if (!full.startsWith(base + sep)) return false
      if (existsSync(full)) return true
    }
    return false
  }
}
