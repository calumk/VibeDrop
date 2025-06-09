import { createMetadata } from '../src/services/api';

export async function onRequest(c) {
  try {
    const { fileId, metadata } = await c.req.json();

    if (!fileId || !metadata) {
      return c.json({
        success: false,
        error: 'Missing required fields'
      }, 400);
    }

    const result = await createMetadata({ fileId, fileData: metadata });

    return c.json(result);
  } catch (error) {
    console.error('Update metadata error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
} 