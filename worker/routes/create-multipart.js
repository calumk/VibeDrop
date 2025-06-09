import { createMultipartUpload } from '../src/services/api';

export async function onRequest(context) {
  try {
    console.log('Raw request URL:', context.request.url);
    console.log('Request method:', context.request.method);
    console.log('Content-Type:', context.request.headers.get('content-type'));
    
    const body = await context.request.json();
    console.log('Parsed body:', JSON.stringify(body));
    
    const { fileName, fileType } = body;
    
    console.log('Extracted fileName:', JSON.stringify(fileName));
    console.log('Extracted fileType:', JSON.stringify(fileType));

    if (!fileName || !fileType) {
      console.log('Missing fields - fileName:', !!fileName, 'fileType:', !!fileType);
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Calling createMultipartUpload with:', { fileName, fileType });
    const result = await createMultipartUpload(fileName, fileType);
    console.log('createMultipartUpload result:', JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in create-multipart:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 