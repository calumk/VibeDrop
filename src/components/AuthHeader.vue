<template>
  <div class="auth-header" v-if="isAuthenticated">
    <div class="auth-info">
      <i class="pi pi-check-circle"></i>
      <span>{{ label }}</span>
      <small>({{ sessionTime }} min remaining)</small>
    </div>
    <div class="auth-buttons">
      <Button 
      @click="goToNewUpload"
      label="New Upload"
      icon="pi pi-upload"
      severity="secondary"
      size="small"
      class="logout-btn"
    />
      
    <Button 
      @click="goToAdmin"
      label="Admin"
      icon="pi pi-cog"
      severity="secondary"
      size="small"
      class="logout-btn"
    />
    <Button 
      @click="logout"
      label="Logout"
      icon="pi pi-sign-out"
      severity="secondary"
      size="small"
      class="logout-btn"
    />
    
    </div>
    
  </div>
</template>

<script>
import { AuthService } from '../services/authService'

export default {
  name: 'AuthHeader',
  props: {
    label: {
      type: String,
      default: 'Authenticated'
    },
    redirectOnLogout: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      sessionTime: 0
    }
  },
  computed: {
    isAuthenticated() {
      return AuthService.isAuthenticated()
    }
  },
  mounted() {
    this.updateSessionTime()
    
    // Update session time every minute
    this.sessionInterval = setInterval(() => {
      this.updateSessionTime()
    }, 60000)
  },
  beforeUnmount() {
    if (this.sessionInterval) {
      clearInterval(this.sessionInterval)
    }
  },
  methods: {
    updateSessionTime() {
      this.sessionTime = AuthService.getSessionTimeRemaining()
      if (this.sessionTime <= 0 && this.redirectOnLogout) {
        this.logout()
      } else if (this.sessionTime <= 0) {
        // Just clear auth without redirect on public pages
        AuthService.logout()
      }
    },

    logout() {
      AuthService.logout()
      if (this.redirectOnLogout) {
        this.$router.push('/')
      }
    },

    goToAdmin() {
      if (this.isAuthenticated) {
        this.$router.push('/admin')
      }
    },

    goToNewUpload() {
      if (this.isAuthenticated) {
        this.$router.push('/upload')
      }
    }
  }
}
</script>

<style scoped>
.auth-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.auth-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  font-weight: 500;
}

.auth-info i {
  color: #10b981;
}

.auth-info small {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
}

.logout-btn {
  transition: all 0.3s ease;
  margin-right: 10px;
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 0 20px rgba(59, 130, 246, 0.15),
    0 0 40px rgba(219, 39, 119, 0.1),
    0 0 60px rgba(6, 182, 212, 0.05),
    0 0 80px rgba(251, 191, 36, 0.03),
    0 0 100px rgba(168, 85, 247, 0.02);
}

/* Responsive styles */
@media (max-width: 768px) {
  .auth-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .auth-info {
    flex-direction: column;
    text-align: center;
    gap: 0.25rem;
  }
}
</style> 