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
		},
		phantom: {
			size: 38,
			health: 6,
			speed: 2.8, // Aumentado para melhor perseguição
			damage: 3, // Aumentado - dano corpo a corpo mais perigoso
			color: '#663399', // Roxo para phantom
			behavior: 'phantom_hunt', // Comportamento de caça híbrido
			shootCooldown: 0,
			shootInterval: 2200, // Atira a cada 2.2 segundos
			aimAccuracy: 0.92, // 92% de precisão
			// Propriedades específicas do phantom
			isVisible: true, // Estado de visibilidade
			invisibilityDuration: 4000, // 4 segundos invisível
			invisibilityStartTime: 0, // Quando ficou invisível
			repositionOnInvisible: true, // Se reposiciona quando invisível
			repositionTimer: 0, // Timer para reposicionamento
			hitCount: 0, // Contador de tiros recebidos
			isCompletelyInvisible: false, // Estado de invisibilidade completa após 2 hits
			hasTeleported: false // Flag para controlar teleporte no 4º segundo
		},
		phantomlord: {
			size: 60, // Maior que inimigos normais (chefão)
			health: 20, // 20 tiros para derrotar
			speed: 1.5, // Mais lento para combate mais deliberado
			damage: 2, // 1 coração completo (ajustado de 6 para 2)
			color: '#9932CC', // Roxo escuro intenso (DarkOrchid)
			behavior: 'phantomlord_hunt', // Comportamento único de chefão
			shootCooldown: 0,
			shootInterval: 1500, // Intervalos mais longos entre ataques
			aimAccuracy: 0.95, // Alta precisão de chefão
			// Propriedades especiais do Phantom Lord
			isBoss: true, // Flag de chefão
			isVisible: true, // Estado de visibilidade
			invisibilityDuration: 3000, // 3 segundos invisível (mais rápido que phantom comum)
			invisibilityStartTime: 0,
			lastRegenerationTime: 0, // Para regeneração de 3%
			spectralTeleportCooldown: 8000, // Cooldown de 8s para teleporte espectral
			lastTeleportTime: 0, // Timestamp do último teleporte
			pulseRadius: 80, // Raio do pulso paralisante (maior que phantom comum)
			burstShotCount: 0, // Contador para rajadas de tiros
			maxBurstShots: 3, // Máximo de tiros em rajada
			burstInterval: 200, // Intervalo entre tiros da rajada (200ms)
			lastBurstTime: 0, // Timestamp do último tiro da rajada
			teleportEffectDuration: 1000, // Duração dos efeitos visuais de teleporte
			lastTeleportEffectTime: 0 // Para controle dos efeitos visuais
		},
		shard: {
			size: 38, // Mesmo tamanho do Phantom
			health: 6, // Mesma vida do Phantom
			speed: 2.24, // 80% da velocidade do Phantom (2.8 * 0.8)
			damage: 2, // Dano da barreira de cristais
			color: '#87CEEB', // Azul-claro translúcido (SkyBlue)
			behavior: 'shard_orbit', // Comportamento único
			shootCooldown: 0,
			shootInterval: Infinity, // Não atira projéteis
			aimAccuracy: 0, // Não usa mira
			// Propriedades especiais do Shard
			crystalBarrierFragments: 5, // 4-6 fragmentos (média 5)
			crystalBarrierRadius: 50, // Raio da barreira orbital
			crystalRotationSpeed: 0.02, // Velocidade de rotação (radianos por frame)
			crystalRotationAngle: 0, // Ângulo atual de rotação
			rotationDirection: 1, // 1 = horário, -1 = anti-horário
			rotationChangeTimer: 0, // Timer para mudança de direção
			rotationChangeInterval: 240, // 4-6 segundos (60fps * 4-6)
			barrierRegenerationTime: 3000, // 3 segundos para regenerar barreira
			barrierDestroyed: false, // Se barreira foi destruída
			barrierDestroyedTime: 0, // Timestamp da destruição
			lowHealthSpeedBoost: false, // Se está com boost de velocidade (<50% HP)
			originalColor: '#87CEEB' // Cor original para efeitos
		},
		minishard: {
			size: 28, // Menor que o Shard normal
			health: 3, // Metade da vida do Shard (6 / 2)
			speed: 2.688, // 120% da velocidade do Shard (2.24 * 1.2)
			damage: 2, // Mesmo dano da barreira
			color: '#B0E0E6', // Azul mais claro (PowderBlue)
			behavior: 'minishard_aggressive', // Comportamento agressivo
			shootCooldown: 0,
			shootInterval: Infinity, // Não atira projéteis
			aimAccuracy: 0, // Não usa mira
			// Propriedades especiais do Mini Shard
			crystalBarrierFragments: 3, // 2-3 fragmentos (média 3)
			crystalBarrierRadius: 35, // Raio menor da barreira
			crystalRotationSpeed: 0.025, // Ligeiramente mais rápido
			crystalRotationAngle: 0, // Ângulo atual de rotação
			rotationDirection: 1, // 1 = horário, -1 = anti-horário
			rotationChangeTimer: 0, // Timer para mudança de direção
			rotationChangeInterval: 180, // Muda mais frequentemente (3s)
			barrierRegenerationTime: 2000, // Regenera mais rápido (2s)
			barrierDestroyed: false, // Se barreira foi destruída
			barrierDestroyedTime: 0, // Timestamp da destruição
			lowHealthSpeedBoost: true, // Sempre rápido
			originalColor: '#B0E0E6', // Cor original para efeitos
			isMiniShard: true // Flag para identificar como mini
		},
		crystalcore: {
			size: 80, // Grande como um chefão
			health: 50, // 50 HP - chefão mais acessível
			speed: 1.2, // Movimento mais lento e deliberado
			damage: 2, // 1 coração completo (ajustado de 8 para 2)
			color: '#4169E1', // Azul real intenso (RoyalBlue)
			behavior: 'crystalcore_boss', // Comportamento único de chefão
			shootCooldown: 0,
			shootInterval: 6000, // Feixes a cada 6 segundos (ainda mais tempo entre ataques)
			aimAccuracy: 0, // Feixes são aleatórios
			// Propriedades especiais do Crystal Core
			isBoss: true, // Flag de chefão
			lightBeamCount: 5, // 3-7 feixes por ataque (média 5)
			lightBeamDuration: 3000, // 3 segundos por feixe (mais duradouros)
			lightBeamWidth: 8, // Largura dos feixes
			lightBeamLength: 1200, // Comprimento atravessa toda a sala
			activeBeams: [], // Array de feixes ativos
			warningBeams: [], // Array de feixes de aviso roxos
			lastBeamTime: 0, // Timestamp do último feixe
			warningDuration: 800, // 0.8 segundos de aviso roxo antes do feixe real
			// Sistema de invocação de Shards
			shardSummonInterval: 25000, // 25 segundos (menos frequente)
			lastShardSummonTime: 0, // Timestamp da última invocação
			maxSummonedShards: 2, // 2 Shards por invocação
			// Movimento errático
			movementDirection: 0, // Ângulo atual de movimento
			movementChangeTimer: 0, // Timer para mudança de direção
			movementChangeInterval: 180, // Mudar direção a cada 3 segundos (movimento mais lento)
			crystalPulseIntensity: 1.0, // Intensidade do pulso (baseado na vida)
			lightTrails: [] // Rastros de luz residuais
		},
		redphantomcore: {
			size: 120, // Ainda maior que Crystal Core - chefão supremo
			health: 300, // 900 HP divididos entre cópias (300 HP real)
			speed: 0.8, // Movimento ainda mais lento e imponente
			damage: 2, // 1 coração completo (ajustado de 15 para 2)
			color: '#DC143C', // Vermelho carmesim intenso
			behavior: 'redphantomcore_supreme', // Comportamento único supremo
			shootCooldown: 0,
			shootInterval: 4500, // Ultra Rays a cada 4.5 segundos (intervalos mais longos)
			aimAccuracy: 1.0, // Ultra Rays miram no jogador
			// Propriedades especiais do Red Phantom Core
			isBoss: true,
			isSupremeBoss: true, // Flag de chefão supremo
			ultraRayCount: 1, // 1 Ultra Ray por ataque
			ultraRayDuration: 2000, // 2 segundos de feixe contínuo
			ultraRayWidth: 25, // Feixe muito mais largo
			ultraRayLength: 1400, // Comprimento atravessa toda a sala ampliada
			activeUltraRays: [], // Array de Ultra Rays ativos
			warningRays: [], // Array de linhas de aviso vermelhas
			lastUltraRayTime: 0, // Timestamp do último Ultra Ray
			warningDuration: 1000, // 1 segundo de aviso antes do Ultra Ray
			// Sistema de Divisão Tripla (Ilusão Espectral)
			divisionInterval: 14000, // Divisão a cada 14 segundos (mais tempo entre divisões)
			lastDivisionTime: 0, // Timestamp da última divisão
			divisionDuration: 8000, // 8 segundos em estado dividido
			isInDivision: false, // Flag de estado dividido
			illusions: [], // Array de cópias ilusórias
			isRealCopy: true, // Flag indicando se é a cópia real
			// Sistema de Invocação de Reforços
			reinforcementInterval: 20000, // Reforços a cada 20 segundos (menos frequentes)
			lastReinforcementTime: 0, // Timestamp da última invocação
			maxPhantoms: 2, // Máximo 2 Phantoms na arena
			maxShards: 2, // Máximo 2 Shards na arena
			// Movimento horizontal restrito
			movementAxis: 'horizontal', // Só se move horizontalmente
			baseY: 0, // Posição Y fixa (será definida no spawn)
			horizontalDirection: 1, // Direção horizontal (1 ou -1)
			movementRange: 300, // Distância máxima de movimento horizontal
			centerX: 0, // Centro de movimento horizontal
			// Efeitos visuais especiais
			crimsonPulseIntensity: 1.0, // Intensidade do pulso carmesim
			shadowTrails: [], // Rastros de sombra vermelha
			energyFissures: [], // Fendas de energia carmesim
			// Estados do chefão
			phase: 1, // Fase atual (1, 2, 3)
			phaseTransition: false // Flag de transição de fase
		}
	};
	
	const template = enemyTypes[type] || enemyTypes.fly;
	
	const enemy = {
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

	// Adicionar propriedades específicas do phantom
	if (type === 'phantom') {
		enemy.isVisible = template.isVisible;
		enemy.invisibilityDuration = template.invisibilityDuration;
		enemy.invisibilityStartTime = template.invisibilityStartTime;
		enemy.repositionOnInvisible = template.repositionOnInvisible;
		enemy.repositionTimer = template.repositionTimer;
		enemy.hitCount = template.hitCount;
		enemy.isCompletelyInvisible = template.isCompletelyInvisible;
		enemy.hasTeleported = template.hasTeleported;
		enemy.originalColor = template.color; // Salvar cor original
	}
	
	// Adicionar propriedades específicas do Phantom Lord
	if (type === 'phantomlord') {
		enemy.isBoss = template.isBoss;
		enemy.isVisible = template.isVisible;
		enemy.invisibilityDuration = template.invisibilityDuration;
		enemy.invisibilityStartTime = template.invisibilityStartTime;
		enemy.lastRegenerationTime = template.lastRegenerationTime;
		enemy.spectralTeleportCooldown = template.spectralTeleportCooldown;
		enemy.lastTeleportTime = template.lastTeleportTime;
		enemy.pulseRadius = template.pulseRadius;
		enemy.burstShotCount = template.burstShotCount;
		enemy.maxBurstShots = template.maxBurstShots;
		enemy.burstInterval = template.burstInterval;
		enemy.lastBurstTime = template.lastBurstTime;
		enemy.teleportEffectDuration = template.teleportEffectDuration;
		enemy.lastTeleportEffectTime = template.lastTeleportEffectTime;
		enemy.originalColor = template.color;
	}
	
	// Adicionar propriedades específicas do Shard
	if (type === 'shard' || type === 'minishard') {
		enemy.crystalBarrierFragments = template.crystalBarrierFragments;
		enemy.crystalBarrierRadius = template.crystalBarrierRadius;
		enemy.crystalRotationSpeed = template.crystalRotationSpeed;
		enemy.crystalRotationAngle = template.crystalRotationAngle;
		enemy.rotationDirection = template.rotationDirection;
		enemy.rotationChangeTimer = template.rotationChangeTimer;
		enemy.rotationChangeInterval = template.rotationChangeInterval + Math.random() * 120; // Variação ±2s
		enemy.barrierRegenerationTime = template.barrierRegenerationTime;
		enemy.barrierDestroyed = template.barrierDestroyed;
		enemy.barrierDestroyedTime = template.barrierDestroyedTime;
		enemy.lowHealthSpeedBoost = template.lowHealthSpeedBoost;
		enemy.originalColor = template.originalColor;
		
		if (type === 'minishard') {
			enemy.isMiniShard = template.isMiniShard;
		}
	}
	
	// Adicionar propriedades específicas do Crystal Core
	if (type === 'crystalcore') {
		enemy.isBoss = template.isBoss;
		enemy.lightBeamCount = template.lightBeamCount + Math.floor(Math.random() * 3) - 1; // 4-6 feixes
		enemy.lightBeamDuration = template.lightBeamDuration;
		enemy.lightBeamWidth = template.lightBeamWidth;
		enemy.lightBeamLength = template.lightBeamLength;
		enemy.activeBeams = template.activeBeams.slice(); // Cópia do array
		enemy.warningBeams = template.warningBeams.slice(); // Cópia do array de avisos
		enemy.lastBeamTime = template.lastBeamTime;
		enemy.warningDuration = template.warningDuration;
		enemy.shardSummonInterval = template.shardSummonInterval;
		enemy.lastShardSummonTime = template.lastShardSummonTime;
		enemy.maxSummonedShards = template.maxSummonedShards;
		enemy.movementDirection = Math.random() * Math.PI * 2; // Direção inicial aleatória
		enemy.movementChangeTimer = template.movementChangeTimer;
		enemy.movementChangeInterval = template.movementChangeInterval + Math.random() * 120; // Variação
		enemy.crystalPulseIntensity = template.crystalPulseIntensity;
		enemy.lightTrails = template.lightTrails.slice(); // Cópia do array
		enemy.originalColor = template.originalColor;
	}
	
	// Adicionar propriedades específicas do Red Phantom Core
	if (type === 'redphantomcore') {
		enemy.isSupremeBoss = template.isSupremeBoss;
		enemy.ultraRayCount = template.ultraRayCount;
		enemy.ultraRayDuration = template.ultraRayDuration;
		enemy.ultraRayWidth = template.ultraRayWidth;
		enemy.ultraRayLength = template.ultraRayLength;
		enemy.activeUltraRays = template.activeUltraRays.slice();
		enemy.warningRays = template.warningRays.slice();
		enemy.lastUltraRayTime = template.lastUltraRayTime;
		enemy.warningDuration = template.warningDuration;
		
		// Sistema de Divisão Tripla
		enemy.divisionInterval = template.divisionInterval;
		enemy.lastDivisionTime = template.lastDivisionTime;
		enemy.divisionDuration = template.divisionDuration;
		enemy.isInDivision = template.isInDivision;
		enemy.illusions = template.illusions.slice();
		enemy.isRealCopy = template.isRealCopy;
		
		// Sistema de Reforços
		enemy.reinforcementInterval = template.reinforcementInterval;
		enemy.lastReinforcementTime = template.lastReinforcementTime;
		enemy.maxPhantoms = template.maxPhantoms;
		enemy.maxShards = template.maxShards;
		
		// Movimento horizontal restrito
		enemy.movementAxis = template.movementAxis;
		enemy.baseY = y; // Posição Y fixa baseada no spawn
		enemy.horizontalDirection = Math.random() > 0.5 ? 1 : -1; // Direção inicial aleatória
		enemy.movementRange = template.movementRange;
		enemy.centerX = x; // Centro de movimento baseado na posição inicial
		
		// Efeitos visuais especiais
		enemy.crimsonPulseIntensity = template.crimsonPulseIntensity;
		enemy.shadowTrails = template.shadowTrails.slice();
		enemy.energyFissures = template.energyFissures.slice();
		enemy.phase = template.phase;
		enemy.phaseTransition = template.phaseTransition;
	}

	return enemy;
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
	
	// === LÓGICA ESPECIAL PARA PHANTOM ===
	if (enemy.type === 'phantom') {
		// Verificar se deve teleportar no 4º segundo (quando completamente invisível)
		if (!enemy.isVisible && enemy.isCompletelyInvisible && !enemy.hasTeleported &&
			now - enemy.invisibilityStartTime >= (enemy.invisibilityDuration - 100)) { // 100ms antes de reaparecer
			
			// Teleportar próximo ao jogador no último momento
			teleportPhantomNearPlayer(enemy, player);
			enemy.hasTeleported = true;
		}
		
		// Verificar se deve voltar ao estado visível
		if (!enemy.isVisible && now - enemy.invisibilityStartTime >= enemy.invisibilityDuration) {
			enemy.isVisible = true;
			enemy.isCompletelyInvisible = false; // Resetar invisibilidade completa
			enemy.hasTeleported = false; // Resetar flag de teleporte
			enemy.invisibilityStartTime = 0;
			
			// Aparição agressiva: investida imediata em direção ao jogador
			if (distance > 0) {
				enemy.vx = (dx / distance) * enemy.speed * 0.8;
				enemy.vy = (dy / distance) * enemy.speed * 0.8;
			}
			
			// Cooldown de tiro reduzido para ataque imediato se não conseguir contato
			enemy.lastShotTime = now - (enemy.shootInterval * 0.7); // 70% do cooldown já "passado"
			
			const visibilityType = enemy.isCompletelyInvisible ? 'COMPLETAMENTE' : 'normalmente';
			console.log(`Phantom apareceu ${visibilityType} e está investindo!`);
		}
		
		// Comportamento durante invisibilidade
		if (!enemy.isVisible) {
			// Durante invisibilidade: reposicionamento estratégico para próxima investida
			
			// Reduzir movimento gradualmente
			enemy.vx *= 0.90;
			enemy.vy *= 0.90;
			
			// Reposicionamento estratégico
			if (enemy.repositionOnInvisible && enemy.repositionTimer <= 0) {
				if (distance > 0) {
					if (distance > 400) {
						// Se muito longe, aproximar-se sutilmente para melhor posição de ataque
						enemy.vx += (dx / distance) * enemy.speed * 0.3;
						enemy.vy += (dy / distance) * enemy.speed * 0.3;
						enemy.repositionTimer = 40 + Math.random() * 20; // 40-60 frames
					} else if (distance < 120) {
						// Se muito perto, afastar-se para criar distância de investida
						const awayX = -dx / distance;
						const awayY = -dy / distance;
						enemy.vx += awayX * enemy.speed * 0.5;
						enemy.vy += awayY * enemy.speed * 0.5;
						enemy.repositionTimer = 50 + Math.random() * 30; // 50-80 frames
					} else {
						// Distância ideal (120-400px) - posicionamento lateral para flanquear
						const perpX = -dy / distance; // Movimento perpendicular
						const perpY = dx / distance;
						const side = Math.random() < 0.5 ? 1 : -1; // Escolher lado aleatório
						
						enemy.vx += perpX * side * enemy.speed * 0.4;
						enemy.vy += perpY * side * enemy.speed * 0.4;
						enemy.repositionTimer = 60 + Math.random() * 40; // 60-100 frames
					}
				}
			}
			enemy.repositionTimer = Math.max(0, enemy.repositionTimer - 1);
			shouldShoot = false; // Não pode atirar quando invisível
		} else {
			// Comportamento quando visível: ataque híbrido (projéteis + aproximação para contato)
			
			if (distance > 0) {
				// === ESTRATÉGIA BASEADA NA DISTÂNCIA ===
				if (distance > 300) {
					// LONGA DISTÂNCIA: Aproximar-se atirando
					enemy.vx = (dx / distance) * enemy.speed * 0.6;
					enemy.vy = (dy / distance) * enemy.speed * 0.6;
					
					// Atira enquanto se aproxima
					if (now - enemy.lastShotTime >= enemy.shootInterval) {
						shouldShoot = true;
						enemy.lastShotTime = now;
						console.log(`Phantom shooting while approaching! Distance: ${distance.toFixed(1)}`);
					}
				} else if (distance > 80) {
					// MÉDIA DISTÂNCIA: Investida agressiva para contato corpo a corpo
					enemy.vx = (dx / distance) * enemy.speed * 1.2; // Mais rápido para o contato
					enemy.vy = (dy / distance) * enemy.speed * 1.2;
					
					// Atira ocasionalmente durante a investida
					if (now - enemy.lastShotTime >= (enemy.shootInterval * 1.5)) {
						shouldShoot = true;
						enemy.lastShotTime = now;
						console.log(`Phantom charging and shooting! Distance: ${distance.toFixed(1)}`);
					}
				} else {
					// CURTA DISTÂNCIA: Ataque corpo a corpo prioritário
					// Movimento errático para dificultar esquiva do jogador
					const erraticX = (Math.random() - 0.5) * enemy.speed * 0.4;
					const erraticY = (Math.random() - 0.5) * enemy.speed * 0.4;
					
					enemy.vx = ((dx / distance) * enemy.speed * 0.8) + erraticX;
					enemy.vy = ((dy / distance) * enemy.speed * 0.8) + erraticY;
					
					// Raramente atira em curta distância (foco no contato)
					if (now - enemy.lastShotTime >= (enemy.shootInterval * 2)) {
						shouldShoot = true;
						enemy.lastShotTime = now;
						console.log(`Phantom melee focus! Distance: ${distance.toFixed(1)}`);
					}
				}
			}
		}
	} else if (enemy.behavior === 'chase') {
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
	} else if (enemy.behavior === 'phantom_shoot' || enemy.behavior === 'phantom_hunt') {
		// Comportamento para phantom já foi tratado acima
		// Esta seção existe apenas para compatibilidade
	} else if (enemy.behavior === 'phantomlord_hunt') {
		// === LÓGICA ESPECIAL DO PHANTOM LORD ===
		
		// Sistema de regeneração (3% ao ficar visível novamente)
		if (enemy.isVisible && now - enemy.lastRegenerationTime >= 1000) { // Checar a cada 1s
			if (enemy.health < enemy.maxHealth && enemy.invisibilityStartTime === 0) {
				const regenAmount = Math.ceil(enemy.maxHealth * 0.03); // 3% da vida total
				enemy.health = Math.min(enemy.maxHealth, enemy.health + regenAmount);
				enemy.lastRegenerationTime = now;
				console.log(`Phantom Lord regenerou ${regenAmount} HP! Vida atual: ${enemy.health}/${enemy.maxHealth}`);
			}
		}
		
		// Verificar se deve voltar ao estado visível
		if (!enemy.isVisible && now - enemy.invisibilityStartTime >= enemy.invisibilityDuration) {
			enemy.isVisible = true;
			enemy.invisibilityStartTime = 0;
			enemy.lastRegenerationTime = now; // Permitir regeneração imediata
			
			// Teleporte espectral ao reaparecer (se cooldown passou)
			if (now - enemy.lastTeleportTime >= enemy.spectralTeleportCooldown) {
				spectralTeleport(enemy, roomWidth, roomHeight, wallThickness);
				enemy.lastTeleportTime = now;
				enemy.lastTeleportEffectTime = now;
			}
			
			console.log('Phantom Lord reapareceu e está pronto para atacar!');
		}
		
		if (enemy.isVisible) {
			// Estado visível: movimento agressivo + rajadas de tiro
			if (distance > 0) {
				enemy.vx = (dx / distance) * enemy.speed * 1.2; // 20% mais rápido quando visível
				enemy.vy = (dy / distance) * enemy.speed * 1.2;
			}
			
			// Sistema de rajadas rápidas
			if (enemy.burstShotCount < enemy.maxBurstShots) {
				if (now - enemy.lastBurstTime >= enemy.burstInterval && distance < 400) {
					shouldShoot = true;
					enemy.burstShotCount++;
					enemy.lastBurstTime = now;
					console.log(`Phantom Lord rajada ${enemy.burstShotCount}/${enemy.maxBurstShots}!`);
				}
			} else {
				// Finalizar rajada e reiniciar cooldown
				if (now - enemy.lastBurstTime >= enemy.shootInterval) {
					enemy.burstShotCount = 0;
					enemy.lastBurstTime = now;
				}
			}
		} else {
			// Estado invisível: movimento em direção ao jogador para pulso
			if (distance > enemy.pulseRadius) {
				if (distance > 0) {
					enemy.vx = (dx / distance) * enemy.speed * 0.8; // Mais lento quando invisível
					enemy.vy = (dy / distance) * enemy.speed * 0.8;
				}
			} else {
				// Próximo o suficiente: aplicar pulso paralisante e teleportar
				applyPhantomLordPulse(enemy, player, distance);
				
				// Teleporte após pulso (se cooldown passou)
				if (now - enemy.lastTeleportTime >= enemy.spectralTeleportCooldown) {
					spectralTeleport(enemy, roomWidth, roomHeight, wallThickness);
					enemy.lastTeleportTime = now;
					enemy.lastTeleportEffectTime = now;
				}
				
				// Voltar ao estado visível após pulso + teleporte
				enemy.isVisible = true;
				enemy.invisibilityStartTime = 0;
				enemy.lastRegenerationTime = now;
			}
		}
	} else if (enemy.behavior === 'shard_orbit') {
		// === LÓGICA ESPECIAL DO SHARD ===
		
		// Atualizar rotação da barreira de cristais
		enemy.crystalRotationAngle += enemy.crystalRotationSpeed * enemy.rotationDirection;
		if (enemy.crystalRotationAngle > Math.PI * 2) enemy.crystalRotationAngle -= Math.PI * 2;
		if (enemy.crystalRotationAngle < 0) enemy.crystalRotationAngle += Math.PI * 2;
		
		// Mudança periódica de direção de rotação
		enemy.rotationChangeTimer++;
		if (enemy.rotationChangeTimer >= enemy.rotationChangeInterval) {
			enemy.rotationDirection *= -1; // Inverter direção
			enemy.rotationChangeTimer = 0;
			enemy.rotationChangeInterval = 240 + Math.random() * 120; // 4-6 segundos
			console.log(`Shard mudou direção de rotação! Nova direção: ${enemy.rotationDirection > 0 ? 'horário' : 'anti-horário'}`);
		}
		
		// Boost de velocidade quando < 50% HP
		if (enemy.health <= enemy.maxHealth * 0.5 && !enemy.lowHealthSpeedBoost) {
			enemy.lowHealthSpeedBoost = true;
			enemy.crystalRotationSpeed *= 1.5; // 50% mais rápido
			console.log('Shard com pouca vida - rotação acelerada!');
		}
		
		// Regeneração da barreira se foi destruída
		if (enemy.barrierDestroyed && now - enemy.barrierDestroyedTime >= enemy.barrierRegenerationTime) {
			enemy.barrierDestroyed = false;
			console.log('Barreira de cristais regenerada!');
		}
		
		// Movimento: manter distância média (flutuação suave)
		if (distance > 0) {
			const targetDistance = 120; // Distância ideal
			let moveSpeed = enemy.speed;
			
			if (distance < targetDistance - 20) {
				// Muito perto - se afastar
				enemy.vx = -(dx / distance) * moveSpeed * 0.8;
				enemy.vy = -(dy / distance) * moveSpeed * 0.8;
			} else if (distance > targetDistance + 60) {
				// Muito longe - se aproximar
				enemy.vx = (dx / distance) * moveSpeed * 0.6;
				enemy.vy = (dy / distance) * moveSpeed * 0.6;
			} else {
				// Distância boa - movimento orbital suave
				const perpX = -dy / distance; // Movimento perpendicular
				const perpY = dx / distance;
				enemy.vx = perpX * moveSpeed * 0.4;
				enemy.vy = perpY * moveSpeed * 0.4;
			}
		}
		
		// Contra-ataque: acelerar rotação se jogador muito próximo
		if (distance < 80 && !enemy.barrierDestroyed) {
			enemy.crystalRotationSpeed = Math.min(enemy.crystalRotationSpeed * 1.2, 0.08); // Max speed
		}
		
	} else if (enemy.behavior === 'minishard_aggressive') {
		// === LÓGICA ESPECIAL DO MINI SHARD ===
		
		// Atualizar rotação da barreira (mais rápida)
		enemy.crystalRotationAngle += enemy.crystalRotationSpeed * enemy.rotationDirection;
		if (enemy.crystalRotationAngle > Math.PI * 2) enemy.crystalRotationAngle -= Math.PI * 2;
		if (enemy.crystalRotationAngle < 0) enemy.crystalRotationAngle += Math.PI * 2;
		
		// Mudança mais frequente de direção
		enemy.rotationChangeTimer++;
		if (enemy.rotationChangeTimer >= enemy.rotationChangeInterval) {
			enemy.rotationDirection *= -1;
			enemy.rotationChangeTimer = 0;
			enemy.rotationChangeInterval = 120 + Math.random() * 120; // 2-4 segundos
		}
		
		// Regeneração mais rápida da barreira
		if (enemy.barrierDestroyed && now - enemy.barrierDestroyedTime >= enemy.barrierRegenerationTime) {
			enemy.barrierDestroyed = false;
			console.log('Mini Shard - barreira regenerada!');
		}
		
		// Movimento agressivo: perseguição direta mais rápida
		if (distance > 0) {
			enemy.vx = (dx / distance) * enemy.speed;
			enemy.vy = (dy / distance) * enemy.speed;
		}
	} else if (enemy.behavior === 'crystalcore_boss') {
		// === LÓGICA ESPECIAL DO CRYSTAL CORE ===
		
		// Atualizar intensidade do pulso baseado na vida
		enemy.crystalPulseIntensity = enemy.health / enemy.maxHealth;
		
		// === MOVIMENTO ERRÁTICO ===
		enemy.movementChangeTimer++;
		if (enemy.movementChangeTimer >= enemy.movementChangeInterval) {
			// Mudar direção aleatoriamente
			enemy.movementDirection = Math.random() * Math.PI * 2;
			enemy.movementChangeTimer = 0;
			enemy.movementChangeInterval = 60 + Math.random() * 120; // 1-3 segundos
			
			// Criar rastro de luz residual na posição atual
			enemy.lightTrails.push({
				x: enemy.x + enemy.size/2,
				y: enemy.y + enemy.size/2,
				intensity: 0.8,
				life: 180, // 3 segundos de vida
				maxLife: 180
			});
		}
		
		// Aplicar movimento errático
		enemy.vx = Math.cos(enemy.movementDirection) * enemy.speed;
		enemy.vy = Math.sin(enemy.movementDirection) * enemy.speed;
		
		// === SISTEMA DE FEIXES DE LUZ COM AVISO ===
		if (now - enemy.lastBeamTime >= enemy.shootInterval) {
			// FASE 1: Criar feixes de aviso roxos
			enemy.warningBeams = []; // Limpar avisos anteriores
			enemy.activeBeams = []; // Limpar feixes anteriores
			
			const beamPositions = []; // Guardar posições para os feixes reais
			
			for (let i = 0; i < enemy.lightBeamCount; i++) {
				const angle = Math.random() * Math.PI * 2; // Ângulo completamente aleatório
				const position = {
					x: enemy.x + enemy.size/2,
					y: enemy.y + enemy.size/2,
					angle: angle
				};
				beamPositions.push(position);
				
				// Feixe de aviso roxo
				const warningBeam = {
					x: position.x,
					y: position.y,
					angle: angle,
					width: enemy.lightBeamWidth,
					length: enemy.lightBeamLength,
					startTime: now,
					duration: enemy.warningDuration,
					intensity: 0.6
				};
				enemy.warningBeams.push(warningBeam);
			}
			
			// Agendar criação dos feixes reais após o aviso
			setTimeout(() => {
				enemy.activeBeams = []; // Limpar por segurança
				beamPositions.forEach(pos => {
					const realBeam = {
						x: pos.x,
						y: pos.y,
						angle: pos.angle,
						width: enemy.lightBeamWidth,
						length: enemy.lightBeamLength,
						damage: enemy.damage,
						startTime: Date.now(),
						duration: enemy.lightBeamDuration,
						intensity: 0.8 + (1 - enemy.crystalPulseIntensity) * 0.4
					};
					enemy.activeBeams.push(realBeam);
				});
				console.log(`Crystal Core disparou ${enemy.lightBeamCount} feixes devastadores!`);
			}, enemy.warningDuration);
			
			enemy.lastBeamTime = now;
			console.log(`Crystal Core preparando ataque - ${enemy.lightBeamCount} feixes de aviso!`);
		}
		
		// Atualizar feixes de aviso (remover expirados)
		enemy.warningBeams = enemy.warningBeams.filter(beam => 
			now - beam.startTime < beam.duration
		);
		
		// Atualizar feixes ativos (remover expirados)
		enemy.activeBeams = enemy.activeBeams.filter(beam => 
			now - beam.startTime < beam.duration
		);
		
		// === INVOCAÇÃO DE SHARDS ===
		if (now - enemy.lastShardSummonTime >= enemy.shardSummonInterval) {
			// Marcar para invocar Shards (será processado no main.js)
			enemy.shouldSummonShards = true;
			enemy.lastShardSummonTime = now;
			console.log('Crystal Core preparando invocação de Shards!');
		}
		
		// === ATUALIZAR RASTROS DE LUZ ===
		enemy.lightTrails = enemy.lightTrails.filter(trail => {
			trail.life--;
			trail.intensity = (trail.life / trail.maxLife) * 0.8;
			return trail.life > 0;
		});
	} else if (enemy.behavior === 'redphantomcore_supreme') {
		// === LÓGICA ESPECIAL DO RED PHANTOM CORE - CHEFÃO SUPREMO ===
		
		// Atualizar intensidade do pulso carmesim baseado na vida
		enemy.crimsonPulseIntensity = enemy.health / enemy.maxHealth;
		
		// === MOVIMENTO HORIZONTAL RESTRITO ===
		// Red Phantom Core só se move horizontalmente no fundo da arena
		const targetX = enemy.centerX + Math.sin(Date.now() / 2000) * enemy.movementRange;
		enemy.vx = (targetX - enemy.x) * 0.02; // Movimento suave
		enemy.vy = 0; // Sem movimento vertical
		enemy.y = enemy.baseY; // Manter posição Y fixa
		
		// === SISTEMA DE DIVISÃO TRIPLA (ILUSÃO ESPECTRAL) ===
		if (!enemy.isInDivision && now - enemy.lastDivisionTime >= enemy.divisionInterval) {
			// Iniciar divisão tripla
			enemy.isInDivision = true;
			enemy.lastDivisionTime = now;
			
			// Criar 2 ilusões (o real é o próprio enemy)
			enemy.illusions = [];
			for (let i = 0; i < 2; i++) {
				const illusionX = enemy.x + (i - 0.5) * 200; // Espalhar horizontalmente
				const illusion = {
					x: illusionX,
					y: enemy.y,
					size: enemy.size,
					color: enemy.color,
					isIllusion: true,
					alpha: 0.8,
					pulsePhase: Math.random() * Math.PI * 2,
					creationTime: now
				};
				enemy.illusions.push(illusion);
			}
			console.log('Red Phantom Core ativou Divisão Tripla - 3 entidades ativas!');
		}
		
		// Finalizar divisão após duração
		if (enemy.isInDivision && now - enemy.lastDivisionTime >= enemy.divisionDuration) {
			enemy.isInDivision = false;
			enemy.illusions = [];
			console.log('Red Phantom Core finalizou Divisão Tripla - voltou ao estado normal');
		}
		
		// === SISTEMA DE ULTRA RAY (FEIXE CARMESIM) ===
		if (now - enemy.lastUltraRayTime >= enemy.shootInterval) {
			// FASE 1: Criar linha de aviso vermelha piscante
			enemy.warningRays = []; // Limpar avisos anteriores
			enemy.activeUltraRays = []; // Limpar Ultra Rays anteriores
			
			// Calcular ângulo em direção ao jogador (Ultra Ray mira no jogador)
			const dx = (player.x + player.size/2) - (enemy.x + enemy.size/2);
			const dy = (player.y + player.size/2) - (enemy.y + enemy.size/2);
			const angle = Math.atan2(dy, dx);
			
			// Linha de aviso vermelha
			const warningRay = {
				x: enemy.x + enemy.size/2,
				y: enemy.y + enemy.size/2,
				angle: angle,
				width: enemy.ultraRayWidth,
				length: enemy.ultraRayLength,
				startTime: now,
				duration: enemy.warningDuration,
				intensity: 0.8
			};
			enemy.warningRays.push(warningRay);
			
			// Agendar criação do Ultra Ray real após o aviso
			setTimeout(() => {
				const ultraRay = {
					x: enemy.x + enemy.size/2,
					y: enemy.y + enemy.size/2,
					angle: angle,
					width: enemy.ultraRayWidth,
					length: enemy.ultraRayLength,
					damage: enemy.damage,
					startTime: Date.now(),
					duration: enemy.ultraRayDuration,
					intensity: 1.0
				};
				enemy.activeUltraRays = [ultraRay];
				console.log('Red Phantom Core disparou Ultra Ray carmesim devastador!');
			}, enemy.warningDuration);
			
			// Se estiver em divisão, ilusões também disparam (sincronizadas)
			if (enemy.isInDivision) {
				enemy.illusions.forEach(illusion => {
					const illusionAngle = Math.atan2(dy, dx); // Mesmo ângulo
					setTimeout(() => {
						// Ilusões criam Ultra Rays visuais (sem dano)
						illusion.ultraRay = {
							x: illusion.x + enemy.size/2,
							y: illusion.y + enemy.size/2,
							angle: illusionAngle,
							width: enemy.ultraRayWidth,
							length: enemy.ultraRayLength,
							startTime: Date.now(),
							duration: enemy.ultraRayDuration,
							intensity: 0.6, // Menos intenso que o real
							isIllusion: true
						};
					}, enemy.warningDuration);
				});
				console.log('Ilusões também dispararão Ultra Rays sincronizados!');
			}
			
			enemy.lastUltraRayTime = now;
			console.log('Red Phantom Core preparando Ultra Ray - linha de aviso ativa!');
		}
		
		// Atualizar linhas de aviso (remover expiradas)
		enemy.warningRays = enemy.warningRays.filter(ray => 
			now - ray.startTime < ray.duration
		);
		
		// Atualizar Ultra Rays ativos (remover expirados)
		enemy.activeUltraRays = enemy.activeUltraRays.filter(ray => 
			now - ray.startTime < ray.duration
		);
		
		// === SISTEMA DE INVOCAÇÃO DE REFORÇOS ===
		if (now - enemy.lastReinforcementTime >= enemy.reinforcementInterval) {
			// Marcar para invocar reforços (será processado no main.js)
			enemy.shouldSummonReinforcements = true;
			enemy.lastReinforcementTime = now;
			console.log('Red Phantom Core preparando invocação de reforços!');
		}
		
		// === ATUALIZAR RASTROS DE SOMBRA VERMELHA ===
		enemy.shadowTrails = enemy.shadowTrails.filter(trail => {
			trail.life--;
			trail.intensity = (trail.life / trail.maxLife) * 0.6;
			return trail.life > 0;
		});
		
		// Criar rastros periodicamente
		if (Math.random() < 0.1) {
			enemy.shadowTrails.push({
				x: enemy.x + enemy.size/2 + (Math.random() - 0.5) * 40,
				y: enemy.y + enemy.size/2 + (Math.random() - 0.5) * 40,
				intensity: 0.6,
				life: 120, // 2 segundos de vida
				maxLife: 120
			});
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

/**
 * Teleporte espectral do Phantom Lord
 * @param {Object} enemy - O Phantom Lord
 * @param {number} roomWidth - Largura da sala
 * @param {number} roomHeight - Altura da sala
 * @param {number} wallThickness - Espessura das paredes
 */
function spectralTeleport(enemy, roomWidth, roomHeight, wallThickness = 20) {
	// Gerar posição aleatória válida
	const minX = wallThickness + enemy.size;
	const maxX = roomWidth - wallThickness - enemy.size;
	const minY = wallThickness + enemy.size;
	const maxY = roomHeight - wallThickness - enemy.size;
	
	const newX = minX + Math.random() * (maxX - minX);
	const newY = minY + Math.random() * (maxY - minY);
	
	// Aplicar teleporte
	enemy.x = newX;
	enemy.y = newY;
	
	// Resetar velocidade
	enemy.vx = 0;
	enemy.vy = 0;
	
	console.log(`Phantom Lord teleportou para (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
}

/**
 * Aplica o pulso paralisante do Phantom Lord
 * @param {Object} enemy - O Phantom Lord
 * @param {Object} player - O jogador
 * @param {number} distance - Distância até o jogador
 */
function applyPhantomLordPulse(enemy, player, distance) {
	if (distance <= enemy.pulseRadius) {
		// Verificar se jogador já está paralisado para dano acumulativo
		const isPlayerParalyzed = player.isParalyzed || false;
		let pulseDamage = enemy.damage;
		
		if (isPlayerParalyzed) {
			// +50% dano se jogador já estiver paralisado
			pulseDamage = Math.floor(enemy.damage * 1.5);
			console.log(`Phantom Lord pulso com dano acumulativo! ${pulseDamage} dano (jogador já paralisado)`);
		} else {
			console.log(`Phantom Lord pulso paralisante! ${pulseDamage} dano`);
		}
		
		// Aplicar dano e paralisia (precisa ser implementado no sistema de jogador)
		enemy.pulseActivated = true;
		enemy.pulseDamage = pulseDamage;
		enemy.pulseTime = Date.now();
	}
}

export function drawEnemy(ctx, enemy) {
	if (enemy.dead) return;
	
	// === EFEITOS ESPECIAIS PARA SHARDS ===
	if (enemy.type === 'shard' || enemy.type === 'minishard') {
		const centerX = enemy.x + enemy.size/2;
		const centerY = enemy.y + enemy.size/2;
		const radius = enemy.size/2;
		
		// Salvar contexto
		ctx.save();
		
		// Transparência cristalina
		ctx.globalAlpha = 0.8;
		
		// === CORPO PRINCIPAL (ESFERA CRISTALINA AZUL) ===
		// Gradiente radial para efeito cristalino
		const gradient = ctx.createRadialGradient(
			centerX - radius/3, centerY - radius/3, 0,  // Ponto de luz
			centerX, centerY, radius                      // Círculo completo
		);
		gradient.addColorStop(0, '#E0F6FF');     // Branco-azulado no centro (brilho)
		gradient.addColorStop(0.3, enemy.color); // Cor principal do shard
		gradient.addColorStop(0.8, '#4169E1');   // Azul royal na borda
		gradient.addColorStop(1, '#191970');     // Azul meia-noite no contorno
		
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
		ctx.fill();
		
		// Brilho cristalino nas bordas
		ctx.strokeStyle = '#87CEEB';
		ctx.lineWidth = 2;
		ctx.shadowBlur = 8;
		ctx.shadowColor = '#87CEEB';
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
		ctx.stroke();
		
		// === BARREIRA DE CRISTAIS ORBITAIS ===
		if (!enemy.barrierDestroyed) {
			ctx.shadowBlur = 12;
			ctx.shadowColor = '#FFFFFF';
			
			for (let i = 0; i < enemy.crystalBarrierFragments; i++) {
				const angle = enemy.crystalRotationAngle + (i * (Math.PI * 2) / enemy.crystalBarrierFragments);
				const crystalX = centerX + Math.cos(angle) * enemy.crystalBarrierRadius;
				const crystalY = centerY + Math.sin(angle) * enemy.crystalBarrierRadius;
				const crystalSize = enemy.type === 'minishard' ? 8 : 12;
				
				// Cristal individual com gradiente
				const crystalGradient = ctx.createRadialGradient(
					crystalX, crystalY, 0,
					crystalX, crystalY, crystalSize/2
				);
				crystalGradient.addColorStop(0, '#FFFFFF');    // Centro branco brilhante
				crystalGradient.addColorStop(0.6, '#87CEEB');  // Azul claro
				crystalGradient.addColorStop(1, '#4682B4');    // Azul aço na borda
				
				ctx.fillStyle = crystalGradient;
				ctx.beginPath();
				ctx.arc(crystalX, crystalY, crystalSize/2, 0, Math.PI * 2);
				ctx.fill();
				
				// Borda do cristal
				ctx.strokeStyle = '#FFFFFF';
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.arc(crystalX, crystalY, crystalSize/2, 0, Math.PI * 2);
				ctx.stroke();
			}
		} else {
			// Indicar barreira destruída com partículas
			const now = Date.now();
			const timeSinceDestroyed = now - enemy.barrierDestroyedTime;
			const regenProgress = timeSinceDestroyed / enemy.barrierRegenerationTime;
			
			if (regenProgress < 1) {
				// Partículas de regeneração
				ctx.globalAlpha = 0.3 + regenProgress * 0.5;
				for (let i = 0; i < enemy.crystalBarrierFragments; i++) {
					const angle = enemy.crystalRotationAngle + (i * (Math.PI * 2) / enemy.crystalBarrierFragments);
					const crystalX = centerX + Math.cos(angle) * enemy.crystalBarrierRadius * regenProgress;
					const crystalY = centerY + Math.sin(angle) * enemy.crystalBarrierRadius * regenProgress;
					
					ctx.fillStyle = `rgba(135, 206, 235, ${regenProgress})`;
					ctx.beginPath();
					ctx.arc(crystalX, crystalY, 3 * regenProgress, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		}
		
		// === EFEITOS ESPECIAIS ===
		// Pulso quando com pouca vida (apenas Shard normal)
		if (enemy.type === 'shard' && enemy.lowHealthSpeedBoost) {
			ctx.globalAlpha = 0.4;
			ctx.strokeStyle = '#FF6347'; // Vermelho alaranjado
			ctx.lineWidth = 3;
			const pulseRadius = radius + 8 + Math.sin(Date.now() / 100) * 4;
			ctx.beginPath();
			ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
			ctx.stroke();
		}
		
		// Rastro de movimento para Mini Shards
		if (enemy.type === 'minishard') {
			const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
			if (speed > 1) {
				ctx.globalAlpha = 0.3;
				ctx.strokeStyle = enemy.originalColor;
				ctx.lineWidth = 6;
				ctx.lineCap = 'round';
				
				for (let i = 1; i <= 3; i++) {
					const trailX = centerX - (enemy.vx * i * 3);
					const trailY = centerY - (enemy.vy * i * 3);
					
					ctx.globalAlpha = 0.3 * (1 - i * 0.2);
					ctx.beginPath();
					ctx.moveTo(trailX, trailY);
					ctx.lineTo(centerX, centerY);
					ctx.stroke();
				}
			}
		}
		
		// Restaurar contexto
		ctx.restore();
		
	} else if (enemy.type === 'phantom' || enemy.type === 'phantomlord') {
	// === EFEITOS ESPECIAIS PARA PHANTOMS ===
		// Calcular transparência baseada na visibilidade e hitCount
		let alpha = 1.0;
		let glowEffect = false;
		
		if (!enemy.isVisible) {
			if (enemy.isCompletelyInvisible) {
				// Phantom COMPLETAMENTE invisível após 2+ hits: não aparece nada!
				alpha = 0.0; // Totalmente invisível
			} else {
				// Phantom invisível normal (1-2 hits): quase transparente
				alpha = 0.1; // Apenas 10% de opacidade
			}
		} else {
			// Phantom visível: verificar se está prestes a ficar invisível novamente
			const timeSinceVisible = Date.now() - (enemy.invisibilityStartTime === 0 ? enemy.spawnTime : enemy.invisibilityStartTime + enemy.invisibilityDuration);
			
			// Efeito de piscada quando está prestes a atacar ou recém ficou visível
			if (timeSinceVisible < 1000) { // Primeiro segundo após ficar visível
				alpha = 0.7 + Math.sin(Date.now() / 100) * 0.3; // Piscada suave
				glowEffect = true;
			}
		}
		
		// Salvar contexto para aplicar transparência
		ctx.save();
		ctx.globalAlpha = alpha;
		
		// Efeito de brilho quando visível
		if (glowEffect) {
			ctx.shadowBlur = 15;
			ctx.shadowColor = enemy.originalColor || enemy.color;
		}
		
		// Corpo do phantom (BOLA ROXA com gradiente)
		const centerX = enemy.x + enemy.size/2;
		const centerY = enemy.y + enemy.size/2;
		const radius = enemy.size/2;
		
		// Gradiente radial para dar profundidade 3D
		const gradient = ctx.createRadialGradient(
			centerX - radius/3, centerY - radius/3, 0,  // Ponto de luz (canto superior esquerdo)
			centerX, centerY, radius                      // Círculo completo
		);
		gradient.addColorStop(0, '#9966CC');    // Roxo claro no centro (highlight)
		gradient.addColorStop(0.7, enemy.color); // Cor original do phantom
		gradient.addColorStop(1, '#4A1A4A');     // Roxo escuro na borda (sombra)
		
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
		ctx.fill();
		
		// Reflexo para efeito 3D (pequeno círculo brilhante no topo)
		if (enemy.isVisible || alpha > 0.3) {
			const highlightX = centerX - radius/4;
			const highlightY = centerY - radius/4;
			const highlightRadius = radius/4;
			
			const highlightGradient = ctx.createRadialGradient(
				highlightX, highlightY, 0,
				highlightX, highlightY, highlightRadius
			);
			highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
			highlightGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)');
			highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
			
			ctx.fillStyle = highlightGradient;
			ctx.beginPath();
			ctx.arc(highlightX, highlightY, highlightRadius, 0, Math.PI * 2);
			ctx.fill();
		}
		
		// Borda especial diferente para Phantom Lord (dourada) e Phantom comum (preta)
		if (enemy.type === 'phantomlord') {
			ctx.strokeStyle = enemy.isVisible ? '#FFD700' : '#666666'; // Dourada quando visível
			ctx.lineWidth = 4; // Mais espessa para chefão
		} else {
			ctx.strokeStyle = enemy.isVisible ? '#000' : '#666';
			ctx.lineWidth = enemy.isVisible ? 3 : 2;
		}
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
		ctx.stroke();
		
		// === EFEITOS ESPECIAIS PHANTOM LORD ===
		if (enemy.type === 'phantomlord') {
			const now = Date.now();
			
			// Efeitos de teleporte espectral
			if (now - enemy.lastTeleportEffectTime < enemy.teleportEffectDuration) {
				const effectProgress = (now - enemy.lastTeleportEffectTime) / enemy.teleportEffectDuration;
				
				// Rastro espectral (múltiplas camadas)
				for (let i = 0; i < 3; i++) {
					ctx.globalAlpha = (alpha * 0.3) * (1 - effectProgress) * (1 - i * 0.3);
					ctx.fillStyle = enemy.originalColor;
					ctx.fillRect(
						enemy.x - i * 5, 
						enemy.y - i * 5, 
						enemy.size + i * 10, 
						enemy.size + i * 10
					);
				}
				ctx.globalAlpha = alpha; // Restaurar alpha
			}
			
			// Aura de poder quando visível
			if (enemy.isVisible) {
				ctx.strokeStyle = `rgba(153, 50, 204, ${0.3 + Math.sin(now / 200) * 0.2})`;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.arc(centerX, centerY, radius + 8 + Math.sin(now / 150) * 3, 0, Math.PI * 2);
				ctx.stroke();
			}
			
			// Indicador de pulso paralisante quando invisível
			if (!enemy.isVisible && enemy.pulseRadius) {
				ctx.strokeStyle = `rgba(255, 0, 255, ${0.5 + Math.sin(now / 100) * 0.3})`;
				ctx.lineWidth = 3;
				ctx.setLineDash([5, 5]);
				ctx.beginPath();
				ctx.arc(centerX, centerY, enemy.pulseRadius, 0, Math.PI * 2);
				ctx.stroke();
				ctx.setLineDash([]); // Resetar linha
			}
		}
		
		// Efeitos visuais especiais para bola roxa
		if (!enemy.isVisible) {
			// Círculos concêntricos pulsantes durante invisibilidade
			const pulseRadius1 = (enemy.size/2) + 15 + Math.sin(Date.now() / 200) * 8;
			const pulseRadius2 = (enemy.size/2) + 25 + Math.sin(Date.now() / 150) * 6;
			
			ctx.strokeStyle = `rgba(153, 102, 204, ${alpha * 0.6})`;
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			
			// Primeiro círculo
			ctx.beginPath();
			ctx.arc(centerX, centerY, pulseRadius1, 0, Math.PI * 2);
			ctx.stroke();
			
			// Segundo círculo
			ctx.beginPath();
			ctx.arc(centerX, centerY, pulseRadius2, 0, Math.PI * 2);
			ctx.stroke();
			
			ctx.setLineDash([]);
		} else {
			// Efeito de energia quando se movendo rapidamente (investida)
			const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
			if (speed > 2) {
				// Rastro energético atrás da bola
				ctx.strokeStyle = `rgba(153, 102, 204, 0.6)`;
				ctx.lineWidth = 4;
				ctx.lineCap = 'round';
				
				// Múltiplas linhas de rastro para efeito de energia
				for (let i = 1; i <= 3; i++) {
					const trailX = centerX - (enemy.vx * i * 2);
					const trailY = centerY - (enemy.vy * i * 2);
					
					ctx.globalAlpha = alpha * (0.8 - i * 0.2);
					ctx.beginPath();
					ctx.moveTo(trailX, trailY);
					ctx.lineTo(centerX, centerY);
					ctx.stroke();
				}
				ctx.globalAlpha = alpha; // Restaurar alpha
			}
			
			// Brilho sutil quando visível e com efeito de glow
			if (glowEffect) {
				const glowGradient = ctx.createRadialGradient(
					centerX, centerY, 0,
					centerX, centerY, enemy.size/2 + 10
				);
				glowGradient.addColorStop(0, 'rgba(153, 102, 204, 0)');
				glowGradient.addColorStop(1, 'rgba(153, 102, 204, 0.3)');
				
				ctx.fillStyle = glowGradient;
				ctx.beginPath();
				ctx.arc(centerX, centerY, enemy.size/2 + 10, 0, Math.PI * 2);
				ctx.fill();
			}
		}
		
		// Restaurar contexto
		ctx.restore();
		
		// Indicador de estado (apenas visível se phantom estiver invisível)
		if (!enemy.isVisible) {
			ctx.fillStyle = 'rgba(102, 51, 153, 0.6)';
			ctx.font = '12px Arial';
			ctx.textAlign = 'center';
			ctx.fillText('INVISÍVEL', enemy.x + enemy.size/2, enemy.y - 15);
		}
		
	} else if (enemy.type === 'redphantomcore') {
		// === RENDERIZAÇÃO ESPECIAL DO RED PHANTOM CORE ===
		renderRedPhantomCore(ctx, enemy);
		return; // Não precisa renderizar elementos padrão
	} else if (enemy.type === 'crystalcore') {
		// === RENDERIZAÇÃO ESPECIAL DO CRYSTAL CORE ===
		renderCrystalCore(ctx, enemy);
		return; // Não precisar renderizar elementos padrão
	} else {
		// === RENDERIZAÇÃO NORMAL PARA OUTROS INIMIGOS ===
		// Corpo do inimigo
		ctx.fillStyle = enemy.color;
		ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
		
		// Borda
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 2;
		ctx.strokeRect(enemy.x, enemy.y, enemy.size, enemy.size);
	}
	
	// Indicador visual durante o delay de spawn (círculo amarelo piscando)
	if (!enemy.canAttack && Math.floor(Date.now() / 200) % 2 === 0) {
		ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
		ctx.beginPath();
		ctx.arc(enemy.x + enemy.size/2, enemy.y + enemy.size/2, enemy.size/2 + 5, 0, Math.PI * 2);
		ctx.fill();
	}
	
	// Barra de vida (especial para chefões)
	if (enemy.health < enemy.maxHealth && ((enemy.type !== 'phantom' && enemy.type !== 'phantomlord') || enemy.isVisible)) {
		const isPhantomLord = enemy.type === 'phantomlord';
		const barWidth = isPhantomLord ? enemy.size + 20 : enemy.size; // Barra maior para chefão
		const barHeight = isPhantomLord ? 8 : 4; // Mais alta para chefão
		const barX = enemy.x - (isPhantomLord ? 10 : 0); // Centralizada para chefão
		const barY = enemy.y - (isPhantomLord ? 15 : 8); // Mais distante para chefão
		
		// Fundo da barra
		ctx.fillStyle = '#000';
		ctx.fillRect(barX, barY, barWidth, barHeight);
		
		// Borda dourada para chefão
		if (isPhantomLord) {
			ctx.strokeStyle = '#FFD700';
			ctx.lineWidth = 1;
			ctx.strokeRect(barX, barY, barWidth, barHeight);
		}
		
		// Vida atual
		const healthPercent = enemy.health / enemy.maxHealth;
		let healthColor;
		if (isPhantomLord) {
			// Cores especiais para chefão
			healthColor = healthPercent > 0.7 ? '#9932CC' : // Roxo quando alta
						  healthPercent > 0.3 ? '#FF4500' : // Laranja quando média
						  '#DC143C'; // Vermelho quando baixa
		} else {
			healthColor = healthPercent > 0.5 ? '#0f0' : (healthPercent > 0.25 ? '#ff0' : '#f00');
		}
		
		ctx.fillStyle = healthColor;
		ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
		
		// Nome do chefão acima da barra de vida
		if (isPhantomLord) {
			ctx.fillStyle = '#FFD700';
			ctx.font = 'bold 12px Arial';
			ctx.textAlign = 'center';
			ctx.fillText('PHANTOM LORD', enemy.x + enemy.size/2, barY - 5);
			ctx.textAlign = 'left'; // Resetar alinhamento
		}
	}
}

export function checkEnemyCollision(enemy, player) {
	if (enemy.dead || player.invulnerable) return false;
	
	// === PHANTOMS INVISÍVEIS NÃO COLIDEM ===
	if ((enemy.type === 'phantom' || enemy.type === 'phantomlord') && !enemy.isVisible) {
		return false; // Phantoms invisíveis não podem colidir
	}
	
	// === COLISÃO ESPECIAL PARA SHARDS ===
	if ((enemy.type === 'shard' || enemy.type === 'minishard') && !enemy.barrierDestroyed) {
		// Verificar colisão com a barreira de cristais orbital
		const enemyCenterX = enemy.x + enemy.size/2;
		const enemyCenterY = enemy.y + enemy.size/2;
		const playerCenterX = player.x + player.size/2;
		const playerCenterY = player.y + player.size/2;
		const distance = Math.sqrt(
			(playerCenterX - enemyCenterX) ** 2 + 
			(playerCenterY - enemyCenterY) ** 2
		);
		
		// Colisão com barreira orbital (raio da barreira + margem)
		if (distance <= enemy.crystalBarrierRadius + 15) {
			return { type: 'barrier', enemy: enemy }; // Colisão com barreira
		}
		
		// Colisão direta com o corpo do Shard (menos comum)
		if (distance <= enemy.size/2 + player.size/2) {
			return { type: 'body', enemy: enemy }; // Colisão com corpo
		}
		
		return false; // Sem colisão
	}
	
	// Colisão padrão para outros inimigos
	return (
		player.x < enemy.x + enemy.size &&
		player.x + player.size > enemy.x &&
		player.y < enemy.y + enemy.size &&
		player.y + player.size > enemy.y
	);
}

export function damageEnemy(enemy, damage, player = null) {
	// === VERIFICAR SE PHANTOM/PHANTOM LORD PODE RECEBER DANO ===
	if ((enemy.type === 'phantom' || enemy.type === 'phantomlord') && !enemy.isVisible) {
		console.log(`${enemy.type === 'phantomlord' ? 'Phantom Lord' : 'Phantom'} é imune ao dano enquanto invisível!`);
		return false; // Não causou dano
	}

	enemy.health -= damage;
	
	// === SISTEMA ESCALONADO DE DANO DO PHANTOM ===
	if (enemy.type === 'phantom' && enemy.health > 0 && enemy.isVisible) {
		enemy.hitCount++;
		console.log(`Phantom recebeu hit ${enemy.hitCount}!`);
		
		if (enemy.hitCount <= 2) {
			// Primeiros 2 hits: invisibilidade normal
			enemy.isVisible = false;
			enemy.isCompletelyInvisible = false;
			enemy.invisibilityStartTime = Date.now();
			enemy.repositionTimer = 0;
			console.log(`Phantom ficou invisível (hit ${enemy.hitCount}/2)!`);
		} else if (enemy.hitCount >= 3) {
			// 3º hit ou mais: invisibilidade completa (teleporte acontece no 4º segundo)
			enemy.isVisible = false;
			enemy.isCompletelyInvisible = true;
			enemy.invisibilityStartTime = Date.now();
			enemy.repositionTimer = 0;
			enemy.hasTeleported = false; // Flag para controlar se já teleportou
			
			// Sem texto quando fica completamente invisível
		}
	}
	
	// === LÓGICA ESPECIAL DO PHANTOM LORD ===
	if (enemy.type === 'phantomlord' && enemy.health > 0 && enemy.isVisible) {
		// Aplicar dano
		console.log(`Phantom Lord recebeu ${damage} de dano! Vida: ${enemy.health}/${enemy.maxHealth}`);
		
		// Após receber dano, vai para estado invisível imediatamente
		enemy.isVisible = false;
		enemy.invisibilityStartTime = Date.now();
		console.log('Phantom Lord ficou invisível após receber dano!');
		
		// Se vida caiu abaixo de 50%, permitir teleporte imediato
		if (enemy.health <= enemy.maxHealth * 0.5) {
			enemy.lastTeleportTime = 0; // Reset cooldown para teleporte de emergência
			console.log('Phantom Lord abaixo de 50% HP - teleporte de emergência disponível!');
		}
	}
	
	if (enemy.health <= 0) {
		enemy.dead = true;
		enemy.health = 0;
		
		// === DIVISÃO DO SHARD ===
		if (enemy.type === 'shard') {
			// Shard se divide em 2 Mini Shards
			enemy.shouldDivide = true; // Flag para o main.js processar
			console.log('💎 SHARD DIVIDINDO EM MINI SHARDS! 💎');
		}
		
		// Log especial para Phantom Lord derrotado
		if (enemy.type === 'phantomlord') {
			console.log('🎉 PHANTOM LORD DERROTADO! 🎉');
		}
		
		// Log para outros inimigos especiais
		if (enemy.type === 'shard') {
			console.log('💎 Shard destruído - preparando divisão!');
		} else if (enemy.type === 'minishard') {
			console.log('💎 Mini Shard destruído!');
		}
	}
	
	return true; // Causou dano
}

/**
 * Teleporta o Phantom para uma posição aleatória próxima ao jogador
 * @param {Object} phantom - O inimigo Phantom
 * @param {Object} player - O jogador
 */
function teleportPhantomNearPlayer(phantom, player) {
	if (!player) {
		console.warn('Player não encontrado para teleporte do Phantom');
		return;
	}
	
	// Calcular centro do jogador
	const playerCenterX = player.x + (player.size || 32) / 2;
	const playerCenterY = player.y + (player.size || 32) / 2;
	
	// Raio de teleporte: 150px
	const teleportRadius = 150;
	
	// Gerar ângulo aleatório
	const angle = Math.random() * Math.PI * 2;
	
	// Gerar distância aleatória entre 80px e 150px (não muito perto, não muito longe)
	const minDistance = 80;
	const distance = minDistance + Math.random() * (teleportRadius - minDistance);
	
	// Calcular nova posição
	const newX = playerCenterX + Math.cos(angle) * distance - phantom.size / 2;
	const newY = playerCenterY + Math.sin(angle) * distance - phantom.size / 2;
	
	// Aplicar teleporte
	phantom.x = newX;
	phantom.y = newY;
	
	// Resetar velocidade para evitar movimento estranho
	phantom.vx = 0;
	phantom.vy = 0;
	
	// Teleporte silencioso - sem texto no console
}

/**
 * Conta quantos Shards (normais + mini) estão vivos na sala
 * @param {Array} enemies - Array de inimigos
 * @returns {number} Número de Shards vivos
 */
export function countLiveShards(enemies) {
	return enemies.filter(enemy => 
		(enemy.type === 'shard' || enemy.type === 'minishard') && !enemy.dead
	).length;
}

/**
 * Cria dois Mini Shards a partir de um Shard que morreu
 * @param {Object} deadShard - O Shard que morreu
 * @returns {Array} Array com 2 Mini Shards
 */
export function createMiniShardsFromShard(deadShard) {
	const miniShards = [];
	
	for (let i = 0; i < 2; i++) {
		// Posição ligeiramente deslocada do Shard original
		const angle = (Math.PI * 2 * i / 2) + Math.random() * 0.5; // Espalhar em semicírculo
		const distance = 40 + Math.random() * 20; // 40-60px de distância
		const miniX = deadShard.x + Math.cos(angle) * distance;
		const miniY = deadShard.y + Math.sin(angle) * distance;
		
		const miniShard = createEnemy(miniX, miniY, 'minishard');
		
		// Configurações especiais para divisão
		miniShard.crystalRotationAngle = Math.random() * Math.PI * 2; // Ângulo aleatório
		miniShard.rotationDirection = i === 0 ? 1 : -1; // Direções opostas
		miniShard.canAttack = true; // Pode atacar imediatamente
		
		// Efeito visual de nascimento
		miniShard.birthTime = Date.now();
		miniShard.birthEffectDuration = 1000; // 1 segundo de efeito
		
		miniShards.push(miniShard);
	}
	
	console.log(`Criados 2 Mini Shards a partir de Shard em (${deadShard.x}, ${deadShard.y})`);
	return miniShards;
}

/**
 * Verifica se um projétil acertou a barreira de cristais de um Shard
 * @param {Object} enemy - O Shard
 * @param {Object} bullet - O projétil
 * @returns {boolean} True se acertou a barreira
 */
export function checkBulletBarrierCollision(enemy, bullet) {
	if (enemy.type !== 'shard' && enemy.type !== 'minishard') return false;
	if (enemy.barrierDestroyed) return false;
	if (bullet.isEnemy) return false; // Só projéteis do player
	
	const enemyCenterX = enemy.x + enemy.size/2;
	const enemyCenterY = enemy.y + enemy.size/2;
	
	// Verificar colisão com cada cristal da barreira
	for (let i = 0; i < enemy.crystalBarrierFragments; i++) {
		const angle = enemy.crystalRotationAngle + (i * (Math.PI * 2) / enemy.crystalBarrierFragments);
		const crystalX = enemyCenterX + Math.cos(angle) * enemy.crystalBarrierRadius;
		const crystalY = enemyCenterY + Math.sin(angle) * enemy.crystalBarrierRadius;
		const crystalRadius = enemy.type === 'minishard' ? 8 : 12;
		
		const distance = Math.sqrt(
			(bullet.x - crystalX) ** 2 + 
			(bullet.y - crystalY) ** 2
		);
		
		if (distance <= crystalRadius/2 + 3) { // +3 para margem de colisão
			// Acertou um cristal da barreira!
			enemy.barrierDestroyed = true;
			enemy.barrierDestroyedTime = Date.now();
			console.log(`Barreira de ${enemy.type} destruída por projétil!`);
			return true;
		}
	}
	
	return false;
}

/**
 * Renderiza o Red Phantom Core com efeitos visuais supremos
 * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
 * @param {Object} enemy - O Red Phantom Core
 */
function renderRedPhantomCore(ctx, enemy) {
	// === RENDERIZAR RASTROS DE SOMBRA VERMELHA ===
	enemy.shadowTrails.forEach(trail => {
		const gradient = ctx.createRadialGradient(
			trail.x, trail.y, 0,
			trail.x, trail.y, 30
		);
		gradient.addColorStop(0, `rgba(220, 20, 60, ${trail.intensity})`);
		gradient.addColorStop(1, `rgba(220, 20, 60, 0)`);
		
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(trail.x, trail.y, 30, 0, Math.PI * 2);
		ctx.fill();
	});
	
	// === RENDERIZAR ILUSÕES (SE ESTIVER EM DIVISÃO) ===
	if (enemy.isInDivision && enemy.illusions) {
		enemy.illusions.forEach(illusion => {
			const age = Date.now() - illusion.creationTime;
			const pulse = 0.6 + Math.sin((Date.now() / 200) + illusion.pulsePhase) * 0.4;
			
			ctx.save();
			ctx.globalAlpha = illusion.alpha * pulse;
			
			// Aura das ilusões (menos intensa)
			const illusionGradient = ctx.createRadialGradient(
				illusion.x + enemy.size/2, illusion.y + enemy.size/2, 0,
				illusion.x + enemy.size/2, illusion.y + enemy.size/2, enemy.size * 1.2
			);
			illusionGradient.addColorStop(0, `rgba(220, 20, 60, ${pulse * 0.4})`);
			illusionGradient.addColorStop(0.7, `rgba(139, 0, 139, ${pulse * 0.3})`);
			illusionGradient.addColorStop(1, `rgba(75, 0, 130, 0)`);
			
			ctx.fillStyle = illusionGradient;
			ctx.beginPath();
			ctx.arc(illusion.x + enemy.size/2, illusion.y + enemy.size/2, enemy.size * 1.2, 0, Math.PI * 2);
			ctx.fill();
			
			// Cristal da ilusão (octógono)
			ctx.translate(illusion.x + enemy.size/2, illusion.y + enemy.size/2);
			ctx.rotate((Date.now() / 1500) % (Math.PI * 2));
			
			const illusionCrystalGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.size/2);
			illusionCrystalGradient.addColorStop(0, `rgba(255, 182, 193, ${pulse})`);
			illusionCrystalGradient.addColorStop(0.3, `rgba(220, 20, 60, ${pulse * 0.8})`);
			illusionCrystalGradient.addColorStop(0.7, `rgba(139, 0, 139, ${pulse * 0.6})`);
			illusionCrystalGradient.addColorStop(1, `rgba(75, 0, 130, ${pulse * 0.4})`);
			
			ctx.fillStyle = illusionCrystalGradient;
			ctx.beginPath();
			for (let i = 0; i < 8; i++) {
				const angle = (i / 8) * Math.PI * 2;
				const x = Math.cos(angle) * enemy.size/2;
				const y = Math.sin(angle) * enemy.size/2;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.closePath();
			ctx.fill();
			
			// Ultra Ray da ilusão (se existir)
			if (illusion.ultraRay) {
				const rayAge = Date.now() - illusion.ultraRay.startTime;
				if (rayAge < illusion.ultraRay.duration) {
					const rayProgress = rayAge / illusion.ultraRay.duration;
					const rayIntensity = illusion.ultraRay.intensity * (1 - rayProgress);
					
					ctx.save();
					ctx.translate(illusion.ultraRay.x - (illusion.x + enemy.size/2), illusion.ultraRay.y - (illusion.y + enemy.size/2));
					ctx.rotate(illusion.ultraRay.angle);
					
					// Ultra Ray ilusório (menos intenso)
					const rayGradient = ctx.createLinearGradient(0, -illusion.ultraRay.width/2, 0, illusion.ultraRay.width/2);
					rayGradient.addColorStop(0, `rgba(220, 20, 60, 0)`);
					rayGradient.addColorStop(0.5, `rgba(220, 20, 60, ${rayIntensity * 0.6})`);
					rayGradient.addColorStop(1, `rgba(220, 20, 60, 0)`);
					
					ctx.fillStyle = rayGradient;
					ctx.fillRect(0, -illusion.ultraRay.width/2, illusion.ultraRay.length, illusion.ultraRay.width);
					
					ctx.restore();
				}
			}
			
			ctx.restore();
		});
	}
	
	// === RENDERIZAR LINHAS DE AVISO VERMELHAS ===
	enemy.warningRays.forEach(ray => {
		const age = Date.now() - ray.startTime;
		const progress = age / ray.duration;
		const pulseIntensity = ray.intensity * (0.4 + 0.6 * Math.sin(Date.now() / 80)); // Pulsação rápida
		
		ctx.save();
		ctx.translate(ray.x, ray.y);
		ctx.rotate(ray.angle);
		
		// Linha de aviso vermelha piscante
		const gradient = ctx.createLinearGradient(0, -ray.width/2, 0, ray.width/2);
		gradient.addColorStop(0, `rgba(255, 0, 0, 0)`);
		gradient.addColorStop(0.5, `rgba(255, 0, 0, ${pulseIntensity})`);
		gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
		
		ctx.fillStyle = gradient;
		ctx.fillRect(0, -ray.width/2, ray.length, ray.width);
		
		// Borda mais escura
		const borderGradient = ctx.createLinearGradient(0, -ray.width/3, 0, ray.width/3);
		borderGradient.addColorStop(0, `rgba(139, 0, 0, 0)`);
		borderGradient.addColorStop(0.5, `rgba(139, 0, 0, ${pulseIntensity * 0.8})`);
		borderGradient.addColorStop(1, `rgba(139, 0, 0, 0)`);
		
		ctx.fillStyle = borderGradient;
		ctx.fillRect(0, -ray.width/3, ray.length, ray.width * 2/3);
		
		ctx.restore();
	});
	
	// === RENDERIZAR ULTRA RAYS ATIVOS ===
	enemy.activeUltraRays.forEach(ray => {
		const age = Date.now() - ray.startTime;
		const progress = age / ray.duration;
		const intensity = ray.intensity * (1 - progress * 0.3); // Decai mais lentamente
		
		ctx.save();
		ctx.translate(ray.x, ray.y);
		ctx.rotate(ray.angle);
		
		// Ultra Ray principal (carmesim devastador)
		const gradient = ctx.createLinearGradient(0, -ray.width/2, 0, ray.width/2);
		gradient.addColorStop(0, `rgba(220, 20, 60, 0)`);
		gradient.addColorStop(0.5, `rgba(220, 20, 60, ${intensity})`);
		gradient.addColorStop(1, `rgba(220, 20, 60, 0)`);
		
		ctx.fillStyle = gradient;
		ctx.fillRect(0, -ray.width/2, ray.length, ray.width);
		
		// Núcleo do Ultra Ray (branco intenso)
		const coreGradient = ctx.createLinearGradient(0, -ray.width/4, 0, ray.width/4);
		coreGradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
		coreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${intensity * 1.2})`);
		coreGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
		
		ctx.fillStyle = coreGradient;
		ctx.fillRect(0, -ray.width/4, ray.length, ray.width/2);
		
		// Borda externa (roxo escuro)
		ctx.strokeStyle = `rgba(75, 0, 130, ${intensity * 0.8})`;
		ctx.lineWidth = 3;
		ctx.strokeRect(0, -ray.width/2, ray.length, ray.width);
		
		ctx.restore();
	});
	
	// === CRISTAL PRINCIPAL DO RED PHANTOM CORE ===
	const pulsePhase = (Date.now() / 800) * 2; // Pulso mais rápido
	const pulseIntensity = 0.8 + Math.sin(pulsePhase) * 0.4 * enemy.crimsonPulseIntensity;
	
	// Aura externa carmesim
	const auraGradient = ctx.createRadialGradient(
		enemy.x + enemy.size/2, enemy.y + enemy.size/2, 0,
		enemy.x + enemy.size/2, enemy.y + enemy.size/2, enemy.size * 2.0
	);
	auraGradient.addColorStop(0, `rgba(220, 20, 60, ${pulseIntensity * 0.4})`);
	auraGradient.addColorStop(0.5, `rgba(139, 0, 139, ${pulseIntensity * 0.3})`);
	auraGradient.addColorStop(0.8, `rgba(75, 0, 130, ${pulseIntensity * 0.2})`);
	auraGradient.addColorStop(1, `rgba(25, 25, 112, 0)`);
	
	ctx.fillStyle = auraGradient;
	ctx.beginPath();
	ctx.arc(enemy.x + enemy.size/2, enemy.y + enemy.size/2, enemy.size * 2.0, 0, Math.PI * 2);
	ctx.fill();
	
	// Cristal principal (octógono supremo)
	ctx.save();
	ctx.translate(enemy.x + enemy.size/2, enemy.y + enemy.size/2);
	ctx.rotate((Date.now() / 1000) % (Math.PI * 2)); // Rotação mais lenta e majestosa
	
	// Sombra do cristal
	ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
	ctx.beginPath();
	for (let i = 0; i < 8; i++) {
		const angle = (i / 8) * Math.PI * 2;
		const x = Math.cos(angle) * (enemy.size/2 + 4);
		const y = Math.sin(angle) * (enemy.size/2 + 4);
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.fill();
	
	// Gradiente do cristal supremo
	const crystalGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.size/2);
	crystalGradient.addColorStop(0, `rgba(255, 182, 193, ${pulseIntensity})`); // Rosa claro
	crystalGradient.addColorStop(0.2, `rgba(255, 105, 180, ${pulseIntensity * 0.9})`); // Rosa intenso
	crystalGradient.addColorStop(0.5, `rgba(220, 20, 60, ${pulseIntensity * 0.8})`); // Carmesim
	crystalGradient.addColorStop(0.7, `rgba(139, 0, 139, ${pulseIntensity * 0.7})`); // Roxo escuro
	crystalGradient.addColorStop(1, `rgba(75, 0, 130, ${pulseIntensity * 0.5})`); // Índigo
	
	ctx.fillStyle = crystalGradient;
	ctx.beginPath();
	for (let i = 0; i < 8; i++) {
		const angle = (i / 8) * Math.PI * 2;
		const x = Math.cos(angle) * enemy.size/2;
		const y = Math.sin(angle) * enemy.size/2;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.fill();
	
	// Brilho interno supremo
	ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity * 0.8})`;
	ctx.beginPath();
	for (let i = 0; i < 8; i++) {
		const angle = (i / 8) * Math.PI * 2;
		const x = Math.cos(angle) * enemy.size/3;
		const y = Math.sin(angle) * enemy.size/3;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.fill();
	
	// Fendas de energia carmesim
	for (let i = 0; i < 6; i++) {
		const fissureAngle = (i / 6) * Math.PI * 2 + Date.now() / 3000;
		const fissureLength = enemy.size/3 + Math.sin(Date.now() / 500 + i) * 8;
		
		ctx.strokeStyle = `rgba(255, 0, 0, ${pulseIntensity * 0.9})`;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(Math.cos(fissureAngle) * fissureLength, Math.sin(fissureAngle) * fissureLength);
		ctx.stroke();
	}
	
	ctx.restore();
	
	// === BARRA DE VIDA DO CHEFÃO SUPREMO ===
	const barWidth = 300; // Barra maior para chefão supremo
	const barHeight = 25;
	const barX = enemy.x + enemy.size/2 - barWidth/2;
	const barY = enemy.y - 60;
	
	// Fundo da barra
	ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
	ctx.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);
	
	// Barra de vida com gradiente carmesim
	const healthPercent = enemy.health / enemy.maxHealth;
	const healthGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
	if (healthPercent > 0.6) {
		healthGradient.addColorStop(0, '#DC143C'); // Carmesim
		healthGradient.addColorStop(1, '#B22222'); // Vermelho tijolo
	} else if (healthPercent > 0.3) {
		healthGradient.addColorStop(0, '#FF4500'); // Laranja avermelhado
		healthGradient.addColorStop(1, '#FF6347'); // Tomate
	} else {
		healthGradient.addColorStop(0, '#8B0000'); // Vermelho escuro
		healthGradient.addColorStop(1, '#DC143C'); // Carmesim
	}
	
	ctx.fillStyle = healthGradient;
	ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
	
	// Borda dourada
	ctx.strokeStyle = '#FFD700';
	ctx.lineWidth = 3;
	ctx.strokeRect(barX, barY, barWidth, barHeight);
	
	// Nome do chefão supremo
	ctx.fillStyle = '#FFD700';
	ctx.font = 'bold 20px Arial';
	ctx.textAlign = 'center';
	ctx.shadowBlur = 5;
	ctx.shadowColor = '#DC143C';
	ctx.fillText('RED PHANTOM CORE', enemy.x + enemy.size/2, barY - 12);
	
	// Subtítulo
	ctx.fillStyle = '#FF6347';
	ctx.font = 'bold 14px Arial';
	ctx.fillText('SUPREME BOSS', enemy.x + enemy.size/2, barY - 32);
	
	// HP atual
	ctx.fillStyle = '#FFFFFF';
	ctx.font = '14px Arial';
	ctx.shadowBlur = 3;
	ctx.fillText(`${enemy.health}/${enemy.maxHealth} HP`, enemy.x + enemy.size/2, barY + barHeight + 18);
	
	// Indicador de fase
	if (enemy.isInDivision) {
		ctx.fillStyle = '#FF00FF';
		ctx.font = 'bold 12px Arial';
		ctx.fillText('DIVISÃO TRIPLA ATIVA', enemy.x + enemy.size/2, barY + barHeight + 35);
	}
}

/**
 * Renderiza o Crystal Core com efeitos visuais especiais
 * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
 * @param {Object} enemy - O Crystal Core
 */
function renderCrystalCore(ctx, enemy) {
	// === RENDERIZAR RASTROS DE LUZ ===
	enemy.lightTrails.forEach(trail => {
		const gradient = ctx.createRadialGradient(
			trail.x, trail.y, 0,
			trail.x, trail.y, 20
		);
		gradient.addColorStop(0, `rgba(100, 255, 255, ${trail.intensity})`);
		gradient.addColorStop(1, `rgba(100, 255, 255, 0)`);
		
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(trail.x, trail.y, 20, 0, Math.PI * 2);
		ctx.fill();
	});
	
	// === RENDERIZAR FEIXES DE AVISO ROXOS ===
	enemy.warningBeams.forEach(beam => {
		const age = Date.now() - beam.startTime;
		const progress = age / beam.duration;
		const pulseIntensity = beam.intensity * (0.3 + 0.7 * Math.sin(Date.now() / 100)); // Pulsação rápida
		
		ctx.save();
		ctx.translate(beam.x, beam.y);
		ctx.rotate(beam.angle);
		
		// Gradiente roxo pulsante
		const gradient = ctx.createLinearGradient(0, -beam.width/2, 0, beam.width/2);
		gradient.addColorStop(0, `rgba(150, 50, 200, 0)`);
		gradient.addColorStop(0.5, `rgba(150, 50, 200, ${pulseIntensity})`);
		gradient.addColorStop(1, `rgba(150, 50, 200, 0)`);
		
		ctx.fillStyle = gradient;
		ctx.fillRect(0, -beam.width/2, beam.length, beam.width);
		
		// Borda mais escura para contraste
		const borderGradient = ctx.createLinearGradient(0, -beam.width/3, 0, beam.width/3);
		borderGradient.addColorStop(0, `rgba(100, 20, 150, 0)`);
		borderGradient.addColorStop(0.5, `rgba(100, 20, 150, ${pulseIntensity * 0.8})`);
		borderGradient.addColorStop(1, `rgba(100, 20, 150, 0)`);
		
		ctx.fillStyle = borderGradient;
		ctx.fillRect(0, -beam.width/3, beam.length, beam.width * 2/3);
		
		ctx.restore();
	});
	
	// === RENDERIZAR FEIXES DE LUZ ATIVOS ===
	enemy.activeBeams.forEach(beam => {
		const age = Date.now() - beam.startTime;
		const progress = age / beam.duration;
		const intensity = beam.intensity * (1 - progress);
		
		ctx.save();
		ctx.translate(beam.x, beam.y);
		ctx.rotate(beam.angle);
		
		// Gradiente do feixe
		const gradient = ctx.createLinearGradient(0, -beam.width/2, 0, beam.width/2);
		gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
		gradient.addColorStop(0.5, `rgba(255, 255, 255, ${intensity})`);
		gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
		
		ctx.fillStyle = gradient;
		ctx.fillRect(0, -beam.width/2, beam.length, beam.width);
		
		// Núcleo do feixe mais brilhante
		const coreGradient = ctx.createLinearGradient(0, -beam.width/4, 0, beam.width/4);
		coreGradient.addColorStop(0, `rgba(200, 255, 255, 0)`);
		coreGradient.addColorStop(0.5, `rgba(200, 255, 255, ${intensity * 1.5})`);
		coreGradient.addColorStop(1, `rgba(200, 255, 255, 0)`);
		
		ctx.fillStyle = coreGradient;
		ctx.fillRect(0, -beam.width/4, beam.length, beam.width/2);
		
		ctx.restore();
	});
	
	// === CRISTAL PRINCIPAL ===
	const pulsePhase = (Date.now() / 1000) * 3; // Velocidade do pulso
	const pulseIntensity = 0.7 + Math.sin(pulsePhase) * 0.3 * enemy.crystalPulseIntensity;
	
	// Aura externa
	const auraGradient = ctx.createRadialGradient(
		enemy.x + enemy.size/2, enemy.y + enemy.size/2, 0,
		enemy.x + enemy.size/2, enemy.y + enemy.size/2, enemy.size * 1.5
	);
	auraGradient.addColorStop(0, `rgba(100, 255, 255, ${pulseIntensity * 0.3})`);
	auraGradient.addColorStop(0.7, `rgba(50, 200, 255, ${pulseIntensity * 0.2})`);
	auraGradient.addColorStop(1, `rgba(0, 150, 255, 0)`);
	
	ctx.fillStyle = auraGradient;
	ctx.beginPath();
	ctx.arc(enemy.x + enemy.size/2, enemy.y + enemy.size/2, enemy.size * 1.5, 0, Math.PI * 2);
	ctx.fill();
	
	// Cristal principal (hexágono)
	ctx.save();
	ctx.translate(enemy.x + enemy.size/2, enemy.y + enemy.size/2);
	ctx.rotate((Date.now() / 2000) % (Math.PI * 2)); // Rotação lenta
	
	// Sombra do cristal
	ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
	ctx.beginPath();
	for (let i = 0; i < 6; i++) {
		const angle = (i / 6) * Math.PI * 2;
		const x = Math.cos(angle) * (enemy.size/2 + 2);
		const y = Math.sin(angle) * (enemy.size/2 + 2);
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.fill();
	
	// Gradiente do cristal
	const crystalGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.size/2);
	crystalGradient.addColorStop(0, `rgba(255, 255, 255, ${pulseIntensity})`);
	crystalGradient.addColorStop(0.3, `rgba(150, 255, 255, ${pulseIntensity * 0.9})`);
	crystalGradient.addColorStop(0.7, `rgba(100, 200, 255, ${pulseIntensity * 0.7})`);
	crystalGradient.addColorStop(1, `rgba(50, 150, 255, ${pulseIntensity * 0.5})`);
	
	ctx.fillStyle = crystalGradient;
	ctx.beginPath();
	for (let i = 0; i < 6; i++) {
		const angle = (i / 6) * Math.PI * 2;
		const x = Math.cos(angle) * enemy.size/2;
		const y = Math.sin(angle) * enemy.size/2;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.fill();
	
	// Brilho interno
	ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity * 0.6})`;
	ctx.beginPath();
	for (let i = 0; i < 6; i++) {
		const angle = (i / 6) * Math.PI * 2;
		const x = Math.cos(angle) * enemy.size/4;
		const y = Math.sin(angle) * enemy.size/4;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.fill();
	
	ctx.restore();
	
	// === BARRA DE VIDA DO BOSS ===
	const barWidth = 200;
	const barHeight = 20;
	const barX = enemy.x + enemy.size/2 - barWidth/2;
	const barY = enemy.y - 40;
	
	// Fundo da barra
	ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
	ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
	
	// Barra de vida
	const healthPercent = enemy.health / enemy.maxHealth;
	ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
	ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
	
	// Borda
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 2;
	ctx.strokeRect(barX, barY, barWidth, barHeight);
	
	// Nome do boss
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 16px Arial';
	ctx.textAlign = 'center';
	ctx.fillText('CRYSTAL CORE', enemy.x + enemy.size/2, barY - 8);
	
	// HP atual
	ctx.font = '12px Arial';
	ctx.fillText(`${enemy.health}/${enemy.maxHealth} HP`, enemy.x + enemy.size/2, barY + barHeight + 16);
}
