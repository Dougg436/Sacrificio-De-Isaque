import { player, drawPlayer, takeDamage, updatePlayer, canShoot } from './entities/player.js';
import { createBullet } from './entities/bullet.js';
import { createPowerUp } from './entities/powerup.js';
import { createEnemy, updateEnemy, drawEnemy, checkEnemyCollision, damageEnemy, calculateAdvancedPredictiveAngle } from './entities/enemy.js';
import { keys, setupKeyboard, mouseX, mouseY, setupMouse } from './core/input.js';
import { playerImg, bulletImg } from './core/assets.js';
import { generateDungeon } from './systems/dungeon-gen.js';
import { MIN_FIRE_RATE } from './config.js';

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
let gameState = 'playing'; // 'playing', 'transition', 'victory', 'paused'
let currentFloor = 1;
let bossDefeated = false;
let trapdoorSpawned = false;

// Tamanho da sala no canvas
const roomWidth = canvas.width;
const roomHeight = canvas.height;

// Inicialização player na sala inicial
player.x = roomWidth / 2 - player.size / 2;
player.y = roomHeight / 2 - player.size / 2;
player.previousX = player.x; // Inicializar posição anterior para cálculo de velocidade
player.previousY = player.y;
player.img = playerImg;

let bullets = [];
let powerUps = [];
let enemies = [];

// Estado do menu de pausa
let pauseMenuSelectedOption = 0; // 0 = Continuar, 1 = Reiniciar, 2 = Menu Principal
const pauseMenuOptions = ['Continuar', 'Reiniciar', 'Menu Principal'];
let escKeyPressed = false; // Para evitar toggle múltiplo
let lastEscPressTime = 0; // Timestamp do último ESC pressionado

// Sistema de FPS
let lastFrameTime = Date.now();
let deltaTime = 0;

setupKeyboard();
setupMouse(canvas);

// Sistema de persistência de estado das salas
function saveRoomState() {
	// Salvar estado atual da sala antes de sair
	if (!currentRoom.savedState) {
		currentRoom.savedState = {};
	}
	
	// Salvar cópia profunda dos inimigos (posição, vida, tipo, etc)
	currentRoom.savedState.enemies = enemies.map(enemy => ({
		x: enemy.x,
		y: enemy.y,
		type: enemy.type,
		size: enemy.size,
		health: enemy.health,
		maxHealth: enemy.maxHealth,
		speed: enemy.speed,
		damage: enemy.damage,
		color: enemy.color,
		behavior: enemy.behavior,
		shootInterval: enemy.shootInterval,
		lastShotTime: enemy.lastShotTime,
		vx: enemy.vx,
		vy: enemy.vy,
		wanderTimer: enemy.wanderTimer,
		dead: enemy.dead,
		spawnTime: enemy.spawnTime,
		canAttack: enemy.canAttack
	}));
	
	// Salvar bullets (opcional, mas pode ser útil)
	currentRoom.savedState.bullets = bullets.map(bullet => ({
		x: bullet.x,
		y: bullet.y,
		vx: bullet.vx,
		vy: bullet.vy,
		size: bullet.size,
		damage: bullet.damage,
		img: bullet.img,
		isEnemy: bullet.isEnemy
	}));
	
	// Salvar powerups
	currentRoom.savedState.powerUps = powerUps.map(p => ({
		x: p.x,
		y: p.y,
		size: p.size,
		effect: p.effect,
		img: p.img,
		color: p.color,
		name: p.name
	}));
}

function loadRoomState() {
	// Limpar arrays primeiro
	bullets = [];
	powerUps = [];
	enemies = [];
	
	// Se a sala tem estado salvo, restaurar
	if (currentRoom.savedState) {
		// Restaurar inimigos com todas as propriedades
		enemies = currentRoom.savedState.enemies.map(savedEnemy => ({
			...savedEnemy
		}));
		
		// Restaurar bullets
		bullets = currentRoom.savedState.bullets.map(savedBullet => ({
			...savedBullet
		}));
		
		// Restaurar powerups
		powerUps = currentRoom.savedState.powerUps.map(savedPowerup => ({
			...savedPowerup
		}));
		
		return true; // Estado foi carregado
	}
	
	return false; // Sem estado salvo, precisa gerar novo
}

