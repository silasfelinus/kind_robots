// /server/api/scenarios/index.get.ts
import { defineEventHandler } from 'h3';
import prisma from '../utils/prisma';
import { errorHandler } from '../utils/error';

export default defineEventHandler(async (event) => {
  try {
    console.log('Fetching all scenarios from the database');

    // Fetch all scenarios
    const data = await prisma.scenario.findMany();

    console.log('All scenarios fetched successfully.');

    return {
      success: true,
      message: 'All scenarios fetched successfully.',
      data,
      statusCode: 200,
    };
  } catch (error: unknown) {
    console.error('Error occurred while fetching scenarios:', error);

    // Use errorHandler to get the structured error response
    const { success, message, statusCode } = errorHandler(error);
    console.log('Error details after handling:', {
      success,
      message,
      statusCode,
    });

    return {
      success,
      message,
      statusCode,
    };
  }
});