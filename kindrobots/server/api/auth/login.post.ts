import * as jwt from 'jsonwebtoken'
import { validateUserCredentials } from '../users'

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_DEFAULT_SECRET' // Ideally from env variables

export default defineEventHandler(async (event) => {
  try {
    const { email, password } = await readBody(event)
    const user = await validateUserCredentials(email, password)

    if (!user) {
      return { success: false, message: 'Invalid email or password.' }
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1d'
    })

    return { success: true, token }
  } catch (error: any) {
    return { success: false, message: 'Failed to login.', error: error.message }
  }
})
