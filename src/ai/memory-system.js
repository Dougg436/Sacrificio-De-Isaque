// ============================================================================
// SISTEMA DE MEMÓRIA DE LONGO PRAZO E ANÁLISE DE CONTEXTO
// ============================================================================

// === MEMÓRIA DE LONGO PRAZO ===
class LongTermMemorySystem {
	constructor() {
		this.episodicMemory = new Map(); // Memórias de situações específicas
		this.semanticMemory = new Map(); // Conhecimento geral sobre padrões
		this.proceduralMemory = new Map(); // Como reagir em certas situações
		this.workingMemory = []; // Memória de trabalho atual
		
		this.memoryIndex = 0;
		this.maxEpisodicMemories = 10000; // Lembrar de 10k situações
		this.maxSemanticConcepts = 1000;
		this.compressionThreshold = 0.8; // Quando comprimir memórias similares
		
		// Sistema de indexação por contexto
		this.contextIndex = new ContextualIndex();
		
		console.log("🧠 LongTermMemorySystem initialized - INFINITE MEMORY");
	}
	
	// Armazenar uma experiência completa
	storeEpisode(situation, actions, outcome, context) {
		const episode = {
			id: this.memoryIndex++,
			timestamp: Date.now(),
			situation: this.compressSituation(situation),
			actions: this.compressActions(actions),
			outcome: outcome,
			context: context,
			importance: this.calculateImportance(situation, outcome),
			accessCount: 0,
			lastAccessed: Date.now()
		};
		
		// Calcular hash da situação para indexação rápida
		const situationHash = this.hashSituation(situation);
		
		// Verificar se já temos uma situação muito similar
		const similarEpisodes = this.findSimilarEpisodes(situation, 0.9);
		
		if (similarEpisodes.length > 0 && episode.importance < this.compressionThreshold) {
			// Comprimir com episódio similar existente
			this.compressWithSimilar(episode, similarEpisodes[0]);
		} else {
			// Armazenar como novo episódio
			this.episodicMemory.set(episode.id, episode);
			this.contextIndex.addEpisode(episode);
		}
		
		// Extrair conhecimento semântico
		this.extractSemanticKnowledge(episode);
		
		// Atualizar memória procedimental
		this.updateProceduralMemory(episode);
		
		// Gerenciar tamanho da memória
		this.manageMemorySize();
		
		console.log(`🧠 Episode stored: ID ${episode.id}, Importance: ${episode.importance.toFixed(2)}`);
	}
	
	compressSituation(situation) {
		// Comprimir dados da situação mantendo informações essenciais
		if (!situation) {
			return {
				playerPos: { x: 0, y: 0 },
				playerHealth: 100,
				enemyCount: 0,
				powerupCount: 0,
				roomType: 'unknown',
				timeInRoom: 0,
				movementPattern: 'unknown',
				averageSpeed: 0,
				directionChanges: 0
			};
		}
		
		// Se situation é um array (features), criar um objeto simplificado
		if (Array.isArray(situation)) {
			return {
				playerPos: { x: Math.round((situation[0] || 0) * 100), y: Math.round((situation[1] || 0) * 100) },
				playerHealth: Math.round((situation[2] || 0.5) * 100),
				enemyCount: Math.round((situation[3] || 0) * 10),
				powerupCount: Math.round((situation[4] || 0) * 10),
				roomType: 'unknown',
				timeInRoom: 0,
				movementPattern: 'unknown',
				averageSpeed: Math.round((situation[5] || 0) * 100),
				directionChanges: Math.round((situation[6] || 0) * 20)
			};
		}
		
		return {
			playerPos: { 
				x: Math.round((situation.x || 0) / 10) * 10, 
				y: Math.round((situation.y || 0) / 10) * 10 
			},
			playerHealth: Math.round((situation.health || 100) / 10) * 10,
			enemyCount: situation.enemyCount || 0,
			powerupCount: situation.powerupCount || 0,
			roomType: situation.roomType || 'unknown',
			timeInRoom: Math.round((situation.timeInRoom || 0) / 1000), // Em segundos
			movementPattern: situation.movementPattern || 'unknown',
			averageSpeed: Math.round(situation.averageSpeed || 0),
			directionChanges: situation.directionChanges || 0
		};
	}
	
