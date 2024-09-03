import { defineEventHandler } from 'h3';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

// Fetch all random lists
export const fetchAllRandomLists = async () => {
  return prisma.randomList.findMany({
    include: {
      User: true, // Include user information if needed
    },
  });
};

export default defineEventHandler(async () => {
  try {
    const randomLists = await fetchAllRandomLists();

    // Process each RandomList
    const randomListDetails = randomLists.map((randomList) => {
      // Convert items (string) into an array or desired structure
      let processedItems;
      try {
        processedItems = JSON.parse(randomList.items);
      } catch (error) {
        console.error('Error parsing items:', error);
        processedItems = randomList.items.split(','); // Fallback to splitting by comma
      }

      return {
        ...randomList,
        items: processedItems,
        user: randomList.User ? randomList.User.username : null, // Optional: Add user information
      };
    });

    return { success: true, randomLists: randomListDetails };
  } catch (error: unknown) {
    return errorHandler({
      error,
      context: 'Fetching Random Lists',
    });
  }
});
