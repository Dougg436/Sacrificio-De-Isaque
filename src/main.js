import { player, drawPlayer, takeDamage, updatePlayer, canShoot, paralyzePlayer } from './entities/player.js';
import { createBullet } from './entities/bullet.js';
import { createPowerUp } from './entities/powerup.js';
import { createEnemy, updateEnemy, drawEnemy, checkEnemyCollision, damageEnemy, calculateAdvancedPredictiveAngle } from './entities/enemy.js';
import { keys, setupKeyboard, mouseX, mouseY, setupMouse, updateFrame, recordInputSnapshot, getRecentInputSequence, inputHistory } from './core/input.js';
import { playerImg, bulletImg } from './core/assets.js';
import { generateDungeon } from './systems/dungeon-gen.js';
import { MIN_FIRE_RATE, ENEMY_SPAWN_DELAY } from './config.js';
import { UltraPrecisionEnsembleAI } from './ai/ultra-precision-ensemble.js';
import { NeuralNetworkVisualizer } from './utils/neural-visualizer.js';

const canvas = document.getElementById('gameScreen');
const ctx = canvas.getContext('2d');

// === A IA MAIS ABSURDA DO MUNDO ===
console.log('🚀 INICIALIZANDO SISTEMA DE IA ULTRA PRECISO...');
const ultraAI = new UltraPrecisionEnsembleAI();

// === VISUALIZADOR NEURAL ===
console.log('🎨 INICIALIZANDO VISUALIZADOR NEURAL...');
const neuralViz = new NeuralNetworkVisualizer({
    width: 280,
    height: 280,
    position: 'top-right'
});

let aiPredictions = [];
let lastAIUpdateTime = 0;
let aiStats = { predictions: 0, accuracy: 0, ultraPrecisionMode: true };

// Performance controls - MODO ULTRA PRECISO ATIVADO
let AI_ENABLED = true; // SEMPRE ATIVO - performance não importa
let AI_UPDATE_INTERVAL = 100; // REDUZIDO: Atualizar IA a cada 100ms para máxima precisão
let AI_TRAINING_INTERVAL = 500; // REDUZIDO: Treinar a cada 500ms para aprendizado contínuo
let lastAITrainingTime = 0;

// === SISTEMA DE INIMIGO ALVO (para visualização da IA) ===
let targetEnemy = null; // Inimigo sendo rastreado pelo visualizador neural
let targetEnemyRotationTime = 0; // Última vez que mudou de alvo
const TARGET_ENEMY_ROTATION_INTERVAL = 5000; // Mudar de alvo a cada 5 segundos

// Buffer para coleta de dados de treinamento (AUMENTADO PARA MÁXIMA PRECISÃO)
let trainingBuffer = [];
let lastPlayerPositions = [];
let futurePredictionDelay = 10; // AUMENTADO: predições mais distantes para mais precisão
let aiValidationBuffer = []; // Buffer para validação das predições

// Função para coletar dados de treinamento da IA (MODO ULTRA PRECISO)
async function collectAITrainingData() {
	// IA SEMPRE ATIVA - MÁXIMA PRECISÃO
	if (!AI_ENABLED) return;
	
	const currentTime = Date.now();
	
	// COLETA CONTÍNUA - sem throttling para máxima precisão
	// Manter histórico de posições para calcular dados futuros (AUMENTADO)
	lastPlayerPositions.push({
		x: player.x,
		y: player.y,
		vx: player.velocityX || 0,
		vy: player.velocityY || 0,
		timestamp: currentTime,
		frame: updateFrame.currentFrame || 0,
		health: player.health,
		inputs: [...(inputHistory.slice(-3) || [])] // Últimos 3 inputs
	});
	
	// Limitar histórico a 50 frames (AUMENTADO para mais dados)
	if (lastPlayerPositions.length > 50) {
		lastPlayerPositions.shift();
	}
	
	// TREINAMENTO CONTÍNUO COM MAIS DADOS
	if (lastPlayerPositions.length >= futurePredictionDelay + 10 && 
		inputHistory.length >= 10 && 
		player.movementHistory.length >= 10) {
		
		// Pegar dados do passado para treinamento (MAIS DADOS)
		const pastIndex = lastPlayerPositions.length - futurePredictionDelay - 1;
		const pastPosition = lastPlayerPositions[pastIndex];
		const pastInputs = inputHistory.slice(-10 - futurePredictionDelay, -futurePredictionDelay);
		const pastMovement = player.movementHistory.slice(-10 - futurePredictionDelay, -futurePredictionDelay);
		
		// Dados atuais como "futuro" que a IA deve aprender a prever
		const currentPosition = { x: player.x, y: player.y };
		const currentVelocity = { 
			x: player.velocityX || 0, 
			y: player.velocityY || 0 
		};
		
		// Estado do player no momento passado (MAIS DETALHADO)
		const pastPlayerState = {
			x: pastPosition.x,
			y: pastPosition.y,
			vx: pastPosition.vx,
			vy: pastPosition.vy,
			averageSpeed: player.averageSpeed || 3,
			directionChanges: player.directionChanges || 0,
			patternConfidence: player.patternConfidence || 0.5,
			health: pastPosition.health,
			timestamp: pastPosition.timestamp
		};
		
		// ADICIONAR DADOS DE TREINAMENTO SEMPRE (sem throttling)
		try {
			// Extrair features usando o novo sistema
			const features = ultraAI.extractUltraFeatures(pastInputs, pastMovement, pastPlayerState);
			
			// Adicionar exemplo de treinamento
			ultraAI.addTrainingExample(features, currentPosition, futurePredictionDelay / 60); // Converter frames para segundos
			
			// Log de progresso
			if (ultraAI.stats.totalPredictions % 50 === 0) {
				console.log(`🎯 IA ULTRA PRECISA - Total de exemplos: ${ultraAI.stats.totalPredictions}, Precisão: ${(ultraAI.stats.accuracy * 100).toFixed(2)}%`);
			}
			
		} catch (error) {
			console.warn('⚠️ Erro no treinamento da IA Ultra Precisa:', error.message);
		}
		
		lastAITrainingTime = currentTime;
	}
	
	// FAZER PREDIÇÕES FREQUENTES para máxima precisão
	if (currentTime - lastAIUpdateTime > AI_UPDATE_INTERVAL) {
		await updateUltraPreciseAIPredictions();
		lastAIUpdateTime = currentTime;
	}
}

