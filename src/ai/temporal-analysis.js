// ============================================================================
// ANÁLISE TEMPORAL ULTRA AVANÇADA E SISTEMAS DE APOIO
// ============================================================================

// === ANÁLISE TEMPORAL EM MÚLTIPLAS ESCALAS ===
class MultiscaleTemporalAnalyzer {
	constructor() {
		this.microHistory = []; // 1-5 frames
		this.mediumHistory = []; // 10-50 frames
		this.macroHistory = []; // 100+ frames
		this.cycleDetector = new CyclicPatternDetector();
		this.trendAnalyzer = new TrendAnalyzer();
		
		console.log("⏱️ MultiscaleTemporalAnalyzer initialized");
	}
	
	analyze(movementHistory) {
		// Micro análise (movimentos imediatos)
		const microFeatures = this.analyzeMicroMovements(movementHistory.slice(-5));
		
		// Análise média (padrões de curto prazo)
		const mediumFeatures = this.analyzeMediumPatterns(movementHistory.slice(-50));
		
		// Análise macro (tendências de longo prazo)
		const macroFeatures = this.analyzeMacroTrends(movementHistory.slice(-200));
		
		return {
			micro: microFeatures,
			medium: mediumFeatures,
			macro: macroFeatures,
			cycles: this.cycleDetector.detect(movementHistory),
			trends: this.trendAnalyzer.analyze(movementHistory)
		};
	}
	
	analyzeMicroMovements(recentMoves) {
		if (recentMoves.length < 2) return { velocity: 0, acceleration: 0, jerk: 0 };
		
		// Calcular velocidades instantâneas
		const velocities = [];
		for (let i = 1; i < recentMoves.length; i++) {
			const dx = recentMoves[i].x - recentMoves[i-1].x;
			const dy = recentMoves[i].y - recentMoves[i-1].y;
			const dt = (recentMoves[i].timestamp - recentMoves[i-1].timestamp) || 16;
			velocities.push(Math.sqrt(dx*dx + dy*dy) / dt * 1000);
		}
		
		// Calcular acelerações
		const accelerations = [];
		for (let i = 1; i < velocities.length; i++) {
			accelerations.push(velocities[i] - velocities[i-1]);
		}
		
		// Calcular jerk (mudança da aceleração)
		const jerks = [];
		for (let i = 1; i < accelerations.length; i++) {
			jerks.push(accelerations[i] - accelerations[i-1]);
		}
		
		return {
			velocity: velocities.length > 0 ? velocities[velocities.length-1] : 0,
			acceleration: accelerations.length > 0 ? accelerations[accelerations.length-1] : 0,
			jerk: jerks.length > 0 ? jerks[jerks.length-1] : 0,
			smoothness: this.calculateSmoothness(velocities),
			predictability: this.calculatePredictability(recentMoves)
		};
	}
	
	analyzeMediumPatterns(mediumMoves) {
		if (mediumMoves.length < 10) return { pattern: 'insufficient_data', strength: 0 };
		
		// Detectar padrões geométricos
		const geometricPattern = this.detectGeometricPattern(mediumMoves);
		const repetitivePattern = this.detectRepetitivePattern(mediumMoves);
		const directionPattern = this.analyzeDirectionChanges(mediumMoves);
		
		return {
			geometric: geometricPattern,
			repetitive: repetitivePattern,
			direction: directionPattern,
			entropy: this.calculateMovementEntropy(mediumMoves),
			complexity: this.calculateComplexity(mediumMoves)
		};
	}
	
	analyzeMacroTrends(macroMoves) {
		if (macroMoves.length < 50) return { trend: 'insufficient_data' };
		
		// Análise de tendências de longo prazo
		const spatialTrend = this.analyzeSpatialTrend(macroMoves);
		const temporalTrend = this.analyzeTemporalTrend(macroMoves);
		const behavioralTrend = this.analyzeBehavioralTrend(macroMoves);
		
		return {
			spatial: spatialTrend,
			temporal: temporalTrend,
			behavioral: behavioralTrend,
			stability: this.calculateStability(macroMoves),
			evolution: this.analyzeEvolution(macroMoves)
		};
	}
	
	calculateSmoothness(velocities) {
		if (velocities.length < 2) return 1;
		const variations = velocities.slice(1).map((v, i) => Math.abs(v - velocities[i]));
		const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
		return Math.max(0, 1 - avgVariation / 100);
	}
	
