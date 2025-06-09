import { Context } from 'hono';
import { Env, CleanExpiredResponse } from '../types';

export async function cleanExpired(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // List all metadata files
    const files = await c.env.BUCKET.list({ prefix: 'metadata/' });
    let deletedCount = 0;

    // Process each metadata file
    for (const file of files.objects) {
      const metadataObj = await c.env.BUCKET.get(file.key);
      if (metadataObj) {
        const metadata = await metadataObj.json();
        
        // Check if file has expired
        if (metadata.expiryDate && new Date() > new Date(metadata.expiryDate)) {
          // Delete the actual file
          const filePath = `files/${metadata.id}/${metadata.originalName}`;
          await c.env.BUCKET.delete(filePath);

          // Delete metadata
          await c.env.BUCKET.delete(file.key);
          deletedCount++;
        }
      }
    }

    const response: CleanExpiredResponse = {
      success: true,
      deletedCount
    };

    return c.json(response);

  } catch (error) {
    console.error('Clean expired files error:', error);
    return c.json({
      error: 'Failed to clean expired files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
} 