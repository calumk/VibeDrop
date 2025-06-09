<template>
  <div :class="useSimpleLogin ? 'simple-login-view' : 'splash-view'">
    <!-- Simple Login Version -->
    <div v-if="useSimpleLogin" class="simple-login-container">
      <Card class="login-card">
        <template #content>
          <div class="login-content">
            <h1 class="login-title">{{ appName }}</h1>
            <p class="login-subtitle">{{ appTagline }}</p>
            
            <div class="login-form">
              <InputText 
                v-model="password" 
                placeholder="Enter password"
                type="password"
                class="login-input"
                @keyup.enter="authenticateSimple"
              />
              <Button 
                @click="authenticateSimple" 
                label="Login" 
                icon="pi pi-unlock"
                :loading="authenticating"
                class="login-button"
              />
            </div>
            
            <p v-if="authError" class="auth-error">
              {{ authError }}
            </p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Splash Version -->
    <div v-else class="container">
      <!-- Background Elements -->
      <div class="magic-background">
        <div class="magic-orb orb-1">✨</div>
        <div class="magic-orb orb-2">🌟</div>
        <div class="magic-orb orb-3">✨</div>
        <div class="magic-orb orb-4">💫</div>
        <div class="magic-orb orb-5">⭐</div>
      </div>

      <!-- Main Content -->
      <div class="splash-content">
        <div class="hero-section">
          <h1 class="hero-title">
            <span class="gradient-text">{{ appName }}</span>
          </h1>
          <p class="hero-subtitle">
            {{ appTagline }}
          </p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <i class="pi pi-cloud-upload"></i>
            </div>
            <h3>Upload Large Files</h3>
            <p>Share files up to 10GB with resumable uploads</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <i class="pi pi-shield"></i>
            </div>
            <h3>Password Protection</h3>
            <p>Secure your files with optional passcode protection</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <i class="pi pi-clock"></i>
            </div>
            <h3>Flexible Expiry</h3>
            <p>Set custom expiry dates or keep files forever</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <i class="pi pi-eye"></i>
            </div>
            <h3>Media Preview</h3>
            <p>Preview images and videos without downloading</p>
          </div>
        </div>

        <div class="action-section">
          <div class="action-buttons">
            <Button 
              @click="showUploadAuth = true"
              label="Upload Files"
              icon="pi pi-upload"
              size="large"
              class="upload-action-btn"
            />
            <Button 
              @click="showAdminAuth = true"
              label="Admin Panel"
              icon="pi pi-cog"
              severity="secondary"
              size="large"
              class="admin-action-btn"
            />
          </div>
          
          <div class="info-text">
            <p>
              <i class="pi pi-info-circle"></i>
              No account needed. Files are automatically cleaned up based on expiry settings.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Authentication Dialog -->
      <Dialog 
        v-model:visible="showUploadAuth" 
        modal 
        header="Access Upload"
        class="auth-dialog"
        v-if="!useSimpleLogin"
      >
      <div class="auth-content">
        <p class="auth-description">
          <i class="pi pi-shield"></i>
          Enter the access password to upload files
        </p>
        
        <div class="auth-form">
          <InputText 
            v-model="password" 
            placeholder="Enter password"
            type="password"
            class="auth-input"
            @keyup.enter="authenticateUpload"
          />
          <Button 
            @click="authenticateUpload" 
            label="Access Upload" 
            icon="pi pi-unlock"
            :loading="authenticating"
            class="auth-button"
          />
        </div>
        
        <p v-if="authError" class="auth-error">
          {{ authError }}
        </p>
      </div>
    </Dialog>

    <!-- Admin Authentication Dialog -->
    <Dialog 
      v-model:visible="showAdminAuth" 
      modal 
      header="Admin Access"
      class="auth-dialog"
    >
      <div class="auth-content">
        <p class="auth-description">
          <i class="pi pi-cog"></i>
          Enter the admin password to access file management
        </p>
        
        <div class="auth-form">
          <InputText 
            v-model="adminPassword" 
            placeholder="Enter admin password"
            type="password"
            class="auth-input"
            @keyup.enter="authenticateAdmin"
          />
          <Button 
            @click="authenticateAdmin" 
            label="Access Admin" 
            icon="pi pi-unlock"
            :loading="authenticatingAdmin"
            class="auth-button"
          />
        </div>
        
        <p v-if="adminAuthError" class="auth-error">
          {{ adminAuthError }}
        </p>
      </div>
    </Dialog>
  </div>
</template>

<script>
import { AuthService } from '../services/authService'

