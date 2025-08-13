import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { registerSolverHandlers, cleanupSolver } from './solverHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep a global reference of the window object
let mainWindow;

// Enable live reload for Electron
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e2e', // Catppuccin base
    icon: path.join(__dirname, '../public/icons/icon.png'),
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Clean up solver instance for this window
    if (mainWindow && mainWindow.webContents) {
      cleanupSolver(mainWindow.webContents.id);
    }
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  // Register solver IPC handlers
  registerSolverHandlers();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Data storage paths
const userDataPath = app.getPath('userData');
const rangesPath = path.join(userDataPath, 'ranges');
const solutionsPath = path.join(userDataPath, 'solutions');
const profilesPath = path.join(userDataPath, 'profiles');
const handsPath = path.join(userDataPath, 'hands');

// Ensure directories exist
async function ensureDirectories() {
  for (const dir of [rangesPath, solutionsPath, profilesPath, handsPath]) {
    await fs.mkdir(dir, { recursive: true });
  }
}

app.whenReady().then(ensureDirectories);

// IPC Handlers for file operations

// Range operations
ipcMain.handle('save-range', async (event, name, range) => {
  const filePath = path.join(rangesPath, `${name}.json`);
  await fs.writeFile(filePath, JSON.stringify(range, null, 2));
  return { success: true };
});

ipcMain.handle('load-range', async (event, name) => {
  const filePath = path.join(rangesPath, `${name}.json`);
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
});

ipcMain.handle('list-ranges', async () => {
  const files = await fs.readdir(rangesPath);
  return files
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
});

// Solution operations
ipcMain.handle('save-solution', async (event, id, solution) => {
  const filePath = path.join(solutionsPath, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(solution, null, 2));
  return { success: true };
});

ipcMain.handle('load-solution', async (event, id) => {
  const filePath = path.join(solutionsPath, `${id}.json`);
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
});

ipcMain.handle('list-solutions', async () => {
  const files = await fs.readdir(solutionsPath);
  return files
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
});

// Profile operations
ipcMain.handle('save-profile', async (event, profile) => {
  const filePath = path.join(profilesPath, `${profile.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(profile, null, 2));
  return { success: true };
});

ipcMain.handle('load-profile', async (event, id) => {
  const filePath = path.join(profilesPath, `${id}.json`);
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
});

ipcMain.handle('list-profiles', async () => {
  const files = await fs.readdir(profilesPath);
  const profiles = [];
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(profilesPath, file);
      const data = await fs.readFile(filePath, 'utf-8');
      profiles.push(JSON.parse(data));
    }
  }
  
  return profiles;
});

// Hand history operations
ipcMain.handle('save-hands', async (event, hands) => {
  for (const hand of hands) {
    const filePath = path.join(handsPath, `${hand.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(hand, null, 2));
  }
  return { success: true };
});

ipcMain.handle('load-hands', async (event, handIds) => {
  const hands = [];
  
  for (const id of handIds) {
    const filePath = path.join(handsPath, `${id}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      hands.push(JSON.parse(data));
    } catch (err) {
      console.error(`Failed to load hand ${id}:`, err);
    }
  }
  
  return hands;
});

// Dialog operations
ipcMain.handle('show-save-dialog', async (event, options) => {
  const { dialog } = require('electron');
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// App info
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});