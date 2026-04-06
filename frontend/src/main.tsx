import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// import { registerServiceWorker } from './utils/pwa'

// Register service worker for PWA support
// Temporarily disabled for debugging
// registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
