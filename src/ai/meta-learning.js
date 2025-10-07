// ============================================================================
// SISTEMA DE META-APRENDIZADO E OTIMIZAÇÃO ADAPTATIVA
// ============================================================================

// === META-LEARNER QUE OTIMIZA A PRÓPRIA IA ===
class MetaLearningOptimizer {
	constructor() {
		this.networkWeights = new Map();
		this.performanceHistory = new Map();
		this.adaptationCount = 0;
		this.learningRates = new Map();
		this.architecturalParams = new Map();
		this.optimizationHistory = [];
		
		// Inicializar pesos iguais para todas as redes
		this.initializeNetworkWeights();
		
		console.log("🧬 MetaLearningOptimizer initialized - SELF-ADAPTING AI");
	}
	
	initializeNetworkWeights() {
		const networks = ['deep', 'lstm', 'conv', 'attention', 'transformer', 'knn', 'polynomial', 'bayesian'];
		networks.forEach(net => {
			this.networkWeights.set(net, 1.0 / networks.length); // Peso inicial igual
			this.performanceHistory.set(net, []);
			this.learningRates.set(net, 0.001);
		});
	}
	
	// Atualizar pesos das redes baseado na performance
	updateNetworkWeights(predictions, actualResult, error) {
		const alpha = 0.1; // Taxa de adaptação
		
		predictions.forEach(pred => {
			const network = pred.network;
			const predError = Math.sqrt(
				(pred.prediction[0] - actualResult.x)**2 + 
				(pred.prediction[1] - actualResult.y)**2
			);
			
			// Calcular performance relativa
			const relativePerformance = Math.max(0, 1 - predError / 200); // Normalizar erro
			
			// Atualizar histórico
			const history = this.performanceHistory.get(network);
			history.push(relativePerformance);
			if (history.length > 100) history.shift(); // Manter apenas últimas 100
			
			// Calcular performance média
			const avgPerformance = history.reduce((a, b) => a + b, 0) / history.length;
			
			// Atualizar peso da rede
			const currentWeight = this.networkWeights.get(network);
			const newWeight = currentWeight * (1 + alpha * (relativePerformance - 0.5));
			this.networkWeights.set(network, Math.max(0.01, Math.min(2.0, newWeight)));
			
			// Adaptar learning rate baseado na performance
			this.adaptLearningRate(network, relativePerformance);
		});
		
		// Normalizar pesos
		this.normalizeWeights();
		this.adaptationCount++;
		
		// Log da adaptação
		if (this.adaptationCount % 50 === 0) {
			console.log("🧬 Meta-Learning Adaptation #" + this.adaptationCount);
			console.log("Network Weights:", Object.fromEntries(this.networkWeights));
		}
	}
	
	adaptLearningRate(network, performance) {
		const currentLR = this.learningRates.get(network);
		const performanceHistory = this.performanceHistory.get(network);
		
		if (performanceHistory.length > 10) {
			const recentPerf = performanceHistory.slice(-10);
			const trend = this.calculateTrend(recentPerf);
			
			let newLR = currentLR;
			if (trend > 0.01) {
				// Performance melhorando - aumentar LR ligeiramente
				newLR = currentLR * 1.05;
			} else if (trend < -0.01) {
				// Performance piorando - diminuir LR
				newLR = currentLR * 0.95;
			}
			
			// Adaptar baseado na performance absoluta
			if (performance > 0.8) {
				newLR *= 1.02; // Performance boa - ser mais agressivo
			} else if (performance < 0.3) {
				newLR *= 0.98; // Performance ruim - ser mais conservador
			}
			
			this.learningRates.set(network, Math.max(0.0001, Math.min(0.01, newLR)));
		}
	}
	
	calculateTrend(data) {
		if (data.length < 2) return 0;
		
		const n = data.length;
		const sumX = n * (n - 1) / 2;
		const sumY = data.reduce((a, b) => a + b, 0);
		const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
		const sumXX = n * (n - 1) * (2 * n - 1) / 6;
		
		return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
	}
	
	normalizeWeights() {
		const totalWeight = Array.from(this.networkWeights.values()).reduce((a, b) => a + b, 0);
		if (totalWeight > 0) {
			this.networkWeights.forEach((weight, network) => {
				this.networkWeights.set(network, weight / totalWeight);
			});
		}
	}
	
	getNetworkWeight(network) {
		return this.networkWeights.get(network) || 0.1;
	}
	
	getLearningRate(network) {
		return this.learningRates.get(network) || 0.001;
	}
	
