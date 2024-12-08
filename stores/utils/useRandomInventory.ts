export function useRandomInventory() {
  const items = [
    'A rusted sword',
    'A healing potion',
    'A mysterious key',
    'A bag of gold coins',
    'A tattered map of unknown lands',
    'A lantern that never goes out',
    'A journal filled with cryptic notes',
  ]

  function randomInventory() {
    const itemCount = Math.floor(Math.random() * 3 + 1) // Random number of items (1-3)
    const inventory = new Set<string>()

    while (inventory.size < itemCount) {
      inventory.add(items[Math.floor(Math.random() * items.length)])
    }

    return Array.from(inventory).join(', ')
  }

  return { randomInventory }
}
