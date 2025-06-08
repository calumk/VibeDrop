<template>
  <div class="upload-view">
    <div class="container">
      <!-- Authentication Status & Logout -->
      <AuthHeader />

      <div class="hero-section">
        <h1 class="hero-title text-white">
          Upload A File
        </h1>
        <p class="hero-subtitle">
          Upload any file up to 5GB and share it with optional passcode.
          Customize expiry settings and descriptions.
        </p>
      </div>

      <Card class="upload-card glass-card">
        <template #content>
          <div v-if="!uploading && !uploadComplete" class="upload-section">
            <div class="uppy-container" ref="uppyContainer"></div>
            
            <Divider />
            
            <!-- Upload Parameters -->
            <div class="upload-parameters">
              <h3>Upload Options</h3>
              
              <div class="parameter-grid">
                <!-- File Name -->
                <div class="parameter-field">
                  <label for="fileName">File Name</label>
                  <InputText 
                    id="fileName"
                    v-model="customFileName" 
                    :placeholder="originalFileName || 'File name will appear here'"
                    class="parameter-input"
                  />
                  <small class="field-hint">Custom name for sharing (optional)</small>
                </div>
                
                <!-- Description -->
                <div class="parameter-field">
                  <label for="description">Description</label>
                  <Textarea 
                    id="description"
                    v-model="description" 
                    placeholder="Describe your file (optional)"
                    class="parameter-input"
                    rows="3"
                    maxlength="500"
                  />
                  <small class="field-hint">Help others understand what this file contains</small>
                </div>
                
                <!-- Expiry Options -->
                <div class="parameter-field">
                  <label for="expiry">File Expiry</label>
                  <Dropdown 
                    id="expiry"
                    v-model="selectedExpiry" 
                    :options="expiryOptions" 
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select expiry time"
                    class="parameter-input"
                  />
                  <small class="field-hint">When should this file be automatically deleted?</small>
                </div>
                
                <!-- Passcode Protection -->
                <div class="parameter-field">
                  <label for="passcode">Password Protection</label>
                  <InputText 
                    id="passcode"
                    v-model="passcode" 
                    placeholder="Enter passcode (optional)"
                    type="password"
                    class="parameter-input"
                  />
                  <small class="field-hint">Leave empty for no password protection</small>
                </div>
              </div>
            </div>
          </div>

          <div v-if="uploading" class="upload-progress">
            <div class="progress-content">
              <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #667eea;"></i>
              <h3>Uploading your file...</h3>
              <ProgressBar :value="uploadProgress" class="progress-bar" />
              <p>{{ uploadProgress }}% complete</p>
            </div>
          </div>

          <div v-if="uploadComplete" class="upload-success">
            <div class="success-content">
              <i class="pi pi-check-circle" style="font-size: 3rem; color: #10b981;"></i>
              <h2>Upload Complete! 🎉</h2>
              <p class="success-message">Your file is ready to share</p>
              
              <div class="share-link-section">
                <div class="share-link">
                  <InputText 
                    :value="shareUrl" 
                    readonly 
                    class="share-url-input"
                  />
                  <Button 
                    @click="copyToClipboard" 
                    icon="pi pi-copy" 
                    class="copy-button"
                    :label="copied ? 'Copied!' : 'Copy'"
                    :severity="copied ? 'success' : 'secondary'"
                  />
                  <Button 
                    @click="goToFileView" 
                    icon="pi pi-eye" 
                    class="view-button"
                    label="View File"
                  />
                </div>
              </div>

              <div class="file-info">
                <Chip :label="`${fileName}`" icon="pi pi-file" />
                <Chip :label="`${formatFileSize(fileSize)}`" icon="pi pi-info-circle" />
                <Chip v-if="passcode" label="Password Protected" icon="pi pi-lock" />
              </div>

              <Button 
                @click="resetUpload" 
                label="Upload Another File" 
                icon="pi pi-plus"
                class="new-upload-button"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script>
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import AwsS3 from '@uppy/aws-s3'
import { S3Service } from '../services/s3Service'
import { AuthService } from '../services/authService'
import AuthHeader from '../components/AuthHeader.vue'

import '@uppy/core/dist/style.min.css'
import '@uppy/dashboard/dist/style.min.css'

