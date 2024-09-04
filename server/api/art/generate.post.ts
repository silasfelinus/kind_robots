import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { generateSillyName } from './../../../utils/useRandomName'
import { saveImage } from './../../../server/api/utils/saveImage'
import type { PitchType } from '@prisma/client'

console.log(
  "🚀 Starting up the art generation engine! Let's create something amazing!",
)

type GenerateImageResponse = {
  images: string[]
  error?: string
}

type RequestData = {
  path?: string | null
  cfg?: string | null
  checkpoint?: string
  sampler?: string | null
  seed?: number | null
  steps?: number | null
  designer?: string | null
  title?: string  | null
  description?: string | null
  flavorText?: string | null
  highlightImage?: string | null
  PitchType: PitchType | null
  isMature?: boolean 
  isPublic?: boolean 
  promptString: string 
  promptId?: number | null
  userId?: number  | null
  username?: string | null
  pitchId?: number  | null
  pitch?: string | null
  playerId?: number | null
  playerName?: string | null
  galleryId?: number | null
  galleryName?: string | null
  channelId?: number | null
  channelName?: string | null
}

export default defineEventHandler(async (event) => {
  try {
    console.log('🌟 Event triggered! Reading request body...');
    const requestData: RequestData = await readBody(event);

    if (!requestData.promptString) {
      throw new Error('Missing prompt in request data.');
    }

    console.log('📬 Request data received:', requestData);

    console.log('🔐 Initializing validated data object...');
    const validatedData: Partial<RequestData> = {};

    // 1. Validate and Load Related Entities
    validatedData.userId = await validateAndLoadUserId(requestData, validatedData);
    if (!validatedData.userId) {
      throw new Error('User validation failed.');
    }

    validatedData.promptId = await validateAndLoadPromptId(requestData);
    if (!validatedData.promptId) {
      throw new Error('Prompt validation failed.');
    }

    validatedData.pitchId = await validateAndLoadPitchId(requestData);
    if (!validatedData.pitchId) {
      throw new Error('Pitch validation failed.');
    }

    validatedData.galleryId = await validateAndLoadGalleryId(requestData);
    validatedData.designer = validateAndLoadDesignerName(requestData);

    console.log('🎉 All validations passed! Generating image...');
    
    // 2. Generate Image Using Modeler
    const response: GenerateImageResponse = await generateImage(requestData.promptString, validatedData.designer!);

    if (!response || !response.images?.length) {
      console.error('Image generation failed:', response?.error);
      throw new Error(`Image generation failed: ${response?.error || 'No images generated.'}`);
    }

    console.log('🖼 Image generated! Response:', response);

    // 3. Save Generated Image
    const base64Image = response.images[0];
    let imagePath = await saveImage(base64Image, 'cafefred');

    if (!imagePath) {
      throw new Error('Failed to save generated image.');
    }

    if (imagePath.startsWith('/public') || imagePath.startsWith('public')) {
      imagePath = imagePath.replace(/^\/?public/, '');
    }

    console.log('📁 Image path adjusted:', imagePath);

    // 4. Create Art Entry in Database
    console.log('🎨 Creating new Art entry...');
    const newArt = await prisma.art.create({
      data: {
        path: imagePath,
        cfg: requestData.cfg,
        checkpoint: requestData.checkpoint,
        sampler: requestData.sampler,
        seed: requestData.seed,
        steps: requestData.steps,
        designer: validatedData.designer,
        promptString: requestData.promptString,
        isPublic: requestData.isPublic,
        isMature: requestData.isMature,
        promptId: validatedData.promptId,
        userId: validatedData.userId,
        pitchId: validatedData.pitchId,
        galleryId: validatedData.galleryId || 21,
        channelId: requestData.channelId,
      },
    });

    console.log('🎉 Art entry created successfully:', newArt);
    return { success: true, newArt };

  } catch (error: unknown) {
    console.error('Art Generation Error:', error);
    return errorHandler({
      error,
      context: `Art Generation - Prompt: ${event.req.url}`,
    });
  }
});


