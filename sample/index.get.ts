// @ts-nocheck
/* eslint-disable */
// test-ignore

// /server/api/[model]/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  const modelName = 'sampleModel' // <-- change this
  let response

  try {
    console.log(`Fetching all ${modelName}s from the database...`)

    const data = await prisma[modelName].findMany()

    console.log(`All ${modelName}s fetched successfully.`)

    response = {
      success: true,
      message: `All ${modelName}s fetched successfully.`,
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handled = errorHandler(error)
    console.error(`Error fetching ${modelName}s:`, handled)
    event.node.res.statusCode = handled.statusCode || 500
    response = {
      success: false,
      message: handled.message || `Failed to fetch ${modelName}s.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
