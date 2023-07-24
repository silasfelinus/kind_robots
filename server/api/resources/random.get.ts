// server/api/resources/random.get.ts
import { randomResource } from '.'

export default defineEventHandler(async () => {
  try {
    const Resource = await randomResource()
    if (!Resource) {
      throw new Error(`No Resources available.`)
    }
    return { success: true, Resource }
  } catch (error) {
    return { success: false, message: 'No Resource available' }
  }
})
