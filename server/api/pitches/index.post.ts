// /server/api/pitches/index.post.ts
import { defineEventHandler, readBody } from 'h3';
import { type Pitch, Prisma } from '@prisma/client';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';
import { useRandomName } from './../../../utils/useRandomName';

export default defineEventHandler(async (event) => {
  try {
    const pitchData = await readBody(event);

    if (typeof pitchData !== 'object') {
      return { success: false, message: 'Invalid JSON body. Expected an object.' };
    }

    const createdPitch = await prisma.pitch.create({
      data: pitchData,
    });

    return { success: true, pitch: createdPitch };
  } catch (error: any) {
    return errorHandler(error);
  }
});

// Function to create a new Pitch
export async function createPitch(
  pitch: Omit<Partial<Pitch>, 'title' | 'pitch' | 'designer'> & {
    userId: number;
    title: string;
    pitch: string;
  },
): Promise<Pitch> {
  try {
    // Validate required fields
    if (!pitch.title || !pitch.pitch || !pitch.userId) {
      throw new Error('Title and pitch content must be provided');
    }

    // Generate a random designer name
    const { value: designerName } = useRandomName();

    // Create the new Pitch
    return await prisma.pitch.create({
      data: {
        ...pitch,
        designer: designerName, // Set the designer name
      },
    });
  } catch (error: any) {
    throw errorHandler(error);
  }
}

// Function to create Pitches in batch
export async function createPitchesBatch(
  pitchesData: Partial<Pitch>[],
): Promise<{ count: number; pitches: Pitch[]; errors: string[] }> {
  const errors: string[] = [];

  // Validate and filter the pitches
  const data: Prisma.PitchCreateManyInput[] = pitchesData
    .filter((pitchData) => {
      if (!pitchData.title || !pitchData.pitch) {
        errors.push(`Pitch with title ${pitchData.title} is incomplete.`);
        return false;
      }
      return true;
    })
    .map((pitchData) => pitchData as Prisma.PitchCreateManyInput);

  // Create the pitches in a batch
  const result = await prisma.pitch.createMany({
    data,
    skipDuplicates: true, // Skip duplicate records based on constraints
  });

  // Fetch the newly created pitches
  const pitches = await prisma.pitch.findMany();

  return { count: result.count, pitches, errors };
}
