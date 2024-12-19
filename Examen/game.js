const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const spaceshipImg = new Image();
const asteroidImg = new Image();
const backgroundImg = new Image();
const beamImg = new Image();
const upgradeImg = new Image();

const gameoversound = new Audio('sounds/game-over.mp3');
const gamestartsound = new Audio('sounds/game-start.mp3');
const muziek = new Audio('sounds/8bitasteroid.mp3');

muziek.loop = true; // Allow the music to loop continuously
muziek.volume = 0.5;

spaceshipImg.src = 'images/spaceship.png';
asteroidImg.src = 'images/enemy.png';
backgroundImg.src = 'images/background.png';
beamImg.src = 'images/beam.png';
upgradeImg.src = 'images/upgrade.png';

let spaceship, bullets, asteroids, upgrades, score, asteroidSpawnInterval, animationId, lastAsteroidSpawn;
let isGameOver = false;
let isPaused = false;
let isAutoShooting = false;
let autoShootingTimer = null;
let lastAutoShoot = 0;
const autoShootInterval = 300;

// New variables for difficulty scaling
let currentDifficulty = 'medium';
let difficultyScaleTimer = null;
let asteroidSpawnMultiplier = 1;
let baseAsteroidSpawnInterval = 1000;
let asteroidSpeedMultiplier = 1;

const keys = { left: false, right: false, space: false };

// Pause Screen Setup

const pauseScreen = document.getElementById('pauseScreen');
const instructiescherm = document.getElementById('instructies')

// Voeg score display toe
const scoreDisplay = document.createElement('div');
scoreDisplay.id = 'gameScore';
document.body.appendChild(scoreDisplay);

window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') keys.space = true;
    
    // Pause functionality with Escape key
    if (e.code === 'Escape' && !isGameOver) {
        if (isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'Space') keys.space = false;
});

document.getElementById('Instructieknop').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    instructiescherm.style.display = 'flex';
});

// Add event listener for back button in instruction screen
document.getElementById('Terugknop').addEventListener('click', () => {
    instructiescherm.style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
});

// Pause Screen Buttons
document.getElementById('resumeButton').addEventListener('click', resumeGame);
document.getElementById('pauseMenuButton').addEventListener('click', () => {
    pauseScreen.style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
    scoreDisplay.textContent = '';
    muziek.pause();
    cancelAnimationFrame(animationId);
    isPaused = false;
});

document.getElementById('startButton').addEventListener('click', () => {
    currentDifficulty = document.getElementById('difficulty').value;
    
    // Set initial spawn interval and multipliers based on difficulty
    switch(currentDifficulty) {
        case 'easy':
            baseAsteroidSpawnInterval = 1500;
            asteroidSpawnInterval = 1500;
            difficultyScaleTimer = 15000; // Scale every 15 seconds
            break;
        case 'medium':
            baseAsteroidSpawnInterval = 1000;
            asteroidSpawnInterval = 1000;
            difficultyScaleTimer = 10000; // Scale every 10 seconds
            break;
        case 'hard':
            baseAsteroidSpawnInterval = 500;
            asteroidSpawnInterval = 500;
            difficultyScaleTimer = 5000; // Scale every 5 seconds
            break;
    }

    document.getElementById('menu').style.display = 'none';
    canvas.style.zIndex = '0';

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    resetGame();
    initGame();
    gameLoop();
});

document.getElementById('restartButton').addEventListener('click', () => {
    document.getElementById('endScreen').style.display = 'none';
    canvas.style.zIndex = '0';

    resetGame();
    initGame();
    gameLoop();
});

document.getElementById('menuButton').addEventListener('click', () => {
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
    scoreDisplay.textContent = '';

    muziek.pause();
});

function scaleDifficulty(timestamp) {
    if (isGameOver || isPaused) return;

    // Increase asteroid spawn rate
    asteroidSpawnMultiplier += 0.2;
    asteroidSpawnInterval = Math.max(200, baseAsteroidSpawnInterval / asteroidSpawnMultiplier);

    // For hard difficulty, also increase asteroid speed
    if (currentDifficulty === 'hard') {
        asteroidSpeedMultiplier += 0.2;
    }
}

function pauseGame() {
    if (isGameOver) return;
    
    isPaused = true;
    cancelAnimationFrame(animationId);
    pauseScreen.style.display = 'flex';
    muziek.pause();
}

function resumeGame() {
    if (isGameOver) return;
    
    isPaused = false;
    pauseScreen.style.display = 'none';
    muziek.play();
    gameLoop();
}

function resetGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
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


function initGame() {
    spaceship = { x: canvas.width / 2, y: canvas.height - 70, width: 50, height: 50, speed: 5 };
    bullets = [];
    asteroids = [];
    upgrades = [];
    score = 0;
    lastAsteroidSpawn = 0;
    isGameOver = false;
    gamestartsound.play();
    
    muziek.pause();
    muziek.currentTime = 0; // Reset to the beginning
    muziek.play();
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    canvas.style.zIndex = '-1';
    document.getElementById('endScreen').style.display = 'flex';
    document.getElementById('finalScore').textContent = `Your Score: ${score}`;

    muziek.pause();
}

function gameLoop(timestamp) {
    if (isGameOver || isPaused) return;
    
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    updateSpaceship(timestamp);
    updateBullets();
    updateAsteroids(timestamp);
    updateUpgrades(timestamp);
    checkCollisions();

    drawSpaceship();
    drawBullets();
    drawAsteroids();
    drawUpgrades();
    drawScore();

    animationId = requestAnimationFrame(gameLoop);
}