	compressActions(actions) {
		// Comprimir sequência de ações
		const compressed = {
			dominantMovement: this.findDominantMovement(actions),
			shotsFired: actions.filter(a => a.type === 'shoot').length,
			movementDuration: this.calculateMovementDuration(actions),
			patternComplexity: this.calculateActionComplexity(actions)
		};
		return compressed;
	}
	
	findDominantMovement(actions) {
		// Encontrar movimento dominante na sequência de ações
		if (!actions || !Array.isArray(actions) || actions.length === 0) {
			return 'idle';
		}
		
		const movements = actions.filter(a => a && (a.type === 'movement' || a.type === 'move'));
		if (movements.length === 0) return 'idle';
		
		const directions = {
			up: 0, down: 0, left: 0, right: 0,
			upLeft: 0, upRight: 0, downLeft: 0, downRight: 0
		};
		
		movements.forEach(move => {
			if (move.direction) {
				directions[move.direction] = (directions[move.direction] || 0) + 1;
			} else if (move.dx !== undefined && move.dy !== undefined) {
				// Calcular direção baseado em dx/dy
				if (Math.abs(move.dx) > Math.abs(move.dy)) {
					directions[move.dx > 0 ? 'right' : 'left']++;
				} else if (Math.abs(move.dy) > Math.abs(move.dx)) {
					directions[move.dy > 0 ? 'down' : 'up']++;
				}
			}
		});
		
		// Retornar direção mais comum
		return Object.keys(directions).reduce((a, b) => 
			directions[a] > directions[b] ? a : b
		) || 'idle';
	}
	
	calculateMovementDuration(actions) {
		// Calcular duração total de movimento nas ações
		if (!actions || !Array.isArray(actions)) return 0;
		
		const movementActions = actions.filter(a => 
			a.type === 'movement' || a.type === 'move' || 
			(a.dx !== undefined && a.dy !== undefined)
		);
		
		if (movementActions.length === 0) return 0;
		
		// Calcular duração baseada no número de ações de movimento
		// Assumindo ~16ms por frame (60 FPS)
		return movementActions.length * 16;
	}
	
	calculateActionComplexity(actions) {
		// Calcular complexidade da sequência de ações
		if (!actions || !Array.isArray(actions) || actions.length === 0) return 0;
		
		let complexity = 0;
		let directionChanges = 0;
		let actionTypes = new Set();
		let previousDirection = null;
		
		// Contar tipos diferentes de ação
		actions.forEach(action => {
			if (action.type) actionTypes.add(action.type);
		});
		
		// Contar mudanças de direção
		actions.forEach(action => {
			let currentDirection = null;
			
			if (action.direction) {
				currentDirection = action.direction;
			} else if (action.dx !== undefined && action.dy !== undefined) {
				if (Math.abs(action.dx) > Math.abs(action.dy)) {
					currentDirection = action.dx > 0 ? 'right' : 'left';
				} else if (Math.abs(action.dy) > Math.abs(action.dx)) {
					currentDirection = action.dy > 0 ? 'down' : 'up';
				}
			}
			
			if (currentDirection && previousDirection && currentDirection !== previousDirection) {
				directionChanges++;
			}
			previousDirection = currentDirection;
		});
		
		// Calcular complexidade baseada em diversos fatores
		complexity += actionTypes.size * 0.2; // Variedade de tipos de ação
		complexity += (directionChanges / Math.max(1, actions.length)) * 0.5; // Frequência de mudanças
		complexity += Math.min(1, actions.length / 60) * 0.3; // Duração da sequência
		
		return Math.min(1.0, complexity);
	}
	
