<template>
  <div class="video-preview">
    <h3>Preview</h3>
    <div class="media-container">
      <video 
        ref="videoPlayer"
        class="preview-video"
        playsinline
        controls
        preload="metadata"
        crossorigin="anonymous"
        @loadedmetadata="onVideoLoaded"
      >
        <source :src="previewUrl" :type="fileType" />
        Your browser does not support the video tag.
      </video>
    </div>
  </div>
</template>

<script>
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'

export default {
  name: 'PreviewVideo',
  props: {
    previewUrl: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      plyrInstance: null
    }
  },
  mounted() {
    if (this.previewUrl) {
      this.$nextTick(() => {
        setTimeout(() => {
          this.initializePlyr()
        }, 150)
      })
    }
  },
  beforeUnmount() {
    if (this.plyrInstance) {
      // Remove all event listeners
      this.plyrInstance.off('ready')
      this.plyrInstance.off('error')
      
      // Destroy the Plyr instance
      this.plyrInstance.destroy()
      this.plyrInstance = null
    }

    // Clean up video element
    if (this.$refs.videoPlayer) {
      const video = this.$refs.videoPlayer
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  },
  watch: {
    previewUrl(newUrl) {
      if (newUrl) {
        this.$nextTick(() => {
          setTimeout(() => {
            this.initializePlyr()
          }, 150)
        })
      }
    }
  },
  methods: {
    onVideoLoaded() {
      console.log('Video metadata loaded, initializing Plyr...')
      this.$nextTick(() => {
        this.initializePlyr()
      })
    },

    initializePlyr() {
      console.log('Attempting to initialize Plyr...')
      console.log('Video ref exists:', !!this.$refs.videoPlayer)
      console.log('Plyr already initialized:', !!this.plyrInstance)
      
      if (this.$refs.videoPlayer && !this.plyrInstance) {
        try {
          console.log('Initializing Plyr...')
          this.plyrInstance = new Plyr(this.$refs.videoPlayer, {
            controls: [
              'play-large',
              'play',
              'progress', 
              'current-time',
              'duration',
              'mute',
              'volume',
              'settings',
              'fullscreen'
            ],
            settings: ['quality', 'speed'],
            quality: {
              default: 'auto',
              options: ['auto', 1080, 720, 480, 360]
            },
            speed: {
              selected: 1,
              options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
            }
          })
          console.log('Plyr initialized successfully!')
          
          // Add event listeners for debugging
          this.plyrInstance.on('ready', () => {
            console.log('Plyr is ready!')
          })
          
          this.plyrInstance.on('error', (error) => {
            console.error('Plyr error:', error)
          })
          
        } catch (error) {
          console.error('Plyr initialization error:', error)
        }
      } else if (!this.$refs.videoPlayer) {
        console.log('Video player ref not found, retrying in 200ms...')
        setTimeout(() => {
          this.initializePlyr()
        }, 200)
      }
    }
  }
}
</script>

<style scoped>
.video-preview h3 {
  margin-bottom: 1rem;
  color: #374151;
}

.media-container {
  max-width: 800px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.preview-video {
  width: 100%;
  height: auto;
}

/* Plyr Video Player Styling */
:deep(.plyr) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

:deep(.plyr--video) {
  background: #000;
}

:deep(.plyr__control--overlaid) {
  background: rgba(102, 126, 234, 0.9);
}

:deep(.plyr__control--overlaid:hover) {
  background: rgba(102, 126, 234, 1);
}

:deep(.plyr__controls) {
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
}

:deep(.plyr__control.plyr__tab-focus),
:deep(.plyr__control:hover),
:deep(.plyr__control[aria-expanded=true]) {
  background: rgba(102, 126, 234, 0.8);
}

:deep(.plyr--full-ui input[type=range]) {
  color: #667eea;
}

:deep(.plyr__progress input[type=range]) {
  color: #667eea;
}

:deep(.plyr__volume input[type=range]) {
  color: #667eea;
}
</style> 