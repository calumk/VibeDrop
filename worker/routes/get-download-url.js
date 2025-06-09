import { getDownloadUrl } from '../src/services/api';

export async function onRequest(context) {
  try {
    const { fileId, passcode } = await context.request.json();

    if (!fileId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing fileId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await getDownloadUrl(fileId, passcode);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in get-download-url:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 