import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import type { Component } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let response
  const componentName = event.context.params?.name

  try {
    // Validate the component name from the URL params
    if (!componentName || !/^[a-zA-Z0-9\s-]+$/.test(componentName)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or missing component name.',
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
    if (updatedComponentData.title && updatedComponentData.title.length > 100) {
      throw createError({
        statusCode: 400,
        message: 'Invalid title: Must not exceed 100 characters.',
      })
    }

    // Optional: Check for disallowed or unexpected fields
    const allowedFields = [
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

    // Fetch the existing component by name to ensure it exists
    const existingComponent = await prisma.component.findUnique({
      where: { componentName },
    })

    if (!existingComponent) {
      throw createError({
        statusCode: 404,
        message: `Component with name "${componentName}" not found.`,
      })
    }

    // Update the component in the database
    const data = await prisma.component.update({
      where: { componentName },
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
    console.error(`Failed to update component with name "${componentName}":`, {
      error: handledError,
      requestBody: await readBody(event),
    })

    // Set response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update component with name ${componentName}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})