// Função para atualizar predições da IA ULTRA PRECISA
async function updateUltraPreciseAIPredictions() {
	if (!AI_ENABLED || inputHistory.length < 10 || player.movementHistory.length < 10) {
		return;
	}
	
	// Estado atual do player para predição (ULTRA DETALHADO)
	const playerState = {
		x: player.x,
		y: player.y,
		vx: player.velocityX || 0,
		vy: player.velocityY || 0,
		speed: player.speed || 3,  // VELOCIDADE ATUAL DO JOGADOR (pode mudar com upgrades!)
		averageSpeed: player.averageSpeed || player.speed || 3,
		directionChanges: player.directionChanges || 0,
		patternConfidence: player.patternConfidence || 0.5,
		health: player.health,
		timestamp: Date.now()
	};
	
	// MÚLTIPLOS HORIZONTES TEMPORAIS para máxima precisão
	const timeHorizons = [0.1, 0.25, 0.5, 0.75, 1.0]; // 100ms até 1 segundo
	
	try {
		for (const horizon of timeHorizons) {
			const prediction = await ultraAI.predictPlayerPosition(
				inputHistory.slice(-15), // Últimos 15 inputs para máxima precisão
				player.movementHistory.slice(-15), // Últimos 15 movimentos
				playerState,
				horizon
			);
			
			// Adicionar predição apenas se confiança for alta
			if (prediction.confidence > 0.7) { // Aceitar apenas 70%+ confiança
				
				// Armazenar para validação futura
				aiValidationBuffer.push({
					prediction: prediction,
					createdAt: Date.now(),
					validationTime: Date.now() + (horizon * 1000),
					playerStateAtPrediction: {...playerState}
				});
				
				aiPredictions.push({
					position: prediction.position,
					confidence: prediction.confidence,
					timeHorizon: horizon,
					createdAt: Date.now(),
					validationTime: Date.now() + (horizon * 1000),
					networkPredictions: prediction.networkPredictions,
					processingTime: prediction.processingTime,
					metadata: prediction.metadata
				});
			}
		}
		
		// Log de performance da IA
		if (aiPredictions.length > 0) {
			const avgConfidence = aiPredictions.reduce((sum, p) => sum + p.confidence, 0) / aiPredictions.length;
			const activeSystems = aiPredictions[0]?.metadata?.activeSystems || 0;
			
			console.log(`🧠 IA ULTRA PRECISA - Predições: ${aiPredictions.length}, Confiança média: ${(avgConfidence * 100).toFixed(1)}%, Sistemas ativos: ${activeSystems}`);
			
			// === ATUALIZAR VISUALIZADOR NEURAL ===
			try {
				const neuralData = ultraAI.exportNeuralVisualizationData();
				neuralViz.updateOverlay(neuralData, avgConfidence);
			} catch (vizError) {
				console.warn('⚠️ Erro ao atualizar visualizador neural:', vizError);
			}
		}
		
	} catch (error) {
		console.error('❌ ERRO CRÍTICO na IA Ultra Precisa:', error);
		// Não desabilitar - tentar novamente na próxima iteração
	}
	
	// VALIDAR PREDIÇÕES ANTERIORES para calcular precisão
	await validateUltraPrecisePredictions();
	
	// Limitar número de predições ativas (mas manter mais para precisão)
	if (aiPredictions.length > 20) {
		aiPredictions = aiPredictions.slice(-15); // Manter as 15 mais recentes
	}
	
	// Limitar buffer de validação
	if (aiValidationBuffer.length > 100) {
		aiValidationBuffer = aiValidationBuffer.slice(-80); // Manter os 80 mais recentes
	}
}

