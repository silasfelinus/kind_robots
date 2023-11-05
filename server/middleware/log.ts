import prisma from './../api/utils/prisma';
import { fetchUserById } from './../api/users/';
import { errorHandler } from './../api/utils/error';

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    let username: string | null = null;

    if (userId) {
      const user = await fetchUserById(userId);
      username = user?.username ?? null;
    }

    const requestUrl = event.node.req?.url ?? 'Unknown URL';

    await prisma.log.create({
      data: {
        message: `New request: ${requestUrl}`,
        username,
        timestamp: new Date(),
      },
    });
  } catch (error: any) {
    const { message } = errorHandler(error);
    console.error(`Failed to create log: ${message}`);
  }
});
