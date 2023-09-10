import auth from './../../middleware/auth'
import prisma from './../utils/prisma'
import { fetchUserById, updateUser, hashPassword } from '.'

export default defineEventHandler(async (event) => {
  console.log('[id].patch API route invoked. Setting auth to true.')
  event.context.route = { auth: true }
  auth(event)

  const id = Number(event.context.params?.id)
  if (!id) {
    console.error('Invalid User ID.')
    throw new Error('Invalid User ID.')
  }

  try {
    console.log(`Fetching user by ID: ${id}`)
    const User = await fetchUserById(id)
    const data = await readBody(event)

    if (!User) {
      console.error('User not found.')
      throw new Error('User not found.')
    }

    console.log('User found, checking for password update.')
    // If password is provided, hash it and update or create UserAuth
    if (data.password) {
      console.log('Password provided, hashing.')
      const hashedPassword = await hashPassword(data.password)
      const userAuth = await prisma.userAuth.findUnique({ where: { username: User.username } })

      if (userAuth) {
        console.log('UserAuth found, updating password.')
        await prisma.userAuth.update({
          where: { username: User.username },
          data: { password: hashedPassword }
        })
      } else {
        console.log('UserAuth not found, creating new UserAuth.')
        await prisma.userAuth.create({
          data: {
            username: data.username || User.username,
            password: hashedPassword
          }
        })
      }
    }
    // Destructure the password field from the data object
    const { password, ...restData } = data

    // Log the data to be updated in User model
    console.log('Updating the following fields in User model:', JSON.stringify(restData, null, 2))

    // Update only the provided fields in User model
    const updatedUser = await updateUser(id, restData)

    console.log('User update successful.')
    return { success: true, User: updatedUser }
  } catch (error: any) {
    console.error('Full error:', JSON.stringify(error, null, 2)) // Log the full error
    return { success: false, message: `Failed to update User with id ${id}.`, error: error.name }
  }
})
