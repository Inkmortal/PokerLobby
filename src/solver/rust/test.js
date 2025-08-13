// Test the native solver module
const { NativeSolver } = require('./poker-solver.node');

console.log('Testing Native Solver Module...\n');

try {
    // Create a solver instance
    const solver = new NativeSolver();
    console.log('✓ Created solver instance');
    
    // Initialize a simple game
    const config = {
        startingPot: 200,
        effectiveStack: 900,
        oopRange: "QQ+,AKs",  // Simple tight range
        ipRange: "JJ+,AKo+",   // Simple tight range
        flop: "Td9d6h",
        betSizes: "60%,100%,a"
    };
    
    solver.initGame(config);
    console.log('✓ Initialized game with config:', config);
    
    // Get available actions
    const actions = solver.getActions();
    console.log('✓ Available actions:', actions);
    
    // Run a few solver iterations
    console.log('\nRunning solver...');
    const exploitability = solver.solve(100, 0.5);
    console.log(`✓ Solved 100 iterations, exploitability: ${exploitability}`);
    
    // Get strategy at root
    const strategy = solver.getStrategy();
    console.log('✓ Strategy at root:', strategy.slice(0, 5), '...');
    
    console.log('\n✅ All tests passed! Native solver module is working.');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
}