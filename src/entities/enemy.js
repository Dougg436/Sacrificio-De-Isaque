// entidade inimigo
import { ENEMY_SPAWN_DELAY } from '../config.js';

/**
 * Calcula o ângulo preditivo considerando a velocidade do alvo
 * @param {number} ex - posição X do atirador
 * @param {number} ey - posição Y do atirador
 * @param {number} px - posição X do alvo
 * @param {number} py - posição Y do alvo
 * @param {number} vx - velocidade X do alvo
 * @param {number} vy - velocidade Y do alvo
 * @param {number} bulletSpeed - velocidade do projétil
 * @returns {number} ângulo de tiro em radianos
 */
export function calculatePredictiveAngle(ex, ey, px, py, vx, vy, bulletSpeed) {
	// Posição relativa do alvo
	const dx = px - ex;
	const dy = py - ey;
	
	// Se o alvo está parado, usar ângulo direto
	if (vx === 0 && vy === 0) {
		return Math.atan2(dy, dx);
	}
	
	// Equação quadrática para interceptação
	// Baseado em: https://stackoverflow.com/questions/2248876/2d-game-fire-at-a-moving-target-by-predicting-intersection-of-projectile-and-u
	
	const a = vx * vx + vy * vy - bulletSpeed * bulletSpeed;
	const b = 2 * (vx * dx + vy * dy);
	const c = dx * dx + dy * dy;
	
	const discriminant = b * b - 4 * a * c;
	
	// Se não há solução (alvo muito rápido), mirar na posição atual
	if (discriminant < 0) {
		return Math.atan2(dy, dx);
	}
	
	// Calcular tempo de interceptação (usar a solução menor/mais rápida)
	const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
	const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
	
	let t;
	if (t1 > 0 && t2 > 0) {
		t = Math.min(t1, t2);
	} else if (t1 > 0) {
		t = t1;
	} else if (t2 > 0) {
		t = t2;
	} else {
		// Nenhuma solução positiva, mirar na posição atual
		return Math.atan2(dy, dx);
	}
	
	// Calcular posição futura do alvo
	const futureX = px + vx * t;
	const futureY = py + vy * t;
	
	// Retornar ângulo para a posição futura
	return Math.atan2(futureY - ey, futureX - ex);
}

export function createEnemy(x, y, type = 'fly') {
	const enemyTypes = {
		fly: {
			size: 30,
			health: 3,
			speed: 2,
			damage: 1,
			color: '#8B4513',
			behavior: 'chase', // chase, wander, shoot
			shootCooldown: 0,
			shootInterval: 3000, // atira a cada 3 segundos
			aimAccuracy: 0.8 // 80% de precisão na mira preditiva (0.0 = sem predição, 1.0 = predição perfeita)
		},
		spider: {
			size: 35,
			health: 5,
			speed: 1.5,
			damage: 1,
			color: '#4B0082',
			behavior: 'wander',
			shootCooldown: 0,
			shootInterval: 4000, // atira a cada 4 segundos
			aimAccuracy: 0.6 // 60% de precisão (mira pior)
		},
		shooter: {
			size: 32,
			health: 4,
			speed: 1,
			damage: 1,
			color: '#DC143C',
			behavior: 'shoot',
			shootCooldown: 0,
			shootInterval: 2500, // atira a cada 2.5 segundos (mais rápido)
			aimAccuracy: 0.95 // 95% de precisão (atirador expert)
		}
	};
	
	const template = enemyTypes[type] || enemyTypes.fly;
	
	return {
		x,
		y,
		type,
		size: template.size,
		health: template.health,
		maxHealth: template.health,
		speed: template.speed,
		damage: template.damage,
		color: template.color,
		behavior: template.behavior,
		shootCooldown: template.shootCooldown,
		shootInterval: template.shootInterval,
		aimAccuracy: template.aimAccuracy,
		lastShotTime: Date.now(), // Timestamp do último tiro
		vx: 0,
		vy: 0,
		wanderTimer: 0,
		dead: false,
		spawnTime: Date.now(), // Tempo de spawn para delay inicial
		canAttack: false // Só pode atacar após o delay
	};
}

