// Ottieni il canvas e il suo contesto 2D
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Per evitare l'anti-aliasing e mantenere l'effetto pixelato
ctx.imageSmoothingEnabled = false;

// Imposta una risoluzione bassa per il gioco
const TILE_SIZE = 16;
const GAME_WIDTH = 320; // 20 tiles
const GAME_HEIGHT = 192; // 12 tiles
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

console.log('Game.js caricato. Canvas pronto.');

let gameState = 'playing';
const enemies = [];
const npcs = [];

// --- Generatore di Sprite ---
function createNpcSpriteDataURL() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const colors = {
        'b': '#FFFFFF', // Beard
        's': '#F0D2B6', // Skin
        'e': '#000000', // Eyes
        'r': '#8B0000'  // Robe (DarkRed)
    };
    const design = [
        "    rrrr    ",
        "   rrrrrr   ",
        "  rrssrrss  ",
        "  r s  s r  ",
        "  r s  s r  ",
        "   rssrss   ",
        "  bbbbbbbb  ",
        " bbbbbbbbbb ",
        "bbbbbbbbbbbb",
        " rrrrrrrrrr ",
        "rrrrrrrrrrrr",
        "rrrrrrrrrrrr",
        " r r r r r r",
        "  r     r   "
    ];
    for (let y = 0; y < design.length; y++) {
        for (let x = 0; x < design[y].length; x++) {
            if (colors[design[y][x]]) {
                ctx.fillStyle = colors[design[y][x]];
                ctx.fillRect(x + 2, y + 1, 1, 1);
            }
        }
    }
    return canvas.toDataURL();
}
function createEnemySpriteDataURL() {
    const frameWidth = 16;
    const frameHeight = 16;
    const numFrames = 2;
    const canvas = document.createElement('canvas');
    canvas.width = frameWidth * numFrames;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d');
    const colors = { 'g': '#32CD32', 'e': '#000000', 'w': '#FFFFFF' };

    const animation = [
        [ // Frame 1
            "    gggg    ",
            "  gggggggg  ",
            " gggwggwg g ",
            "gggggggggggg",
            "gggggggggggg",
            " gggggggggg ",
            "  gggggggg  ",
            "   gggggg   "
        ],
        [ // Frame 2
            "            ",
            "    gggg    ",
            "  gggggggg  ",
            " gggwggwg g ",
            "gggggggggggg",
            "gggggggggggg",
            " gggggggggg ",
            "  gggggggg  "
        ]
    ];

    for (let frame = 0; frame < numFrames; frame++) {
        const design = animation[frame];
        for (let y = 0; y < design.length; y++) {
            for (let x = 0; x < design[y].length; x++) {
                const color = colors[design[y][x]];
                if (color) {
                    const canvasX = x + frame * frameWidth;
                    const canvasY = y + 4;
                    ctx.fillStyle = color;
                    ctx.fillRect(canvasX, canvasY, 1, 1);
                }
            }
        }
    }
    return canvas.toDataURL();
}

