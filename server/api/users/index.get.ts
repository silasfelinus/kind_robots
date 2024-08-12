// /server/api/users/index.get.ts
import { defineEventHandler } from 'h3';
import { errorHandler } from '../utils/error';
import auth from '../../middleware/auth';
import { fetchUsers } from '.';

export default defineEventHandler(async (event) => {
  console.log('index.get API route invoked. Setting auth to true.');
  event.context.route = { auth: true }; // This line sets the auth property

  try {
    // Perform authentication
    auth(event);


    // Fetch users with pagination logic
    const users = await fetchUsers();

    return { success: true, users };
  } catch (error) {
    const { message } = errorHandler(error);
    console.error('Failed to fetch users:', message); // Log the formatted error message for debugging
    return { success: false, message: `Failed to fetch users. Reason: ${message}` };
  }
});
