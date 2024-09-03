//server/api/auth/login.post.ts
import { defineEventHandler, readBody, sendError } from 'h3';
import { validateUserCredentials } from '.';

export default defineEventHandler(async (event) => {
  try {
    // Read and destructure the body from the event
    const { username, password } = await readBody<{
      username: string;
      password: string;
    }>(event);

    // Validate the user credentials
    const result = await validateUserCredentials(username, password);
    if (result) {
      // Return success response if credentials are valid
      return { success: true, user: result.user, token: result.token };
    } else {
      // Throw an error if credentials are invalid
      event.res.statusCode = 401; // Set status to 401 Unauthorized
      return { success: false, message: 'Invalid credentials' };
    }
  } catch (error: unknown) {
    // Log the error and return a failure response
    console.error('Error during login:', error);

    // Safely handle unknown errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    // Use sendError to set an appropriate status code if not already set
    return sendError(event, new Error(errorMessage));
  }
});
