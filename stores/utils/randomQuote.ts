// stores/utils/randomQuote.ts

const quotes = [
  '“Code is like humor. When you have to explain it, it’s bad.” – Cory House',
  '“Before software can be reusable it first has to be usable.” – Ralph Johnson',
  '“Deleted code is debugged code.” – Jeff Sickel',
  '“It works on my machine.” – Every developer, ever',
  '“Programming is the art of telling another human what one wants the computer to do.” – Donald Knuth',
]

export function randomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)]
}
