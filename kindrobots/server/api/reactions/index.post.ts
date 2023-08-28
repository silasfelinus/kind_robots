// /server/api/reactions/index.post.ts
import { addReactions } from '.'

export default defineEventHandler(async (event) => {
  try {
    const reactionsData = await readBody(event)
    const result = await addReactions(reactionsData)
    return { success: true, ...result }
  } catch (error) {
    return { success: false, message: 'Failed to create new reactions' }
  }
})
