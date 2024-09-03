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
  pitchId?: number;
  galleryId?: number;
  channelId?: number;
};

export default defineEventHandler(async (event) => {
  try {
    console.log('🌟 Event triggered! Reading request body...');
    const requestData: RequestData = await readBody(event);
    console.log('📬 Request data received:', requestData);

    // Validation: Ensure mandatory fields are present
    if (!requestData.path || !requestData.userId || !requestData.promptString) {
      throw new Error('Path, User ID, and Prompt String are required fields');
    }

    // Default values if not provided
    const galleryId = requestData.galleryId ?? 21;
    const isMature = requestData.isMature ?? false;
    const isPublic = requestData.isPublic ?? true;

    // Create the art object directly in the database
    console.log('🎨 Creating new Art entry...');
    const newArt = await prisma.art.create({
      data: {
        path: requestData.path,
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
        userId: requestData.userId,
        pitchId: requestData.pitchId,
        galleryId: galleryId,
        channelId: requestData.channelId,
      },
    });

    console.log('🎉 Art entry created successfully:', newArt);
    return { success: true, newArt };
  } catch (error: unknown) {
    console.error('Art Registration Error:', error);
    return errorHandler({
      error,
      context: `Art Registration - Path: ${event.req.url}`,
    });
  }
});