// Spawn inimigos da sala atual (apenas primeira visita)
function spawnRoomEnemies() {
	// Tentar carregar estado salvo primeiro
	if (loadRoomState()) {
		return; // Estado foi restaurado, não precisa spawnar
	}
	// Limpar arrays
	bullets = [];
	powerUps = [];
	enemies = [];
	
	// Verificar se a sala já foi limpa (cleared)
	if (currentRoom.cleared) {
		return; // Não spawnar inimigos em salas já limpas
	}
	
	// Spawnar inimigos baseado na sala atual
	if (currentRoom.type !== 'start' && currentRoom.type !== 'treasure') {
		const enemyCount = currentRoom.type === 'boss' ? 0 : Math.floor(Math.random() * 4) + 4; // 4-7 inimigos
		const enemyTypes = ['fly', 'spider', 'shooter'];
		
		for (let i = 0; i < enemyCount; i++) {
			const x = Math.random() * (roomWidth - 200) + 100;
			const y = Math.random() * (roomHeight - 200) + 100;
			const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
			enemies.push(createEnemy(x, y, type));
		}
	}
	
	// Spawnar powerups APENAS em salas de tesouro E apenas se ainda não foi coletado
	if (currentRoom.type === 'treasure' && !currentRoom.treasureCollected) {
		// Garantir 1 powerup no centro da sala
		const x = roomWidth / 2;
		const y = roomHeight / 2;
		spawnPowerUp(x, y);
	}
}

function spawnPowerUp(px, py) {
	// Array de possíveis powerups
	const powerupTypes = [
		{
			name: 'damage',
			effect: () => {
				player.damage += 1;
				console.log('Dano aumentado! Novo dano:', player.damage);
			},
			color: '#FF0000' // vermelho
		},
		{
			name: 'firerate',
			effect: () => {
				// Reduzir fire rate em 50ms (mais rápido), com limite mínimo
				player.fireRate = Math.max(MIN_FIRE_RATE, player.fireRate - 50);
				console.log('Fire rate aumentado! Novo fire rate:', player.fireRate, 'ms');
			},
			color: '#FFA500' // laranja
		},
		{
			name: 'speed',
			effect: () => {
				player.speed += 0.5;
				console.log('Velocidade aumentada! Nova velocidade:', player.speed);
			},
			color: '#00FF00' // verde
		},
		{
			name: 'health',
			effect: () => {
				// Curar 2 de vida (1 coração)
				player.health = Math.min(player.maxHealth, player.health + 2);
				console.log('Vida recuperada! Vida atual:', player.health);
			},
			color: '#FF69B4' // rosa
		}
	];
	
	// Escolher powerup aleatório
	const powerupType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
	
	const powerup = createPowerUp(px, py, bulletImg, powerupType.effect);
	powerup.color = powerupType.color; // Adicionar cor para renderização
	powerup.name = powerupType.name; // Adicionar nome
	powerUps.push(powerup);
}

// Funções do Menu de Pausa
function drawPauseMenu() {
	try {
		// Escurecer o fundo
		ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		// Título do menu
		ctx.font = 'bold 60px Arial';
		ctx.fillStyle = '#fff';
		ctx.textAlign = 'center';
		ctx.fillText('PAUSADO', canvas.width / 2, 150);
		
		// Opções do menu
		ctx.font = '40px Arial';
		pauseMenuOptions.forEach((option, index) => {
			const y = 280 + index * 80;
			
			// Destacar opção selecionada
			if (index === pauseMenuSelectedOption) {
				ctx.fillStyle = '#FFD700'; // Dourado
				ctx.fillText('> ' + option + ' <', canvas.width / 2, y);
			} else {
				ctx.fillStyle = '#fff';
				ctx.fillText(option, canvas.width / 2, y);
			}
		});
		
		// Instruções
		ctx.font = '20px Arial';
		ctx.fillStyle = '#aaa';
		ctx.fillText('Use W/S ou ↑/↓ para navegar', canvas.width / 2, canvas.height - 80);
		ctx.fillText('Enter para selecionar | ESC para voltar', canvas.width / 2, canvas.height - 50);
	} catch (error) {
		console.error('Erro ao desenhar menu de pausa:', error);
		// Fallback: mostrar menu simples
		ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = '#fff';
		ctx.font = '40px Arial';
		ctx.textAlign = 'center';
		ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2);
		ctx.font = '20px Arial';
		ctx.fillText('Pressione ESC para continuar', canvas.width / 2, canvas.height / 2 + 50);
	}
}

