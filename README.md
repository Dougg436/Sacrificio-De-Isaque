# Eye Slayer

A roguelike bullet-hell game inspired by The Binding of Isaac, featuring procedurally generated dungeons and an absurdly over-engineered AI system that learned to predict player movements with ensemble neural networks.

## Overview

Eye Slayer is a browser-based action roguelike where players navigate through procedurally generated dungeons, fight increasingly difficult enemies, and face off against challenging bosses. What started as a simple game prototype gradually became an experiment in implementing machine learning directly in the browser using vanilla JavaScript.

The game features real-time combat, multiple enemy types with varying behaviors, power-ups, and a dungeon generation system. Perhaps most notably, it includes an ensemble AI system that combines multiple neural network architectures to predict player movement patterns—because why not?

## Why This Project Exists

This project began as a learning exercise to understand game development fundamentals and procedural generation algorithms. As development progressed, it evolved into an exploration of implementing complex AI systems in a constrained environment (vanilla JavaScript, no frameworks, browser-based).

The core motivation was to answer: "Can I build a predictive AI system for player behavior without external libraries, just browser-native JavaScript?" The answer turned out to be "yes," though the result is admittedly more complex than strictly necessary for a simple game.

## Tech Stack

- **Vanilla JavaScript** (ES6 modules)
- **HTML5 Canvas** for rendering
- **Custom Neural Network Implementation** (no ML libraries)
- **Procedural Generation** using seeded random walk algorithms
- **Web Audio API** for sound management

No frameworks. No build tools. Just browser-native technologies.

## Features

### Core Gameplay
- **Procedural Dungeon Generation**: Seeded random walk algorithm generates unique layouts inspired by classic roguelikes
- **Real-time Combat**: Mouse-aim shooting with dynamic enemy AI
- **Multiple Enemy Types**: 
  - Basic enemies (Fly, Charger, Ranger)
  - Mid-tier threats (Phantom, Eyeball)
  - Boss encounters (Eye Lord, Phantom Lord, Supreme Eye)
- **Power-up System**: Collectible upgrades that modify player stats
- **Health System**: Heart-based health with invulnerability frames
- **Progressive Difficulty**: Enemy spawn delay system and escalating challenges

### AI System (The Interesting Part)

The game includes an ensemble AI system that attempts to predict player movement:

- **5 Neural Network Architectures**: Ultra-deep, LSTM-like, convolutional, attention mechanism, and transformer-like networks
- **Temporal Analysis**: Multi-scale, cyclic pattern detection, and Fourier analysis
- **Meta-Learning**: Genetic algorithm for hyperparameter optimization and neural architecture search
- **Long-term Memory System**: Stores up to 50,000 game situations for pattern recognition
- **Bayesian Inference Engine**: Statistical prediction refinement
- **Weighted Ensemble Voting**: Combines predictions from all systems with adaptive confidence weighting

The AI trains in real-time as you play, analyzing movement patterns, input sequences, and behavioral tendencies. While the ensemble approach is deliberately over-engineered for a browser game, it serves as a functional demonstration of implementing multiple ML concepts from scratch.

### Advanced Enemy Behaviors

- **Predictive Shooting**: Enemies use ballistic calculation to lead moving targets
- **Pattern Recognition**: Detects player movement patterns (circling, zigzagging, strafing)
- **Adaptive Difficulty**: Enemy accuracy scales based on detected player patterns
- **Boss Mechanics**: Unique attack patterns including bullet barriers, shard splitting, and paralysis effects

## Architecture

### Game Structure
```
src/
├── main.js              # Game loop, AI orchestration, rendering
├── config.js            # Global constants
├── core/
│   ├── assets.js        # Asset loading (sprites, sounds)
│   ├── input.js         # Keyboard/mouse handling with history tracking
├── entities/
│   ├── player.js        # Player state, movement tracking
│   ├── enemy.js         # Enemy types, behaviors, predictive aiming
│   ├── bullet.js        # Projectile physics
│   ├── powerup.js       # Item effects
│   └── item.js          # Collectible items
├── systems/
│   └── dungeon-gen.js   # Procedural generation using random walk
└── ai/                  # The AI ensemble
    ├── ultra-precision-ensemble.js    # Main AI coordinator
    ├── neural-network-ultra.js        # 5 network architectures
    ├── temporal-analysis.js           # Time-series analysis
    ├── meta-learning.js               # Hyperparameter optimization
    ├── memory-system.js               # Long-term pattern storage
    ├── bayesian-system.js             # Statistical inference
    └── ai-config.js                   # AI hyperparameters
```