function createCharacterSpriteDataURL() {
    const frameWidth = 16;
    const frameHeight = 16;
    const numFrames = 2;
    const numDirections = 4;
    const canvas = document.createElement('canvas');
    canvas.width = frameWidth * numFrames;
    canvas.height = frameHeight * numDirections;
    const ctx = canvas.getContext('2d');

    const colors = {
        'b': '#8B4513', 's': '#F0D2B6', 'e': '#000000',
        'o': '#4169E1', 'l': '#ADD8E6', 'S': '#808080' // Shadow
    };

    const animation = [
        [ // Down
            ["   bbbbbb   ","  bssssssb  "," bssbssbssb "," bssbssbssb ","  ssssssss  ","   s e se   ","   ssssss   ","  oooooooo  "," oooooooooo "," oooooooooo "," ooo oo ooo "," o  o  o  o ","    o  o    ","   o    o   ","  o      o  ","   S S S S  "],
            ["   bbbbbb   ","  bssssssb  "," bssbssbssb "," bssbssbssb ","  ssssssss  ","   s e se   ","   ssssss   ","  oooooooo  "," oooooooooo "," oooooooooo "," ooo oo ooo ","  o o o o   ","   o   o    ","  l     l   "," l       l  ","  S S S S   "]
        ],
        [ // Left
            ["   bbbbbb   ","  bbsssssb  "," bbbssbssb  ","  bssssssb  ","   sse ssb  ","    ssss b  ","   ooooob   ","  oooooob   "," ooooooob   "," ooooooob   "," oooooo b   "," o oooo b   ","  l ooo b   ","    l  b    ","       l    ","   S S S S  "],
            ["   bbbbbb   ","  bbsssssb  "," bbbssbssb  ","  bssssssb  ","   sse ssb  ","    ssss b  ","   ooooob   ","  oooooob   "," ooooooob   "," ooooooob   "," oooooo b   "," o oooo b   ","  o ooo b   ","  l  l  b   "," l          ","  S S S S   "]
        ],
        [ // Right
            ["   bbbbbb   ","  bsssssbb  ","  bssbsssbbb ","  bssssssb  ","  bss e ssb  ","  b ssss    ","   booooo   ","   boooooo  ","   booooooo ","   booooooo ","   b oooooo ","   b oooo o ","   b ooo l  ","    b  l    ","    l       ","   S S S S  "],
            ["   bbbbbb   ","  bsssssbb  ","  bssbsssbbb ","  bssssssb  ","  bss e ssb  ","  b ssss    ","   booooo   ","   boooooo  ","   booooooo ","   booooooo ","   b oooooo ","   b oooo o ","   b ooo o  ","   b  l  l  ","          l ","  S S S S   "]
        ],
        [ // Up
            ["   bbbbbb   ","  bssssssb  "," bssbssbssb "," bssbssbssb ","  ssssssss  ","   s e se   ","   ssssss   ","  oooooooo  "," oooooooooo "," oooooooooo "," ooo oo ooo "," o  o  o  o ","    o  o    ","   o    o   ","  o      o  ","   S S S S  "],
            ["   bbbbbb   ","  bssssssb  "," bssbssbssb "," bssbssbssb ","  ssssssss  ","   s e se   ","   ssssss   ","  oooooooo  "," oooooooooo "," oooooooooo "," ooo oo ooo ","  o o o o   ","   o   o    ","  l     l   "," l       l  ","  S S S S   "]
        ]
    ];

    for (let dir = 0; dir < numDirections; dir++) {
        for (let frame = 0; frame < numFrames; frame++) {
            const design = animation[dir][frame];
            for (let y = 0; y < design.length; y++) {
                for (let x = 0; x < design[y].length; x++) {
                    const color = colors[design[y][x]];
                    if (color) {
                        const canvasX = x + frame * frameWidth;
                        const canvasY = y + dir * frameHeight;
                        ctx.fillStyle = color;
                        ctx.fillRect(canvasX, canvasY, 1, 1);
                    }
                }
            }
        }
    }
    return canvas.toDataURL();
}

// --- Personaggio ---
const player = {
  x: GAME_WIDTH / 2 - 8,
  y: GAME_HEIGHT / 2 - 8,
  width: 16,
  height: 16,
  speed: 2,
  spriteSheet: new Image(),
  resources: 0,
  health: 100,
  maxHealth: 100,
  direction: 'down',
  isAttacking: false,
  attackCooldown: 500, // ms
  lastAttackTime: 0,
  isHit: false,
  isMoving: false,
  animationFrame: 0,
  animationSpeed: 200, // ms per frame
  lastFrameTime: 0,
  questLog: {}
};
player.spriteSheet.src = createCharacterSpriteDataURL();

// --- Mappa e Risorse ---
function generateMap(cols, rows) {
    const tiles = Array.from({ length: rows }, () => Array(cols).fill(0));
    // Bordi di muri
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                tiles[r][c] = 1;
            }
        }
    }
    // Muri interni casuali
    for (let i = 0; i < (cols * rows) * 0.1; i++) {
        const r = Math.floor(Math.random() * (rows - 2)) + 1;
        const c = Math.floor(Math.random() * (cols - 2)) + 1;
        tiles[r][c] = 1;
    }
    // Risorse casuali
    for (let i = 0; i < (cols * rows) * 0.05; i++) {
        const r = Math.floor(Math.random() * (rows - 2)) + 1;
        const c = Math.floor(Math.random() * (cols - 2)) + 1;
        if (tiles[r][c] === 0) tiles[r][c] = 2;
    }
    
    // Genera nemici
    let enemyCount = 0;
    while (enemyCount < 15) {
        const r = Math.floor(Math.random() * (rows - 2)) + 1;
        const c = Math.floor(Math.random() * (cols - 2)) + 1;
        if (tiles[r][c] === 0) {
            enemies.push({
                x: c * TILE_SIZE,
                y: r * TILE_SIZE,
                width: 16,
                height: 16,
                speed: Math.random() < 0.5 ? 1 : -1,
                sprite: new Image(),
                direction: Math.random() < 0.5 ? 'horizontal' : 'vertical',
                health: 30,
                maxHealth: 30,
                attackRange: 20,
                attackDamage: 10,
                attackCooldown: 1000, // 1 secondo
                lastAttackTime: 0,
                animationFrame: 0,
                animationSpeed: 400,
                lastFrameTime: 0,
                isHit: false
            });
            enemyCount++;
        }
    }
    return tiles;
}

