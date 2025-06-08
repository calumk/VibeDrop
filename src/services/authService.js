const SIMPLE_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD
const SIMPLE_AUTH_STRING = import.meta.env.VITE_SIMPLE_AUTH_STRING
const AUTH_KEY = 'fileTransfer_authenticated'
const AUTH_EXPIRY_KEY = 'fileTransfer_auth_expiry'

export class AuthService {
  // Simple login with the hardcoded password
  static login(password) {
    if (password === SIMPLE_PASSWORD) {
      // Set authentication for 1 hour
      const expiryTime = Date.now() + (60 * 60 * 1000) // 1 hour
      localStorage.setItem(AUTH_KEY, 'true')
      localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString())
      return true
    }
    return false
  }

  // Login via URL parameter authentication
  static loginViaUrlAuth(authString) {
    if (authString === SIMPLE_AUTH_STRING) {
      // Set authentication for 1 hour
      const expiryTime = Date.now() + (60 * 60 * 1000) // 1 hour
      localStorage.setItem(AUTH_KEY, 'true')
      localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString())
      return true
    }
    return false
  }

  // Check for URL parameter authentication and auto-login if valid
  static checkUrlAuth() {
    const urlParams = new URLSearchParams(window.location.search)
    const linkAuth = urlParams.get('linkAuth')
    
    if (linkAuth && this.loginViaUrlAuth(linkAuth)) {
      // Clean the URL to remove the auth parameter
      const url = new URL(window.location)
      url.searchParams.delete('linkAuth')
      window.history.replaceState({}, document.title, url.toString())
      return true
    }
    return false
  }

  // Check if user is currently authenticated
  static isAuthenticated() {
    const isAuth = localStorage.getItem(AUTH_KEY)
    const expiryTime = localStorage.getItem(AUTH_EXPIRY_KEY)
    
    if (!isAuth || !expiryTime) {
      return false
    }
    
    if (Date.now() > parseInt(expiryTime)) {
      // Authentication expired
      this.logout()
      return false
    }
    
    return true
  }

  // Logout and clear authentication
  static logout() {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(AUTH_EXPIRY_KEY)
  }

  // Extend authentication session
  static extendSession() {
    if (this.isAuthenticated()) {
      const expiryTime = Date.now() + (60 * 60 * 1000) // Extend by 1 hour
      localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString())
    }
  }

  // Get remaining session time in minutes
  static getSessionTimeRemaining() {
    const expiryTime = localStorage.getItem(AUTH_EXPIRY_KEY)
    if (!expiryTime) return 0
    
    const remaining = parseInt(expiryTime) - Date.now()
    return Math.max(0, Math.ceil(remaining / (60 * 1000))) // Return minutes
  }
} 