	calculatePredictability(moves) {
		if (moves.length < 3) return 0.5;
		// Calcular quão bem um modelo linear se ajusta
		const predictions = [];
		for (let i = 2; i < moves.length; i++) {
			const dx1 = moves[i-1].x - moves[i-2].x;
			const dy1 = moves[i-1].y - moves[i-2].y;
			const predictedX = moves[i-1].x + dx1;
			const predictedY = moves[i-1].y + dy1;
			const actualX = moves[i].x;
			const actualY = moves[i].y;
			const error = Math.sqrt((predictedX - actualX)**2 + (predictedY - actualY)**2);
			predictions.push(error);
		}
		const avgError = predictions.reduce((a, b) => a + b, 0) / predictions.length;
		return Math.max(0, Math.min(1, 1 - avgError / 200));
	}
	
	detectGeometricPattern(moves) {
		// Detectar círculos, linhas, espirais, etc.
		const circleScore = this.calculateCircularity(moves);
		const lineScore = this.calculateLinearity(moves);
		const spiralScore = this.calculateSpirality(moves);
		
		const scores = { circle: circleScore, line: lineScore, spiral: spiralScore };
		const bestPattern = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
		
		return {
			pattern: bestPattern,
			strength: scores[bestPattern],
			allScores: scores
		};
	}
	
	calculateCircularity(moves) {
		if (moves.length < 10) return 0;
		
		// Calcular centro médio
		const centerX = moves.reduce((sum, m) => sum + m.x, 0) / moves.length;
		const centerY = moves.reduce((sum, m) => sum + m.y, 0) / moves.length;
		
		// Calcular raios
		const radii = moves.map(m => Math.sqrt((m.x - centerX)**2 + (m.y - centerY)**2));
		const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;
		
		// Calcular variação dos raios (quanto menor, mais circular)
		const radiusVariation = radii.reduce((sum, r) => sum + Math.abs(r - avgRadius), 0) / radii.length;
		
		return Math.max(0, 1 - radiusVariation / avgRadius);
	}
	
	calculateLinearity(moves) {
		if (moves.length < 3) return 0;
		
		// Regressão linear simples
		const n = moves.length;
		const sumX = moves.reduce((sum, m) => sum + m.x, 0);
		const sumY = moves.reduce((sum, m) => sum + m.y, 0);
		const sumXY = moves.reduce((sum, m, i) => sum + m.x * i, 0);
		const sumXX = moves.reduce((sum, m, i) => sum + i * i, 0);
		const sumIndices = moves.reduce((sum, m, i) => sum + i, 0);
		
		const slope = (n * sumXY - sumIndices * sumX) / (n * sumXX - sumIndices * sumIndices);
		const intercept = (sumX - slope * sumIndices) / n;
		
		// Calcular R²
		const totalVariation = moves.reduce((sum, m) => sum + (m.x - sumX/n)**2, 0);
		const explainedVariation = moves.reduce((sum, m, i) => {
			const predicted = slope * i + intercept;
			return sum + (predicted - sumX/n)**2;
		}, 0);
		
		return totalVariation > 0 ? explainedVariation / totalVariation : 0;
	}
	
	calculateSpirality(moves) {
		if (moves.length < 20) return 0;
		
		// Converter para coordenadas polares relativas ao centro
		const centerX = moves.reduce((sum, m) => sum + m.x, 0) / moves.length;
		const centerY = moves.reduce((sum, m) => sum + m.y, 0) / moves.length;
		
		const polarMoves = moves.map(m => {
			const dx = m.x - centerX;
			const dy = m.y - centerY;
			const r = Math.sqrt(dx*dx + dy*dy);
			const theta = Math.atan2(dy, dx);
			return { r, theta };
		});
		
		// Verificar se o raio aumenta/diminui consistentemente com o ângulo
		let spiralScore = 0;
		for (let i = 1; i < polarMoves.length; i++) {
			const deltaTheta = polarMoves[i].theta - polarMoves[i-1].theta;
			const deltaR = polarMoves[i].r - polarMoves[i-1].r;
			
			// Espiral se raio muda consistentemente com ângulo
			if (Math.abs(deltaTheta) > 0.1 && Math.abs(deltaR) > 1) {
				spiralScore += 1;
			}
		}
		
		return spiralScore / (polarMoves.length - 1);
	}
	
