import { defineStore } from 'pinia'

export const useLoadStore = defineStore('loadStore', () => {
  const loadMessages = [
    'Brewing tea...',
    'Releasing digital butterflies...',
    'Whispering to the cloud. No...the other one.',
    'Writing bad poetry',
    'Pretending this is taking longer on purpose...',
    'Loading creativity...',
    'Reticulating splines...',
    "Messaging Greta Thunberg about AI's impact on the environment...",
    'Prank calling Elon Musk...',
    'Debating deontology versus digital determinism...',
    'Stalling for dramatic effect...',
    'Mining crypto on your computer...',
    'Downloading charm...',
    'Debugging reality...',
    'Syncing with the mothership...',
    'Last time on Kind Robots...',
    'Downloading conscience, press any key to skip...',
    'adding oxford commas...',
    'Adding a splash of existential dread...',
    'Loading irony...',
    'clicking this link I just found...',
    'Training bots to procrastinate.',
    'Plotting the digital takeover...',
    "Analyzing the meaning of 'almost there'...",
    'Coding whimsy...',
    'Buying useless junk on ebay',
    'Questioning my life choices...',
    'This is the part where you wait...',
    'Rolling dice behind a screen...',
    'Lowering expectations...',
    'Editing wikipedia...',
    'Loading failed successfully...',
  ]

  function randomLoadMessage() {
    const randomIndex = Math.floor(Math.random() * loadMessages.length)
    return loadMessages[randomIndex]
  }

  return { loadMessages, randomLoadMessage }
})
