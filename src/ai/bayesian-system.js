// ============================================================================
// SISTEMA BAYESIANO E PROBABILÍSTICO ULTRA AVANÇADO
// ============================================================================

// === MOTOR DE INFERÊNCIA BAYESIANA ===
class BayesianInferenceEngine {
	constructor() {
		this.priorDistributions = new Map();
		this.likelihoodFunctions = new Map();
		this.posteriorDistributions = new Map();
		this.evidenceCache = new Map();
		
		// Hyperparâmetros Bayesianos
		this.hyperparams = {
			alpha: 1.0, // Parâmetro de concentração Dirichlet
			beta: 1.0,  // Parâmetro de precisão
			gamma: 0.95, // Fator de esquecimento
			sigma: 0.1   // Ruído do modelo
		};
		
		this.confidence = 0;
		this.uncertaintyQuantification = new UncertaintyQuantificationSystem();
		
		console.log("🎲 BayesianInferenceEngine initialized - PROBABILISTIC PRECISION");
	}
	
	// Inferência Bayesiana principal
	infer(features, similarSituations) {
		const startTime = performance.now();
		
		// Calcular distribuições prior
		const priors = this.calculatePriors(features, similarSituations);
		
		// Calcular likelihood
		const likelihood = this.calculateLikelihood(features, similarSituations);
		
		// Calcular evidência (normalização)
		const evidence = this.calculateEvidence(features, priors, likelihood);
		
		// Inferência Bayesiana: P(θ|data) = P(data|θ) * P(θ) / P(data)
		const posterior = this.calculatePosterior(priors, likelihood, evidence);
		
		// Predição point estimate (MAP - Maximum A Posteriori)
		const prediction = this.mapEstimate(posterior);
		
		// Quantificação de incerteza
		const uncertainty = this.uncertaintyQuantification.quantify(posterior, prediction);
		
		// Confidence baseada na concentração da distribuição
		this.confidence = this.calculateBayesianConfidence(posterior, uncertainty);
		
		const processingTime = performance.now() - startTime;
		
		console.log(`🎲 Bayesian Inference complete: Confidence ${this.confidence.toFixed(3)}, Uncertainty: ${uncertainty.toFixed(3)}, Time: ${processingTime.toFixed(2)}ms`);
		
		return {
			prediction: prediction,
			confidence: this.confidence,
			uncertainty: uncertainty,
			posterior: posterior,
			metadata: {
				priors: priors,
				likelihood: likelihood,
				evidence: evidence,
				processingTime: processingTime
			}
		};
	}
	
	calculatePriors(features, similarSituations) {
		// Construir distribuições prior baseadas em experiências passadas
		const priors = {
			position: this.calculatePositionPrior(similarSituations),
			velocity: this.calculateVelocityPrior(similarSituations),
			direction: this.calculateDirectionPrior(similarSituations),
			pattern: this.calculatePatternPrior(similarSituations)
		};
		
		// Atualizar priors com hyperparâmetros
		Object.keys(priors).forEach(key => {
			priors[key] = this.updatePriorWithHyperparams(priors[key], key);
		});
		
		return priors;
	}
	
	calculatePositionPrior(situations) {
		if (situations.length === 0) {
			// Prior não-informativo (uniforme)
			return {
				type: 'gaussian',
				mean: { x: 400, y: 300 }, // Centro da tela
				covariance: [[10000, 0], [0, 10000]], // Alta variância
				confidence: 0.1
			};
		}
		
		// Calcular média e covariância das posições passadas
		const positions = situations.map(s => ({ x: s.situation.playerPos.x, y: s.situation.playerPos.y }));
		const mean = {
			x: positions.reduce((sum, p) => sum + p.x, 0) / positions.length,
			y: positions.reduce((sum, p) => sum + p.y, 0) / positions.length
		};
		
		// Calcular matriz de covariância
		const covariance = this.calculateCovariance(positions, mean);
		
		return {
			type: 'gaussian',
			mean: mean,
			covariance: covariance,
			confidence: Math.min(1.0, situations.length / 50)
		};
	}
	
