// server/api/components/[name]/index.get.ts

import { promises as fs } from 'fs';
import path from 'path';
import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    // Extract folder name from the route parameter
    const folderName = String(event.context.params?.name);
    if (!folderName) {
      throw new Error('Invalid folder name.');
    }

    // Resolve the path to the folder
    const componentPath = path.resolve(process.cwd(), `components/content/${folderName}`);

    // Read the component files in the folder
    const componentFiles = await fs.readdir(componentPath);
    const components = [];

    for (const componentFile of componentFiles) {
      if (componentFile.endsWith('.vue')) {
        const componentName = componentFile.replace('.vue', '');
        components.push(componentName);
      }
    }

    console.log('Components found:', components); // Debugging line

    // Return the list of components
    return { response: components };
  } catch (error) {
    console.error('Failed to fetch component list:', error);
    return { response: 'Failed to fetch component list', statusCode: 500 };
  }
});
