// /server/api/rewards/batch.post.ts
import { defineEventHandler, readBody } from 'h3';
import { createRewardsBatch } from './'; // Import the batch creation function

export default defineEventHandler(async (event) => {
  try {
    const rewardsData = await readBody(event);

    if (!Array.isArray(rewardsData)) {
      return { success: false, message: 'Invalid JSON body. Expected an array of rewards.' };
    }

    // Validate each rewardData object in the array
    for (const rewardData of rewardsData) {
      if (!rewardData.text || !rewardData.power || !rewardData.icon) {
        return { success: false, message: 'Each reward must have text, power, and an icon.' };
      }
    }

    const { count, rewards, errors } = await createRewardsBatch(rewardsData);

    if (errors.length > 0) {
      return { success: false, message: 'Some rewards could not be created.', errors };
    }

    return { success: true, count, rewards };
  } catch (error: any) {
    return { success: false, message: 'Failed to create new rewards', error: error.message };
  }
});
