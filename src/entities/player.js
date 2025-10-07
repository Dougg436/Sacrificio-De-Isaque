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
	
	// Determinar padrão dominante
	const patterns = [
		{ name: 'circular', score: circularScore },
		{ name: 'zigzag', score: zigzagScore },
		{ name: 'strafe', score: strafeScore },
		{ name: 'straight', score: straightScore }
	];
	
	patterns.sort((a, b) => b.score - a.score);
	const dominant = patterns[0];
	
	// Atualizar padrão apenas se confiança for alta o suficiente
	if (dominant.score > 0.4) {
		player.movementPattern = dominant.name;
		player.patternConfidence = dominant.score;
	} else {
		player.movementPattern = 'random';
		player.patternConfidence = 0;
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
	if (history.length < 10) return 0;
	
	// Calcular centro de massa do movimento
	const centerX = history.reduce((sum, h) => sum + h.x, 0) / history.length;
	const centerY = history.reduce((sum, h) => sum + h.y, 0) / history.length;
	
	// Calcular distâncias do centro
	const distances = history.map(h => Math.sqrt((h.x - centerX) ** 2 + (h.y - centerY) ** 2));
	const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
	
	// Calcular variação das distâncias (quanto mais constante, mais circular)
	const variance = distances.reduce((sum, d) => sum + (d - avgDistance) ** 2, 0) / distances.length;
	const stdDev = Math.sqrt(variance);
	
	// Circular se distâncias são consistentes E há mudança angular consistente
	const distanceConsistency = 1 - Math.min(stdDev / avgDistance, 1);
	
	// Calcular mudança angular total
	let totalAngleChange = 0;
	for (let i = 1; i < history.length; i++) {
		const angle1 = Math.atan2(history[i-1].y - centerY, history[i-1].x - centerX);
		const angle2 = Math.atan2(history[i].y - centerY, history[i].x - centerX);
		let diff = angle2 - angle1;
		// Normalizar
		while (diff > Math.PI) diff -= 2 * Math.PI;
		while (diff < -Math.PI) diff += 2 * Math.PI;
		totalAngleChange += Math.abs(diff);
	}
	
	// Circular se há rotação significativa
	const rotationScore = Math.min(totalAngleChange / Math.PI, 1);
	
	return (distanceConsistency * 0.6 + rotationScore * 0.4);
}

/**
 * Detecta movimento em zigzag
 */
function detectZigzagMotion(history) {
	if (history.length < 8) return 0;
	
	let directionChanges = 0;
	let rapidChanges = 0;
	
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
		
		// Zigzag = mudanças de direção em sentidos opostos
		if (Math.abs(diff1) > Math.PI / 6 && Math.abs(diff2) > Math.PI / 6) {
			directionChanges++;
			if (Math.sign(diff1) !== Math.sign(diff2)) {
				rapidChanges++;
			}
		}
	}
	
	const changeRatio = directionChanges / (history.length - 2);
	const oppositeRatio = rapidChanges / Math.max(directionChanges, 1);
	
	return Math.min(changeRatio * oppositeRatio * 2, 1);
}

/**
 * Detecta movimento de strafe (lateral)
 */
function detectStrafeMotion(history) {
	if (history.length < 10) return 0;
	
	// Calcular direção geral do movimento
	const firstHalf = history.slice(0, Math.floor(history.length / 2));
	const secondHalf = history.slice(Math.floor(history.length / 2));
	
	const avgDir1 = Math.atan2(
		firstHalf.reduce((sum, h) => sum + h.vy, 0),
		firstHalf.reduce((sum, h) => sum + h.vx, 0)
	);
	const avgDir2 = Math.atan2(
		secondHalf.reduce((sum, h) => sum + h.vy, 0),
		secondHalf.reduce((sum, h) => sum + h.vx, 0)
	);
	
	// Strafe = direção consistente ao longo do tempo
	let diff = Math.abs(avgDir2 - avgDir1);
	while (diff > Math.PI) diff = 2 * Math.PI - diff;
	
	const directionConsistency = 1 - (diff / Math.PI);
	
	// Verificar se velocidade é consistente (não para e anda)
	const speeds = history.map(h => h.speed);
	const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
	const speedVariance = speeds.reduce((sum, s) => sum + (s - avgSpeed) ** 2, 0) / speeds.length;
	const speedConsistency = 1 - Math.min(Math.sqrt(speedVariance) / avgSpeed, 1);
	
	return directionConsistency * 0.5 + speedConsistency * 0.5;
}

/**
 * Detecta movimento em linha reta
 */
function detectStraightMotion(history) {
	if (history.length < 8) return 0;
	
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
	
	// Quanto menor o desvio, mais reto
	const straightness = Math.max(0, 1 - avgDeviation / 50); // 50px de desvio = 0 score
	
	// Verificar consistência de velocidade
	const speeds = history.map(h => h.speed);
	const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
	const speedVariance = speeds.reduce((sum, s) => sum + (s - avgSpeed) ** 2, 0) / speeds.length;
	const speedConsistency = 1 - Math.min(Math.sqrt(speedVariance) / Math.max(avgSpeed, 0.1), 1);
	
	return straightness * 0.7 + speedConsistency * 0.3;
}

export function canShoot() {
	const now = Date.now();
	if (now - player.lastShotTime >= player.fireRate) {
		player.lastShotTime = now;
		return true;
	}
	return false;
}