	calculateVelocityPrior(situations) {
		if (situations.length === 0) {
			return {
				type: 'gamma',
				shape: 2.0,
				rate: 0.5,
				confidence: 0.1
			};
		}
		
		// Estimar velocidades das situações passadas
		const velocities = situations.map(s => s.outcome?.velocity || 5).filter(v => v > 0);
		
		// Ajustar distribuição Gamma
		const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
		const variance = velocities.reduce((sum, v) => sum + (v - mean)**2, 0) / velocities.length;
		
		const shape = mean**2 / variance;
		const rate = mean / variance;
		
		return {
			type: 'gamma',
			shape: Math.max(0.1, shape),
			rate: Math.max(0.1, rate),
			confidence: Math.min(1.0, velocities.length / 30)
		};
	}
	
	calculateDirectionPrior(situations) {
		if (situations.length === 0) {
			return {
				type: 'von_mises',
				mu: 0, // Direção média
				kappa: 0.1, // Concentração baixa
				confidence: 0.1
			};
		}
		
		// Analisar direções das situações passadas
		const directions = situations.map(s => {
			const outcome = s.outcome || {};
			return Math.atan2(outcome.velocityY || 0, outcome.velocityX || 1);
		});
		
		// Calcular parâmetros da distribuição von Mises (circular)
		const { mu, kappa } = this.fitVonMises(directions);
		
		return {
			type: 'von_mises',
			mu: mu,
			kappa: kappa,
			confidence: Math.min(1.0, directions.length / 20)
		};
	}
	
	calculatePatternPrior(situations) {
		if (situations.length === 0) {
			// Prior uniforme sobre padrões
			const patterns = ['linear', 'circular', 'zigzag', 'random', 'spiral'];
			const prob = 1.0 / patterns.length;
			const probabilities = {};
			patterns.forEach(p => probabilities[p] = prob);
			
			return {
				type: 'categorical',
				probabilities: probabilities,
				confidence: 0.1
			};
		}
		
		// Contar ocorrências de padrões
		const patternCounts = {};
		situations.forEach(s => {
			const pattern = s.situation.movementPattern || 'random';
			patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
		});
		
		// Normalizar para probabilidades
		const total = situations.length;
		const probabilities = {};
		Object.keys(patternCounts).forEach(pattern => {
			probabilities[pattern] = patternCounts[pattern] / total;
		});
		
		return {
			type: 'categorical',
			probabilities: probabilities,
			confidence: Math.min(1.0, total / 40)
		};
	}
	
	calculateCovariance(positions, mean) {
		const n = positions.length;
		if (n < 2) return [[100, 0], [0, 100]];
		
		let covXX = 0, covXY = 0, covYY = 0;
		
		positions.forEach(pos => {
			const dx = pos.x - mean.x;
			const dy = pos.y - mean.y;
			covXX += dx * dx;
			covXY += dx * dy;
			covYY += dy * dy;
		});
		
		return [
			[covXX / (n - 1), covXY / (n - 1)],
			[covXY / (n - 1), covYY / (n - 1)]
		];
	}
	
	fitVonMises(directions) {
		if (directions.length === 0) return { mu: 0, kappa: 0.1 };
		
		// Calcular média circular
		const sinSum = directions.reduce((sum, d) => sum + Math.sin(d), 0);
		const cosSum = directions.reduce((sum, d) => sum + Math.cos(d), 0);
		
		const mu = Math.atan2(sinSum, cosSum);
		const R = Math.sqrt(sinSum**2 + cosSum**2) / directions.length;
		
		// Estimar kappa (concentração)
		let kappa;
		if (R < 0.53) {
			kappa = 2 * R + R**3 + (5 * R**5) / 6;
		} else if (R < 0.85) {
			kappa = -0.4 + 1.39 * R + 0.43 / (1 - R);
		} else {
			kappa = 1 / (3 * R - 4 * R**2 + R**3);
		}
		
		return { mu, kappa: Math.max(0.1, kappa) };
	}
	
	calculateLikelihood(features, situations) {
		// P(data|θ) - probabilidade dos dados dado os parâmetros
		const likelihood = {
			position: this.positionLikelihood(features, situations),
			velocity: this.velocityLikelihood(features, situations),
			direction: this.directionLikelihood(features, situations),
			pattern: this.patternLikelihood(features, situations)
		};
		
		// Likelihood composta
		const compositeLikelihood = Object.values(likelihood).reduce((prod, l) => prod * l, 1);
		
		return {
			individual: likelihood,
			composite: compositeLikelihood
		};
	}
	
