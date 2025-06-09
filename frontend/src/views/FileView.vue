<template>
  <div class="file-view">
    <div class="container">

        <!-- Authentication Status & Logout -->

        <AuthHeader :redirectOnLogout="false" />


      <!-- <div class="back-link">
        <Button 
          @click="$router.push('/')" 
          icon="pi pi-arrow-left" 
          label="Upload New File"
          text
          class="back-button"
        />
      </div> -->

      <div v-if="loading" class="loading-section">
        <Card class="glass-card">
          <template #content>
            <div class="loading-content">
              <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #667eea;"></i>
              <h3>Loading file information...</h3>
            </div>
          </template>
        </Card>
      </div>

      <div v-else-if="error" class="error-section">
        <Card class="glass-card">
          <template #content>
            <div class="error-content">
              <i class="pi pi-exclamation-triangle" style="font-size: 3rem; color: #ef4444;"></i>
              <h2>File Not Found</h2>
              <p>{{ error }}</p>
              <Button 
                @click="$router.push('/')" 
                label="Go Home" 
                icon="pi pi-home"
                class="home-button"
              />
            </div>
          </template>
        </Card>
      </div>

      <div v-else-if="isExpired" class="expired-section">
        <Card class="glass-card">
          <template #content>
            <div class="expired-content">
              <i class="pi pi-clock" style="font-size: 3rem; color: #ef4444;"></i>
              <h2>File Has Expired</h2>
              <p>This file has reached its expiry date and is no longer available.</p>
              <Button 
                @click="$router.push('/')" 
                label="Go Home" 
                icon="pi pi-home"
                class="home-button"
              />
            </div>
          </template>
        </Card>
      </div>

      <div v-else-if="needsPasscode && !authenticated" class="passcode-section">
        <Card class="glass-card">
          <template #content>
            <div class="passcode-content">
              <i class="pi pi-lock" style="font-size: 3rem; color: #667eea;"></i>
              <h2>Password Protected File</h2>
              <p>This file requires a passcode to access.</p>
              
              <div class="passcode-form">
                <InputText 
                  v-model="enteredPasscode" 
                  placeholder="Enter passcode"
                  type="password"
                  class="passcode-field"
                  @keyup.enter="verifyPasscode"
                />
                <Button 
                  @click="verifyPasscode" 
                  label="Unlock" 
                  icon="pi pi-unlock"
                  :loading="verifying"
                  class="unlock-button"
                />
              </div>
              
              <p v-if="passcodeError" class="error-message">
                {{ passcodeError }}
              </p>
            </div>
          </template>
        </Card>
      </div>

      <div v-else class="file-info-section">
        <Card class="glass-card file-card">
          <template #content>
            <div class="file-header">
              <div class="file-icon">
                <i :class="getFileIcon(fileMetadata.type)" style="font-size: 3rem; color: #667eea;"></i>
              </div>
              <div class="file-details">
                <h1 class="file-name">{{ fileMetadata.displayName || fileMetadata.originalName }}</h1>

                <div class="file-meta">
                  <Chip :label="formatFileSize(fileMetadata.size)" icon="pi pi-info-circle" />
                  <Chip :label="formatDate(fileMetadata.createdAt)" icon="pi pi-calendar" />
                  <Chip v-if="fileMetadata.passcode" label="Password Protected" icon="pi pi-lock" />
                  <Chip :label="`${fileMetadata.downloadCount} downloads`" icon="pi pi-download" />
                  <Chip v-if="fileMetadata.expiryDate" :label="`Expires ${formatDate(fileMetadata.expiryDate)}`" icon="pi pi-clock" severity="warning" />
                  <Chip v-else label="Never Expires" icon="pi pi-infinity" severity="success" />
                </div>


                <div v-if="fileMetadata.description" class="file-description" style="padding: 1rem; margin-top:1rem; border:1px solid #E2E8F0; border-radius: 5px;">
                  <div v-html="fileMetadata.description"></div>
                </div>
                
              </div>
            </div>

            <Divider />

            <!-- Media Preview -->
            <div v-if="isPreviewable(fileMetadata.type)" class="preview-section">
              <PreviewVideo v-if="isVideo(fileMetadata.type)" 
                            :previewUrl="previewUrl" 
                            :fileType="fileMetadata.type" />

              <PreviewImage v-else-if="isImage(fileMetadata.type)" 
                            :previewUrl="previewUrl" 
                            :fileName="fileMetadata.originalName" />

              <PreviewText v-else-if="isText(fileMetadata.type)" 
                           :previewUrl="previewUrl" 
                           :fileName="fileMetadata.originalName" 
                           :fileType="fileMetadata.type" />
            </div>

            <!-- Download Section -->
            <div class="download-section">
              <h3>Download File</h3>
              <p class="download-description">
                Click the button below to download this file to your device.
              </p>
              <Button 
                @click="downloadFile"
                :label="`Download ${fileMetadata.displayName || fileMetadata.originalName}`"
                icon="pi pi-download"
                size="large"
                class="download-button"
                :loading="downloading"
              />
            </div>

            <!-- Expiry Notice -->
            <div class="expiry-notice">
              <small v-if="fileMetadata.expiryDate">
                <i class="pi pi-clock"></i>
                This file will expire on {{ formatDate(fileMetadata.expiryDate) }}
              </small>
              <small v-else>
                <i class="pi pi-infinity"></i>
                This file never expires
              </small>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script>
