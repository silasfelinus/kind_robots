import type { Playbook } from '../playbook/types'

/**
 * An authored URL names an intended asset, not evidence that it was delivered.
 * Only the server inventory can promote a required picture to painted.
 */
export function withVerifiedArt<T extends Pick<Playbook, 'order' | 'nodes'>>(
  book: T,
  verified: Record<string, string> | undefined,
): T {
  const nodes = { ...book.nodes }
  for (const [key, node] of Object.entries(nodes)) {
    if (!node.artUrl && !node.artPath) continue
    nodes[key] = {
      ...node,
      artUrl: verified?.[key] ?? null,
      needsArt: node.needsArt || !!node.artUrl || !!node.artPath,
    }
  }
  return { ...book, nodes }
}
