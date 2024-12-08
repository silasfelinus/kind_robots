export function useRandomQuirks() {
  const quirks = [
    'Always speaks in riddles.',
    'Cannot resist stealing shiny objects.',
    'Terrified of water, even puddles.',
    'Has an imaginary friend named "Pip".',
    'Uncontrollable laughter at the worst times.',
    'Compulsively collects small bones.',
    'Never wears shoes, no matter the terrain.',
  ]

  function randomQuirk() {
    return quirks[Math.floor(Math.random() * quirks.length)]
  }

  return { randomQuirk }
}
