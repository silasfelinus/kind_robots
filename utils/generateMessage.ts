// utils/generateMessage.ts

const importMessageCategories = async (): Promise<Record<string, string[]>> => {
  const messageModules = import.meta.glob('./messages/*.ts')
  const messages: Record<string, string[]> = {}

  for (const path in messageModules) {
    const loader = messageModules[path]
    if (!loader) continue

    const module = (await loader()) as Record<string, string[]>
    const categoryName = Object.keys(module)[0]

    if (!categoryName) continue

    messages[categoryName] = module[categoryName] ?? []
  }

  return messages
}

export const generateMessage = async (filter = ''): Promise<string> => {
  const filters = filter.split(',').map((f) => f.trim().toLowerCase())

  const messageCategories = await importMessageCategories()

  const availableCategories = Object.keys(messageCategories).filter(
    (category) => !filters.includes(category.toLowerCase()),
  )

  if (availableCategories.length === 0) {
    return 'Fluttering silently...'
  }

  const selectedCategory =
    availableCategories[Math.floor(Math.random() * availableCategories.length)]

  if (!selectedCategory) {
    return 'Fluttering silently...'
  }

  const messages = messageCategories[selectedCategory] ?? []

  if (messages.length === 0) {
    return 'Fluttering silently...'
  }

  const randomMessage = messages[Math.floor(Math.random() * messages.length)]

  return randomMessage ?? 'Fluttering silently...'
}
