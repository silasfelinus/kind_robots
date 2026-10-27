import type { Playbook } from './types'

// Pictures some games bundle through Vite instead of serving from a path
// (Cthulhuquarium's plates, backgrounds and portraits). Their adapters name
// the asset in `node.art` as "<kind>:<key>"; in the browser this fills
// `artUrl` from the game's own art module, which only Vite can load. Outside
// the browser (tests, the server) a book stays as it was built.

type Resolver = (art: string) => string | null

const RESOLVERS: Record<string, () => Promise<Resolver>> = {
  cthulhuquarium: async () => {
    const art = await import('../cthulhuquariumArt')
    return (value) => {
      const [kind, key = ''] = value.split(/:(.*)/s)
      if (kind === 'plate') return art.plateArt(key)
      if (kind === 'background') return art.backgroundArt(key)
      if (kind === 'set') return art.artForSetKind(key)
      if (kind === 'species') return art.artForSpecies(key)
      if (kind === 'name') return art.artByName(key)
      return null
    }
  },
}

export async function withBundledArt<
  T extends Pick<Playbook, 'game' | 'order' | 'nodes'>,
>(book: T): Promise<T> {
  const load = RESOLVERS[book.game]
  if (!load) return book
  const resolve = await load()
  const nodes = { ...book.nodes }
  for (const [key, node] of Object.entries(nodes)) {
    if (node.artUrl || !node.art) continue
    const url = resolve(node.art)
    if (url) nodes[key] = { ...node, artUrl: url }
  }
  return { ...book, nodes }
}
