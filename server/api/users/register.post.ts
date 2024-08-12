// /server/api/user/register.post.ts
import { defineEventHandler, readBody } from 'h3';
import { useErrorStore, ErrorType } from '@/stores/errorStore'; // Importing the error store
import prisma from '../utils/prisma';
import { createUser } from '.';

export default defineEventHandler(async (event) => {
  console.log('🚀 Launching the user creation journey...');

  console.log('📬 Received event context params:', event.context.params);

  // Initialize the error store
  const errorStore = useErrorStore();

  try {
    // Reading the user data from the event body
    const userData = await readBody(event);
    console.log('📬 Received user data:', userData);

    // Ensuring the essential fields are provided
    if (!userData.username && !userData.email) {
      throw new Error('👤 Username or 📧 email is required to forge a new star in our universe.');
    }
    if (userData.password && userData.password.length < 8) {
      throw new Error('🔑 Password must be a strong shield with at least 8 characters.');
    }

    // Initiating the user creation
    const result = await createUser({
      username: userData.username,
      email: userData.email,
      password: userData.password,
    });

    // Check if the creation was successful
    if (result.success) {
      console.log('🌟 A new star is born in our user universe:', result);
      return {
        success: true,
        message: '🌟 Welcome to our cosmic family, brave explorer! Your account has been created.',
        user: result.user,
      };
    }

    // Handle known issues
    throw new Error(
      typeof result.message === 'string'
        ? `🌌 Cosmic anomaly detected: ${result.message}`
        : '🌌 An unexpected cosmic event occurred. Please try forging your star again.',
    );
  } catch (error) {
    // Using the error store to handle the error
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Log the error using errorStore
    errorStore.setError(ErrorType.UNKNOWN_ERROR, errorMessage);

    // Set HTTP status code if necessary
    event.res.statusCode = 500;

    // Return a response with the error message from errorStore
    return {
      success: false,
      message: `🚀 Mission abort! ${errorStore.message}`,
    };
  }
});