	calculateMovementEntropy(moves) {
		if (moves.length < 10) return 0;
		
		// Discretizar movimento em direções
		const directions = [];
		for (let i = 1; i < moves.length; i++) {
			const dx = moves[i].x - moves[i-1].x;
			const dy = moves[i].y - moves[i-1].y;
			const angle = Math.atan2(dy, dx);
			const discreteAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4); // 8 direções
			directions.push(discreteAngle);
		}
		
		// Calcular frequências
		const freq = {};
		directions.forEach(d => freq[d] = (freq[d] || 0) + 1);
		
		// Calcular entropia
		const total = directions.length;
		let entropy = 0;
		Object.values(freq).forEach(f => {
			const p = f / total;
			entropy -= p * Math.log2(p);
		});
		
		return entropy / 3; // Normalizado
	}
	
	calculateComplexity(moves) {
		// Complexidade baseada em mudanças de direção e velocidade
		if (moves.length < 3) return 0;
		
		let directionChanges = 0;
		let velocityChanges = 0;
		
		for (let i = 2; i < moves.length; i++) {
			// Mudança de direção
			const v1x = moves[i-1].x - moves[i-2].x;
			const v1y = moves[i-1].y - moves[i-2].y;
			const v2x = moves[i].x - moves[i-1].x;
			const v2y = moves[i].y - moves[i-1].y;
			
			const angle1 = Math.atan2(v1y, v1x);
			const angle2 = Math.atan2(v2y, v2x);
			const angleDiff = Math.abs(angle2 - angle1);
			
			if (angleDiff > Math.PI / 6) directionChanges++; // > 30 graus
			
			// Mudança de velocidade
			const speed1 = Math.sqrt(v1x*v1x + v1y*v1y);
			const speed2 = Math.sqrt(v2x*v2x + v2y*v2y);
			
			if (Math.abs(speed2 - speed1) > 5) velocityChanges++;
		}
		
		return (directionChanges + velocityChanges) / (moves.length - 2);
	}
	
	analyzeSpatialTrend(moves) {
		// Tendência espacial (para onde o player está se movendo ao longo do tempo)
		const segments = this.divideIntoSegments(moves, 10);
		const centroids = segments.map(segment => ({
			x: segment.reduce((sum, m) => sum + m.x, 0) / segment.length,
			y: segment.reduce((sum, m) => sum + m.y, 0) / segment.length
		}));
		
		// Calcular direção geral
		if (centroids.length < 2) return { direction: 'stationary', strength: 0 };
		
		const startX = centroids[0].x;
		const startY = centroids[0].y;
		const endX = centroids[centroids.length-1].x;
		const endY = centroids[centroids.length-1].y;
		
		const direction = Math.atan2(endY - startY, endX - startX);
		const distance = Math.sqrt((endX - startX)**2 + (endY - startY)**2);
		
		return {
			direction: direction,
			strength: Math.min(1, distance / 500),
			displacement: distance,
			centroids: centroids
		};
	}
	
	divideIntoSegments(array, numSegments) {
		const segmentSize = Math.floor(array.length / numSegments);
		const segments = [];
		for (let i = 0; i < numSegments; i++) {
			const start = i * segmentSize;
			const end = i === numSegments - 1 ? array.length : (i + 1) * segmentSize;
			segments.push(array.slice(start, end));
		}
		return segments.filter(seg => seg.length > 0);
	}
}

// === DETECTOR DE PADRÕES CÍCLICOS ===
class CyclicPatternDetector {
	constructor() {
		this.detectedCycles = [];
		console.log("🔄 CyclicPatternDetector initialized");
	}
	
	detect(movementHistory) {
		if (movementHistory.length < 20) return { cycles: [], confidence: 0 };
		
		// Analisar em diferentes escalas temporais
		const shortCycles = this.detectCyclesAtScale(movementHistory, 5, 15);
		const mediumCycles = this.detectCyclesAtScale(movementHistory, 10, 30);
		const longCycles = this.detectCyclesAtScale(movementHistory, 20, 60);
		
		const allCycles = [...shortCycles, ...mediumCycles, ...longCycles];
		const confidence = allCycles.length > 0 ? allCycles.reduce((sum, c) => sum + c.strength, 0) / allCycles.length : 0;
		
		return {
			cycles: allCycles,
			confidence: confidence,
			dominant: allCycles.length > 0 ? allCycles.reduce((best, current) => 
				current.strength > best.strength ? current : best
			) : null
		};
	}
	