export default {
  name: 'Upload',
  components: {
    AuthHeader
  },
  data() {
    return {
      uppy: null,
      passcode: '',
      customFileName: '',
      originalFileName: '',
      description: '',
      selectedExpiry: 7, // Default to 7 days
      uploading: false,
      uploadComplete: false,
      uploadProgress: 0,
      shareUrl: '',
      fileName: '',
      fileSize: 0,
      copied: false,
      currentFileId: null,
      expiryOptions: [
        { label: '1 Day', value: 1 },
        { label: '7 Days (Default)', value: 7 },
        { label: '30 Days', value: 30 },
        { label: 'Never (Permanent)', value: null }
      ]
    }
  },
  computed: {
    appName() {
      return import.meta.env.VITE_APP_NAME
    }
  },
  mounted() {
    this.checkAuthentication()
    this.initUppy()
  },
  beforeUnmount() {
    if (this.uppy) {
      this.uppy.destroy()
    }
  },
  methods: {
    checkAuthentication() {
      if (!AuthService.isAuthenticated()) {
        this.$router.push('/')
        return
      }
      // Extend session when accessing protected area
      AuthService.extendSession()
    },

    initUppy() {
      this.uppy = new Uppy({
        restrictions: {
          maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
          maxNumberOfFiles: 1
        },
        autoProceed: false
      })

      this.uppy.use(Dashboard, {
        target: this.$refs.uppyContainer,
        inline: true,
        width: '100%',
        height: 300,
        showProgressDetails: true,
        proudlyDisplayPoweredByUppy: false,
        note: 'Upload files up to 5GB'
      })

      // Handle file added to get file info early
      this.uppy.on('file-added', (file) => {
        this.fileName = file.name
        this.originalFileName = file.name
        this.customFileName = file.name // Set as default
        this.fileSize = file.size
        console.log('File added:', file.name, this.formatFileSize(file.size))
      })

      // Debug: Log all uppy events
      this.uppy.on('*', (event, ...args) => {
        console.log('Uppy event:', event, args)
      })

      // Handle upload start
      this.uppy.on('upload', (data) => {
        this.uploading = true
        this.uploadProgress = 0
        
        // Get file info safely
        if (data && data.fileIDs && data.fileIDs.length > 0) {
          const file = this.uppy.getFile(data.fileIDs[0])
          if (file) {
            this.fileName = file.name
            this.fileSize = file.size
          }
        }
      })

      // Handle upload progress
      this.uppy.on('upload-progress', (file, progress) => {
        this.uploadProgress = Math.round((progress.bytesUploaded / progress.bytesTotal) * 100)
      })

      // Handle upload success
      this.uppy.on('upload-success', async (file, response) => {
        try {
          // Create metadata using the current file ID
          const metadataResult = await S3Service.createMetadata(this.currentFileId, {
            name: this.customFileName || file.name,
            originalName: file.name,
            size: file.size,
            type: file.type,
            description: this.description || null,
            passcode: this.passcode || null,
            expiryDays: this.selectedExpiry
          })

          if (metadataResult.success) {
            this.shareUrl = `${window.location.origin}/file/${this.currentFileId}`
            this.uploadComplete = true
            this.uploading = false
            
            this.$toast.add({
              severity: 'success',
              summary: 'Upload Complete',
              detail: 'Your file is ready to share!',
              life: 5000
            })
          } else {
            throw new Error(metadataResult.error)
          }
        } catch (error) {
          console.error('Upload completion error:', error)
          this.$toast.add({
            severity: 'error',
            summary: 'Upload Error',
            detail: 'Failed to complete upload process',
            life: 5000
          })
        }
      })

      // Handle upload error
      this.uppy.on('upload-error', (file, error) => {
        console.error('Upload error:', error)
        this.uploading = false
        this.$toast.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: error.message || 'An error occurred during upload',
          life: 5000
        })
      })

      // Configure S3 upload
      this.setupS3Upload()
    },

    async setupS3Upload() {
      this.uppy.use(AwsS3, {
        // Multipart upload configuration for large files
        createMultipartUpload: async (file) => {
          try {
            console.log('Creating multipart upload for:', file.name, file.type)
            this.currentFileId = S3Service.generateFileId()
            
            const result = await S3Service.createMultipartUpload(this.currentFileId, file.name, file.type)
            
            if (!result.success) {
              console.error('Failed to create multipart upload:', result.error)
              throw new Error(result.error)
            }
            
            console.log('Multipart upload created successfully for file ID:', this.currentFileId)
            
            return {
              uploadId: result.uploadId,
              key: result.key
            }
          } catch (error) {
            console.error('Error in createMultipartUpload:', error)
            throw error
          }
        },

        signPart: async (file, { uploadId, key, partNumber }) => {
          try {
            const result = await S3Service.signPart(uploadId, key, partNumber)
            
            if (!result.success) {
              throw new Error(result.error)
            }
            
            return {
              url: result.signedUrl
            }
          } catch (error) {
            console.error('Error in signPart:', error)
            throw error
          }
        },

        completeMultipartUpload: async (file, { uploadId, key, parts }) => {
          try {
            const result = await S3Service.completeMultipartUpload(uploadId, key, parts)
            
            if (!result.success) {
              throw new Error(result.error)
            }
            
            return {
              location: result.location
            }
          } catch (error) {
            console.error('Error in completeMultipartUpload:', error)
            throw error
          }
        },

        abortMultipartUpload: async (file, { uploadId, key }) => {
          try {
            const result = await S3Service.abortMultipartUpload(uploadId, key)
            
            if (!result.success) {
              console.error('Failed to abort multipart upload:', result.error)
            }
          } catch (error) {
            console.error('Error in abortMultipartUpload:', error)
          }
        },

        listParts: async (file, { uploadId, key }) => {
          try {
            const result = await S3Service.listParts(uploadId, key)
            
            if (!result.success) {
              throw new Error(result.error)
            }
            
            return result.parts
          } catch (error) {
            console.error('Error in listParts:', error)
            throw error
          }
        },

        // Fallback method for smaller files or when multipart isn't used
        getUploadParameters: async (file) => {
          try {
            console.log('Getting upload parameters for:', file.name, file.type)
            
            // Use existing file ID if already created, otherwise generate new one
            if (!this.currentFileId) {
              this.currentFileId = S3Service.generateFileId()
            }
            
            const result = await S3Service.getUploadUrl(this.currentFileId, file.name, file.type)
            
            if (!result.success) {
              console.error('Failed to get upload URL:', result.error)
              throw new Error(result.error)
            }
            
            console.log('Upload URL generated successfully for file ID:', this.currentFileId)
            
            return {
              method: 'PUT',
              url: result.uploadUrl,
              fields: {},
              headers: {
                'Content-Type': file.type
              }
            }
          } catch (error) {
            console.error('Error in getUploadParameters:', error)
            throw error
          }
        }
      })
    },

    async copyToClipboard() {
      try {
        await navigator.clipboard.writeText(this.shareUrl)
        this.copied = true
        setTimeout(() => {
          this.copied = false
        }, 2000)
        
        this.$toast.add({
          severity: 'success',
          summary: 'Copied!',
          detail: 'Share link copied to clipboard',
          life: 3000
        })
      } catch (error) {
        console.error('Copy error:', error)
      }
    },

    goToFileView() {
      this.$router.push(`/file/${this.currentFileId}`)
    },

    resetUpload() {
      this.uploading = false
      this.uploadComplete = false
      this.uploadProgress = 0
      this.passcode = ''
      this.customFileName = ''
      this.originalFileName = ''
      this.description = ''
      this.selectedExpiry = 7 // Reset to default
      this.shareUrl = ''
      this.fileName = ''
      this.fileSize = 0
      this.copied = false
      this.currentFileId = null
      
      // Reset Uppy
      this.uppy.cancelAll()
      this.uppy.getFiles().forEach(file => {
        this.uppy.removeFile(file.id)
      })
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
  }
}
</script>

