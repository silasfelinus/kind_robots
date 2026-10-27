import { existsSync } from 'node:fs'
import path from 'node:path'
import type { Playbook } from '../../utils/playbook/types'

export type ExtraArtInventory = {
  total: number
  delivered: number
  missing: string[]
}

export type PlaybookArtInventory = {
  verified: Record<string, string>
  extras: ExtraArtInventory
}

/** Static delivery is a file, never a plausible-looking URL or an SVG fallback. */
export function inspectPlaybookArt(
  book: Pick<Playbook, 'nodes' | 'artRequirements'>,
  imageRoot: string,
  publicRoots: string[] = [
    path.resolve(process.cwd(), 'public'),
    path.resolve(process.cwd(), '.output/public'),
    path.resolve(process.cwd(), '../public'),
  ],
): PlaybookArtInventory {
  const localFileExists = (url: string): boolean => {
    if (!url.startsWith('/') || url.startsWith('//')) return false
    const clean = url.split(/[?#]/, 1)[0] ?? ''
    if (!/\.(?:webp|png|jpe?g|avif|gif)$/i.test(clean)) return false
    let decoded: string
    try {
      decoded = decodeURIComponent(clean)
    } catch {
      return false
    }
    if (decoded.includes('\\') || decoded.split('/').includes('..'))
      return false
    const inImageStore = decoded.startsWith('/images/')
    const relative = decoded.slice(inImageStore ? '/images/'.length : 1)
    const roots = inImageStore ? [imageRoot] : publicRoots
    return roots.some((root) => {
      const absoluteRoot = path.resolve(root)
      const file = path.resolve(absoluteRoot, relative)
      return file.startsWith(absoluteRoot + path.sep) && existsSync(file)
    })
  }

  const verified: Record<string, string> = {}
  for (const [key, node] of Object.entries(book.nodes)) {
    const url = node.artPath || node.artUrl
    if (url && localFileExists(url)) verified[key] = url
  }

  const requirements = book.artRequirements ?? []
  const missing = requirements
    .filter((slot) => !localFileExists(slot.url))
    .map((slot) => `${slot.title}: ${slot.url}`)
  return {
    verified,
    extras: {
      total: requirements.length,
      delivered: requirements.length - missing.length,
      missing,
    },
  }
}