const map = {
    cols: 50,
    rows: 30,
    tiles: generateMap(50, 30),
    colors: {
        0: '#3D4849', // Pavimento
        1: '#2F2F2F', // Muro
        2: '#FFD700'  // Risorsa
    }
};

// Assegna lo sprite a ogni nemico
const enemySpriteSrc = createEnemySpriteDataURL();
enemies.forEach(enemy => enemy.sprite.src = enemySpriteSrc);

function spawnNpcs() {
    const wiseMan = {
        x: 10 * TILE_SIZE,
        y: 5 * TILE_SIZE,
        width: 16,
        height: 16,
        sprite: new Image(),
        quest: {
            id: 'collect_crystals',
            title: 'Raccogli 5 Cristalli',
            goal: 5,
        },
        dialogue: {
            start: "Salute, avventuriero! Raccogli 5 cristalli per me.",
            progress: "Non ne hai ancora abbastanza. Te ne mancano ",
            end: "Eccellente! Hai trovato tutti i cristalli."
        }
    };
    wiseMan.sprite.src = createNpcSpriteDataURL();
    npcs.push(wiseMan);

    // Assicurati che il tile sotto l'NPC sia calpestabile
    const tileX = Math.floor(wiseMan.x / TILE_SIZE);
    const tileY = Math.floor(wiseMan.y / TILE_SIZE);
    if(map.tiles[tileY]) map.tiles[tileY][tileX] = 0;
}
spawnNpcs();

// --- Telecamera ---
const camera = {
    x: 0,
    y: 0
};

// --- Sistema di Dialogo e Missioni ---
const dialogueManager = {
    isActive: false,
    text: "",
    speaker: null,
    
    show(npc) {
        if (this.isActive) { // Se è già attivo, gestisce l'interazione successiva
            this.handleInteraction();
            return;
        }

        this.speaker = npc;
        const questId = npc.quest.id;
        const questInLog = player.questLog[questId];

        if (!questInLog) {
            this.text = `[E] per accettare: "${npc.dialogue.start}"`;
        } else if (questInLog.status === 'active') {
            const remaining = npc.quest.goal - player.resources;
            if (remaining > 0) {
                this.text = npc.dialogue.progress + remaining + ".";
            } else {
                this.text = `[E] per completare: "${npc.dialogue.end}"`;
            }
        } else if (questInLog.status === 'completed') {
            this.text = "Grazie ancora per il tuo aiuto.";
        }
        
        this.isActive = true;
    },

    hide() {
        this.isActive = false;
        this.text = "";
        this.speaker = null;
    },

    handleInteraction() {
        if (!this.isActive || !this.speaker) return;

        const questId = this.speaker.quest.id;
        const questInLog = player.questLog[questId];

        if (!questInLog) {
            player.questLog[questId] = { status: 'active' };
            console.log(`Missione accettata: ${questId}`);
            this.hide();
        } else if (questInLog.status === 'active') {
            const remaining = this.speaker.quest.goal - player.resources;
            if (remaining <= 0) {
                questInLog.status = 'completed';
                console.log(`Missione completata: ${questId}`);
                player.health = Math.min(player.maxHealth, player.health + 50);
            }
            this.hide();
        } else {
            this.hide();
        }
    }
};

// --- Input Handler ---
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  ' ': false, // Barra spaziatrice per l'attacco
  'r': false, // Tasto R per riavviare
  'e': false  // Tasto E per interagire
};