	// Otimização genética de hiperparâmetros
	evolveHyperparameters() {
		// Implementação simplificada de algoritmo genético
		const currentParams = this.getCurrentHyperparameters();
		const mutatedParams = this.mutateParameters(currentParams);
		
		// Teste mental da performance com novos parâmetros
		const estimatedPerformance = this.estimatePerformance(mutatedParams);
		
		if (estimatedPerformance > this.getCurrentPerformance()) {
			this.applyHyperparameters(mutatedParams);
			console.log("🧬 Hyperparameters evolved:", mutatedParams);
		}
	}
	
	getCurrentHyperparameters() {
		return {
			learningRates: Object.fromEntries(this.learningRates),
			networkWeights: Object.fromEntries(this.networkWeights),
			adaptationRate: 0.1
		};
	}
	
	mutateParameters(params) {
		const mutated = JSON.parse(JSON.stringify(params));
		
		// Mutar learning rates
		Object.keys(mutated.learningRates).forEach(net => {
			mutated.learningRates[net] *= (0.9 + Math.random() * 0.2); // ±10% variação
		});
		
		// Mutar pesos das redes
		Object.keys(mutated.networkWeights).forEach(net => {
			mutated.networkWeights[net] *= (0.8 + Math.random() * 0.4); // ±20% variação
		});
		
		return mutated;
	}
	
	estimatePerformance(params) {
		// Estimativa simples baseada no histórico
		let score = 0;
		
		Object.keys(params.networkWeights).forEach(net => {
			const history = this.performanceHistory.get(net);
			if (history.length > 0) {
				const avgPerf = history.reduce((a, b) => a + b, 0) / history.length;
				score += avgPerf * params.networkWeights[net];
			}
		});
		
		return score;
	}
	
	getCurrentPerformance() {
		let totalPerf = 0;
		let count = 0;
		
		this.performanceHistory.forEach(history => {
			if (history.length > 0) {
				totalPerf += history.reduce((a, b) => a + b, 0) / history.length;
				count++;
			}
		});
		
		return count > 0 ? totalPerf / count : 0;
	}
	
	applyHyperparameters(params) {
		// Aplicar novos learning rates
		Object.entries(params.learningRates).forEach(([net, lr]) => {
			this.learningRates.set(net, lr);
		});
		
		// Aplicar novos pesos (com normalização)
		Object.entries(params.networkWeights).forEach(([net, weight]) => {
			this.networkWeights.set(net, weight);
		});
		
		this.normalizeWeights();
	}
}

// === OTIMIZAÇÃO GENÉTICA DE HIPERPARÂMETROS ===
class GeneticHyperparameterOptimizer {
	constructor(populationSize = 20) {
		this.populationSize = populationSize;
		this.population = [];
		this.generation = 0;
		this.bestGenome = null;
		this.fitnessHistory = [];
		
		this.initializePopulation();
		console.log("🧬 GeneticHyperparameterOptimizer initialized");
	}
	
	initializePopulation() {
		for (let i = 0; i < this.populationSize; i++) {
			this.population.push(this.createRandomGenome());
		}
	}
	
	createRandomGenome() {
		return {
			id: Math.random().toString(36).substr(2, 9),
			genes: {
				learningRate: 0.0001 + Math.random() * 0.01,
				momentum: 0.8 + Math.random() * 0.19,
				dropout: 0.1 + Math.random() * 0.4,
				batchSize: Math.floor(16 + Math.random() * 48),
				hiddenLayers: Math.floor(3 + Math.random() * 5),
				hiddenSize: Math.floor(128 + Math.random() * 896),
				activationFunction: ['relu', 'swish', 'gelu', 'tanh'][Math.floor(Math.random() * 4)],
				optimizerType: ['adam', 'adamw', 'rmsprop'][Math.floor(Math.random() * 3)],
				regularization: Math.random() * 0.01,
				ensembleWeight: Math.random()
			},
			fitness: 0,
			age: 0
		};
	}
	
