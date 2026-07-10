// /server/api/users/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { validateApiKey } from '../../utils/validateKey'
import { userIsAdmin } from '../../utils/authUser'
import { deleteUserWithOwnedData } from '../../utils/userPurge'

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate the target User ID from the URL params
    const targetUserId = Number(event.context.params?.id)
    if (isNaN(targetUserId) || targetUserId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid User ID. It must be a positive integer.',
      })
    }

    // A user may delete themselves; an admin (or the beta admin token) may
    // delete any non-admin account. This is what lets test cleanup, which
    // authenticates with the admin token, actually remove disposable users.
    const { isValid, user } = await validateApiKey(event)
    const requestingUserId = user?.id
    const isSelf = requestingUserId === targetUserId
    const isAdmin = Boolean(
      user && userIsAdmin({ id: user.id, Role: user.Role }),
    )

    if (!isValid || (!isSelf && !isAdmin)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this user.',
      })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, Role: true },
    })

    if (!targetUser) {
      throw createError({
        statusCode: 404,
        message: `User with ID ${targetUserId} not found.`,
      })
    }

    if (!isSelf && userIsAdmin(targetUser)) {
      throw createError({
        statusCode: 403,
        message: 'Admin accounts can only be deleted by themselves.',
      })
    }

    // Delete the user plus every owned row that would otherwise RESTRICT the
    // delete (collections, ledger rows, reactions, relations, ...).
    const purged = await deleteUserWithOwnedData(targetUserId)

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `User with ID ${targetUserId} successfully deleted.`,
      data: { purged },
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to delete user with ID ${event.context.params?.id}.`,
    }
  }
})
