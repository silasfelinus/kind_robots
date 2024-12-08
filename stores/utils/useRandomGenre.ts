export function useRandomGenre() {
  const genres = ['Fantasy', 'Sci-Fi', 'Steampunk', 'Post-Apocalyptic', 'Cyberpunk']

  function randomGenre() {
    return genres[Math.floor(Math.random() * genres.length)]
  }

  return { randomGenre }
}