	calculateImportance(situation, outcome) {
		let importance = 0.5; // Base importance
		
		if (!situation || !outcome) {
			return importance;
		}
		
		// Para arrays (features), acessar valores por índice
		let health, enemyCount;
		if (Array.isArray(situation)) {
			health = (situation[2] || 0.5) * 100; // Normalizado para 0-100
			enemyCount = (situation[3] || 0) * 10; // Normalizado
		} else {
			health = situation.health || 100;
			enemyCount = situation.enemyCount || 0;
		}
		
		// Situações com baixa saúde são mais importantes
		if (health < 30) importance += 0.3;
		
		// Muitos inimigos = situação importante
		if (enemyCount > 3) importance += 0.2;
		
		// Outcomes negativos (morte) são mais importantes para aprender
		if (outcome.died) importance += 0.4;
		
		// Outcomes muito positivos também
		if (outcome.score && outcome.score > 100) importance += 0.2;
		
		// Situações raras são importantes
		try {
			const similarity = this.findSimilarEpisodes(situation, 0.8);
			if (similarity.length < 5) importance += 0.3;
		} catch (error) {
			// Se houver erro na comparação, manter importância base
			console.warn('🧠 Erro calculando similaridade para importância:', error.message);
		}
		
		return Math.min(1.0, importance);
	}
	
	hashSituation(situation) {
		// Hash simples para indexação rápida
		if (!situation) {
			return '0_0_100_0';
		}
		
		let x, y, health, enemyCount;
		if (Array.isArray(situation)) {
			x = (situation[0] || 0) * 100;
			y = (situation[1] || 0) * 100;
			health = (situation[2] || 0.5) * 100;
			enemyCount = (situation[3] || 0) * 10;
		} else {
			x = situation.x || 0;
			y = situation.y || 0;
			health = situation.health || 100;
			enemyCount = situation.enemyCount || 0;
		}
		
		const str = `${Math.floor(x/50)}_${Math.floor(y/50)}_${Math.floor(health/20)}_${enemyCount}`;
		return str;
	}
	
	findSimilarEpisodes(situation, threshold = 0.8) {
		const similar = [];
		
		this.episodicMemory.forEach(episode => {
			const similarity = this.calculateSituationSimilarity(situation, episode.situation);
			if (similarity >= threshold) {
				similar.push({ episode, similarity });
			}
		});
		
		return similar.sort((a, b) => b.similarity - a.similarity);
	}
	
	calculateSituationSimilarity(sit1, sit2) {
		if (!sit1 || !sit2) return 0;
		
		let similarity = 0;
		let factors = 0;
		
		// Extrair valores de sit1
		let x1, y1, health1, enemyCount1, roomType1, movementPattern1;
		if (Array.isArray(sit1)) {
			x1 = (sit1[0] || 0) * 100;
			y1 = (sit1[1] || 0) * 100;
			health1 = (sit1[2] || 0.5) * 100;
			enemyCount1 = (sit1[3] || 0) * 10;
			roomType1 = 'unknown';
			movementPattern1 = 'unknown';
		} else {
			x1 = sit1.x || 0;
			y1 = sit1.y || 0;
			health1 = sit1.health || 100;
			enemyCount1 = sit1.enemyCount || 0;
			roomType1 = sit1.roomType || 'unknown';
			movementPattern1 = sit1.movementPattern || 'unknown';
		}
		
		// Extrair valores de sit2 (sempre comprimido como objeto)
		const x2 = sit2.playerPos ? sit2.playerPos.x : 0;
		const y2 = sit2.playerPos ? sit2.playerPos.y : 0;
		const health2 = sit2.playerHealth || 100;
		const enemyCount2 = sit2.enemyCount || 0;
		const roomType2 = sit2.roomType || 'unknown';
		const movementPattern2 = sit2.movementPattern || 'unknown';
		
		// Proximidade espacial
		const spatialDist = Math.sqrt((x1 - x2)**2 + (y1 - y2)**2);
		similarity += Math.max(0, 1 - spatialDist / 200);
		factors++;
		
		// Similaridade de saúde
		const healthDiff = Math.abs(health1 - health2);
		similarity += Math.max(0, 1 - healthDiff / 100);
		factors++;
		
		// Similaridade de contexto
		if (enemyCount1 === enemyCount2) similarity += 1;
		factors++;
		
		if (roomType1 === roomType2) similarity += 1;
		factors++;
		
		if (movementPattern1 === movementPattern2) similarity += 0.5;
		factors++;
		
		return factors > 0 ? similarity / factors : 0;
	}
	
