export function useRandomClass() {
  const classes = ['Warrior', 'Mage', 'Rogue', 'Cleric', 'Paladin', 'Druid', 'Bard']

  function randomClass() {
    return classes[Math.floor(Math.random() * classes.length)]
  }

  return { randomClass }
}
