import { player, drawPlayer } from './entities/player.js';
import { createBullet } from './entities/bullet.js';
import { createPowerUp } from './entities/powerup.js';
import { keys, setupKeyboard, mouseX, mouseY, setupMouse } from './core/input.js';
import { playerImg, bulletImg } from './core/assets.js';
import { generateDungeon } from './systems/dungeon-gen.js';

const canvas = document.getElementById('gameScreen');
const ctx = canvas.getContext('2d');

// Gerar dungeon
const dungeon = generateDungeon({
	seed: Date.now(),
	width: 5,
	height: 5,
	targetRooms: 8
});

// Estado do jogo
let currentRoom = dungeon.start;
let gameState = 'playing'; // 'playing', 'transition', 'victory'
let currentFloor = 1;
let bossDefeated = false;
let trapdoorSpawned = false;

// Tamanho da sala no canvas
const roomWidth = canvas.width;
const roomHeight = canvas.height;

// Inicialização player na sala inicial
player.x = roomWidth / 2 - player.size / 2;
player.y = roomHeight / 2 - player.size / 2;
player.img = playerImg;

let bullets = [];
let powerUps = [];

setupKeyboard();
setupMouse(canvas);

// Spawn inimigos da sala atual
function spawnRoomEnemies() {
	// Limpar arrays
	bullets = [];
	powerUps = [];
	
	// Spawnar inimigos baseado na sala atual
	if (currentRoom.enemies && currentRoom.enemies.length > 0) {
		currentRoom.enemies.forEach(enemy => {
			// Posição aleatória na sala
			const x = Math.random() * (roomWidth - 100) + 50;
			const y = Math.random() * (roomHeight - 100) + 50;
			// Por enquanto, só criar power-ups onde estariam inimigos
			spawnPowerUp(x, y);
		});
	}
	
	// Spawnar itens da sala
	if (currentRoom.items && currentRoom.items.length > 0) {
		currentRoom.items.forEach(item => {
			const x = Math.random() * (roomWidth - 100) + 50;
			const y = Math.random() * (roomHeight - 100) + 50;
			spawnPowerUp(x, y);
		});
	}
}

function spawnPowerUp(px, py) {
	powerUps.push(createPowerUp(px, py, bulletImg, () => player.damage += 1));
}

// Verificar transição entre salas
function checkRoomTransition() {
	const doorSize = 60;
	const doorThickness = 20;
	
	// Porta Norte
	if (currentRoom.doors.N && player.y < 0) {
		const newRoom = dungeon.grid[currentRoom.y - 1]?.[currentRoom.x];
		if (newRoom) {
			currentRoom = newRoom;
			player.y = roomHeight - player.size - doorThickness;
			spawnRoomEnemies();
		} else {
			player.y = 0;
		}
	}
	
	// Porta Sul
	if (currentRoom.doors.S && player.y + player.size > roomHeight) {
		const newRoom = dungeon.grid[currentRoom.y + 1]?.[currentRoom.x];
		if (newRoom) {
			currentRoom = newRoom;
			player.y = doorThickness;
			spawnRoomEnemies();
		} else {
			player.y = roomHeight - player.size;
		}
	}
	
	// Porta Leste
	if (currentRoom.doors.E && player.x + player.size > roomWidth) {
		const newRoom = dungeon.grid[currentRoom.y]?.[currentRoom.x + 1];
		if (newRoom) {
			currentRoom = newRoom;
			player.x = doorThickness;
			spawnRoomEnemies();
		} else {
			player.x = roomWidth - player.size;
		}
	}
	
	// Porta Oeste
	if (currentRoom.doors.W && player.x < 0) {
		const newRoom = dungeon.grid[currentRoom.y]?.[currentRoom.x - 1];
		if (newRoom) {
			currentRoom = newRoom;
			player.x = roomWidth - player.size - doorThickness;
			spawnRoomEnemies();
		} else {
			player.x = 0;
		}
	}
}