function handlePauseMenuInput() {
	// Proteção: garantir que estamos realmente no estado pausado
	if (gameState !== 'paused') {
		console.warn('handlePauseMenuInput chamado fora do estado pausado');
		return;
	}
	
	// Prevenir uso de W/S para movimento quando pausado
	const currentTime = Date.now();
	
	// Navegar para cima
	if ((keys['w'] || keys['W'] || keys['ArrowUp']) && (!keys['lastNavigateTime'] || currentTime - keys['lastNavigateTime'] > 200)) {
		pauseMenuSelectedOption = (pauseMenuSelectedOption - 1 + pauseMenuOptions.length) % pauseMenuOptions.length;
		keys['lastNavigateTime'] = currentTime;
		console.log('Menu: navegou para opção', pauseMenuSelectedOption);
	} 
	// Navegar para baixo
	else if ((keys['s'] || keys['S'] || keys['ArrowDown']) && (!keys['lastNavigateTime'] || currentTime - keys['lastNavigateTime'] > 200)) {
		pauseMenuSelectedOption = (pauseMenuSelectedOption + 1) % pauseMenuOptions.length;
		keys['lastNavigateTime'] = currentTime;
		console.log('Menu: navegou para opção', pauseMenuSelectedOption);
	}
	
	// Selecionar opção
	if (keys['Enter']) {
		if (!keys['enterPressed']) {
			keys['enterPressed'] = true;
			console.log('Menu: selecionou opção', pauseMenuSelectedOption);
			executePauseMenuOption();
		}
	} else {
		keys['enterPressed'] = false;
	}
}

function executePauseMenuOption() {
	console.log('Executando opção do menu:', pauseMenuSelectedOption, pauseMenuOptions[pauseMenuSelectedOption]);
	
	switch (pauseMenuSelectedOption) {
		case 0: // Continuar
			console.log('Continuando jogo...');
			gameState = 'playing';
			break;
		case 1: // Reiniciar
			console.log('Reiniciando jogo...');
			location.reload(); // Recarregar a página para reiniciar
			break;
		case 2: // Menu Principal
			console.log('Voltando ao menu principal...');
			window.location.href = 'index.html'; // Voltar para o menu principal
			break;
	}
}

// Verificar colisões com paredes e limitar movimento
function checkWallCollisions() {
	const wallThickness = 20;
	const doorSize = 80;
	
	// Parede Norte
	if (player.y < wallThickness) {
		if (!currentRoom.doors.N || 
			player.x + player.size < (roomWidth - doorSize) / 2 || 
			player.x > (roomWidth + doorSize) / 2) {
			player.y = wallThickness;
		} 
	}
	
	// Parede Sul  
	if (player.y + player.size > roomHeight - wallThickness) {
		if (!currentRoom.doors.S || 
			player.x + player.size < (roomWidth - doorSize) / 2 || 
			player.x > (roomWidth + doorSize) / 2) {
			player.y = roomHeight - wallThickness - player.size;
		}
	}
	
	// Parede Leste
	if (player.x + player.size > roomWidth - wallThickness) {
		if (!currentRoom.doors.E || 
			player.y + player.size < (roomHeight - doorSize) / 2 || 
			player.y > (roomHeight + doorSize) / 2) {
			player.x = roomWidth - wallThickness - player.size;
		}
	}
	
	// Parede Oeste
	if (player.x < wallThickness) {
		if (!currentRoom.doors.W || 
			player.y + player.size < (roomHeight - doorSize) / 2 || 
			player.y > (roomHeight + doorSize) / 2) {
			player.x = wallThickness;
		}
	}
}

