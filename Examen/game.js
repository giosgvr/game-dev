// ============= Asset Loading =============
// Get the canvas element and its context for drawing
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load all game images
const spaceshipImg = new Image();
const asteroidImg = new Image();
const backgroundImg = new Image();
const beamImg = new Image();
const upgradeImg = new Image();

// Set the source paths for all game images
spaceshipImg.src = 'images/spaceship.png';
asteroidImg.src = 'images/enemy.png';
backgroundImg.src = 'images/background.png';
beamImg.src = 'images/beam.png';
upgradeImg.src = 'images/upgrade.png';

// Load and configure all game audio
const gameoversound = new Audio('sounds/game-over.mp3');
const gamestartsound = new Audio('sounds/game-start.mp3');
const muziek = new Audio('sounds/8bitasteroid.mp3');
muziek.loop = true; // Background music will loop continuously
muziek.volume = 0.5; // Set background music to half volume

// ============= Game State Variables =============
// Main game objects and state tracking
let spaceship, bullets, asteroids, upgrades, score, asteroidSpawnInterval, animationId, lastAsteroidSpawn;
let isGameOver = false;
let isPaused = false;
let isAutoShooting = false;
let autoShootingTimer = null;
let lastAutoShoot = 0;
const autoShootInterval = 300; // Time between auto-shots in milliseconds

// Difficulty settings and scaling variables
let currentDifficulty = 'medium';
let difficultyScaleTimer = null;
let asteroidSpawnMultiplier = 1;
let baseAsteroidSpawnInterval = 1000;
let asteroidSpeedMultiplier = 1;

// Object to track keyboard input state
const keys = { left: false, right: false, space: false };

// Get UI elements and create score display
const pauseScreen = document.getElementById('pauseScreen');
const instructiescherm = document.getElementById('instructies');
const scoreDisplay = document.createElement('div');
scoreDisplay.id = 'gameScore';
document.body.appendChild(scoreDisplay);

// ============= Event Listeners =============
// Keyboard input handling for game controls
window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') keys.space = true;
    
    // Handle pause/resume with Escape key
    if (e.code === 'Escape' && !isGameOver) {
        if (isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});

// Reset key states when keys are released
window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'Space') keys.space = false;
});

// Menu navigation button handlers
document.getElementById('Instructieknop').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    instructiescherm.style.display = 'flex';
});

document.getElementById('Terugknop').addEventListener('click', () => {
    instructiescherm.style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
});

// Pause menu button handlers
document.getElementById('resumeButton').addEventListener('click', resumeGame);
document.getElementById('pauseMenuButton').addEventListener('click', () => {
    pauseScreen.style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
    scoreDisplay.textContent = '';
    muziek.pause();
    cancelAnimationFrame(animationId);
    isPaused = false;
});

// Game start button handler - sets up difficulty and initializes game
document.getElementById('startButton').addEventListener('click', () => {
    currentDifficulty = document.getElementById('difficulty').value;
    
    // Configure game parameters based on selected difficulty
    switch(currentDifficulty) {
        case 'easy':
            baseAsteroidSpawnInterval = 1500;
            asteroidSpawnInterval = 1500;
            difficultyScaleTimer = 15000; // Scale difficulty every 15 seconds
            break;
        case 'medium':
            baseAsteroidSpawnInterval = 1000;
            asteroidSpawnInterval = 1000;
            difficultyScaleTimer = 10000; // Scale difficulty every 10 seconds
            break;
        case 'hard':
            baseAsteroidSpawnInterval = 500;
            asteroidSpawnInterval = 500;
            difficultyScaleTimer = 5000; // Scale difficulty every 5 seconds
            break;
    }

    document.getElementById('menu').style.display = 'none';
    canvas.style.zIndex = '0';

    // Set canvas to full window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    resetGame();
    initGame();
    gameLoop();
});

// Restart button handler - resets and starts a new game
document.getElementById('restartButton').addEventListener('click', () => {
    document.getElementById('endScreen').style.display = 'none';
    canvas.style.zIndex = '0';

    resetGame();
    initGame();
    gameLoop();
});

// Return to menu button handler
document.getElementById('menuButton').addEventListener('click', () => {
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
    scoreDisplay.textContent = '';
    muziek.pause();
});

// ============= Game Management Functions =============
/*
 * Initializes a new game with starting values
 * Sets up spaceship, clears arrays, and starts music
 */
function initGame() {
    spaceship = { x: canvas.width / 2, y: canvas.height - 70, width: 50, height: 50, speed: 5 };
    bullets = [];
    asteroids = [];
    upgrades = [];
    score = 0;
    lastAsteroidSpawn = 0;
    isGameOver = false;
    gamestartsound.play();
    
    // Reset and start background music
    muziek.pause();
    muziek.currentTime = 0;
    muziek.play();
}

/*
 * Resets all game variables to their default states
 * Called when starting a new game or restarting
 */
function resetGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    // Reset all game arrays and variables
    bullets = [];
    asteroids = [];
    upgrades = [];
    score = 0;
    lastAsteroidSpawn = 0;
    isAutoShooting = false;
    keys.left = false;
    keys.right = false;
    keys.space = false;
    isGameOver = false;
    isPaused = false;

    // Reset difficulty scaling
    asteroidSpawnMultiplier = 1;
    asteroidSpeedMultiplier = 1;
    
    // Reset spawn interval based on difficulty
    switch(currentDifficulty) {
        case 'easy':
            asteroidSpawnInterval = 1500;
            break;
        case 'medium':
            asteroidSpawnInterval = 1000;
            break;
        case 'hard':
            asteroidSpawnInterval = 500;
            break;
    }
}

/*
 * Handles pausing the game
 * Stops animation and music, shows pause screen
 */
function pauseGame() {
    if (isGameOver) return;
    
    isPaused = true;
    cancelAnimationFrame(animationId);
    pauseScreen.style.display = 'flex';
    muziek.pause();
}

/*
 * Handles resuming the game
 * Hides pause screen, restarts music and animation
 */
function resumeGame() {
    if (isGameOver) return;
    
    isPaused = false;
    pauseScreen.style.display = 'none';
    muziek.play();
    gameLoop();
}

/*
 * Handles game over state
 * Shows end screen and final score
 */
function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    canvas.style.zIndex = '-1';
    document.getElementById('endScreen').style.display = 'flex';
    document.getElementById('finalScore').textContent = `Your Score: ${score}`;
    muziek.pause();
}

// ============= Game Loop and Updates =============
/**
 * Main game loop
 * Updates all game objects and draws them to the canvas
 */
function gameLoop(timestamp) {
    if (isGameOver || isPaused) return;
    
    // Draw background and update all game objects
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    updateSpaceship(timestamp);
    updateBullets();
    updateAsteroids(timestamp);
    updateUpgrades(timestamp);
    checkCollisions();

    // Draw all game objects
    drawSpaceship();
    drawBullets();
    drawAsteroids();
    drawUpgrades();
    drawScore();

    // Continue the game loop
    animationId = requestAnimationFrame(gameLoop);
}

/*
 * Increases game difficulty over time
 * Increases asteroid spawn rate and speed
 */
function scaleDifficulty() {
    if (isGameOver || isPaused) return;

    // Increase spawn rate
    asteroidSpawnMultiplier += 0.2;
    asteroidSpawnInterval = Math.max(200, baseAsteroidSpawnInterval / asteroidSpawnMultiplier);

    // Increase speed for hard difficulty
    if (currentDifficulty === 'hard') {
        asteroidSpeedMultiplier += 0.2;
    }
}

// ============= Entity Update Functions =============
/*
 * Updates spaceship position and handles shooting
 * @param {number} timestamp - Current time in milliseconds
 */
function updateSpaceship(timestamp) {
    // Move spaceship based on keyboard input
    if (keys.left && spaceship.x > 0) spaceship.x -= spaceship.speed;
    if (keys.right && spaceship.x < canvas.width - spaceship.width) spaceship.x += spaceship.speed;

    // Handle manual shooting
    if (keys.space) {
        shootBullet();
        keys.space = false;
    }

    // Handle auto-shooting if power-up is active
    if (isAutoShooting) {
        if (timestamp - lastAutoShoot > autoShootInterval) {
            shootBullet();
            lastAutoShoot = timestamp;
        }
    }
}

/*
 * Updates all bullets positions and removes off-screen bullets
 */
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= bullet.speed;
        bullet.x += bullet.dx || 0; // Add horizontal movement for diagonal shots

        // Remove bullets that are off screen
        if (bullet.y + bullet.height < 0 || bullet.x < 0 || bullet.x > canvas.width) {
            bullets.splice(i, 1);
        }
    }
}

/*
 * Updates asteroid positions and spawns new asteroids
 * @param {number} timestamp - Current time in milliseconds
 */
function updateAsteroids(timestamp) {
    if (!lastAsteroidSpawn) lastAsteroidSpawn = timestamp;

    // Check if it's time to increase difficulty
    if (difficultyScaleTimer && timestamp - difficultyScaleTimer > (
        currentDifficulty === 'easy' ? 15000 : 
        currentDifficulty === 'medium' ? 10000 : 5000
    )) {
        scaleDifficulty(timestamp);
        difficultyScaleTimer = timestamp;
    }

    // Spawn new asteroids
    if (timestamp - lastAsteroidSpawn > asteroidSpawnInterval) {
        const size = Math.random() * 40 + 20;
        const spawnCount = Math.ceil(Math.random() * asteroidSpawnMultiplier);

        // Create multiple asteroids based on difficulty
        for (let i = 0; i < spawnCount; i++) {
            asteroids.push({
                x: Math.random() * (canvas.width - size),
                y: -size,
                width: size,
                height: size,
                speed: (Math.random() * 2 + 1) * (currentDifficulty === 'hard' ? asteroidSpeedMultiplier : 1),
                canSplit: size > 40 // Only larger asteroids can split
            });
        }
        lastAsteroidSpawn = timestamp;
    }

    // Update existing asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        asteroid.y += asteroid.speed;
        if (asteroid.y > canvas.height) asteroids.splice(i, 1);
    }
}