	evolve(fitnessScores) {
		// Atualizar fitness da população
		this.population.forEach((genome, i) => {
			if (i < fitnessScores.length) {
				genome.fitness = fitnessScores[i];
				genome.age++;
			}
		});
		
		// Encontrar melhor genoma
		const currentBest = this.population.reduce((best, genome) => 
			genome.fitness > best.fitness ? genome : best
		);
		
		if (!this.bestGenome || currentBest.fitness > this.bestGenome.fitness) {
			this.bestGenome = JSON.parse(JSON.stringify(currentBest));
			console.log(`🧬 New best genome found! Fitness: ${currentBest.fitness.toFixed(4)}`);
		}
		
		// Seleção, crossover e mutação
		const newPopulation = [];
		
		// Elitismo - manter os melhores 20%
		const eliteCount = Math.floor(this.populationSize * 0.2);
		const elite = this.population
			.sort((a, b) => b.fitness - a.fitness)
			.slice(0, eliteCount);
		
		newPopulation.push(...elite.map(g => JSON.parse(JSON.stringify(g))));
		
		// Gerar resto da população através de crossover e mutação
		while (newPopulation.length < this.populationSize) {
			const parent1 = this.tournamentSelection();
			const parent2 = this.tournamentSelection();
			const child = this.crossover(parent1, parent2);
			this.mutate(child);
			newPopulation.push(child);
		}
		
		this.population = newPopulation;
		this.generation++;
		
		this.fitnessHistory.push({
			generation: this.generation,
			bestFitness: currentBest.fitness,
			avgFitness: this.population.reduce((sum, g) => sum + g.fitness, 0) / this.population.length
		});
		
		if (this.generation % 10 === 0) {
			console.log(`🧬 Generation ${this.generation} - Best Fitness: ${currentBest.fitness.toFixed(4)}`);
		}
	}
	
	tournamentSelection(tournamentSize = 3) {
		const tournament = [];
		for (let i = 0; i < tournamentSize; i++) {
			tournament.push(this.population[Math.floor(Math.random() * this.population.length)]);
		}
		return tournament.reduce((best, genome) => genome.fitness > best.fitness ? genome : best);
	}
	
	crossover(parent1, parent2) {
		const child = this.createRandomGenome();
		
		// Crossover uniforme
		Object.keys(child.genes).forEach(gene => {
			if (Math.random() < 0.5) {
				child.genes[gene] = parent1.genes[gene];
			} else {
				child.genes[gene] = parent2.genes[gene];
			}
		});
		
		return child;
	}
	
	mutate(genome, mutationRate = 0.1) {
		Object.keys(genome.genes).forEach(gene => {
			if (Math.random() < mutationRate) {
				switch (gene) {
					case 'learningRate':
						genome.genes[gene] *= (0.5 + Math.random());
						genome.genes[gene] = Math.max(0.0001, Math.min(0.01, genome.genes[gene]));
						break;
					case 'momentum':
						genome.genes[gene] += (Math.random() - 0.5) * 0.2;
						genome.genes[gene] = Math.max(0.1, Math.min(0.99, genome.genes[gene]));
						break;
					case 'dropout':
						genome.genes[gene] += (Math.random() - 0.5) * 0.2;
						genome.genes[gene] = Math.max(0.0, Math.min(0.5, genome.genes[gene]));
						break;
					case 'batchSize':
						genome.genes[gene] += Math.floor((Math.random() - 0.5) * 16);
						genome.genes[gene] = Math.max(8, Math.min(128, genome.genes[gene]));
						break;
					case 'hiddenLayers':
						genome.genes[gene] += Math.floor((Math.random() - 0.5) * 2);
						genome.genes[gene] = Math.max(2, Math.min(10, genome.genes[gene]));
						break;
					case 'hiddenSize':
						genome.genes[gene] += Math.floor((Math.random() - 0.5) * 128);
						genome.genes[gene] = Math.max(64, Math.min(2048, genome.genes[gene]));
						break;
					case 'regularization':
						genome.genes[gene] *= (0.5 + Math.random());
						genome.genes[gene] = Math.max(0, Math.min(0.1, genome.genes[gene]));
						break;
					case 'ensembleWeight':
						genome.genes[gene] += (Math.random() - 0.5) * 0.4;
						genome.genes[gene] = Math.max(0.1, Math.min(2.0, genome.genes[gene]));
						break;
				}
			}
		});
	}
	
	getBestHyperparameters() {
		return this.bestGenome ? this.bestGenome.genes : this.createRandomGenome().genes;
	}
	
	getPopulationDiversity() {
		// Calcular diversidade genética da população
		const genes = Object.keys(this.population[0].genes);
		let diversity = 0;
		
		genes.forEach(gene => {
			const values = this.population.map(g => g.genes[gene]);
			const mean = values.reduce((a, b) => a + b, 0) / values.length;
			const variance = values.reduce((sum, val) => sum + (val - mean)**2, 0) / values.length;
			diversity += variance;
		});
		
		return diversity / genes.length;
	}
}