// Verificar transição entre salas (apenas através das portas)
function checkRoomTransition() {
	const wallThickness = 20;
	const doorSize = 80;
	
	// Verificar se há inimigos vivos na sala atual
	const hasEnemies = enemies.length > 0;
	
	// Porta Norte - só transita se estiver dentro da área da porta
	if (currentRoom.doors.N && player.y < 0) {
		if (player.x + player.size > (roomWidth - doorSize) / 2 && 
			player.x < (roomWidth + doorSize) / 2) {
			const newRoom = dungeon.grid[currentRoom.y - 1]?.[currentRoom.x];
			if (newRoom) {
				// Bloquear apenas se tem inimigos E a sala destino nunca foi visitada
				const isNewRoom = !newRoom.savedState && !newRoom.cleared;
				if (hasEnemies && isNewRoom) {
					player.y = wallThickness;
					return;
				}
				saveRoomState(); // Salvar estado antes de sair
				currentRoom = newRoom;
				player.y = roomHeight - player.size - wallThickness;
				spawnRoomEnemies();
			}
		} else {
			player.y = wallThickness;
		}
	}
	
	// Porta Sul - só transita se estiver dentro da área da porta
	if (currentRoom.doors.S && player.y + player.size > roomHeight) {
		if (player.x + player.size > (roomWidth - doorSize) / 2 && 
			player.x < (roomWidth + doorSize) / 2) {
			const newRoom = dungeon.grid[currentRoom.y + 1]?.[currentRoom.x];
			if (newRoom) {
				// Bloquear apenas se tem inimigos E a sala destino nunca foi visitada
				const isNewRoom = !newRoom.savedState && !newRoom.cleared;
				if (hasEnemies && isNewRoom) {
					player.y = roomHeight - wallThickness - player.size;
					return;
				}
				saveRoomState(); // Salvar estado antes de sair
				currentRoom = newRoom;
				player.y = wallThickness;
				spawnRoomEnemies();
			}
		} else {
			player.y = roomHeight - wallThickness - player.size;
		}
	}
	
	// Porta Leste - só transita se estiver dentro da área da porta
	if (currentRoom.doors.E && player.x + player.size > roomWidth) {
		if (player.y + player.size > (roomHeight - doorSize) / 2 && 
			player.y < (roomHeight + doorSize) / 2) {
			const newRoom = dungeon.grid[currentRoom.y]?.[currentRoom.x + 1];
			if (newRoom) {
				// Bloquear apenas se tem inimigos E a sala destino nunca foi visitada
				const isNewRoom = !newRoom.savedState && !newRoom.cleared;
				if (hasEnemies && isNewRoom) {
					player.x = roomWidth - wallThickness - player.size;
					return;
				}
				saveRoomState(); // Salvar estado antes de sair
				currentRoom = newRoom;
				player.x = wallThickness;
				spawnRoomEnemies();
			}
		} else {
			player.x = roomWidth - wallThickness - player.size;
		}
	}
	
	// Porta Oeste - só transita se estiver dentro da área da porta
	if (currentRoom.doors.W && player.x < 0) {
		if (player.y + player.size > (roomHeight - doorSize) / 2 && 
			player.y < (roomHeight + doorSize) / 2) {
			const newRoom = dungeon.grid[currentRoom.y]?.[currentRoom.x - 1];
			if (newRoom) {
				// Bloquear apenas se tem inimigos E a sala destino nunca foi visitada
				const isNewRoom = !newRoom.savedState && !newRoom.cleared;
				if (hasEnemies && isNewRoom) {
					player.x = wallThickness;
					return;
				}
				saveRoomState(); // Salvar estado antes de sair
				currentRoom = newRoom;
				player.x = roomWidth - player.size - wallThickness;
				spawnRoomEnemies();
			}
		} else {
			player.x = wallThickness;
		}
	}
}

