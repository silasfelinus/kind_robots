// server/api/bots/[id].delete.ts
import { defineEventHandler } from 'h3';
import { deleteBot } from '../../bots';
import { errorHandler } from '../../utils/error'; // Import centralized error handler

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  
  if (!id) {
    return { success: false, message: 'Invalid bot ID.' };
  }

  try {
    const deleted = await deleteBot(id);

    if (!deleted) {
      return { success: false, message: `Bot with id ${id} does not exist.` };
    }

    return { success: true, message: `Bot with id ${id} successfully deleted.` };
  } catch (error: unknown) {
    const { message } = errorHandler(error);
    return { success: false, message: `Failed to delete bot with id ${id}: ${message}` };
  }
});
