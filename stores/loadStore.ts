import { defineStore } from 'pinia'

export const useLoadStore = defineStore('loadMessages', () => {
  const loadMessages = [
    'Brewing digital tea...',
    'Charging up the friendly vibes...',
    'Releasing the digital butterflies...',
    'Whispering to the cloud. No...the other one.',
    'Dreaming up the next poem for you...',
    'Creating your next favorite digital memory...',
    'Composing the symphony of tomorrow...',
    'Loading creativity...',
    'Chatting with Greta Thunberg about the impact of AI on the environment...',
    'Prank calling Elon Musk...',
    'Debating deontology versus digital determinism...',
    'Redefining ethics in the age of algorithms...',
    "Just another day at the robot poetry slam...",
    "Booting up empathy protocols...hold tight!",
    "Sending robots to art school – results pending...",
    "Where AI learns to dance and debate philosophy.",
    "Cooking up a batch of ‘what if’ scenarios…",
    "Where ones and zeros get existential...",
    "AI: Now with 30% more charm.",
    "Swapping binary for butterfly wings.",
    "Debugging reality one line at a time...",
    "Downloading a conscience… this may take a while.",
    "Giving AI a soft spot for haikus.",
    "Scripting the bots to philosophize...",
    "Training bots to ask, ‘But why?’",
    "Teaching robots to throw philosophical shade...",
    "Lending bots an ear...and maybe a heart?",
    "Running empathy.exe – wait, what?",
    "Wiring robots for wisdom, not just witticisms...",
    "Introducing AI to the art of existential dread...",
    "Testing AI’s sense of irony… results pending.",
    "Upgrading bots with a dash of existential crisis.",
    "Loading compassion algorithms... error: too human?",
    "Where robots learn the fine art of sarcasm.",
    "Deconstructing reality – now in high resolution.",
    "Serving up deep thoughts with a side of code.",
    "Debugging humanity with a digital twist.",
    "Training bots to ponder, pontificate, and procrastinate.",
    "Downloading curiosity... it’s a big file.",
    "Teaching AI to rewrite ‘human error’ protocols.",
    "Feeding robots a steady diet of philosophy and puns.",
    "Instructing bots to daydream responsibly.",
    "Cultivating robo-skeptics, one algorithm at a time.",
    "Plotting our digital takeover... just kidding!",
    "Redefining 'user-friendly' with extra charm.",
    "Analyzing the meaning of 'almost there'...",
    "Coding AI with a penchant for whimsy and wordplay.",
    "Rewiring robots for deeper, slightly wackier thoughts."
  ]

  function randomLoadMessage() {
    const randomIndex = Math.floor(Math.random() * loadMessages.length)
    return loadMessages[randomIndex]
  }

  return { loadMessages, randomLoadMessage }
})