// Desenhar sala atual
function drawRoom() {
	// Proteção: verificar se currentRoom existe
	if (!currentRoom || !currentRoom.doors) {
		console.error('drawRoom: currentRoom inválido', currentRoom);
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, roomWidth, roomHeight);
		return;
	}
	
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
	const doorSize = 80;
	// Só mostrar como trancada se tem inimigos E sala não está limpa E não é sala especial
	const hasEnemies = enemies.length > 0 && !currentRoom.cleared && 
	                   currentRoom.type !== 'start' && currentRoom.type !== 'treasure';
	
	// Helper function to check if a door should be locked
	function isDoorLocked(direction) {
		if (!hasEnemies) return false;
		
		let destX = currentRoom.x;
		let destY = currentRoom.y;
		
		if (direction === 'N') destY--;
		else if (direction === 'S') destY++;
		else if (direction === 'E') destX++;
		else if (direction === 'W') destX--;
		
		const destRoom = dungeon.grid[destY]?.[destX];
		if (!destRoom) return false;
		
		// Só tranca se a sala destino NUNCA foi visitada (sem estado salvo E não limpa)
		const isNewRoom = !destRoom.savedState && !destRoom.cleared;
		return isNewRoom;
	}
	
	if (currentRoom.doors.N) {
		const locked = isDoorLocked('N');
		ctx.fillStyle = locked ? '#8B0000' : '#555';
		ctx.fillRect((roomWidth - doorSize) / 2, 0, doorSize, wallThickness);
		// Desenhar "X" se trancada
		if (locked) {
			ctx.strokeStyle = '#FF0000';
			ctx.lineWidth = 3;
			const doorX = (roomWidth - doorSize) / 2;
			const doorY = 0;
			ctx.beginPath();
			ctx.moveTo(doorX, doorY);
			ctx.lineTo(doorX + doorSize, doorY + wallThickness);
			ctx.moveTo(doorX + doorSize, doorY);
			ctx.lineTo(doorX, doorY + wallThickness);
			ctx.stroke();
		}
	}
	
	if (currentRoom.doors.S) {
		const locked = isDoorLocked('S');
		ctx.fillStyle = locked ? '#8B0000' : '#555';
		ctx.fillRect((roomWidth - doorSize) / 2, roomHeight - wallThickness, doorSize, wallThickness);
		if (locked) {
			ctx.strokeStyle = '#FF0000';
			ctx.lineWidth = 3;
			const doorX = (roomWidth - doorSize) / 2;
			const doorY = roomHeight - wallThickness;
			ctx.beginPath();
			ctx.moveTo(doorX, doorY);
			ctx.lineTo(doorX + doorSize, doorY + wallThickness);
			ctx.moveTo(doorX + doorSize, doorY);
			ctx.lineTo(doorX, doorY + wallThickness);
			ctx.stroke();
		}
	}
	
	if (currentRoom.doors.E) {
		const locked = isDoorLocked('E');
		ctx.fillStyle = locked ? '#8B0000' : '#555';
		ctx.fillRect(roomWidth - wallThickness, (roomHeight - doorSize) / 2, wallThickness, doorSize);
		if (locked) {
			ctx.strokeStyle = '#FF0000';
			ctx.lineWidth = 3;
			const doorX = roomWidth - wallThickness;
			const doorY = (roomHeight - doorSize) / 2;
			ctx.beginPath();
			ctx.moveTo(doorX, doorY);
			ctx.lineTo(doorX + wallThickness, doorY + doorSize);
			ctx.moveTo(doorX + wallThickness, doorY);
			ctx.lineTo(doorX, doorY + doorSize);
			ctx.stroke();
		}
	}
	
	if (currentRoom.doors.W) {
		const locked = isDoorLocked('W');
		ctx.fillStyle = locked ? '#8B0000' : '#555';
		ctx.fillRect(0, (roomHeight - doorSize) / 2, wallThickness, doorSize);
		if (locked) {
			ctx.strokeStyle = '#FF0000';
			ctx.lineWidth = 3;
			const doorX = 0;
			const doorY = (roomHeight - doorSize) / 2;
			ctx.beginPath();
			ctx.moveTo(doorX, doorY);
			ctx.lineTo(doorX + wallThickness, doorY + doorSize);
			ctx.moveTo(doorX + wallThickness, doorY);
			ctx.lineTo(doorX, doorY + doorSize);
			ctx.stroke();
		}
	}
	
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

