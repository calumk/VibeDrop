# VibeDrop Serverless Functions

This directory contains the serverless functions that handle secure file uploads using pre-signed URLs.

## Local Development Setup

1. **Install dependencies:**
   ```bash
   cd functions/packages/api
   npm install
   ```

2. **Set environment variables:**
   Create a `.env` file in the project root with:
   ```bash
   # S3 Configuration (NO VITE_ prefix - server-side only)
   S3_ENDPOINT=https://your-s3-endpoint
   S3_REGION=your-region
   S3_BUCKET=your-bucket-name
   S3_ACCESS_KEY_ID=your-access-key
   S3_SECRET_ACCESS_KEY=your-secret-key
   JWT_SECRET=your-jwt-secret
   ```

3. **Start local development:**
   ```bash
   # From project root
   npm run dev
   # This starts both frontend (port 3000) and API (port 3001)
   ```

## Functions Overview

### Upload Functions
- **`create-multipart`** - Initialize multipart upload
- **`sign-part`** - Generate signed URLs for upload parts
- **`complete-multipart`** - Finalize multipart upload
- **`abort-multipart`** - Cancel multipart upload
- **`list-parts`** - List uploaded parts
- **`get-upload-url`** - Generate signed URL for simple uploads

### Metadata Functions
- **`create-metadata`** - Store file metadata after upload
- **`get-metadata`** - Retrieve file metadata
- **`get-download-url`** - Generate signed download URLs

## Security Features

✅ **Credentials Hidden**: S3 credentials never exposed to client
✅ **Authentication**: All endpoints require valid auth token
✅ **CORS Enabled**: Proper cross-origin request handling
✅ **Pre-signed URLs**: Direct S3 uploads without server proxy
✅ **Validation**: Input validation and error handling

## Deployment

Functions automatically deploy to your cloud platform when pushed to main branch.

Environment variables are configured in your deployment configuration files. 