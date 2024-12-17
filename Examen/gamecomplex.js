// Game configuratie en constanten
class GameConfig {
    static CANVAS_ID = 'gameCanvas';
    static DIFFICULTY_SELECTOR_ID = 'difficulty';
    static START_BUTTON_ID = 'startButton';
    static RESTART_BUTTON_ID = 'restartButton';
    static MENU_ID = 'menu';
    static END_SCREEN_ID = 'endScreen';
    static FINAL_SCORE_ID = 'finalScore';

    static IMAGES = {
        SPACESHIP: 'spaceship.png',
        ASTEROID: 'enemy.png',
        BACKGROUND: 'background.png',
        BEAM: 'beam.png',
        UPGRADE: 'upgrade.png'
    };

    static SPAWN_INTERVALS = {
        EASY: 1500,
        MEDIUM: 1000,
        HARD: 500
    };

    static AUTO_SHOOT_CONFIG = {
        INTERVAL: 300,
        DURATION: 10000
    };
}

// Asset Manager voor afbeeldingen
class AssetManager {
    constructor() {
        this.spaceship = this.loadImage(GameConfig.IMAGES.SPACESHIP);
        this.asteroid = this.loadImage(GameConfig.IMAGES.ASTEROID);
        this.background = this.loadImage(GameConfig.IMAGES.BACKGROUND);
        this.beam = this.loadImage(GameConfig.IMAGES.BEAM);
        this.upgrade = this.loadImage(GameConfig.IMAGES.UPGRADE);
    }

    loadImage(src) {
        const img = new Image();
        img.src = src;
        return img;
    }
}

// Input Manager voor toetsenbord
class InputManager {
    constructor() {
        this.keys = { left: false, right: false, space: false };
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    handleKeyDown(e) {
        if (e.code === 'ArrowLeft') this.keys.left = true;
        if (e.code === 'ArrowRight') this.keys.right = true;
        if (e.code === 'Space') this.keys.space = true;
    }

    handleKeyUp(e) {
        if (e.code === 'ArrowLeft') this.keys.left = false;
        if (e.code === 'ArrowRight') this.keys.right = false;
        if (e.code === 'Space') this.keys.space = false;
    }
}

// Game Objects
class Spaceship {
    constructor(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight - 70;
        this.width = 50;
        this.height = 50;
        this.speed = 5;
    }

    move(keys, canvasWidth) {
        if (keys.left && this.x > 0) this.x -= this.speed;
        if (keys.right && this.x < canvasWidth - this.width) this.x += this.speed;
    }
}

class SpaceShooterGame {
    constructor() {
        this.canvas = document.getElementById(GameConfig.CANVAS_ID);
        this.ctx = this.canvas.getContext('2d');
        this.assets = new AssetManager();
        this.inputManager = new InputManager();

        this.setupEventListeners();
        this.scoreDisplay = this.createScoreDisplay();
    }

    setupEventListeners() {
        document.getElementById(GameConfig.START_BUTTON_ID)
            .addEventListener('click', this.startGame.bind(this));
        document.getElementById(GameConfig.RESTART_BUTTON_ID)
            .addEventListener('click', this.restartGame.bind(this));
        document.getElementById('menuButton')
            .addEventListener('click', this.returnToMenu.bind(this));
    }

    createScoreDisplay() {
        const scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'gameScore';
        document.body.appendChild(scoreDisplay);
        return scoreDisplay;
    }

    startGame() {
        const difficulty = document.getElementById(GameConfig.DIFFICULTY_SELECTOR_ID).value;
        this.asteroidSpawnInterval = GameConfig.SPAWN_INTERVALS[difficulty.toUpperCase()];

        document.getElementById(GameConfig.MENU_ID).style.display = 'none';
        this.canvas.style.zIndex = '0';

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.resetGame();
        this.initGame();
        this.gameLoop();
    }

    restartGame() {
        document.getElementById(GameConfig.END_SCREEN_ID).style.display = 'none';
        this.canvas.style.zIndex = '0';

        this.resetGame();
        this.initGame();
        this.gameLoop();
    }

    returnToMenu() {
        document.getElementById(GameConfig.END_SCREEN_ID).style.display = 'none';
        document.getElementById(GameConfig.MENU_ID).style.display = 'block';
        this.scoreDisplay.textContent = '';
    }

    resetGame() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.bullets = [];
        this.asteroids = [];
        this.upgrades = [];
        this.score = 0;
        this.lastAsteroidSpawn = 0;
        this.isAutoShooting = false;
        this.inputManager.keys.left = false;
        this.inputManager.keys.right = false;
        this.inputManager.keys.space = false;
        this.isGameOver = false;
    }

    initGame() {
        this.spaceship = new Spaceship(this.canvas.width, this.canvas.height);
        this.bullets = [];
        this.asteroids = [];
        this.upgrades = [];
        this.score = 0;
        this.lastAsteroidSpawn = 0;
        this.isGameOver = false;
    }

    gameOver() {
        this.isGameOver = true;
        cancelAnimationFrame(this.animationId);
        this.canvas.style.zIndex = '-1';
        document.getElementById(GameConfig.END_SCREEN_ID).style.display = 'flex';
        document.getElementById(GameConfig.FINAL_SCORE_ID).textContent = `Your Score: ${this.score}`;
    }

