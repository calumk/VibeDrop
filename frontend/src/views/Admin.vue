<template>
  <div class="clean-view">
    <div class="container">
      <!-- Authentication Header -->
      <AuthHeader label="Admin Access" />

      <!-- Header Card -->
      <Card class="glass-card header-card">
        <template #content>
          <div class="header-content">
            <div class="title-section">
              <h1 class="page-title">
                <i class="pi pi-cog"></i>
                {{ appName }} - Admin
              </h1>
              <p class="page-subtitle">Manage and cleanup uploaded files</p>
            </div>
            <div class="action-buttons">
              <Button 
                @click="loadFiles"
                :loading="loading"
                label="Refresh"
                icon="pi pi-refresh"
                class="refresh-btn"
              />
              <Button 
                @click="cleanupExpiredFiles"
                :loading="cleaningExpired"
                label="Clean Expired"
                icon="pi pi-trash"
                severity="danger"
                :disabled="!expiredCount"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <Card class="stat-card">
          <template #content>
            <div class="stat-content">
              <div class="stat-icon total">
                <i class="pi pi-file"></i>
              </div>
              <div class="stat-info">
                <h3>{{ totalFiles }}</h3>
                <p>Total Files</p>
              </div>
            </div>
          </template>
        </Card>
        
        <Card class="stat-card">
          <template #content>
            <div class="stat-content">
              <div class="stat-icon active">
                <i class="pi pi-check-circle"></i>
              </div>
              <div class="stat-info">
                <h3>{{ activeFiles }}</h3>
                <p>Active Files</p>
              </div>
            </div>
          </template>
        </Card>
        
        <Card class="stat-card">
          <template #content>
            <div class="stat-content">
              <div class="stat-icon expired">
                <i class="pi pi-times-circle"></i>
              </div>
              <div class="stat-info">
                <h3>{{ expiredCount }}</h3>
                <p>Expired Files</p>
              </div>
            </div>
          </template>
        </Card>
        
        <Card class="stat-card">
          <template #content>
            <div class="stat-content">
              <div class="stat-icon storage">
                <i class="pi pi-database"></i>
              </div>
              <div class="stat-info">
                <h3>{{ formatTotalSize(totalSize) }}</h3>
                <p>Total Storage</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Files Table -->
      <Card class="glass-card table-card">
        <template #content>
          <div v-if="loading" class="loading-section">
            <i class="pi pi-spin pi-spinner loading-spinner"></i>
            <p>Loading files...</p>
          </div>
          
          <div v-else-if="error" class="error-section">
            <i class="pi pi-exclamation-triangle"></i>
            <p>{{ error }}</p>
          </div>
          
          <div v-else-if="files.length === 0" class="empty-section">
            <i class="pi pi-inbox"></i>
            <h3>No Files Found</h3>
            <p>No files have been uploaded yet.</p>
          </div>
          
          <div v-else>
            <DataTable 
              :value="files" 
              :paginator="true" 
              :rows="10"
              :rowsPerPageOptions="[5, 10, 20, 50]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Showing {first} to {last} of {totalRecords} files"
              :sortField="sortField"
              :sortOrder="sortOrder"
              @sort="onSort"
              class="files-table"
              responsiveLayout="scroll"
              :globalFilterFields="['name', 'status']"
              v-model:filters="filters"
              filterDisplay="menu"
            >
                             <Column field="displayName" header="File Name" sortable>
                 <template #body="{ data }">
                   <div class="file-name-cell">
                     <i :class="getFileIcon(data.type)" class="file-icon"></i>
                     <div class="file-name-info">
                       <span class="file-name" :title="data.displayName || data.originalName">{{ data.displayName || data.originalName }}</span>
                       <!-- <small v-if="data.description" class="file-description-small">{{ data.description }}</small> -->
                     </div>
                   </div>
                 </template>
               </Column>
              
              <Column field="size" header="Size" sortable>
                <template #body="{ data }">
                  <span class="file-size">{{ formatFileSize(data.size) }}</span>
                </template>
              </Column>
              
              <Column field="createdAt" header="Uploaded" sortable>
                <template #body="{ data }">
                  <span class="upload-date">{{ formatDate(data.createdAt) }}</span>
                </template>
              </Column>
              
                             <Column field="expiryDate" header="Expires" sortable>
                 <template #body="{ data }">
                   <span v-if="data.expiryDate" class="expiry-date" :class="{ expired: data.isExpired }">
                     {{ formatDate(data.expiryDate) }}
                   </span>
                   <Tag v-else value="Never" severity="success" icon="pi pi-infinity" />
                 </template>
               </Column>
              
              <Column field="downloadCount" header="Downloads" sortable>
                <template #body="{ data }">
                  <span class="download-count">{{ data.downloadCount }}</span>
                </template>
              </Column>
              
              <Column field="passcode" header="Protected">
                <template #body="{ data }">
                  <i v-if="data.passcode && data.passcode !== ''" class="pi pi-check-circle protected-icon" style="color: #22c55e;" title="Password Protected"></i>
                  <i v-else class="pi pi-times-circle unprotected-icon" style="color: #6b7280;" title="No Password"></i>
                </template>
              </Column>
              
              <Column header="Actions" :style="{ width: '100px' }">
                <template #body="{ data }">
                  <div class="action-buttons">
                    <Button 
                      @click="viewFile(data.id)"
                      icon="pi pi-eye"
                      class="p-button-rounded p-button-text p-button-sm view-btn"
                      title="View File"
                    />
                    <Button 
                      @click="copyLink(data.id)"
                      icon="pi pi-copy"
                      class="p-button-rounded p-button-text p-button-sm copy-btn"
                      title="Copy Link"
                    />
                    <Button 
                      @click="showExtendOptions(data)"
                      icon="pi pi-clock"
                      class="p-button-rounded p-button-text p-button-sm extend-btn"
                      title="Extend Expiry"
                    />
                    <Button 
                      @click="confirmDelete(data)"
                      icon="pi pi-trash"
                      class="p-button-rounded p-button-text p-button-sm delete-btn"
                      title="Delete File"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </template>
      </Card>

      <!-- Delete Confirmation Dialog -->
      <Dialog 
        v-model:visible="showDeleteDialog" 
        modal 
        header="Confirm Deletion"
        class="delete-dialog"
      >
        <div v-if="fileToDelete" class="delete-confirmation">
          <i class="pi pi-exclamation-triangle warning-icon"></i>
          <div class="confirmation-text">
            <h3>Delete File?</h3>
            <p>Are you sure you want to permanently delete:</p>
            <p class="file-name-highlight">{{ fileToDelete.originalName }}</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
        </div>
        
        <template #footer>
          <Button 
            label="Cancel" 
            icon="pi pi-times" 
            @click="showDeleteDialog = false" 
            class="p-button-text"
          />
          <Button 
            label="Delete" 
            icon="pi pi-trash" 
            @click="deleteFile" 
            severity="danger"
            :loading="deleting"
          />
        </template>
      </Dialog>

      <!-- Extend Expiry Dialog -->
      <Dialog v-model:visible="extendDialogVisible" header="Extend Expiry" :modal="true" :style="{ width: '400px' }">
        <div class="flex flex-column gap-3 p-3">
          <Button label="Extend by 7 days" icon="pi pi-calendar-plus" class="p-button-info" @click="extendExpiry(7)" style="width: 100%; margin-bottom: 1rem"/>
          <Button label="Set to never expire" icon="pi pi-infinity" class="p-button-success" @click="extendExpiry(null)"  style="width: 100%; margin-bottom: 1rem"/>
        </div>
      </Dialog>
    </div>
  </div>
