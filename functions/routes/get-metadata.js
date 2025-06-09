import { getMetadata } from '../src/services/api';

export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    const fileId = url.searchParams.get('fileId');

    if (!fileId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing fileId parameter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await getMetadata(fileId);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in get-metadata:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 