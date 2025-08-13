// Node.js bindings for the postflop-solver
use napi::bindgen_prelude::*;
use napi_derive::napi;

// Import all the postflop-solver modules
use crate::*;

/// Configuration for creating a game
#[napi(object)]
pub struct GameConfig {
    pub starting_pot: i32,
    pub effective_stack: i32,
    pub oop_range: String,
    pub ip_range: String,
    pub flop: String,
    pub turn: Option<String>,
    pub river: Option<String>,
    pub bet_sizes: Option<String>,
}

/// Native solver exposed to Node.js
#[napi]
pub struct NativeSolver {
    game: Option<PostFlopGame>,
}

#[napi]
impl NativeSolver {
    /// Creates a new solver instance
    #[napi(constructor)]
    pub fn new() -> Self {
        Self { game: None }
    }

    /// Initializes the game with given configuration
    #[napi]
    pub fn init_game(&mut self, config: GameConfig) -> Result<()> {
        // Parse ranges
        let oop_range = config.oop_range.parse::<Range>()
            .map_err(|e| Error::from_reason(e))?;
        let ip_range = config.ip_range.parse::<Range>()
            .map_err(|e| Error::from_reason(e))?;
        
        // Parse flop
        let flop = flop_from_str(&config.flop)
            .map_err(|e| Error::from_reason(e))?;
        
        // Parse turn if provided
        let turn = if let Some(turn_str) = config.turn {
            card_from_str(&turn_str)
                .map_err(|e| Error::from_reason(e))?
        } else {
            NOT_DEALT
        };
        
        // Parse river if provided
        let river = if let Some(river_str) = config.river {
            card_from_str(&river_str)
                .map_err(|e| Error::from_reason(e))?
        } else {
            NOT_DEALT
        };
        
        // Create card configuration
        let card_config = CardConfig {
            range: [oop_range, ip_range],
            flop,
            turn,
            river,
        };
        
        // Parse bet sizes (default if not provided)
        let bet_sizes = if let Some(sizes_str) = config.bet_sizes {
            BetSizeOptions::try_from((sizes_str.as_str(), "2.5x"))
                .map_err(|e| Error::from_reason(format!("Invalid bet sizes: {}", e)))?
        } else {
            BetSizeOptions::try_from(("60%,100%,a", "2.5x"))
                .map_err(|e| Error::from_reason(format!("Invalid default bet sizes: {}", e)))?
        };
        
        // Determine board state
        let initial_state = if river != NOT_DEALT {
            BoardState::River
        } else if turn != NOT_DEALT {
            BoardState::Turn
        } else {
            BoardState::Flop
        };
        
        // Create tree configuration
        let tree_config = TreeConfig {
            initial_state,
            starting_pot: config.starting_pot,
            effective_stack: config.effective_stack,
            rake_rate: 0.0,
            rake_cap: 0.0,
            flop_bet_sizes: [bet_sizes.clone(), bet_sizes.clone()],
            turn_bet_sizes: [bet_sizes.clone(), bet_sizes.clone()],
            river_bet_sizes: [bet_sizes.clone(), bet_sizes.clone()],
            turn_donk_sizes: None,
            river_donk_sizes: None,
            add_allin_threshold: 1.5,
            force_allin_threshold: 0.15,
            merging_threshold: 0.1,
        };
        
        // Build action tree
        let action_tree = ActionTree::new(tree_config)
            .map_err(|e| Error::from_reason(format!("Failed to create action tree: {}", e)))?;
        
        // Create the game
        let mut game = PostFlopGame::with_config(card_config, action_tree)
            .map_err(|e| Error::from_reason(format!("Failed to create game: {}", e)))?;
        
        // Allocate memory (without compression for now)
        game.allocate_memory(false);
        
        self.game = Some(game);
        Ok(())
    }
    
    /// Solves the game for a specified number of iterations
    #[napi]
    pub fn solve(&mut self, max_iterations: u32, target_exploitability: f64) -> Result<f64> {
        let game = self.game.as_mut()
            .ok_or_else(|| Error::from_reason("Game not initialized"))?;
        
        let exploitability = solve(
            game, 
            max_iterations, 
            target_exploitability as f32,
            false // Don't print progress in Node.js binding
        );
        
        Ok(exploitability as f64)
    }
    
