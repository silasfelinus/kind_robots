export function useRandomName() {
  const names = [
    'Ava', 'Liam', 'Sophia', 'Ethan', 'Noah', 'Isabella', 'Mason', 'Emma',
    'Olivia', 'Lucas', 'Charlotte', 'James', 'Amelia', 'Alexander', 'Mia',
  ]

  function randomName() {
    return names[Math.floor(Math.random() * names.length)]
  }

  return { randomName }
}