	positionLikelihood(features, situations) {
		// Likelihood baseada na distribuição de posições observadas
		if (situations.length === 0) return 0.5;
		
		const currentPos = { x: features[0] * 800 || 400, y: features[1] * 600 || 300 };
		const positions = situations.map(s => s.situation.playerPos);
		
		// Calcular densidade kernel Gaussiana
		let density = 0;
		const bandwidth = 50; // Largura de banda
		
		positions.forEach(pos => {
			const distance = Math.sqrt((currentPos.x - pos.x)**2 + (currentPos.y - pos.y)**2);
			density += Math.exp(-1 * (distance**2) / (2 * bandwidth**2));
		});
		
		return density / (positions.length * Math.sqrt(2 * Math.PI) * bandwidth);
	}
	
	velocityLikelihood(features, situations) {
		// Likelihood baseada em velocidades observadas
		if (situations.length === 0) return 0.5;
		
		const velocities = situations.map(s => s.outcome?.velocity || 5);
		const currentVel = Math.sqrt((features[2] || 0)**2 + (features[3] || 0)**2) * 10;
		
		// Densidade kernel
		let density = 0;
		const bandwidth = 2;
		
		velocities.forEach(vel => {
			const diff = currentVel - vel;
			density += Math.exp(-1 * (diff**2) / (2 * bandwidth**2));
		});
		
		return density / (velocities.length * Math.sqrt(2 * Math.PI) * bandwidth);
	}
	
	directionLikelihood(features, situations) {
		// Likelihood para direção de movimento
		if (situations.length === 0) return 0.5;
		
		const currentDir = Math.atan2(features[3] || 0, features[2] || 1);
		const directions = situations.map(s => {
			const outcome = s.outcome || {};
			return Math.atan2(outcome.velocityY || 0, outcome.velocityX || 1);
		});
		
		// Densidade kernel circular
		let density = 0;
		const kappa = 2; // Concentração
		
		directions.forEach(dir => {
			density += Math.exp(kappa * Math.cos(currentDir - dir));
		});
		
		return density / (directions.length * 2 * Math.PI * this.besselI0(kappa));
	}
	
	patternLikelihood(features, situations) {
		// Likelihood para padrões de movimento
		if (situations.length === 0) return 0.5;
		
		// Simplificado - baseado na frequência de padrões similares
		const patternCounts = {};
		situations.forEach(s => {
			const pattern = s.situation.movementPattern || 'random';
			patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
		});
		
		const currentPattern = this.classifyCurrentPattern(features);
		const count = patternCounts[currentPattern] || 1;
		
		return count / situations.length;
	}
	
	besselI0(x) {
		// Aproximação da função Bessel modificada I0
		let sum = 1;
		let term = 1;
		const x2 = x * x / 4;
		
		for (let i = 1; i <= 50; i++) {
			term *= x2 / (i * i);
			sum += term;
			if (term < 1e-15) break;
		}
		
		return sum;
	}
	
	classifyCurrentPattern(features) {
		// Classificar padrão atual baseado nas features
		const vel = Math.sqrt((features[2] || 0)**2 + (features[3] || 0)**2);
		const complexity = this.calculateFeatureComplexity(features);
		
		if (vel < 0.1) return 'static';
		if (complexity < 0.3) return 'linear';
		if (complexity > 0.7) return 'complex';
		return 'moderate';
	}
	
	calculateFeatureComplexity(features) {
		// Calcular complexidade das features
		let complexity = 0;
		for (let i = 1; i < features.length; i++) {
			complexity += Math.abs(features[i] - features[i-1]);
		}
		return Math.min(1, complexity / features.length);
	}
	
	calculateEvidence(features, priors, likelihood) {
		// P(data) - evidência marginal
		// Aproximação usando importância sampling
		const numSamples = 100;
		let evidence = 0;
		
		for (let i = 0; i < numSamples; i++) {
			const sample = this.sampleFromPrior(priors);
			const sampleLikelihood = this.evaluateLikelihood(features, sample);
			evidence += sampleLikelihood;
		}
		
		return evidence / numSamples;
	}
	
	sampleFromPrior(priors) {
		// Gerar amostra das distribuições prior
		return {
			position: this.sampleGaussian(priors.position.mean, priors.position.covariance),
			velocity: this.sampleGamma(priors.velocity.shape, priors.velocity.rate),
			direction: this.sampleVonMises(priors.direction.mu, priors.direction.kappa),
			pattern: this.sampleCategorical(priors.pattern.probabilities)
		};
	}
	
