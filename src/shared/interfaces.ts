// Shared interfaces for API and storage adapters
import { SolverConfig, Solution, Range, PlayerProfile } from './types';

// Storage adapter interface - implemented by ElectronStorage and IndexedDBStorage
export interface StorageAdapter {
  saveRange(name: string, range: Range): Promise<void>;
  loadRange(name: string): Promise<Range>;
  listRanges(): Promise<string[]>;
  saveSolution(id: string, solution: Solution): Promise<void>;
  loadSolution(id: string): Promise<Solution>;
  listSolutions(): Promise<string[]>;
  saveProfile(profile: PlayerProfile): Promise<void>;
  loadProfile(id: string): Promise<PlayerProfile>;
  listProfiles(): Promise<PlayerProfile[]>;
  saveHands(hands: any[]): Promise<void>;
  loadHands(handIds: string[]): Promise<any[]>;
}

// API adapter interface - implemented by LocalNativeAdapter and CloudApiAdapter
export interface ApiAdapter {
  solvePostflop(config: SolverConfig): Promise<Solution>;
  solvePreflop(config: SolverConfig): Promise<Solution>;
  cancelSolve(): Promise<void>;
  saveRange(name: string, range: Range): Promise<void>;
  loadRange(name: string): Promise<Range>;
  listRanges(): Promise<string[]>;
  saveSolution(id: string, solution: Solution): Promise<void>;
  loadSolution(id: string): Promise<Solution>;
  listSolutions(): Promise<string[]>;
  saveProfile(profile: PlayerProfile): Promise<void>;
  loadProfile(id: string): Promise<PlayerProfile>;
  listProfiles(): Promise<PlayerProfile[]>;
  importHandHistory(data: string): Promise<void>;
  analyzeHands(handIds: string[]): Promise<any>;
}

// Solver adapter interface for future use
export interface SolverAdapter {
  solve(config: SolverConfig): Promise<Solution>;
  cancel(): Promise<void>;
  getProgress(): number;
}