import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { initS3Client, createMultipartUpload, signPart, completeMultipartUpload, createMetadata, getMetadata, getDownloadUrl, listFiles, deleteFile, cleanExpired, getUploadUrl } from './src/services/api';
import { onRequest as updateMetadata } from './routes/update-metadata';

const app = new Hono();

// Enable CORS with permissive configuration for development
app.use('*', cors({
  origin: '*',  // Allow all origins
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowHeaders: ['*'],  // Allow all headers
  exposeHeaders: ['*'],  // Expose all headers
  maxAge: 86400,
  credentials: true
}));

// Initialize S3 client with environment variables
app.use('*', async (c, next) => {
  initS3Client(c.env);
  await next();
});

// Root route
app.get('/', (c) => {
  return c.json({
    name: 'VibeDrop API',
    version: '1.0.0',
    endpoints: {
      health: {
        method: 'GET',
        path: '/api/health',
        description: 'Check API health status'
      },
      createMultipart: {
        method: 'POST',
        path: '/api/create-multipart',
        description: 'Initialize multipart upload'
      },
      signPart: {
        method: 'POST',
        path: '/api/sign-part',
        description: 'Get signed URL for part upload'
      },
      completeMultipart: {
        method: 'POST',
        path: '/api/complete-multipart',
        description: 'Complete multipart upload'
      },
      createMetadata: {
        method: 'POST',
        path: '/api/create-metadata',
        description: 'Create file metadata'
      },
      getMetadata: {
        method: 'POST',
        path: '/api/get-metadata',
        description: 'Get file metadata'
      },
      getDownloadUrl: {
        method: 'POST',
        path: '/api/get-download-url',
        description: 'Get signed download URL'
      },
      listFiles: {
        method: 'GET',
        path: '/api/list-files',
        description: 'List all files'
      },
      deleteFile: {
        method: 'DELETE',
        path: '/api/delete-file',
        description: 'Delete a file'
      },
      cleanExpired: {
        method: 'POST',
        path: '/api/clean-expired',
        description: 'Clean up expired files'
      },
      getUploadUrl: {
        method: 'POST',
        path: '/api/get-upload-url',
        description: 'Get signed upload URL'
      },
      updateMetadata: {
        method: 'POST',
        path: '/api/update-metadata',
        description: 'Update file metadata'
      }
    }
  });
});

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Create multipart upload
app.post('/api/create-multipart', async (c) => {
  try {
    const { fileId, fileName, fileType } = await c.req.json();
    if (!fileId || !fileName || !fileType) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    const result = await createMultipartUpload(fileName, fileType);
    return c.json(result);
  } catch (error) {
    console.error('Error in create-multipart:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Internal server error',
      details: error.toString()
    }, 500);
  }
});

// Sign part
app.post('/api/sign-part', async (c) => {
  try {
    const { key, uploadId, partNumber } = await c.req.json();
    if (!key || !uploadId || !partNumber) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    const result = await signPart(key, uploadId, partNumber);
    return c.json(result);
  } catch (error) {
    console.error('Error in sign-part:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Complete multipart upload
app.post('/api/complete-multipart', async (c) => {
  try {
    const { key, uploadId, parts } = await c.req.json();
    if (!key || !uploadId || !parts) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    const result = await completeMultipartUpload(key, uploadId, parts);
    return c.json(result);
  } catch (error) {
    console.error('Error in complete-multipart:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Create metadata
app.post('/api/create-metadata', async (c) => {
  try {
    const metadata = await c.req.json();
    if (!metadata) {
      return c.json({ success: false, error: 'Missing metadata' }, 400);
    }
    const result = await createMetadata(metadata);
    return c.json(result);
  } catch (error) {
    console.error('Error in create-metadata:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Get metadata
app.post('/api/get-metadata', async (c) => {
  try {
    const { fileId } = await c.req.json();
    if (!fileId) {
      return c.json({ success: false, error: 'Missing fileId' }, 400);
    }
    const result = await getMetadata(fileId);
    return c.json(result);
  } catch (error) {
    console.error('Error in get-metadata:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Internal server error',
      details: error.toString()
    }, 500);
  }
});

// Get download URL
app.post('/api/get-download-url', async (c) => {
  try {
    const { fileId, passcode } = await c.req.json();
    if (!fileId) {
      return c.json({ success: false, error: 'Missing fileId' }, 400);
    }
    const result = await getDownloadUrl(fileId, passcode);
    return c.json(result);
  } catch (error) {
    console.error('Error in get-download-url:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// List files
app.get('/api/list-files', async (c) => {
  try {
    const result = await listFiles();
    return c.json(result);
  } catch (error) {
    console.error('Error in list-files:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Internal server error',
      details: error.toString()
    }, 500);
  }
});

// Delete file
app.delete('/api/delete-file', async (c) => {
  try {
    const fileId = c.req.query('fileId');
    if (!fileId) {
      return c.json({ success: false, error: 'Missing fileId' }, 400);
    }
    const result = await deleteFile(fileId);
    return c.json(result);
  } catch (error) {
    console.error('Error in delete-file:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Clean expired files
app.post('/api/clean-expired', async (c) => {
  try {
    const result = await cleanExpired();
    return c.json(result);
  } catch (error) {
    console.error('Error in clean-expired:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Get upload URL
app.post('/api/get-upload-url', async (c) => {
  try {
    const { fileId, fileName, fileType } = await c.req.json();
    if (!fileId || !fileName || !fileType) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    const result = await getUploadUrl(fileId, fileName, fileType);
    return c.json(result);
  } catch (error) {
    console.error('Error in get-upload-url:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Internal server error',
      details: error.toString()
    }, 500);
  }
});

// Update metadata
app.post('/api/update-metadata', updateMetadata);

export default app; 