	compressWithSimilar(newEpisode, similarEpisode) {
		// Combinar episódios similares em um meta-episódio
		const existing = similarEpisode.episode;
		existing.accessCount++;
		existing.importance = Math.max(existing.importance, newEpisode.importance);
		
		// Criar variação do episódio existente
		if (!existing.variations) existing.variations = [];
		existing.variations.push({
			situation: newEpisode.situation,
			outcome: newEpisode.outcome,
			timestamp: newEpisode.timestamp
		});
		
		// Limitar variações
		if (existing.variations.length > 10) {
			existing.variations.shift();
		}
	}
	
	extractSemanticKnowledge(episode) {
		// Extrair padrões gerais da experiência
		const pattern = this.identifyPattern(episode);
		
		if (pattern) {
			const conceptKey = pattern.type;
			
			if (!this.semanticMemory.has(conceptKey)) {
				this.semanticMemory.set(conceptKey, {
					concept: pattern.type,
					examples: [],
					strength: 0,
					successRate: 0,
					totalOccurrences: 0,
					successfulOccurrences: 0
				});
			}
			
			const concept = this.semanticMemory.get(conceptKey);
			concept.examples.push(episode.id);
			concept.totalOccurrences++;
			
			if (episode.outcome.success) {
				concept.successfulOccurrences++;
			}
			
			concept.successRate = concept.successfulOccurrences / concept.totalOccurrences;
			concept.strength = Math.min(1.0, concept.totalOccurrences / 50);
			
			// Limitar exemplos
			if (concept.examples.length > 20) {
				concept.examples.shift();
			}
		}
	}
	
	identifyPattern(episode) {
		// Identificar que tipo de padrão essa experiência representa
		const sit = episode.situation;
		const actions = episode.actions;
		
		if (sit.enemyCount > 2 && actions.dominantMovement === 'defensive') {
			return { type: 'defensive_multiple_enemies' };
		}
		
		if (sit.playerHealth < 30 && actions.shotsFired > 5) {
			return { type: 'aggressive_low_health' };
		}
		
		if (actions.movementDuration > 2000 && actions.patternComplexity > 0.7) {
			return { type: 'complex_evasion' };
		}
		
		if (sit.powerupCount > 0 && episode.outcome.score > 50) {
			return { type: 'powerup_exploitation' };
		}
		
		return null;
	}
	
	updateProceduralMemory(episode) {
		// Aprender procedimentos (se X então faça Y)
		const situation = this.categorizeSituation(episode.situation);
		const action = this.categorizeAction(episode.actions);
		const success = episode.outcome.success;
		
		const procedureKey = `${situation}_${action}`;
		
		if (!this.proceduralMemory.has(procedureKey)) {
			this.proceduralMemory.set(procedureKey, {
				situation: situation,
				action: action,
				attempts: 0,
				successes: 0,
				confidence: 0.5
			});
		}
		
		const procedure = this.proceduralMemory.get(procedureKey);
		procedure.attempts++;
		if (success) procedure.successes++;
		
		procedure.confidence = procedure.successes / procedure.attempts;
	}
	
	categorizeSituation(situation) {
		// Categorizar situação para memória procedimental
		if (situation.enemyCount === 0) return 'safe';
		if (situation.enemyCount === 1) return 'single_enemy';
		if (situation.enemyCount > 1 && situation.playerHealth > 70) return 'multiple_enemies_healthy';
		if (situation.enemyCount > 1 && situation.playerHealth <= 70) return 'multiple_enemies_damaged';
		if (situation.playerHealth < 30) return 'critical_health';
		return 'normal';
	}
	