// Função para validar predições e melhorar a IA continuamente
async function validateUltraPrecisePredictions() {
	if (!AI_ENABLED || aiValidationBuffer.length === 0) return;
	
	const currentTime = Date.now();
	let validatedCount = 0;
	const currentPosition = { x: player.x, y: player.y };
	
	// Validar TODAS as predições que chegaram no tempo
	for (let i = aiValidationBuffer.length - 1; i >= 0; i--) {
		const predictionData = aiValidationBuffer[i];
		
		if (currentTime >= predictionData.validationTime) {
			// Calcular erro da predição
			const error = Math.sqrt(
				Math.pow(predictionData.prediction.position.x - currentPosition.x, 2) +
				Math.pow(predictionData.prediction.position.y - currentPosition.y, 2)
			);
			
			// Tolerância baseada no horizonte temporal (mais tolerância para predições mais distantes)
			const tolerance = 20 + (predictionData.prediction.timeHorizon * 30);
			
			// Validar com a IA Ultra Precisa
			const validation = ultraAI.validatePrediction(
				predictionData.prediction.position,
				currentPosition,
				tolerance
			);
			
			// Atualizar estatísticas globais
			aiStats.predictions = ultraAI.stats.totalPredictions;
			aiStats.accuracy = ultraAI.stats.accuracy;
			
			// Remover predição validada
			aiValidationBuffer.splice(i, 1);
			validatedCount++;
			
			// Log detalhado para casos de baixa precisão
			if (!validation.isCorrect && predictionData.prediction.confidence > 0.8) {
				console.warn(`⚠️ Predição falhou: erro=${error.toFixed(1)}px, confiança=${(predictionData.prediction.confidence * 100).toFixed(1)}%, horizonte=${predictionData.prediction.timeHorizon}s`);
			}
		}
	}
	
	// Log de progresso a cada validação
	if (validatedCount > 0) {
		console.log(`✅ Validadas ${validatedCount} predições. Precisão atual: ${(aiStats.accuracy * 100).toFixed(2)}%`);
		
		// Se a precisão estiver baixa, ajustar parâmetros
		if (aiStats.accuracy < 0.8 && ultraAI.stats.totalPredictions > 50) {
			console.log('🔧 Precisão baixa detectada. Iniciando auto-otimização...');
			await ultraAI.continuousOptimization();
		}
	}
}

// Função para obter melhor predição para um inimigo (ULTRA PRECISA)
function getBestUltraPreciseAIPrediction(enemy, bulletSpeed) {
	if (aiPredictions.length === 0) {
		return null;
	}
	
	// Calcular tempo aproximado para bala atingir o player
	const dx = (player.x + player.size/2) - (enemy.x + enemy.size/2);
	const dy = (player.y + player.size/2) - (enemy.y + enemy.size/2);
	const distance = Math.sqrt(dx*dx + dy*dy);
	const approxTime = distance / bulletSpeed;
	
	// Encontrar MÚLTIPLAS predições e usar ensemble
	const candidatePredictions = aiPredictions.filter(prediction => {
		const timeDiff = Math.abs(prediction.timeHorizon - approxTime);
		return timeDiff < 0.3 && prediction.confidence > 0.75; // Apenas predições muito confiáveis
	});
	
	if (candidatePredictions.length === 0) {
		// Fallback: usar predição com maior confiança
		const bestPrediction = aiPredictions.reduce((best, current) => 
			current.confidence > best.confidence ? current : best
		);
		return bestPrediction.confidence > 0.6 ? bestPrediction : null;
	}
	
	// ENSEMBLE: combinar múltiplas predições usando pesos de confiança
	let totalWeight = 0;
	let weightedX = 0;
	let weightedY = 0;
	let maxConfidence = 0;
	
	candidatePredictions.forEach(prediction => {
		const timeWeight = 1 - Math.abs(prediction.timeHorizon - approxTime) / 0.3; // Peso baseado na proximidade temporal
		const confidenceWeight = Math.pow(prediction.confidence, 2); // Peso quadrático para alta confiança
		const finalWeight = timeWeight * confidenceWeight;
		
		weightedX += prediction.position.x * finalWeight;
		weightedY += prediction.position.y * finalWeight;
		totalWeight += finalWeight;
		maxConfidence = Math.max(maxConfidence, prediction.confidence);
	});
	
	if (totalWeight === 0) return null;
	
	return {
		position: {
			x: weightedX / totalWeight,
			y: weightedY / totalWeight
		},
		confidence: maxConfidence,
		timeHorizon: approxTime,
		ensembleSize: candidatePredictions.length,
		isEnsemble: candidatePredictions.length > 1
	};
}

