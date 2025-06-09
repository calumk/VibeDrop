import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Upload from '../views/Upload.vue'
import FileView from '../views/FileView.vue'
import Admin from '../views/Admin.vue'
import { AuthService } from '../services/authService'

// Authentication guard
const requireAuth = (to, from, next) => {
  // First check for URL authentication
  if (AuthService.checkUrlAuth()) {
    AuthService.extendSession()
    next()
    return
  }
  
  // Then check for existing authentication
  if (AuthService.isAuthenticated()) {
    // Extend session when accessing protected routes
    AuthService.extendSession()
    next()
  } else {
    next('/')
  }
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/upload',
    name: 'Upload',
    component: Upload,
    beforeEnter: requireAuth
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    beforeEnter: requireAuth
  },
  {
    path: '/file/:fileId',
    name: 'FileView',
    component: FileView,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router 