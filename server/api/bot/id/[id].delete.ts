// server/api/bots/[id].delete.ts
import { defineEventHandler } from 'h3';
import { deleteBot } from '../../bots';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id) throw new Error('Invalid bot ID.');
  try {
    const deleted = await deleteBot(id);
    if (!deleted) throw new Error(`Bot with id ${id} does not exist.`);
    return { success: true, message: `Bot with id ${id} successfully deleted.` };
  } catch (error) {
    return { success: false, message: `Failed to delete bot with id ${id}.` };
  }
});