function restartGame() {
    console.log("Riavvio del gioco...");
    // Reset del giocatore
    player.health = player.maxHealth;
    player.resources = 0;
    player.x = map.cols * TILE_SIZE / 2;
    player.y = map.rows * TILE_SIZE / 2;
    player.direction = 'down';

    // Rigenera la mappa e i nemici
    enemies.length = 0;
    map.tiles = generateMap(map.cols, map.rows);
    const enemySpriteSrc = createEnemySpriteDataURL();
    enemies.forEach(enemy => enemy.sprite.src = enemySpriteSrc);

    // Resetta lo stato del gioco
    gameState = 'playing';
}

window.addEventListener('keydown', (e) => {
  if (e.key in keys) {
    keys[e.key] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key in keys) {
    keys[e.key] = false;
  }
});


// --- Controlli Touch ---
const controls = {
    dpad: {
        up:    { x: 50, y: GAME_HEIGHT - 80, w: 40, h: 35 },
        down:  { x: 50, y: GAME_HEIGHT - 40, w: 40, h: 35 },
        left:  { x: 5,  y: GAME_HEIGHT - 60, w: 40, h: 35 },
        right: { x: 95, y: GAME_HEIGHT - 60, w: 40, h: 35 },
        color: 'rgba(200, 200, 200, 0.4)'
    },
    attackButton: {
        x: GAME_WIDTH - 60,
        y: GAME_HEIGHT - 70,
        w: 50,
        h: 50,
        color: 'rgba(200, 50, 50, 0.5)'
    }
};

function isInside(px, py, rect) {
    return px > rect.x && px < rect.x + rect.w && py > rect.y && py < rect.y + rect.h;
}

function handleTouch(e) {
    e.preventDefault();
    // Reset keys
    keys.ArrowUp = keys.ArrowDown = keys.ArrowLeft = keys.ArrowRight = false;
    keys[' '] = false;

    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const touchX = (touch.clientX / canvas.clientWidth) * GAME_WIDTH;
        const touchY = (touch.clientY / canvas.clientHeight) * GAME_HEIGHT;

        // D-pad
        if (isInside(touchX, touchY, controls.dpad.up))    keys.ArrowUp = true;
        if (isInside(touchX, touchY, controls.dpad.down))  keys.ArrowDown = true;
        if (isInside(touchX, touchY, controls.dpad.left))  keys.ArrowLeft = true;
        if (isInside(touchX, touchY, controls.dpad.right)) keys.ArrowRight = true;
        
        // Attack Button
        if (isInside(touchX, touchY, controls.attackButton)) {
            keys[' '] = true;
        }
    }
}

canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });
canvas.addEventListener('touchend', handleTouch, { passive: false });


// --- Game Loop ---
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function updateEnemies() {
    const now = Date.now();
    enemies.forEach(enemy => {
        // --- Logica di movimento ---
        let targetX = enemy.x;
        let targetY = enemy.y;
        
        if (enemy.direction === 'horizontal') targetX += enemy.speed;
        else targetY += enemy.speed;

        const nextTopLeft = checkCollision(targetX, targetY);
        const nextTopRight = checkCollision(targetX + enemy.width - 1, targetY);
        const nextBottomLeft = checkCollision(targetX, targetY + enemy.height - 1);
        const nextBottomRight = checkCollision(targetX + enemy.width - 1, targetY + enemy.height - 1);

        if (nextTopLeft || nextTopRight || nextBottomLeft || nextBottomRight) {
            enemy.speed *= -1;
        } else {
            enemy.x = targetX;
            enemy.y = targetY;
        }

        // --- Logica di attacco ---
        const distanceX = player.x - enemy.x;
        const distanceY = player.y - enemy.y;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        if (distance < enemy.attackRange && now - enemy.lastAttackTime > enemy.attackCooldown) {
            player.health -= enemy.attackDamage;
            enemy.lastAttackTime = now;
            player.isHit = true;
            console.log(`Giocatore colpito! Vita rimasta: ${player.health}`);
            setTimeout(() => { player.isHit = false; }, 150);
        }

        // --- Logica di animazione ---
        if (now - enemy.lastFrameTime > enemy.animationSpeed) {
            enemy.animationFrame = (enemy.animationFrame + 1) % 2; // 2 frames
            enemy.lastFrameTime = now;
        }
    });
}

