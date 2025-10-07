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
	lastShotTime: 0 // Timestamp do último tiro
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
