export function useRandomHonorific() {
  const honorifics = [
    'Brave', 'Wise', 'Swift', 'Cunning',
    'Reckless', 'Undying', 'Forgotten',
  ]

  function randomHonorific() {
    return honorifics[Math.floor(Math.random() * honorifics.length)]
  }

  return { randomHonorific }
}
