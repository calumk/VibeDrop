import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, ListObjectsV2Command, AbortMultipartUploadCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3Client;
let env;

export function initS3Client(environment) {
  env = environment;
  
  // Log environment variables (without exposing secrets)
  console.log('Initializing S3 client with:', {
    accountId: env.ACCOUNT_ID,
    bucketName: env.R2_BUCKET_NAME,
    hasAccessKey: !!env.R2_ACCESS_KEY_ID,
    hasSecretKey: !!env.R2_SECRET_ACCESS_KEY
  });

  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 credentials are not properly configured');
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function createMultipartUpload(fileName, fileType, fileSize) {
  console.log('createMultipartUpload called with:');
  console.log('- fileName:', JSON.stringify(fileName));
  console.log('- fileType:', JSON.stringify(fileType));
  console.log('- fileSize:', fileSize);
  
  // Use fileId instead of timestamp-filename to avoid spaces and ensure consistency
  const fileId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  const key = `files/${fileId}`;
  
  console.log('Generated fileId:', fileId);
  console.log('Generated key:', key);
  
  const command = new CreateMultipartUploadCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    // Add metadata about file size
    Metadata: {
      'x-amz-meta-size': fileSize.toString()
    }
  });

  console.log('CreateMultipartUploadCommand params:', {
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    Metadata: {
      'x-amz-meta-size': fileSize.toString()
    }
  });

  try {
    console.log('Sending command to S3...');
    const response = await s3Client.send(command);
    console.log('S3 response received:', {
      UploadId: response.UploadId,
      Key: response.Key,
      Bucket: response.Bucket
    });
    
    const result = {
      success: true,
      uploadId: response.UploadId,
      key: key,
      fileId: fileId
    };
    
    console.log('Returning result:', JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Error creating multipart upload:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode
    });
    throw new Error(`Failed to create multipart upload: ${error.message}`);
  }
}

export async function signPart(key, uploadId, partNumber) {
  const command = new UploadPartCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return {
      success: true,
      signedUrl
    };
  } catch (error) {
    console.error('Error signing part:', error);
    throw new Error('Failed to sign part');
  }
}

export async function completeMultipartUpload(key, uploadId, parts) {
  const command = new CompleteMultipartUploadCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });

  try {
    await s3Client.send(command);
    return {
      success: true,
      key: key
    };
  } catch (error) {
    console.error('Error completing multipart upload:', error);
    throw new Error('Failed to complete multipart upload');
  }
}

export async function uploadToR2(file, key) {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: file.type,
  });

  try {
    await s3Client.send(command);
    return `https://${env.R2_PUBLIC_DOMAIN}/${key}`;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error('Failed to upload file');
  }
}

export async function getFromR2(key) {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });

  try {
    const response = await s3Client.send(command);
    return response.Body;
  } catch (error) {
    console.error('Error getting from R2:', error);
    throw new Error('Failed to get file');
  }
}

export async function deleteFromR2(key) {
  const command = new DeleteObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from R2:', error);
    throw new Error('Failed to delete file');
  }
}

// Metadata functions
export async function createMetadata(metadata) {
  const { fileId, fileData } = metadata;
  const now = new Date();
  
  // Get existing metadata if it exists
  let existingMetadata = {};
  try {
    const existing = await getMetadata(fileId);
    if (existing.success && existing.metadata) {
      existingMetadata = existing.metadata;
    }
  } catch (error) {
    // If no existing metadata, that's fine - we'll create new
    console.log('No existing metadata found, creating new');
  }

  const expiryDate = fileData.expiryDays ? new Date(now.getTime() + fileData.expiryDays * 24 * 60 * 60 * 1000) : null;
  
  const key = `metadata/${fileId}.json`;
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: JSON.stringify({
      ...existingMetadata,  // Preserve existing metadata
      id: fileId,
      ...fileData,
      createdAt: existingMetadata.createdAt || now.toISOString(),  // Keep original createdAt if it exists
      expiryDate: expiryDate ? expiryDate.toISOString() : null,
      downloadCount: existingMetadata.downloadCount || 0  // Preserve download count
    }),
    ContentType: 'application/json',
  });

  try {
    await s3Client.send(command);
    return {
      success: true,
      fileId: fileId
    };
  } catch (error) {
    console.error('Error creating metadata:', error);
    throw new Error('Failed to create metadata');
  }
}

