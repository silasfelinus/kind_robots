// ~/server/api/users/validate.post.ts
import { defineEventHandler } from 'h3'
import { validateUserInput } from './index' // Import the validateUserInput function

export default defineEventHandler(async (event) => {
  try {
    const userData = await readBody(event) // Assuming readBody returns parsed JSON

    if (!userData || typeof userData !== 'object') {
      return { success: false, message: 'Invalid JSON body' }
    }

    const { username, email } = userData // Destructure username and email from the parsed JSON

    const result = await validateUserInput({ username, email })
    return { success: true, ...result }
  } catch (error: any) {
    return { success: false, message: 'Failed to validate user input', error: error.message }
  }
})