function checkCollision(x, y) {
    // Controlla se le coordinate sono fuori dalla mappa
    if (x < 0 || y < 0 || x >= map.cols * TILE_SIZE || y >= map.rows * TILE_SIZE) {
        return true;
    }
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    return map.tiles[tileY][tileX] === 1; // Ritorna true se è un muro
}

function update() {
  if (gameState === 'gameOver') {
    if (keys['r']) {
      restartGame();
    }
    return; // Non aggiornare il gioco se è finito
  }

  updateEnemies();

  // --- Movimento e Collisioni ---
  const prevX = player.x;
  const prevY = player.y;
  let targetX = player.x;
  let targetY = player.y;

  if (keys.ArrowUp) {
    targetY -= player.speed;
    player.direction = 'up';
  }
  if (keys.ArrowDown) {
    targetY += player.speed;
    player.direction = 'down';
  }
  if (keys.ArrowLeft) {
    targetX -= player.speed;
    player.direction = 'left';
  }
  if (keys.ArrowRight) {
    targetX += player.speed;
    player.direction = 'right';
  }

  // Controlla collisione sull'asse X
  if (targetX !== player.x) {
      if (!checkCollision(targetX, player.y) && !checkCollision(targetX + player.width -1, player.y) &&
          !checkCollision(targetX, player.y + player.height -1) && !checkCollision(targetX + player.width -1, player.y + player.height -1)) {
          player.x = targetX;
      }
  }

  // Controlla collisione sull'asse Y
  if (targetY !== player.y) {
      if (!checkCollision(player.x, targetY) && !checkCollision(player.x + player.width -1, targetY) &&
          !checkCollision(player.x, targetY + player.height-1) && !checkCollision(player.x + player.width -1, targetY + player.height -1)) {
          player.y = targetY;
      }
  }

  // --- Logica di Animazione ---
  player.isMoving = (player.x !== prevX || player.y !== prevY);
  if (player.isMoving) {
    const now = Date.now();
    if (now - player.lastFrameTime > player.animationSpeed) {
        player.animationFrame = (player.animationFrame + 1) % 2; // 2 frames
        player.lastFrameTime = now;
    }
  } else {
    player.animationFrame = 0; // Frame di idle
  }

  // --- Logica di raccolta risorse ---
  const playerTileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
  const playerTileY = Math.floor((player.y + player.height / 2) / TILE_SIZE);

  if (map.tiles[playerTileY][playerTileX] === 2) {
    player.resources++;
    map.tiles[playerTileY][playerTileX] = 0; // Rimuovi la risorsa
    console.log(`Cristalli raccolti: ${player.resources}`);
  }

  // --- Logica di Attacco ---
  const now = Date.now();
  if (keys[' '] && now - player.lastAttackTime > player.attackCooldown) {
      player.isAttacking = true;
      player.lastAttackTime = now;

      const attackHitbox = { x: player.x, y: player.y, width: 16, height: 16 };
      const attackRange = 12;

      if (player.direction === 'up') {
          attackHitbox.y -= attackRange;
      } else if (player.direction === 'down') {
          attackHitbox.y += attackRange;
      } else if (player.direction === 'left') {
          attackHitbox.x -= attackRange;
      } else if (player.direction === 'right') {
          attackHitbox.x += attackRange;
      }

      enemies.forEach(enemy => {
          if (isColliding(attackHitbox, enemy)) {
              enemy.health -= 20;
              enemy.isHit = true;
              console.log(`Colpito nemico! Vita rimasta: ${enemy.health}`);
              setTimeout(() => { enemy.isHit = false; }, 100);
          }
      });
      
      // Rimuovi i nemici sconfitti
      enemies = enemies.filter(enemy => enemy.health > 0);

      setTimeout(() => { player.isAttacking = false; }, 100);
  }

  // Aggiorna la posizione della telecamera per seguire il giocatore
  camera.x = player.x - GAME_WIDTH / 2 + player.width / 2;
  camera.y = player.y - GAME_HEIGHT / 2 + player.height / 2;

  // Blocca la telecamera ai bordi della mappa (clamping)
  camera.x = Math.max(0, Math.min(camera.x, map.cols * TILE_SIZE - GAME_WIDTH));
  camera.y = Math.max(0, Math.min(camera.y, map.rows * TILE_SIZE - GAME_HEIGHT));

  // Controlla la sconfitta del giocatore
  if (player.health <= 0) {
    gameState = 'gameOver';
    console.log("Game Over!");
  }

  // --- Logica di Interazione ---
  if (keys['e']) {
    let interacted = false;
    npcs.forEach(npc => {
        const distance = Math.sqrt(Math.pow(player.x - npc.x, 2) + Math.pow(player.y - npc.y, 2));
        if (distance < TILE_SIZE * 1.5) {
            dialogueManager.show(npc);
            interacted = true;
        }
    });
    // Se premiamo E non vicino a un NPC, il dialogo si chiude
    if (!interacted && dialogueManager.isActive) {
        dialogueManager.hide();
    }
    keys['e'] = false; // Consuma l'input per evitare azioni multiple
  }
}

