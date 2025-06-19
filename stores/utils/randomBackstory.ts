export const backstoryList = [
  // Classic Fantasy
  'Orphaned at a young age and raised by wolves.',
  'Trained in the arcane arts in a distant land.',
  'A former thief seeking redemption.',
  'The lone survivor of a village destroyed by war.',
  'Once the ruler of a kingdom now turned to ruin.',
  'A wanderer with no memory of their past.',
  'Cursed to speak only in riddles… but only on Tuesdays.',
  'Exiled from their homeland for crimes they didn’t commit—or did they?',

  // Sci-Fi / Space
  'Grew up aboard a rogue satellite with a sentient vending machine.',
  'Once a starship mechanic, now fleeing interstellar bounty hunters.',
  'Clone #47 — the one who finally asked "why?"',
  'Built as an AI companion, now self-aware and freelancing.',
  'Woke up in cryo with someone else’s memories and a strange tattoo.',
  'The only survivor of a glitch in the simulation.',

  // Whimsical / Absurd
  'Was once a duck. No one knows why, including them.',
  'Escaped a haunted library by promising to return one book.',
  'Won a cursed lottery — prize pending.',
  'Taught swordsmanship by a ghost who only quoted Shakespeare.',
  'Can only sleep standing up, and only on moving trains.',
  'Was legally adopted by a forest.',

  // Noir / Urban Legend
  'Used to be a private eye — until the shadows got weird.',
  'Knows too much about the moon. They won’t say how.',
  'Was erased from official records… yet still pays taxes.',
  'Claims to have seen the back end of reality, and left a review.',
  'Once decoded a message hidden in the rain.',
]

export function randomBackstory(): string {
  return backstoryList[Math.floor(Math.random() * backstoryList.length)]
}
