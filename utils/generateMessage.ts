// utils/generateMessage.ts

export const generateMessage = (filter = ''): string => {
  // Split the filter string into an array of lowercase category names to exclude
  const filters = filter.split(',').map(f => f.trim().toLowerCase())

  // Define the message categories and their corresponding messages
  const messageCategories: Record<string, string[]> = {
    funny: [
      "I'm just fluttering by!",
      "Time to flap these wings!",
      "I might be tiny, but I have a big heart!"
    ],
    'butterfly trivia': [
      "Did you know butterflies taste with their feet?",
      "Some butterflies can fly 37 miles per hour!",
      "A day without butterflies is a day without sunshine!"
    ],
    'butterfly internal monologue': [
      "I wonder if anyone notices how fabulous I look today.",
      "These wings are like magic, right?",
      "What's the point of flying if no one watches?"
    ],
    'malaria trivia': [
      "Malaria kills hundreds of thousands of people each year.",
      "Did you know malaria is transmitted by mosquitoes, not butterflies?",
      "Supporting malaria prevention is a great cause!"
    ],
    endorsements: [
      `Let's make a difference together! Visit [our sponsor](https://againstmalaria.com/amibot)`,
      `Check out how you can help prevent malaria at [our sponsor](https://againstmalaria.com/amibot)`
    ],
    random: [
      "Just another butterfly day.",
      "Do you think the wind is jealous of how well I float?",
      "Today feels like a 37-miles-per-hour kind of day."
    ]
  }

  // Filter out any categories that are in the exclude list
  const availableCategories = Object.keys(messageCategories).filter(category => !filters.includes(category))

  // If no categories are available after filtering, return a default message
  if (availableCategories.length === 0) {
    return "Fluttering silently..."
  }

  // Randomly select a category from the available categories
  const selectedCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)]

  // Randomly select a message from the chosen category
  const messages = messageCategories[selectedCategory]
  const randomMessage = messages[Math.floor(Math.random() * messages.length)]

  return randomMessage
}

