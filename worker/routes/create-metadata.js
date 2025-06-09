import { createMetadata } from '../src/services/api';

export async function onRequest(context) {
  try {
    const metadata = await context.request.json();

    if (!metadata) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing metadata'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await createMetadata(metadata);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in create-metadata:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 