// === BUSCA DE ARQUITETURA NEURAL ===
class NeuralArchitectureSearch {
	constructor() {
		this.searchSpace = {
			layers: [2, 3, 4, 5, 6, 7, 8, 9, 10],
			neuronCounts: [64, 128, 256, 512, 1024, 1536, 2048],
			activations: ['relu', 'leaky_relu', 'swish', 'gelu', 'tanh'],
			dropouts: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5],
			connections: ['dense', 'residual', 'highway'],
			optimizers: ['adam', 'adamw', 'rmsprop', 'sgd']
		};
		
		this.testedArchitectures = new Map();
		this.bestArchitecture = null;
		this.searchCount = 0;
		
		console.log("🏗️ NeuralArchitectureSearch initialized");
	}
	
	searchBestArchitecture(currentPerformance) {
		// Busca aleatória inteligente
		for (let i = 0; i < 5; i++) { // Testar 5 arquiteturas por vez
			const architecture = this.generateRandomArchitecture();
			const estimatedPerformance = this.estimateArchitecturePerformance(architecture);
			
			this.testedArchitectures.set(JSON.stringify(architecture), estimatedPerformance);
			
			if (!this.bestArchitecture || estimatedPerformance > this.bestArchitecture.performance) {
				this.bestArchitecture = {
					architecture: architecture,
					performance: estimatedPerformance
				};
				console.log("🏗️ Better architecture found:", architecture);
			}
		}
		
		this.searchCount++;
		return this.bestArchitecture ? this.bestArchitecture.architecture : null;
	}
	
	generateRandomArchitecture() {
		const numLayers = this.searchSpace.layers[Math.floor(Math.random() * this.searchSpace.layers.length)];
		const architecture = {
			layers: [],
			optimizer: this.searchSpace.optimizers[Math.floor(Math.random() * this.searchSpace.optimizers.length)],
			globalDropout: this.searchSpace.dropouts[Math.floor(Math.random() * this.searchSpace.dropouts.length)]
		};
		
		for (let i = 0; i < numLayers; i++) {
			const layer = {
				neurons: this.searchSpace.neuronCounts[Math.floor(Math.random() * this.searchSpace.neuronCounts.length)],
				activation: this.searchSpace.activations[Math.floor(Math.random() * this.searchSpace.activations.length)],
				dropout: this.searchSpace.dropouts[Math.floor(Math.random() * this.searchSpace.dropouts.length)],
				connection: this.searchSpace.connections[Math.floor(Math.random() * this.searchSpace.connections.length)]
			};
			
			// Decreasing layer size é geralmente melhor
			if (i > 0 && Math.random() < 0.7) {
				layer.neurons = Math.min(layer.neurons, architecture.layers[i-1].neurons);
			}
			
			architecture.layers.push(layer);
		}
		
		return architecture;
	}
	
	estimateArchitecturePerformance(architecture) {
		// Heurísticas para estimar performance
		let score = 0.5; // Base score
		
		// Penalizar arquiteturas muito simples ou complexas
		const complexity = this.calculateComplexity(architecture);
		if (complexity > 0.3 && complexity < 0.8) {
			score += 0.2;
		} else {
			score -= 0.1;
		}
		
		// Bonificar certas ativações
		const activationBonus = {
			'swish': 0.1,
			'gelu': 0.05,
			'relu': 0.0,
			'leaky_relu': 0.02,
			'tanh': -0.05
		};
		
		architecture.layers.forEach(layer => {
			score += activationBonus[layer.activation] || 0;
		});
		
		// Bonificar dropout moderado
		const avgDropout = (architecture.layers.reduce((sum, l) => sum + l.dropout, 0) / architecture.layers.length + architecture.globalDropout) / 2;
		if (avgDropout > 0.1 && avgDropout < 0.3) {
			score += 0.1;
		}
		
		// Bonificar otimizadores modernos
		if (architecture.optimizer === 'adam' || architecture.optimizer === 'adamw') {
			score += 0.05;
		}
		
		// Ruído aleatório para simular incerteza
		score += (Math.random() - 0.5) * 0.2;
		
		return Math.max(0, Math.min(1, score));
	}
	
	calculateComplexity(architecture) {
		const totalNeurons = architecture.layers.reduce((sum, layer) => sum + layer.neurons, 0);
		const numLayers = architecture.layers.length;
		
		// Normalizar complexidade
		return Math.min(1, (totalNeurons / 10000 + numLayers / 20) / 2);
	}
	
	getBestArchitecture() {
		return this.bestArchitecture ? this.bestArchitecture.architecture : null;
	}
}

export { MetaLearningOptimizer, GeneticHyperparameterOptimizer, NeuralArchitectureSearch };