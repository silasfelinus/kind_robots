// /server/api/user/register.ts
import { createUserWithAuth } from '../users'

export default defineEventHandler(async (event) => {
  const { username, password, email } = await readBody(event)
  const result = await createUserWithAuth(username, password, email)
  return result
})