function drawMap() {
    const startCol = Math.floor(camera.x / TILE_SIZE);
    const endCol = Math.min(startCol + (GAME_WIDTH / TILE_SIZE) + 2, map.cols);
    const startRow = Math.floor(camera.y / TILE_SIZE);
    const endRow = Math.min(startRow + (GAME_HEIGHT / TILE_SIZE) + 2, map.rows);

    for (let r = startRow; r < endRow; r++) {
        for (let c = startCol; c < endCol; c++) {
            const tile = map.tiles[r][c];
            const tileX = c * TILE_SIZE - camera.x;
            const tileY = r * TILE_SIZE - camera.y;

            // Disegna sempre il pavimento
            ctx.fillStyle = map.colors[0];
            ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

            if (tile === 1) { // Muro
                ctx.fillStyle = map.colors[1];
                ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            } else if (tile === 2) { // Risorsa
                const resourceSize = TILE_SIZE / 2;
                ctx.fillStyle = map.colors[2];
                ctx.fillRect(
                    tileX + resourceSize / 2,
                    tileY + resourceSize / 2,
                    resourceSize,
                    resourceSize
                );
            }
        }
    }
}

function drawNpcs() {
    npcs.forEach(npc => {
        if (npc.sprite.complete) {
            ctx.drawImage(npc.sprite, npc.x - camera.x, npc.y - camera.y, npc.width, npc.height);
        }
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.sprite.complete) {
            const screenX = enemy.x - camera.x;
            const screenY = enemy.y - camera.y;
            
            // Disegna lo sprite del nemico
            const frameWidth = 16;
            const frameHeight = 16;
            const frameX = enemy.animationFrame * frameWidth;
            ctx.drawImage(
                enemy.sprite,
                frameX, 0, frameWidth, frameHeight,
                screenX, screenY, enemy.width, enemy.height
            );

            // Disegna l'effetto "colpito"
            if (enemy.isHit) {
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillRect(screenX, screenY, enemy.width, enemy.height);
                ctx.globalCompositeOperation = 'source-over';
            }

            // Disegna la barra della vita sopra il nemico
            const healthBarWidth = enemy.width;
            const healthBarHeight = 4;
            const healthBarY = screenY - healthBarHeight - 2;
            
            ctx.fillStyle = '#333'; // Sfondo
            ctx.fillRect(screenX, healthBarY, healthBarWidth, healthBarHeight);
            
            const currentHealthWidth = (enemy.health / enemy.maxHealth) * healthBarWidth;
            ctx.fillStyle = '#E74C3C'; // Rosso
            ctx.fillRect(screenX, healthBarY, currentHealthWidth, healthBarHeight);
        }
    });
}

