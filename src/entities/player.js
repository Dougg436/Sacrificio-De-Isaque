// entidade player
import { BASE_FIRE_RATE } from '../config.js';

export let player = {
	size: 50,
	x: 0, // será inicializado no main.js
	y: 0,
	speed: 5,
	damage: 1,
	img: null,
	maxHealth: 6, // 3 corações (cada coração = 2 de vida)
	health: 6,
	invulnerable: false,
	invulnerableTime: 0,
	fireRate: BASE_FIRE_RATE, // Taxa de tiro em ms
	lastShotTime: 0, // Timestamp do último tiro
	// Sistema de paralização por Phantom
	paralyzed: false,
	paralyzedTime: 0,
	paralyzedDuration: 2000, // 2 segundos paralisado
	paralyzedBy: null, // Qual inimigo causou a paralização
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
	lastDirectionChange: 0,
	// Recompensas por derrotar Phantom Lord
	phantomImmunity: false, // Imunidade a dano de phantoms
	doubleAttack: false // Duplicação de ataque
};

export function drawPlayer(ctx, mouseX, mouseY) {
	ctx.save();
	ctx.translate(player.x + player.size/2, player.y + player.size/2);
	let angle = Math.atan2(mouseY - (player.y + player.size/2), mouseX - (player.x + player.size/2));
	ctx.rotate(angle);
	
	// Efeitos visuais baseados no estado
	let shouldDraw = true;
	
	// Piscar se invulnerável (mas não se paralisado)
	if (player.invulnerable && !player.paralyzed) {
		shouldDraw = Math.floor(Date.now() / 100) % 2 === 0;
	}
	
	// Efeito de paralização (cor azulada)
	if (player.paralyzed) {
		ctx.shadowBlur = 15;
		ctx.shadowColor = '#4169E1'; // Azul Royal
		ctx.filter = 'hue-rotate(240deg) brightness(0.8)'; // Azulado e escurecido
	}
	
	if (shouldDraw) {
		ctx.drawImage(player.img, -player.size/2, -player.size/2, player.size, player.size);
	}
	
	// Reset de efeitos
	ctx.shadowBlur = 0;
	ctx.filter = 'none';
	ctx.restore();
}

export function takeDamage(amount, enemyType = null) {
	if (player.invulnerable) return;
	
	// Verificar imunidade a phantoms
	if (player.phantomImmunity && (enemyType === 'phantom' || enemyType === 'phantomlord')) {
		console.log('🛡️ Dano de Phantom bloqueado pela imunidade!');
		return;
	}
	
	player.health -= amount;
	if (player.health < 0) player.health = 0;
	
	// Ativar invulnerabilidade por 1 segundo
	player.invulnerable = true;
	player.invulnerableTime = Date.now() + 1000;
}

// Função para paralisar o player (usado pelo Phantom)
export function paralyzePlayer(enemy, duration = 2000) {
	if (player.invulnerable || player.paralyzed) return false;
	
	console.log(`Player foi paralisado por ${enemy.type} por ${duration}ms!`);
	
	player.paralyzed = true;
	player.paralyzedTime = Date.now();
	player.paralyzedDuration = duration;
	player.paralyzedBy = enemy;
	
	// Também ativar invulnerabilidade para evitar dano contínuo
	player.invulnerable = true;
	player.invulnerableTime = Date.now() + Math.min(1000, duration);
	
	return true;
}