</template>

<script>
import { S3Service } from '../services/s3Service'
import { AuthService } from '../services/authService'
import AuthHeader from '../components/AuthHeader.vue'

export default {
  name: 'Clean',
  components: {
    AuthHeader
  },
  data() {
    return {
      loading: false,
      cleaningExpired: false,
      deleting: false,
      files: [],
      error: null,
      showDeleteDialog: false,
      fileToDelete: null,
      extendDialogVisible: false,
      selectedFile: null,
      filters: {},
      sortField: 'createdAt',
      sortOrder: -1,
    }
  },
  computed: {
    appName() {
      return import.meta.env.VITE_APP_NAME
    },
    totalFiles() {
      return this.files.length
    },
    activeFiles() {
      return this.files.filter(file => !file.isExpired).length
    },
    expiredCount() {
      return this.files.filter(file => file.isExpired).length
    },
    totalSize() {
      return this.files.reduce((total, file) => total + file.size, 0)
    }
  },
  async mounted() {
    this.checkAuthentication()
    await this.loadFiles()
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

    async loadFiles() {
      this.loading = true
      this.error = null
      
      try {
        const result = await S3Service.getAllFiles()
        
        if (result.success) {
          this.files = result.files.map(file => ({
            ...file,
            isExpired: this.isExpired(file)
          }))
        } else {
          this.error = result.error
        }
      } catch (error) {
        console.error('Load files error:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async cleanupExpiredFiles() {
      this.cleaningExpired = true
      
      try {
        const result = await S3Service.cleanupExpiredFiles()
        
        this.$toast.add({
          severity: result.success ? 'success' : 'error',
          summary: result.success ? 'Cleanup Complete' : 'Cleanup Failed',
          detail: result.success ? result.message : result.error,
          life: 5000
        })

        if (result.success) {
          // Store current state
          const currentFilters = { ...this.filters }
          const currentSortField = this.sortField
          const currentSortOrder = this.sortOrder
          await this.loadFiles() // Refresh the list
          // Restore state after refresh
          this.filters = currentFilters
          this.sortField = currentSortField
          this.sortOrder = currentSortOrder
        }
      } catch (error) {
        console.error('Cleanup error:', error)
        this.$toast.add({
          severity: 'error',
          summary: 'Cleanup Failed',
          detail: error.message,
          life: 5000
        })
      } finally {
        this.cleaningExpired = false
      }
    },

    confirmDelete(file) {
      this.fileToDelete = file
      this.showDeleteDialog = true
    },

    async deleteFile() {
      if (!this.fileToDelete) return
      
      this.deleting = true
      
      try {
        const result = await S3Service.deleteFile(this.fileToDelete.id)
        
        this.$toast.add({
          severity: result.success ? 'success' : 'error',
          summary: result.success ? 'File Deleted' : 'Delete Failed',
          detail: result.success ? result.message : result.error,
          life: 5000
        })

        if (result.success) {
          this.showDeleteDialog = false
          this.fileToDelete = null
          // Store current state
          const currentFilters = { ...this.filters }
          const currentSortField = this.sortField
          const currentSortOrder = this.sortOrder
          await this.loadFiles() // Refresh the list
          // Restore state after refresh
          this.filters = currentFilters
          this.sortField = currentSortField
          this.sortOrder = currentSortOrder
        }
      } catch (error) {
        console.error('Delete error:', error)
        this.$toast.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: error.message,
          life: 5000
        })
      } finally {
        this.deleting = false
      }
    },

    viewFile(fileId) {
      const url = `${window.location.origin}/file/${fileId}`
      window.open(url, '_blank')
    },

    async copyLink(fileId) {
      const url = `${window.location.origin}/file/${fileId}`
      
      try {
        await navigator.clipboard.writeText(url)
        this.$toast.add({
          severity: 'success',
          summary: 'Link Copied',
          detail: 'File link copied to clipboard',
          life: 3000
        })
      } catch (error) {
        console.error('Copy error:', error)
        this.$toast.add({
          severity: 'error',
          summary: 'Copy Failed',
          detail: 'Failed to copy link to clipboard',
          life: 3000
        })
      }
    },

    getFileIcon(type) {
      if (type && type.startsWith('image/')) return 'pi pi-image'
      if (type && type.startsWith('video/')) return 'pi pi-video'
      if (type && type.includes('pdf')) return 'pi pi-file-pdf'
      if (type && (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar') || type.includes('gz'))) return 'pi pi-file-plus'
      if (type && type.startsWith('audio/')) return 'pi pi-volume-up'
      return 'pi pi-file'
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    formatTotalSize(bytes) {
      if (bytes === 0) return '0 GB'
      const gb = bytes / (1024 * 1024 * 1024)
      if (gb < 1) {
        const mb = bytes / (1024 * 1024)
        return mb.toFixed(1) + ' MB'
      }
      return gb.toFixed(2) + ' GB'
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    isExpired(file) {
      if (!file.expiryDate) return false;
      return new Date(file.expiryDate) < new Date();
    },

    showExtendOptions(file) {
      this.selectedFile = file;
      this.extendDialogVisible = true;
    },

    async extendExpiry(days) {
      if (!this.selectedFile) return;
      
      try {
        const newExpiryDate = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;
        const result = await S3Service.updateMetadata(this.selectedFile.id, {
          ...this.selectedFile,
          expiryDate: newExpiryDate ? newExpiryDate.toISOString() : null,
          expiryDays: days
        });

        if (result.success) {
          this.$toast.add({
            severity: 'success',
            summary: 'Success',
            detail: days ? 'File expiry extended by 7 days' : 'File set to never expire',
            life: 3000
          });
          await this.loadFiles();
        }
      } catch (error) {
        console.error('Error extending expiry:', error);
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to extend file expiry',
          life: 3000
        });
      } finally {
        this.extendDialogVisible = false;
        this.selectedFile = null;
      }
    },

    onSort(event) {
      this.sortField = event.sortField
      this.sortOrder = event.sortOrder
    },
  }
}
</script>

<style scoped>
.clean-view {
  min-height: 100vh;
  padding: 2rem 0;
}

/* Remove duplicate container styles */
/* .container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
} */

/* Header Card */
.header-card {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

.title-section {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-title i {
  color: #667eea;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 1.1rem;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-start;
  padding: 0 0.5rem;
}

.refresh-btn {
  background: #667eea;
  border-color: #667eea;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(45deg, #667eea, #764ba2);
}

.stat-icon.active {
  background: linear-gradient(45deg, #10b981, #059669);
}

.stat-icon.expired {
  background: linear-gradient(45deg, #ef4444, #dc2626);
}

.stat-icon.storage {
  background: linear-gradient(45deg, #f59e0b, #d97706);
}

.stat-info h3 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: #374151;
}

.stat-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Table Card */
.table-card {
  margin-bottom: 2rem;
}

/* Loading, Error, Empty States */
.loading-section, .error-section, .empty-section {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

.loading-spinner {
  font-size: 2rem;
  color: #667eea;
  margin-bottom: 1rem;
}

.error-section i, .empty-section i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #9ca3af;
}

.empty-section h3 {
  margin: 1rem 0 0.5rem 0;
  color: #374151;
}

/* Table Styles */
.files-table {
  font-size: 0.9rem;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  padding: 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b5563;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 300px;
}

.file-icon {
  font-size: 1rem;
  color: #6b7280;
}

.file-name-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.file-name {
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.2;
}

.file-description-small {
  font-size: 0.75rem;
  color: #6b7280;
}

.file-size, .upload-date, .expiry-date, .download-count {
  font-size: 0.85rem;
  color: #4b5563;
}

:deep(.p-tag) {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

:deep(.p-button.p-button-sm) {
  width: 2rem;
  height: 2rem;
}

:deep(.p-button.p-button-sm .p-button-icon) {
  font-size: 0.875rem;
}

/* Protected Icons */
.protected-icon,
.unprotected-icon {
  font-size: 0.875rem;
}

/* Pagination */
:deep(.p-paginator) {
  font-size: 0.85rem;
}

:deep(.p-paginator .p-paginator-current) {
  font-size: 0.85rem;
}

:deep(.p-dropdown-label) {
  font-size: 0.85rem;
}

/* Delete Dialog */
.delete-dialog {
  max-width: 500px;
}

.delete-confirmation {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
}

.warning-icon {
  font-size: 2.5rem;
  color: #f59e0b;
  flex-shrink: 0;
}

.confirmation-text h3 {
  margin: 0 0 1rem 0;
  color: #374151;
}

.confirmation-text p {
  margin: 0.5rem 0;
  color: #6b7280;
}

.file-name-highlight {
  font-weight: 600;
  color: #374151;
  font-family: monospace;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.warning-text {
  color: #ef4444;
  font-weight: 500;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-content {
    padding: 1rem;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }

  .stat-info h3 {
    font-size: 1.5rem;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .delete-confirmation {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 640px) {
  .container {
    padding: 0 0.5rem;
  }

  .header-content {
    padding: 1rem;
  }

  .files-table {
    font-size: 0.875rem;
  }

  .file-name {
    max-width: 120px;
  }
}

/* Action Buttons */
.view-btn {
  color: #2196F3;
}

.copy-btn {
  color: #4CAF50;
}

.extend-btn {
  color: #2196F3;
}

.delete-btn {
  color: #f44336;
}

.p-button.p-button-text:hover {
  background: rgba(0, 0, 0, 0.04);
}

.p-button.p-button-sm {
  width: 2rem;
  height: 2rem;
}

.p-button.p-button-sm .p-button-icon {
  font-size: 0.875rem;
}
</style> 