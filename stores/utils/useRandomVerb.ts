export function useRandomVerb() {
  const verbs = [
    'run',
    'jump',
    'swim',
    'fly',
    'climb',
    'dance',
    'fight',
    'explore',
    'hide',
    'build',
  ]

  function randomVerb() {
    return verbs[Math.floor(Math.random() * verbs.length)]
  }

  return { randomVerb }
}