export function updatePlayer() {
	// === SISTEMA DE PARALIZAÇÃO ===
	if (player.paralyzed) {
		const now = Date.now();
		if (now - player.paralyzedTime >= player.paralyzedDuration) {
			// Paralização expirou
			player.paralyzed = false;
			player.paralyzedBy = null;
			console.log('Player não está mais paralisado!');
		}
		// Se ainda paralisado, manter posição anterior
		if (player.paralyzed) {
			player.x = player.previousX;
			player.y = player.previousY;
		}
	}

	// Calcular velocidade
	player.velocityX = player.x - player.previousX;
	player.velocityY = player.y - player.previousY;
	
	// Calcular aceleração (mudança na velocidade)
	player.accelerationX = player.velocityX - player.previousVelocityX;
	player.accelerationY = player.velocityY - player.previousVelocityY;
	
	// Adicionar ao histórico de movimento
	const speed = Math.sqrt(player.velocityX ** 2 + player.velocityY ** 2);
	const direction = Math.atan2(player.velocityY, player.velocityX);
	
	player.movementHistory.push({
		x: player.x,
		y: player.y,
		vx: player.velocityX,
		vy: player.velocityY,
		ax: player.accelerationX,
		ay: player.accelerationY,
		speed: speed,
		direction: direction,
		timestamp: Date.now()
	});
	
	// Limitar tamanho do histórico
	if (player.movementHistory.length > player.maxHistorySize) {
		player.movementHistory.shift();
	}
	
	// Analisar padrões de movimento (apenas se temos histórico suficiente)
	if (player.movementHistory.length >= 15) {
		analyzeMovementPatterns();
	}
	
	// Atualizar valores anteriores
	player.previousX = player.x;
	player.previousY = player.y;
	player.previousVelocityX = player.velocityX;
	player.previousVelocityY = player.velocityY;
	
	// Atualizar invulnerabilidade
	if (player.invulnerable && Date.now() > player.invulnerableTime) {
		player.invulnerable = false;
	}
}

/**
 * Analisa padrões de movimento do player para predição avançada
 */
function analyzeMovementPatterns() {
	const history = player.movementHistory;
	const recentHistory = history.slice(-15); // Últimos 15 frames
	
	if (recentHistory.length < 10) return;
	
	// 1. DETECTAR MOVIMENTO CIRCULAR
	const circularScore = detectCircularMotion(recentHistory);
	
	// 2. DETECTAR ZIGZAG (mudanças rápidas de direção)
	const zigzagScore = detectZigzagMotion(recentHistory);
	
	// 3. DETECTAR STRAFE (movimento lateral constante)
	const strafeScore = detectStrafeMotion(recentHistory);
	
	// 4. DETECTAR MOVIMENTO RETO
	const straightScore = detectStraightMotion(recentHistory);
	
	// Determinar padrão dominante com critérios mais rigorosos
	const patterns = [
		{ name: 'circular', score: circularScore },
		{ name: 'zigzag', score: zigzagScore },
		{ name: 'strafe', score: strafeScore },
		{ name: 'straight', score: straightScore }
	];
	
	patterns.sort((a, b) => b.score - a.score);
	const dominant = patterns[0];
	const secondBest = patterns[1];
	
	// Só atualizar padrão se:
	// 1. Score for alto o suficiente (> 0.6)
	// 2. For significativamente melhor que o segundo lugar (diferença > 0.2)
	// 3. OU se o score atual for muito baixo (sem padrão claro)
	
	const minConfidenceThreshold = 0.6;
	const dominanceThreshold = 0.2;
	
	if (dominant.score > minConfidenceThreshold && 
		(dominant.score - secondBest.score) > dominanceThreshold) {
		
		player.movementPattern = dominant.name;
		player.patternConfidence = dominant.score;
		
	} else if (dominant.score < 0.3) {
		// Se nenhum padrão tem score decente, é realmente random
		player.movementPattern = 'random';
		player.patternConfidence = 0;
		
	} else {
		// Scores medianos - manter padrão anterior mas reduzir confiança
		player.patternConfidence = Math.max(player.patternConfidence * 0.9, 0.1);
		if (player.patternConfidence < 0.3) {
			player.movementPattern = 'random';
		}
	}
	
	// Calcular velocidade média
	const speeds = recentHistory.map(h => h.speed);
	player.averageSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
	
	// Contar mudanças de direção
	let dirChanges = 0;
	for (let i = 1; i < recentHistory.length; i++) {
		const angleDiff = Math.abs(recentHistory[i].direction - recentHistory[i-1].direction);
		// Normalizar para 0-π
		const normalizedDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
		if (normalizedDiff > Math.PI / 4) { // Mudança de 45+ graus
			dirChanges++;
		}
	}
	player.directionChanges = dirChanges;
}

