import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchChannelWithMessages } from '.' // Make sure this import path is correct

export default defineEventHandler(async (event) => {
  try {
    // Get the channel ID from the event context parameters
    const id = Number(event.context.params?.id)

    // Fetch the channel and its messages using the function
    const channels = await fetchChannelWithMessages(id)

    // Return the fetched channel data
    return { success: true, channels }
  } catch (error: any) {
    // Handle any errors using the centralized errorHandler
    return errorHandler(error)
  }
})
