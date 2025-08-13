/**
 * Unified API Layer
 * This API works identically for:
 * - Local (Electron): Direct WASM calls
 * - Local (Web Dev): WASM in browser
 * - Cloud (Production): API calls to backend
 */

import { SolverConfig, Solution, Range, PlayerProfile } from '../shared/types';
import { ApiAdapter, StorageAdapter } from '../shared/interfaces';

// Local Native implementation for Electron
class LocalNativeAdapter implements ApiAdapter {
  private solver: any; // Native solver instance
  
  async initialize() {
    // For Electron, use native module through IPC
    if (window.electron) {
      // Native solver is loaded in main process
      this.solver = {
        solvePostflop: (config: SolverConfig) => 
          window.electron.ipcRenderer.invoke('solver-solve-postflop', config),
        solvePreflop: (config: SolverConfig) => 
          window.electron.ipcRenderer.invoke('solver-solve-preflop', config),
        cancel: () => 
          window.electron.ipcRenderer.invoke('solver-cancel'),
        analyzeHands: (hands: any[]) =>
          window.electron.ipcRenderer.invoke('solver-analyze-hands', hands)
      };
    } else {
      throw new Error('Native solver only available in Electron');
    }
  }
  
  async solvePostflop(config: SolverConfig): Promise<Solution> {
    // Native call through IPC for maximum performance
    return this.solver.solvePostflop(config);
  }
  
  async solvePreflop(config: SolverConfig): Promise<Solution> {
    return this.solver.solvePreflop(config);
  }
  
  async cancelSolve(): Promise<void> {
    return this.solver.cancel();
  }
  
  async saveRange(name: string, range: Range): Promise<void> {
    // Use IndexedDB for browser, filesystem for Electron
    const storage = getStorage();
    return storage.saveRange(name, range);
  }
  
  async loadRange(name: string): Promise<Range> {
    const storage = getStorage();
    return storage.loadRange(name);
  }
  
  async listRanges(): Promise<string[]> {
    const storage = getStorage();
    return storage.listRanges();
  }
  
  // ... implement other methods
  async saveSolution(id: string, solution: Solution): Promise<void> {
    const storage = getStorage();
    return storage.saveSolution(id, solution);
  }
  
  async loadSolution(id: string): Promise<Solution> {
    const storage = getStorage();
    return storage.loadSolution(id);
  }
  
  async listSolutions(): Promise<string[]> {
    const storage = getStorage();
    return storage.listSolutions();
  }
  
  async saveProfile(profile: PlayerProfile): Promise<void> {
    const storage = getStorage();
    return storage.saveProfile(profile);
  }
  
  async loadProfile(id: string): Promise<PlayerProfile> {
    const storage = getStorage();
    return storage.loadProfile(id);
  }
  
  async listProfiles(): Promise<PlayerProfile[]> {
    const storage = getStorage();
    return storage.listProfiles();
  }
  
  async importHandHistory(data: string): Promise<void> {
    // Parse locally
    const hands = parseHandHistory(data);
    const storage = getStorage();
    return storage.saveHands(hands);
  }
  
  async analyzeHands(handIds: string[]): Promise<any> {
    const storage = getStorage();
    const hands = await storage.loadHands(handIds);
    // Analyze using WASM solver
    return this.solver.analyzeHands(hands);
  }
}

