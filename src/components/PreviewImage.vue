<template>
  <div class="image-preview">
    <h3>Preview</h3>
    <div class="media-container">
      <img 
        :src="previewUrl"
        :alt="fileName"
        class="preview-image"
        @load="onImageLoad"
        @error="onImageError"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'PreviewImage',
  props: {
    previewUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    }
  },
  methods: {
    onImageLoad() {
      console.log('Image loaded successfully')
    },
    
    onImageError() {
      console.error('Failed to load image')
    }
  }
}
</script>

<style scoped>
.image-preview h3 {
  margin-bottom: 1rem;
  color: #374151;
}

.media-container {
  max-width: 800px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.preview-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: zoom-in;
  transition: transform 0.3s ease;
}

.preview-image:hover {
  transform: scale(1.02);
}

@media (max-width: 768px) {
  .media-container {
    margin: 0 1rem;
  }
}
</style> 