import { PutObjectCommand } from '@aws-sdk/client-s3';
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
    const { fileId, fileData } = parseBody(event);
    
    if (!fileId || !fileData) {
      return createResponse(400, { 
        error: 'Missing required parameters: fileId, fileData' 
      });
    }

    // Calculate expiry date
    let expiryDate = null;
    if (fileData.expiryDays && fileData.expiryDays > 0) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + fileData.expiryDays);
    }

    // Create metadata object
    const metadata = {
      id: fileId,
      name: fileData.name || fileData.originalName,
      originalName: fileData.originalName,
      size: fileData.size,
      type: fileData.type,
      description: fileData.description || null,
      hasPasscode: !!fileData.passcode,
      passcode: fileData.passcode || null, // In production, hash this!
      expiryDate: expiryDate ? expiryDate.toISOString() : null,
      uploadedAt: new Date().toISOString(),
      uploadedBy: auth.userId,
      downloads: 0,
      lastDownload: null
    };

    // Create S3 client
    const s3Client = createS3Client();
    
    // Store metadata in S3
    const metadataKey = `metadata/${fileId}.json`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: metadataKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      ACL: 'private'
    });

    await s3Client.send(command);
    
    console.log(`Metadata created for file ${fileId}`);
    
    return createResponse(200, {
      success: true,
      fileId,
      metadata: {
        ...metadata,
        passcode: undefined // Don't return passcode in response
      }
    });

  } catch (error) {
    console.error('Create metadata error:', error);
    return createResponse(500, { 
      error: 'Failed to create metadata',
      details: error.message 
    });
  }
} 