// Cloud API implementation (Future)
class CloudApiAdapter implements ApiAdapter {
  private apiUrl: string;
  private token?: string;
  
  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }
  
  async solvePostflop(config: SolverConfig): Promise<Solution> {
    // For complex solves, use server
    // For simple/cached, would use WASM (not implemented yet)
    if (this.canSolveLocally(config)) {
      // TODO: Implement local WASM solver for web
      throw new Error('Local WASM solving not yet implemented');
    }
    
    // Otherwise, call cloud API
    const response = await fetch(`${this.apiUrl}/solve/postflop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(config)
    });
    return response.json();
  }
  
  private canSolveLocally(_config: SolverConfig): boolean {
    // Check if this is a simple solve that WASM can handle
    // For now, always use cloud API
    return false; // TODO: Implement local solving criteria
  }
  
  // ... implement other methods with API calls
  async solvePreflop(config: SolverConfig): Promise<Solution> {
    // Preflop likely needs server for 6-max
    const response = await fetch(`${this.apiUrl}/solve/preflop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(config)
    });
    return response.json();
  }
  
  async cancelSolve(): Promise<void> {
    await fetch(`${this.apiUrl}/solve/cancel`, { method: 'POST' });
  }
  
  // Storage operations use cloud database
  async saveRange(name: string, range: Range): Promise<void> {
    await fetch(`${this.apiUrl}/ranges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, range })
    });
  }
  
  async loadRange(name: string): Promise<Range> {
    const response = await fetch(`${this.apiUrl}/ranges/${name}`);
    return response.json();
  }
  
  async listRanges(): Promise<string[]> {
    const response = await fetch(`${this.apiUrl}/ranges`);
    return response.json();
  }
  
  // ... other cloud implementations
  async saveSolution(id: string, solution: Solution): Promise<void> {
    await fetch(`${this.apiUrl}/solutions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(solution)
    });
  }
  
  async loadSolution(id: string): Promise<Solution> {
    const response = await fetch(`${this.apiUrl}/solutions/${id}`);
    return response.json();
  }
  
  async listSolutions(): Promise<string[]> {
    const response = await fetch(`${this.apiUrl}/solutions`);
    return response.json();
  }
  
  async saveProfile(profile: PlayerProfile): Promise<void> {
    await fetch(`${this.apiUrl}/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
  }
  
  async loadProfile(id: string): Promise<PlayerProfile> {
    const response = await fetch(`${this.apiUrl}/profiles/${id}`);
    return response.json();
  }
  
  async listProfiles(): Promise<PlayerProfile[]> {
    const response = await fetch(`${this.apiUrl}/profiles`);
    return response.json();
  }
  
  async importHandHistory(data: string): Promise<void> {
    await fetch(`${this.apiUrl}/hands/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: data
    });
  }
  
  async analyzeHands(handIds: string[]): Promise<any> {
    const response = await fetch(`${this.apiUrl}/hands/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handIds })
    });
    return response.json();
  }
}

// Storage abstraction
function getStorage() {
  if (typeof window !== 'undefined' && window.electron) {
    // Electron: Use filesystem
    return new ElectronStorage();
  } else {
    // Browser: Use IndexedDB
    return new IndexedDBStorage();
  }
}

// Helper functions
function parseHandHistory(_data: string): any[] {
  // Implement hand history parsing
  return [];
}

// API Factory - returns appropriate adapter
class Api {
  private static instance: ApiAdapter;
  
  static async initialize(): Promise<ApiAdapter> {
    if (this.instance) return this.instance;
    
    // Determine environment
    const isElectron = typeof window !== 'undefined' && window.electron;
    const isCloud = import.meta.env?.VITE_API_URL;
    
    if (isCloud) {
      // Cloud deployment
      this.instance = new CloudApiAdapter(import.meta.env.VITE_API_URL!);
    } else if (isElectron) {
      // Electron: Use native solver for max performance
      const adapter = new LocalNativeAdapter();
      await adapter.initialize();
      this.instance = adapter;
    } else {
      // Web dev: Would use WASM (not implemented yet)
      throw new Error('Web-only mode not yet supported. Use Electron for development.');
    }
    
    return this.instance;
  }
  
  static get(): ApiAdapter {
    if (!this.instance) {
      throw new Error('API not initialized. Call Api.initialize() first.');
    }
    return this.instance;
  }
}

// Storage implementations
class ElectronStorage implements StorageAdapter {
  async saveRange(name: string, range: Range): Promise<void> {
    return window.electron.ipcRenderer.invoke('save-range', name, range);
  }
  
  async loadRange(name: string): Promise<Range> {
    return window.electron.ipcRenderer.invoke('load-range', name);
  }
  
  async listRanges(): Promise<string[]> {
    return window.electron.ipcRenderer.invoke('list-ranges');
  }
  
  async saveSolution(id: string, solution: Solution): Promise<void> {
    return window.electron.ipcRenderer.invoke('save-solution', id, solution);
  }
  
  async loadSolution(id: string): Promise<Solution> {
    return window.electron.ipcRenderer.invoke('load-solution', id);
  }
  
  async listSolutions(): Promise<string[]> {
    return window.electron.ipcRenderer.invoke('list-solutions');
  }
  
  async saveProfile(profile: PlayerProfile): Promise<void> {
    return window.electron.ipcRenderer.invoke('save-profile', profile);
  }
  
  async loadProfile(id: string): Promise<PlayerProfile> {
    return window.electron.ipcRenderer.invoke('load-profile', id);
  }
  
  async listProfiles(): Promise<PlayerProfile[]> {
    return window.electron.ipcRenderer.invoke('list-profiles');
  }
  
  async saveHands(hands: any[]): Promise<void> {
    return window.electron.ipcRenderer.invoke('save-hands', hands);
  }
  
  async loadHands(handIds: string[]): Promise<any[]> {
    return window.electron.ipcRenderer.invoke('load-hands', handIds);
  }
}

class IndexedDBStorage implements StorageAdapter {
  private db?: IDBDatabase;
  
  async init() {
    if (this.db) return;
    
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('PokerLobby', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('ranges')) {
          db.createObjectStore('ranges', { keyPath: 'name' });
        }
        if (!db.objectStoreNames.contains('solutions')) {
          db.createObjectStore('solutions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('hands')) {
          db.createObjectStore('hands', { keyPath: 'id' });
        }
      };
    });
  }
  
  async saveRange(name: string, range: Range): Promise<void> {
    await this.init();
    const tx = this.db!.transaction(['ranges'], 'readwrite');
    const store = tx.objectStore('ranges');
    store.put({ ...range, name }); // name will override any name in range
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  
  async loadRange(name: string): Promise<Range> {
    await this.init();
    const tx = this.db!.transaction(['ranges'], 'readonly');
    const store = tx.objectStore('ranges');
    const request = store.get(name);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async listRanges(): Promise<string[]> {
    await this.init();
    const tx = this.db!.transaction(['ranges'], 'readonly');
    const store = tx.objectStore('ranges');
    const request = store.getAllKeys();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }
  
  // ... implement other methods similarly
  async saveSolution(id: string, solution: Solution): Promise<void> {
    await this.init();
    const tx = this.db!.transaction(['solutions'], 'readwrite');
    const store = tx.objectStore('solutions');
    store.put({ ...solution, id }); // id will override any id in solution
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  
  async loadSolution(id: string): Promise<Solution> {
    await this.init();
    const tx = this.db!.transaction(['solutions'], 'readonly');
    const store = tx.objectStore('solutions');
    const request = store.get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async listSolutions(): Promise<string[]> {
    await this.init();
    const tx = this.db!.transaction(['solutions'], 'readonly');
    const store = tx.objectStore('solutions');
    const request = store.getAllKeys();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }
  
  async saveProfile(profile: PlayerProfile): Promise<void> {
    await this.init();
    const tx = this.db!.transaction(['profiles'], 'readwrite');
    const store = tx.objectStore('profiles');
    store.put(profile);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  
  async loadProfile(id: string): Promise<PlayerProfile> {
    await this.init();
    const tx = this.db!.transaction(['profiles'], 'readonly');
    const store = tx.objectStore('profiles');
    const request = store.get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async listProfiles(): Promise<PlayerProfile[]> {
    await this.init();
    const tx = this.db!.transaction(['profiles'], 'readonly');
    const store = tx.objectStore('profiles');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async saveHands(hands: any[]): Promise<void> {
    await this.init();
    const tx = this.db!.transaction(['hands'], 'readwrite');
    const store = tx.objectStore('hands');
    hands.forEach(hand => store.put(hand));
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  
  async loadHands(handIds: string[]): Promise<any[]> {
    await this.init();
    const tx = this.db!.transaction(['hands'], 'readonly');
    const store = tx.objectStore('hands');
    const hands: any[] = [];
    
    return new Promise((resolve, reject) => {
      handIds.forEach(id => {
        const request = store.get(id);
        request.onsuccess = () => hands.push(request.result);
      });
      tx.oncomplete = () => resolve(hands);
      tx.onerror = () => reject(tx.error);
    });
  }
}

// Export singleton API
export default Api;
export type { ApiAdapter };

// Export factory function for creating API instance
export async function createApi(): Promise<ApiAdapter> {
  return Api.initialize();
}