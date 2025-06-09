import { createMultipartUpload } from '../src/services/api';

export async function onRequest(context) {
  try {
    const { fileName, fileType, fileSize } = await context.request.json();

    if (!fileName || !fileType || !fileSize) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await createMultipartUpload(fileName, fileType, fileSize);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in create-multipart:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 