const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const spaceshipImg = new Image();
const asteroidImg = new Image();
const backgroundImg = new Image();
const beamImg = new Image();

spaceshipImg.src = 'spaceship.png';
asteroidImg.src = 'enemy.png';
backgroundImg.src = 'background.png';
beamImg.src = 'beam.png';

let spaceship, bullets, asteroids, score, asteroidSpawnInterval, animationId, lastAsteroidSpawn;
let isGameOver = false;
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

    const difficulty = document.getElementById('difficulty').value;
    asteroidSpawnInterval = difficulty === 'easy' ? 1500 : difficulty === 'medium' ? 1000 : 500;

    resetGame();
    initGame();
    gameLoop();
});

document.getElementById('menuButton').addEventListener('click', () => {
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
});

function resetGame() {
    bullets = [];
    asteroids = [];
    score = 0;
    lastAsteroidSpawn = 0;
    keys.left = false;
    keys.right = false;
    keys.space = false;
    isGameOver = false;
}

function initGame() {
    spaceship = { x: canvas.width / 2, y: canvas.height - 70, width: 50, height: 50, speed: 5 };
    bullets = [];
    asteroids = [];
    score = 0;
    lastAsteroidSpawn = 0;
    isGameOver = false;
}

function gameOver() {
    isGameOver = true; // Zorg ervoor dat we de game stoppen
    cancelAnimationFrame(animationId); // Stop de animatie
    canvas.style.zIndex = '-1'; // Zet het canvas naar de achtergrond
    document.getElementById('endScreen').style.display = 'flex'; // Laat het eindscherm zien
    document.getElementById('finalScore').textContent = `Your Score: ${score}`; // Toon score
}

document.getElementById('restartButton').addEventListener('click', () => {
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('menu').style.display = 'none'; // Zorg dat het menu niet zichtbaar blijft
    canvas.style.zIndex = '0';

    resetGame();
    initGame();
    gameLoop();
});

document.getElementById('menuButton').addEventListener('click', () => {
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('menu').style.display = 'flex'; // Flexbox-styling correct toepassen
});

function gameLoop(timestamp) {
    if (isGameOver) {
        return; // Stop de game loop onmiddellijk als de game over is
    }

    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    updateSpaceship();
    updateBullets();
    updateAsteroids(timestamp);
    checkCollisions();

    drawSpaceship();
    drawBullets();
    drawAsteroids();
    drawScore();

    animationId = requestAnimationFrame(gameLoop); // Roep de game loop opnieuw aan
}

function drawScore() {
    scoreDisplay.textContent = `Score: ${score}`;
}

function updateSpaceship() {
    if (keys.left && spaceship.x > 0) spaceship.x -= spaceship.speed;
    if (keys.right && spaceship.x < canvas.width - spaceship.width) spaceship.x += spaceship.speed;

    if (keys.space) {
        shootBullet();
        keys.space = false;
    }
}

function shootBullet() {
    bullets.push({
        x: spaceship.x + spaceship.width / 2 - 5,
        y: spaceship.y,
        width: 10,
        height: 20,
        speed: 7,
    });
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= bullet.speed;
        if (bullet.y + bullet.height < 0) bullets.splice(i, 1);
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
