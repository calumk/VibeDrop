import { completeMultipartUpload } from '../src/services/api';

export async function onRequest(context) {
  try {
    const { key, uploadId, parts } = await context.request.json();

    if (!key || !uploadId || !parts) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await completeMultipartUpload(key, uploadId, parts);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in complete-multipart:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 