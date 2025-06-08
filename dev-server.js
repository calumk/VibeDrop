import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Map VITE_ prefixed variables to server-side equivalents for development
if (!process.env.S3_ACCESS_KEY_ID && process.env.VITE_S3_ACCESS_KEY_ID) {
  process.env.S3_ACCESS_KEY_ID = process.env.VITE_S3_ACCESS_KEY_ID;
  process.env.S3_SECRET_ACCESS_KEY = process.env.VITE_S3_SECRET_ACCESS_KEY;
  process.env.S3_ENDPOINT = process.env.VITE_S3_ENDPOINT;
  process.env.S3_REGION = process.env.VITE_S3_REGION;
  process.env.S3_BUCKET = process.env.VITE_S3_BUCKET;
  console.log('🔧 Mapped VITE_ prefixed S3 credentials for development');
}

// Import function handlers
import createMultipart from './functions/create-multipart/index.js';
import signPart from './functions/sign-part/index.js';
import completeMultipart from './functions/complete-multipart/index.js';
import abortMultipart from './functions/abort-multipart/index.js';
import listParts from './functions/list-parts/index.js';
import getUploadUrl from './functions/get-upload-url/index.js';
import createMetadata from './functions/create-metadata/index.js';
import getMetadata from './functions/get-metadata/index.js';
import getDownloadUrl from './functions/get-download-url/index.js';
import listFiles from './functions/list-files/index.js';
import deleteFile from './functions/delete-file/index.js';
import cleanExpired from './functions/clean-expired/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Wrapper to convert Express req/res to DigitalOcean function format
function wrapHandler(handler) {
  return async (req, res) => {
    try {
      // Convert Express request to DO function event format
      const event = {
        httpMethod: req.method,
        headers: req.headers,
        body: req.body ? JSON.stringify(req.body) : null,
        queryStringParameters: req.query,
        pathParameters: req.params
      };

      // Note: Debug logging removed for production

      // Call the function handler
      const result = await handler(event, {});
      
      // Send response
      res.status(result.statusCode || 200);
      
      // Set headers if provided
      if (result.headers) {
        Object.keys(result.headers).forEach(key => {
          res.set(key, result.headers[key]);
        });
      }
      
      // Send body (parse if it's JSON string)
      let body = result.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          // Keep as string if not JSON
        }
      }
      
      res.json(body);
    } catch (error) {
      console.error('Handler error:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };
}

// Mount API endpoints
app.post('/api/create-multipart', wrapHandler(createMultipart));
app.post('/api/sign-part', wrapHandler(signPart));
app.post('/api/complete-multipart', wrapHandler(completeMultipart));
app.post('/api/abort-multipart', wrapHandler(abortMultipart));
app.post('/api/list-parts', wrapHandler(listParts));
app.post('/api/get-upload-url', wrapHandler(getUploadUrl));
app.post('/api/create-metadata', wrapHandler(createMetadata));
app.get('/api/get-metadata/:id', wrapHandler(getMetadata));
app.post('/api/get-metadata', wrapHandler(getMetadata));
app.post('/api/get-download-url', wrapHandler(getDownloadUrl));
app.get('/api/list-files', wrapHandler(listFiles));
app.delete('/api/delete-file/:id', wrapHandler(deleteFile));
app.post('/api/delete-file', wrapHandler(deleteFile));
app.post('/api/clean-expired', wrapHandler(cleanExpired));

// Handle CORS preflight for all API routes
app.options('/api/*', (req, res) => {
  res.status(200).end();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local development server running at http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/*`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST /api/create-multipart');
  console.log('  POST /api/sign-part');
  console.log('  POST /api/complete-multipart');
  console.log('  POST /api/abort-multipart');
  console.log('  POST /api/list-parts');
  console.log('  POST /api/get-upload-url');
  console.log('  POST /api/create-metadata');
  console.log('  GET  /api/get-metadata/:id');
  console.log('  POST /api/get-download-url');
  console.log('  GET  /api/list-files');
  console.log('  DELETE /api/delete-file/:id');
  console.log('  POST /api/clean-expired');
  console.log('  GET  /api/health');
}); 