/*
 * Updates power-up positions and handles collection
 */
function updateUpgrades(timestamp) {
    // Randomly spawn new power-ups
    if (Math.random() < 0.002) {
        const size = 30;
        upgrades.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: 2,
        });
    }

    // Update and check collisions for existing power-ups
    for (let i = upgrades.length - 1; i >= 0; i--) {
        const upgrade = upgrades[i];
        upgrade.y += upgrade.speed;

        // Remove off-screen power-ups
        if (upgrade.y > canvas.height) upgrades.splice(i, 1);

        // Check if spaceship collected the power-up
        if (
            spaceship.x < upgrade.x + upgrade.width &&
            spaceship.x + spaceship.width > upgrade.x &&
            spaceship.y < upgrade.y + upgrade.height &&
            spaceship.y + spaceship.height > upgrade.y
        ) {
            upgrades.splice(i, 1);
            activateAutoShooting();
            const upgradeSound = new Audio('sounds/upgrade.mp3');
            upgradeSound.play();
        }
    }
}

// ============= Entity Actions =============
/*
 * Creates new bullets when shooting
 * Handles both normal and power-up enhanced shooting
 */
function shootBullet() {
    // Create center bullet
    bullets.push({
        x: spaceship.x + spaceship.width / 2 - 5,
        y: spaceship.y,
        width: 10,
        height: 20,
        speed: 7,
        dx: 0,
    });

    // Create additional diagonal bullets if power-up is active
    if (isAutoShooting) {
        // Left diagonal bullet
        bullets.push({
            x: spaceship.x + 5,
            y: spaceship.y,
            width: 10,
            height: 20,
            speed: 7,
            dx: -2,
        });
        // Right diagonal bullet
        bullets.push({
            x: spaceship.x + spaceship.width - 15,
            y: spaceship.y,
            width: 10,
            height: 20,
            speed: 7,
            dx: 2,
        });
    }
    const laserbeamsound = new Audio('sounds/laserbeam.mp3')
    laserbeamsound.play();
}

/*
 * Activates the auto-shooting power-up
 * Sets a timer to deactivate it after 10 seconds
 */
function activateAutoShooting() {
    if (isAutoShooting) return;

    isAutoShooting = true;
    autoShootingTimer = setTimeout(() => {
        isAutoShooting = false;
    }, 10000); // Power-up lasts for 10 seconds
}

// ============= Drawing Functions =============
/*
 * Updates the score display on screen
 */
function drawScore() {
    scoreDisplay.textContent = `Score: ${score}`;
}

/*
 * Draws the spaceship at its current position
 */
function drawSpaceship() {
    ctx.drawImage(spaceshipImg, spaceship.x, spaceship.y, spaceship.width, spaceship.height);
}

/*
 * Draws all active bullets
 */
function drawBullets() {
    for (const bullet of bullets) {
        ctx.drawImage(beamImg, bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

/*
 * Draws all active asteroids
 */
function drawAsteroids() {
    for (const asteroid of asteroids) {
        ctx.drawImage(asteroidImg, asteroid.x, asteroid.y, asteroid.width, asteroid.height);
    }
}

/*
 * Draws all active power-ups
 */
function drawUpgrades() {
    for (const upgrade of upgrades) {
        ctx.drawImage(upgradeImg, upgrade.x, upgrade.y, upgrade.width, upgrade.height);
    }
}

// ============= Collision Detection =============
/*
 * Checks for and handles all collisions between game objects
 * Includes bullet-asteroid and spaceship-asteroid collisions
 */
function checkCollisions() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        // Check collisions between bullets and asteroids
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            if (
                bullet.x < asteroid.x + asteroid.width &&
                bullet.x + bullet.width > asteroid.x &&
                bullet.y < asteroid.y + asteroid.height &&
                bullet.y + bullet.height > asteroid.y
            ) {
                bullets.splice(j, 1); // Remove the bullet

                // Handle asteroid splitting
                if (asteroid.canSplit) {
                    const newSize = asteroid.width / 2;
                    // Create two smaller asteroids
                    asteroids.push({
                        x: asteroid.x,
                        y: asteroid.y,
                        width: newSize,
                        height: newSize,
                        speed: asteroid.speed * 0.5,
                        canSplit: false // Smaller asteroids cannot split again
                    });
                    asteroids.push({
                        x: asteroid.x + newSize,
                        y: asteroid.y,
                        width: newSize,
                        height: newSize,
                        speed: asteroid.speed * 0.5,
                        canSplit: false
                    });
                }

                // Remove the original asteroid and update score
                asteroids.splice(i, 1);
                score++;
                const explosionsound = new Audio('sounds/explosie.mp3');
                explosionsound.play();
                break;
            }
        }

        // Check collision between asteroid and spaceship
        if (
            spaceship.x < asteroid.x + asteroid.width &&
            spaceship.x + spaceship.width > asteroid.x &&
            spaceship.y < asteroid.y + asteroid.height &&
            spaceship.y + spaceship.height > asteroid.y
        ) {
            gameoversound.play();
            gameOver();
        }
    }
}