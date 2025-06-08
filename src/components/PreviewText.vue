<template>
  <div class="text-preview">
    <h3>Preview</h3>
    <div class="text-container">
      <div class="file-info">
        <span class="file-name">{{ fileName }}</span>
        <span class="file-language">{{ detectedLanguage }}</span>
      </div>
      <div 
        ref="codeContainer"
        class="code-container"
        v-html="highlightedCode"
      ></div>
      <div v-if="loading" class="loading-text">
        <i class="pi pi-spin pi-spinner"></i>
        Loading file content...
      </div>
      <div v-if="error" class="error-text">
        <i class="pi pi-exclamation-triangle"></i>
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import Prism from 'prismjs'
import 'prismjs/themes/prism.css'

// Import core languages (these don't have dependencies)
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-sql'

// Import languages with dependencies after their dependencies
import 'prismjs/components/prism-typescript' // depends on javascript
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-yaml'

export default {
  name: 'PreviewText',
  props: {
    previewUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      textContent: '',
      highlightedCode: '',
      detectedLanguage: 'text',
      loading: true,
      error: null,
      maxFileSize: 1024 * 1024 // 1MB limit for text preview
    }
  },
  async mounted() {
    // Debug Prism availability
    console.log('Prism available:', !!Prism)
    if (Prism && Prism.languages) {
      console.log('Prism languages loaded:', Object.keys(Prism.languages))
    }
    
    await this.loadTextContent()
  },

  methods: {
    async loadTextContent() {
      try {
        this.loading = true
        this.error = null
        
        const response = await fetch(this.previewUrl)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const contentLength = response.headers.get('content-length')
        if (contentLength && parseInt(contentLength) > this.maxFileSize) {
          throw new Error('File too large for preview (max 1MB)')
        }
        
        this.textContent = await response.text()
        
        // Limit displayed content if too long
        if (this.textContent.length > 50000) {
          this.textContent = this.textContent.substring(0, 50000) + '\n\n... (content truncated for preview)'
        }
        
        this.detectedLanguage = this.detectLanguage()
        this.highlightCode()
        
      } catch (error) {
        console.error('Error loading text content:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    detectLanguage() {
      const extension = this.fileName.split('.').pop()?.toLowerCase()
      
      // Only map to languages we've actually imported
      const languageMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'vue': 'markup',
        'html': 'markup',
        'htm': 'markup',
        'xml': 'markup',
        'svg': 'markup',
        'css': 'css',
        'scss': 'css',
        'sass': 'css',
        'less': 'css',
        'json': 'json',
        'py': 'python',
        'sh': 'bash',
        'bash': 'bash',
        'zsh': 'bash',
        'sql': 'sql',
        'yaml': 'yaml',
        'yml': 'yaml',
        'txt': 'text',
        'log': 'text'
      }
      
      const detected = languageMap[extension] || 'text'
      console.log(`Detected language for .${extension}: ${detected}`)
      return detected
    },
    
    highlightCode() {
      try {
        if (this.detectedLanguage === 'text') {
          // For plain text, just escape HTML and preserve whitespace
          this.highlightedCode = `<pre class="language-text"><code>${this.escapeHtml(this.textContent)}</code></pre>`
          return
        }
        
        // Check if Prism and the language grammar are available
        if (!Prism || !Prism.languages) {
          console.warn('Prism not available, falling back to plain text')
          this.highlightedCode = `<pre class="language-text"><code>${this.escapeHtml(this.textContent)}</code></pre>`
          this.detectedLanguage = 'text (prism unavailable)'
          return
        }
        
        const grammar = Prism.languages[this.detectedLanguage]
        console.log(`Grammar for ${this.detectedLanguage}:`, !!grammar)
        console.log('Available languages:', Object.keys(Prism.languages))
        
        if (grammar && typeof grammar === 'object') {
          try {
            const highlighted = Prism.highlight(this.textContent, grammar, this.detectedLanguage)
            this.highlightedCode = `<pre class="language-${this.detectedLanguage}"><code>${highlighted}</code></pre>`
            console.log(`Successfully highlighted as ${this.detectedLanguage}`)
          } catch (highlightError) {
            console.error('Error during highlighting:', highlightError)
            this.highlightedCode = `<pre class="language-text"><code>${this.escapeHtml(this.textContent)}</code></pre>`
            this.detectedLanguage = 'text (highlight error)'
          }
        } else {
          // Fallback if language not supported
          console.warn(`Language ${this.detectedLanguage} not supported, available:`, Object.keys(Prism.languages))
          this.highlightedCode = `<pre class="language-text"><code>${this.escapeHtml(this.textContent)}</code></pre>`
          this.detectedLanguage = 'text (unsupported)'
        }
      } catch (error) {
        console.error('Error highlighting code:', error)
        // Fallback to plain text
        this.highlightedCode = `<pre class="language-text"><code>${this.escapeHtml(this.textContent)}</code></pre>`
        this.detectedLanguage = 'text (fallback)'
      }
    },
    
    escapeHtml(text) {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    }
  }
}
</script>

<style scoped>
.text-preview h3 {
  margin-bottom: 1rem;
  color: #374151;
}

.text-container {
  max-width: 1000px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background: #f8f9fa;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #e9ecef;
  border-bottom: 1px solid #dee2e6;
  font-size: 0.875rem;
}

.file-name {
  font-weight: 600;
  color: #495057;
}

.file-language {
  color: #6c757d;
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 500;
  background: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.code-container {
  max-height: 600px;
  overflow: auto;
  background: #ffffff;
}

.loading-text, .error-text {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.error-text {
  color: #dc3545;
}

.loading-text i, .error-text i {
  margin-right: 0.5rem;
}



/* Prism.js styling override */
:deep(pre[class*="language-"]) {
  margin: 0;
  padding: 1rem;
  background: #ffffff !important;
  border: none;
  border-radius: 0;
  font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
  box-shadow: none;
}

:deep(code[class*="language-"]) {
  background: none !important;
  padding: 0;
  white-space: pre;
  word-wrap: normal;
  overflow-wrap: normal;
  color: #495057;
  font-family: inherit;
  font-size: inherit;
  text-shadow: none;
}

/* Plain text specific styling */
:deep(pre.language-text) {
  background: #ffffff !important;
}

:deep(code.language-text) {
  color: #495057 !important;
}

/* Custom scrollbar for code container */
.code-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.code-container::-webkit-scrollbar-track {
  background: #f1f3f4;
}

.code-container::-webkit-scrollbar-thumb {
  background: #c1c8cd;
  border-radius: 4px;
}

.code-container::-webkit-scrollbar-thumb:hover {
  background: #a8b4bc;
}

@media (max-width: 768px) {
  .text-container {
    margin: 0 1rem;
  }
  
  .file-info {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  :deep(pre[class*="language-"]) {
    font-size: 0.75rem;
    padding: 0.75rem;
  }
}
</style> 