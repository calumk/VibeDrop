import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const SPACES_ENDPOINT = import.meta.env.VITE_S3_ENDPOINT
const SPACES_BUCKET = import.meta.env.VITE_S3_BUCKET
const SPACES_KEY = import.meta.env.VITE_S3_ACCESS_KEY_ID
const SPACES_SECRET = import.meta.env.VITE_S3_SECRET_ACCESS_KEY
const SPACES_REGION = import.meta.env.VITE_S3_REGION

// Configure S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: SPACES_ENDPOINT,
  region: SPACES_REGION,
  credentials: {
    accessKeyId: SPACES_KEY,
    secretAccessKey: SPACES_SECRET
  },
  forcePathStyle: false
})

export class S3Service {
  // Generate unique file ID
  static generateFileId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  // Create multipart upload
  static async createMultipartUpload(fileId, fileName, fileType) {
    try {
      const key = `files/${fileId}/${fileName}`
      
      const command = new CreateMultipartUploadCommand({
        Bucket: SPACES_BUCKET,
        Key: key,
        ContentType: fileType,
        ACL: 'private'
      })

      const response = await s3Client.send(command)
      
      return {
        success: true,
        uploadId: response.UploadId,
        key
      }
    } catch (error) {
      console.error('Create multipart upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Sign part for multipart upload
  static async signPart(uploadId, key, partNumber) {
    try {
      const command = new UploadPartCommand({
        Bucket: SPACES_BUCKET,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber
      })

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
      
      return {
        success: true,
        signedUrl
      }
    } catch (error) {
      console.error('Sign part error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Complete multipart upload
  static async completeMultipartUpload(uploadId, key, parts) {
    try {
      const command = new CompleteMultipartUploadCommand({
        Bucket: SPACES_BUCKET,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map((part, index) => ({
            ETag: part.ETag,
            PartNumber: index + 1
          }))
        }
      })

      const response = await s3Client.send(command)
      
      return {
        success: true,
        location: response.Location
      }
    } catch (error) {
      console.error('Complete multipart upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Abort multipart upload
  static async abortMultipartUpload(uploadId, key) {
    try {
      const command = new AbortMultipartUploadCommand({
        Bucket: SPACES_BUCKET,
        Key: key,
        UploadId: uploadId
      })

      await s3Client.send(command)
      
      return {
        success: true
      }
    } catch (error) {
      console.error('Abort multipart upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // List parts
  static async listParts(uploadId, key) {
    try {
      const command = new ListPartsCommand({
        Bucket: SPACES_BUCKET,
        Key: key,
        UploadId: uploadId
      })

      const response = await s3Client.send(command)
      
      return {
        success: true,
        parts: response.Parts || []
      }
    } catch (error) {
      console.error('List parts error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get signed URL for Uppy upload
  static async getUploadUrl(fileId, fileName, fileType) {
    try {
      const key = `files/${fileId}/${fileName}`
      
      const command = new PutObjectCommand({
        Bucket: SPACES_BUCKET,
        Key: key,
        ContentType: fileType,
        ACL: 'private'
      })

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
      
      return {
        success: true,
        uploadUrl: signedUrl,
        key
      }
    } catch (error) {
      console.error('Upload URL generation error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Create metadata file
  static async createMetadata(fileId, fileData) {
    try {
      // Calculate expiry date based on expiryDays
      let expiryDate = null
      if (fileData.expiryDays && fileData.expiryDays > 0) {
        expiryDate = new Date(Date.now() + fileData.expiryDays * 24 * 60 * 60 * 1000).toISOString()
      }
      
      const metadata = {
        fileId,
        displayName: fileData.name, // Custom name for display
        originalName: fileData.originalName, // Original filename
        description: fileData.description || null,
        size: fileData.size,
        type: fileData.type,
        passcode: fileData.passcode || null,
        uploadDate: new Date().toISOString(),
        expiryDate: expiryDate, // null means never expires
        expiryDays: fileData.expiryDays || null,
        downloadCount: 0,
        filePath: `files/${fileId}/${fileData.originalName}`
      }

      const metadataKey = `links/${fileId}.json`
      
      await s3Client.send(new PutObjectCommand({
        Bucket: SPACES_BUCKET,
        Key: metadataKey,
        Body: JSON.stringify(metadata),
        ContentType: 'application/json',
        ACL: 'private'
      }))

      return {
        success: true,
        fileId,
        metadata
      }
    } catch (error) {
      console.error('Metadata creation error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get metadata
  static async getMetadata(fileId) {
    try {
      const metadataKey = `links/${fileId}.json`
      
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: SPACES_BUCKET,
        Key: metadataKey
      }))

      const metadataJson = await response.Body.transformToString()
      const metadata = JSON.parse(metadataJson)

      // Check if file has expired (only if expiryDate is set)
      if (metadata.expiryDate && new Date() > new Date(metadata.expiryDate)) {
        return {
          success: false,
          error: 'File has expired'
        }
      }

      return {
        success: true,
        metadata
      }
    } catch (error) {
      console.error('Metadata retrieval error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Generate signed URL for download
  static async getDownloadUrl(fileId, passcode = null) {
    try {
      const metadataResult = await this.getMetadata(fileId)
      
      if (!metadataResult.success) {
        return metadataResult
      }

      const metadata = metadataResult.metadata

      // Check passcode if required
      if (metadata.passcode && metadata.passcode !== passcode) {
        return {
          success: false,
          error: 'Invalid passcode'
        }
      }

      // Generate signed URL for download
      const command = new GetObjectCommand({
        Bucket: SPACES_BUCKET,
        Key: metadata.filePath,
        ResponseContentDisposition: `attachment; filename="${metadata.originalName}"`
      })

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour

      // Update download count
      await this.updateDownloadCount(fileId, metadata.downloadCount + 1)

      return {
        success: true,
        downloadUrl: signedUrl,
        metadata
      }
    } catch (error) {
      console.error('Download URL generation error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Update download count
  static async updateDownloadCount(fileId, count) {
    try {
      const metadataResult = await this.getMetadata(fileId)
      if (metadataResult.success) {
        const metadata = metadataResult.metadata
        metadata.downloadCount = count
        
        await s3Client.send(new PutObjectCommand({
          Bucket: SPACES_BUCKET,
          Key: `links/${fileId}.json`,
          Body: JSON.stringify(metadata),
          ContentType: 'application/json',
          ACL: 'private'
        }))
      }
    } catch (error) {
      console.error('Download count update error:', error)
    }
  }

  // Get all files (both active and expired)
  static async getAllFiles() {
    try {
      const listResponse = await s3Client.send(new ListObjectsV2Command({
        Bucket: SPACES_BUCKET,
        Prefix: 'links/'
      }))

      const files = []
      const now = new Date()

      for (const object of listResponse.Contents || []) {
        try {
          const response = await s3Client.send(new GetObjectCommand({
            Bucket: SPACES_BUCKET,
            Key: object.Key
          }))

          const metadataJson = await response.Body.transformToString()
          const metadata = JSON.parse(metadataJson)
          
          // Handle files that never expire (expiryDate is null)
          const isExpired = metadata.expiryDate ? now > new Date(metadata.expiryDate) : false
          const status = metadata.expiryDate ? (isExpired ? 'Expired' : 'Active') : 'Permanent'

          files.push({
            ...metadata,
            metadataKey: object.Key,
            isExpired,
            lastModified: object.LastModified,
            status
          })
        } catch (error) {
          console.error('Error processing file:', object.Key, error)
        }
      }

      return {
        success: true,
        files: files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      }
    } catch (error) {
      console.error('Get all files error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Delete individual file
  static async deleteFile(fileId) {
    try {
      // Get metadata first to get file path
      const metadataResult = await this.getMetadata(fileId)
      
      if (!metadataResult.success) {
        return metadataResult
      }

      const metadata = metadataResult.metadata

      // Delete main file
      await s3Client.send(new DeleteObjectCommand({
        Bucket: SPACES_BUCKET,
        Key: metadata.filePath
      }))

      // Delete metadata file
      await s3Client.send(new DeleteObjectCommand({
        Bucket: SPACES_BUCKET,
        Key: `links/${fileId}.json`
      }))

      return {
        success: true,
        message: `File ${metadata.originalName} deleted successfully`
      }
    } catch (error) {
      console.error('Delete file error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Clean expired files
  static async cleanExpiredFiles() {
    try {
      const listResponse = await s3Client.send(new ListObjectsV2Command({
        Bucket: SPACES_BUCKET,
        Prefix: 'links/'
      }))

      const expiredFiles = []
      const now = new Date()

      for (const object of listResponse.Contents || []) {
        try {
          const response = await s3Client.send(new GetObjectCommand({
            Bucket: SPACES_BUCKET,
            Key: object.Key
          }))

          const metadataJson = await response.Body.transformToString()
          const metadata = JSON.parse(metadataJson)

          // Only check expiry for files that have an expiry date
          if (metadata.expiryDate && now > new Date(metadata.expiryDate)) {
            expiredFiles.push({
              fileId: metadata.fileId,
              filePath: metadata.filePath,
              metadataKey: object.Key
            })
          }
        } catch (error) {
          console.error('Error processing file:', object.Key, error)
        }
      }

      // Delete expired files
      for (const expired of expiredFiles) {
        try {
          // Delete main file
          await s3Client.send(new DeleteObjectCommand({
            Bucket: SPACES_BUCKET,
            Key: expired.filePath
          }))

          // Delete metadata file
          await s3Client.send(new DeleteObjectCommand({
            Bucket: SPACES_BUCKET,
            Key: expired.metadataKey
          }))
        } catch (error) {
          console.error('Error deleting expired file:', expired.fileId, error)
        }
      }

      return {
        success: true,
        deletedCount: expiredFiles.length
      }
    } catch (error) {
      console.error('Cleanup error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
} 