// Desenhar vida (corações)
function drawHealth() {
	const heartSize = 30;
	const heartSpacing = 5;
	const startX = 10;
	const startY = 10;
	const maxHearts = Math.ceil(player.maxHealth / 2);
	
	for (let i = 0; i < maxHearts; i++) {
		const x = startX + i * (heartSize + heartSpacing);
		const y = startY;
		
		// Calcular se o coração está cheio, meio ou vazio
		const heartValue = i * 2; // Cada coração representa 2 de vida
		const filled = player.health - heartValue;
		
		if (filled >= 2) {
			// Coração cheio
			ctx.fillStyle = '#ff0000';
			drawHeart(ctx, x, y, heartSize, true);
		} else if (filled === 1) {
			// Meio coração
			ctx.fillStyle = '#ff0000';
			drawHeart(ctx, x, y, heartSize, false);
		} else {
			// Coração vazio
			ctx.fillStyle = '#333';
			drawHeart(ctx, x, y, heartSize, true);
		}
		
		// Contorno do coração
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 2;
		drawHeartOutline(ctx, x, y, heartSize);
	}
	
	// Mostrar stats do player
	ctx.font = '16px Arial';
	ctx.textAlign = 'left';
	ctx.fillStyle = '#fff';
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 3;
	
	const statsX = startX;
	const statsY = startY + heartSize + 20;
	
	// Dano
	ctx.strokeText(`⚔️ Dano: ${player.damage}`, statsX, statsY);
	ctx.fillText(`⚔️ Dano: ${player.damage}`, statsX, statsY);
	
	// Velocidade
	ctx.strokeText(`🏃 Speed: ${player.speed.toFixed(1)}`, statsX, statsY + 20);
	ctx.fillText(`🏃 Speed: ${player.speed.toFixed(1)}`, statsX, statsY + 20);
	
	// Fire Rate (converter para tiros por segundo)
	const shotsPerSecond = (1000 / player.fireRate).toFixed(1);
	ctx.strokeText(`🔫 Fire Rate: ${shotsPerSecond}/s`, statsX, statsY + 40);
	ctx.fillText(`🔫 Fire Rate: ${shotsPerSecond}/s`, statsX, statsY + 40);
	
	// Padrão de movimento detectado (DEBUG - pode ser removido)
	if (player.movementPattern && player.patternConfidence > 0.3) {
		const patternIcons = {
			circular: '🔄',
			zigzag: '⚡',
			strafe: '↔️',
			straight: '➡️',
			random: '❓'
		};
		const icon = patternIcons[player.movementPattern] || '❓';
		const confidence = (player.patternConfidence * 100).toFixed(0);
		ctx.fillStyle = player.patternConfidence > 0.6 ? '#ff0' : '#aaa';
		ctx.strokeText(`${icon} ${player.movementPattern.toUpperCase()} (${confidence}%)`, statsX, statsY + 60);
		ctx.fillText(`${icon} ${player.movementPattern.toUpperCase()} (${confidence}%)`, statsX, statsY + 60);
	}
}

function drawHeart(ctx, x, y, size, full) {
	ctx.beginPath();
	const topCurveHeight = size * 0.3;
	
	// Começar no topo do coração
	ctx.moveTo(x + size / 2, y + topCurveHeight);
	
	if (full) {
		// Lado esquerdo (curva superior esquerda)
		ctx.bezierCurveTo(
			x + size / 2, y, 
			x, y, 
			x, y + topCurveHeight
		);
		
		// Lado esquerdo para baixo
		ctx.bezierCurveTo(
			x, y + (size + topCurveHeight) / 2,
			x + size / 2, y + (size + topCurveHeight) / 1.2,
			x + size / 2, y + size
		);
	} else {
		// Meio coração (apenas metade direita)
		ctx.lineTo(x + size / 2, y + size);
	}
	
	// Lado direito
	ctx.bezierCurveTo(
		x + size / 2, y + (size + topCurveHeight) / 1.2,
		x + size, y + (size + topCurveHeight) / 2,
		x + size, y + topCurveHeight
	);
	
	// Curva superior direita
	ctx.bezierCurveTo(
		x + size, y,
		x + size / 2, y,
		x + size / 2, y + topCurveHeight
	);
	
	ctx.fill();
}

function drawHeartOutline(ctx, x, y, size) {
	ctx.beginPath();
	const topCurveHeight = size * 0.3;
	
	ctx.moveTo(x + size / 2, y + topCurveHeight);
	
	ctx.bezierCurveTo(
		x + size / 2, y,
		x, y,
		x, y + topCurveHeight
	);
	
	ctx.bezierCurveTo(
		x, y + (size + topCurveHeight) / 2,
		x + size / 2, y + (size + topCurveHeight) / 1.2,
		x + size / 2, y + size
	);
	
	ctx.bezierCurveTo(
		x + size / 2, y + (size + topCurveHeight) / 1.2,
		x + size, y + (size + topCurveHeight) / 2,
		x + size, y + topCurveHeight
	);
	
	ctx.bezierCurveTo(
		x + size, y,
		x + size / 2, y,
		x + size / 2, y + topCurveHeight
	);
	
	ctx.stroke();
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
	player.previousX = player.x; // Reset velocidade
	player.previousY = player.y;
	player.velocityX = 0;
	player.velocityY = 0;
	player.previousVelocityX = 0;
	player.previousVelocityY = 0;
	player.accelerationX = 0;
	player.accelerationY = 0;
	player.movementHistory = []; // Limpar histórico
	player.movementPattern = 'random';
	player.patternConfidence = 0;
	
	// Spawnar conteúdo da nova sala
	spawnRoomEnemies();
}

