import { promises as fs } from 'fs';
import path from 'path';
import { defineEventHandler } from 'h3';
import { errorHandler } from '@/server/api/utils/error'; // Use existing error handler if you have one

interface Folder {
  folderName: string;
  components: string[];
}

export default defineEventHandler(async () => {
  try {
    const isVercel = process.env.VERCEL === '1'; // Detect if running on Vercel
    if (isVercel) {
      throw new Error('Running on Vercel, switching to JSON fallback');
    }

    const componentPath = path.resolve(process.cwd(), 'components/content');
    
    try {
      const folderNames = await fs.readdir(componentPath);
      const folders: string[] = [];

      for (const folderName of folderNames) {
        const folderPath = path.join(componentPath, folderName);
        const stat = await fs.stat(folderPath);

        if (stat.isDirectory()) {
          folders.push(folderName);
        }
      }

      return { response: folders };
    } catch (fsError) {
      console.error('Error reading component folder:', (fsError as Error).message);
      throw new Error('Failed to read folder directory. Ensure the "components/content" folder exists.');
    }

  } catch (error: unknown) {
    // Ensure error is typed as Error
    const typedError = error as Error;
    console.error('Primary error:', typedError.message);

    // Fallback to the JSON file
    try {
      const jsonPath = path.resolve(process.cwd(), 'components.json');
      const jsonData = await fs.readFile(jsonPath, 'utf-8');
      const folders = (JSON.parse(jsonData) as Folder[]).map((folder) => folder.folderName);
      return { response: folders };
    } catch (jsonError) {
      console.error('Fallback JSON error:', (jsonError as Error).message);
      return errorHandler({
        success: false,
        message: 'Failed to fetch folder names from both directory and fallback JSON.',
        statusCode: 500
      });
    }
  }
});