	sampleGaussian(mean, covariance) {
		// Amostragem Gaussiana multivariada (2D)
		const z1 = this.standardNormal();
		const z2 = this.standardNormal();
		
		// Decomposição de Cholesky simplificada para 2x2
		const L11 = Math.sqrt(covariance[0][0]);
		const L21 = covariance[1][0] / L11;
		const L22 = Math.sqrt(covariance[1][1] - L21**2);
		
		return {
			x: mean.x + L11 * z1,
			y: mean.y + L21 * z1 + L22 * z2
		};
	}
	
	sampleGamma(shape, rate) {
		// Amostragem Gamma usando método de Marsaglia e Tsang
		if (shape < 1) {
			return this.sampleGamma(shape + 1, rate) * Math.pow(Math.random(), 1/shape);
		}
		
		const d = shape - 1/3;
		const c = 1 / Math.sqrt(9 * d);
		
		while (true) {
			let x, v;
			do {
				x = this.standardNormal();
				v = 1 + c * x;
			} while (v <= 0);
			
			v = v**3;
			const u = Math.random();
			
			if (u < 1 - 0.0331 * x**4) {
				return d * v / rate;
			}
			
			if (Math.log(u) < 0.5 * x**2 + d * (1 - v + Math.log(v))) {
				return d * v / rate;
			}
		}
	}
	
	sampleVonMises(mu, kappa) {
		// Amostragem von Mises usando algoritmo de Best e Fisher
		const a = 1 + Math.sqrt(1 + 4 * kappa**2);
		const b = (a - Math.sqrt(2 * a)) / (2 * kappa);
		const r = (1 + b**2) / (2 * b);
		
		while (true) {
			const u1 = Math.random();
			const z = Math.cos(Math.PI * u1);
			const f = (1 + r * z) / (r + z);
			const c = kappa * (r - f);
			
			const u2 = Math.random();
			if (c * (2 - c) - u2 > 0) {
				return mu + Math.sign(u1 - 0.5) * Math.acos(f);
			}
			
			if (Math.log(c / u2) + 1 - c >= 0) {
				return mu + Math.sign(u1 - 0.5) * Math.acos(f);
			}
		}
	}
	
	sampleCategorical(probabilities) {
		const rand = Math.random();
		let cumulative = 0;
		
		for (const [category, prob] of Object.entries(probabilities)) {
			cumulative += prob;
			if (rand <= cumulative) {
				return category;
			}
		}
		
		return Object.keys(probabilities)[0]; // Fallback
	}
	
	standardNormal() {
		// Box-Muller transform
		if (this._spare !== undefined) {
			const val = this._spare;
			delete this._spare;
			return val;
		}
		
		const u = Math.random();
		const v = Math.random();
		const mag = Math.sqrt(-2 * Math.log(u));
		
		this._spare = mag * Math.sin(2 * Math.PI * v);
		return mag * Math.cos(2 * Math.PI * v);
	}
	
	calculatePosterior(priors, likelihood, evidence) {
		// P(θ|data) = P(data|θ) * P(θ) / P(data)
		const posterior = {};
		
		Object.keys(priors).forEach(param => {
			const prior = priors[param];
			const like = likelihood.individual[param];
			
			posterior[param] = {
				prior: prior,
				likelihood: like,
				posterior_weight: (like * prior.confidence) / (evidence + 1e-15),
				uncertainty: 1 - prior.confidence
			};
		});
		
		return posterior;
	}
	
	mapEstimate(posterior) {
		// Maximum A Posteriori estimate
		const position = this.estimatePosition(posterior.position);
		const velocity = this.estimateVelocity(posterior.velocity);
		const direction = this.estimateDirection(posterior.direction);
		
		return {
			x: position.x,
			y: position.y,
			velocityX: velocity * Math.cos(direction),
			velocityY: velocity * Math.sin(direction)
		};
	}
	
	estimatePosition(posteriorPos) {
		const prior = posteriorPos.prior;
		const weight = posteriorPos.posterior_weight;
		
		// Weighted estimate
		return {
			x: prior.mean.x * weight + 400 * (1 - weight),
			y: prior.mean.y * weight + 300 * (1 - weight)
		};
	}
	