	categorizeAction(actions) {
		// Categorizar ação dominante
		if (actions.shotsFired > 5 && actions.movementDuration < 1000) return 'aggressive';
		if (actions.movementDuration > 2000 && actions.shotsFired < 3) return 'defensive';
		if (actions.patternComplexity > 0.7) return 'evasive';
		if (actions.shotsFired > 3 && actions.movementDuration > 1000) return 'balanced';
		return 'passive';
	}
	
	manageMemorySize() {
		// Gerenciar tamanho da memória removendo episódios menos importantes
		if (this.episodicMemory.size > this.maxEpisodicMemories) {
			const episodes = Array.from(this.episodicMemory.values());
			
			// Calcular score de retenção
			episodes.forEach(ep => {
				const age = (Date.now() - ep.timestamp) / (1000 * 60 * 60); // Horas
				const recentAccess = (Date.now() - ep.lastAccessed) / (1000 * 60 * 60); // Horas
				
				ep.retentionScore = ep.importance * 0.4 + 
								  (ep.accessCount / 10) * 0.3 + 
								  Math.max(0, 1 - age / 168) * 0.2 + // Bonus por ser recente (1 semana)
								  Math.max(0, 1 - recentAccess / 24) * 0.1; // Bonus por acesso recente
			});
			
			// Ordenar por score de retenção e remover os piores
			episodes.sort((a, b) => a.retentionScore - b.retentionScore);
			const toRemove = episodes.slice(0, episodes.length - this.maxEpisodicMemories);
			
			toRemove.forEach(ep => {
				this.episodicMemory.delete(ep.id);
				this.contextIndex.removeEpisode(ep);
			});
			
			console.log(`🧠 Memory cleanup: Removed ${toRemove.length} episodes`);
		}
	}
	
	// Buscar situações similares para predição
	getSimilarSituations(currentSituation, limit = 10) {
		const similar = this.findSimilarEpisodes(currentSituation, 0.6);
		
		// Atualizar último acesso
		similar.forEach(s => {
			s.episode.accessCount++;
			s.episode.lastAccessed = Date.now();
		});
		
		return similar.slice(0, limit).map(s => s.episode);
	}
	
	// Obter conhecimento semântico sobre uma situação
	getSemanticKnowledge(situationType) {
		return this.semanticMemory.get(situationType) || null;
	}
	
	// Obter melhor procedimento para uma situação
	getBestProcedure(situation) {
		const situationType = this.categorizeSituation(situation);
		
		const procedures = Array.from(this.proceduralMemory.values())
			.filter(p => p.situation === situationType)
			.sort((a, b) => b.confidence - a.confidence);
		
		return procedures.length > 0 ? procedures[0] : null;
	}
	
	getMemoryStats() {
		return {
			episodicCount: this.episodicMemory.size,
			semanticCount: this.semanticMemory.size,
			proceduralCount: this.proceduralMemory.size,
			totalMemoryID: this.memoryIndex,
			oldestEpisode: this.episodicMemory.size > 0 ? 
				Math.min(...Array.from(this.episodicMemory.values()).map(e => e.timestamp)) : 0
		};
	}
}

// === ANÁLISE DE CONTEXTO SITUACIONAL ===
class SituationalContextAnalyzer {
	constructor() {
		this.contextFeatures = new Map();
		this.contextClusters = [];
		this.currentContext = null;
		
		console.log("🎯 SituationalContextAnalyzer initialized");
	}
	
	analyze(playerState, inputHistory) {
		const context = this.extractContextFeatures(playerState, inputHistory);
		const cluster = this.findContextCluster(context);
		
		this.currentContext = {
			features: context,
			cluster: cluster,
			timestamp: Date.now(),
			uniqueness: this.calculateUniqueness(context)
		};
		
		return this.currentContext;
	}
	
