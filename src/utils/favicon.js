/**
 * Dynamically set the favicon from environment variable
 */
export function setFavicon() {
  const faviconUrl = import.meta.env.VITE_FAVICON_URL || '/vite.svg'
  
  // Find existing favicon link or create new one
  let faviconLink = document.querySelector('link[rel="icon"]')
  
  if (!faviconLink) {
    faviconLink = document.createElement('link')
    faviconLink.rel = 'icon'
    document.head.appendChild(faviconLink)
  }
  
  // Set the favicon URL
  faviconLink.href = faviconUrl
  
  // Also set type if it's an SVG
  if (faviconUrl.includes('.svg')) {
    faviconLink.type = 'image/svg+xml'
  } else if (faviconUrl.includes('.png')) {
    faviconLink.type = 'image/png'
  } else if (faviconUrl.includes('.ico')) {
    faviconLink.type = 'image/x-icon'
  }
} 