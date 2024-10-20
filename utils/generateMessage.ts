// utils/generateMessage.ts

const importMessageCategories = async () => {
  const messageModules = import.meta.glob('./messages/*.ts') // Adjust the path as per your structure
  const messages: Record<string, string[]> = {}

  // Import all message files
  for (const path in messageModules) {
    const module = await messageModules[path]()
    // Extract the category name (assumed to be the same as the file name)
    const categoryName = Object.keys(module)[0]
    messages[categoryName] = module[categoryName]
  }

  return messages
}

export const generateMessage = async (filter = ''): Promise<string> => {
  // Split the filter string into an array of lowercase category names to exclude
  const filters = filter.split(',').map(f => f.trim().toLowerCase())

  // Dynamically import all available message categories
  const messageCategories = await importMessageCategories()

  // Filter out any categories that are in the exclude list
  const availableCategories = Object.keys(messageCategories).filter(category => !filters.includes(category.toLowerCase()))

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
