# Best Education Shooter - Ontwikkelingslogboek

## Dag 1 (12/09)

- Game design document opgesteld
- Basis HTML canvas structuur en game omgeving opgezet
- Initiële sprite laden en weergave geïmplementeerd:
  ```javascript
  const spaceshipImg = new Image();
  const asteroidImg = new Image();
  spaceshipImg.src = "images/spaceship.png";
  asteroidImg.src = "images/enemy.png";
  ```
- Basis bewegingssysteem voor vijanden ontwikkeld:
  ```javascript
  function updateAsteroids(timestamp) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const asteroid = asteroids[i];
      asteroid.y += asteroid.speed;
    }
  }
  ```

## Dag 2 (12/10)

- Besturing van het ruimteschip geïmplementeerd:
  ```javascript
  function updateSpaceship() {
    if (keys.left && spaceship.x > 0) spaceship.x -= spaceship.speed;
    if (keys.right && spaceship.x < canvas.width - spaceship.width)
      spaceship.x += spaceship.speed;
  }
  ```
- Botsingssysteem toegevoegd:
  ```javascript
  function checkCollisions() {
    // Botsing tussen ruimteschip en asteroïden
    if (
      spaceship.x < asteroid.x + asteroid.width &&
      spaceship.x + spaceship.width > asteroid.x &&
      spaceship.y < asteroid.y + asteroid.height &&
      spaceship.y + spaceship.height > asteroid.y
    ) {
      gameOver();
    }
  }
  ```
- Schietmechanisme geïmplementeerd

## Dag 3 (12/11)

- Scoresysteem toegevoegd:
  ```javascript
  let score = 0;
  function checkCollisions() {
    // Wanneer kogel asteroïde raakt
    asteroids.splice(i, 1);
    bullets.splice(j, 1);
    score++;
  }
  ```
- Game schermen geïmplementeerd (hoofdmenu, game over)
- Game loop functionaliteit gecreëerd:
  ```javascript
  function gameLoop(timestamp) {
    updateSpaceship(timestamp);
    updateBullets();
    updateAsteroids(timestamp);
    checkCollisions();
    drawSpaceship();
    drawBullets();
    drawAsteroids();
    drawScore();
  }
  ```

## Dag 4 (12/12)

- Moeilijkheidssysteem met drie niveaus geïmplementeerd:
  ```javascript
  switch (currentDifficulty) {
    case "easy":
      baseAsteroidSpawnInterval = 1500;
      break;
    case "medium":
      baseAsteroidSpawnInterval = 1000;
      break;
    case "hard":
      baseAsteroidSpawnInterval = 500;
      break;
  }
  ```
- Power-up systeem toegevoegd met meerdere schietrichtingen:
  ```javascript
  function activateAutoShooting() {
    isAutoShooting = true;
    autoShootingTimer = setTimeout(() => {
      isAutoShooting = false;
    }, 10000);
  }
  ```

## Dag 5 (17/12)

- Geluidseffecten geïntegreerd:
  ```javascript
  const gameoversound = new Audio("sounds/game-over.mp3");
  const gamestartsound = new Audio("sounds/game-start.mp3");
  const muziek = new Audio("sounds/8bitasteroid.mp3");
  ```
- Achtergrondmuziek toegevoegd met loop functionaliteit
- Geluidseffecten geïmplementeerd voor:
  - Game over
  - Schieten
  - Power-up verzamelen
  - Vijand vernietigen
  - Game start

## Dag 6 (18/12)

- Instructiescherm toegevoegd aan hoofdmenu
- Progressieve moeilijkheidsschaling geïmplementeerd:

  ```javascript
  function scaleDifficulty(timestamp) {
    asteroidSpawnMultiplier += 0.2;
    asteroidSpawnInterval = Math.max(
      200,
      baseAsteroidSpawnInterval / asteroidSpawnMultiplier
    );

    if (currentDifficulty === "hard") {
      asteroidSpeedMultiplier += 0.2;
    }
  }
  ```

- Moeilijkheidsgraad-specifieke schaalintervallen toegevoegd:

  - Makkelijk: Elke 15 seconden
  - Gemiddeld: Elke 10 seconden
  - Moeilijk: Elke 5 seconden

  ## Dag 7 (19/12)

- **Splitsmechanisme voor asteroïden toegevoegd:**

  - Code toegevoegd die de asteroïde in tweeën splitst wanneer deze door een kogel wordt geraakt.
  - De asteroïde kan splitsen als het attribuut `canSplit` op `true` staat. Na de botsing worden twee kleinere asteroïden gemaakt die niet meer kunnen splitsen.
  - De nieuwe asteroïden bewegen sneller dan de originele asteroïde.
  - Het originele asteroïde-object wordt verwijderd en de score wordt verhoogd.

  **Toegevoegde splitscode:**

  ```javascript
                  // Splitsen van de asteroïde
                  if (asteroid.canSplit) {
                      const newSize = asteroid.width / 2;
                      // Maak twee kleinere asteroïden
                      asteroids.push({
                          x: asteroid.x,
                          y: asteroid.y,
                          width: newSize,
                          height: newSize,
                          speed: asteroid.speed * 1.2,
                          canSplit: false // Kleinere asteroïden kunnen niet verder splitsen
                      });
                      asteroids.push({
                          x: asteroid.x + newSize,
                          y: asteroid.y,
                          width: newSize,
                          height: newSize,
                          speed: asteroid.speed * 1.2,
                          canSplit: false
                      });
                  }

                  // Verwijder de originele asteroïde en verhoog de score
                  asteroids.splice(i, 1);
                  score++;
                  const explosionsound = new Audio('sounds/explosie.mp3');
                  explosionsound.play();
                  break;
  ```

  ## Dag 8 (20/12)

- **Code volledig gerefactored:**
  - De code is volledig voorzien van commentaar zodat de overdracht erg makkelijk wordt. Code is zo volledig leesbaar.
  - Dezelfde soort functies zijn gegroepeerd en in een logische volgorde gezet.
  ```javascript
  /** Activates the auto-shooting power-up
  * Sets a timer to deactivate it after 10 seconds
  */
  function activateAutoShooting() {
    if (isAutoShooting) return;

    isAutoShooting = true;
    autoShootingTimer = setTimeout(() => {
      isAutoShooting = false;
    }, 10000); // Power-up lasts for 10 seconds
  }

