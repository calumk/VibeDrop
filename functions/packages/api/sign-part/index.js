import { UploadPartCommand } from '@aws-sdk/client-s3';
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
    const { uploadId, key, partNumber } = parseBody(event);
    
    if (!uploadId || !key || !partNumber) {
      return createResponse(400, { 
        error: 'Missing required parameters: uploadId, key, partNumber' 
      });
    }

    // Create S3 client
    const s3Client = createS3Client();
    
    // Create upload part command
    const command = new UploadPartCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumber: parseInt(partNumber)
    });

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    console.log(`Signed part ${partNumber} for upload ${uploadId}`);
    
    return createResponse(200, {
      success: true,
      signedUrl
    });

  } catch (error) {
    console.error('Sign part error:', error);
    return createResponse(500, { 
      error: 'Failed to sign upload part',
      details: error.message 
    });
  }
} 