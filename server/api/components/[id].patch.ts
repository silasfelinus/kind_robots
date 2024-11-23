// /server/api/components/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Component } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let response
  let componentId: number | null = null

  try {
    // Parse and validate the component ID from the URL params
    componentId = Number(event.context.params?.id)
    if (isNaN(componentId) || componentId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or missing component ID.',
      })
    }

    // Parse the incoming request body
    const updatedComponentData: Partial<Component> = await readBody(event)

    // Ensure the request body contains valid fields
    if (!updatedComponentData || Object.keys(updatedComponentData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid component data provided.',
      })
    }

    // Validate each field in the payload
    if (updatedComponentData.componentName && !/^[a-zA-Z0-9\s-]+$/.test(updatedComponentData.componentName)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid componentName: Must contain only alphanumeric characters, spaces, or hyphens.',
      })
    }

    if (updatedComponentData.title && updatedComponentData.title.length > 100) {
      throw createError({
        statusCode: 400,
        message: 'Invalid title: Must not exceed 100 characters.',
      })
    }

    // Optional: Check for disallowed or unexpected fields
    const allowedFields = [
      'componentName',
      'folderName',
      'createdAt',
      'updatedAt',
      'isWorking',
      'underConstruction',
      'isBroken',
      'title',
      'notes',
      'artImageId',
    ]
    const invalidFields = Object.keys(updatedComponentData).filter(
      (field) => !allowedFields.includes(field),
    )
    if (invalidFields.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid fields provided: ${invalidFields.join(', ')}.`,
      })
    }

    // Fetch the existing component to ensure it exists
    const existingComponent = await prisma.component.findUnique({
      where: { id: componentId },
    })

    if (!existingComponent) {
      throw createError({
        statusCode: 404,
        message: `Component with ID ${componentId} not found.`,
      })
    }

    // Update the component in the database
    const data = await prisma.component.update({
      where: { id: componentId },
      data: updatedComponentData,
    })

    // Return the updated component in the expected response format
    response = {
      success: true,
      data,
      statusCode: 200, // OK
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(`Failed to update component with ID "${componentId}":`, {
      error: handledError,
      requestBody: await readBody(event),
    })

    // Set response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update component with ID ${componentId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
