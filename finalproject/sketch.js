let player;
let platforms = [];
let enemies = [];
let collectibles = [];
let backgroundItems = [];
let traps = [];
let cameraOffset = { x: 0, y: 0 };
let score = 0;
let health = 3;
let gamePaused = false;
let inMenu = true;
let soundVolume = 0.5;
let musicVolume = 0.3;
let levelWidth = 2000;
let levelHeight = 600;
let enemiesDefeated = 0;
let gameCompleted = false;
let totalEnemiesSpawned = 0;
const ENEMIES_TO_SPAWN_NEW = 2;
const TOTAL_ENEMIES_TO_DEFEAT = 8;
let gun = {
  width: 30,
  height: 10,
  cooldown: 0,
  cooldownMax: 15
};
let bullets = [];
let isFallingInPit = false;
let fallTimer = 0;
const FALL_DURATION = 90;
let pitFallSpeed = 3;

function preload() {
  try {
    jumpSound = loadSound('sounds/jumpsound.mp3');
    collectSound = loadSound('sounds/collect.mp3');
    hurtSound = loadSound('sounds/DeathByEnemy.mp3');
	killSound = loadSound('sounds/EnemyDeath.mp3');
    bgMusic = loadSound('sounds/backgroundMusic.mp3'); // Загрузка фоновой музыки
    console.log("Звуки загружены успешно"); // Проверка загрузки
  } catch (error) {
    console.error("Ошибка загрузки звуков:", error);
  }
}


function setup() {
  console.log("Setup запущен"); // Проверка, что setup выполняется
  let canvas = createCanvas(800, 600);
  canvas.mousePressed(mousePressed);
// Воспроизведение фоновой музыки
  if (bgMusic) {
    bgMusic.setVolume(musicVolume); // Устанавливаем громкость
    bgMusic.loop(); // Зацикливаем музыку
  }

  player = {
    x: 100,
    y: 300,
    width: 40,
    height: 60,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpForce: 12,
    isGrounded: false,
    facingRight: true,
    invincible: false,
    invincibleTimer: 0,
    canShoot: true
  };

  createPlatforms();
  createBackgroundItems();
  createEnemies();
  createCollectibles();
  createTraps();
}


function draw() {
  console.log("Draw запущен"); // Проверка, что draw выполняется
  if (inMenu) {
    drawMenu();
  } else if (gamePaused) {
    drawPauseMenu();
  } else if (gameCompleted) {
    drawGameCompleteScreen();
  } else {
    updateGame();
    drawGame();
  }
}


function updateGame() {
  updatePlayer();
  updateBullets();
  updateEnemies();
  updatePlatforms();
  updateCollectibles();
  updateTraps();
  updateCamera();
  checkPlayerDeath();

  if (player.invincible) {
    player.invincibleTimer--;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }

  if (gun.cooldown > 0) {
    gun.cooldown--;
  }
}

function drawGame() {
  background(135, 206, 235);
  drawBackgroundItems();
  drawPlatforms();
  drawTraps();
  drawCollectibles();
  drawEnemies();
  drawPlayer();
  drawHUD();
  drawBullets();
  updateBullets();
}

function drawMenu() {
  background(0);
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("2D Game", width / 2, height / 3);

  if (button(width / 2 - 100, height / 2, 200, 50, "Начать игру")) {
    inMenu = false;
  }

  textSize(20);
  text("Громкость музыки", width / 2, height / 2 + 80);
  musicVolume = slider(width / 2 - 100, height / 2 + 110, 200, musicVolume);

  text("Громкость эффектов", width / 2, height / 2 + 160);
  soundVolume = slider(width / 2 - 100, height / 2 + 190, 200, soundVolume);
}

function drawPauseMenu() {
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);

  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("Пауза", width / 2, height / 3);

  if (button(width / 2 - 100, height / 2, 200, 50, "Продолжить")) {
    gamePaused = false;
  }

  if (button(width / 2 - 100, height / 2 + 70, 200, 50, "В меню")) {
    gamePaused = false;
    inMenu = true;
    resetGame();
  }

  textSize(20);
  text("Громкость музыки", width / 2, height / 2 + 140);
  musicVolume = slider(width / 2 - 100, height / 2 + 170, 200, musicVolume);

  text("Громкость эффектов", width / 2, height / 2 + 220);
  soundVolume = slider(width / 2 - 100, height / 2 + 250, 200, soundVolume);

  if (bgMusic) bgMusic.setVolume(musicVolume);
}

