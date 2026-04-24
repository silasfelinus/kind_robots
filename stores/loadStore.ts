// /stores/loadStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useButterflyStore } from './butterflyStore'

export const useLoadStore = defineStore('loadStore', () => {
  const desktopRevealStarted = ref(false)
  const recentLoadMessages = ref<string[]>([])

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

  function rememberLoadMessage(message: string) {
    recentLoadMessages.value = [message, ...recentLoadMessages.value].slice(0, 4)
  }

  function randomLoadMessage() {
    const availableMessages = loadMessages.filter(
      (message) => !recentLoadMessages.value.includes(message),
    )

    const messagePool = availableMessages.length ? availableMessages : loadMessages
    const randomIndex = Math.floor(Math.random() * messagePool.length)
    const message = messagePool[randomIndex] ?? 'Loading failed successfully...'

    rememberLoadMessage(message)
    return message
  }

  function revealDesktop() {
    if (desktopRevealStarted.value) return

    desktopRevealStarted.value = true

    const butterflyStore = useButterflyStore()
    butterflyStore.startStartupExit()
  }

  function resetRevealState() {
    desktopRevealStarted.value = false
  }

  return {
    loadMessages,
    recentLoadMessages,
    desktopRevealStarted,
    randomLoadMessage,
    revealDesktop,
    resetRevealState,
  }
})