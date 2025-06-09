import { deleteFile } from '../src/services/api';

export async function onRequest(context) {
  try {
    const { fileId } = await context.request.json();

    if (!fileId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing fileId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await deleteFile(fileId);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in delete-file:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 