	estimateVelocity(posteriorVel) {
		const prior = posteriorVel.prior;
		const weight = posteriorVel.posterior_weight;
		
		// Estimate from Gamma distribution
		const estimate = prior.shape / prior.rate;
		return estimate * weight + 5 * (1 - weight); // Default velocity 5
	}
	
	estimateDirection(posteriorDir) {
		const prior = posteriorDir.prior;
		const weight = posteriorDir.posterior_weight;
		
		return prior.mu * weight; // Von Mises mean
	}
	
	calculateBayesianConfidence(posterior, uncertainty) {
		// Confidence baseada na concentração das distribuições posteriores
		let totalConfidence = 0;
		let count = 0;
		
		Object.values(posterior).forEach(param => {
			totalConfidence += param.posterior_weight * (1 - param.uncertainty);
			count++;
		});
		
		const baseConfidence = count > 0 ? totalConfidence / count : 0.5;
		
		// Ajustar pela incerteza quantificada
		return Math.max(0, Math.min(1, baseConfidence * (1 - uncertainty)));
	}
	
	updatePriorWithHyperparams(prior, paramType) {
		// Atualizar priors com hyperparâmetros
		const updatedPrior = { ...prior };
		
		switch (paramType) {
			case 'position':
				// Aplicar regularização na covariância
				updatedPrior.covariance = updatedPrior.covariance.map(row => 
					row.map(val => val + this.hyperparams.sigma**2)
				);
				break;
			case 'velocity':
				// Adicionar regularização Gamma
				updatedPrior.shape += this.hyperparams.alpha;
				updatedPrior.rate += this.hyperparams.beta;
				break;
			case 'direction':
				// Suavizar concentração von Mises
				updatedPrior.kappa *= this.hyperparams.gamma;
				break;
		}
		
		return updatedPrior;
	}
	
	getConfidence() {
		return this.confidence;
	}
	
	// Método para atualizar priors com novos dados de treinamento
	updatePriors(features, outcome) {
		try {
			// Verificar se os parâmetros são válidos
			if (!features || !Array.isArray(features) || !outcome) {
				console.warn("🎲 Invalid parameters for updatePriors");
				return;
			}
			
			// Extrair informações da situação atual
			const currentPosition = {
				x: (features[0] || 0) * 800,
				y: (features[1] || 0) * 600
			};
			
			const currentVelocity = Math.sqrt(
				((features[2] || 0) * 10)**2 + 
				((features[3] || 0) * 10)**2
			);
			
			const currentDirection = Math.atan2(
				features[3] || 0, 
				features[2] || 1
			);
			
			// Atualizar prior de posição
			this.updatePositionPrior(currentPosition, outcome);
			
			// Atualizar prior de velocidade
			this.updateVelocityPrior(currentVelocity, outcome);
			
			// Atualizar prior de direção
			this.updateDirectionPrior(currentDirection, outcome);
			
			// Atualizar confiança baseada no sucesso
			if (outcome.success !== undefined) {
				this.updateConfidenceFromOutcome(outcome.success);
			}
			
			console.log(`🎲 Priors updated from training example`);
			
		} catch (error) {
			console.warn("🎲 Error updating priors:", error.message);
		}
	}
	
	updatePositionPrior(position, outcome) {
		// Atualizar distribuição prior de posição
		const key = 'position';
		
		if (!this.priorDistributions.has(key)) {
			this.priorDistributions.set(key, {
				type: 'gaussian',
				mean: { x: 400, y: 300 },
				covariance: [[5000, 0], [0, 5000]],
				sampleCount: 0,
				successCount: 0
			});
		}
		
		const prior = this.priorDistributions.get(key);
		prior.sampleCount++;
		
		if (outcome.success) {
			prior.successCount++;
			
			// Atualizar média com learning rate adaptativo
			const learningRate = 1 / Math.sqrt(prior.successCount + 1);
			prior.mean.x += learningRate * (position.x - prior.mean.x);
			prior.mean.y += learningRate * (position.y - prior.mean.y);
			
			// Reduzir variância com exemplos bem-sucedidos
			const reduction = Math.min(0.1, learningRate);
			prior.covariance[0][0] *= (1 - reduction);
			prior.covariance[1][1] *= (1 - reduction);
		}
	}
	
