import { ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Load the native solver module
const { NativeSolver } = require(path.join(__dirname, '..', 'poker-solver.node'));

// Store solver instances per window
const solverInstances = new Map();

// Helper to get or create solver instance for a window
function getSolver(webContentsId) {
    if (!solverInstances.has(webContentsId)) {
        solverInstances.set(webContentsId, new NativeSolver());
    }
    return solverInstances.get(webContentsId);
}

// Clean up solver when window closes
function cleanupSolver(webContentsId) {
    if (solverInstances.has(webContentsId)) {
        solverInstances.delete(webContentsId);
    }
}

// Register IPC handlers
function registerSolverHandlers() {
    // Initialize a new game
    ipcMain.handle('solver-init-game', async (event, config) => {
        try {
            const solver = getSolver(event.sender.id);
            solver.initGame(config);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Solve for a number of iterations
    ipcMain.handle('solver-solve', async (event, { iterations, targetExploitability }) => {
        try {
            const solver = getSolver(event.sender.id);
            const exploitability = solver.solve(iterations, targetExploitability);
            return { success: true, exploitability };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Run a single solver step
    ipcMain.handle('solver-solve-step', async (event, iteration) => {
        try {
            const solver = getSolver(event.sender.id);
            solver.solveStep(iteration);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Get current exploitability
    ipcMain.handle('solver-get-exploitability', async (event) => {
        try {
            const solver = getSolver(event.sender.id);
            const exploitability = solver.getExploitability();
            return { success: true, exploitability };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Get available actions
    ipcMain.handle('solver-get-actions', async (event) => {
        try {
            const solver = getSolver(event.sender.id);
            const actions = solver.getActions();
            return { success: true, actions };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Play an action
    ipcMain.handle('solver-play-action', async (event, actionIndex) => {
        try {
            const solver = getSolver(event.sender.id);
            solver.playAction(actionIndex);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Go back to root
    ipcMain.handle('solver-back-to-root', async (event) => {
        try {
            const solver = getSolver(event.sender.id);
            solver.backToRoot();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Get strategy at current node
    ipcMain.handle('solver-get-strategy', async (event) => {
        try {
            const solver = getSolver(event.sender.id);
            const strategy = solver.getStrategy();
            return { success: true, strategy };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Get expected values
    ipcMain.handle('solver-get-ev', async (event, player) => {
        try {
            const solver = getSolver(event.sender.id);
            const ev = solver.getEv(player);
            return { success: true, ev };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Get equity
    ipcMain.handle('solver-get-equity', async (event, player) => {
        try {
            const solver = getSolver(event.sender.id);
            const equity = solver.getEquity(player);
            return { success: true, equity };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Get memory usage
    ipcMain.handle('solver-get-memory', async (event) => {
        try {
            const solver = getSolver(event.sender.id);
            const memory = solver.getMemoryUsage();
            return { success: true, memory };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Save game to file
    ipcMain.handle('solver-save', async (event, filename) => {
        try {
            const solver = getSolver(event.sender.id);
            solver.saveToFile(filename);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Load game from file
    ipcMain.handle('solver-load', async (event, filename) => {
        try {
            const solver = getSolver(event.sender.id);
            solver.loadFromFile(filename);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Finalize solution
    ipcMain.handle('solver-finalize', async (event) => {
        try {
            const solver = getSolver(event.sender.id);
            solver.finalize();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Clean up solver instance
    ipcMain.handle('solver-cleanup', async (event) => {
        cleanupSolver(event.sender.id);
        return { success: true };
    });
}

export {
    registerSolverHandlers,
    cleanupSolver
};