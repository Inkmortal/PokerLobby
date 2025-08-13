// TypeScript declarations for Electron API exposed by preload script

// These channels are used with ipcRenderer.invoke()
type IpcInvokeChannels =
  | 'save-range'
  | 'load-range'
  | 'list-ranges'
  | 'save-solution'
  | 'load-solution'
  | 'list-solutions'
  | 'save-profile'
  | 'load-profile'
  | 'list-profiles'
  | 'save-hands'
  | 'load-hands'
  | 'show-save-dialog'
  | 'show-open-dialog'
  | 'get-app-version'
  | 'get-platform'
  // Solver channels
  | 'solver-solve-postflop'
  | 'solver-solve-preflop'
  | 'solver-cancel'
  | 'solver-analyze-hands';

// These channels are used with ipcRenderer.on() / .once()
type IpcEventChannels = 'solver-progress' | 'solver-complete' | 'solver-error';

export interface IpcRenderer {
  invoke(channel: IpcInvokeChannels, ...args: any[]): Promise<any>;
  on(channel: IpcEventChannels, listener: (...args: any[]) => void): void;
  once(channel: IpcEventChannels, listener: (...args: any[]) => void): void;
  removeListener(channel: string, listener: (...args: any[]) => void): void;
  removeAllListeners(channel: string): void;
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: IpcRenderer;
      platform: NodeJS.Platform;
      isPackaged: boolean;
    };
  }
}

export {};