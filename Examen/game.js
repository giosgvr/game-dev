const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const spaceshipImg = new Image();
const asteroidImg = new Image();
const backgroundImg = new Image();
const beamImg = new Image();
const upgradeImg = new Image(); // Upgrade afbeelding

spaceshipImg.src = 'spaceship.png';
asteroidImg.src = 'enemy.png';
backgroundImg.src = 'background.png';
beamImg.src = 'beam.png';
upgradeImg.src = 'upgrade.png';

let spaceship, bullets, asteroids, upgrades, score, asteroidSpawnInterval, animationId, lastAsteroidSpawn;
let isGameOver = false;
let isAutoShooting = false; // Automatisch schieten
let autoShootingTimer = null;
let lastAutoShoot = 0; // Tijdstip van het laatste autoschot
const autoShootInterval = 300; // Interval tussen autoschoten in milliseconden

const keys = { left: false, right: false, space: false };

// Voeg score display toe
const scoreDisplay = document.createElement('div');
scoreDisplay.id = 'gameScore';
document.body.appendChild(scoreDisplay);

window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') keys.space = true;
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'Space') keys.space = false;
});

document.getElementById('startButton').addEventListener('click', () => {
    const difficulty = document.getElementById('difficulty').value;
    asteroidSpawnInterval = difficulty === 'easy' ? 1500 : difficulty === 'medium' ? 1000 : 500;

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
    document.getElementById('menu').style.display = 'block';
    scoreDisplay.textContent = '';
});

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
}

function initGame() {
    spaceship = { x: canvas.width / 2, y: canvas.height - 70, width: 50, height: 50, speed: 5 };
    bullets = [];
    asteroids = [];
    upgrades = [];
    score = 0;
    lastAsteroidSpawn = 0;
    isGameOver = false;
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    canvas.style.zIndex = '-1';
    document.getElementById('endScreen').style.display = 'flex';
    document.getElementById('finalScore').textContent = `Your Score: ${score}`;
}

function gameLoop(timestamp) {
    if (isGameOver) return;

    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    updateSpaceship(timestamp); // Geef timestamp door
    updateBullets();
    updateAsteroids(timestamp);
    updateUpgrades(timestamp); // Update upgrades
    checkCollisions();

    drawSpaceship();
    drawBullets();
    drawAsteroids();
    drawUpgrades(); // Teken upgrades
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

    if (timestamp - lastAsteroidSpawn > asteroidSpawnInterval) {
        const size = Math.random() * 40 + 20;
        asteroids.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: Math.random() * 2 + 1,
        });
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
                asteroids.splice(i, 1);
                bullets.splice(j, 1);
                score++;
                break;
            }
        }

        if (
            spaceship.x < asteroid.x + asteroid.width &&
            spaceship.x + spaceship.width > asteroid.x &&
            spaceship.y < asteroid.y + asteroid.height &&
            spaceship.y + spaceship.height > asteroid.y
        ) {
            gameOver();
        }
    }
}