	detectCyclesAtScale(history, minPeriod, maxPeriod) {
		const cycles = [];
		
		for (let period = minPeriod; period <= maxPeriod && period < history.length / 3; period++) {
			const correlation = this.calculateAutocorrelation(history, period);
			
			if (correlation > 0.7) { // Alta correlação indica ciclo
				cycles.push({
					period: period,
					strength: correlation,
					type: 'temporal',
					scale: period < 10 ? 'short' : period < 25 ? 'medium' : 'long'
				});
			}
		}
		
		return cycles;
	}
	
	calculateAutocorrelation(history, lag) {
		if (history.length < lag * 2) return 0;
		
		// Converter posições para séries temporais
		const xSeries = history.map(h => h.x);
		const ySeries = history.map(h => h.y);
		
		const xCorr = this.autocorrelation(xSeries, lag);
		const yCorr = this.autocorrelation(ySeries, lag);
		
		return (xCorr + yCorr) / 2;
	}
	
	autocorrelation(series, lag) {
		const n = series.length - lag;
		if (n <= 0) return 0;
		
		const mean = series.reduce((a, b) => a + b, 0) / series.length;
		
		let numerator = 0;
		let denominator = 0;
		
		for (let i = 0; i < n; i++) {
			numerator += (series[i] - mean) * (series[i + lag] - mean);
		}
		
		for (let i = 0; i < series.length; i++) {
			denominator += (series[i] - mean) ** 2;
		}
		
		return denominator === 0 ? 0 : numerator / denominator;
	}
}

// === ANÁLISE DE FOURIER PARA FREQUÊNCIAS ===
class FourierTemporalAnalyzer {
	constructor() {
		console.log("📊 FourierTemporalAnalyzer initialized");
	}
	
	analyze(movementHistory) {
		if (movementHistory.length < 16) return { frequencies: [], dominantFreq: 0 };
		
		// Preparar dados para FFT
		const xSeries = movementHistory.map(m => m.x);
		const ySeries = movementHistory.map(m => m.y);
		
		// FFT simples (apenas componentes principais)
		const xFreqs = this.simpleDFT(xSeries);
		const yFreqs = this.simpleDFT(ySeries);
		
		// Combinar frequências
		const combinedFreqs = xFreqs.map((xf, i) => ({
			frequency: i / movementHistory.length,
			magnitude: Math.sqrt(xf.magnitude**2 + yFreqs[i].magnitude**2),
			phase: Math.atan2(yFreqs[i].phase, xf.phase)
		}));
		
		// Encontrar frequência dominante
		const dominantFreq = combinedFreqs.reduce((max, freq) => 
			freq.magnitude > max.magnitude ? freq : max
		);
		
		return {
			frequencies: combinedFreqs.slice(0, 8), // Apenas primeiras 8 frequências
			dominantFreq: dominantFreq,
			periodicityStrength: dominantFreq.magnitude / combinedFreqs[0].magnitude
		};
	}
	
	simpleDFT(series) {
		const N = series.length;
		const frequencies = [];
		
		// Calcular apenas as primeiras 8 frequências para performance
		for (let k = 0; k < Math.min(8, N); k++) {
			let realSum = 0;
			let imagSum = 0;
			
			for (let n = 0; n < N; n++) {
				const angle = -2 * Math.PI * k * n / N;
				realSum += series[n] * Math.cos(angle);
				imagSum += series[n] * Math.sin(angle);
			}
			
			frequencies.push({
				magnitude: Math.sqrt(realSum**2 + imagSum**2) / N,
				phase: Math.atan2(imagSum, realSum)
			});
		}
		
		return frequencies;
	}
}

// === ANALISADOR DE TENDÊNCIAS ===
class TrendAnalyzer {
	constructor() {
		console.log("📈 TrendAnalyzer initialized");
	}
	
	analyze(movementHistory) {
		if (movementHistory.length < 10) return { trend: 'insufficient_data' };
		
		const velocityTrend = this.analyzeVelocityTrend(movementHistory);
		const directionTrend = this.analyzeDirectionTrend(movementHistory);
		const accelerationTrend = this.analyzeAccelerationTrend(movementHistory);
		
		return {
			velocity: velocityTrend,
			direction: directionTrend,
			acceleration: accelerationTrend,
			overall: this.combineTraends(velocityTrend, directionTrend, accelerationTrend)
		};
	}
	
