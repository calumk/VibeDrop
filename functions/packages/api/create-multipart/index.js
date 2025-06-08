import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import { createS3Client, validateAuth, createResponse, handleCORS, parseBody } from '../utils.js';

export default async function main(event, context) {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    // Validate authentication
    const auth = validateAuth(event);
    if (!auth.valid) {
      return createResponse(401, { error: auth.error });
    }

    // Parse request body
    const { fileId, fileName, fileType } = parseBody(event);
    
    if (!fileId || !fileName || !fileType) {
      return createResponse(400, { 
        error: 'Missing required parameters: fileId, fileName, fileType' 
      });
    }

    // Create S3 client
    const s3Client = createS3Client();
    
    // Generate S3 key
    const key = `files/${fileId}/${fileName}`;
    
    // Create multipart upload
    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: fileType,
      ACL: 'private',
      Metadata: {
        uploadedBy: auth.userId,
        uploadedAt: new Date().toISOString()
      }
    });

    const response = await s3Client.send(command);
    
    console.log(`Multipart upload created for ${fileName}, uploadId: ${response.UploadId}`);
    
    return createResponse(200, {
      success: true,
      uploadId: response.UploadId,
      key,
      fileId
    });

  } catch (error) {
    console.error('Create multipart upload error:', error);
    return createResponse(500, { 
      error: 'Failed to create multipart upload',
      details: error.message 
    });
  }
} 