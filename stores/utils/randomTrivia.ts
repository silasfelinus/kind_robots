// stores/utils/randomTrivia.ts

export const triviaList = [
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
  '⌨️ QWERTY keyboards were designed to slow typists down — to prevent typewriter jams.',
  '🧊 The first computer mouse was made of wood — and had only one button.',
  '🔎 Google was originally called “Backrub.” Yes, really.',
  '🎮 The Konami Code (↑↑↓↓←→←→BA) appears in over 100 games — and several websites.',
  '💬 The first emoticon ever used was :-) in 1982. The internet smiled.',
  '⌛ The hourglass loading icon dates back to the original Apple Macintosh in 1984.',
  '📦 Amazon once stored physical books in Jeff Bezos’s garage before becoming... well, *everything*.',
  '👾 In Japan, the Space Invaders game caused a coin shortage in 1978.',
  '🧑‍🚀 The Apollo 11 guidance computer had 64KB of memory. Your phone has millions of times more.',
  '📟 Pagers came before cell phones — and were wildly cool if you were a doctor or a hacker.',
  '📼 VHS won against Betamax not because it was better... but because it was cheaper.',
  '🤖 The word "robot" comes from a 1920 Czech play and means "forced laborer."',
  '🪐 Saturn’s moon Titan has more liquid hydrocarbons than Earth’s oil reserves. Start your space startup now!',
  '🛠️ The first 1GB hard drive in 1980 weighed over 500 pounds — and cost $40,000.',
  '🧊 The average Google search travels about 1,500 miles through fiber optic cables.',
  '⏱️ The original iPod could hold 1,000 songs... and now we stream 10 million we never finish.',
  '📡 Wi-Fi isn’t short for anything. It was just made to sound like Hi-Fi.',
  '🧬 The human brain can store over 2.5 petabytes of memory. Somewhere. Probably.',
  '🪛 JavaScript was written in just 10 days. You can tell.',
  '✨ The Mars rovers run on a version of Linux... and sheer determination.',
  '📠 Fax machines existed before telephones — and they’re somehow still used today.',
  '💳 The first online purchase was a pizza from Pizza Hut in 1994. E-commerce peaked early.',
  '🪙 Bitcoin’s creator, Satoshi Nakamoto, has never been identified. Mystery or myth?',
  '⛓️ The term “blockchain” didn’t appear in the original Bitcoin whitepaper.',
  '🧯 The fire emoji was added to Unicode in 2010. It’s been 🔥 ever since.',
  '🌈 ENIAC, one of the first computers, had over 17,000 vacuum tubes — and zero RGB lighting.',
]

export function randomTrivia() {
  return triviaList[Math.floor(Math.random() * triviaList.length)]
}