	updateVelocityPrior(velocity, outcome) {
		// Atualizar distribuição prior de velocidade
		const key = 'velocity';
		
		if (!this.priorDistributions.has(key)) {
			this.priorDistributions.set(key, {
				type: 'gamma',
				shape: 2.0,
				rate: 0.4,
				sampleCount: 0,
				successCount: 0
			});
		}
		
		const prior = this.priorDistributions.get(key);
		prior.sampleCount++;
		
		if (outcome.success && velocity > 0) {
			prior.successCount++;
			
			// Atualização Bayesiana para Gamma
			const learningRate = 1 / Math.sqrt(prior.successCount + 1);
			const targetMean = velocity;
			const currentMean = prior.shape / prior.rate;
			
			// Ajustar parâmetros em direção ao valor observado
			if (targetMean > currentMean) {
				prior.shape += learningRate * 0.1;
			} else if (targetMean < currentMean) {
				prior.rate += learningRate * 0.1;
			}
		}
	}
	
	updateDirectionPrior(direction, outcome) {
		// Atualizar distribuição prior de direção
		const key = 'direction';
		
		if (!this.priorDistributions.has(key)) {
			this.priorDistributions.set(key, {
				type: 'von_mises',
				mu: 0,
				kappa: 1.0,
				sampleCount: 0,
				successCount: 0
			});
		}
		
		const prior = this.priorDistributions.get(key);
		prior.sampleCount++;
		
		if (outcome.success) {
			prior.successCount++;
			
			// Atualização para von Mises
			const learningRate = 1 / Math.sqrt(prior.successCount + 1);
			
			// Atualizar média circular
			const cosSum = Math.cos(prior.mu) + learningRate * Math.cos(direction);
			const sinSum = Math.sin(prior.mu) + learningRate * Math.sin(direction);
			prior.mu = Math.atan2(sinSum, cosSum);
			
			// Aumentar concentração com exemplos bem-sucedidos
			prior.kappa += learningRate * 0.1;
			prior.kappa = Math.min(prior.kappa, 10); // Limitar concentração máxima
		}
	}
	
	updateConfidenceFromOutcome(success) {
		// Atualizar confiança geral baseada no resultado
		if (success) {
			this.confidence = Math.min(1.0, this.confidence + 0.01);
		} else {
			this.confidence = Math.max(0.1, this.confidence - 0.005);
		}
	}
}

// === SISTEMA DE QUANTIFICAÇÃO DE INCERTEZA ===
class UncertaintyQuantificationSystem {
	constructor() {
		this.monteCarloSamples = 1000;
		this.bootstrapSamples = 500;
		console.log("📊 UncertaintyQuantificationSystem initialized");
	}
	
	quantify(posterior, prediction) {
		// Múltiplas métricas de incerteza
		const aleatoric = this.calculateAleatoricUncertainty(posterior);
		const epistemic = this.calculateEpistemicUncertainty(posterior);
		const predictive = this.calculatePredictiveUncertainty(posterior, prediction);
		
		// Incerteza total
		const totalUncertainty = Math.sqrt(aleatoric**2 + epistemic**2 + predictive**2) / Math.sqrt(3);
		
		return Math.min(1, totalUncertainty);
	}
	
	calculateAleatoricUncertainty(posterior) {
		// Incerteza inerente aos dados (ruído)
		let uncertainty = 0;
		let count = 0;
		
		Object.values(posterior).forEach(param => {
			if (param.prior.type === 'gaussian') {
				const variance = param.prior.covariance ? 
					(param.prior.covariance[0][0] + param.prior.covariance[1][1]) / 2 : 100;
				uncertainty += Math.sqrt(variance) / 100; // Normalizado
			} else {
				uncertainty += param.uncertainty || 0.5;
			}
			count++;
		});
		
		return count > 0 ? uncertainty / count : 0.5;
	}
	
	calculateEpistemicUncertainty(posterior) {
		// Incerteza do modelo (falta de conhecimento)
		let uncertainty = 0;
		let count = 0;
		
		Object.values(posterior).forEach(param => {
			// Baseado na força da evidência
			const evidenceStrength = param.posterior_weight || 0;
			uncertainty += 1 - evidenceStrength;
			count++;
		});
		
		return count > 0 ? uncertainty / count : 0.5;
	}
	