### Procedural Generation

Dungeons are generated using a seeded random walk algorithm:
1. Start from center grid position
2. Randomly walk in cardinal directions, creating rooms
3. Ensure connectivity between all rooms
4. Designate special rooms (start, boss, treasure)
5. Add doors based on adjacency

The seeded approach ensures reproducible layouts for testing and debugging.

### AI Prediction Pipeline

1. **Input Collection**: Capture player position, velocity, acceleration, input history
2. **Feature Engineering**: Extract movement patterns, direction changes, behavioral metrics
3. **Ensemble Prediction**: Each neural network generates independent predictions
4. **Temporal Analysis**: Identify cyclic patterns and multi-scale trends
5. **Weighted Voting**: Combine predictions based on historical accuracy
6. **Confidence Filtering**: Only act on high-confidence predictions (default: 95% threshold)
7. **Continuous Training**: Update networks with actual outcomes for online learning

## Getting Started

### Prerequisites
- Modern web browser with ES6 module support (Chrome, Firefox, Safari, Edge)
- Local web server (for ES6 module loading)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Dougg436/Sacrificio-De-Isaque.git
cd Sacrificio-De-Isaque
```

2. Start a local web server:
```bash
# Using Python 3
python -m http.server 8000

# OR using Node.js
npx http-server

# OR using PHP
php -S localhost:8000
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

### Controls
- **WASD** or **Arrow Keys**: Move
- **Mouse**: Aim
- **Left Click**: Shoot
- **Movement**: Navigate through rooms using doors

## Example Usage

The game is self-contained and runs entirely in the browser. Simply open `index.html` through a local server and start playing.

To observe the AI system in action:
1. Open browser developer console (F12)
2. Look for AI prediction logs showing confidence scores
3. Move in patterns (circles, zigzags, straight lines) to see pattern detection
4. AI accuracy improves as it learns your movement style

## Performance / Engineering Highlights

### Custom Neural Network Implementation
- Forward propagation with multiple activation functions (ReLU, sigmoid, tanh)
- Backpropagation with Adam optimizer
- Gradient descent with momentum and learning rate decay
- No external ML libraries—implemented from mathematical fundamentals

### Predictive Aiming Algorithm
- Quadratic equation solving for projectile interception
- Iterative refinement considering target acceleration
- Pattern-based prediction adjustments
- Handles edge cases (targets faster than bullets, zero velocity)

### Real-time Training
- Online learning during gameplay without frame drops
- Training data buffer with circular queue
- Asynchronous prediction to avoid blocking render loop
- Performance optimization through selective AI updates (100ms intervals)

### Memory Efficiency
- Fixed-size circular buffers prevent unbounded growth
- KNN data limited to 10,000 most recent situations
- Long-term memory capped at 50,000 patterns
- Movement history limited to 30 frames per entity

## What I Learned

### Game Development
- Canvas rendering optimization and animation loops
- Entity component systems and game state management
- Collision detection and physics simulation
- Procedural content generation algorithms
- Audio timing and playlist management

### Machine Learning
- Neural network architectures from scratch (feedforward, recurrent, attention)
- Backpropagation and gradient descent optimization
- Ensemble learning and prediction confidence weighting
- Online learning and catastrophic forgetting mitigation
- Time-series analysis and pattern recognition

### Software Engineering
- ES6 module organization and dependency management
- State management in complex systems
- Performance profiling and optimization
- Balancing code complexity with maintainability
- When abstraction helps and when it hurts

### Key Insight
Building an over-engineered AI system for a simple game taught me more about machine learning fundamentals than following tutorials ever could. Sometimes the best way to learn is to solve a problem that doesn't need solving—with tools you don't strictly need.

## Future Improvements

- **Multiplayer**: Network-synchronized co-op gameplay
- **Save System**: Persistent progress and unlockables
- **More Content**: Additional enemy types, bosses, items, and power-ups
- **Room Variety**: Special room types with unique layouts and challenges
- **Meta-progression**: Unlock system that persists between runs
- **AI Visualization**: Real-time graph of prediction accuracy and confidence
- **Performance Mode**: Toggle AI system for lower-end devices
- **Mobile Support**: Touch controls and responsive canvas scaling

---

Built with curiosity, over-engineering, and an irrational love for implementing things from scratch.