export default {
  name: 'Home',
  data() {
    return {
      showUploadAuth: false,
      showAdminAuth: false,
      password: '',
      adminPassword: '',
      authenticating: false,
      authenticatingAdmin: false,
      authError: '',
      adminAuthError: ''
    }
  },
  mounted() {
    // Check for URL authentication and auto-redirect
    if (AuthService.checkUrlAuth()) {
      this.$router.push('/upload')
    }
    // Check for existing authentication
    if (AuthService.isAuthenticated()) {
      this.$router.push('/upload')
    }
  },
  computed: {
    appName() {
      return import.meta.env.VITE_APP_NAME
    },
    appTagline() {
      return import.meta.env.VITE_APP_TAGLINE
    },
    useSimpleLogin() {
      return import.meta.env.VITE_USE_SIMPLE_LOGIN === 'true'
    }
  },
  methods: {
    async authenticateSimple() {
      if (!this.password.trim()) {
        this.authError = 'Please enter a password'
        return
      }

      this.authenticating = true
      this.authError = ''

      try {
        const success = AuthService.login(this.password)
        
        if (success) {
          // For simple login, default to upload page
          this.$router.push('/upload')
        } else {
          this.authError = 'Invalid password'
        }
      } catch (error) {
        this.authError = 'Authentication failed'
      } finally {
        this.authenticating = false
        this.password = ''
      }
    },

    async authenticateUpload() {
      if (!this.password.trim()) {
        this.authError = 'Please enter a password'
        return
      }

      this.authenticating = true
      this.authError = ''

      try {
        const success = AuthService.login(this.password)
        
        if (success) {
          this.showUploadAuth = false
          this.$router.push('/upload')
        } else {
          this.authError = 'Invalid password'
        }
      } catch (error) {
        this.authError = 'Authentication failed'
      } finally {
        this.authenticating = false
        this.password = ''
      }
    },

    async authenticateAdmin() {
      if (!this.adminPassword.trim()) {
        this.adminAuthError = 'Please enter a password'
        return
      }

      this.authenticatingAdmin = true
      this.adminAuthError = ''

      try {
        const success = AuthService.login(this.adminPassword)
        
        if (success) {
          this.showAdminAuth = false
          this.$router.push('/admin/clean')
        } else {
          this.adminAuthError = 'Invalid admin password'
        }
      } catch (error) {
        this.adminAuthError = 'Authentication failed'
      } finally {
        this.authenticatingAdmin = false
        this.adminPassword = ''
      }
    }
  }
}
</script>

<style scoped>
.splash-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 1;
}

/* Magic Background */
.magic-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.magic-orb {
  position: absolute;
  font-size: 2rem;
  animation: float-magic 8s ease-in-out infinite;
  opacity: 0.6;
}

.orb-1 { top: 10%; left: 10%; animation-delay: 0s; }
.orb-2 { top: 20%; right: 15%; animation-delay: 2s; }
.orb-3 { bottom: 30%; left: 15%; animation-delay: 4s; }
.orb-4 { top: 60%; right: 10%; animation-delay: 6s; }
.orb-5 { bottom: 10%; right: 30%; animation-delay: 1s; }

@keyframes float-magic {
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
    opacity: 0.6; 
  }
  50% { 
    transform: translateY(-30px) rotate(180deg); 
    opacity: 1; 
  }
}

/* Hero Section */
.splash-content {
  text-align: center;
  animation: fade-in-up 1s ease-out;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-section {
  margin-bottom: 4rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.gradient-text {
  background: linear-gradient(45deg, #667eea, #764ba2, #f093fb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 3s ease-in-out infinite alternate;
}

@keyframes gradient-shift {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(20deg); }
}

.hero-subtitle {
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
  animation: slide-up 0.8s ease-out both;
}

.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.2s; }
.feature-card:nth-child(3) { animation-delay: 0.3s; }
.feature-card:nth-child(4) { animation-delay: 0.4s; }

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-card:hover {
  transform: translateY(-10px);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
  color: white;
}

.feature-card h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}

/* Action Section */
.action-section {
  animation: fade-in 1.2s ease-out 0.5s both;
}

.action-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.upload-action-btn {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  font-size: 1.1rem;
  padding: 1rem 2rem;
  transition: all 0.3s ease;
}

.upload-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 10px 25px rgba(102, 126, 234, 0.4),
    0 0 30px rgba(255, 0, 150, 0.2),
    0 0 50px rgba(0, 255, 255, 0.2),
    0 0 70px rgba(255, 255, 0, 0.1);
}

.admin-action-btn {
  font-size: 1.1rem;
  padding: 1rem 2rem;
  transition: all 0.3s ease;
}

.admin-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.2),
    0 0 30px rgba(255, 0, 150, 0.15),
    0 0 50px rgba(0, 255, 255, 0.15),
    0 0 70px rgba(255, 255, 0, 0.1);
}

.info-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.info-text i {
  margin-right: 0.5rem;
  color: #667eea;
}

/* Authentication Dialog */
.auth-dialog {
  max-width: 450px;
}

.auth-content {
  padding: 1rem 0;
}

.auth-description {
  text-align: center;
  color: #6b7280;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.auth-description i {
  color: #667eea;
  font-size: 1.2rem;
}

.auth-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.auth-input {
  flex: 1;
}

.auth-button {
  background: #667eea;
  border-color: #667eea;
  transition: all 0.3s ease;
}

.auth-button:hover {
  transform: translateY(-1px);
  box-shadow: 
    0 5px 15px rgba(102, 126, 234, 0.4),
    0 0 20px rgba(255, 0, 150, 0.2),
    0 0 35px rgba(0, 255, 255, 0.2),
    0 0 50px rgba(255, 255, 0, 0.1);
}

.auth-error {
  color: #ef4444;
  text-align: center;
  font-size: 0.9rem;
  margin-top: 1rem;
}

/* Simple Login View */
.simple-login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.simple-login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-content {
  padding: 2rem;
  text-align: center;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  line-height: 1.5;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.login-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 0 20px rgba(102, 126, 234, 0.4),
    0 0 40px rgba(255, 0, 150, 0.2),
    0 0 60px rgba(0, 255, 255, 0.2),
    0 0 80px rgba(255, 255, 0, 0.1),
    0 0 100px rgba(255, 0, 255, 0.1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .simple-login-view {
    padding: 1rem;
  }
  
  .login-content {
    padding: 1.5rem;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .auth-form {
    flex-direction: column;
  }
  
  .container {
    padding: 1rem;
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style> 