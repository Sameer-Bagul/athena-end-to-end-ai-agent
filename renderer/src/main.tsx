import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './context/AppContext'

console.log('[Main] Initializing Athena App...');

// Global error handler
window.addEventListener('error', (event) => {
  console.error('[Global Error Handler] Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global Error Handler] Unhandled promise rejection:', event.reason);
});

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('[Main] Root element found, creating React root...');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppProvider>
        <App />
      </AppProvider>
    </React.StrictMode>,
  );
  
  console.log('[Main] React app mounted successfully!');
} catch (error) {
  console.error('[Main] Fatal error during initialization:', error);
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0a1e; color: white; font-family: sans-serif; padding: 20px; text-align: center;">
      <div>
        <h1 style="color: #ff4444; margin-bottom: 20px;">⚠️ App Failed to Start</h1>
        <p style="color: #aaa; max-width: 600px; margin-bottom: 10px;">${error instanceof Error ? error.message : 'Unknown error'}</p>
        <pre style="color: #666; font-size: 10px; max-width: 800px; max-height: 300px; overflow: auto; text-align: left; margin: 20px auto; padding: 10px; background: #1a1a2e; border-radius: 5px;">${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}</pre>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #444; color: white; border: none; border-radius: 5px; cursor: pointer;">Reload App</button>
      </div>
    </div>
  `;
}
