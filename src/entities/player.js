// entidade player
import { BASE_FIRE_RATE } from '../config.js';

export let player = {
	size: 50,
	x: 0, // será inicializado no main.js
	y: 0,
	speed: 4,
	damage: 1,
	img: null,
	maxHealth: 6, // 3 corações (cada coração = 2 de vida)
	health: 6,
	invulnerable: false,
	invulnerableTime: 0,
	fireRate: BASE_FIRE_RATE, // Taxa de tiro em ms
	lastShotTime: 0, // Timestamp do último tiro
	// Sistema avançado de rastreamento de movimento
	previousX: 0,
	previousY: 0,
	velocityX: 0,
	velocityY: 0,
	previousVelocityX: 0,
	previousVelocityY: 0,
	accelerationX: 0,
	accelerationY: 0,
	// Histórico de movimento para análise de padrões (últimos 30 frames)
	movementHistory: [],
	maxHistorySize: 30,
	// Padrões detectados
	isCircling: false,
	isZigzagging: false,
	isStrafeRunning: false,
	movementPattern: 'random', // 'random', 'circular', 'zigzag', 'strafe', 'straight'
	patternConfidence: 0, // 0-1, confiança no padrão detectado
	// Estatísticas de movimento
	averageSpeed: 0,
	directionChanges: 0,
	lastDirectionChange: 0
};

export function drawPlayer(ctx, mouseX, mouseY) {
	ctx.save();
	ctx.translate(player.x + player.size/2, player.y + player.size/2);
	let angle = Math.atan2(mouseY - (player.y + player.size/2), mouseX - (player.x + player.size/2));
	ctx.rotate(angle);
	
	// Piscar se invulnerável
	if (!player.invulnerable || Math.floor(Date.now() / 100) % 2 === 0) {
		ctx.drawImage(player.img, -player.size/2, -player.size/2, player.size, player.size);
	}
	ctx.restore();
}

export function takeDamage(amount) {
	if (player.invulnerable) return;
	
	player.health -= amount;
	if (player.health < 0) player.health = 0;
	
	// Ativar invulnerabilidade por 1 segundo
	player.invulnerable = true;
	player.invulnerableTime = Date.now() + 1000;
}

export function updatePlayer() {
	// Calcular velocidade para mira preditiva dos inimigos
	player.velocityX = player.x - player.previousX;
	player.velocityY = player.y - player.previousY;
	player.previousX = player.x;
	player.previousY = player.y;
	
	// Atualizar invulnerabilidade
	if (player.invulnerable && Date.now() > player.invulnerableTime) {
		player.invulnerable = false;
	}
}

export function canShoot() {
	const now = Date.now();
	if (now - player.lastShotTime >= player.fireRate) {
		player.lastShotTime = now;
		return true;
	}
	return false;
}