    gameLoop(timestamp) {
        if (this.isGameOver) return;

        this.ctx.drawImage(this.assets.background, 0, 0, this.canvas.width, this.canvas.height);
        this.updateSpaceship(timestamp);
        this.updateBullets();
        this.updateAsteroids(timestamp);
        this.updateUpgrades(timestamp);
        this.checkCollisions();

        this.drawSpaceship();
        this.drawBullets();
        this.drawAsteroids();
        this.drawUpgrades();
        this.drawScore();

        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    updateSpaceship(timestamp) {
        this.spaceship.move(this.inputManager.keys, this.canvas.width);

        if (this.inputManager.keys.space) {
            this.shootBullet();
            this.inputManager.keys.space = false;
        }

        if (this.isAutoShooting) {
            if (timestamp - this.lastAutoShoot > GameConfig.AUTO_SHOOT_CONFIG.INTERVAL) {
                this.shootBullet();
                this.lastAutoShoot = timestamp;
            }
        }
    }

    shootBullet() {
        this.bullets.push({
            x: this.spaceship.x + this.spaceship.width / 2 - 5,
            y: this.spaceship.y,
            width: 10,
            height: 20,
            speed: 7,
            dx: 0,
        });

        if (this.isAutoShooting) {
            this.bullets.push({
                x: this.spaceship.x + 5,
                y: this.spaceship.y,
                width: 10,
                height: 20,
                speed: 7,
                dx: -2,
            });
            this.bullets.push({
                x: this.spaceship.x + this.spaceship.width - 15,
                y: this.spaceship.y,
                width: 10,
                height: 20,
                speed: 7,
                dx: 2,
            });
        }
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y -= bullet.speed;
            bullet.x += bullet.dx || 0;

            if (
                bullet.y + bullet.height < 0 || 
                bullet.x < 0 || 
                bullet.x > this.canvas.width
            ) {
                this.bullets.splice(i, 1);
            }
        }
    }

    updateAsteroids(timestamp) {
        if (!this.lastAsteroidSpawn) this.lastAsteroidSpawn = timestamp;

        if (timestamp - this.lastAsteroidSpawn > this.asteroidSpawnInterval) {
            const size = Math.random() * 40 + 20;
            this.asteroids.push({
                x: Math.random() * (this.canvas.width - size),
                y: -size,
                width: size,
                height: size,
                speed: Math.random() * 2 + 1,
            });
            this.lastAsteroidSpawn = timestamp;
        }

        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            asteroid.y += asteroid.speed;
            if (asteroid.y > this.canvas.height) this.asteroids.splice(i, 1);
        }
    }

    updateUpgrades(timestamp) {
        if (Math.random() < 0.002) {
            const size = 30;
            this.upgrades.push({
                x: Math.random() * (this.canvas.width - size),
                y: -size,
                width: size,
                height: size,
                speed: 2,
            });
        }

        for (let i = this.upgrades.length - 1; i >= 0; i--) {
            const upgrade = this.upgrades[i];
            upgrade.y += upgrade.speed;

            if (upgrade.y > this.canvas.height) {
                this.upgrades.splice(i, 1);
            }

            if (this.checkUpgradeCollision(upgrade)) {
                this.upgrades.splice(i, 1);
                this.activateAutoShooting();
            }
        }
    }

    checkUpgradeCollision(upgrade) {
        return (
            this.spaceship.x < upgrade.x + upgrade.width &&
            this.spaceship.x + this.spaceship.width > upgrade.x &&
            this.spaceship.y < upgrade.y + upgrade.height &&
            this.spaceship.y + this.spaceship.height > upgrade.y
        );
    }

    activateAutoShooting() {
        if (this.isAutoShooting) return;

        this.isAutoShooting = true;
        this.autoShootingTimer = setTimeout(() => {
            this.isAutoShooting = false;
        }, GameConfig.AUTO_SHOOT_CONFIG.DURATION);
    }

    drawSpaceship() {
        this.ctx.drawImage(
            this.assets.spaceship, 
            this.spaceship.x, 
            this.spaceship.y, 
            this.spaceship.width, 
            this.spaceship.height
        );
    }

    drawBullets() {
        for (const bullet of this.bullets) {
            this.ctx.drawImage(
                this.assets.beam, 
                bullet.x, 
                bullet.y, 
                bullet.width, 
                bullet.height
            );
        }
    }

    drawAsteroids() {
        for (const asteroid of this.asteroids) {
            this.ctx.drawImage(
                this.assets.asteroid, 
                asteroid.x, 
                asteroid.y, 
                asteroid.width, 
                asteroid.height
            );
        }
    }

    drawUpgrades() {
        for (const upgrade of this.upgrades) {
            this.ctx.drawImage(
                this.assets.upgrade, 
                upgrade.x, 
                upgrade.y, 
                upgrade.width, 
                upgrade.height
            );
        }
    }

    drawScore() {
        this.scoreDisplay.textContent = `Score: ${this.score}`;
    }

    checkCollisions() {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];
                if (this.checkBulletAsteroidCollision(bullet, asteroid)) {
                    this.asteroids.splice(i, 1);
                    this.bullets.splice(j, 1);
                    this.score++;
                    break;
                }
            }

            if (this.checkSpaceshipAsteroidCollision(asteroid)) {
                this.gameOver();
            }
        }
    }

    checkBulletAsteroidCollision(bullet, asteroid) {
        return (
            bullet.x < asteroid.x + asteroid.width &&
            bullet.x + bullet.width > asteroid.x &&
            bullet.y < asteroid.y + asteroid.height &&
            bullet.y + bullet.height > asteroid.y
        );
    }

    checkSpaceshipAsteroidCollision(asteroid) {
        return (
            this.spaceship.x < asteroid.x + asteroid.width &&
            this.spaceship.x + this.spaceship.width > asteroid.x &&
            this.spaceship.y < asteroid.y + asteroid.height &&
            this.spaceship.y + this.spaceship.height > asteroid.y
        );
    }
}

// Initialiseer het spel
document.addEventListener('DOMContentLoaded', () => {
    const game = new SpaceShooterGame();
});