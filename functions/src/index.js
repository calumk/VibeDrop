import { onRequest as createMultipart } from './routes/create-multipart';
import { onRequest as signPart } from './routes/sign-part';
import { onRequest as completeMultipart } from './routes/complete-multipart';
import { onRequest as createMetadata } from './routes/create-metadata';
import { onRequest as getMetadata } from './routes/get-metadata';
import { onRequest as getDownloadUrl } from './routes/get-download-url';
import { onRequest as listFiles } from './routes/list-files';
import { onRequest as deleteFile } from './routes/delete-file';
import { onRequest as cleanExpired } from './routes/clean-expired';
import { onRequest as getUploadUrl } from './routes/get-upload-url';
import { onRequest as updateMetadata } from './routes/update-metadata';
import { initS3Client } from './services/api';

export async function onRequest(context) {
  // Initialize S3 client with environment variables
  initS3Client(context.env);

  const url = new URL(context.request.url);
  const path = url.pathname;

  // Handle CORS preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Add CORS headers to all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    let response;

    // Route handling
    if (path === '/api/create-multipart') {
      response = await createMultipart(context);
    } else if (path === '/api/sign-part') {
      response = await signPart(context);
    } else if (path === '/api/complete-multipart') {
      response = await completeMultipart(context);
    } else if (path === '/api/create-metadata') {
      response = await createMetadata(context);
    } else if (path === '/api/get-metadata') {
      response = await getMetadata(context);
    } else if (path === '/api/get-download-url') {
      response = await getDownloadUrl(context);
    } else if (path === '/api/list-files') {
      response = await listFiles(context);
    } else if (path === '/api/delete-file') {
      response = await deleteFile(context);
    } else if (path === '/api/clean-expired') {
      response = await cleanExpired(context);
    } else if (path === '/api/get-upload-url') {
      response = await getUploadUrl(context);
    } else if (path === '/api/update-metadata') {
      response = await updateMetadata(context);
    } else {
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Add CORS headers to the response
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
} 