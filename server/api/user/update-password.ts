import { validatePassword, hashPassword, validateUserCredentials } from './../users'
import prisma from './../utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  const { oldPassword, newPassword } = await readBody(event)

  if (!userId) {
    return { success: false, message: 'User not authenticated 🛑' }
  }

  // Fetch the existing UserAuth record
  const userAuth = await prisma.userAuth.findUnique({
    where: { username: event.context.user?.username }
  })

  if (!userAuth) {
    return { success: false, message: 'User not found 🤷‍♀️' }
  }

  // Validate the old password using your existing function
  const oldPasswordValidation = await validateUserCredentials(
    event.context.user?.username,
    oldPassword
  )
  if (!oldPasswordValidation) {
    return { success: false, message: 'Old password is incorrect ❌' }
  }

  // Validate the new password using your existing function
  if (!validatePassword(newPassword)) {
    return {
      success: false,
      message:
        'New password does not meet the criteria 📝. Make sure it has at least 8 characters, one letter, and one number.'
    }
  }

  // Hash the new password using your existing function
  const hashedNewPassword = await hashPassword(newPassword)

  // Update the UserAuth record with the new password
  await prisma.userAuth.update({
    where: { username: event.context.user?.username },
    data: { password: hashedNewPassword }
  })

  return { success: true, message: 'Password updated successfully 🎉' }
})
