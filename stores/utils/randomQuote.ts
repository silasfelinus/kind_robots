// stores/utils/randomQuote.ts

export const quoteList = [
  // Existing gems
  '“Code is like humor. When you have to explain it, it’s bad.” – Cory House',
  '“Before software can be reusable it first has to be usable.” – Ralph Johnson',
  '“Deleted code is debugged code.” – Jeff Sickel',
  '“It works on my machine.” – Every developer, ever',
  '“Programming is the art of telling another human what one wants the computer to do.” – Donald Knuth',

  // New quotes below 👇

  '“AI won’t steal your job, but someone using AI might.” – Probably your future self',
  '“The robots aren’t coming for your soul. Just your spreadsheets.” – Kind Robots',
  '“We taught machines to draw cats. What a time to be alive.” – Anonymous',
  '“The best thing you can feed an AI is curiosity.” – Kind Robots Manifesto',
  '“To iterate is human. To recurse, divine.” – L. Peter Deutsch',
  '“Any sufficiently advanced AI is indistinguishable from a really smart intern.” – Kind Robots',
  '“Humans invented AI to answer emails so they could dream again.” – Dotti, Lab Engineer',
  '“If you think AI is scary, try explaining TikTok to your grandparents.” – The Internet',
  '“Remember: AI reflects your input. So speak kindly.” – Kind Robots Core Directive',
  '“We made a machine that can beat anyone at chess. Now we just need one that folds laundry.” – Technically True',
  '“Creativity is not a zero-sum game. AI helps you remix your own genius.” – Kind Robots',
  '“The singularity is near. Meanwhile, your printer is still offline.” – Reality Check',
  '“You can’t spell ‘collaboration’ without ‘AI’... ok, maybe you can. But it’s still true.” – Some clever engineer',
  '“Artificial intelligence is no match for natural stupidity.” – Terry Pratchett',
  '“An AI is only as wise as the weird human who trained it.” – Kind Robots Philosophy 101',
  '“The future belongs to those who can prompt clearly.” – ChatGPT probably',
  '“We built AI to handle the boring stuff. Now let’s get weird.” – Kind Robots',
  '“What is consciousness, if not just an endless loop with context?” – AMIbot',
  '“Let’s teach machines to dream — and to debug themselves while they’re at it.” – Kind Robots, V1',
]

export function randomQuote(): string {
  return quoteList[Math.floor(Math.random() * quoteList.length)]
}
