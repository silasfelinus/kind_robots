//server/api/components/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Component } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate the component ID from the URL params
    const id = Number(event.context.params?.id)
    if (!id || isNaN(id)) {
      return {
        success: false,
        message: 'Invalid or missing component ID.',
        statusCode: 400, // Bad Request
      }
    }

    // Parse the incoming request body
    const updatedComponentData: Partial<Component> = await readBody(event)

    // Ensure that the request body contains valid fields
    if (
      !updatedComponentData ||
      Object.keys(updatedComponentData).length === 0
    ) {
      return {
        success: false,
        message: 'No valid component data provided.',
        statusCode: 400, // Bad Request
      }
    }

    // Fetch the existing component to ensure it exists
    const existingComponent = await prisma.component.findUnique({
      where: { id },
    })

    if (!existingComponent) {
      return {
        success: false,
        message: 'Component not found.',
        statusCode: 404, // Not Found
      }
    }

    // Update the component in the database
    const updatedComponent = await prisma.component.update({
      where: { id },
      data: updatedComponentData,
    })

    // Return the updated component
    return {
      success: true,
      component: updatedComponent,
      statusCode: 200, // OK
    }
  } catch (error: unknown) {
    // Handle errors using the custom error handler
    return errorHandler({
      error,
      context: `Update Component - ID: ${event.context.params?.id}`,
    })
  }
})