function drawScore() {
    scoreDisplay.textContent = `Score: ${score}`;
}

function updateSpaceship(timestamp) {
    if (keys.left && spaceship.x > 0) spaceship.x -= spaceship.speed;
    if (keys.right && spaceship.x < canvas.width - spaceship.width) spaceship.x += spaceship.speed;

    if (keys.space) {
        shootBullet();
        keys.space = false;
    }

    // Automatisch schieten wanneer de upgrade actief is
    if (isAutoShooting) {
        if (timestamp - lastAutoShoot > autoShootInterval) {
            shootBullet();
            lastAutoShoot = timestamp; // Update het laatste schiettijdstip
        }
    }
}


function shootBullet() {
    bullets.push({
        x: spaceship.x + spaceship.width / 2 - 5,
        y: spaceship.y,
        width: 10,
        height: 20,
        speed: 7,
        dx: 0, // Richting horizontaal
    });

    if (isAutoShooting) {
        // Linker diagonaal
        bullets.push({
            x: spaceship.x + 5,
            y: spaceship.y,
            width: 10,
            height: 20,
            speed: 7,
            dx: -2,
        });
        // Rechter diagonaal
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

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= bullet.speed;
        bullet.x += bullet.dx || 0; // Voor diagonale beweging

        if (bullet.y + bullet.height < 0 || bullet.x < 0 || bullet.x > canvas.width) {
            bullets.splice(i, 1);
        }
    }
}

function updateAsteroids(timestamp) {
    if (!lastAsteroidSpawn) lastAsteroidSpawn = timestamp;

    // Track difficulty scaling
    if (difficultyScaleTimer && timestamp - difficultyScaleTimer > (
        currentDifficulty === 'easy' ? 15000 : 
        currentDifficulty === 'medium' ? 10000 : 5000
    )) {
        scaleDifficulty(timestamp);
        difficultyScaleTimer = timestamp;
    }

    if (timestamp - lastAsteroidSpawn > asteroidSpawnInterval) {
        const size = Math.random() * 40 + 20;

        // Spawn multiple asteroids based on difficulty multiplier
        const spawnCount = Math.ceil(Math.random() * asteroidSpawnMultiplier);

        for (let i = 0; i < spawnCount; i++) {
            asteroids.push({
                x: Math.random() * (canvas.width - size),
                y: -size,
                width: size,
                height: size,
                speed: (Math.random() * 2 + 1) * (currentDifficulty === 'hard' ? asteroidSpeedMultiplier : 1),
                canSplit: size > 40 // Alleen grotere asteroïden mogen splitsen
            });
        }
        lastAsteroidSpawn = timestamp;
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        asteroid.y += asteroid.speed;
        if (asteroid.y > canvas.height) asteroids.splice(i, 1);
    }
}


function updateUpgrades(timestamp) {
    if (Math.random() < 0.002) { // Kans op spawning
        const size = 30;
        upgrades.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: 2,
        });
    }

    for (let i = upgrades.length - 1; i >= 0; i--) {
        const upgrade = upgrades[i];
        upgrade.y += upgrade.speed;

        if (upgrade.y > canvas.height) upgrades.splice(i, 1);

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

function activateAutoShooting() {
    if (isAutoShooting) return;

    isAutoShooting = true;
    autoShootingTimer = setTimeout(() => {
        isAutoShooting = false;
    }, 10000);
}

function drawSpaceship() {
    ctx.drawImage(spaceshipImg, spaceship.x, spaceship.y, spaceship.width, spaceship.height);
}

function drawBullets() {
    for (const bullet of bullets) {
        ctx.drawImage(beamImg, bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

function drawAsteroids() {
    for (const asteroid of asteroids) {
        ctx.drawImage(asteroidImg, asteroid.x, asteroid.y, asteroid.width, asteroid.height);
    }
}

function drawUpgrades() {
    for (const upgrade of upgrades) {
        ctx.drawImage(upgradeImg, upgrade.x, upgrade.y, upgrade.width, upgrade.height);
    }
}

function checkCollisions() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            if (
                bullet.x < asteroid.x + asteroid.width &&
                bullet.x + bullet.width > asteroid.x &&
                bullet.y < asteroid.y + asteroid.height &&
                bullet.y + bullet.height > asteroid.y
            ) {
                // Verwijder originele asteroïde en kogel
                bullets.splice(j, 1);

                if (asteroid.canSplit) {
                    // Splits de asteroïde in twee kleinere
                    const newSize = asteroid.width / 2;
                    asteroids.push({
                        x: asteroid.x,
                        y: asteroid.y,
                        width: newSize,
                        height: newSize,
                        speed: asteroid.speed * 1.2,
                        canSplit: false // De kleinere asteroïden kunnen niet meer splitsen
                    });
                    asteroids.push({
                        x: asteroid.x + newSize,
                        y: asteroid.y,
                        width: newSize,
                        height: newSize,
                        speed: asteroid.speed * 1.2,
                        canSplit: false // De kleinere asteroïden kunnen niet meer splitsen
                    });
                }

                // Verwijder de originele asteroïde
                asteroids.splice(i, 1);

                // Verhoog score
                score++;
                const explosionsound = new Audio('sounds/explosie.mp3');
                explosionsound.play();
                break;
            }
        }

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


