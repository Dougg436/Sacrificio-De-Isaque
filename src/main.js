import { player, drawPlayer } from './entities/player.js';
import { createBullet } from './entities/bullet.js';
import { createPowerUp } from './entities/powerup.js';
import { keys, setupKeyboard, mouseX, mouseY, setupMouse } from './core/input.js';
import { playerImg, bulletImg } from './core/assets.js';

const canvas = document.getElementById('gameScreen');
const ctx = canvas.getContext('2d');

// Inicialização player
player.x = (canvas.width - player.size) / 2;
player.y = (canvas.height - player.size) / 2;
player.img = playerImg;

let bullets = [];
let powerUps = [];

setupKeyboard();
setupMouse(canvas);

function spawnPowerUp(px, py) {
	powerUps.push(createPowerUp(px, py, bulletImg, () => player.damage += 1));
}

function update() {
	// Movimento
	if (keys['w']) player.y -= player.speed;
	if (keys['s']) player.y += player.speed;
	if (keys['a']) player.x -= player.speed;
	if (keys['d']) player.x += player.speed;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

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
	ctx.fillText(player.damage, 10, 50);
	drawPlayer(ctx, mouseX, mouseY);
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

playerImg.onload = () => update();