function drawGameCompleteScreen() {
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);

  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("Игра завершена!", width / 2, height / 3);

  textSize(24);
  text("Ваш счет: " + score, width / 2, height / 2 - 50);

  if (button(width / 2 - 150, height / 2, 300, 50, "Играть снова")) {
    resetGame();
    gameCompleted = false;
    enemiesDefeated = 0;
    totalEnemiesSpawned = 0;
  }

  if (button(width / 2 - 150, height / 2 + 70, 300, 50, "Главное меню")) {
    resetGame();
    gameCompleted = false;
    enemiesDefeated = 0;
    totalEnemiesSpawned = 0;
    inMenu = true;
  }
}

function shoot() {
  let bulletX, bulletY;
  
  if (player.facingRight) {
    bulletX = player.x + player.width + gun.width;
  } else {
    bulletX = player.x - gun.width;
  }
  
  bulletY = player.y + player.height/2 - 2;
  
  bullets.push({
    x: bulletX,
    y: bulletY,
    width: 10,
    height: 4,
    speed: 10,
    direction: player.facingRight ? 1 : -1,
    active: true
  });
  
  gun.cooldown = gun.cooldownMax;
}

function keyPressed() {
  if (keyCode === ESCAPE) {
    if (!inMenu) {
      gamePaused = !gamePaused;
    }
    return false; // Предотвращаем действие по умолчанию (например, выход из полноэкранного режима)
  }

  // Управление персонажем
  if (key === ' ' && player.isGrounded && !gamePaused && !inMenu) {
    player.velocityY = -player.jumpForce; // Прыжок
    player.isGrounded = false;
    if (jumpSound) {
      jumpSound.setVolume(soundVolume);
      jumpSound.play();
    }
  }

  // Стрельба
  if (key === 'f' && !gamePaused && !inMenu && player.canShoot && gun.cooldown <= 0) {
    shoot();
  }

  // Управление влево/вправо
  if (keyCode === LEFT_ARROW && !gamePaused && !inMenu) {
    player.velocityX = -player.speed; // Движение влево
    player.facingRight = false;
  } else if (keyCode === RIGHT_ARROW && !gamePaused && !inMenu) {
    player.velocityX = player.speed; // Движение вправо
    player.facingRight = true;
  }
}

function keyReleased() {
  // Остановка движения при отпускании клавиш влево/вправо
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    player.velocityX = 0;
  }
}

function updatePlayer() {
  // Гравитация
  if (!player.isGrounded) {
    player.velocityY += 0.5; // Применяем гравитацию
  } else {
    player.velocityY = 0; // Останавливаем падение, если персонаж на земле
  }

  // Ограничение скорости падения
  if (player.velocityY > 15) {
    player.velocityY = 15;
  }


  // Обновление позиции
  let newX = player.x + player.velocityX;
  let newY = player.y + player.velocityY;

  // Проверка коллизий с платформами
  player.isGrounded = false;
  for (let platform of platforms) {
    if (
      newX + player.width > platform.x &&
      newX < platform.x + platform.width &&
      player.y + player.height <= platform.y &&
      newY + player.height >= platform.y
    ) {
      newY = platform.y - player.height;
      player.velocityY = 0;
      player.isGrounded = true;
    }
  }

  // Обновление позиции игрока
  player.x = newX;
  player.y = newY;

  // Ограничение игрока в пределах уровня
  player.x = constrain(player.x, 0, levelWidth - player.width);
  player.y = constrain(player.y, 0, levelHeight - player.height);
}

