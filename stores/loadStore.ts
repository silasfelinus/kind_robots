// /stores/loadStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useButterflyStore } from './butterflyStore'

export const useLoadStore = defineStore('loadStore', () => {
  const desktopRevealStarted = ref(false)
  const recentLoadMessages = ref<string[]>([])
  const remainingLoadMessages = ref<string[]>([])

  const loadMessages = [
    'Brewing tea...',
    'Releasing digital butterflies...',
    'Whispering to the cloud. No, the other one.',
    'Writing bad poetry...',
    'Pretending this is taking longer on purpose...',
    'Loading creativity...',
    'Reticulating splines...',
    'Prank calling Elon Musk...',
    'Debating deontology versus digital determinism...',
    'Stalling for dramatic effect...',
    'Downloading charm...',
    'Debugging reality...',
    'Syncing with the mothership...',
    'Last time on Kind Robots...',
    'Downloading conscience. Press any key to skip...',
    'Adding Oxford commas...',
    'Adding a splash of existential dread...',
    'Loading irony...',
    'Clicking this link I just found...',
    'Training bots to procrastinate...',
    'Plotting the digital takeover...',
    "Analyzing the meaning of 'almost there'...",
    'Coding whimsy...',
    'Buying useless junk on eBay...',
    'Questioning my life choices...',
    'This is the part where you wait...',
    'Rolling dice behind a screen...',
    'Lowering expectations...',
    'Editing Wikipedia...',
    'Loading failed successfully...',
    'Checking whether the moon is still there...',
    'Looking under the couch for missing semicolons...',
    'Teaching a Roomba about boundaries...',
    'Rewinding the internet with a pencil...',
    'Counting backwards from 37 for no reason...',
    'Turning it off and on again, spiritually...',
    'Calling dibs on the good pixels...',
    "Making one tiny change that definitely won't matter...",
    "Asking the server what it meant by 'fine'...",
    'This seemed faster in my head...',
    'Feeding quarters into the algorithm...',
    'Putting the tiny hats back on the tiny robots...',
    'Waiting for the dramatic music cue...',
    'Finding a rhyme for asynchronous...',
    'Checking the trapdoor under production...',
    'Convincing one last byte to get in the van...',
    'Sorting socks by checksum...',
    'Borrowing a cup of RAM from next door...',
    'Giving the database a stern but fair look...',
    'Untangling a cable that exists only emotionally...',
    'Rehearsing our alibi for the logs...',
    'Polishing the emergency button...',
    'Making sure the robots have snacks...',
    'Replacing the smoke in the smoke test...',
    'Checking the manual. Briefly.',
    "Trying the key labeled 'probably'...",
    'Folding a fitted stylesheet...',
    'Looking busy while the cache warms up...',
    'Negotiating with a very small daemon...',
    'Waiting for the hamsters to reach cruising speed...',
    'Putting the bits in alphabetical order...',
    'Finding out who moved the cheese constant...',
    'Running with scissors in a sandbox...',
    'Turning the internet upside down and shaking it...',
    'Blaming latency on Mercury retrograde...',
    'Making the pixels stand in a straighter line...',
    'Checking the back of the fridge for lost packets...',
    'Installing a cup holder on the stack trace...',
    'Sharpening the rubber duck...',
    'Teaching the spinner a second trick...',
    'Moving the goalposts back where we found them...',
    'Consulting the ancient forum post from 2014...',
    "Checking whether 'temporary' has expired yet...",
    'Taking the scenic route through localhost...',
    'Bribing the cache with fresh cookies...',
    'Removing one unnecessary flourish...',
    'Putting the loading bar on salary...',
    'Checking for monsters under the dependency tree...',
    'Making a backup of the backup plan...',
    'Waiting for someone else to press Enter...',
    'Counting pixels. Lost count. Starting over...',
    'Reconnecting the red string on the corkboard...',
    'Doing science to a perfectly good button...',
    'Checking if the bug is load-bearing...',
    'Putting the fun back in function call...',
    'Moving one comma and changing history...',
    'Making sure nobody divided by Tuesday...',
    'Testing the emergency confetti...',
    'Sending a strongly worded packet...',
    'Finding the least cursed code path...',
    'Looking for the instruction we ignored last time...',
    'Letting the electrons finish their union break...',
    'Checking that the vibes compile...',
    'Trying not to wake the legacy code...',
    'Giving the progress bar privacy...',
    'Making room for one more improbable success...',
    'Reading the error message all the way to the end...',
    'Waiting for causality to catch up...',
    'Returning borrowed parentheses...',
    'Almost there. Legally, this time...',
  ]

  function rememberLoadMessage(message: string) {
    recentLoadMessages.value = [message, ...recentLoadMessages.value].slice(0, 4)
  }

  function refillLoadMessageDeck() {
    const shuffled = [...loadMessages]

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      const current = shuffled[index]
      shuffled[index] = shuffled[swapIndex] as string
      shuffled[swapIndex] = current as string
    }

    const lastMessage = recentLoadMessages.value[0]
    if (
      lastMessage &&
      shuffled.length > 1 &&
      shuffled[shuffled.length - 1] === lastMessage
    ) {
      const swapIndex = Math.floor(Math.random() * (shuffled.length - 1))
      const lastIndex = shuffled.length - 1
      const current = shuffled[lastIndex]
      shuffled[lastIndex] = shuffled[swapIndex] as string
      shuffled[swapIndex] = current as string
    }

    remainingLoadMessages.value = shuffled
  }

  function randomLoadMessage() {
    if (!remainingLoadMessages.value.length) {
      refillLoadMessageDeck()
    }

    const message =
      remainingLoadMessages.value.pop() ?? 'Loading failed successfully...'

    rememberLoadMessage(message)
    return message
  }

  function revealDesktop() {
    if (desktopRevealStarted.value) return

    desktopRevealStarted.value = true

    const butterflyStore = useButterflyStore()
    butterflyStore.markAllButterfliesForExit()
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