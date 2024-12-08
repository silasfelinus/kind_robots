export function useRandomNoun() {
  const nouns = [
    'castle',
    'forest',
    'ship',
    'mountain',
    'river',
    'sword',
    'kingdom',
    'garden',
    'treasure',
    'village',
  ]

  function randomNoun() {
    return nouns[Math.floor(Math.random() * nouns.length)]
  }

  return { randomNoun }
}
