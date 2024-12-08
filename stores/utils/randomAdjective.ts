export function useRandomAdjective() {
  const adjectives = [
    'brave',
    'swift',
    'mighty',
    'cunning',
    'gentle',
    'fierce',
    'ancient',
    'mysterious',
    'radiant',
    'dark',
  ]

  function randomAdjective() {
    return adjectives[Math.floor(Math.random() * adjectives.length)]
  }

  return { randomAdjective }
}