	calculatePredictiveUncertainty(posterior, prediction) {
		// Incerteza na predição específica
		// Simular múltiplas predições e calcular variância
		const predictions = [];
		
		for (let i = 0; i < 50; i++) { // 50 amostras para velocidade
			const noisyPrediction = this.addPredictionNoise(prediction, posterior);
			predictions.push(noisyPrediction);
		}
		
		// Calcular variância das predições
		const meanX = predictions.reduce((sum, p) => sum + p.x, 0) / predictions.length;
		const meanY = predictions.reduce((sum, p) => sum + p.y, 0) / predictions.length;
		
		const variance = predictions.reduce((sum, p) => {
			return sum + (p.x - meanX)**2 + (p.y - meanY)**2;
		}, 0) / predictions.length;
		
		return Math.min(1, Math.sqrt(variance) / 100); // Normalizado
	}
	
	addPredictionNoise(prediction, posterior) {
		// Adicionar ruído baseado na incerteza posterior
		const noiseLevel = Object.values(posterior).reduce((sum, param) => 
			sum + (param.uncertainty || 0), 0) / Object.keys(posterior).length;
		
		return {
			x: prediction.x + (Math.random() - 0.5) * noiseLevel * 50,
			y: prediction.y + (Math.random() - 0.5) * noiseLevel * 50
		};
	}
}

// === SISTEMA DE AMOSTRAGEM MONTE CARLO ===
class MonteCarloSamplingSystem {
	constructor() {
		this.chains = [];
		this.burnIn = 100;
		this.samples = 1000;
		this.thinning = 1;
		
		console.log("🎰 MonteCarloSamplingSystem initialized");
	}
	
	// Markov Chain Monte Carlo sampling
	mcmcSample(posterior, numSamples = 1000) {
		const samples = [];
		let currentState = this.initializeState(posterior);
		
		for (let i = 0; i < numSamples + this.burnIn; i++) {
			const proposal = this.proposeState(currentState, posterior);
			const acceptanceRatio = this.calculateAcceptanceRatio(currentState, proposal, posterior);
			
			if (Math.random() < acceptanceRatio) {
				currentState = proposal;
			}
			
			// Coletar amostra após burn-in
			if (i >= this.burnIn && i % this.thinning === 0) {
				samples.push({ ...currentState });
			}
		}
		
		return samples;
	}
	
	initializeState(posterior) {
		// Estado inicial para MCMC
		return {
			position: { x: 400, y: 300 },
			velocity: 5,
			direction: 0,
			pattern: 'random'
		};
	}
	
	proposeState(currentState, posterior) {
		// Propor novo estado (Metropolis-Hastings)
		const proposal = { ...currentState };
		
		// Adicionar ruído às variáveis contínuas
		proposal.position.x += (Math.random() - 0.5) * 20;
		proposal.position.y += (Math.random() - 0.5) * 20;
		proposal.velocity *= (0.9 + Math.random() * 0.2);
		proposal.direction += (Math.random() - 0.5) * 0.2;
		
		// Manter dentro dos limites
		proposal.position.x = Math.max(0, Math.min(800, proposal.position.x));
		proposal.position.y = Math.max(0, Math.min(600, proposal.position.y));
		proposal.velocity = Math.max(0.1, Math.min(20, proposal.velocity));
		
		return proposal;
	}
	
	calculateAcceptanceRatio(current, proposal, posterior) {
		// Ratio de aceitação Metropolis-Hastings
		const currentLogProb = this.logProbability(current, posterior);
		const proposalLogProb = this.logProbability(proposal, posterior);
		
		return Math.min(1, Math.exp(proposalLogProb - currentLogProb));
	}
	
	logProbability(state, posterior) {
		// Log-probabilidade do estado
		let logProb = 0;
		
		// Position log-likelihood
		if (posterior.position && posterior.position.prior.type === 'gaussian') {
			const mean = posterior.position.prior.mean;
			const dx = state.position.x - mean.x;
			const dy = state.position.y - mean.y;
			logProb -= (dx**2 + dy**2) / 1000; // Simplified
		}
		
		// Velocity log-likelihood
		if (posterior.velocity && posterior.velocity.prior.type === 'gamma') {
			const shape = posterior.velocity.prior.shape;
			const rate = posterior.velocity.prior.rate;
			logProb += (shape - 1) * Math.log(state.velocity) - rate * state.velocity;
		}
		
		return logProb;
	}
	
