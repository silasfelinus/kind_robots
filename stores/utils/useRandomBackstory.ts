export function useRandomBackstory() {
  const backstories = [
    'Orphaned at a young age and raised by wolves.',
    'Trained in the arcane arts in a distant land.',
    'A former thief seeking redemption.',
    'The lone survivor of a village destroyed by war.',
    'Once the ruler of a kingdom now turned to ruin.',
    'A wanderer with no memory of their past.',
  ]

  function randomBackstory() {
    return backstories[Math.floor(Math.random() * backstories.length)]
  }

  return { randomBackstory }
}
