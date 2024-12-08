export function useRandomItem() {
  const items = [
    'sword',
    'shield',
    'potion',
    'map',
    'lantern',
    'ring',
    'cloak',
    'gem',
    'key',
    'book',
  ]

  function randomItem() {
    return items[Math.floor(Math.random() * items.length)]
  }

  return { randomItem }
}