	extractContextFeatures(playerState, inputHistory) {
		return {
			// Estado do player
			healthLevel: this.categorizeHealth(playerState.health),
			position: this.categorizePosition(playerState.x, playerState.y),
			movementIntensity: this.calculateMovementIntensity(inputHistory),
			
			// Contexto temporal
			timeOfSession: this.getSessionTime(),
			recentPerformance: this.getRecentPerformance(),
			
			// Contexto espacial
			roomDensity: this.calculateRoomDensity(playerState),
			escapeRoutes: this.countEscapeRoutes(playerState),
			
			// Contexto comportamental
			aggressionLevel: this.calculateAggression(inputHistory),
			defensiveLevel: this.calculateDefensiveness(inputHistory),
			explorationLevel: this.calculateExploration(playerState)
		};
	}
	
	categorizeHealth(health) {
		if (health > 80) return 'excellent';
		if (health > 60) return 'good';
		if (health > 40) return 'fair';
		if (health > 20) return 'poor';
		return 'critical';
	}
	
	categorizePosition(x, y) {
		// Categorizar posição em relação ao centro da sala
		const centerX = 400; // Assumindo sala 800x600
		const centerY = 300;
		const distFromCenter = Math.sqrt((x - centerX)**2 + (y - centerY)**2);
		
		if (distFromCenter < 100) return 'center';
		if (distFromCenter < 200) return 'mid';
		if (x < 100 || x > 700 || y < 100 || y > 500) return 'edge';
		return 'perimeter';
	}
	
	calculateMovementIntensity(inputHistory) {
		if (inputHistory.length < 10) return 0;
		
		const recentInputs = inputHistory.slice(-10);
		const movementInputs = recentInputs.filter(input => 
			input.keys.w || input.keys.s || input.keys.a || input.keys.d
		);
		
		return movementInputs.length / recentInputs.length;
	}
	
	getSessionTime() {
		// Tempo desde o início da sessão (simplificado)
		return Math.floor(Date.now() / (1000 * 60)) % (24 * 60); // Minutos do dia
	}
	
	getRecentPerformance() {
		// Performance recente (placeholder)
		return Math.random(); // TODO: Implementar baseado em estatísticas reais
	}
	
	calculateRoomDensity(playerState) {
		// Densidade de objetos na sala
		const enemies = playerState.enemyCount || 0;
		const powerups = playerState.powerupCount || 0;
		return (enemies + powerups) / 10; // Normalizado
	}
	
	countEscapeRoutes(playerState) {
		// Número de rotas de escape disponíveis (simplificado)
		const x = playerState.x;
		const y = playerState.y;
		
		let routes = 0;
		if (x > 100) routes++; // Pode ir para esquerda
		if (x < 700) routes++; // Pode ir para direita
		if (y > 100) routes++; // Pode ir para cima
		if (y < 500) routes++; // Pode ir para baixo
		
		return routes / 4; // Normalizado
	}
	
	calculateAggression(inputHistory) {
		if (inputHistory.length < 10) return 0;
		
		const recentInputs = inputHistory.slice(-10);
		const shootInputs = recentInputs.filter(input => input.mouse.clicked);
		
		return shootInputs.length / recentInputs.length;
	}
	
	calculateDefensiveness(inputHistory) {
		// Movimentos defensivos: mudar direção frequentemente
		if (inputHistory.length < 5) return 0;
		
		let directionChanges = 0;
		for (let i = 1; i < Math.min(inputHistory.length, 10); i++) {
			const prev = inputHistory[i-1];
			const curr = inputHistory[i];
			
			const prevDir = this.getMovementDirection(prev);
			const currDir = this.getMovementDirection(curr);
			
			if (prevDir !== currDir && prevDir !== 'none' && currDir !== 'none') {
				directionChanges++;
			}
		}
		
		return directionChanges / 9; // Normalizado
	}
	
	getMovementDirection(input) {
		if (input.keys.w && !input.keys.s && !input.keys.a && !input.keys.d) return 'up';
		if (input.keys.s && !input.keys.w && !input.keys.a && !input.keys.d) return 'down';
		if (input.keys.a && !input.keys.w && !input.keys.s && !input.keys.d) return 'left';
		if (input.keys.d && !input.keys.w && !input.keys.s && !input.keys.a) return 'right';
		if (input.keys.w || input.keys.s || input.keys.a || input.keys.d) return 'diagonal';
		return 'none';
	}
	
