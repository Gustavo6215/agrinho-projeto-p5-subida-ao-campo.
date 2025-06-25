let player;
let platforms = [];
let fieldPlatforms = [];
let gravity = 0.6;
let jumpForce = -12;
let scrollY = 0;
let gameOver = false;

let leftButton, rightButton, jumpButton;
let moveLeft = false, moveRight = false;
let retryButton = null;

let buildings = [];
let progress = 0;
let reachedField = false;

// Tela inicial
let gameStarted = false;
let startButton = null;

function setup() {
  createCanvas(380, 500);
  createMobileControls();
  textFont('Arial');
}

function draw() {
  background(135, 206, 250);

  if (!gameStarted) {
    displayStartScreen();
    return;
  }

  if (progress < 100) {
    drawCity();
  } else {
    drawField();
  }

  if (gameOver) {
    displayGameOver();
    return;
  }

  translate(0, scrollY);

  if (progress < 100) {
    for (let p of platforms) {
      p.display();
    }
  } else {
    for (let p of fieldPlatforms) {
      p.display();
    }
  }

  player.update();
  player.display();

  if (progress < 100) {
    player.checkPlatformCollision(platforms);
  } else {
    player.checkPlatformCollision(fieldPlatforms);
  }

  if (player.y + scrollY < height / 2) {
    scrollY = -(player.y - height / 2);
  }

  if (progress < 100) {
    generateNewPlatforms();
    removeOffscreenPlatforms();
  }

  if (player.y > height) {
    gameOver = true;
  }

  drawProgressBar();
  drawControls();

  if (reachedField) {
    displayReachedField();
  }
}

function displayStartScreen() {
  fill(0, 180);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(22);
  text("Chegue a 100% para chegar no campo", width / 2, height / 2 - 60);

  if (!startButton) {
    let w = 160;
    let h = 50;
    let x = width / 2 - w / 2;
    let y = height / 2;
    startButton = { x, y, w, h };
  }

  fill(255);
  stroke(0);
  rect(startButton.x, startButton.y, startButton.w, startButton.h, 10);
  noStroke();
  fill(0);
  textSize(20);
  text("Começar", startButton.x + startButton.w / 2, startButton.y + startButton.h / 2);
}

function startGame() {
  player = new Player(width / 2, height - 50);
  platforms = [];

  platforms.push(new Platform(width / 2 - 50, height - 20, 100, 10));

  for (let i = 1; i <= 30; i++) {
    let x = random(50, width - 100);
    let y = height - i * 100;
    platforms.push(new Platform(x, y, 80, 10));
  }

  generateBuildings();

  gravity = 0.6;
  jumpForce = -12;
  scrollY = 0;
  gameOver = false;
  retryButton = null;
  progress = 0;
  reachedField = false;
  fieldPlatforms = [];
}

function displayGameOver() {
  resetMatrix();
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(36);
  text("GAME OVER", width / 2, height / 2 - 30);

  if (!retryButton) {
    let w = 200;
    let h = 50;
    let x = width / 2 - w / 2;
    let y = height / 2 + 20;
    retryButton = { x, y, w, h };
  }

  fill(255);
  stroke(0);
  rect(retryButton.x, retryButton.y, retryButton.w, retryButton.h, 10);
  noStroke();
  fill(0);
  textSize(20);
  text("Tentar Novamente", retryButton.x + retryButton.w / 2, retryButton.y + retryButton.h / 2);
}

function displayReachedField() {
  resetMatrix();
  fill(0, 150);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(28);
  text("Você chegou ao campo!", width / 2, height / 2);
}

function generateNewPlatforms() {
  let highestY = min(...platforms.map(p => p.y));
  while (highestY > player.y - 600) {
    let x = random(50, width - 100);
    let y = highestY - random(80, 120);
    platforms.push(new Platform(x, y, 80, 10));
    highestY = y;
  }
}

function removeOffscreenPlatforms() {
  platforms = platforms.filter(p => p.y + scrollY < height + 100);
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vy = 0;
    this.size = 30;
    this.onGround = false;
  }

  update() {
    this.vy += gravity;
    this.y += this.vy;

    if (keyIsDown(65) || moveLeft) {
      this.x -= 5;
    }
    if (keyIsDown(68) || moveRight) {
      this.x += 5;
    }

    this.x = constrain(this.x, 0, width - this.size);
  }

  display() {
    fill(255, 100, 100);
    rect(this.x, this.y, this.size, this.size);
  }

  jump() {
    if (this.onGround) {
      this.vy = jumpForce;
      this.onGround = false;
    }
  }

  checkPlatformCollision(platforms) {
    this.onGround = false;
    for (let p of platforms) {
      if (
        this.vy >= 0 &&
        this.x + this.size > p.x &&
        this.x < p.x + p.w &&
        this.y + this.size >= p.y &&
        this.y + this.size <= p.y + p.h
      ) {
        this.y = p.y - this.size;
        this.vy = 0;
        this.onGround = true;

        if (!p.visited && progress < 100) {
          progress += 1;
          progress = constrain(progress, 0, 100);
          p.visited = true;

          if (progress >= 100 && !reachedField) {
            reachedField = true;
            player.y -= 100;
            scrollY -= 100;

            fieldPlatforms = [];

            let platformY = player.y + player.size + 10;
            fieldPlatforms.push(new Platform(0, platformY, width, 20, color(0, 200, 0), false));

            for (let i = 0; i < width; i += 40) {
              fieldPlatforms.push(new Platform(i, platformY - 20, 10, 20, color(0, 200, 0), false));
            }
          }
        }
      }
    }
  }
}