    /// Runs a single iteration of the solver
    #[napi]
    pub fn solve_step(&mut self, iteration: u32) -> Result<()> {
        let game = self.game.as_ref()
            .ok_or_else(|| Error::from_reason("Game not initialized"))?;
        
        solve_step(game, iteration);
        Ok(())
    }
    
    /// Computes the current exploitability
    #[napi]
    pub fn get_exploitability(&self) -> Result<f64> {
        let game = self.game.as_ref()
            .ok_or_else(|| Error::from_reason("Game not initialized"))?;
        
        Ok(compute_exploitability(game) as f64)
    }
    
    /// Finalizes the solution
    #[napi]
    pub fn finalize(&mut self) -> Result<()> {
        let game = self.game.as_mut()
            .ok_or_else(|| Error::from_reason("Game not initialized"))?;
        
        finalize(game);
        Ok(())
    }
    
    /// Gets available actions at the root
    #[napi]
    pub fn get_actions(&self) -> Result<Vec<String>> {
        let game = self.game.as_ref()
            .ok_or_else(|| Error::from_reason("Game not initialized"))?;
        
        let actions = game.available_actions();
        Ok(actions.iter().map(|a| format!("{:?}", a)).collect())
    }
    
    /// Plays an action
    #[napi]
    pub fn play_action(&mut self, action_index: u32) -> Result<()> {
        let game = self.game.as_mut()
            .ok_or_else(|| Error::from_reason("Game not initialized"))?;
        
        game.play(action_index as usize);
        Ok(())
    }
    
    /// Goes back to the root node
    #[napi]
    pub fn back_to_root(&mut self) -> Result<()> {
        let game = self.game.as_mut()
            .ok_or_else(|| Error::from_reason("Game not initialized"))?;
        
        game.back_to_root();
        Ok(())
    }
    
    /// Gets the strategy at the current node
    #[napi]
    pub fn get_strategy(&self) -> Result<Vec<f64>> {
        let game = self.game.as_ref()
            .ok_or_else(|| Error::from_reason("Game not initialized"))?;
        
        let strategy = game.strategy();
        Ok(strategy.iter().map(|&x| x as f64).collect())
    }
    
    /// Gets expected values for a player
    #[napi]
    pub fn get_ev(&mut self, player: u32) -> Result<Vec<f64>> {
        let game = self.game.as_mut()
            .ok_or_else(|| Error::from_reason("Game not initialized"))?;
        
        game.cache_normalized_weights();
        let ev = game.expected_values(player as usize);
        Ok(ev.iter().map(|&x| x as f64).collect())
    }
    
    /// Gets equity for a player
    #[napi]
    pub fn get_equity(&mut self, player: u32) -> Result<Vec<f64>> {
        let game = self.game.as_mut()
            .ok_or_else(|| Error::from_reason("Game not initialized"))?;
        
        game.cache_normalized_weights();
        let equity = game.equity(player as usize);
        Ok(equity.iter().map(|&x| x as f64).collect())
    }
    
    /// Gets memory usage information
    #[napi]
    pub fn get_memory_usage(&self) -> Result<String> {
        let game = self.game.as_ref()
            .ok_or_else(|| Error::from_reason("Game not initialized"))?;
        
        let (uncompressed, compressed) = game.memory_usage();
        
        Ok(format!(
            "Uncompressed: {:.2} MB, Compressed: {:.2} MB",
            uncompressed as f64 / (1024.0 * 1024.0),
            compressed as f64 / (1024.0 * 1024.0)
        ))
    }
    
    /// Saves the game to a file
    #[napi]
    #[cfg(feature = "bincode")]
    pub fn save_to_file(&self, filename: String) -> Result<()> {
        let game = self.game.as_ref()
            .ok_or_else(|| Error::from_reason("Game not initialized"))?;
        
        game.save_to_file(&filename)
            .map_err(|e| Error::from_reason(format!("Failed to save: {}", e)))?;
        
        Ok(())
    }
    
    /// Loads a game from a file
    #[napi]
    #[cfg(feature = "bincode")]
    pub fn load_from_file(&mut self, filename: String) -> Result<()> {
        let game = PostFlopGame::load_from_file(&filename)
            .map_err(|e| Error::from_reason(format!("Failed to load: {}", e)))?;
        
        self.game = Some(game);
        Ok(())
    }
}