function draw() {
  // Pulisce il canvas (necessario per via della telecamera)
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // 1. Disegna la mappa (sfondo, muri, risorse)
  drawMap();

  // 2. Disegna i PNG
  drawNpcs();

  // 3. Disegna i nemici
  drawEnemies();

  // 4. Disegna il giocatore
  const frameWidth = 16;
  const frameHeight = 16;
  const directionRowMap = { 'down': 0, 'left': 1, 'right': 2, 'up': 3 };
  const frameRow = directionRowMap[player.direction];
  const frameX = player.animationFrame * frameWidth;

  ctx.drawImage(
      player.spriteSheet,
      frameX, frameRow * frameHeight, // source x, y
      frameWidth, frameHeight,      // source width, height
      player.x - camera.x, player.y - camera.y, // destination x, y
      player.width, player.height   // destination width, height
  );

  // Disegna l'effetto dell'attacco del giocatore
  if (player.isAttacking) {
      const attackHitbox = { x: player.x, y: player.y, width: 16, height: 16 };
      const attackRange = 12;
      if (player.direction === 'up') attackHitbox.y -= attackRange;
      else if (player.direction === 'down') attackHitbox.y += attackRange;
      else if (player.direction === 'left') attackHitbox.x -= attackRange;
      else if (player.direction === 'right') attackHitbox.x += attackRange;

      ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
      ctx.fillRect(attackHitbox.x - camera.x, attackHitbox.y - camera.y, attackHitbox.width, attackHitbox.height);
  }

  // Disegna l'effetto di quando il giocatore è colpito
  if (player.isHit) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
      ctx.fillRect(player.x - camera.x, player.y - camera.y, player.width, player.height);
  }

  // 4. Disegna l'interfaccia (HUD) - non è affetta dalla telecamera
  ctx.fillStyle = 'white';
  ctx.font = '12px "Courier New", Courier, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Cristalli: ${player.resources}`, 5, 5);

  // Disegna la barra della vita del giocatore
  const healthBarWidth = 100;
  const healthBarHeight = 10;
  ctx.fillStyle = '#333';
  ctx.fillRect(5, 20, healthBarWidth, healthBarHeight);
  const currentHealthWidth = (player.health / player.maxHealth) * healthBarWidth;
  ctx.fillStyle = '#2ECC71'; // Verde
  ctx.fillRect(5, 20, currentHealthWidth, healthBarHeight);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(5, 20, healthBarWidth, healthBarHeight);


  // 5. Disegna i controlli
  // D-pad
  ctx.fillStyle = controls.colors.dpad;
  ctx.fillRect(controls.dpad.up.x,    controls.dpad.up.y,    controls.dpad.up.w, controls.dpad.up.h);
  ctx.fillRect(controls.dpad.down.x,  controls.dpad.down.y,  controls.dpad.down.w, controls.dpad.down.h);
  ctx.fillRect(controls.dpad.left.x,  controls.dpad.left.y,  controls.dpad.left.w, controls.dpad.left.h);
  ctx.fillRect(controls.dpad.right.x, controls.dpad.right.y, controls.dpad.right.w, controls.dpad.right.h);
  
  // Pulsante di attacco
  ctx.fillStyle = controls.colors.attack;
  ctx.fillRect(controls.attackButton.x, controls.attackButton.y, controls.attackButton.w, controls.attackButton.h);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px "Courier New"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', controls.attackButton.x + controls.attackButton.w / 2, controls.attackButton.y + controls.attackButton.h / 2);

  // Disegna la finestra di dialogo
  if (dialogueManager.isActive) {
      const boxHeight = 60;
      const boxY = GAME_HEIGHT - boxHeight;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, boxY, GAME_WIDTH, boxHeight);

      ctx.fillStyle = 'white';
      ctx.font = '12px "Courier New"';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(dialogueManager.text, 10, boxY + 10);
  }

  // Disegna il tracciamento della missione
  const questId = 'collect_crystals';
  const quest = player.questLog[questId];
  if (quest && quest.status === 'active') {
      const questGiver = npcs.find(npc => npc.quest.id === questId);
      if (questGiver) {
          const questTitle = questGiver.quest.title;
          const questProgress = `${player.resources} / ${questGiver.quest.goal}`;
          
          ctx.font = '12px "Courier New"';
          ctx.textAlign = 'right';
          ctx.fillStyle = 'yellow';
          ctx.fillText(questTitle, GAME_WIDTH - 10, 10);
          ctx.fillStyle = 'white';
          ctx.fillText(questProgress, GAME_WIDTH - 10, 25);
      }
  }

  // Disegna la schermata di Game Over
  if (gameState === 'gameOver') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
    
    ctx.font = '14px "Courier New"';
    ctx.fillText('Premi R per riprovare', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Avvia il game loop solo dopo che lo sprite è stato caricato
player.sprite.onload = () => {
    console.log("Sprite generato e caricato, avvio del gioco.");
    gameLoop();
};

// Fallback nel caso l'immagine sia già in cache e l'evento onload sia già scattato
if (player.sprite.complete) {
    player.sprite.onload();
}
