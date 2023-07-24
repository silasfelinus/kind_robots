// /server/api/resources/index.post.ts
import { addResources } from '.'

export default defineEventHandler(async (event) => {
  try {
    const ResourcesData = await readBody(event)
    const result = await addResources(ResourcesData)
    return { success: true, ...result }
  } catch (error) {
    return { success: false, message: 'failed to create a new Resource' }
  }
})
