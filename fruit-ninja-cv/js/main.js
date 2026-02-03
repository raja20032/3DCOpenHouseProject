/**
 * Main Entry Point for Fruit Ninja CV
 * Initializes the game loop and coordinates all systems
 */

// Canvas and context
let canvas, ctx;
let lastTime = 0;
let animationFrameId;

// Camera visibility toggle
let isCameraVisible = false;

/**
 * Initialize the game
 */
async function initGame() {
    console.log('Initializing Fruit Ninja CV...');

    // Get canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize game state
    game.init();
    game.setState(GAME_STATES.LOADING);

    // Update loading text
    updateLoadingText('Requesting camera access...');

    // Initialize hand tracking
    const trackingSuccess = await handTracker.init(canvas.width, canvas.height);

    if (!trackingSuccess) {
        updateLoadingText('Camera access denied. Using mouse/touch fallback.');
        await delay(1500);
    }

    // Always setup mouse/touch fallback (works alongside hand tracking)
    setupMouseFallback();

    // Set up hand tracking callbacks
    handTracker.onTrackingUpdate = (x, y) => {
        fingerIndicator.setPosition(x, y);
        bladeTrail.addPoint(x, y);
    };

    handTracker.onTrackingLost = () => {
        fingerIndicator.hide();
    };

    // Initialize audio
    await audioManager.init();

    // Setup UI event listeners
    setupEventListeners();

    // Show menu
    game.setState(GAME_STATES.MENU);

    // Start game loop
    requestAnimationFrame(gameLoop);

    console.log('Game initialized!');
}

/**
 * Resize canvas to window size
 */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (handTracker.isInitialized) {
        handTracker.updateCanvasSize(canvas.width, canvas.height);
    }
}

/**
 * Main game loop
 */
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update systems
    update(deltaTime);

    // Render everything
    render();

    // Continue loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Update all game systems
 */
function update(deltaTime) {
    // Update game state
    game.update(deltaTime);

    // Update blade trail
    bladeTrail.update();

    // Update finger indicator
    fingerIndicator.update();

    // Update particles
    particleSystem.update();

    if (game.isPlaying()) {
        // Update fruits
        fruitManager.update(deltaTime, canvas.width, canvas.height, true);

        // Check for blade-fruit collisions
        checkCollisions();

        // Check for missed fruits
        const missed = fruitManager.getMissedFruits();
        missed.forEach(() => {
            game.missFruit();
        });

        // Remove off-screen fruits
        fruitManager.removeOffscreenFruits();
    }
}

/**
 * Check collisions between blade and fruits
 */
function checkCollisions() {
    if (!bladeTrail.isSlicing()) return;

    const activeFruits = fruitManager.getActiveFruits();

    activeFruits.forEach(fruit => {
        if (bladeTrail.checkCircleIntersection(fruit.x, fruit.y, fruit.radius)) {
            if (fruit.type.isBomb) {
                // Bomb hit - game over
                fruit.slice();
                game.sliceBomb(fruit.x, fruit.y);
            } else {
                // Fruit sliced
                fruit.slice(bladeTrail.velocity ? Math.atan2(bladeTrail.velocity.y, bladeTrail.velocity.x) : 0);
                game.sliceFruit(fruit, fruit.x, fruit.y);
            }
        }
    });
}

/**
 * Render all game elements
 */
function render() {
    // Draw particles (behind fruits)
    particleSystem.draw(ctx);

    // Draw fruits
    fruitManager.draw(ctx);

    // Draw blade trail
    bladeTrail.draw(ctx);

    // Draw finger indicator
    fingerIndicator.draw(ctx);

    // Draw score popups
    game.drawScorePopups(ctx);
}

/**
 * Setup mouse/touch fallback for when camera isn't available
 */
function setupMouseFallback() {
    canvas.addEventListener('mousemove', (e) => {
        fingerIndicator.setPosition(e.clientX, e.clientY);
        bladeTrail.addPoint(e.clientX, e.clientY);
    });

    canvas.addEventListener('mouseleave', () => {
        fingerIndicator.hide();
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        fingerIndicator.setPosition(touch.clientX, touch.clientY);
        bladeTrail.addPoint(touch.clientX, touch.clientY);
    });

    canvas.addEventListener('touchend', () => {
        fingerIndicator.hide();
        bladeTrail.clear();
    });
}

/**
 * Setup UI event listeners
 */
function setupEventListeners() {
    // Start button
    document.getElementById('start-btn').addEventListener('click', () => {
        audioManager.init(); // Ensure audio is initialized on user interaction
        startGame();
    });

    // Restart button
    document.getElementById('restart-btn').addEventListener('click', () => {
        startGame();
    });

    // Camera toggle
    document.getElementById('camera-toggle').addEventListener('click', () => {
        toggleCameraPreview();
    });

    // Sound toggle
    document.getElementById('sound-toggle').addEventListener('click', () => {
        const isMuted = audioManager.toggleMute();
        const btn = document.getElementById('sound-toggle');
        btn.textContent = isMuted ? '🔇' : '🔊';
        btn.classList.toggle('muted', isMuted);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            if (game.state === GAME_STATES.MENU) {
                startGame();
            } else if (game.state === GAME_STATES.GAME_OVER) {
                startGame();
            }
        }
        if (e.key === 'c' || e.key === 'C') {
            toggleCameraPreview();
        }
        if (e.key === 'm' || e.key === 'M') {
            document.getElementById('sound-toggle').click();
        }
    });
}

/**
 * Start/restart the game
 */
function startGame() {
    bladeTrail.clear();
    particleSystem.clear();
    fruitManager.reset();
    game.start();
}

/**
 * Toggle camera preview visibility
 */
function toggleCameraPreview() {
    isCameraVisible = !isCameraVisible;
    const preview = document.getElementById('cameraPreview');
    preview.classList.toggle('visible', isCameraVisible);
}

/**
 * Update loading text
 */
function updateLoadingText(text) {
    const loadingText = document.getElementById('loading-text');
    if (loadingText) {
        loadingText.textContent = text;
    }
}

/**
 * Utility: delay function
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
