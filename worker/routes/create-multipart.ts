import { Context } from 'hono';
import { Env, CreateMultipartResponse } from '../types';

export async function createMultipart(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const { fileName, fileType, fileSize } = await c.req.json();

    if (!fileName || !fileType || !fileSize) {
      return c.json({
        error: 'Missing required parameters: fileName, fileType, fileSize'
      }, 400);
    }

    // Generate a unique file ID
    const fileId = crypto.randomUUID();
    const key = `files/${fileId}/${fileName}`;

    // Create multipart upload
    const multipart = await c.env.BUCKET.createMultipartUpload(key, {
      httpMetadata: {
        contentType: fileType
      }
    });

    const response: CreateMultipartResponse = {
      uploadId: multipart.uploadId,
      key: key
    };

    return c.json(response);

  } catch (error) {
    console.error('Create multipart upload error:', error);
    return c.json({
      error: 'Failed to create multipart upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
} 