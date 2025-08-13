const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => {
      // Whitelist channels
      const validChannels = [
        'save-range',
        'load-range',
        'list-ranges',
        'save-solution',
        'load-solution',
        'list-solutions',
        'save-profile',
        'load-profile',
        'list-profiles',
        'save-hands',
        'load-hands',
        'show-save-dialog',
        'show-open-dialog',
        'get-app-version',
        'get-platform',
        // Solver channels
        'solver-init-game',
        'solver-solve',
        'solver-solve-step',
        'solver-get-exploitability',
        'solver-get-actions',
        'solver-play-action',
        'solver-back-to-root',
        'solver-get-strategy',
        'solver-get-ev',
        'solver-get-equity',
        'solver-get-memory',
        'solver-save',
        'solver-load',
        'solver-finalize',
        'solver-cleanup',
      ];
      
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      
      throw new Error(`Invalid IPC channel: ${channel}`);
    },
    
    on: (channel, func) => {
      const validChannels = ['solver-progress', 'solver-complete', 'solver-error'];
      
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    
    once: (channel, func) => {
      const validChannels = ['solver-progress', 'solver-complete', 'solver-error'];
      
      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
    
    removeListener: (channel, func) => {
      ipcRenderer.removeListener(channel, func);
    },
    
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },
  
  // Platform info
  platform: process.platform,
  nodeVersion: process.versions.node,
  chromeVersion: process.versions.chrome,
  electronVersion: process.versions.electron,
});