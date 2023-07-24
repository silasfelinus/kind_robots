// /server/api/Resources/count.get.ts
import { fetchResources } from '.'

export default defineEventHandler(async () => {
  try {
    const Resources = await fetchResources()
    return { success: true, count: Resources.length }
  } catch (error) {
    return { success: false, message: 'Failed to get Resources count.' }
  }
})