async function validateAndLoadUserId(
  data: RequestData,
  validatedData: Partial<RequestData>,
): Promise<number> {
  console.log('🔍 Validating and loading User ID...');

  if (!data.username && !data.userId) {
    console.warn('No userName or userId provided.');
    return 0;
  }

  try {
    if (data.username) {
      const user = await prisma.user.upsert({
        where: { username: data.username },
        update: {},
        create: {
          username: data.username,
          createdAt: new Date(),
          Role: 'USER', 
        },
      });
      validatedData.username = user.username;
      return user.id;
    }

    if (data.userId) {
      return data.userId;
    }
  } catch (error) {
    console.error('Error loading user:', error);
    throw new Error('User validation failed.');
  }

  return 0;
}

async function validateAndLoadPromptId(data: RequestData): Promise<number> {
  console.log('🔍 Validating and loading Prompt ID...');

  if (!data.promptString) {
    console.warn('No prompt provided.');
    throw new Error('Prompt validation failed.');
  }

  try {
    const existingPrompt = await prisma.prompt.findFirst({
      where: { prompt: data.promptString },
    });

    if (existingPrompt) {
      return existingPrompt.id;
    } else {
      const newPrompt = await prisma.prompt.create({
        data: {
          prompt: data.promptString,
          userId: data.userId ?? 0,
          galleryId: data.galleryId ?? 0,
          pitchId: data.pitchId ?? 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return newPrompt.id;
    }
  } catch (error) {
    console.error('Error loading prompt:', error);
    throw new Error('Prompt validation failed.');
  }
}

async function validateAndLoadPitchId(data: RequestData): Promise<number> {
  console.log('🔍 Validating and loading pitch ID...');

  if (!data.pitch && !data.pitchId) {
    console.warn('No pitch title or pitchId provided.');
    return 0;
  }

  try {
    if (data.pitch) {
      const existingPitch = await prisma.pitch.findUnique({
        where: { pitch: data.pitch },
      });

      if (existingPitch) {
        return existingPitch.id;
      }

      const newPitch = await prisma.pitch.create({
        data: {
          title: data.title || 'Untitled',
          pitch: data.pitch || 'No details provided.',
          userId: data.userId || 0,
          playerId: data.playerId || null,
          isPublic: data.isPublic || true,
          isMature: data.isMature || false,
          flavorText: data.flavorText || '',
          highlightImage: data.highlightImage || '',
          PitchType: data.PitchType || 'ARTPITCH',
        },
      });

      return newPitch.id;
    }

    return data.pitchId ?? 0;
  } catch (error) {
    console.error('Error loading pitch:', error);
    throw new Error('Pitch validation failed.');
  }
}

async function validateAndLoadGalleryId(data: RequestData): Promise<number> {
  console.log('🔍 Validating and loading gallery ID...');

  try {
    if (data.galleryId === undefined) {
      const galleryName = data.galleryName ?? 'cafefred';

      const existingGallery = await prisma.gallery.findFirst({
        where: { name: galleryName },
      });

      if (existingGallery) {
        return existingGallery.id;
      } else {
        const newGallery = await prisma.gallery.create({
          data: {
            name: galleryName,
            createdAt: new Date(),
            content: '',
          },
        });
        return newGallery.id;
      }
    }

    return data.galleryId ?? 21;
  } catch (error) {
    console.error('Error loading gallery:', error);
    throw new Error('Gallery validation failed.');
  }
}

function validateAndLoadDesignerName(data: RequestData): string {
  console.log('🔍 Validating and loading designer name...');
  return data.designer ?? data.username ?? generateSillyName() ?? 'Kind Guest';
}

export async function generateImage(
  prompt: string,
  user: string,
): Promise<{ images: string[] }> {
  console.log('📸 Starting image generation...');
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const requestBody = {
    prompt,
    n: 1,
    size: '256x256',
    response_format: 'url',
    user,
  };

  try {
    const response = await fetch(
      'https://lola.acrocatranch.com/sdapi/v1/txt2img',
      {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      console.error(`Image generation failed: ${response.statusText}`);
      throw new Error(`Image generation failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('📷 Image generation complete:', responseData);

    return { images: responseData.images };
  } catch (error) {
    console.error('Error during image generation:', error);
    throw new Error('Image generation failed.');
  }
}