export function updateEnemy(enemy, player, roomWidth, roomHeight, wallThickness = 20) {
	if (enemy.dead) return;
	
	// Verificar se o delay de spawn passou
	if (!enemy.canAttack) {
		if (Date.now() - enemy.spawnTime >= ENEMY_SPAWN_DELAY) {
			enemy.canAttack = true;
		} else {
			// Durante o delay, inimigo fica parado
			return { distance: 0, dx: 0, dy: 0, shouldShoot: false };
		}
	}
	
	const dx = player.x + player.size/2 - (enemy.x + enemy.size/2);
	const dy = player.y + player.size/2 - (enemy.y + enemy.size/2);
	const distance = Math.sqrt(dx*dx + dy*dy);
	
	// Preparar para atirar
	let shouldShoot = false;
	const now = Date.now();
	
	if (enemy.behavior === 'chase') {
		// Perseguir o player
		if (distance > 0) {
			enemy.vx = (dx / distance) * enemy.speed;
			enemy.vy = (dy / distance) * enemy.speed;
		}
		// Fly também atira enquanto persegue
		if (now - enemy.lastShotTime >= enemy.shootInterval && distance < 350) {
			shouldShoot = true;
			enemy.lastShotTime = now;
		}
	} else if (enemy.behavior === 'wander') {
		// Movimento aleatório
		if (enemy.wanderTimer <= 0) {
			const angle = Math.random() * Math.PI * 2;
			enemy.vx = Math.cos(angle) * enemy.speed;
			enemy.vy = Math.sin(angle) * enemy.speed;
			enemy.wanderTimer = Math.random() * 60 + 30; // 30-90 frames
		}
		enemy.wanderTimer--;
		
		// Spider atira periodicamente
		if (now - enemy.lastShotTime >= enemy.shootInterval && distance < 400) {
			shouldShoot = true;
			enemy.lastShotTime = now;
		}
	} else if (enemy.behavior === 'shoot') {
		// Ficar parado ou mover devagar
		enemy.vx *= 0.9;
		enemy.vy *= 0.9;
		
		// Verificar se pode atirar
		if (now - enemy.lastShotTime >= enemy.shootInterval && distance < 450) {
			shouldShoot = true;
			enemy.lastShotTime = now;
		}
	}
	
	// Aplicar velocidade
	enemy.x += enemy.vx;
	enemy.y += enemy.vy;
	
	// Limitar dentro da sala (com paredes)
	if (enemy.x < wallThickness) enemy.x = wallThickness;
	if (enemy.x + enemy.size > roomWidth - wallThickness) enemy.x = roomWidth - wallThickness - enemy.size;
	if (enemy.y < wallThickness) enemy.y = wallThickness;
	if (enemy.y + enemy.size > roomHeight - wallThickness) enemy.y = roomHeight - wallThickness - enemy.size;
	
	// Não precisa mais atualizar cooldown aqui - usando timestamp
	
	return { 
		distance, 
		dx, 
		dy, 
		shouldShoot,
		// Retornar posição e velocidade do player para cálculo preditivo
		playerX: player.x + player.size/2,
		playerY: player.y + player.size/2,
		playerVelocityX: player.velocityX || 0,
		playerVelocityY: player.velocityY || 0,
		aimAccuracy: enemy.aimAccuracy // precisão da mira do inimigo
	};
}

export function drawEnemy(ctx, enemy) {
	if (enemy.dead) return;
	
	// Corpo do inimigo
	ctx.fillStyle = enemy.color;
	ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
	
	// Borda
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 2;
	ctx.strokeRect(enemy.x, enemy.y, enemy.size, enemy.size);
	
	// Indicador visual durante o delay de spawn (círculo amarelo piscando)
	if (!enemy.canAttack && Math.floor(Date.now() / 200) % 2 === 0) {
		ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
		ctx.beginPath();
		ctx.arc(enemy.x + enemy.size/2, enemy.y + enemy.size/2, enemy.size/2 + 5, 0, Math.PI * 2);
		ctx.fill();
	}
	
	// Barra de vida
	if (enemy.health < enemy.maxHealth) {
		const barWidth = enemy.size;
		const barHeight = 4;
		const barX = enemy.x;
		const barY = enemy.y - 8;
		
		// Fundo da barra
		ctx.fillStyle = '#000';
		ctx.fillRect(barX, barY, barWidth, barHeight);
		
		// Vida atual
		const healthPercent = enemy.health / enemy.maxHealth;
		ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : (healthPercent > 0.25 ? '#ff0' : '#f00');
		ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
	}
}

export function checkEnemyCollision(enemy, player) {
	if (enemy.dead || player.invulnerable) return false;
	
	return (
		player.x < enemy.x + enemy.size &&
		player.x + player.size > enemy.x &&
		player.y < enemy.y + enemy.size &&
		player.y + player.size > enemy.y
	);
}

export function damageEnemy(enemy, damage) {
	enemy.health -= damage;
	if (enemy.health <= 0) {
		enemy.dead = true;
		enemy.health = 0;
	}
}
