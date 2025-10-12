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

/**
 * Sistema INSANAMENTE AVANÇADO de predição - AIMBOT LEVEL
 * @param {number} ex - posição X do atirador
 * @param {number} ey - posição Y do atirador
 * @param {object} player - objeto do player com histórico de movimento
 * @param {number} bulletSpeed - velocidade do projétil
 * @param {number} accuracy - precisão base do inimigo (0-1)
 * @returns {number} ângulo de tiro em radianos
 */
export function calculateAdvancedPredictiveAngle(ex, ey, player, bulletSpeed, accuracy) {
	const px = player.x + player.size / 2;
	const py = player.y + player.size / 2;
	const vx = player.velocityX || 0;
	const vy = player.velocityY || 0;
	const ax = player.accelerationX || 0;
	const ay = player.accelerationY || 0;
	
	const dx = px - ex;
	const dy = py - ey;
	const distance = Math.sqrt(dx * dx + dy * dy);
	
	// Tempo estimado para projétil alcançar o alvo (com múltiplas iterações)
	let timeToImpact = distance / bulletSpeed;
	
	// PREDIÇÃO ITERATIVA - Refinar tempo de impacto considerando movimento do alvo
	for (let iteration = 0; iteration < 3; iteration++) {
		const futureX = px + vx * timeToImpact + ax * timeToImpact * timeToImpact * 0.5;
		const futureY = py + vy * timeToImpact + ay * timeToImpact * timeToImpact * 0.5;
		const newDistance = Math.sqrt((futureX - ex) ** 2 + (futureY - ey) ** 2);
		timeToImpact = newDistance / bulletSpeed;
	}
	
	// PREDIÇÃO BASEADA EM PADRÃO DE MOVIMENTO (EXTREMAMENTE AGRESSIVA)
	let predictedX = px;
	let predictedY = py;
	
	const pattern = player.movementPattern || 'random';
	const confidence = Math.max(player.patternConfidence || 0, 0.5); // Mínimo 50% de confiança
	
	// Multiplicadores agressivos baseados no padrão
	const patternMultipliers = {
		circular: 3.5,   // 350% mais agressivo em círculos
		straight: 4.0,   // 400% mais agressivo em linha reta
		strafe: 3.0,     // 300% mais agressivo em strafe
		zigzag: 2.5,     // 250% mais agressivo em zigzag
		random: 2.0      // 200% mais agressivo até sem padrão
	};
	
	const aggressiveMultiplier = patternMultipliers[pattern] || 2.0;
	
	switch (pattern) {
		case 'circular':
			// PREDIÇÃO CIRCULAR EXTREMA
			if (player.movementHistory && player.movementHistory.length >= 10) {
				const history = player.movementHistory.slice(-15);
				
				// Calcular centro do círculo com mais precisão
				const centerX = history.reduce((sum, h) => sum + h.x, 0) / history.length;
				const centerY = history.reduce((sum, h) => sum + h.y, 0) / history.length;
				const radius = Math.sqrt((px - centerX) ** 2 + (py - centerY) ** 2);
				
				// Calcular velocidade angular média
				const angles = history.map(h => Math.atan2(h.y - centerY, h.x - centerX));
				let totalAngularVelocity = 0;
				for (let i = 1; i < angles.length; i++) {
					let diff = angles[i] - angles[i-1];
					while (diff > Math.PI) diff -= 2 * Math.PI;
					while (diff < -Math.PI) diff += 2 * Math.PI;
					totalAngularVelocity += diff;
				}
				const angularVelocity = totalAngularVelocity / (angles.length - 1);
				
				// PREVER POSIÇÃO COM ACELERAÇÃO ANGULAR
				const currentAngle = Math.atan2(py - centerY, px - centerX);
				const futureAngle = currentAngle + angularVelocity * timeToImpact * aggressiveMultiplier;
				
				// Considerar que o raio pode estar mudando (espiral)
				const radiusChange = history.length > 5 ? 
					(Math.sqrt((history[history.length-1].x - centerX)**2 + (history[history.length-1].y - centerY)**2) - 
					 Math.sqrt((history[0].x - centerX)**2 + (history[0].y - centerY)**2)) / history.length : 0;
				
				const futureRadius = radius + radiusChange * timeToImpact * 10;
				
				predictedX = centerX + Math.cos(futureAngle) * futureRadius;
				predictedY = centerY + Math.sin(futureAngle) * futureRadius;
			} else {
				// Fallback com aceleração
				predictedX = px + vx * timeToImpact * aggressiveMultiplier + ax * timeToImpact * timeToImpact * 2;
				predictedY = py + vy * timeToImpact * aggressiveMultiplier + ay * timeToImpact * timeToImpact * 2;
			}
			break;
			
		case 'zigzag':
			// PREDIÇÃO DE ZIGZAG - Prever PRÓXIMA mudança
			if (player.movementHistory && player.movementHistory.length >= 10) {
				const history = player.movementHistory.slice(-10);
				
				// Detectar padrão de frequência de mudança
				let lastDirections = [];
				for (let i = 1; i < history.length; i++) {
					const angle = Math.atan2(history[i].vy, history[i].vx);
					lastDirections.push(angle);
				}
				
				// Calcular quando provavelmente vai mudar
				const changeFrequency = player.directionChanges / player.movementHistory.length;
				const probableChangeIn = 1 / Math.max(changeFrequency, 0.1);
				
				if (probableChangeIn < timeToImpact * 60) { // vai mudar durante o voo
					// Prever inversão de direção
					const oppositeVx = -vx * 0.8;
					const oppositeVy = -vy * 0.8;
					predictedX = px + (vx * 0.3 + oppositeVx * 0.7) * timeToImpact * aggressiveMultiplier;
					predictedY = py + (vy * 0.3 + oppositeVy * 0.7) * timeToImpact * aggressiveMultiplier;
				} else {
					// Não vai mudar ainda
					predictedX = px + vx * timeToImpact * aggressiveMultiplier + ax * timeToImpact * timeToImpact * 2;
					predictedY = py + vy * timeToImpact * aggressiveMultiplier + ay * timeToImpact * timeToImpact * 2;
				}
			} else {
				predictedX = px + vx * timeToImpact * aggressiveMultiplier;
				predictedY = py + vy * timeToImpact * aggressiveMultiplier;
			}
			break;
			
		case 'strafe':
			// PREDIÇÃO DE STRAFE - Movimento lateral muito previsível
			predictedX = px + vx * timeToImpact * aggressiveMultiplier * 1.2;
			predictedY = py + vy * timeToImpact * aggressiveMultiplier * 1.2;
			
			// Adicionar aceleração agressivamente
			predictedX += ax * timeToImpact * timeToImpact * 3;
			predictedY += ay * timeToImpact * timeToImpact * 3;
			break;
			
		case 'straight':
			// PREDIÇÃO RETA - A MAIS LETAL
			predictedX = px + vx * timeToImpact * aggressiveMultiplier * 1.5;
			predictedY = py + vy * timeToImpact * aggressiveMultiplier * 1.5;
			
			// Aceleração extrema
			predictedX += ax * timeToImpact * timeToImpact * 4;
			predictedY += ay * timeToImpact * timeToImpact * 4;
			break;
			
		case 'random':
		default:
			// Até sem padrão, ser agressivo
			predictedX = px + vx * timeToImpact * aggressiveMultiplier;
			predictedY = py + vy * timeToImpact * aggressiveMultiplier;
			predictedX += ax * timeToImpact * timeToImpact * 1.5;
			predictedY += ay * timeToImpact * timeToImpact * 1.5;
			break;
	}
	
	// COMPENSAÇÃO EXTREMA POR DISTÂNCIA
	const distanceFactor = 1 + Math.min(distance / 300, 2); // até 3x mais agressivo
	predictedX = px + (predictedX - px) * distanceFactor;
	predictedY = py + (predictedY - py) * distanceFactor;
	
	// APLICAR CONFIANÇA (mas com mínimo alto)
	const finalConfidence = Math.max(confidence, 0.7); // Mínimo 70% de confiança
	const finalPredictedX = px + (predictedX - px) * finalConfidence;
	const finalPredictedY = py + (predictedY - py) * finalConfidence;
	
	// CORREÇÃO DE TRAJETÓRIA - Refinamento TRIPLO para precisão máxima
	// Calcular onde o player REALMENTE estará quando o tiro chegar
	let finalX = finalPredictedX;
	let finalY = finalPredictedY;
	
	// Iteração 1
	let bulletTravelTime = Math.sqrt((finalX - ex)**2 + (finalY - ey)**2) / bulletSpeed;
	finalX = finalPredictedX + vx * bulletTravelTime * 0.8 + ax * bulletTravelTime * bulletTravelTime * 1.5;
	finalY = finalPredictedY + vy * bulletTravelTime * 0.8 + ay * bulletTravelTime * bulletTravelTime * 1.5;
	
	// Iteração 2 (refinar ainda mais)
	bulletTravelTime = Math.sqrt((finalX - ex)**2 + (finalY - ey)**2) / bulletSpeed;
	finalX = finalX + vx * bulletTravelTime * 0.5 + ax * bulletTravelTime * bulletTravelTime;
	finalY = finalY + vy * bulletTravelTime * 0.5 + ay * bulletTravelTime * bulletTravelTime;
	
	// Iteração 3 (precisão máxima)
	bulletTravelTime = Math.sqrt((finalX - ex)**2 + (finalY - ey)**2) / bulletSpeed;
	const tripleRefinedX = finalX + vx * bulletTravelTime * 0.3 + ax * bulletTravelTime * bulletTravelTime * 0.5;
	const tripleRefinedY = finalY + vy * bulletTravelTime * 0.3 + ay * bulletTravelTime * bulletTravelTime * 0.5;
	
	// Média ponderada de todas as predições (favor para mais refinadas)
	const superPredictedX = finalPredictedX * 0.2 + finalX * 0.3 + tripleRefinedX * 0.5;
	const superPredictedY = finalPredictedY * 0.2 + finalY * 0.3 + tripleRefinedY * 0.5;
	
	// Calcular ângulo final
	const predictedAngle = Math.atan2(superPredictedY - ey, superPredictedX - ex);
	
	// APLICAR PRECISÃO (mas com mínimo altíssimo)
	const finalAccuracy = Math.max(accuracy, 0.9); // Mínimo 90% de precisão SEMPRE
	const directAngle = Math.atan2(dy, dx);
	
	let angleDiff = predictedAngle - directAngle;
	while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
	while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
	
	const finalAngle = directAngle + angleDiff * finalAccuracy;
	
	return finalAngle;
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
			shootInterval: 2000, // REDUZIDO: atira a cada 2 segundos (era 3)
			aimAccuracy: 0.98 // 98% de precisão - QUASE AIMBOT
		},
		spider: {
			size: 35,
			health: 5,
			speed: 1.5,
			damage: 1,
			color: '#4B0082',
			behavior: 'wander',
			shootCooldown: 0,
			shootInterval: 2500, // REDUZIDO: atira a cada 2.5 segundos (era 4)
			aimAccuracy: 0.95 // 95% de precisão - EXTREMAMENTE PRECISO
		},
		shooter: {
			size: 32,
			health: 4,
			speed: 1,
			damage: 1,
			color: '#DC143C',
			behavior: 'shoot',
			shootCooldown: 0,
			shootInterval: 1500, // REDUZIDO: atira a cada 1.5 segundos (era 2.5)
			aimAccuracy: 0.99 // 99% de precisão - AIMBOT LITERAL
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
			console.log(`Enemy ${enemy.type} can now attack!`);
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
	
	// === CORREÇÃO CRÍTICA: Verificar e corrigir timestamps inválidos ===
	if (!enemy.lastShotTime || enemy.lastShotTime > now) {
		enemy.lastShotTime = now - enemy.shootInterval; // Permitir atirar imediatamente
		console.log(`Fixed invalid lastShotTime for enemy ${enemy.type}`);
	}
	
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
			console.log(`Chase enemy ${enemy.type} shooting! Distance: ${distance.toFixed(1)}`);
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
			console.log(`Wander enemy ${enemy.type} shooting! Distance: ${distance.toFixed(1)}`);
		}
	} else if (enemy.behavior === 'shoot') {
		// Ficar parado ou mover devagar
		enemy.vx *= 0.9;
		enemy.vy *= 0.9;
		
		// Verificar se pode atirar
		if (now - enemy.lastShotTime >= enemy.shootInterval && distance < 450) {
			shouldShoot = true;
			enemy.lastShotTime = now;
			console.log(`Shooter enemy ${enemy.type} shooting! Distance: ${distance.toFixed(1)}`);
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
	
	// Debugging: Log de tiro ocasional
	if (shouldShoot) {
		console.log(`🔫 Enemy ${enemy.type} FIRING! Time since last: ${now - (enemy.lastShotTime - enemy.shootInterval)}ms, Distance: ${distance.toFixed(1)}`);
	}
	
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