import { S3Service } from '../services/s3Service'
import { AuthService } from '../services/authService'
import AuthHeader from '../components/AuthHeader.vue'
import PreviewVideo from '../components/PreviewVideo.vue'
import PreviewImage from '../components/PreviewImage.vue'
import PreviewText from '../components/PreviewText.vue'
import Editor from 'primevue/editor'

export default {
  name: 'FileView',
  props: {
    fileId: {
      type: String,
      required: true
    }
  },
  components: {
    AuthHeader,
    PreviewVideo,
    PreviewImage,
    PreviewText,
    Editor
  },
  data() {
    return {
      loading: true,
      error: null,
      fileMetadata: null,
      needsPasscode: false,
      authenticated: false,
      enteredPasscode: '',
      passcodeError: '',
      verifying: false,
      downloading: false,
      previewUrl: null
    }
  },
  computed: {
    isExpired() {
      if (!this.fileMetadata?.expiryDate) return false;
      return new Date(this.fileMetadata.expiryDate) < new Date();
    }
  },
  async mounted() {
    await this.loadFileMetadata()
  },
  methods: {
    async loadFileMetadata() {
      try {
        this.loading = true;
        this.error = null;
        
        const result = await S3Service.getMetadata(this.fileId);
        
        if (result.success) {
          this.fileMetadata = result.metadata;
          this.needsPasscode = !!this.fileMetadata.passcode;
          this.authenticated = false;
          
          // If no passcode is needed, set up preview immediately
          if (!this.needsPasscode) {
            await this.setupPreview();
          }
        } else {
          this.error = result.error;
        }
      } catch (error) {
        console.error('Load metadata error:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    async verifyPasscode() {
      if (!this.enteredPasscode.trim()) {
        this.passcodeError = 'Please enter a passcode'
        return
      }

      try {
        this.verifying = true
        this.passcodeError = ''
        
        const result = await S3Service.getDownloadUrl(this.fileId, this.enteredPasscode)
        
        if (!result.success) {
          this.passcodeError = result.error
          return
        }
        
        this.authenticated = true
        await this.setupPreview()
      } catch (error) {
        console.error('Passcode verification error:', error)
        this.passcodeError = 'Verification failed'
      } finally {
        this.verifying = false
      }
    },

    async setupPreview() {
      if (this.isPreviewable(this.fileMetadata.type)) {
        try {
          const result = await S3Service.getDownloadUrl(
            this.fileId, 
            this.needsPasscode ? this.enteredPasscode : null
          )
          if (result.success) {
            this.previewUrl = result.downloadUrl
          }
        } catch (error) {
          console.error('Preview setup error:', error)
        }
      }
    },

    async downloadFile() {
      try {
        this.downloading = true
        
        const result = await S3Service.getDownloadUrl(
          this.fileId, 
          this.needsPasscode ? this.enteredPasscode : null
        )
        
        if (!result.success) {
          this.$toast.add({
            severity: 'error',
            summary: 'Download Error',
            detail: result.error,
            life: 5000
          })
          return
        }
        
        // Create download link
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = this.fileMetadata.originalName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Update download count in UI
        this.fileMetadata.downloadCount += 1
        
        this.$toast.add({
          severity: 'success',
          summary: 'Download Started',
          detail: 'Your file download has begun',
          life: 3000
        })
      } catch (error) {
        console.error('Download error:', error)
        this.$toast.add({
          severity: 'error',
          summary: 'Download Failed',
          detail: 'Failed to start download',
          life: 5000
        })
      } finally {
        this.downloading = false
      }
    },

    isPreviewable(type) {
      return this.isImage(type) || this.isVideo(type) || this.isText(type)
    },

    isImage(type) {
      return type && type.startsWith('image/')
    },

    isVideo(type) {
      return type && type.startsWith('video/')
    },

    isText(type) {
      // Check for common text file MIME types
      const textTypes = [
        'text/plain',
        'text/html',
        'text/css',
        'text/javascript',
        'text/xml',
        'application/javascript',
        'application/json',
        'application/xml',
        'application/xhtml+xml'
      ]
      
      if (textTypes.includes(type)) {
        return true
      }
      
      // If no specific MIME type, check by file extension
      const fileName = this.fileMetadata?.originalName || this.fileMetadata?.displayName || ''
      const extension = fileName.split('.').pop()?.toLowerCase()
      
      const textExtensions = [
        'txt', 'md', 'markdown', 'html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx',
        'json', 'xml', 'svg', 'vue', 'py', 'rb', 'php', 'java', 'c', 'cpp', 'h',
        'cs', 'go', 'rs', 'swift', 'kt', 'scala', 'sh', 'bash', 'zsh', 'ps1',
        'sql', 'yaml', 'yml', 'toml', 'ini', 'conf', 'cfg', 'log', 'scss', 'sass',
        'less', 'dockerfile', 'gitignore', 'htaccess', 'env', 'editorconfig'
      ]
      
      return textExtensions.includes(extension)
    },

    getFileIcon(type) {
      if (this.isImage(type)) return 'pi pi-image'
      if (this.isVideo(type)) return 'pi pi-video'
      if (type && type.includes('pdf')) return 'pi pi-file-pdf'
      if (type && type.includes('zip')) return 'pi pi-file-archive'
      if (type && type.includes('audio')) return 'pi pi-volume-up'
      return 'pi pi-file'
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
  }
}
</script>

<style scoped>
.file-view {
  min-height: 100vh;
  padding: 2rem 0;
}

.back-link {
  margin-bottom: 2rem;
}

.back-button {
  color: rgba(255, 255, 255, 0.9);
}

.loading-section, .error-section, .passcode-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.loading-content, .error-content, .passcode-content {
  text-align: center;
  padding: 3rem 2rem;
}

.loading-content h3, .error-content h2, .passcode-content h2 {
  margin: 1rem 0;
  color: #374151;
}

.error-content p, .passcode-content p {
  color: #6b7280;
  margin-bottom: 2rem;
}

.passcode-form {
  display: flex;
  gap: 1rem;
  max-width: 400px;
  margin: 2rem auto;
}

.passcode-field {
  flex: 1;
}

.error-message {
  color: #ef4444;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.file-card {
  padding: 2rem;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.file-icon {
  flex-shrink: 0;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 2rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.5rem;
  word-break: break-all;
}

.file-description {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.file-description .ql-editor {
  padding: 0 !important;
  font-style: italic;
  color: #6b7280;
  border: none !important;
  background: transparent !important;
}

.file-description .ql-container {
  border: none !important;
  font-family: inherit;
}

.file-description .ql-toolbar {
  display: none !important;
}

.file-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preview-section {
  margin: 2rem 0;
}

.download-section {
  margin: 2rem 0;
  text-align: center;
}

.download-section h3 {
  margin-bottom: 1rem;
  color: #374151;
}

.download-description {
  color: #6b7280;
  margin-bottom: 2rem;
}

.download-button {
  font-size: 1.1rem;
  padding: 1rem 2rem;
}

.expiry-notice {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
}

.home-button, .unlock-button {
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .file-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .file-name {
    font-size: 1.5rem;
  }
  
  .file-card {
    padding: 1rem;
  }
  
  .passcode-form {
    flex-direction: column;
  }
}

.expired-section {
  max-width: 600px;
  margin: 2rem auto;
}

.expired-content {
  text-align: center;
  padding: 2rem;
}

.expired-content h2 {
  color: #ef4444;
  margin: 1rem 0;
}

.expired-content p {
  color: #6b7280;
  margin-bottom: 2rem;
}
</style> 