export async function getMetadata(fileId) {
  const key = `metadata/${fileId}.json`;
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });

  try {
    const response = await s3Client.send(command);
    const metadata = JSON.parse(await response.Body.transformToString());
    return {
      success: true,
      metadata
    };
  } catch (error) {
    if (error.Code === 'NoSuchKey') {
      // File doesn't exist yet, return empty metadata
      return {
        success: true,
        metadata: {
          id: fileId,
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      };
    }
    console.error('Error getting metadata:', error);
    throw new Error(`Failed to get metadata: ${error.message}`);
  }
}

export async function getDownloadUrl(fileId, passcode) {
  const metadata = await getMetadata(fileId);
  
  if (!metadata.success) {
    throw new Error('Failed to get metadata');
  }

  if (metadata.metadata.passcode && metadata.metadata.passcode !== passcode) {
    return {
      success: false,
      error: 'Invalid passcode'
    };
  }

  const key = `files/${fileId}`;
  // Use original filename for Content-Disposition header
  const originalFilename = metadata.metadata.originalName || metadata.metadata.name || 'download';
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${originalFilename}"`,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // Increment download count
    const metadataKey = `metadata/${fileId}.json`;
    const updatedMetadata = {
      ...metadata.metadata,
      downloadCount: (metadata.metadata.downloadCount || 0) + 1
    };
    
    await s3Client.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(updatedMetadata),
      ContentType: 'application/json',
    }));

    return {
      success: true,
      downloadUrl: signedUrl,
      metadata: updatedMetadata
    };
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw new Error('Failed to get download URL');
  }
}

export async function listFiles() {
  const command = new ListObjectsV2Command({
    Bucket: env.R2_BUCKET_NAME,
    Prefix: 'metadata/',
  });

  try {
    console.log('Listing files with params:', {
      bucket: env.R2_BUCKET_NAME,
      endpoint: `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
      hasAccessKey: !!env.R2_ACCESS_KEY_ID,
      hasSecretKey: !!env.R2_SECRET_ACCESS_KEY
    });

    const response = await s3Client.send(command);
    console.log('List response:', response);

    const files = await Promise.all(
      (response.Contents || [])
        .filter(item => item.Key.endsWith('.json'))
        .map(async (item) => {
          const fileId = item.Key.replace('metadata/', '').replace('.json', '');
          const metadata = await getMetadata(fileId);
          return {
            id: fileId,
            ...metadata.metadata,
            lastModified: item.LastModified
          };
        })
    );

    return {
      success: true,
      files: files.sort((a, b) => b.lastModified - a.lastModified)
    };
  } catch (error) {
    console.error('Error listing files:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      requestId: error.$metadata?.requestId,
      cfId: error.$metadata?.cfId
    });
    throw new Error(`Failed to list files: ${error.message}`);
  }
}

export async function deleteFile(fileId) {
  const key = `files/${fileId}`;
  const metadataKey = `metadata/${fileId}.json`;

  try {
    await Promise.all([
      deleteFromR2(key),
      deleteFromR2(metadataKey)
    ]);

    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

export async function cleanExpired() {
  const files = await listFiles();
  const now = new Date();
  const expiredFiles = files.files.filter(file => {
    if (!file.expiryDate) return false;
    return new Date(file.expiryDate) < now;
  });

  const deletePromises = expiredFiles.map(file => deleteFile(file.id));
  await Promise.all(deletePromises);

  return {
    success: true,
    deletedCount: expiredFiles.length
  };
}

export async function getUploadUrl(fileId, fileName, fileType) {
  const key = `files/${fileId}`;
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return {
      success: true,
      uploadUrl: signedUrl,
      key: key
    };
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw new Error('Failed to get upload URL');
  }
}

export async function abortMultipartUpload(key, uploadId) {
  console.log('abortMultipartUpload called with:');
  console.log('- key:', key);
  console.log('- uploadId:', uploadId);

  const command = new AbortMultipartUploadCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    UploadId: uploadId
  });

  try {
    console.log('Sending AbortMultipartUploadCommand to S3...');
    await s3Client.send(command);
    console.log('Multipart upload aborted successfully');
    return {
      success: true
    };
  } catch (error) {
    console.error('Error aborting multipart upload:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode
    });
    throw new Error(`Failed to abort multipart upload: ${error.message}`);
  }
} 