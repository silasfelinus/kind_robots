export function useRandomColor() {
  const colors = [
    'red',
    'blue',
    'green',
    'yellow',
    'purple',
    'black',
    'white',
    'gold',
    'silver',
    'orange',
  ]

  function randomColor() {
    return colors[Math.floor(Math.random() * colors.length)]
  }

  return { randomColor }
}