// Desenhar sala atual
function drawRoom() {
	// Fundo da sala baseado no tipo
	if (currentRoom.type === 'start') ctx.fillStyle = '#2a4a4a';
	else if (currentRoom.type === 'boss') ctx.fillStyle = '#4a2a2a';
	else if (currentRoom.type === 'treasure') ctx.fillStyle = '#4a4a2a';
	else ctx.fillStyle = '#333';
	
	ctx.fillRect(0, 0, roomWidth, roomHeight);
	
	// Desenhar paredes (bordas escuras)
	ctx.fillStyle = '#111';
	const wallThickness = 20;
	
	// Paredes
	if (!currentRoom.doors.N) ctx.fillRect(0, 0, roomWidth, wallThickness); // Norte
	if (!currentRoom.doors.S) ctx.fillRect(0, roomHeight - wallThickness, roomWidth, wallThickness); // Sul
	if (!currentRoom.doors.E) ctx.fillRect(roomWidth - wallThickness, 0, wallThickness, roomHeight); // Leste
	if (!currentRoom.doors.W) ctx.fillRect(0, 0, wallThickness, roomHeight); // Oeste
	
	// Desenhar portas (buracos nas paredes)
	ctx.fillStyle = '#555';
	const doorSize = 80;
	if (currentRoom.doors.N) ctx.fillRect((roomWidth - doorSize) / 2, 0, doorSize, wallThickness);
	if (currentRoom.doors.S) ctx.fillRect((roomWidth - doorSize) / 2, roomHeight - wallThickness, doorSize, wallThickness);
	if (currentRoom.doors.E) ctx.fillRect(roomWidth - wallThickness, (roomHeight - doorSize) / 2, wallThickness, doorSize);
	if (currentRoom.doors.W) ctx.fillRect(0, (roomHeight - doorSize) / 2, wallThickness, doorSize);
	
	// Desenhar trapdoor se boss foi derrotado e estamos na sala do boss
	if (bossDefeated && currentRoom.type === 'boss') {
		const trapdoorSize = 60;
		const trapdoorX = roomWidth / 2 - trapdoorSize / 2;
		const trapdoorY = roomHeight / 2 - trapdoorSize / 2;
		
		// Fundo do trapdoor (buraco escuro)
		ctx.fillStyle = '#000';
		ctx.fillRect(trapdoorX, trapdoorY, trapdoorSize, trapdoorSize);
		
		// Borda do trapdoor
		ctx.strokeStyle = '#444';
		ctx.lineWidth = 3;
		ctx.strokeRect(trapdoorX, trapdoorY, trapdoorSize, trapdoorSize);
		
		// Verificar se player está sobre o trapdoor
		const playerCenterX = player.x + player.size / 2;
		const playerCenterY = player.y + player.size / 2;
		
		if (playerCenterX > trapdoorX && playerCenterX < trapdoorX + trapdoorSize &&
			playerCenterY > trapdoorY && playerCenterY < trapdoorY + trapdoorSize) {
			// Player está no trapdoor - ir para próximo andar
			goToNextFloor();
		}
	}
}

// Desenhar minimapa
function drawMinimap() {
	const mapSize = 150;
	const mapX = roomWidth - mapSize - 20;
	const mapY = 20;
	const cellSize = mapSize / Math.max(dungeon.width, dungeon.height);
	
	// Fundo do minimapa
	ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
	ctx.fillRect(mapX - 5, mapY - 5, mapSize + 10, mapSize + 10);
	
	// Desenhar grid das salas
	for (let y = 0; y < dungeon.height; y++) {
		for (let x = 0; x < dungeon.width; x++) {
			const room = dungeon.grid[y][x];
			const px = mapX + x * cellSize;
			const py = mapY + y * cellSize;
			
			if (!room) continue; // Sala vazia
			
			// Cor da sala baseada no tipo
			if (room === currentRoom) {
				ctx.fillStyle = '#ffffff'; // Sala atual - branca
			} else if (room.type === 'start') {
				ctx.fillStyle = '#40a040'; // Start - verde
			} else if (room.type === 'boss') {
				ctx.fillStyle = '#a04040'; // Boss - vermelho
			} else if (room.type === 'treasure') {
				ctx.fillStyle = '#a0a040'; // Treasure - amarelo
			} else {
				ctx.fillStyle = '#606060'; // Normal - cinza
			}
			
			// Desenhar sala
			ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
			
			// Desenhar portas (linhas nas bordas)
			ctx.fillStyle = '#888';
			const doorThick = 2;
			if (room.doors.N) ctx.fillRect(px + cellSize/3, py, cellSize/3, doorThick);
			if (room.doors.S) ctx.fillRect(px + cellSize/3, py + cellSize - doorThick, cellSize/3, doorThick);
			if (room.doors.E) ctx.fillRect(px + cellSize - doorThick, py + cellSize/3, doorThick, cellSize/3);
			if (room.doors.W) ctx.fillRect(px, py + cellSize/3, doorThick, cellSize/3);
		}
	}
	
	// Borda do minimapa
	ctx.strokeStyle = '#888';
	ctx.lineWidth = 2;
	ctx.strokeRect(mapX - 5, mapY - 5, mapSize + 10, mapSize + 10);
}

