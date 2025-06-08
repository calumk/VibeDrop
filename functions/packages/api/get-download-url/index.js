import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, createResponse, handleCORS, parseBody } from '../utils.js';

export default async function main(event, context) {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    // Get parameters from request
    const { fileId, passcode } = parseBody(event);
    
    if (!fileId) {
      return createResponse(400, { 
        error: 'Missing required parameter: fileId' 
      });
    }

    // Create S3 client
    const s3Client = createS3Client();
    
    // Get metadata first
    const metadataKey = `metadata/${fileId}.json`;
    const metadataResponse = await s3Client.send(new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: metadataKey
    }));

    const metadataJson = await metadataResponse.Body.transformToString();
    const metadata = JSON.parse(metadataJson);

    // Check if file has expired
    if (metadata.expiryDate && new Date() > new Date(metadata.expiryDate)) {
      return createResponse(410, { 
        error: 'File has expired' 
      });
    }

    // Check passcode if required
    if (metadata.passcode && metadata.passcode !== passcode) {
      return createResponse(403, { 
        error: 'Invalid passcode' 
      });
    }

    // Generate signed download URL
    const filePath = `files/${fileId}/${metadata.originalName}`;
    const downloadCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: filePath,
      ResponseContentDisposition: `attachment; filename="${metadata.originalName}"`
    });

    const signedUrl = await getSignedUrl(s3Client, downloadCommand, { expiresIn: 3600 });

    // Update download count
    const updatedMetadata = {
      ...metadata,
      downloads: (metadata.downloads || 0) + 1,
      lastDownload: new Date().toISOString()
    };

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: metadataKey,
      Body: JSON.stringify(updatedMetadata, null, 2),
      ContentType: 'application/json',
      ACL: 'private'
    }));

    console.log(`Download URL generated for file ${fileId}, downloads: ${updatedMetadata.downloads}`);
    
    return createResponse(200, {
      success: true,
      downloadUrl: signedUrl,
      metadata: {
        ...updatedMetadata,
        fileId: updatedMetadata.id, // Add fileId for backwards compatibility
        uploadDate: updatedMetadata.uploadedAt, // Map uploadedAt to uploadDate
        downloadCount: updatedMetadata.downloads || 0, // Map downloads to downloadCount
        passcode: undefined // Don't return passcode
      }
    });

  } catch (error) {
    console.error('Get download URL error:', error);
    
    if (error.name === 'NoSuchKey') {
      return createResponse(404, { 
        error: 'File not found' 
      });
    }
    
    return createResponse(500, { 
      error: 'Failed to generate download URL',
      details: error.message 
    });
  }
} 