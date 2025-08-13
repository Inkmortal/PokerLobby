import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import Api from '@api/index';
import '../index.css';

// Initialize API before rendering
Api.initialize().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch(error => {
  console.error('Failed to initialize API:', error);
  // Show error UI
  document.getElementById('root')!.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #1e1e2e; color: #cdd6f4; font-family: system-ui;">
      <div style="text-align: center;">
        <h1>Failed to initialize</h1>
        <p>${error.message}</p>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #89b4fa; color: #1e1e2e; border: none; border-radius: 8px; cursor: pointer;">
          Retry
        </button>
      </div>
    </div>
  `;
});