class Platform {
  constructor(x, y, w, h, col, visible = true) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.col = col || color(255, 0, 0);
    this.visible = visible;
    this.visited = false;
  }

  display() {
    if (!this.visible) return;
    fill(this.col);
    rect(this.x, this.y, this.w, this.h);
  }
}

function generateBuildings() {
  buildings = [];
  let numBuildings = 8;
  for (let i = 0; i < numBuildings; i++) {
    let buildingWidth = random(40, 80);
    let buildingHeight = random(150, 400);
    let x = i * (width / numBuildings) + random(-10, 10);
    let y = height - buildingHeight;
    let colorShade = random(80, 130);

    let windows = [];
    let cols = int(buildingWidth / 15);
    let rows = int(buildingHeight / 20);

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        let wx = x + 5 + c * 12;
        let wy = y + 5 + r * 15;
        let lit = random() < 0.5;
        windows.push({ x: wx, y: wy, lit });
      }
    }

    buildings.push({ x, y, w: buildingWidth, h: buildingHeight, shade: colorShade, windows });
  }
}

function drawCity() {
  resetMatrix();
  noStroke();
  fill(100);
  rect(0, height - 50, width, 50);

  for (let b of buildings) {
    fill(b.shade);
    rect(b.x, b.y + scrollY, b.w, b.h);

    for (let win of b.windows) {
      fill(win.lit ? color(255, 255, 100) : color(50));
      rect(win.x, win.y + scrollY, 8, 10, 2);
    }
  }
}

function drawField() {
  resetMatrix();
  noStroke();

  fill(135, 206, 250);
  rect(0, 0, width, height);

  fill(255, 255, 0);
  ellipse(50, 50, 80, 80);

  fill(34, 139, 34);
  rect(0, height - 50, width, 50);

  for (let i = 0; i < width; i += 40) {
    fill(255);
    rect(i, height - 70, 10, 30);
    rect(i + 10, height - 60, 30, 5);
    rect(i + 10, height - 50, 30, 5);
  }

  for (let i = 0; i < 3; i++) {
    let x = i * 120 + 60;
    fill(139, 69, 19);
    rect(x, height - 120, 15, 70);
    fill(34, 139, 34);
    ellipse(x + 7, height - 130, 60, 60);
  }

  for (let i = 0; i < 6; i++) {
    let x = i * 60 + 20;
    fill(255, 0, 0);
    ellipse(x, height - 55, 10, 10);
    fill(255, 255, 0);
    ellipse(x, height - 55, 5, 5);
  }
}

function drawProgressBar() {
  resetMatrix();
  fill(200);
  rect(10, 10, 100, 15);
  fill(0, 200, 0);
  rect(10, 10, map(progress, 0, 100, 0, 100), 15);
  noStroke();
  fill(0);
  textSize(12);
  textAlign(LEFT, CENTER);
  text(int(progress) + "%", 115, 18);
}

function createMobileControls() {
  let size = 50;
  let y = height - size - 10;
  leftButton = { x: 10, y: y, w: size, h: size };
  rightButton = { x: 70, y: y, w: size, h: size };
  jumpButton = { x: width - size - 10, y: y, w: size, h: size };
}

function drawControls() {
  resetMatrix();
  fill(255, 200);
  rect(leftButton.x, leftButton.y, leftButton.w, leftButton.h, 10);
  rect(rightButton.x, rightButton.y, rightButton.w, rightButton.h, 10);
  rect(jumpButton.x, jumpButton.y, jumpButton.w, jumpButton.h, 10);

  fill(0);
  textAlign(CENTER, CENTER);
  textSize(24);
  text("←", leftButton.x + leftButton.w / 2, leftButton.y + leftButton.h / 2);
  text("→", rightButton.x + rightButton.w / 2, rightButton.y + rightButton.h / 2);
  text("↑", jumpButton.x + jumpButton.w / 2, jumpButton.y + jumpButton.h / 2);
}

function mousePressed() {
  if (!gameStarted && startButton && isInside(mouseX, mouseY, startButton)) {
    gameStarted = true;
    startGame();
    return;
  }

  if (gameOver && retryButton && isInside(mouseX, mouseY, retryButton)) {
    startGame();
    return;
  }

  if (isInside(mouseX, mouseY, leftButton)) moveLeft = true;
  if (isInside(mouseX, mouseY, rightButton)) moveRight = true;
  if (isInside(mouseX, mouseY, jumpButton)) player.jump();
}

function mouseReleased() {
  moveLeft = false;
  moveRight = false;
}

function touchStarted() {
  if (!gameStarted && startButton) {
    for (let t of touches) {
      if (isInside(t.x, t.y, startButton)) {
        gameStarted = true;
        startGame();
        return false;
      }
    }
  }

  if (gameOver && retryButton) {
    for (let t of touches) {
      if (isInside(t.x, t.y, retryButton)) {
        startGame();
        return false;
      }
    }
  }

  for (let t of touches) {
    if (isInside(t.x, t.y, leftButton)) moveLeft = true;
    if (isInside(t.x, t.y, rightButton)) moveRight = true;
    if (isInside(t.x, t.y, jumpButton)) player.jump();
  }
  return false;
}

function touchEnded() {
  moveLeft = false;
  moveRight = false;
  return false;
}

function isInside(x, y, btn) {
  return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
}

function keyPressed() {
  if (key === 'w' || key === 'W' || keyCode === UP_ARROW) {
    player.jump();
  }
}