function drawPlayer() {
  push();
  translate(-cameraOffset.x, -cameraOffset.y);

  if (isFallingInPit) {
    push();
    translate(player.x + player.width / 2, player.y + player.height / 2);
    rotate(frameCount * 0.2);
    let scaleFactor = map(fallTimer, FALL_DURATION, 0, 1, 0.5);
    scale(scaleFactor);
    fill(255, 0, 0);
    rect(-player.width / 2, -player.height / 2, player.width, player.height);
    pop();
  } else {
    if (player.invincible && frameCount % 10 < 5) {
      fill(255, 0, 0, 150);
    } else {
      fill(255, 0, 0);
    }
    rect(player.x, player.y, player.width, player.height);

    fill(255);
    if (player.facingRight) {
      ellipse(player.x + player.width - 10, player.y + 15, 10, 10);
    } else {
      ellipse(player.x + 10, player.y + 15, 10, 10);
    }
  }
    // Отрисовка пистолета
  if (player.facingRight) {
    fill(139, 69, 19); // Коричневый цвет пистолета
    rect(player.x + player.width - 10, player.y + 20, 30, 10); // Пистолет справа
  } else {
    fill(139, 69, 19); // Коричневый цвет пистолета
    rect(player.x - 20, player.y + 20, 30, 10); // Пистолет слева
  }

  pop();
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];

    if (bullet.active) {
      bullet.x += bullet.speed * bullet.direction; // Двигаем пулю

      // Удаляем пули, вылетевшие за пределы уровня
      if (bullet.x < 0 || bullet.x > levelWidth) {
        bullets.splice(i, 1);
        continue;
      }

      // Проверка коллизий с врагами
      for (let j = enemies.length - 1; j >= 0; j--) {
        let enemy = enemies[j];

        if (collision(bullet, enemy)) {
          enemies.splice(j, 1); // Удаляем врага
          bullet.active = false; // Деактивируем пулю
          bullets.splice(i, 1); // Удаляем пулю
          score += 20; // Увеличиваем счет
          enemiesDefeated++;
		  if (killSound){
			  killSound.setVolume(soundVolume);
			  killSound.play();
		  }
          if (
            enemiesDefeated % ENEMIES_TO_SPAWN_NEW === 0 &&
            totalEnemiesSpawned < TOTAL_ENEMIES_TO_DEFEAT
          ) {
            if (random() > 0.5) {
              spawnGroundEnemy();
            } else {
              spawnFlyingEnemy();
            }
          }

          if (enemiesDefeated >= TOTAL_ENEMIES_TO_DEFEAT) {
            gameCompleted = true;
          }
          break;
        }
      }
    }
  }
}
function drawBullets() {
  push();
  translate(-cameraOffset.x, 0); // Учитываем смещение камеры по оси X

  for (let bullet of bullets) {
    if (bullet.active) {
      fill(255, 255, 0); // Красный цвет для пуль
      rect(bullet.x, bullet.y, bullet.width, bullet.height); // Отрисовка пули
    }
  }

  pop();
}

function collision(obj1, obj2) {
  return (
    obj1.x + obj1.width > obj2.x &&
    obj1.x < obj2.x + obj2.width &&
    obj1.y + obj1.height > obj2.y &&
    obj1.y < obj2.y + obj2.height
  );
}


function createPlatforms() {
  // Основная платформа
  platforms.push({
    x: 0, y: 500, width: levelWidth, height: 20, moving: false
  });
  
  // Добавьте дополнительные платформы
  for (let i = 0; i < 10; i++) {
    platforms.push({
      x: random(100, levelWidth-100),
      y: random(300, 450),
      width: random(80, 200),
      height: 15,
      moving: random() > 0.7,
      moveDirection: random() > 0.5 ? 1 : -1,
      moveSpeed: random(1, 3)
    });
  }
}

function updatePlatforms() {
  for (let platform of platforms) {
    if (platform.moving) {
      platform.x += platform.moveSpeed * platform.moveDirection;

      if (platform.x < 0 || platform.x + platform.width > levelWidth) {
        platform.moveDirection *= -1;
      }
    }
  }
}

function drawPlatforms() {
  push();
  translate(-cameraOffset.x, -cameraOffset.y);

  fill(100, 100, 100); 
  for (let platform of platforms) {
    rect(platform.x, platform.y, platform.width, platform.height);
  }

  pop();
}

function createBackgroundItems() {
  backgroundItems.push({
    x: 100,
    y: 100,
    type: 'sun'
  });

  for (let i = 0; i < 10; i++) {
    backgroundItems.push({
      x: random(0, levelWidth),
      y: random(50, 200),
      type: 'cloud',
      speed: random(0.2, 0.5)
    });
  }

  for (let i = 0; i < 5; i++) {
    backgroundItems.push({
      x: random(0, levelWidth),
      y: 450,
      type: 'mountain'
    });
  }
}

function drawBackgroundItems() {
  push();
  translate(-cameraOffset.x * 0.5, 0); // Параллакс-эффект

  for (let item of backgroundItems) {
    switch (item.type) {
      case 'sun':
        fill(255, 255, 0);
        ellipse(item.x, item.y, 80, 80);
        break;
      case 'cloud':
        fill(255);
        ellipse(item.x, item.y, 60, 40);
        ellipse(item.x + 30, item.y, 70, 50);
        ellipse(item.x + 60, item.y, 60, 40);
        break;
      case 'mountain':
        fill(139, 137, 137);
        triangle(
          item.x, item.y,
          item.x + 200, item.y - 150,
          item.x + 400, item.y
        );
        break;
    }
  }

  pop();
}

