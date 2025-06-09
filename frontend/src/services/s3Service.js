// API base URL for serverless functions
const API_URL = import.meta.env.VITE_API_URL;

export class S3Service {
  // Get auth token for API calls
  static getAuthToken() {
    // Simple auth token - in production use proper JWT
    return localStorage.getItem('authToken') || 'admin-session'
  }

  // Make API call with auth
  static async apiCall(endpoint, methodOrOptions = 'GET', body = null) {
    // Handle both calling patterns: (endpoint, method, body) and (endpoint, {method, body})
    let method, requestBody;
    
    if (typeof methodOrOptions === 'string') {
      // New pattern: (endpoint, method, body)
      method = methodOrOptions;
      requestBody = body;
    } else {
      // Old pattern: (endpoint, {method, body})
      method = methodOrOptions.method || 'GET';
      requestBody = methodOrOptions.body || null;
    }
    
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    // Only add /api prefix if it's not the root endpoint
    const url = cleanEndpoint === '' ? API_URL : `${API_URL}/api/${cleanEndpoint}`;
    const response = await fetch(url, {
      method: method,
      body: requestBody,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      }
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Generate unique file ID
  static generateFileId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  // Create multipart upload
  static async createMultipartUpload(fileName, fileType) {
    try {
      const result = await this.apiCall('/create-multipart', {
        method: 'POST',
        body: JSON.stringify({ fileName, fileType })
      })
      
      return result
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
      const result = await this.apiCall('/sign-part', {
        method: 'POST',
        body: JSON.stringify({ uploadId, key, partNumber })
      })
      
      return result
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
      const result = await this.apiCall('/complete-multipart', {
        method: 'POST',
        body: JSON.stringify({ uploadId, key, parts })
      })
      
      return result
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
      const result = await this.apiCall('/abort-multipart', {
        method: 'POST',
        body: JSON.stringify({ uploadId, key })
      })
      
      return result
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
      const result = await this.apiCall('/list-parts', {
        method: 'POST',
        body: JSON.stringify({ uploadId, key })
      })
      
      return result
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
      const result = await this.apiCall('/get-upload-url', {
        method: 'POST',
        body: JSON.stringify({ fileId, fileName, fileType })
      })
      
      return result
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
      const result = await this.apiCall('/create-metadata', {
        method: 'POST',
        body: JSON.stringify({ fileId, fileData })
      })
      
      return result
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
      const result = await this.apiCall(`/get-metadata`, {
        method: 'POST',
        body: JSON.stringify({ fileId })
      })
      
      return result
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
      const result = await this.apiCall('/get-download-url', {
        method: 'POST',
        body: JSON.stringify({ fileId, passcode })
      })
      
      return result
    } catch (error) {
      console.error('Download URL generation error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Update download count (now handled by get-download-url API)
  static async updateDownloadCount(fileId, count) {
    // This is now handled automatically by the get-download-url API endpoint
    // Keeping this method for compatibility but it's no longer needed
    console.log(`Download count update for ${fileId} now handled by API`)
  }

  // Get all files (both active and expired)
  static async getAllFiles() {
    try {
      const result = await this.apiCall('/list-files', 'GET')
      
      return result
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
      const response = await this.apiCall(`/delete-file?fileId=${encodeURIComponent(fileId)}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Delete file error:', error);
      return { success: false, error: error.message };
    }
  }

  // Clean expired files
  static async cleanExpiredFiles() {
    try {
      const result = await this.apiCall('/clean-expired', {
        method: 'POST'
      })
      
      return result
    } catch (error) {
      console.error('Cleanup error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Update metadata
  static async updateMetadata(fileId, metadata) {
    try {
      const result = await this.apiCall('/update-metadata', {
        method: 'POST',
        body: JSON.stringify({ fileId, metadata })
      })
      
      return result
    } catch (error) {
      console.error('Metadata update error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
} 