/**
 * Detecta se o player está se movendo em círculos
 */
function detectCircularMotion(history) {
	if (history.length < 12) return 0; // Precisa de mais histórico para círculos
	
	// Verificar se há movimento consistente
	const speeds = history.map(h => h.speed);
	const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
	
	// Se não está se movendo, não pode ser circular
	if (avgSpeed < 1.5) return 0;
	
	// Calcular centro de massa do movimento
	const centerX = history.reduce((sum, h) => sum + h.x, 0) / history.length;
	const centerY = history.reduce((sum, h) => sum + h.y, 0) / history.length;
	
	// Calcular distâncias do centro
	const distances = history.map(h => Math.sqrt((h.x - centerX) ** 2 + (h.y - centerY) ** 2));
	const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
	
	// Circular requer raio mínimo (não pode ser círculo muito pequeno)
	if (avgDistance < 30) return 0;
	
	// Calcular variação das distâncias (quanto mais constante, mais circular)
	const variance = distances.reduce((sum, d) => sum + (d - avgDistance) ** 2, 0) / distances.length;
	const stdDev = Math.sqrt(variance);
	
	// Distâncias devem ser MUITO consistentes para ser circular
	const distanceConsistency = 1 - Math.min(stdDev / avgDistance, 1);
	
	// Precisa de consistência alta
	if (distanceConsistency < 0.7) return 0;
	
	// Calcular mudança angular total
	let totalAngleChange = 0;
	let consistentRotation = true;
	const angularVelocities = [];
	
	for (let i = 1; i < history.length; i++) {
		const angle1 = Math.atan2(history[i-1].y - centerY, history[i-1].x - centerX);
		const angle2 = Math.atan2(history[i].y - centerY, history[i].x - centerX);
		let diff = angle2 - angle1;
		
		// Normalizar
		while (diff > Math.PI) diff -= 2 * Math.PI;
		while (diff < -Math.PI) diff += 2 * Math.PI;
		
		angularVelocities.push(diff);
		totalAngleChange += Math.abs(diff);
	}
	
	// Verificar se a rotação é consistente (mesmo sentido)
	const positiveRotations = angularVelocities.filter(v => v > 0).length;
	const negativeRotations = angularVelocities.filter(v => v < 0).length;
	const rotationConsistency = Math.abs(positiveRotations - negativeRotations) / angularVelocities.length;
	
	// Deve ter rotação consistente em uma direção
	if (rotationConsistency < 0.6) return 0;
	
	// Circular se há rotação significativa (pelo menos 90 graus total)
	const rotationScore = Math.min(totalAngleChange / (Math.PI / 2), 1);
	
	// Precisa de rotação mínima
	if (rotationScore < 0.5) return 0;
	
	const finalScore = (distanceConsistency * 0.4 + rotationScore * 0.4 + rotationConsistency * 0.2);
	
	// Só retornar score alto se realmente for circular
	return finalScore > 0.7 ? finalScore : 0;
}

/**
 * Detecta movimento em zigzag
 */
