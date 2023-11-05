// /server/api/rewards/index.delete.ts
import { defineEventHandler, readBody } from 'h3';
import { deleteReward } from '.';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { id } = body;

    const success = await deleteReward(id);
    return { success };
  } catch (error: any) {
    return { success: false, message: 'Failed to delete reward', error: error.message };
  }
});
