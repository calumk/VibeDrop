<template>
  <div id="app">
    <Toast />
    <router-view />
    <div v-if="!hasDonated" class="footer">
      Made with ❤️ & ☕ in the 🇬🇧 by <a href="https://github.com/calumk" target="_blank">@calumk</a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    hasDonated() {
      return import.meta.env.VITE_I_HAVE_DONATED_TO_CALUMK === 'true'
    }
  }
}
</script>

<style>
/* Global styles */
:root {
  --button-height: 2rem;
  --button-padding: 1rem;
  --button-font-size: 1rem;
  --button-icon-size: 1rem;
}

/* Base button styles */
.p-button {
  height: var(--button-height) !important;
  padding: var(--button-padding) !important;
  font-size: var(--button-font-size) !important;
}

.p-button .p-button-icon {
  font-size: var(--button-icon-size) !important;
}

/* Small button styles */
.p-button.p-button-sm {
  height: 2rem !important;
  padding: 0.5rem !important;
  font-size: 0.875rem !important;
}

.p-button.p-button-sm .p-button-icon {
  font-size: 0.875rem !important;
}

.footer {
  text-align: center;
  color: white;
  padding: 1rem;
}

.footer a {
  color: white;
  text-decoration: none;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  width: 100%;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.magical-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 