<style scoped>
.upload-view {
  min-height: 100vh;
  /* display: flex; */
  align-items: center;
}

.hero-section {
  text-align: center;
  margin-bottom: 3rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.upload-card {
  padding: 2rem;
  margin-bottom: 2rem;
}

.upload-section {
  text-align: center;
}

.uppy-container {
  margin-bottom: 2rem;
}

/* Upload Parameters Section */
.upload-parameters {
  text-align: left;
  max-width: 800px;
  margin: 0 auto;
}

.upload-parameters h3 {
  margin-bottom: 1.5rem;
  color: #374151;
  text-align: center;
  font-size: 1.2rem;
}

.parameter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.parameter-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.parameter-field label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.parameter-input {
  width: 100%;
}

.field-hint {
  color: #6b7280;
  font-size: 0.8rem;
  line-height: 1.3;
}

/* Special handling for description field to span full width */
.parameter-field:has(#description) {
  grid-column: 1 / -1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .parameter-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .parameter-field:has(#description) {
    grid-column: 1;
  }
}

.upload-progress {
  text-align: center;
  padding: 3rem 1rem;
}

.progress-content h3 {
  margin: 1rem 0;
  color: #374151;
}

.progress-bar {
  margin: 1rem 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.upload-success {
  text-align: center;
  padding: 2rem 1rem;
}

.success-content h2 {
  margin: 1rem 0;
  color: #10b981;
}

.success-message {
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 2rem;
}

.share-link-section {
  margin: 2rem 0;
}

.share-link {
  display: flex;
  gap: 0.5rem;
  max-width: 500px;
  margin: 0 auto;
}

.share-url-input {
  flex: 1;
}

.copy-button {
  flex-shrink: 0;
}

.file-info {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
  margin: 2rem 0;
}

.new-upload-button {
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .upload-card {
    padding: 1rem;
  }
  
  .share-link {
    flex-direction: column;
  }
}

.text-white {
  color: white;
}
</style> 