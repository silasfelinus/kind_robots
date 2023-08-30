import { defineStore } from 'pinia'

export const useLoadStore = defineStore('loadMessages', () => {
  const loadMessages = [
    'Brewing digital tea for our robot friends...',
    'Charging up the friendly vibes...',
    'Releasing the digital butterflies...',
    'Kind Robot Cafe - Serving 23rd-century smiles!',
    'Whispering to the cloud. No...the other one.',
    'Gathering stardust for that extra sparkle...',
    'Dreaming up the next poem for you...',
    'Inviting all the bots for a digital dance...',
    'Fetching the colors of joy...',
    'Unfolding origami dreams for a brighter day...',
    'Blending a mix of art, tech, and a sprinkle of magic...',
    'Cue the cheerful bot band, loading in progress...',
    'Building bridges to digital dreams...',
    'Stringing up the harp of harmonious codes...',
    'Creating your next favorite digital memory...',
    'Serving up a slice of pixel-perfect paradise...',
    'Composing the symphony of tomorrow...',
    'Sculpting digital daisies for the virtual vase...',
    'Kind Robots in action, loading creativity...',
    'Rolling out the digital red carpet for you...',
    'Swirling up a storm of friendly pixels...',
    'Lining up the binary stars for a digital constellation...',
    'Steeping a fresh batch of bot brew...',
    'Weaving a tapestry of tech-tales...',
    'Painting the canvas of cyberspace with joy...'
  ]

  function randomLoadMessage() {
    const randomIndex = Math.floor(Math.random() * loadMessages.length)
    return loadMessages[randomIndex]
  }

  return { loadMessages, randomLoadMessage }
})
