// /server/api/pitches/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import type { Prisma, Pitch } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { useRandomName } from './../../../utils/useRandomName'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<Pitch>(event);

    // Validate incoming data
    const validationError = validatePitchData(body);
    if (validationError) {
      return errorHandler({ message: validationError, statusCode: 400 });
    }

    // Process the creation of a new pitch
    const pitch = await createPitch(body);
    return { success: true, pitch };
  } catch (error) {
    return errorHandler(error);
  }
});
export async function createPitch(pitchData: Prisma.PitchCreateInput): Promise<Pitch> {
  const { value: designerName } = useRandomName();
  return prisma.pitch.create({
    data: {
      ...pitchData,
      designer: designerName || 'Anonymous', // Fallback to 'Anonymous' if no name is generated
    }
  });
}

export async function createPitchesBatch(pitchesData: Partial<Pitch>[]): Promise<{ count: number; pitches: Pitch[]; errors: string[] }> {
  const errors: string[] = [];
  const validPitches = pitchesData.filter(p => p.title && p.pitch);

  if (validPitches.length !== pitchesData.length) {
    errors.push('Some pitches were missing titles or content and were not processed.');
  }

  const result = await prisma.pitch.createMany({
    data: validPitches as Prisma.PitchCreateManyInput[],
    skipDuplicates: true
  });

  return {
    count: result.count,
    pitches: await prisma.pitch.findMany({
      where: {
        id: {
          in: validPitches.map(p => p.id).filter(id => id !== undefined) as number[]
        }
      }
    }),
    
    errors
  };
}

export function validatePitchData(data: Partial<Pitch>): string | null {
  if (!data.title || !data.pitch) {
    return 'Title and pitch content are required.';
  }
  // Add more validations as needed
  return null;
}