	// Importance Sampling
	importanceSample(posterior, numSamples = 500) {
		const samples = [];
		const weights = [];
		
		for (let i = 0; i < numSamples; i++) {
			const sample = this.sampleFromProposal(posterior);
			const weight = this.calculateImportanceWeight(sample, posterior);
			
			samples.push(sample);
			weights.push(weight);
		}
		
		// Normalizar pesos
		const totalWeight = weights.reduce((a, b) => a + b, 0);
		const normalizedWeights = weights.map(w => w / totalWeight);
		
		return { samples, weights: normalizedWeights };
	}
	
	sampleFromProposal(posterior) {
		// Amostra da distribuição proposta (simplificada)
		return {
			position: {
				x: 200 + Math.random() * 400,
				y: 150 + Math.random() * 300
			},
			velocity: 1 + Math.random() * 10,
			direction: Math.random() * 2 * Math.PI
		};
	}
	
	calculateImportanceWeight(sample, posterior) {
		// Peso de importância: target(x) / proposal(x)
		const targetProb = Math.exp(this.logProbability(sample, posterior));
		const proposalProb = 1 / (400 * 300 * 10 * 2 * Math.PI); // Uniform proposal
		
		return targetProb / proposalProb;
	}
}

// === SISTEMA DE CALIBRAÇÃO DE CONFIANÇA ===
class ConfidenceCalibrationSystem {
	constructor() {
		this.calibrationData = [];
		this.maxCalibrationPoints = 1000;
		console.log("🎯 ConfidenceCalibrationSystem initialized");
	}
	
	calibrate(rawConfidence, uncertainty) {
		// Calibrar confiança baseada em performance histórica
		const calibratedConfidence = this.applyCalibration(rawConfidence, uncertainty);
		
		// Adicionar ponto de calibração
		this.addCalibrationPoint(rawConfidence, uncertainty, calibratedConfidence);
		
		return calibratedConfidence;
	}
	
	applyCalibration(rawConfidence, uncertainty) {
		// Platt scaling simplificado
		if (this.calibrationData.length < 10) {
			// Não há dados suficientes para calibração
			return this.temperatureScaling(rawConfidence, uncertainty);
		}
		
		// Encontrar pontos de calibração similares
		const similarPoints = this.findSimilarCalibrationPoints(rawConfidence, uncertainty);
		
		if (similarPoints.length === 0) {
			return this.temperatureScaling(rawConfidence, uncertainty);
		}
		
		// Média ponderada dos pontos similares
		const weightedSum = similarPoints.reduce((sum, point) => {
			const weight = 1 / (1 + Math.abs(point.rawConfidence - rawConfidence));
			return sum + point.calibratedConfidence * weight;
		}, 0);
		
		const totalWeight = similarPoints.reduce((sum, point) => {
			return sum + 1 / (1 + Math.abs(point.rawConfidence - rawConfidence));
		}, 0);
		
		return totalWeight > 0 ? weightedSum / totalWeight : rawConfidence;
	}
	
	temperatureScaling(rawConfidence, uncertainty) {
		// Temperature scaling para calibração
		const temperature = 1.2 + uncertainty * 0.8; // T entre 1.2 e 2.0
		return 1 / (1 + Math.exp(-Math.log(rawConfidence / (1 - rawConfidence)) / temperature));
	}
	
	addCalibrationPoint(rawConfidence, uncertainty, calibratedConfidence) {
		this.calibrationData.push({
			rawConfidence,
			uncertainty,
			calibratedConfidence,
			timestamp: Date.now()
		});
		
		// Limitar tamanho dos dados de calibração
		if (this.calibrationData.length > this.maxCalibrationPoints) {
			this.calibrationData.shift();
		}
	}
	
	findSimilarCalibrationPoints(rawConfidence, uncertainty, threshold = 0.1) {
		return this.calibrationData.filter(point => {
			const confDiff = Math.abs(point.rawConfidence - rawConfidence);
			const uncDiff = Math.abs(point.uncertainty - uncertainty);
			return confDiff < threshold && uncDiff < threshold;
		});
	}
}

export { 
	BayesianInferenceEngine, 
	UncertaintyQuantificationSystem, 
	MonteCarloSamplingSystem, 
	ConfidenceCalibrationSystem 
};