	calculateExploration(playerState) {
		// Nível de exploração (placeholder)
		return Math.random(); // TODO: Implementar baseado em movimento real
	}
	
	findContextCluster(context) {
		// Encontrar cluster de contexto similar
		if (this.contextClusters.length === 0) {
			const newCluster = {
				id: 0,
				centroid: context,
				members: 1,
				examples: [context]
			};
			this.contextClusters.push(newCluster);
			return newCluster;
		}
		
		// Encontrar cluster mais próximo
		let bestCluster = null;
		let bestDistance = Infinity;
		
		this.contextClusters.forEach(cluster => {
			const distance = this.calculateContextDistance(context, cluster.centroid);
			if (distance < bestDistance) {
				bestDistance = distance;
				bestCluster = cluster;
			}
		});
		
		// Se muito diferente, criar novo cluster
		if (bestDistance > 0.5) {
			const newCluster = {
				id: this.contextClusters.length,
				centroid: context,
				members: 1,
				examples: [context]
			};
			this.contextClusters.push(newCluster);
			return newCluster;
		}
		
		// Adicionar ao cluster existente
		bestCluster.members++;
		bestCluster.examples.push(context);
		if (bestCluster.examples.length > 10) {
			bestCluster.examples.shift();
		}
		
		// Atualizar centroide
		this.updateClusterCentroid(bestCluster);
		
		return bestCluster;
	}
	
	calculateContextDistance(context1, context2) {
		// Distância euclidiana entre contextos
		let distance = 0;
		const features = Object.keys(context1);
		
		features.forEach(feature => {
			if (typeof context1[feature] === 'number' && typeof context2[feature] === 'number') {
				distance += (context1[feature] - context2[feature])**2;
			} else if (context1[feature] !== context2[feature]) {
				distance += 1; // Diferença categórica
			}
		});
		
		return Math.sqrt(distance / features.length);
	}
	
	updateClusterCentroid(cluster) {
		const examples = cluster.examples;
		const features = Object.keys(examples[0]);
		const newCentroid = {};
		
		features.forEach(feature => {
			if (typeof examples[0][feature] === 'number') {
				newCentroid[feature] = examples.reduce((sum, ex) => sum + ex[feature], 0) / examples.length;
			} else {
				// Para features categóricas, usar moda
				const counts = {};
				examples.forEach(ex => {
					counts[ex[feature]] = (counts[ex[feature]] || 0) + 1;
				});
				newCentroid[feature] = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
			}
		});
		
		cluster.centroid = newCentroid;
	}
	
	calculateUniqueness(context) {
		// Calcular quão único é este contexto
		const distances = this.contextClusters.map(cluster => 
			this.calculateContextDistance(context, cluster.centroid)
		);
		
		return distances.length > 0 ? Math.min(...distances) : 1.0;
	}
}

// === ÍNDICE CONTEXTUAL PARA BUSCA RÁPIDA ===
class ContextualIndex {
	constructor() {
		this.spatialIndex = new Map(); // Índice espacial
		this.temporalIndex = new Map(); // Índice temporal
		this.semanticIndex = new Map(); // Índice semântico
		
		console.log("📚 ContextualIndex initialized");
	}
	
	addEpisode(episode) {
		// Adicionar aos índices
		this.addToSpatialIndex(episode);
		this.addToTemporalIndex(episode);
		this.addToSemanticIndex(episode);
	}
	
	addToSpatialIndex(episode) {
		const pos = episode.situation.playerPos;
		const key = `${Math.floor(pos.x / 50)}_${Math.floor(pos.y / 50)}`;
		
		if (!this.spatialIndex.has(key)) {
			this.spatialIndex.set(key, []);
		}
		this.spatialIndex.get(key).push(episode.id);
	}
	