// Função para ir ao próximo andar
function goToNextFloor() {
	currentFloor++;
	
	// Gerar novo dungeon para o próximo andar
	const newDungeon = generateDungeon({
		seed: Date.now() + currentFloor,
		width: 5,
		height: 5,
		targetRooms: 8 + currentFloor // Mais salas a cada andar
	});
	
	// Atualizar referências globais
	Object.assign(dungeon, newDungeon);
	currentRoom = dungeon.start;
	
	// Resetar estados
	bossDefeated = false;
	trapdoorSpawned = false;
	
	// Reposicionar player no centro da nova sala inicial
	player.x = roomWidth / 2 - player.size / 2;
	player.y = roomHeight / 2 - player.size / 2;
	
	// Spawnar conteúdo da nova sala
	spawnRoomEnemies();
}

function update() {
	// Movimento
	if (keys['w']) player.y -= player.speed;
	if (keys['s']) player.y += player.speed;
	if (keys['a']) player.x -= player.speed;
	if (keys['d']) player.x += player.speed;

	// Debug: pressionar P para spawnar trapdoor
	if (keys['p']) {
		if (!trapdoorSpawned) {
			bossDefeated = true;
			trapdoorSpawned = true;
		}
	}

	// Verificar transições de sala
	checkRoomTransition();

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Desenhar sala atual
	drawRoom();

	// Bullets
	bullets.forEach((b, i) => {
		b.x += b.vx;
		b.y += b.vy;
		ctx.drawImage(bulletImg, b.x - b.size/2, b.y - b.size/2, b.size, b.size);
		if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
			bullets.splice(i, 1);
		}
	});

	// PowerUps
	powerUps.forEach((p, i) => {
		ctx.drawImage(p.img, p.x - p.size/2, p.y - p.size/2, p.size, p.size);
		let dx = (player.x + player.size/2) - p.x;
		let dy = (player.y + player.size/2) - p.y;
		let distance = Math.sqrt(dx*dx + dy*dy);
		if(distance < (player.size/2 + p.size/2)) {
			p.effect();
			powerUps.splice(i, 1);
		}
	});

	ctx.font = "45px Arial";
	ctx.fillStyle = "white";
	ctx.fillText(player.damage, 10, 50);
	
	// Mostrar andar atual
	ctx.font = "24px Arial";
	ctx.fillText(`Basement ${currentFloor}`, 10, 90);
	
	// Mostrar tipo da sala
	ctx.font = "16px Arial";
	ctx.fillText(`${currentRoom.type} (${currentRoom.x},${currentRoom.y})`, 10, 115);
	
	// Verificar vitória
	if (currentRoom.type === 'boss') {
		ctx.fillStyle = "gold";
		ctx.font = "30px Arial";
		ctx.fillText("BOSS ROOM!", roomWidth/2 - 80, 40);
		
		if (bossDefeated) {
			ctx.fillStyle = "lime";
			ctx.font = "20px Arial";
			ctx.fillText("Boss defeated! Enter the trapdoor!", roomWidth/2 - 120, roomHeight - 30);
		}
	}
	
	// Debug info
	if (keys['p']) {
		ctx.fillStyle = "yellow";
		ctx.font = "16px Arial";
		ctx.fillText("DEBUG: Press P to spawn trapdoor", 10, roomHeight - 20);
	}
	
	drawPlayer(ctx, mouseX, mouseY);
	
	// Desenhar minimapa por último (para ficar por cima)
	drawMinimap();
	
	requestAnimationFrame(update);
}

canvas.addEventListener('mousedown', e => {
	let angle = Math.atan2(
		mouseY - (player.y + player.size/2),
		mouseX - (player.x + player.size/2)
	);
	let speed = 10;
	let size = 50;
	bullets.push(createBullet(
		player.x + player.size/2,
		player.y + player.size/2,
		angle,
		speed,
		size,
		player.damage
	));
});

// Inicializar primeira sala
spawnRoomEnemies();

playerImg.onload = () => update();

