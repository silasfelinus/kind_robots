import { defineEventHandler, readBody } from 'h3';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

console.log("🚀 Starting up the simplified art registration engine!");

type RequestData = {
  path?: string;
  cfg?: string;
  checkpoint?: string;
  sampler?: string;
  seed?: number;
  steps?: number;
  designer?: string;
  promptString: string;
  isMature?: boolean;
  isPublic?: boolean;
  promptId?: number;
  userId?: number;
  username?: string;  // Added for user lookup
  pitchId?: number;
  pitch?: string;     // Added for pitch lookup
  galleryId?: number;
  channelId?: number;
};

export default defineEventHandler(async (event) => {
  try {
    console.log('🌟 Event triggered! Reading request body...');
    const requestData: RequestData = await readBody(event);
    console.log('📬 Request data received:', requestData);

    // Validation: Ensure mandatory fields are present
    if (!requestData.promptString) {
      return errorHandler({
        error: new Error('Prompt String is a required field'),
        context: `Art Registration - Path: ${event.req.url}`,
        statusCode: 400,
      });
    }

    if (!requestData.path || requestData.path.trim() === '') {
      return errorHandler({
        error: new Error('Path is a required field'),
        context: `Art Registration - Path: ${event.req.url}`,
        statusCode: 400,
      });
    }

    // Fetch or create user based on username
    let userId = requestData.userId;
    if (!userId && requestData.username) {
      const user = await prisma.user.upsert({
        where: { username: requestData.username },
        update: {},
        create: { username: requestData.username, Role: 'USER' }, // Ensure Role is correctly handled
      });
      userId = user.id;
    }

    // Fetch or create pitch based on pitch string
    let pitchId = requestData.pitchId;
    if (!pitchId && requestData.pitch) {
      const pitch = await prisma.pitch.upsert({
        where: { pitch: requestData.pitch },
        update: {},
        create: { pitch: requestData.pitch },
      });
      pitchId = pitch.id;
    }

    // Default values if not provided
    const galleryId = requestData.galleryId ?? 21;
    const isMature = requestData.isMature ?? false;
    const isPublic = requestData.isPublic ?? true;

    // Ensure a valid path is provided or use a default path
    const validPath = requestData.path?.trim() || '/default/path';

    // Create the art object directly in the database
    console.log('🎨 Creating new Art entry...');
    const newArt = await prisma.art.create({
      data: {
        path: validPath,
        cfg: requestData.cfg,
        checkpoint: requestData.checkpoint,
        sampler: requestData.sampler,
        seed: requestData.seed,
        steps: requestData.steps,
        designer: requestData.designer ?? 'Anonymous',
        promptString: requestData.promptString,
        isPublic: isPublic,
        isMature: isMature,
        promptId: requestData.promptId,
        userId: userId,
        pitchId: pitchId,
        galleryId: galleryId,
        channelId: requestData.channelId,
      },
    });

    console.log('🎉 Art entry created successfully:', newArt);
    return { success: true, newArt };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Art Registration Error:', error.message, error.stack);
    } else {
      console.error('Art Registration Unknown Error:', error);
    }
    return errorHandler({
      error,
      context: `Art Registration - Path: ${event.req.url}`,
    });
  }
});