function detectZigzagMotion(history) {
	if (history.length < 10) return 0;
	
	// Verificar se há movimento
	const speeds = history.map(h => h.speed);
	const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
	
	if (avgSpeed < 1.5) return 0;
	
	let directionChanges = 0;
	let rapidChanges = 0;
	let alternatingChanges = 0;
	const recentDirections = [];
	
	for (let i = 2; i < history.length; i++) {
		const angle1 = history[i-2].direction;
		const angle2 = history[i-1].direction;
		const angle3 = history[i].direction;
		
		// Calcular mudanças de ângulo
		let diff1 = angle2 - angle1;
		let diff2 = angle3 - angle2;
		
		// Normalizar
		while (diff1 > Math.PI) diff1 -= 2 * Math.PI;
		while (diff1 < -Math.PI) diff1 += 2 * Math.PI;
		while (diff2 > Math.PI) diff2 -= 2 * Math.PI;
		while (diff2 < -Math.PI) diff2 += 2 * Math.PI;
		
		// Zigzag = mudanças SIGNIFICATIVAS de direção (> 30 graus)
		const minAngleChange = Math.PI / 6; // 30 graus
		
		if (Math.abs(diff1) > minAngleChange && Math.abs(diff2) > minAngleChange) {
			directionChanges++;
			
			// Zigzag = mudanças em sentidos opostos (alternando)
			if (Math.sign(diff1) !== Math.sign(diff2)) {
				rapidChanges++;
				recentDirections.push(Math.sign(diff1), Math.sign(diff2));
			}
		}
	}
	
	// Verificar se há padrão alternante nas últimas mudanças
	if (recentDirections.length >= 6) {
		for (let i = 0; i < recentDirections.length - 3; i += 2) {
			if (recentDirections[i] !== recentDirections[i+2] && 
				recentDirections[i+1] !== recentDirections[i+3] &&
				recentDirections[i] !== recentDirections[i+1]) {
				alternatingChanges++;
			}
		}
	}
	
	const changeRatio = directionChanges / (history.length - 2);
	const oppositeRatio = rapidChanges / Math.max(directionChanges, 1);
	const alternatingRatio = alternatingChanges / Math.max(recentDirections.length / 2, 1);
	
	// Zigzag verdadeiro precisa de:
	// 1. Muitas mudanças de direção (> 40%)
	// 2. Maioria em sentidos opostos (> 70%)
	// 3. Padrão alternante recente (> 50%)
	
	if (changeRatio < 0.4 || oppositeRatio < 0.7) return 0;
	
	const finalScore = changeRatio * 0.4 + oppositeRatio * 0.4 + alternatingRatio * 0.2;
	
	// Só considerar zigzag se score for alto
	return finalScore > 0.6 ? finalScore : 0;
}

/**
 * Detecta movimento de strafe (lateral)
 */
function detectStrafeMotion(history) {
	if (history.length < 10) return 0;
	
	// Primeiro verificar se há movimento consistente
	const speeds = history.map(h => h.speed);
	const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
	
	// Se não está se movendo muito, não é strafe
	if (avgSpeed < 2) return 0;
	
	// Strafe = direção MUITO consistente ao longo do tempo
	const directions = history.map(h => h.direction);
	
	// Calcular desvio padrão das direções
	const avgDirection = directions.reduce((a, b) => a + b, 0) / directions.length;
	let totalDiff = 0;
	let maxDiff = 0;
	
	for (let i = 0; i < directions.length; i++) {
		let diff = Math.abs(directions[i] - avgDirection);
		// Normalizar para 0-π
		diff = Math.min(diff, 2 * Math.PI - diff);
		totalDiff += diff;
		if (diff > maxDiff) maxDiff = diff;
	}
	
	const avgDiff = totalDiff / directions.length;
	
	// Strafe APENAS se direção for MUITO consistente
	// Máximo de 15 graus de variação média
	if (avgDiff > Math.PI / 12) return 0; // 15 graus
	// E nenhuma mudança maior que 30 graus
	if (maxDiff > Math.PI / 6) return 0; // 30 graus
	
	const directionConsistency = 1 - (avgDiff / (Math.PI / 12));
	
	// Verificar se velocidade é consistente (não para e anda)
	const speedVariance = speeds.reduce((sum, s) => sum + (s - avgSpeed) ** 2, 0) / speeds.length;
	const speedConsistency = 1 - Math.min(Math.sqrt(speedVariance) / avgSpeed, 1);
	
	// Strafe requer ALTA consistência em direção E velocidade
	const finalScore = directionConsistency * 0.6 + speedConsistency * 0.4;
	
	// Só considerar strafe se score for alto
	return finalScore > 0.75 ? finalScore : 0;
}