function createEnemies() {
  enemies = [];
  for (let i = 0; i < 3; i++) {
    spawnGroundEnemy();
  }
  for (let i = 0; i < 2; i++) {
    spawnFlyingEnemy();
  }
}

function spawnGroundEnemy() {
  enemies.push({
    x: random(200, levelWidth - 200),
    y: 440,
    width: 40,
    height: 40,
    speed: random(1, 2),
    direction: random() > 0.5 ? 1 : -1,
    health: 1,
    type: 'ground'
  });
  totalEnemiesSpawned++;
}

function spawnFlyingEnemy() {
  enemies.push({
    x: random(200, levelWidth - 200),
    y: random(100, 300),
    width: 30,
    height: 30,
    speed: random(1, 1.5),
    health: 1,
    type: 'flying',
    detectionRange: 200
  });
  totalEnemiesSpawned++;
}


function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];

    if (enemy.type === 'ground') {
      enemy.x += enemy.speed * enemy.direction;

      if (enemy.x < 0 || enemy.x + enemy.width > levelWidth) {
        enemy.direction *= -1;
      }
    } else if (enemy.type === 'flying') {
      let dx = player.x - enemy.x;
      let dy = player.y - enemy.y;
      let distance = sqrt(dx * dx + dy * dy);

      if (distance < enemy.detectionRange) {
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
      } else {
        enemy.x += random(-1, 1);
        enemy.y += random(-1, 1);
      }
    }

    enemy.x = constrain(enemy.x, 0, levelWidth - enemy.width);
    enemy.y = constrain(enemy.y, 50, 450); // Чтобы не улетали за границы

    if (
      !player.invincible &&
      player.x + player.width > enemy.x &&
      player.x < enemy.x + enemy.width &&
      player.y + player.height > enemy.y &&
      player.y < enemy.y + enemy.height
    ) {
      health--;
      player.invincible = true;
      player.invincibleTimer = 60; // 1 секунда неуязвимости

      if (hurtSound) {
        hurtSound.setVolume(soundVolume);
        hurtSound.play();
      }

      // Отталкивание игрока
      if (player.x < enemy.x) {
        player.velocityX = -5; // Уменьшите значение для меньшего отталкивания
      } else {
        player.velocityX = 5;
      }
      player.velocityY = -5;

      // Ограничение позиции игрока
      player.x = constrain(player.x, 0, levelWidth - player.width);
      player.y = constrain(player.y, 0, levelHeight - player.height);
    }
  }
}
  