function update() {
	// Calcular deltaTime
	const currentTime = Date.now();
	deltaTime = (currentTime - lastFrameTime) / 1000; // Converter para segundos
	lastFrameTime = currentTime;
	
	// Limitar deltaTime para evitar saltos grandes (ex: quando tab fica inativa)
	if (deltaTime > 0.1) deltaTime = 0.1;
	
	// Verificar tecla ESC para pausar/despausar
	if (keys['Escape'] || keys['Esc']) {
		if (!escKeyPressed) {
			const currentTime = Date.now();
			// Adicionar cooldown de 300ms para evitar múltiplos toggles
			if (currentTime - lastEscPressTime > 300) {
				escKeyPressed = true;
				lastEscPressTime = currentTime;
				
				if (gameState === 'playing') {
					console.log('Pausando jogo...');
					gameState = 'paused';
					pauseMenuSelectedOption = 0; // Reset para primeira opção
					console.log('Jogo pausado - Estado:', gameState);
				} else if (gameState === 'paused') {
					console.log('Despausando jogo...');
					gameState = 'playing';
					console.log('Jogo despausado - Estado:', gameState);
				}
			}
		}
	} else {
		escKeyPressed = false;
	}
	
	// Se o jogo está pausado, mostrar menu e processar input do menu
	if (gameState === 'paused') {
		handlePauseMenuInput();
		
		// Redesenhar a tela de jogo congelada de forma segura
		try {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			// Verificar se currentRoom existe antes de desenhar
			if (currentRoom) {
				drawRoom();
			}
			
			// Desenhar inimigos (verificar se array existe)
			if (enemies && enemies.length > 0) {
				enemies.forEach(enemy => {
					if (enemy && !enemy.dead) {
						drawEnemy(ctx, enemy);
					}
				});
			}
			
			// Desenhar bullets (verificar se array existe)
			if (bullets && bullets.length > 0) {
				bullets.forEach(bullet => {
					if (bullet && bullet.img) {
						ctx.drawImage(bullet.img, bullet.x - bullet.size/2, bullet.y - bullet.size/2, bullet.size, bullet.size);
					}
				});
			}
			
			// Desenhar powerups (verificar se array existe)
			if (powerUps && powerUps.length > 0) {
				powerUps.forEach(p => {
					if (!p) return;
					if (p.color) {
						ctx.fillStyle = p.color;
						ctx.beginPath();
						ctx.arc(p.x, p.y, p.size/2, 0, Math.PI * 2);
						ctx.fill();
						ctx.strokeStyle = '#000';
						ctx.lineWidth = 3;
						ctx.stroke();
					} else if (p.img) {
						ctx.drawImage(p.img, p.x - p.size/2, p.y - p.size/2, p.size, p.size);
					}
				});
			}
			
			// Desenhar player (verificar se existe)
			if (player && player.img) {
				drawPlayer(ctx, mouseX, mouseY);
			}
			
			// Desenhar HUD
			drawHealth();
			drawMinimap();
			
			// Desenhar menu de pausa por cima
			drawPauseMenu();
		} catch (error) {
			console.error('Erro ao renderizar menu de pausa:', error);
			// Em caso de erro, apenas mostrar o menu sem o fundo do jogo
			ctx.fillStyle = '#000';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			drawPauseMenu();
		}
		
		requestAnimationFrame(update);
		return; // Não processar resto do update
	}
	
	// Atualizar player (invulnerabilidade, etc)
	updatePlayer();
	
	// Movimento
	if (keys['w']) player.y -= player.speed;
	if (keys['s']) player.y += player.speed;
	if (keys['a']) player.x -= player.speed;
	if (keys['d']) player.x += player.speed;

	// Verificar colisões com paredes (deve vir antes das transições)
	checkWallCollisions();

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
	
	// Atualizar e desenhar inimigos
	enemies.forEach((enemy, index) => {
		if (enemy.dead) {
			// Remover inimigo morto após um tempo
			enemies.splice(index, 1);
			return;
		}
		
		const updateResult = updateEnemy(enemy, player, roomWidth, roomHeight);
		drawEnemy(ctx, enemy);
		
		// Inimigo atira no player com IA AVANÇADA de predição
		if (updateResult && updateResult.shouldShoot) {
			const bulletSpeed = 6;
			
			// Usar sistema avançado de predição que analisa padrões de movimento
			const angle = calculateAdvancedPredictiveAngle(
				enemy.x + enemy.size/2,  // posição X do inimigo
				enemy.y + enemy.size/2,  // posição Y do inimigo
				player,                   // objeto completo do player com histórico
				bulletSpeed,              // velocidade do projétil
				updateResult.aimAccuracy  // precisão do inimigo
			);
			
			const bullet = createBullet(
				enemy.x + enemy.size/2,
				enemy.y + enemy.size/2,
				angle,
				bulletSpeed, // velocidade do tiro do inimigo
				20, // tamanho menor para tiros de inimigos
				enemy.damage,
				true // marcar como tiro de inimigo
			);
			bullets.push(bullet);
		}
		
		// Verificar colisão com player
		if (checkEnemyCollision(enemy, player)) {
			takeDamage(enemy.damage);
		}
		
		// Verificar colisão com bullets do player
		bullets.forEach((bullet, bIndex) => {
			// Tiros de inimigos não atingem inimigos
			if (bullet.isEnemy) return;
			
			const dx = bullet.x - (enemy.x + enemy.size/2);
			const dy = bullet.y - (enemy.y + enemy.size/2);
			const distance = Math.sqrt(dx*dx + dy*dy);
			
			if (distance < enemy.size/2 + bullet.size/2) {
				damageEnemy(enemy, bullet.damage);
				bullets.splice(bIndex, 1);
			}
		});
	});
	
	// Verificar se a sala foi limpa (todos os inimigos mortos)
	if (enemies.length === 0 && !currentRoom.cleared && currentRoom.type !== 'start' && currentRoom.type !== 'treasure') {
		currentRoom.cleared = true;
	}

	// Bullets
	bullets.forEach((b, i) => {
		b.x += b.vx;
		b.y += b.vy;
		
		// Cor diferente para tiros de inimigos
		if (b.isEnemy) {
			// Desenhar tiro de inimigo (círculo vermelho)
			ctx.fillStyle = '#ff4444';
			ctx.beginPath();
			ctx.arc(b.x, b.y, b.size/2, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = '#880000';
			ctx.lineWidth = 2;
			ctx.stroke();
			
			// Verificar colisão com player
			const dx = b.x - (player.x + player.size/2);
			const dy = b.y - (player.y + player.size/2);
			const distance = Math.sqrt(dx*dx + dy*dy);
			
			if (distance < player.size/2 + b.size/2) {
				takeDamage(b.damage);
				bullets.splice(i, 1);
			}
		} else {
			// Desenhar tiro do player (imagem normal)
			ctx.drawImage(bulletImg, b.x - b.size/2, b.y - b.size/2, b.size, b.size);
		}
		
		// Remover bullets que saem da tela
		if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
			bullets.splice(i, 1);
		}
	});

	// PowerUps
	powerUps.forEach((p, i) => {
		// Desenhar círculo colorido de fundo
		if (p.color) {
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size/2, 0, Math.PI * 2);
			ctx.fill();
			
			// Borda preta
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 3;
			ctx.stroke();
			
			// Brilho pulsante
			const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
			ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.5})`;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size/3, 0, Math.PI * 2);
			ctx.fill();
		} else {
			ctx.drawImage(p.img, p.x - p.size/2, p.y - p.size/2, p.size, p.size);
		}
		
		let dx = (player.x + player.size/2) - p.x;
		let dy = (player.y + player.size/2) - p.y;
		let distance = Math.sqrt(dx*dx + dy*dy);
		if(distance < (player.size/2 + p.size/2)) {
			p.effect();
			powerUps.splice(i, 1);
			// Marcar sala de tesouro como coletada
			if (currentRoom.type === 'treasure') {
				currentRoom.treasureCollected = true;
			}
		}
	});

	ctx.font = "45px Arial";
	ctx.fillStyle = "white";
	ctx.fillText(player.damage, 10, 50);
	
	// Desenhar vida (corações) no canto superior esquerdo
	drawHealth();
	
	// Mostrar andar atual
	ctx.font = "24px Arial";
	ctx.fillStyle = "white";
	ctx.fillText(`Basement ${currentFloor}`, 10, 140);
	
	// Mostrar tipo da sala
	ctx.font = "16px Arial";
	ctx.fillStyle = "white";
	ctx.fillText(`${currentRoom.type} (${currentRoom.x},${currentRoom.y})`, 10, 165);
	
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
	// Verificar se pode atirar (fire rate)
	if (!canShoot()) return;
	
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