/**
 * Detecta movimento em linha reta
 */
function detectStraightMotion(history) {
	if (history.length < 8) return 0;
	
	// Primeiro verificar se há velocidade consistente e não-zero
	const speeds = history.map(h => h.speed);
	const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
	
	// Se não está se movendo muito, não pode ser "straight"
	if (avgSpeed < 2) return 0;
	
	// Calcular variação de direção - straight deve ter direção MUITO consistente
	const directions = history.map(h => h.direction);
	let maxAngleDiff = 0;
	for (let i = 1; i < directions.length; i++) {
		let diff = Math.abs(directions[i] - directions[i-1]);
		// Normalizar para 0-π
		diff = Math.min(diff, 2 * Math.PI - diff);
		if (diff > maxAngleDiff) maxAngleDiff = diff;
	}
	
	// Se mudou mais de 20 graus em qualquer frame, NÃO é straight
	if (maxAngleDiff > Math.PI / 9) return 0; // 20 graus
	
	// Calcular desvio da linha reta usando regressão linear
	const n = history.length;
	const sumX = history.reduce((sum, h) => sum + h.x, 0);
	const sumY = history.reduce((sum, h) => sum + h.y, 0);
	const sumXY = history.reduce((sum, h, i) => sum + i * h.x, 0);
	const sumX2 = history.reduce((sum, h, i) => sum + i * i, 0);
	const sumI = (n * (n - 1)) / 2;
	
	// Coeficientes da linha de tendência
	const slopeX = (n * sumXY - sumI * sumX) / (n * sumX2 - sumI * sumI);
	const interceptX = (sumX - slopeX * sumI) / n;
	
	// Calcular desvio médio da linha
	let totalDeviation = 0;
	history.forEach((h, i) => {
		const expectedX = slopeX * i + interceptX;
		const deviation = Math.abs(h.x - expectedX);
		totalDeviation += deviation;
	});
	
	const avgDeviation = totalDeviation / n;
	
	// Straight APENAS se desvio MUITO pequeno (menos de 15px)
	if (avgDeviation > 15) return 0;
	
	// Quanto menor o desvio, mais reto
	const straightness = Math.max(0, 1 - avgDeviation / 15);
	
	// Verificar consistência de velocidade - straight deve ter aceleração mínima
	const speedVariance = speeds.reduce((sum, s) => sum + (s - avgSpeed) ** 2, 0) / speeds.length;
	const speedConsistency = 1 - Math.min(Math.sqrt(speedVariance) / Math.max(avgSpeed, 0.1), 1);
	
	// Precisa de ALTA consistência de velocidade E baixo desvio
	const finalScore = straightness * 0.6 + speedConsistency * 0.4;
	
	// Só retornar score alto se realmente for straight
	return finalScore > 0.7 ? finalScore : 0;
}

export function canShoot() {
	const now = Date.now();
	if (now - player.lastShotTime >= player.fireRate) {
		player.lastShotTime = now;
		return true;
	}
	return false;
}

// Função para conceder recompensas por derrotar o Phantom Lord
export function grantPhantomLordRewards() {
	player.phantomImmunity = true;
	player.doubleAttack = true;
	player.damage *= 2; // Duplicar o dano base
	console.log('🎁 RECOMPENSAS DO PHANTOM LORD CONCEDIDAS!');
	console.log('✨ Imunidade a dano de Phantoms ativada!');
	console.log('⚔️ Ataque duplicado! Dano agora:', player.damage);
}
