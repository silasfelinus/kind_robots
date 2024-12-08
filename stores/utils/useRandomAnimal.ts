export function useRandomAnimal() {
  const animals = [
    'wolf',
    'eagle',
    'bear',
    'lion',
    'tiger',
    'snake',
    'rabbit',
    'deer',
    'dragon',
    'fox',
  ]

  function randomAnimal() {
    return animals[Math.floor(Math.random() * animals.length)]
  }

  return { randomAnimal }
}