// Função para desenhar visualização da IA ULTRA PRECISA
function drawUltraPreciseAIVisualization() {
	if (!keys['i']) return; // Apenas mostrar se tecla I estiver pressionada
	
	// Desenhar predições da IA com cores ultra detalhadas
	aiPredictions.forEach((prediction, index) => {
		const alpha = Math.max(0.2, prediction.confidence);
		const timeRatio = prediction.timeHorizon / 1.0; // Normalizar para 1s max
		
		// Cores baseadas na confiança e sistemas ativos
		let red = 255;
		let green = 0;
		let blue = 0;
		
		if (prediction.confidence > 0.9) {
			// Verde para alta confiança (90%+)
			red = 0; green = 255; blue = 0;
		} else if (prediction.confidence > 0.8) {
			// Amarelo para boa confiança (80-90%)
			red = 255; green = 255; blue = 0;
		} else if (prediction.confidence > 0.7) {
			// Laranja para confiança média (70-80%)
			red = 255; green = 165; blue = 0;
		}
		
		// Círculo da predição com tamanho baseado na confiança
		const radius = 5 + (prediction.confidence * 15); // 5-20px baseado na confiança
		ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
		ctx.beginPath();
		ctx.arc(prediction.position.x, prediction.position.y, radius, 0, Math.PI * 2);
		ctx.fill();
		
		// Borda mais espessa para predições ensemble
		if (prediction.ensembleSize > 1) {
			ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
			ctx.lineWidth = 3;
			ctx.stroke();
		}
		
		// Linha da posição atual para predição
		ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha * 0.6})`;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(player.x + player.size/2, player.y + player.size/2);
		ctx.lineTo(prediction.position.x, prediction.position.y);
		ctx.stroke();
		
		// Texto de informação detalhada
		if (prediction.confidence > 0.8) {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
			ctx.font = '10px Arial';
			ctx.textAlign = 'center';
			ctx.fillText(
				`${(prediction.confidence * 100).toFixed(0)}%`, 
				prediction.position.x, 
				prediction.position.y - radius - 5
			);
			
			// Mostrar tempo de horizonte
			ctx.fillText(
				`${(prediction.timeHorizon * 1000).toFixed(0)}ms`, 
				prediction.position.x, 
				prediction.position.y + radius + 15
			);
		}
	});
	
	// Painel de estatísticas da IA ULTRA DETALHADO
	const panelWidth = 350;
	const panelHeight = 280;
	ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
	ctx.fillRect(10, 200, panelWidth, panelHeight);
	
	ctx.fillStyle = '#fff';
	ctx.font = 'bold 16px Arial';
	ctx.textAlign = 'left';
	ctx.fillText('IA ULTRA PRECISA - ESTATÍSTICAS', 15, 220);
	
	ctx.font = '14px Arial';
	let yOffset = 240;
	
	// Estatísticas principais
	const detailedStats = ultraAI.getDetailedStats();
	ctx.fillText(`Total de Predições: ${detailedStats.totalPredictions}`, 15, yOffset);
	yOffset += 18;
	
	ctx.fillStyle = detailedStats.accuracy > 0.9 ? '#0f0' : detailedStats.accuracy > 0.8 ? '#ff0' : '#f80';
	ctx.fillText(`Precisão: ${(detailedStats.accuracy * 100).toFixed(2)}%`, 15, yOffset);
	yOffset += 18;
	
	ctx.fillStyle = '#fff';
	ctx.fillText(`Predições Ativas: ${aiPredictions.length}`, 15, yOffset);
	yOffset += 18;
	
	ctx.fillText(`Validações Pendentes: ${aiValidationBuffer.length}`, 15, yOffset);
	yOffset += 18;
	
	// Estatísticas de memória
	if (detailedStats.memoryUsage) {
		ctx.fillText(`KNN Data Points: ${detailedStats.memoryUsage.knnDataPoints}`, 15, yOffset);
		yOffset += 18;
		
		ctx.fillText(`Redes Neurais: ${detailedStats.memoryUsage.neuralNetworkSize}`, 15, yOffset);
		yOffset += 18;
	}
	
	// Performance
	if (detailedStats.performance && detailedStats.performance.averageProcessingTime > 0) {
		ctx.fillText(`Tempo Médio: ${detailedStats.performance.averageProcessingTime.toFixed(1)}ms`, 15, yOffset);
		yOffset += 18;
	}
	
	// Pesos dos sistemas (apenas os principais)
	ctx.font = '12px Arial';
	ctx.fillStyle = '#aaa';
	ctx.fillText('Pesos dos Sistemas:', 15, yOffset);
	yOffset += 15;
	
	const mainWeights = ['ultraDeep', 'lstm', 'conv', 'attention', 'transformer'];
	mainWeights.forEach(system => {
		if (detailedStats.predictionWeights[system]) {
			ctx.fillText(`${system}: ${(detailedStats.predictionWeights[system] * 100).toFixed(1)}%`, 20, yOffset);
			yOffset += 12;
		}
	});
	
	// Mostrar padrão atual
	if (player.movementPattern && player.patternConfidence > 0.3) {
		ctx.fillStyle = player.patternConfidence > 0.7 ? '#0f0' : '#ff0';
		ctx.font = '14px Arial';
		ctx.fillText(`Padrão: ${player.movementPattern.toUpperCase()} (${(player.patternConfidence * 100).toFixed(0)}%)`, 15, yOffset + 10);
	}
}

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
	currentRoom.savedState.enemies = enemies.map(enemy => {
		const savedEnemy = {
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
		};
		
		// Adicionar propriedades específicas do phantom
		if (enemy.type === 'phantom') {
			savedEnemy.isVisible = enemy.isVisible;
			savedEnemy.invisibilityDuration = enemy.invisibilityDuration;
			savedEnemy.invisibilityStartTime = enemy.invisibilityStartTime;
			savedEnemy.repositionOnInvisible = enemy.repositionOnInvisible;
			savedEnemy.repositionTimer = enemy.repositionTimer;
			savedEnemy.originalColor = enemy.originalColor;
		}
		
		return savedEnemy;
	});
	
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
		enemies = currentRoom.savedState.enemies.map(savedEnemy => {
			const enemy = {...savedEnemy};
			
			// === CORREÇÃO CRÍTICA PARA TIROS ===
			// Garantir que timestamps sejam válidos
			const currentTime = Date.now();
			
			// Se o timestamp salvo for muito antigo ou inválido, corrigir
			if (!enemy.lastShotTime || 
				enemy.lastShotTime < currentTime - 10000 || // Mais de 10 segundos atrás
				enemy.lastShotTime > currentTime) { // Timestamp no futuro (inválido)
				enemy.lastShotTime = currentTime - (enemy.shootInterval || 2000); // Permitir atirar imediatamente
			}
			
			// Garantir que spawnTime seja válido
			if (!enemy.spawnTime || 
				enemy.spawnTime < currentTime - 10000 ||
				enemy.spawnTime > currentTime) {
				enemy.spawnTime = currentTime - (ENEMY_SPAWN_DELAY || 2000); // Permitir atacar imediatamente
			}
			
			// Garantir que canAttack esteja correto
			if (currentTime - enemy.spawnTime >= (ENEMY_SPAWN_DELAY || 2000)) {
				enemy.canAttack = true;
			}
			
			// Garantir que propriedades essenciais existam
			if (!enemy.shootInterval) {
				enemy.shootInterval = 2000; // Default
			}
			if (!enemy.aimAccuracy) {
				enemy.aimAccuracy = 0.95; // Default alta precisão
			}
			if (enemy.vx === undefined) enemy.vx = 0;
			if (enemy.vy === undefined) enemy.vy = 0;
			if (enemy.wanderTimer === undefined) enemy.wanderTimer = 0;
			
			// Restaurar propriedades específicas do phantom
			if (enemy.type === 'phantom') {
				// Garantir que propriedades do phantom existam
				if (enemy.isVisible === undefined) enemy.isVisible = true;
				if (!enemy.invisibilityDuration) enemy.invisibilityDuration = 4000;
				if (!enemy.invisibilityStartTime) enemy.invisibilityStartTime = 0;
				if (enemy.repositionOnInvisible === undefined) enemy.repositionOnInvisible = true;
				if (!enemy.repositionTimer) enemy.repositionTimer = 0;
				if (!enemy.originalColor) enemy.originalColor = enemy.color;
				
				// Validar estado de invisibilidade
				if (!enemy.isVisible && enemy.invisibilityStartTime > 0) {
					// Verificar se invisibilidade já deveria ter acabado
					if (currentTime - enemy.invisibilityStartTime >= enemy.invisibilityDuration) {
						enemy.isVisible = true;
						enemy.invisibilityStartTime = 0;
						console.log(`Phantom restaurado como visível (invisibilidade expirada)`);
					}
				}
			}
			
			console.log(`Restored enemy ${enemy.type}: canAttack=${enemy.canAttack}, lastShot=${currentTime - enemy.lastShotTime}ms ago${enemy.type === 'phantom' ? `, visible=${enemy.isVisible}` : ''}`);
			
			return enemy;
		});
		
		// Restaurar bullets
		bullets = currentRoom.savedState.bullets.map(savedBullet => ({
			...savedBullet
		}));
		
		// Restaurar powerups
		powerUps = currentRoom.savedState.powerUps.map(savedPowerup => ({
			...savedPowerup
		}));
		
		// === VERIFICAR LIMITE DE PHANTOMS EM ESTADOS SALVOS ===
		const phantomCount = countLivePhantoms();
		if (phantomCount > 2) {
			console.warn(`Sala salva tinha ${phantomCount} Phantoms. Aplicando limite de 2...`);
			// Converter Phantoms excedentes para outros tipos
			let phantomsConverted = 0;
			const nonPhantomTypes = ['fly', 'spider', 'shooter'];
			
			for (let i = 0; i < enemies.length && phantomsConverted < (phantomCount - 2); i++) {
				if (enemies[i].type === 'phantom' && !enemies[i].dead) {
					const newType = nonPhantomTypes[Math.floor(Math.random() * nonPhantomTypes.length)];
					console.log(`Converting excess Phantom to ${newType}`);
					
					// Manter posição e vida, mas mudar tipo e propriedades
					const originalEnemy = enemies[i];
					enemies[i] = createEnemy(originalEnemy.x, originalEnemy.y, newType);
					enemies[i].health = originalEnemy.health;
					enemies[i].canAttack = originalEnemy.canAttack;
					enemies[i].spawnTime = originalEnemy.spawnTime;
					
					phantomsConverted++;
				}
			}
		}
		
		console.log(`Loaded room state: ${enemies.length} enemies (${countLivePhantoms()} phantoms), ${bullets.length} bullets, ${powerUps.length} powerups`);
		return true; // Estado foi carregado
	}
	
	return false; // Sem estado salvo, precisa gerar novo
}

// Função para contar Phantoms vivos na sala atual
function countLivePhantoms() {
	return enemies.filter(enemy => enemy.type === 'phantom' && !enemy.dead).length;
}

// Função de debug para forçar spawn de Phantoms (apenas para teste)
function debugSpawnPhantoms() {
	console.log('DEBUG: Tentando spawnar 5 Phantoms para testar limite...');
	const testTypes = ['phantom', 'phantom', 'phantom', 'phantom', 'phantom'];
	
	for (let i = 0; i < testTypes.length; i++) {
		const x = Math.random() * (roomWidth - 200) + 100;
		const y = Math.random() * (roomHeight - 200) + 100;
		let type = testTypes[i];
		
		// Aplicar mesma lógica de limitação
		if (type === 'phantom' && countLivePhantoms() >= 2) {
			const nonPhantomTypes = ['fly', 'spider', 'shooter'];
			type = nonPhantomTypes[Math.floor(Math.random() * nonPhantomTypes.length)];
			console.log(`DEBUG: Phantom ${i+1} blocked - limit reached. Spawning ${type} instead.`);
		}
		
		enemies.push(createEnemy(x, y, type));
	}
	
	const finalPhantomCount = countLivePhantoms();
	console.log(`DEBUG: Resultado final: ${finalPhantomCount} Phantoms spawrados (máximo esperado: 2)`);
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
		const enemyTypes = ['fly', 'spider', 'shooter', 'phantom'];
		
		for (let i = 0; i < enemyCount; i++) {
			const x = Math.random() * (roomWidth - 200) + 100;
			const y = Math.random() * (roomHeight - 200) + 100;
			let type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
			
			// === LIMITAÇÃO DE PHANTOMS: MÁXIMO 2 POR SALA ===
			if (type === 'phantom' && countLivePhantoms() >= 2) {
				// Se já tem 2 ou mais Phantoms, escolher outro tipo aleatório
				const nonPhantomTypes = ['fly', 'spider', 'shooter'];
				type = nonPhantomTypes[Math.floor(Math.random() * nonPhantomTypes.length)];
				console.log('Phantom spawn blocked - limit reached. Spawning', type, 'instead.');
			}
			
			enemies.push(createEnemy(x, y, type));
		}
		
		// Log de spawn para monitoramento
		const phantomCount = countLivePhantoms();
		console.log(`Spawned ${enemyCount} enemies in room (${phantomCount} phantoms, limit: 2)`);
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
	
	// Estado de paralização
	if (player.paralyzed) {
		const timeLeft = Math.max(0, player.paralyzedDuration - (Date.now() - player.paralyzedTime));
		const secondsLeft = (timeLeft / 1000).toFixed(1);
		
		ctx.fillStyle = '#4169E1';
		ctx.strokeText(`🚫 PARALISADO: ${secondsLeft}s`, statsX, statsY + 60);
		ctx.fillText(`🚫 PARALISADO: ${secondsLeft}s`, statsX, statsY + 60);
	} else {
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

async function update() {
	// Atualizar frame counter para sistema de input
	updateFrame();
	
	// Coletar dados para treinamento da IA ULTRA PRECISA
	await collectAITrainingData();
	
	// Calcular deltaTime
	const currentTime = Date.now();
	deltaTime = (currentTime - lastFrameTime) / 1000; // Converter para segundos
	lastFrameTime = currentTime;
	
	// Selecionar inimigo alvo para visualização (rotaciona a cada 5 segundos)
	if (enemies.length > 0) {
		if (!targetEnemy || !enemies.includes(targetEnemy) || (Date.now() - targetEnemyRotationTime) > TARGET_ENEMY_ROTATION_INTERVAL) {
			// Escolher inimigo aleatório
			targetEnemy = enemies[Math.floor(Math.random() * enemies.length)];
			targetEnemyRotationTime = Date.now();
		}
	} else {
		targetEnemy = null;
	}
	
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
	
	// Movimento (apenas se não estiver paralisado)
	if (!player.paralyzed) {
		if (keys['w']) player.y -= player.speed;
		if (keys['s']) player.y += player.speed;
		if (keys['a']) player.x -= player.speed;
		if (keys['d']) player.x += player.speed;
	}

	// Verificar colisões com paredes (deve vir antes das transições)
	checkWallCollisions();

	// Debug: pressionar P para spawnar trapdoor
	if (keys['p']) {
		if (!trapdoorSpawned) {
			bossDefeated = true;
			trapdoorSpawned = true;
		}
	}
	
	// Debug: pressionar T para testar limite de Phantoms
	if (keys['t'] || keys['T']) {
		if (!keys['phantomTestPressed']) {
			keys['phantomTestPressed'] = true;
			debugSpawnPhantoms();
		}
	} else {
		keys['phantomTestPressed'] = false;
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
		
		// Desenhar aura roxa ao redor do inimigo rastreado pela IA
		if (enemy === targetEnemy) {
			ctx.save();
			ctx.strokeStyle = '#9d4edd'; // Roxo vibrante
			ctx.shadowBlur = 20;
			ctx.shadowColor = '#9d4edd';
			ctx.lineWidth = 3;
			
			// Desenhar círculo pulsante ao redor do inimigo
			const pulse = Math.sin(Date.now() / 300) * 5 + 35; // Pulsa entre 30 e 40 pixels
			ctx.beginPath();
			ctx.arc(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, pulse, 0, Math.PI * 2);
			ctx.stroke();
			
			// Desenhar linha para a predição da IA (se disponível)
			const ultraPrediction = getBestUltraPreciseAIPrediction(enemy, 10);
			if (ultraPrediction && ultraPrediction.predictedPosition) {
				ctx.strokeStyle = '#c77dff'; // Roxo mais claro para a linha
				ctx.lineWidth = 2;
				ctx.setLineDash([5, 5]); // Linha tracejada
				ctx.beginPath();
				ctx.moveTo(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2);
				ctx.lineTo(ultraPrediction.predictedPosition.x, ultraPrediction.predictedPosition.y);
				ctx.stroke();
				ctx.setLineDash([]); // Resetar linha tracejada
				
				// Desenhar círculo na posição prevista
				ctx.fillStyle = 'rgba(199, 125, 255, 0.3)'; // Roxo translúcido
				ctx.beginPath();
				ctx.arc(ultraPrediction.predictedPosition.x, ultraPrediction.predictedPosition.y, 8, 0, Math.PI * 2);
				ctx.fill();
			}
			
			ctx.restore();
		}
		
		drawEnemy(ctx, enemy);
		
			// Inimigo atira no player com IA ULTRA EXTREMAMENTE INSANA
			if (updateResult && updateResult.shouldShoot) {
				const bulletSpeed = 10; // AUMENTADO de 8 para 10 - projéteis ULTRA rápidos
				
				// === USAR IA ULTRA PRECISA PARA MIRA ABSURDAMENTE SUPREMA ===
				let angle;
				let aimMethod = 'ultra_precise'; // Método de mira utilizado
				let aiConfidence = 0;
				
				// Tentar usar predição da IA ULTRA PRECISA primeiro
				const ultraPrediction = getBestUltraPreciseAIPrediction(enemy, bulletSpeed);
				
				if (ultraPrediction && ultraPrediction.confidence > 0.75) {
					// IA ULTRA PRECISA - Mira na predição do ensemble neural
					angle = Math.atan2(
						ultraPrediction.position.y - (enemy.y + enemy.size/2),
						ultraPrediction.position.x - (enemy.x + enemy.size/2)
					);
					aimMethod = ultraPrediction.isEnsemble ? 'ultra_ensemble' : 'ultra_neural';
					aiConfidence = ultraPrediction.confidence;
					
					// Log de alta precisão
					if (ultraPrediction.confidence > 0.95) {
						console.log(`🎯 ULTRA PRECISÃO: ${(ultraPrediction.confidence * 100).toFixed(1)}% confiança, ensemble: ${ultraPrediction.ensembleSize || 1} sistemas`);
					}
				} else {
					// Fallback para sistema avançado existente
					angle = calculateAdvancedPredictiveAngle(
						enemy.x + enemy.size/2,  // posição X do inimigo
						enemy.y + enemy.size/2,  // posição Y do inimigo
						player,                   // objeto completo do player com histórico
						bulletSpeed,              // velocidade do projétil
						updateResult.aimAccuracy  // precisão do inimigo (98-99%)
					);
					aimMethod = 'advanced_fallback';
					aiConfidence = updateResult.aimAccuracy;
				}
				
				// === APLICAR MODO ULTRA INSANIDADE ===
				const ultraInsanityMode = true; // SEMPRE ATIVO
				if (ultraInsanityMode && aiConfidence > 0.8) {
					// Ajuste final para AIMBOT LITERALMENTE ULTRA INSANO
					const finalAccuracy = Math.min(aiConfidence * 1.2, 0.9999); // Até 99.99%
					
					// Micro-ajuste baseado na confiança da IA
					const microAdjustment = (Math.random() - 0.5) * (1 - finalAccuracy) * 0.1;
					angle += microAdjustment;
				}
				
				const bullet = createBullet(
					enemy.x + enemy.size/2,
					enemy.y + enemy.size/2,
					angle,
					bulletSpeed, // velocidade ULTRA AUMENTADA
					18, // tamanho menor para tiros ultra rápidos
					enemy.damage,
					true // marcar como tiro de inimigo
				);
				
				// Marcar método de mira no projétil (para debug e visualização)
				bullet.aimMethod = aimMethod;
				bullet.aiConfidence = aiConfidence;
				bullet.ultraPrecision = aiConfidence > 0.9;
				
				bullets.push(bullet);
			}
		
		// Verificar colisão com player
		if (checkEnemyCollision(enemy, player)) {
			if (enemy.type === 'phantom') {
				// Phantom paralisa o jogador em vez de causar dano direto
				const paralyzed = paralyzePlayer(enemy, 2000); // 2 segundos
				if (paralyzed) {
					console.log('🚫 Phantom paralisou o jogador!');
				}
			} else {
				// Outros inimigos causam dano normal
				takeDamage(enemy.damage);
			}
		}
		
		// Verificar colisão com bullets do player
		bullets.forEach((bullet, bIndex) => {
			// Tiros de inimigos não atingem inimigos
			if (bullet.isEnemy) return;
			
			const dx = bullet.x - (enemy.x + enemy.size/2);
			const dy = bullet.y - (enemy.y + enemy.size/2);
			const distance = Math.sqrt(dx*dx + dy*dy);
			
			if (distance < enemy.size/2 + bullet.size/2) {
				// Tentar causar dano - só remove bala se dano foi aplicado
				const damageApplied = damageEnemy(enemy, bullet.damage, player);
				if (damageApplied) {
					bullets.splice(bIndex, 1);
				}
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
		
		// Cor diferente para tiros de inimigos com ULTRA PRECISÃO
		if (b.isEnemy) {
			// Desenhar tiro de inimigo com indicação de IA ULTRA PRECISA
			let bulletColor = '#ff4444';
			let borderColor = '#880000';
			let glowColor = null;
			
			// Cores especiais baseadas no método de mira ULTRA AVANÇADO
			if (b.aimMethod === 'ultra_ensemble') {
				bulletColor = '#ff0080'; // Rosa/magenta para ensemble ultra preciso
				borderColor = '#880040';
				glowColor = '#ff80c0'; // Brilho rosa
			} else if (b.aimMethod === 'ultra_neural') {
				bulletColor = '#8000ff'; // Roxo para IA neural ultra precisa
				borderColor = '#400080';
				glowColor = '#c080ff'; // Brilho roxo
			} else if (b.aimMethod === 'ultra_precise') {
				bulletColor = '#00ff80'; // Verde-azul para ultra precisão
				borderColor = '#008040';
				glowColor = '#80ffc0'; // Brilho verde-azul
			}
			
			// Efeito de brilho para tiros ultra precisos
			if (b.ultraPrecision && glowColor) {
				const glowRadius = b.size * 0.8;
				const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, glowRadius);
				gradient.addColorStop(0, glowColor + '80'); // 50% transparência
				gradient.addColorStop(1, glowColor + '00'); // Transparente
				
				ctx.fillStyle = gradient;
				ctx.beginPath();
				ctx.arc(b.x, b.y, glowRadius, 0, Math.PI * 2);
				ctx.fill();
			}
			
			// Desenhar projétil principal
			ctx.fillStyle = bulletColor;
			ctx.beginPath();
			ctx.arc(b.x, b.y, b.size/2, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = borderColor;
			ctx.lineWidth = 2;
			ctx.stroke();
			
			// Indicador de confiança da IA (núcleo brilhante)
			if (keys['i'] && b.aiConfidence > 0) {
				const coreAlpha = Math.pow(b.aiConfidence, 2); // Quadrático para destacar alta confiança
				ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`;
				ctx.beginPath();
				ctx.arc(b.x, b.y, b.size/4, 0, Math.PI * 2);
				ctx.fill();
				
				// Texto de confiança para tiros ultra precisos
				if (b.aiConfidence > 0.9) {
					ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
					ctx.font = '8px Arial';
					ctx.textAlign = 'center';
					ctx.fillText(`${(b.aiConfidence * 100).toFixed(0)}%`, b.x, b.y - b.size);
				}
			}
			
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
	
	// Debug info para IA ULTRA PRECISA
	if (keys['i']) {
		ctx.fillStyle = "lime";
		ctx.font = "16px Arial";
		ctx.fillText("IA ULTRA PRECISA DEBUG MODE (hold I)", 10, roomHeight - 60);
		ctx.fillText(`Predições ativas: ${aiPredictions.length} | Validações: ${aiValidationBuffer.length}`, 10, roomHeight - 40);
		ctx.fillText(`Precisão atual: ${(aiStats.accuracy * 100).toFixed(2)}% (${aiStats.predictions} predições)`, 10, roomHeight - 20);
	}
	
	// Debug info
	if (keys['p']) {
		ctx.fillStyle = "yellow";
		ctx.font = "16px Arial";
		ctx.fillText("DEBUG: Press P to spawn trapdoor | T to test phantom limit", 10, roomHeight - 60);
	}
	
	// Info sobre Phantoms na sala atual
	const currentPhantoms = countLivePhantoms();
	if (currentPhantoms > 0) {
		ctx.fillStyle = "#9d4edd";
		ctx.font = "14px Arial";
		ctx.fillText(`Phantoms na sala: ${currentPhantoms}/2`, 10, roomHeight - 100);
	}
	
	drawPlayer(ctx, mouseX, mouseY);
	
	// === EFEITOS DE PARALIZAÇÃO ===
	if (player.paralyzed) {
		// Círculo de paralização ao redor do player
		const pulseRadius = 30 + Math.sin(Date.now() / 150) * 8;
		ctx.strokeStyle = '#4169E1';
		ctx.lineWidth = 4;
		ctx.setLineDash([10, 5]);
		ctx.beginPath();
		ctx.arc(player.x + player.size/2, player.y + player.size/2, pulseRadius, 0, Math.PI * 2);
		ctx.stroke();
		ctx.setLineDash([]);
		
		// Texto de paralização
		ctx.fillStyle = '#4169E1';
		ctx.font = 'bold 16px Arial';
		ctx.textAlign = 'center';
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 3;
		ctx.strokeText('PARALISADO!', player.x + player.size/2, player.y - 15);
		ctx.fillText('PARALISADO!', player.x + player.size/2, player.y - 15);
		
		// Barra de tempo de paralização
		const timeLeft = Math.max(0, player.paralyzedDuration - (Date.now() - player.paralyzedTime));
		const timePercent = timeLeft / player.paralyzedDuration;
		
		const barWidth = 60;
		const barHeight = 8;
		const barX = player.x + player.size/2 - barWidth/2;
		const barY = player.y + player.size + 10;
		
		// Fundo da barra
		ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
		ctx.fillRect(barX, barY, barWidth, barHeight);
		
		// Progresso da paralização
		ctx.fillStyle = '#4169E1';
		ctx.fillRect(barX, barY, barWidth * timePercent, barHeight);
		
		// Borda da barra
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 2;
		ctx.strokeRect(barX, barY, barWidth, barHeight);
	}
	
	// Desenhar visualização da IA ULTRA PRECISA (se ativada)
	drawUltraPreciseAIVisualization();
	
	// Desenhar minimapa por último (para ficar por cima)
	drawMinimap();
	
	requestAnimationFrame(update);
}

// === CONTROLE DO VISUALIZADOR NEURAL ===
document.addEventListener('keydown', (e) => {
	// Pressione 'V' para mostrar/ocultar visualizador neural
	if (e.key === 'v' || e.key === 'V') {
		neuralViz.toggle();
	}
});

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

