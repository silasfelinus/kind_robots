// stores/utils/randomTrivia.ts

const trivia = [
  '💾 The "Save" icon is based on a floppy disk — ask your elders what that is.',
  '🦠 The first computer virus was created in 1986 and was called "Brain."',
  '🐞 The term "bug" in programming originated from an actual moth found in a computer in 1947.',
  '🧮 The word "algorithm" comes from a 9th-century Persian mathematician named Al-Khwarizmi.',
  '💡 The first computer programmer was Ada Lovelace — in the 1800s!',
  '🌐 The first website is still online: info.cern.ch',
  '🔐 The password for the first ARPANET login was... "LOGIN" — but it crashed after "LO".',
  '🧠 CAPTCHA stands for "Completely Automated Public Turing test to tell Computers and Humans Apart."',
  '🔋 Early laptops in the 1980s could weigh over 10 pounds. Portable-ish!',
  '🛰️ Voyager 1 still communicates with Earth using a 1970s computer with less power than a modern calculator.',
]

export function randomTrivia() {
  return trivia[Math.floor(Math.random() * trivia.length)]
}
