import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
    
    // Create put object command
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: fileType,
      ACL: 'private',
      Metadata: {
        uploadedBy: auth.userId,
        uploadedAt: new Date().toISOString()
      }
    });

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    console.log(`Upload URL generated for ${fileName}, fileId: ${fileId}`);
    
    return createResponse(200, {
      success: true,
      uploadUrl: signedUrl,
      key,
      fileId
    });

  } catch (error) {
    console.error('Get upload URL error:', error);
    return createResponse(500, { 
      error: 'Failed to generate upload URL',
      details: error.message 
    });
  }
} 