	addToTemporalIndex(episode) {
		const timeKey = Math.floor(episode.timestamp / (1000 * 60 * 60)); // Por hora
		
		if (!this.temporalIndex.has(timeKey)) {
			this.temporalIndex.set(timeKey, []);
		}
		this.temporalIndex.get(timeKey).push(episode.id);
	}
	
	addToSemanticIndex(episode) {
		const situation = episode.situation;
		const semanticKeys = [
			`health_${situation.playerHealth}`,
			`enemies_${situation.enemyCount}`,
			`pattern_${situation.movementPattern}`
		];
		
		semanticKeys.forEach(key => {
			if (!this.semanticIndex.has(key)) {
				this.semanticIndex.set(key, []);
			}
			this.semanticIndex.get(key).push(episode.id);
		});
	}
	
	removeEpisode(episode) {
		// Remover dos índices (implementação simplificada)
		// Em uma implementação real, seria necessário remover especificamente
		console.log(`📚 Removed episode ${episode.id} from indices`);
	}
}

// === SISTEMA DE MEMÓRIA EPISÓDICA ===
class EpisodicMemorySystem {
	constructor() {
		this.episodes = new Map();
		this.narrativeChains = []; // Sequências de episódios relacionados
		this.emotionalTags = new Map(); // Tags emocionais para episódios
		
		console.log("📝 EpisodicMemorySystem initialized");
	}
	
	recordEpisode(events, emotions, importance) {
		const episode = {
			id: Date.now() + Math.random(),
			events: events,
			emotions: emotions,
			importance: importance,
			timestamp: Date.now(),
			connections: [] // Conexões com outros episódios
		};
		
		this.episodes.set(episode.id, episode);
		this.emotionalTags.set(episode.id, emotions);
		
		// Conectar com episódios relacionados
		this.findEpisodicConnections(episode);
		
		return episode.id;
	}
	
	findEpisodicConnections(episode) {
		// Encontrar episódios relacionados temporalmente ou semanticamente
		const recentEpisodes = Array.from(this.episodes.values())
			.filter(ep => ep.timestamp > episode.timestamp - 60000) // Últimos 60 segundos
			.slice(-5); // Máximo 5 episódios
		
		recentEpisodes.forEach(relatedEp => {
			episode.connections.push(relatedEp.id);
			relatedEp.connections.push(episode.id);
		});
	}
	
	recallSimilarEpisodes(currentSituation, emotionalState) {
		// Buscar episódios similares baseado em situação e estado emocional
		const candidates = Array.from(this.episodes.values());
		
		const scored = candidates.map(episode => ({
			episode: episode,
			similarity: this.calculateEpisodicSimilarity(episode, currentSituation, emotionalState)
		}));
		
		return scored
			.filter(s => s.similarity > 0.3)
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, 10)
			.map(s => s.episode);
	}
	
	calculateEpisodicSimilarity(episode, situation, emotions) {
		// Calcular similaridade baseada em múltiplos fatores
		let similarity = 0;
		
		// Similaridade emocional
		const episodeEmotions = this.emotionalTags.get(episode.id) || {};
		const emotionalSim = this.calculateEmotionalSimilarity(episodeEmotions, emotions);
		similarity += emotionalSim * 0.4;
		
		// Similaridade situacional (placeholder)
		similarity += 0.3; // TODO: Implementar similaridade situacional real
		
		// Importância do episódio
		similarity += episode.importance * 0.3;
		
		return similarity;
	}
	
	calculateEmotionalSimilarity(emotions1, emotions2) {
		const keys = new Set([...Object.keys(emotions1), ...Object.keys(emotions2)]);
		let similarity = 0;
		
		keys.forEach(key => {
			const val1 = emotions1[key] || 0;
			const val2 = emotions2[key] || 0;
			similarity += 1 - Math.abs(val1 - val2);
		});
		
		return keys.size > 0 ? similarity / keys.size : 0;
	}
}

export { LongTermMemorySystem, SituationalContextAnalyzer, EpisodicMemorySystem };