	analyzeVelocityTrend(history) {
		const velocities = [];
		for (let i = 1; i < history.length; i++) {
			const dx = history[i].x - history[i-1].x;
			const dy = history[i].y - history[i-1].y;
			const dt = (history[i].timestamp - history[i-1].timestamp) || 16;
			velocities.push(Math.sqrt(dx*dx + dy*dy) / dt * 1000);
		}
		
		const trend = this.calculateLinearTrend(velocities);
		return {
			slope: trend.slope,
			direction: trend.slope > 0.1 ? 'accelerating' : trend.slope < -0.1 ? 'decelerating' : 'stable',
			strength: Math.abs(trend.slope),
			confidence: trend.rSquared
		};
	}
	
	analyzeDirectionTrend(history) {
		const directions = [];
		for (let i = 1; i < history.length; i++) {
			const dx = history[i].x - history[i-1].x;
			const dy = history[i].y - history[i-1].y;
			directions.push(Math.atan2(dy, dx));
		}
		
		// Analisar mudanças de direção
		const directionChanges = [];
		for (let i = 1; i < directions.length; i++) {
			let change = directions[i] - directions[i-1];
			// Normalizar para [-π, π]
			while (change > Math.PI) change -= 2 * Math.PI;
			while (change < -Math.PI) change += 2 * Math.PI;
			directionChanges.push(change);
		}
		
		const avgChange = directionChanges.reduce((a, b) => a + b, 0) / directionChanges.length;
		const consistency = 1 - (directionChanges.reduce((sum, change) => sum + Math.abs(change), 0) / directionChanges.length / Math.PI);
		
		return {
			averageChange: avgChange,
			consistency: consistency,
			pattern: Math.abs(avgChange) < 0.1 ? 'straight' : avgChange > 0 ? 'turning_left' : 'turning_right',
			predictability: consistency
		};
	}
	
	analyzeAccelerationTrend(history) {
		if (history.length < 3) return { trend: 'insufficient_data' };
		
		const accelerations = [];
		for (let i = 2; i < history.length; i++) {
			const v1x = history[i-1].x - history[i-2].x;
			const v1y = history[i-1].y - history[i-2].y;
			const v2x = history[i].x - history[i-1].x;
			const v2y = history[i].y - history[i-1].y;
			
			const a = Math.sqrt((v2x - v1x)**2 + (v2y - v1y)**2);
			accelerations.push(a);
		}
		
		const trend = this.calculateLinearTrend(accelerations);
		return {
			slope: trend.slope,
			pattern: trend.slope > 0.1 ? 'increasing' : trend.slope < -0.1 ? 'decreasing' : 'stable',
			smoothness: 1 - (accelerations.reduce((sum, a, i, arr) => 
				i > 0 ? sum + Math.abs(a - arr[i-1]) : sum, 0) / (accelerations.length - 1) / 100)
		};
	}
	
	calculateLinearTrend(data) {
		const n = data.length;
		const sumX = n * (n - 1) / 2; // 0 + 1 + 2 + ... + (n-1)
		const sumY = data.reduce((a, b) => a + b, 0);
		const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
		const sumXX = n * (n - 1) * (2 * n - 1) / 6; // 0² + 1² + 2² + ... + (n-1)²
		
		const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
		const intercept = (sumY - slope * sumX) / n;
		
		// Calcular R²
		const yMean = sumY / n;
		const ssTotal = data.reduce((sum, y) => sum + (y - yMean)**2, 0);
		const ssRes = data.reduce((sum, y, x) => {
			const predicted = slope * x + intercept;
			return sum + (y - predicted)**2;
		}, 0);
		
		const rSquared = ssTotal > 0 ? 1 - (ssRes / ssTotal) : 0;
		
		return { slope, intercept, rSquared };
	}
	
	combineTraends(velocity, direction, acceleration) {
		const predictability = (velocity.confidence + direction.predictability + acceleration.smoothness) / 3;
		
		let pattern = 'complex';
		if (velocity.direction === 'stable' && direction.pattern === 'straight' && acceleration.pattern === 'stable') {
			pattern = 'linear';
		} else if (direction.pattern !== 'straight' && velocity.direction === 'stable') {
			pattern = 'curved';
		} else if (velocity.direction === 'accelerating' && direction.pattern === 'straight') {
			pattern = 'accelerating_linear';
		}
		
		return {
			pattern: pattern,
			predictability: predictability,
			stability: (velocity.confidence + direction.consistency + acceleration.smoothness) / 3
		};
	}
}

export { MultiscaleTemporalAnalyzer, CyclicPatternDetector, FourierTemporalAnalyzer, TrendAnalyzer };