function drawEnemies() {
  push();
  translate(-cameraOffset.x, -cameraOffset.y);

  for (let enemy of enemies) {
    if (enemy.type === 'ground') {
      fill(0, 0, 255); // Синий для наземных врагов
    } else {
      fill(255, 0, 255); // Фиолетовый для летающих врагов
    }
      rect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
	pop();
  }

function createCollectibles() {
  for (let i = 0; i < 20; i++) {
    collectibles.push({
      x: random(50, levelWidth - 50),
      y: random(100, 450),
      width: 20,
      height: 20,
      type: 'coin',
      collected: false,
      animation: 0
    });
  }
}

function updateCollectibles() {
  for (let i = collectibles.length - 1; i >= 0; i--) {
    let item = collectibles[i];

    if (!item.collected) {
      item.animation += 0.1;

      if (
        player.x + player.width > item.x &&
        player.x < item.x + item.width &&
        player.y + player.height > item.y &&
        player.y < item.y + item.height
      ) {
        item.collected = true;
        score += 10;

        if (collectSound) {
          collectSound.setVolume(soundVolume);
          collectSound.play();
        }
      }
    }
  }
}

function drawCollectibles() {
  push();
  translate(-cameraOffset.x, -cameraOffset.y);

  for (let item of collectibles) {
    if (!item.collected) {
      let yOffset = sin(item.animation) * 5;

      if (item.type === 'coin') {
        fill(255, 215, 0); // Золотой цвет
        ellipse(item.x + item.width / 2, item.y + item.height / 2 + yOffset, item.width, item.height);
      }
    }
  }
  pop();
}

function resetAfterFall() {
  isFallingInPit = false;
  pitFallSpeed = 3;
  health--;

  if (health <= 0) {
    resetGame();
  } else {
    let respawnX = player.x;
    let respawnY = 300; // Начальная высота

    for (let platform of platforms) {
      if (platform.x < respawnX && platform.x + platform.width > respawnX) {
        respawnY = platform.y - player.height;
        break;
      }
    }

    player.x = respawnX;
    player.y = respawnY;
    player.velocityX = 0;
    player.velocityY = 0;
    player.invincible = true;
    player.invincibleTimer = 120;
  }
}

function createTraps() {
  for (let i = 0; i < 5; i++) {
    traps.push({
      x: random(200, levelWidth - 200),
      y: 500,
      width: random(50, 150),
      height: 100,
      type: 'pit',
      hasCollision: false
    });
  }

  for (let i = 0; i < 10; i++) {
    traps.push({
      x: random(200, levelWidth - 200),
      y: 480,
      width: 40,
      height: 20,
      type: 'spike',
      hasCollision: true
    });
  }
}

function updateTraps() {
  if (!isFallingInPit) {
    for (let trap of traps) {
      if (trap.type === 'pit') {
        if (
          player.x + player.width > trap.x &&
          player.x < trap.x + trap.width &&
          player.y + player.height >= trap.y - 5 &&
          player.y + player.height <= trap.y + 10
        ) {
          isFallingInPit = true;
          fallTimer = FALL_DURATION;
      	  if (hurtSound) {
        	hurtSound.setVolume(soundVolume);
        	hurtSound.play();
		  }
		  
          player.velocityY = pitFallSpeed;
          player.velocityX = 0;
          break;
        }
      }
    }
  }

  if (isFallingInPit) {
    fallTimer--;
    player.y += pitFallSpeed;
    pitFallSpeed *= 1.05;

    if (fallTimer <= 0) {
      resetAfterFall();
    }
    return;
  }

  for (let trap of traps) {
    if (
      trap.hasCollision &&
      player.x + player.width > trap.x &&
      player.x < trap.x + trap.width &&
      player.y + player.height > trap.y &&
      player.y < trap.y + trap.height
    ) {
      if (trap.type === 'spike' && !player.invincible) {
        health--;
        player.invincible = true;
        player.invincibleTimer = 60;

        if (hurtSound) {
          hurtSound.setVolume(soundVolume);
          hurtSound.play();
        }

        player.velocityY = -10;
      }
    }
  }
}

function drawTraps() {
  push();
  translate(-cameraOffset.x, -cameraOffset.y);

  for (let trap of traps) {
    if (trap.type === 'pit') {
      fill(0);
      rect(trap.x, trap.y, trap.width, trap.height);

      fill(139, 69, 19);
      rect(trap.x, trap.y - 5, trap.width, 5);
    } else if (trap.type === 'spike') {
      fill(100);
      beginShape();
      vertex(trap.x, trap.y + trap.height);
      vertex(trap.x + trap.width / 2, trap.y);
      vertex(trap.x + trap.width, trap.y + trap.height);
      endShape(CLOSE);
    }
  }
  pop();
}

function updateCamera() {
  cameraOffset.x = player.x - width / 2;
  cameraOffset.x = constrain(cameraOffset.x, 0, levelWidth - width);
}

function checkPlayerDeath() {
  if (health <= 0 || player.y > levelHeight) {
    score = 0;
    resetGame();
  }
}

function drawHUD() {
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Очки: " + score, 20, 20);

  for (let i = 0; i < health; i++) {
    fill(255, 0, 0);
    rect(20 + i * 30, 60, 25, 25);
  }
}

function resetGame() {
  player.x = 100;
  player.y = 300;
  player.velocityX = 0;
  player.velocityY = 0;
  health = 3;
  score = 0;
  isFallingInPit = false;
  pitFallSpeed = 3;
  bullets = [];

  for (let item of collectibles) {
    item.collected = false;
  }

  enemiesDefeated = 0;
  totalEnemiesSpawned = 0;
  createEnemies();
}

function button(x, y, w, h, label) {
  let over = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;

  fill(over ? 200 : 150);
  rect(x, y, w, h, 5);

  fill(0);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2);

  return over && mouseIsPressed && mouseButton === LEFT;
}

function slider(x, y, w, value) {
  let handleX = x + value * w;
  let overHandle = dist(mouseX, mouseY, handleX, y + 10) < 10;

  fill(200);
  rect(x, y, w, 5, 3);

  if (mouseIsPressed && (overHandle || (mouseX > x && mouseX < x + w && mouseY > y - 10 && mouseY < y + 20))) {
    value = constrain((mouseX - x) / w, 0, 1);
  }

  fill(overHandle || (mouseIsPressed && mouseX > x && mouseX < x + w) ? 180 : 150);
  ellipse(handleX, y + 10, 20, 20);

  return value;
}

function mousePressed() {
  // Обработка нажатия мыши
}

function mouseReleased() {
  // Обработка отпускания кнопки мыши
}