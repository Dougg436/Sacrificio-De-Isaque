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
 * Sistema AVANÇADO de predição que analisa padrões de movimento
 * VERSÃO OTIMIZADA PARA PRECISÃO MÁXIMA
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
	
	// Tempo estimado para projétil alcançar o alvo
	const timeToImpact = distance / bulletSpeed;
	
	// USAR ALGORITMO DE INTERCEPTAÇÃO BALÍSTICA para base
	// Este é o método mais preciso matematicamente
	const baseAngle = calculatePredictiveAngle(ex, ey, px, py, vx, vy, bulletSpeed);
	
	// PREDIÇÃO BASEADA EM PADRÃO DE MOVIMENTO (para refinar ainda mais)
	let predictedX = px;
	let predictedY = py;
	
	const pattern = player.movementPattern || 'random';
	const confidence = Math.max(player.patternConfidence || 0, 0.5); // Mínimo de 50% de confiança
	
	switch (pattern) {
		case 'circular':
			// Prever continuação do movimento circular com alta precisão
			if (player.movementHistory && player.movementHistory.length >= 10) {
				const history = player.movementHistory.slice(-10);
				
				// Calcular centro do círculo com maior precisão
				const centerX = history.reduce((sum, h) => sum + h.x, 0) / history.length;
				const centerY = history.reduce((sum, h) => sum + h.y, 0) / history.length;
				const radius = Math.sqrt((px - centerX) ** 2 + (py - centerY) ** 2);
				
				// Calcular velocidade angular com maior precisão
				const angles = history.map(h => Math.atan2(h.y - centerY, h.x - centerX));
				let totalAngularChange = 0;
				for (let i = 1; i < angles.length; i++) {
					let diff = angles[i] - angles[i-1];
					while (diff > Math.PI) diff -= 2 * Math.PI;
					while (diff < -Math.PI) diff += 2 * Math.PI;
					totalAngularChange += diff;
				}
				const angularVelocity = totalAngularChange / (angles.length - 1);
				
				// Prever posição futura no círculo com compensação aumentada
				const currentAngle = Math.atan2(py - centerY, px - centerX);
				const futureAngle = currentAngle + angularVelocity * timeToImpact * 3; // Aumentado para melhor antecipação
				
				predictedX = centerX + Math.cos(futureAngle) * radius;
				predictedY = centerY + Math.sin(futureAngle) * radius;
			} else {
				// Fallback: predição com física
				predictedX = px + vx * timeToImpact + ax * timeToImpact * timeToImpact;
				predictedY = py + vy * timeToImpact + ay * timeToImpact * timeToImpact;
			}
			break;
			
		case 'zigzag':
			// Predição para zigzag - tentar prever o meio do próximo movimento
			// Usar média ponderada de possíveis direções
			const straightPredX = px + vx * timeToImpact;
			const straightPredY = py + vy * timeToImpact;
			const reversePredX = px - vx * timeToImpact * 0.3;
			const reversePredY = py - vy * timeToImpact * 0.3;
			
			// Combinar predições com peso baseado no histórico
			predictedX = straightPredX * 0.6 + reversePredX * 0.4;
			predictedY = straightPredY * 0.6 + reversePredY * 0.4;
			break;
			
		case 'strafe':
			// Movimento lateral - predição altamente confiável
			predictedX = px + vx * timeToImpact * 1.5; // Maior antecipação
			predictedY = py + vy * timeToImpact * 1.5;
			
			// Adicionar aceleração
			predictedX += ax * timeToImpact * timeToImpact;
			predictedY += ay * timeToImpact * timeToImpact;
			break;
			
		case 'straight':
			// Movimento reto - predição PERFEITA possível
			predictedX = px + vx * timeToImpact * 2.0; // Máxima antecipação
			predictedY = py + vy * timeToImpact * 2.0;
			
			// Aceleração com peso total
			predictedX += ax * timeToImpact * timeToImpact * 1.5;
			predictedY += ay * timeToImpact * timeToImpact * 1.5;
			break;
			
		case 'random':
		default:
			// Usar predição balística básica com física aprimorada
			predictedX = px + vx * timeToImpact * 1.2;
			predictedY = py + vy * timeToImpact * 1.2;
			
			// Adicionar aceleração
			predictedX += ax * timeToImpact * timeToImpact * 0.5;
			predictedY += ay * timeToImpact * timeToImpact * 0.5;
			break;
	}
	
	// COMPENSAÇÃO POR DISTÂNCIA (melhorada)
	// Quanto mais longe, mais importante é a predição
	const distanceFactor = Math.min(distance / 300, 2.0); // Aumentado o fator
	predictedX = px + (predictedX - px) * distanceFactor;
	predictedY = py + (predictedY - py) * distanceFactor;
	
	// APLICAR CONFIANÇA DO PADRÃO com peso maior
	// Quanto maior a confiança, mais peso na predição
	const patternWeight = Math.min(confidence * 1.2, 1.0); // Aumentar peso da confiança
	const finalPredictedX = px + (predictedX - px) * patternWeight;
	const finalPredictedY = py + (predictedY - py) * patternWeight;
	
	// Calcular ângulo baseado na predição de padrão
	const patternAngle = Math.atan2(finalPredictedY - ey, finalPredictedX - ex);
	
	// COMBINAR predição balística com predição de padrão
	// A predição balística já é muito precisa, então usar como base
	let combinedAngle;
	if (confidence > 0.6) {
		// Alta confiança no padrão - usar mais o padrão
		const weight = accuracy * confidence;
		let angleDiff = patternAngle - baseAngle;
		while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
		while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
		combinedAngle = baseAngle + angleDiff * weight;
	} else {
		// Baixa confiança - usar principalmente balística
		let angleDiff = patternAngle - baseAngle;
		while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
		while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
		combinedAngle = baseAngle + angleDiff * accuracy * 0.5;
	}
	
	// Para accuracy = 1.0, retornar o ângulo combinado otimizado
	// Para accuracy < 1.0, interpolar com ângulo direto
	const directAngle = Math.atan2(dy, dx);
	let finalAngleDiff = combinedAngle - directAngle;
	while (finalAngleDiff > Math.PI) finalAngleDiff -= 2 * Math.PI;
	while (finalAngleDiff < -Math.PI) finalAngleDiff += 2 * Math.PI;
	
	const finalAngle = directAngle + finalAngleDiff * accuracy;
	
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
			shootInterval: 3000, // atira a cada 3 segundos
			aimAccuracy: 0.98 // 98% de precisão na mira preditiva (INSANAMENTE ALTA)
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
			aimAccuracy: 0.95 // 95% de precisão (alta precisão)
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
			aimAccuracy: 1.0 // 100% de precisão PERFEITA (atirador expert supremo)
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
	
	// === VISUALIZAÇÃO DE PRECISÃO DA IA ===
	// Mostrar ícone de mira baseado na precisão
	const centerX = enemy.x + enemy.size/2;
	const centerY = enemy.y + enemy.size/2;
	
	// Anel de precisão (cor baseada na accuracy)
	let accuracyColor;
	if (enemy.aimAccuracy >= 0.95) accuracyColor = '#ff0000'; // Vermelho = perigo máximo
	else if (enemy.aimAccuracy >= 0.85) accuracyColor = '#ff8800'; // Laranja = perigo alto
	else accuracyColor = '#ffff00'; // Amarelo = perigo médio
	
	// Desenhar anel de mira pulsante
	const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
	ctx.strokeStyle = accuracyColor;
	ctx.lineWidth = 2;
	ctx.globalAlpha = pulse * 0.6;
	ctx.beginPath();
	ctx.arc(centerX, centerY, enemy.size/2 + 3, 0, Math.PI * 2);
	ctx.stroke();
	ctx.globalAlpha = 1.0;
	
	// Indicador de tipo/comportamento (símbolo no centro)
	ctx.fillStyle = '#fff';
	ctx.font = 'bold 16px Arial';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	let symbol = '•';
	if (enemy.behavior === 'shoot') symbol = '⊕'; // Símbolo de mira para atiradores
	else if (enemy.behavior === 'chase') symbol = '⚡'; // Raio para perseguidores
	else if (enemy.behavior === 'wander') symbol = '∿'; // Onda para errantes
	ctx.fillText(symbol, centerX, centerY);
	
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
	
	// === MOSTRAR PRECISÃO ACIMA DO INIMIGO ===
	ctx.font = 'bold 10px Arial';
	ctx.fillStyle = accuracyColor;
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 2;
	const accuracyText = `${(enemy.aimAccuracy * 100).toFixed(0)}%`;
	ctx.strokeText(accuracyText, centerX, enemy.y - 18);
	ctx.fillText(accuracyText, centerX, enemy.y - 18);
	ctx.textAlign = 'left';
	ctx.textBaseline = 'alphabetic';
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
