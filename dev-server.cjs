const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

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
const hello = require('./functions/packages/vibedrop/hello/index.js');
const createMultipart = require('./functions/packages/vibedrop/create-multipart/index.js');
const signPart = require('./functions/packages/vibedrop/sign-part/index.js');
const completeMultipart = require('./functions/packages/vibedrop/complete-multipart/index.js');
const abortMultipart = require('./functions/packages/vibedrop/abort-multipart/index.js');
const listParts = require('./functions/packages/vibedrop/list-parts/index.js');
const getUploadUrl = require('./functions/packages/vibedrop/get-upload-url/index.js');
const createMetadata = require('./functions/packages/vibedrop/create-metadata/index.js');
const getMetadata = require('./functions/packages/vibedrop/get-metadata/index.js');
const getDownloadUrl = require('./functions/packages/vibedrop/get-download-url/index.js');
const listFiles = require('./functions/packages/vibedrop/list-files/index.js');
const deleteFile = require('./functions/packages/vibedrop/delete-file/index.js');
const cleanExpired = require('./functions/packages/vibedrop/clean-expired/index.js');

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

      // Call the function handler - use .main for CommonJS modules
      const result = await handler.main(event);
      
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
app.get('/api/hello', wrapHandler(hello));
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
  console.log('  GET  /api/hello');
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