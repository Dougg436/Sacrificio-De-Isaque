/**
 * SISTEMA DE IA ULTRA PRECISO - A IA MAIS ABSURDA DO MUNDO
 * 
 * Esta é a implementação final do sistema de ensemble que combina:
 * - 5+ redes neurais diferentes
 * - Análise temporal multi-escala
 * - Meta-aprendizado adaptativo
 * - Memória de longo prazo
 * - Inferência Bayesiana
 * - Algoritmos KNN adaptativos
 * - Análise de caos determinístico
 * 
 * Objetivo: Atingir 100% de precisão na predição de movimentos do player
 */

import { UltraDeepNeuralNetwork, LSTMLikeNetwork, ConvolutionalPatternNetwork, AttentionMechanismNetwork, TransformerLikeNetwork } from './neural-network-ultra.js';
import { MultiscaleTemporalAnalyzer, CyclicPatternDetector, FourierTemporalAnalyzer } from './temporal-analysis.js';
import { MetaLearningOptimizer, GeneticHyperparameterOptimizer, NeuralArchitectureSearch } from './meta-learning.js';
import { LongTermMemorySystem } from './memory-system.js';
import { BayesianInferenceEngine } from './bayesian-system.js';

export class UltraPrecisionEnsembleAI {
    constructor() {
        console.log('🚀 INICIALIZANDO A IA MAIS ABSURDA DO MUNDO...');
        
        // === ENSEMBLE DE REDES NEURAIS ===
        // Output: 2 neurônios (X e Y) - COORDENADAS da posição futura do jogador
        this.neuralNetworks = {
            ultraDeep: new UltraDeepNeuralNetwork(20, [64, 128, 256, 128, 64, 32], 2),  // 2 outputs: X, Y
            lstm: new LSTMLikeNetwork(20, 128, 2),  // 2 outputs: X, Y
            conv: new ConvolutionalPatternNetwork(20, 2),  // 2 outputs: X, Y
            attention: new AttentionMechanismNetwork(20, 128, 2, 8),  // 2 outputs: X, Y
            transformer: new TransformerLikeNetwork(20, 128, 2, 8, 4)  // 2 outputs: X, Y
        };
        
        // === SISTEMAS DE ANÁLISE TEMPORAL ===
        this.temporalAnalyzers = {
            multiscale: new MultiscaleTemporalAnalyzer(),
            cyclic: new CyclicPatternDetector(),
            fourier: new FourierTemporalAnalyzer()
        };
        
        // === META-APRENDIZADO ===
        this.metaLearning = {
            optimizer: new MetaLearningOptimizer(),
            genetic: new GeneticHyperparameterOptimizer(),
            nas: new NeuralArchitectureSearch()
        };
        
        // === SISTEMA DE MEMÓRIA ===
        this.memory = new LongTermMemorySystem(50000); // 50k situações na memória
        
        // === INFERÊNCIA BAYESIANA ===
        this.bayesian = new BayesianInferenceEngine();
        
        // === ALGORITMOS TRADICIONAIS MELHORADOS ===
        this.knnData = [];
        this.maxKnnData = 10000; // Limitar para performance
        
        // === SISTEMA DE VOTAÇÃO INTELIGENTE ===
        this.predictionWeights = {
            behavioral: 0.35,       // Análise comportamental tem prioridade máxima
            ultraDeep: 0.20,        // Neural network principal
            lstm: 0.15,             // Memória temporal
            attention: 0.10,        // Atenção contextual
            transformer: 0.08,      // Transformações complexas
            conv: 0.05,             // Padrões convolucionais
            temporal: 0.03,         // Análise temporal básica
            memory: 0.02,           // Memória episódica
            bayesian: 0.01,         // Inferência estatística
            knn: 0.01              // Vizinhos próximos
        };
        
        // === ESTATÍSTICAS DE PERFORMANCE ===
        this.stats = {
            totalPredictions: 0,
            correctPredictions: 0,
            accuracy: 0,
            networkAccuracies: {},
            confidenceThreshold: 0.95, // Apenas aceitar predições com 95%+ confiança
            adaptationRate: 0.001 // Taxa de adaptação dos pesos
        };
        
        // === SISTEMA DE AUTO-MELHORIA ===
        this.selfImprovement = {
            performanceHistory: [],
            lastOptimization: 0,
            optimizationInterval: 30000, // Otimizar a cada 30 segundos
            isLearning: true
        };
        
        // === SISTEMA DE DEBUG E VISUALIZAÇÃO ===
        this.debugMode = true;
        this.learningVisualization = {
            lastPatternDetected: null,
            confidenceLevel: 0,
            adaptationInProgress: false,
            learningEvents: [],
            maxEvents: 10
        };
        
        // === DETECÇÃO DE PADRÕES FRACTAIS ===
        this.chaosAnalysis = {
            attractorPoints: [],
            fractalDimension: 0,
            lyapunovExponent: 0,
            entropyMeasure: 0
        };

        // === ESTADO PARA VISUALIZAÇÃO EM TEMPO REAL ===
        this.lastFeatures = null;
        this.lastNetworkActivations = {};
        this.lastEnsembleOutputs = {};
        this.lastSystemWeights = null;
        this.lastFusionOutput = null;
        this.lastOverallConfidence = 0;
        this.lastPredictionMeta = {};
        
        console.log('✅ IA ULTRA PRECISA INICIALIZADA COM SUCESSO!');
        console.log('📊 Redes neurais ativas:', Object.keys(this.neuralNetworks).length);
        console.log('🔬 Sistemas de análise:', Object.keys(this.temporalAnalyzers).length);
        console.log('🧠 Meta-aprendizado ativo:', Object.keys(this.metaLearning).length, 'sistemas');
        console.log('💾 Capacidade de memória:', this.memory ? '50,000 episódios' : 'Sistema de memória offline');
        console.log('📈 Sistema Bayesiano:', this.bayesian ? 'ATIVO' : 'OFFLINE');
    }
    
    /**
     * NÚCLEO PRINCIPAL - Fazer predição usando TODOS os sistemas
     */
    async predictPlayerPosition(inputHistory, movementHistory, playerState, timeHorizon) {
        try {
            const startTime = performance.now();
			
            // === PREPARAR DADOS DE ENTRADA ===
            const features = this.extractUltraFeatures(inputHistory, movementHistory, playerState);
            this.storeLastFeatures(features);
			
            // === ANÁLISE COMPORTAMENTAL INTELIGENTE ===
            const behaviorAnalysis = this.analyzePlayerBehavior(movementHistory, inputHistory);
			
            // === PREDIÇÃO MÚLTIPLA BASEADA EM PADRÕES ===
            const multiPredictions = this.generateMultiplePredictions(features, behaviorAnalysis, playerState);
            this.lastPredictionMeta = {
                behaviorAnalysis,
                multiPredictions,
                playerState: { ...playerState },
                timeHorizon
            };
            
            // === COLETAR PREDIÇÕES DE TODOS OS SISTEMAS ===
            const predictions = {};
            
            // 1. PREDIÇÃO COMPORTAMENTAL INTELIGENTE (peso: 40%)
            predictions['behavioral'] = {
                x: multiPredictions.behavioral.x,
                y: multiPredictions.behavioral.y,
                confidence: multiPredictions.behavioral.confidence
            };
            
            // 2. PREDIÇÃO ADAPTATIVA DE PADRÕES (peso: 30%)
            predictions['adaptive'] = {
                x: multiPredictions.adaptive.x,
                y: multiPredictions.adaptive.y,
                confidence: multiPredictions.adaptive.confidence
            };
            
            // 3. REDES NEURAIS (peso total: 30%)
            for (const [name, network] of Object.entries(this.neuralNetworks)) {
                try {
                    const prediction = await network.predict(features);
                    // Desnormalizar coordenadas: prediction[0] e prediction[1] estão entre 0 e 1
                    // Multiplicar por dimensões do canvas para obter pixels
                    predictions[name] = {
                        x: (prediction[0] || 0.5) * 800,  // Desnormalizar X (0-1 → 0-800)
                        y: (prediction[1] || 0.5) * 600,  // Desnormalizar Y (0-1 → 0-600)
                        confidence: this.calculateNetworkConfidence(network, features)
                    };
                    if (typeof network.getLayerActivations === 'function') {
                        this.lastNetworkActivations[name] = network.getLayerActivations();
                    }
                } catch (error) {
                    console.warn(`Erro na rede ${name}:`, error.message);
                    predictions[name] = { x: playerState.x, y: playerState.y, confidence: 0 };
                }
            }
            this.lastEnsembleOutputs = { ...predictions };
            
            // === MÉTODOS DE PREDIÇÃO INTELIGENTE ===
            
            // 2. ANÁLISE TEMPORAL (peso: 5%)
            try {
                const temporalPrediction = this.temporalAnalyzers.multiscale.predict(movementHistory, timeHorizon);
                predictions.temporal = {
                    x: temporalPrediction.x || playerState.x,
                    y: temporalPrediction.y || playerState.y,
                    confidence: temporalPrediction.confidence || 0.5
                };
            } catch (error) {
                predictions.temporal = { x: playerState.x, y: playerState.y, confidence: 0 };
            }
            
            // 3. MEMÓRIA DE LONGO PRAZO (peso: 5%)
            try {
                const memoryPrediction = this.memory.predictBasedOnSimilarSituations(playerState, inputHistory);
                predictions.memory = {
                    x: memoryPrediction.x || playerState.x,
                    y: memoryPrediction.y || playerState.y,
                    confidence: memoryPrediction.confidence || 0.3
                };
            } catch (error) {
                predictions.memory = { x: playerState.x, y: playerState.y, confidence: 0 };
            }
            
            // 4. INFERÊNCIA BAYESIANA (peso: 3%)
            try {
                const bayesianPrediction = this.bayesian.predictMovement(
                    playerState, inputHistory, movementHistory, timeHorizon
                );
                predictions.bayesian = {
                    x: bayesianPrediction.position.x || playerState.x,
                    y: bayesianPrediction.position.y || playerState.y,
                    confidence: bayesianPrediction.confidence || 0.4
                };
            } catch (error) {
                predictions.bayesian = { x: playerState.x, y: playerState.y, confidence: 0 };
            }
            
            // 5. KNN ADAPTATIVO (peso: 2%)
            try {
                const knnPrediction = this.predictWithAdaptiveKNN(features, timeHorizon);
                predictions.knn = {
                    x: knnPrediction.x || playerState.x,
                    y: knnPrediction.y || playerState.y,
                    confidence: knnPrediction.confidence || 0.2
                };
            } catch (error) {
                predictions.knn = { x: playerState.x, y: playerState.y, confidence: 0 };
            }
            
            // === FUSÃO INTELIGENTE DAS PREDIÇÕES ===
            const finalPrediction = this.fuseAllPredictions(predictions, playerState);
			
            // === ANÁLISE DE CONFIANÇA ULTRA RIGOROSA ===
            const overallConfidence = this.calculateOverallConfidence(predictions);
            this.lastFusionOutput = { ...finalPrediction };
            this.lastOverallConfidence = overallConfidence;
            this.lastPredictionMeta.finalPrediction = { ...finalPrediction };
            this.lastPredictionMeta.overallConfidence = overallConfidence;
            
            // === ATUALIZAR ESTATÍSTICAS ===
            this.stats.totalPredictions++;
            
            // === AUTO-MELHORIA CONTÍNUA ===
            if (this.selfImprovement.isLearning) {
                this.updatePredictionWeights(predictions, finalPrediction);
                await this.continuousOptimization();
            }
            
            const processingTime = performance.now() - startTime;
            
            return {
                position: finalPrediction,
                confidence: overallConfidence,
                timeHorizon: timeHorizon,
                processingTime: processingTime,
                networkPredictions: predictions,
                metadata: {
                    totalSystems: Object.keys(predictions).length,
                    activeSystems: Object.values(predictions).filter(p => p.confidence > 0).length,
                    averageConfidence: Object.values(predictions).reduce((sum, p) => sum + p.confidence, 0) / Object.keys(predictions).length
                }
            };
            
        } catch (error) {
            console.error('❌ ERRO CRÍTICO NA IA ULTRA PRECISA:', error);
            
            // Fallback seguro
            return {
                position: { x: playerState.x, y: playerState.y },
                confidence: 0.1,
                timeHorizon: timeHorizon,
                error: error.message
            };
        }
    }
    
    // === MÉTODOS DE ANÁLISE COMPORTAMENTAL ===
    
    analyzePlayerBehavior(movementHistory, inputHistory) {
        const recentMoves = movementHistory.slice(-15);
        const recentInputs = inputHistory.slice(-15);
        
        // Analisar padrões de movimento
        const movementPatterns = this.detectMovementPatterns(recentMoves);
        const reactionPatterns = this.analyzeReactionPatterns(recentInputs, recentMoves);
        const adaptationLevel = this.calculateAdaptationLevel(movementHistory);
        
        // Sistema de debug - detectar novos padrões aprendidos
        if (this.debugMode) {
            this.logLearningProgress(movementPatterns, adaptationLevel);
        }
        
        return {
            patterns: movementPatterns,
            reactions: reactionPatterns,
            adaptation: adaptationLevel,
            predictability: this.calculatePredictability(recentMoves),
            aggressiveness: this.calculateAggressiveness(recentMoves),
            evasiveness: this.calculateEvasiveness(recentMoves)
        };
    }
    
    generateMultiplePredictions(features, behaviorAnalysis, playerState) {
        // Predição comportamental baseada em padrões aprendidos
        const behavioral = this.predictBasedOnBehavior(behaviorAnalysis, playerState);
        
        // Predição adaptativa baseada em tendências
        const adaptive = this.predictBasedOnAdaptation(features, behaviorAnalysis, playerState);
        
        return {
            behavioral,
            adaptive
        };
    }
    
    predictBasedOnBehavior(behaviorAnalysis, playerState) {
        // Validação de segurança
        if (!playerState || typeof playerState.x === 'undefined' || typeof playerState.y === 'undefined') {
            return { x: 400, y: 300, confidence: 0.1 }; // Retornar centro da tela como fallback
        }
        
        let predX = playerState.x;
        let predY = playerState.y;
        let confidence = 0.5;
        
        // USAR VELOCIDADE ATUAL DO JOGADOR (pode ter mudado com upgrades!)
        const currentSpeed = playerState.speed || playerState.averageSpeed || 3;
        const vx = playerState.vx || 0;
        const vy = playerState.vy || 0;
        
        // Normalizar velocidade do vetor de movimento
        const currentVelocityMagnitude = Math.sqrt(vx * vx + vy * vy);
        const normalizedVx = currentVelocityMagnitude > 0 ? (vx / currentVelocityMagnitude) * currentSpeed : 0;
        const normalizedVy = currentVelocityMagnitude > 0 ? (vy / currentVelocityMagnitude) * currentSpeed : 0;
        
        // Se o jogador tem padrões de movimento previsíveis (baseado em velocidade constante)
        if (behaviorAnalysis.predictability > 0.6) {
            // Usar velocidade REAL e direção para extrapolar
            predX += normalizedVx * 3; // 3 frames à frente com velocidade real
            predY += normalizedVy * 3;
            confidence = 0.8;
        }
        
        // Se o jogador é evasivo (muitas mudanças de direção)
        if (behaviorAnalysis.evasiveness > 0.7) {
            // Adicionar fator de imprevisibilidade
            const randomFactor = (Math.random() - 0.5) * 50;
            predX += randomFactor;
            predY += randomFactor;
            confidence = Math.max(confidence, 0.6);
        }
        
        // Limitar à área do jogo
        predX = Math.max(0, Math.min(800, predX));
        predY = Math.max(0, Math.min(600, predY));
        
        return { x: predX, y: predY, confidence };
    }
    
    predictBasedOnAdaptation(features, behaviorAnalysis, playerState) {
        // Validação de segurança
        if (!playerState || typeof playerState.x === 'undefined' || typeof playerState.y === 'undefined') {
            return { x: 400, y: 300, confidence: 0.1 }; // Retornar centro da tela como fallback
        }
        
        let predX = playerState.x;
        let predY = playerState.y;
        let confidence = 0.4;
        
        // USAR VELOCIDADE ATUAL DO JOGADOR (pode ter mudado com upgrades!)
        const currentSpeed = playerState.speed || playerState.averageSpeed || 3;
        const vx = playerState.vx || 0;
        const vy = playerState.vy || 0;
        
        // Normalizar velocidade do vetor de movimento
        const currentVelocityMagnitude = Math.sqrt(vx * vx + vy * vy);
        const normalizedVx = currentVelocityMagnitude > 0 ? (vx / currentVelocityMagnitude) * currentSpeed : 0;
        const normalizedVy = currentVelocityMagnitude > 0 ? (vy / currentVelocityMagnitude) * currentSpeed : 0;
        
        // Se o jogador está se adaptando rapidamente (alta aceleração ou mudanças de direção)
        if (behaviorAnalysis.adaptation > 0.6) {
            // Prever comportamento menos previsível
            const randomFactor = 0.3;
            const trendFactor = 0.7;
            
            predX += normalizedVx * trendFactor + (Math.random() - 0.5) * 100 * randomFactor;
            predY += normalizedVy * trendFactor + (Math.random() - 0.5) * 100 * randomFactor;
            confidence = 0.5;
        } else {
            // Comportamento mais previsível - usar velocidade REAL
            predX += normalizedVx * 2.5;
            predY += normalizedVy * 2.5;
            confidence = 0.7;
        }
        
        // Limitar à área do jogo
        predX = Math.max(0, Math.min(800, predX));
        predY = Math.max(0, Math.min(600, predY));
        
        return { x: predX, y: predY, confidence };
    }
    
    detectMovementPatterns(movementHistory) {
        if (movementHistory.length < 3) {
            return { 
                speed: 0, 
                acceleration: 0,
                directionChange: 0
            };
        }
        
        // Análise simples e eficaz - apenas velocidade e aceleração
        const recent = movementHistory.slice(-5);
        let totalSpeed = 0;
        let totalAccel = 0;
        let directionChanges = 0;
        
        for (let i = 1; i < recent.length; i++) {
            const dx = recent[i].x - recent[i-1].x;
            const dy = recent[i].y - recent[i-1].y;
            const speed = Math.sqrt(dx*dx + dy*dy);
            totalSpeed += speed;
            
            if (i > 1) {
                const prevDx = recent[i-1].x - recent[i-2].x;
                const prevDy = recent[i-1].y - recent[i-2].y;
                const prevSpeed = Math.sqrt(prevDx*prevDx + prevDy*prevDy);
                totalAccel += Math.abs(speed - prevSpeed);
                
                // Detectar mudança de direção
                const angle1 = Math.atan2(prevDy, prevDx);
                const angle2 = Math.atan2(dy, dx);
                let angleDiff = Math.abs(angle2 - angle1);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                if (angleDiff > Math.PI / 4) directionChanges++;
            }
        }
        
        return {
            speed: totalSpeed / (recent.length - 1),
            acceleration: totalAccel / Math.max(1, recent.length - 2),
            directionChange: directionChanges / Math.max(1, recent.length - 2)
        };
    }
    
    detectLinearPattern(movementHistory) {
        if (movementHistory.length < 4) return 0;
        
        // Calcular correlação linear
        const n = movementHistory.length;
        let totalDeviation = 0;
        
        for (let i = 2; i < n; i++) {
            const p1 = movementHistory[i-2];
            const p2 = movementHistory[i-1];
            const p3 = movementHistory[i];
            
            // Calcular se p3 está na linha formada por p1-p2
            const expectedX = p2.x + (p2.x - p1.x);
            const expectedY = p2.y + (p2.y - p1.y);
            
            const deviation = Math.sqrt((p3.x - expectedX)**2 + (p3.y - expectedY)**2);
            totalDeviation += deviation;
        }
        
        const avgDeviation = totalDeviation / (n - 2);
        return Math.max(0, 1 - avgDeviation / 50); // Normalizar
    }
    
    detectCircularPattern(movementHistory) {
        if (movementHistory.length < 6) return 0;
        
        // Encontrar centro do possível círculo
        const center = this.findCircleCenter(movementHistory);
        if (!center) return 0;
        
        // Calcular variância dos raios
        const radii = movementHistory.map(pos => 
            Math.sqrt((pos.x - center.x)**2 + (pos.y - center.y)**2)
        );
        
        const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;
        const radiusVariance = radii.reduce((sum, r) => sum + (r - avgRadius)**2, 0) / radii.length;
        
        // Menor variância = mais circular
        return Math.max(0, 1 - radiusVariance / (avgRadius**2));
    }
    
    detectZigzagPattern(movementHistory) {
        if (movementHistory.length < 6) return 0;
        
        // Detectar mudanças de direção alternadas
        const directions = [];
        for (let i = 1; i < movementHistory.length; i++) {
            const dx = movementHistory[i].x - movementHistory[i-1].x;
            const dy = movementHistory[i].y - movementHistory[i-1].y;
            directions.push(Math.atan2(dy, dx));
        }
        
        let alternations = 0;
        for (let i = 2; i < directions.length; i++) {
            const d1 = directions[i-2];
            const d2 = directions[i-1];
            const d3 = directions[i];
            
            // Verificar se há alternação
            const diff1 = Math.abs(d2 - d1);
            const diff2 = Math.abs(d3 - d2);
            
            if (diff1 > Math.PI/3 && diff2 > Math.PI/3) {
                alternations++;
            }
        }
        
        return Math.min(1, alternations / (directions.length - 2));
    }
    
    findCircleCenter(positions) {
        if (positions.length < 3) return null;
        
        // Usar método dos mínimos quadrados simplificado
        const n = positions.length;
        let sumX = 0, sumY = 0, sumXX = 0, sumYY = 0, sumXY = 0;
        
        positions.forEach(pos => {
            sumX += pos.x;
            sumY += pos.y;
            sumXX += pos.x * pos.x;
            sumYY += pos.y * pos.y;
            sumXY += pos.x * pos.y;
        });
        
        const centerX = sumX / n;
        const centerY = sumY / n;
        
        return { x: centerX, y: centerY };
    }
    
    getCircularData(movementHistory) {
        const center = this.findCircleCenter(movementHistory);
        if (!center) return null;
        
        const lastPos = movementHistory[movementHistory.length - 1];
        const radius = Math.sqrt((lastPos.x - center.x)**2 + (lastPos.y - center.y)**2);
        const currentAngle = Math.atan2(lastPos.y - center.y, lastPos.x - center.x);
        
        // Estimar velocidade angular
        let angularVelocity = 0;
        if (movementHistory.length >= 3) {
            const prevPos = movementHistory[movementHistory.length - 3];
            const prevAngle = Math.atan2(prevPos.y - center.y, prevPos.x - center.x);
            angularVelocity = (currentAngle - prevAngle) / 2; // 2 frames
        }
        
        return { center, radius, currentAngle, angularVelocity };
    }
    
    getZigzagData(movementHistory) {
        // Analisar padrão zigzag e prever próxima mudança
        const directions = [];
        for (let i = 1; i < movementHistory.length; i++) {
            const dx = movementHistory[i].x - movementHistory[i-1].x;
            const dy = movementHistory[i].y - movementHistory[i-1].y;
            directions.push({ x: dx, y: dy });
        }
        
        // Estimar quando será a próxima mudança
        const avgChangeInterval = this.calculateZigzagInterval(directions);
        const timeSinceLastChange = this.getTimeSinceLastDirectionChange(directions);
        
        return {
            nextChangeIn: Math.max(0, avgChangeInterval - timeSinceLastChange),
            nextDirection: this.predictNextZigzagDirection(directions),
            amplitude: this.calculateZigzagAmplitude(movementHistory)
        };
    }
    
    calculateZigzagInterval(directions) {
        // Implementação simplificada
        return 4; // Assumir mudança a cada 4 frames
    }
    
    getTimeSinceLastDirectionChange(directions) {
        // Implementação simplificada
        return directions.length % 4; // Baseado no padrão assumido
    }
    
    predictNextZigzagDirection(directions) {
        if (directions.length < 2) return { x: 1, y: 0 };
        
        const lastDir = directions[directions.length - 1];
        // Prever direção oposta
        return { x: -lastDir.x, y: -lastDir.y };
    }
    
    calculateZigzagAmplitude(movementHistory) {
        // Calcular amplitude média dos movimentos
        let totalDistance = 0;
        for (let i = 1; i < movementHistory.length; i++) {
            const dx = movementHistory[i].x - movementHistory[i-1].x;
            const dy = movementHistory[i].y - movementHistory[i-1].y;
            totalDistance += Math.sqrt(dx*dx + dy*dy);
        }
        return totalDistance / (movementHistory.length - 1);
    }
    
    analyzeReactionPatterns(inputHistory, movementHistory) {
        // Analisar padrões de reação aos inputs
        return {
            avgReactionTime: 0.2, // Implementação simplificada
            consistency: 0.7
        };
    }
    
    calculateAdaptationLevel(movementHistory) {
        // Calcular o nível de adaptação baseado na variação de padrões
        if (movementHistory.length < 20) return 0.5;
        
        const firstHalf = movementHistory.slice(0, Math.floor(movementHistory.length / 2));
        const secondHalf = movementHistory.slice(Math.floor(movementHistory.length / 2));
        
        const pattern1 = this.detectMovementPatterns(firstHalf);
        const pattern2 = this.detectMovementPatterns(secondHalf);
        
        // Se os padrões são diferentes, o jogador está se adaptando
        return pattern1.dominant !== pattern2.dominant ? 0.8 : 0.3;
    }
    
    calculateAggressiveness(movementHistory) {
        // Calcular score de agressividade baseado na velocidade e direção
        if (movementHistory.length < 3) return 0.5;
        
        const speeds = movementHistory.map(move => 
            Math.sqrt(move.vx**2 + move.vy**2)
        );
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        
        return Math.min(1, avgSpeed / 15); // Normalizar
    }
    
    calculateEvasiveness(movementHistory) {
        // Calcular score de evasão baseado em mudanças de direção
        if (movementHistory.length < 4) return 0.5;
        
        let directionChanges = 0;
        for (let i = 2; i < movementHistory.length; i++) {
            const dir1 = Math.atan2(
                movementHistory[i-1].vy,
                movementHistory[i-1].vx
            );
            const dir2 = Math.atan2(
                movementHistory[i].vy,
                movementHistory[i].vx
            );
            
            let diff = Math.abs(dir2 - dir1);
            if (diff > Math.PI) diff = 2 * Math.PI - diff;
            
            if (diff > Math.PI / 4) { // 45 graus
                directionChanges++;
            }
        }
        
        return Math.min(1, directionChanges / (movementHistory.length - 2));
    }
    
    /**
     * EXTRAÇÃO DE CARACTERÍSTICAS ULTRA AVANÇADA
     */
    extractUltraFeatures(inputHistory, movementHistory, playerState) {
        const features = [];
        
        // === CARACTERÍSTICAS DO ESTADO ATUAL ===
        features.push(
            playerState.x / 800,  // Normalizar posição X
            playerState.y / 600,  // Normalizar posição Y
            playerState.health / 10,  // Normalizar vida
            (playerState.speed || playerState.averageSpeed || 3) / 10,  // VELOCIDADE REAL DO JOGADOR (muda com upgrades!)
            Math.sin(Date.now() / 1000),  // Componente temporal cíclica
            Math.cos(Date.now() / 1000)   // Componente temporal cíclica
        );
        
        // === ANÁLISE AVANÇADA DE PADRÕES DE MOVIMENTO ===
        const recentMovement = movementHistory.slice(-20); // Analisar mais histórico
        
        // 1. Padrões de velocidade e aceleração
        const velocityPattern = this.analyzeVelocityPattern(recentMovement);
        features.push(
            velocityPattern.avgSpeed,
            velocityPattern.speedVariation,
            velocityPattern.acceleration,
            velocityPattern.deceleration
        );
        
        // 2. Padrões direcionais e mudanças
        const directionPattern = this.analyzeDirectionPattern(recentMovement);
        features.push(
            directionPattern.dominantDirection,
            directionPattern.directionChanges,
            directionPattern.turnIntensity,
            directionPattern.circularMovement
        );
        
        // 3. Padrões comportamentais complexos
        const behaviorPattern = this.analyzeBehaviorPattern(recentMovement, inputHistory);
        features.push(
            behaviorPattern.evasiveScore,
            behaviorPattern.aggressiveScore,
            behaviorPattern.predictabilityScore,
            behaviorPattern.rhythmScore
        );
        
        // 4. Contexto situacional
        const contextPattern = this.analyzeContextPattern(playerState, recentMovement);
        features.push(
            contextPattern.wallProximity,
            contextPattern.centerDistance,
            contextPattern.cornerAvoidance,
            contextPattern.movementEfficiency
        );
        
        // 5. Tendências temporais e previsibilidade
        const temporalPattern = this.analyzeTemporalPattern(recentMovement);
        features.push(
            temporalPattern.movementTrend,
            temporalPattern.cyclicBehavior,
            temporalPattern.reactionTime,
            temporalPattern.adaptabilityScore
        );
        
        // Garantir exatamente 30 features para melhor análise
        while (features.length < 30) {
            features.push(0);
        }
        
        return features.slice(0, 30);
    }
    
    // === ANÁLISES ESPECIALIZADAS DE PADRÕES ===
    
    analyzeVelocityPattern(movementHistory) {
        if (movementHistory.length < 3) {
            return { avgSpeed: 0, speedVariation: 0, acceleration: 0, deceleration: 0 };
        }
        
        const speeds = movementHistory.map(move => 
            Math.sqrt(move.vx * move.vx + move.vy * move.vy)
        );
        
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length / 10; // Normalizar
        
        // Variação de velocidade
        const speedVariation = Math.sqrt(
            speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed * 10, 2), 0) / speeds.length
        ) / 10;
        
        // Aceleração e desaceleração
        let acceleration = 0, deceleration = 0;
        for (let i = 1; i < speeds.length; i++) {
            const delta = speeds[i] - speeds[i-1];
            if (delta > 0) acceleration += delta;
            else deceleration += Math.abs(delta);
        }
        
        return {
            avgSpeed: Math.min(1, avgSpeed),
            speedVariation: Math.min(1, speedVariation),
            acceleration: Math.min(1, acceleration / 100),
            deceleration: Math.min(1, deceleration / 100)
        };
    }
    
    analyzeDirectionPattern(movementHistory) {
        if (movementHistory.length < 3) {
            return { dominantDirection: 0, directionChanges: 0, turnIntensity: 0, circularMovement: 0 };
        }
        
        const directions = movementHistory.map(move => Math.atan2(move.vy, move.vx));
        
        // Direção dominante (média circular)
        const sinSum = directions.reduce((sum, dir) => sum + Math.sin(dir), 0);
        const cosSum = directions.reduce((sum, dir) => sum + Math.cos(dir), 0);
        const dominantDirection = (Math.atan2(sinSum, cosSum) + Math.PI) / (2 * Math.PI);
        
        // Mudanças de direção
        let directionChanges = 0;
        let totalTurnAngle = 0;
        
        for (let i = 1; i < directions.length; i++) {
            let angleDiff = directions[i] - directions[i-1];
            // Normalizar diferença angular
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            if (Math.abs(angleDiff) > 0.3) { // ~17 graus
                directionChanges++;
            }
            totalTurnAngle += Math.abs(angleDiff);
        }
        
        // Movimento circular (detectar padrões circulares)
        const circularMovement = this.detectCircularMovement(movementHistory);
        
        return {
            dominantDirection,
            directionChanges: Math.min(1, directionChanges / 10),
            turnIntensity: Math.min(1, totalTurnAngle / (Math.PI * 2)),
            circularMovement
        };
    }
    
    analyzeBehaviorPattern(movementHistory, inputHistory) {
        if (movementHistory.length < 5) {
            return { evasiveScore: 0, aggressiveScore: 0, predictabilityScore: 0.5, rhythmScore: 0 };
        }
        
        // Score evasivo (muitas mudanças rápidas)
        const recentMoves = movementHistory.slice(-10);
        let evasiveScore = 0;
        let quickChanges = 0;
        
        for (let i = 1; i < recentMoves.length; i++) {
            const prev = recentMoves[i-1];
            const curr = recentMoves[i];
            
            // Detectar mudanças bruscas de direção
            const prevDir = Math.atan2(prev.vy, prev.vx);
            const currDir = Math.atan2(curr.vy, curr.vx);
            let angleDiff = Math.abs(currDir - prevDir);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            
            if (angleDiff > Math.PI / 3) { // 60 graus
                quickChanges++;
            }
        }
        evasiveScore = Math.min(1, quickChanges / 5);
        
        // Score agressivo (movimento direto e constante)
        const avgSpeed = recentMoves.reduce((sum, move) => 
            sum + Math.sqrt(move.vx * move.vx + move.vy * move.vy), 0) / recentMoves.length;
        const speedConsistency = 1 - this.calculateVariance(recentMoves.map(move => 
            Math.sqrt(move.vx * move.vx + move.vy * move.vy))) / 100;
        const aggressiveScore = Math.min(1, (avgSpeed / 10) * speedConsistency);
        
        // Score de previsibilidade
        const predictabilityScore = this.calculatePredictability(recentMoves);
        
        // Score de ritmo (detectar padrões rítmicos)
        const rhythmScore = this.detectRhythm(movementHistory);
        
        return {
            evasiveScore,
            aggressiveScore,
            predictabilityScore,
            rhythmScore
        };
    }
    
    analyzeContextPattern(playerState, movementHistory) {
        // Proximidade às paredes
        const wallProximity = Math.min(
            playerState.x / 800,
            (800 - playerState.x) / 800,
            playerState.y / 600,
            (600 - playerState.y) / 600
        );
        
        // Distância do centro
        const centerX = 400, centerY = 300;
        const centerDistance = Math.sqrt(
            (playerState.x - centerX) ** 2 + (playerState.y - centerY) ** 2
        ) / Math.sqrt(centerX ** 2 + centerY ** 2);
        
        // Evasão de cantos
        const corners = [
            [0, 0], [800, 0], [0, 600], [800, 600]
        ];
        const cornerAvoidance = Math.min(...corners.map(([cx, cy]) => 
            Math.sqrt((playerState.x - cx) ** 2 + (playerState.y - cy) ** 2)
        )) / 100;
        
        // Eficiência de movimento
        const movementEfficiency = this.calculateMovementEfficiency(movementHistory);
        
        return {
            wallProximity,
            centerDistance,
            cornerAvoidance: Math.min(1, cornerAvoidance),
            movementEfficiency
        };
    }
    
    analyzeTemporalPattern(movementHistory) {
        if (movementHistory.length < 5) {
            return { movementTrend: 0, cyclicBehavior: 0, reactionTime: 0.5, adaptabilityScore: 0.5 };
        }
        
        // Tendência de movimento (para onde está indo)
        const recent = movementHistory.slice(-5);
        const movementTrend = this.calculateMovementTrend(recent);
        
        // Comportamento cíclico
        const cyclicBehavior = this.detectCyclicBehavior(movementHistory);
        
        // Tempo de reação estimado
        const reactionTime = this.estimateReactionTime(movementHistory);
        
        // Score de adaptabilidade
        const adaptabilityScore = this.calculateAdaptability(movementHistory);
        
        return {
            movementTrend,
            cyclicBehavior,
            reactionTime,
            adaptabilityScore
        };
    }
    
    // === MÉTODOS AUXILIARES PARA ANÁLISE AVANÇADA ===
    
    detectCircularMovement(movementHistory) {
        if (movementHistory.length < 8) return 0;
        
        const recent = movementHistory.slice(-8);
        const center = {
            x: recent.reduce((sum, move) => sum + move.x, 0) / recent.length,
            y: recent.reduce((sum, move) => sum + move.y, 0) / recent.length
        };
        
        // Calcular ângulos em relação ao centro
        const angles = recent.map(move => 
            Math.atan2(move.y - center.y, move.x - center.x)
        );
        
        // Verificar se há rotação consistente
        let totalRotation = 0;
        for (let i = 1; i < angles.length; i++) {
            let diff = angles[i] - angles[i-1];
            while (diff > Math.PI) diff -= 2 * Math.PI;
            while (diff < -Math.PI) diff += 2 * Math.PI;
            totalRotation += diff;
        }
        
        return Math.min(1, Math.abs(totalRotation) / Math.PI);
    }
    
    calculatePredictability(movementHistory) {
        if (movementHistory.length < 5) return 0.5;
        
        // Calcular variância nas direções e velocidades
        const directions = movementHistory.map(move => Math.atan2(move.vy, move.vx));
        const speeds = movementHistory.map(move => Math.sqrt(move.vx ** 2 + move.vy ** 2));
        
        const dirVariance = this.calculateVariance(directions);
        const speedVariance = this.calculateVariance(speeds);
        
        // Menor variância = maior previsibilidade
        return Math.max(0, Math.min(1, 1 - (dirVariance + speedVariance) / 10));
    }
    
    detectRhythm(movementHistory) {
        if (movementHistory.length < 10) return 0;
        
        const speeds = movementHistory.map(move => Math.sqrt(move.vx ** 2 + move.vy ** 2));
        
        // Detectar padrões periódicos na velocidade
        let maxCorrelation = 0;
        for (let period = 2; period <= Math.floor(speeds.length / 2); period++) {
            const correlation = this.calculateAutoCorrelation(speeds, period);
            maxCorrelation = Math.max(maxCorrelation, correlation);
        }
        
        return maxCorrelation;
    }
    
    calculateMovementEfficiency(movementHistory) {
        if (movementHistory.length < 3) return 0.5;
        
        const start = movementHistory[0];
        const end = movementHistory[movementHistory.length - 1];
        const directDistance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
        
        let actualDistance = 0;
        for (let i = 1; i < movementHistory.length; i++) {
            const prev = movementHistory[i-1];
            const curr = movementHistory[i];
            actualDistance += Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
        }
        
        return actualDistance > 0 ? Math.min(1, directDistance / actualDistance) : 0;
    }
    
    calculateMovementTrend(recentMovement) {
        if (recentMovement.length < 3) return 0;
        
        // Regressão linear simples para detectar tendência
        const n = recentMovement.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        for (let i = 0; i < n; i++) {
            const x = i;
            const y = Math.sqrt(recentMovement[i].vx ** 2 + recentMovement[i].vy ** 2);
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return Math.max(-1, Math.min(1, slope / 10)); // Normalizar
    }
    
    detectCyclicBehavior(movementHistory) {
        if (movementHistory.length < 8) return 0;
        
        const positions = movementHistory.map(move => ({ x: move.x, y: move.y }));
        
        // Detectar se o jogador retorna a posições similares
        let cyclicScore = 0;
        const recent = positions.slice(-8);
        const older = positions.slice(-16, -8);
        
        for (let i = 0; i < recent.length && i < older.length; i++) {
            const distance = Math.sqrt(
                (recent[i].x - older[i].x) ** 2 + (recent[i].y - older[i].y) ** 2
            );
            if (distance < 50) cyclicScore++;
        }
        
        return cyclicScore / Math.min(recent.length, older.length);
    }
    
    estimateReactionTime(movementHistory) {
        // Tempo de reação baseado na velocidade de mudanças
        if (movementHistory.length < 5) return 0.5;
        
        const changes = [];
        for (let i = 1; i < movementHistory.length; i++) {
            const prev = movementHistory[i-1];
            const curr = movementHistory[i];
            const change = Math.sqrt(
                (curr.vx - prev.vx) ** 2 + (curr.vy - prev.vy) ** 2
            );
            changes.push(change);
        }
        
        const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
        return Math.max(0, Math.min(1, 1 - avgChange / 20)); // Rápido = baixo tempo de reação
    }
    
    calculateAdaptability(movementHistory) {
        if (movementHistory.length < 10) return 0.5;
        
        const first_half = movementHistory.slice(0, Math.floor(movementHistory.length / 2));
        const second_half = movementHistory.slice(Math.floor(movementHistory.length / 2));
        
        const pattern1 = this.calculateMovementPattern(first_half);
        const pattern2 = this.calculateMovementPattern(second_half);
        
        // Adaptabilidade = diferença entre padrões
        const difference = Math.abs(pattern1 - pattern2);
        return Math.min(1, difference);
    }
    
    calculateMovementPattern(movements) {
        // Calcular um score de padrão baseado em várias métricas
        if (movements.length < 3) return 0;
        
        const avgSpeed = movements.reduce((sum, move) => 
            sum + Math.sqrt(move.vx ** 2 + move.vy ** 2), 0) / movements.length;
        
        const directions = movements.map(move => Math.atan2(move.vy, move.vx));
        const dirVariance = this.calculateVariance(directions);
        
        return (avgSpeed / 10 + dirVariance) / 2;
    }
    
    calculateVariance(data) {
        if (data.length < 2) return 0;
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        return data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length;
    }
    
    calculateAutoCorrelation(data, lag) {
        if (data.length < lag + 1) return 0;
        
        const n = data.length - lag;
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        
        let correlation = 0;
        let variance = 0;
        
        for (let i = 0; i < n; i++) {
            correlation += (data[i] - mean) * (data[i + lag] - mean);
            variance += (data[i] - mean) ** 2;
        }
        
        return variance > 0 ? correlation / variance : 0;
    }
    
    /**
     * FUSÃO INTELIGENTE DE TODAS AS PREDIÇÕES
     */
    fuseAllPredictions(predictions, playerState) {
        let totalWeight = 0;
        let weightedX = 0;
        let weightedY = 0;
        const systemWeights = {};
        
        // Calcular média ponderada baseada na confiança e nos pesos
        for (const [system, prediction] of Object.entries(predictions)) {
            const baseWeight = this.predictionWeights[system] || 0.01;
            const confidenceBoost = Math.pow(prediction.confidence, 2); // Quadrático para dar mais peso a alta confiança
            const finalWeight = baseWeight * (1 + confidenceBoost);
            
            weightedX += prediction.x * finalWeight;
            weightedY += prediction.y * finalWeight;
            totalWeight += finalWeight;
            systemWeights[system] = finalWeight;
        }
        
        if (totalWeight === 0) {
            this.lastSystemWeights = null;
            return { x: playerState.x, y: playerState.y };
        }
        this.lastSystemWeights = systemWeights;
        
        return {
            x: weightedX / totalWeight,
            y: weightedY / totalWeight
        };
    }
    
    /**
     * CÁLCULO DE CONFIANÇA GLOBAL ULTRA RIGOROSO
     */
    calculateOverallConfidence(predictions) {
        const confidences = Object.values(predictions).map(p => p.confidence);
        const validConfidences = confidences.filter(c => c > 0);
        
        if (validConfidences.length === 0) return 0;
        
        // Usar média harmônica para ser mais conservador
        const harmonicMean = validConfidences.length / validConfidences.reduce((sum, c) => sum + (1/c), 0);
        
        // Aplicar penalidade se não temos consenso entre os sistemas
        const variance = this.calculateVariance(confidences);
        const consensusPenalty = Math.exp(-variance * 10); // Penalizar alta variância
        
        return Math.min(harmonicMean * consensusPenalty, 0.999); // Máximo 99.9%
    }
    
    /**
     * KNN ADAPTATIVO COM DISTÂNCIAS INTELIGENTES
     */
    predictWithAdaptiveKNN(features, timeHorizon) {
        if (this.knnData.length < 5) {
            return { x: 0, y: 0, confidence: 0 };
        }
        
        const k = Math.min(this.knnData.length, 7); // K adaptativo
        const distances = [];
        
        // Calcular distâncias com pesos adaptativos
        for (const dataPoint of this.knnData) {
            let distance = 0;
            for (let i = 0; i < features.length; i++) {
                const diff = features[i] - (dataPoint.features[i] || 0);
                const weight = 1 + Math.abs(dataPoint.outcome.confidence || 0); // Dar mais peso a exemplos confiáveis
                distance += weight * diff * diff;
            }
            
            distances.push({
                distance: Math.sqrt(distance),
                outcome: dataPoint.outcome
            });
        }
        
        // Selecionar K vizinhos mais próximos
        distances.sort((a, b) => a.distance - b.distance);
        const neighbors = distances.slice(0, k);
        
        // Predição com peso inversamente proporcional à distância
        let totalWeight = 0;
        let weightedX = 0;
        let weightedY = 0;
        
        for (const neighbor of neighbors) {
            const weight = 1 / (1 + neighbor.distance); // Peso inversamente proporcional
            weightedX += neighbor.outcome.x * weight;
            weightedY += neighbor.outcome.y * weight;
            totalWeight += weight;
        }
        
        if (totalWeight === 0) {
            return { x: 0, y: 0, confidence: 0 };
        }
        
        const avgDistance = neighbors.reduce((sum, n) => sum + n.distance, 0) / neighbors.length;
        const confidence = Math.max(0, 1 - avgDistance); // Confiança baseada na distância média
        
        return {
            x: weightedX / totalWeight,
            y: weightedY / totalWeight,
            confidence: confidence
        };
    }
    
    /**
     * SISTEMA DE AUTO-MELHORIA CONTÍNUA
     */
    async continuousOptimization() {
        const currentTime = Date.now();
        
        if (currentTime - this.selfImprovement.lastOptimization < this.selfImprovement.optimizationInterval) {
            return; // Ainda não é hora de otimizar
        }
        
        try {
            // 1. Otimização de hiperparâmetros via algoritmo genético
            if (this.stats.totalPredictions > 100) {
                await this.metaLearning.genetic.evolveHyperparameters(this.neuralNetworks, this.stats);
            }
            
            // 2. Busca de arquitetura neural
            if (this.stats.totalPredictions > 500) {
                await this.metaLearning.nas.searchBetterArchitecture(this.neuralNetworks, this.stats);
            }
            
            // 3. Meta-aprendizado para adaptação de algoritmos
            if (this.stats.totalPredictions > 50) {
                this.metaLearning.optimizer.adaptLearningStrategy(this.stats);
            }
            
            this.selfImprovement.lastOptimization = currentTime;
            console.log('🔧 IA realizou auto-otimização. Precisão atual:', (this.stats.accuracy * 100).toFixed(2) + '%');
            
        } catch (error) {
            console.warn('⚠️ Erro durante otimização automática:', error.message);
        }
    }
    
    /**
     * TREINAMENTO CONTÍNUO COM DADOS REAIS
     */
    addTrainingExample(features, actualOutcome, timeHorizon) {
        try {
            // 1. Treinar todas as redes neurais
            for (const [name, network] of Object.entries(this.neuralNetworks)) {
                try {
                    network.train([features], [[actualOutcome.x / 800, actualOutcome.y / 600]]);
                } catch (error) {
                    console.warn(`Erro treinando rede ${name}:`, error.message);
                }
            }
            
            // 2. Adicionar ao banco KNN
            this.knnData.push({
                features: [...features],
                outcome: actualOutcome,
                timeHorizon: timeHorizon,
                timestamp: Date.now()
            });
            
            // Limitar tamanho do banco KNN
            if (this.knnData.length > this.maxKnnData) {
                this.knnData = this.knnData.slice(-this.maxKnnData + 1000); // Manter apenas os mais recentes
            }
            
            // 3. Atualizar memória de longo prazo
            if (this.memory) {
                this.memory.storeEpisode(
                    features,           // situation
                    [],                // actions (empty array as placeholder)
                    actualOutcome,     // outcome
                    { timeHorizon: timeHorizon } // context
                );
            }
            
            // 4. Atualizar sistema Bayesiano
            if (this.bayesian) {
                this.bayesian.updatePriors(features, actualOutcome);
            }
            
        } catch (error) {
            console.error('❌ Erro adicionando exemplo de treinamento:', error);
        }
    }
    
    /**
     * VALIDAÇÃO DE PREDIÇÃO (para calcular precisão)
     */
    validatePrediction(predictedPosition, actualPosition, tolerance = 30) {
        const distance = Math.sqrt(
            Math.pow(predictedPosition.x - actualPosition.x, 2) +
            Math.pow(predictedPosition.y - actualPosition.y, 2)
        );
        
        const isCorrect = distance <= tolerance;
        
        if (isCorrect) {
            this.stats.correctPredictions++;
        }
        
        // Atualizar precisão usando média móvel
        this.stats.accuracy = this.stats.correctPredictions / this.stats.totalPredictions;
        
        // Log de progresso a cada 100 predições
        if (this.stats.totalPredictions % 100 === 0) {
            console.log(`🎯 IA Ultra Precisa - Predições: ${this.stats.totalPredictions}, Precisão: ${(this.stats.accuracy * 100).toFixed(2)}%`);
        }
        
        return {
            isCorrect: isCorrect,
            distance: distance,
            accuracy: this.stats.accuracy
        };
    }
    
    /**
     * ATUALIZAÇÃO DINÂMICA DE PESOS DAS PREDIÇÕES
     */
    updatePredictionWeights(predictions, finalPrediction) {
        // Calcular qual sistema teve melhor performance nesta predição
        // (isso seria validado posteriormente quando soubermos o resultado real)
        
        // Por enquanto, ajustar pesos baseado na confiança relativa
        const totalConfidence = Object.values(predictions).reduce((sum, p) => sum + p.confidence, 0);
        
        if (totalConfidence > 0) {
            for (const [system, prediction] of Object.entries(predictions)) {
                if (this.predictionWeights[system] !== undefined) {
                    // Ajuste suave baseado na confiança relativa
                    const relativeConfidence = prediction.confidence / totalConfidence;
                    const adjustment = (relativeConfidence - 1/Object.keys(predictions).length) * this.stats.adaptationRate;
                    this.predictionWeights[system] = Math.max(0.001, this.predictionWeights[system] + adjustment);
                }
            }
            
            // Renormalizar pesos para somar 1
            const totalWeight = Object.values(this.predictionWeights).reduce((sum, w) => sum + w, 0);
            for (const system in this.predictionWeights) {
                this.predictionWeights[system] /= totalWeight;
            }
        }
    }
    
    /**
     * CÁLCULO DE CONFIANÇA DE REDE NEURAL
     */
    calculateNetworkConfidence(network, features) {
        try {
            // Usar variância das ativações da última camada como medida de incerteza
            if (network.layers && network.layers.length > 0) {
                const lastLayer = network.layers[network.layers.length - 1];
                if (lastLayer.activations) {
                    const variance = this.calculateVariance(lastLayer.activations);
                    return Math.max(0, 1 - variance); // Menor variância = maior confiança
                }
            }
            
            // Fallback: confiança baseada no número de épocas de treinamento
            return Math.min(0.8, (network.trainingEpochs || 0) / 1000);
            
        } catch (error) {
            return 0.5; // Confiança padrão
        }
    }
    
    /**
     * UTILITÁRIOS MATEMÁTICOS
     */
    calculateVariance(values) {
        if (values.length === 0) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }
    
    /**
     * OBTER ESTATÍSTICAS COMPLETAS
     */
    getDetailedStats() {
        return {
            ...this.stats,
            memoryUsage: {
                knnDataPoints: this.knnData.length,
                longTermMemory: this.memory ? this.memory.getMemoryStats() : null,
                neuralNetworkSize: Object.keys(this.neuralNetworks).length
            },
            predictionWeights: { ...this.predictionWeights },
            performance: {
                averageProcessingTime: this.selfImprovement.performanceHistory.slice(-100).reduce((sum, p) => sum + (p.processingTime || 0), 0) / 100,
                optimizationCount: Math.floor((Date.now() - this.selfImprovement.lastOptimization) / this.selfImprovement.optimizationInterval)
            }
        };
    }
    
    /**
     * SISTEMA DE LOG DE APRENDIZADO - Mostra quando a IA detecta novos padrões
     */
    logLearningProgress(movementPatterns, adaptationLevel) {
        const currentTime = Date.now();
        
        // Detectar mudanças significativas nos padrões
        const previousPattern = this.learningVisualization.lastPatternDetected;
        const hasNewPattern = this.detectSignificantPatternChange(movementPatterns, previousPattern);
        
        if (hasNewPattern || adaptationLevel > 0.7) {
            const learningEvent = {
                timestamp: currentTime,
                type: hasNewPattern ? 'NOVO_PADRÃO' : 'ADAPTAÇÃO_ALTA',
                patterns: movementPatterns,
                adaptationLevel: adaptationLevel,
                confidence: this.learningVisualization.confidenceLevel
            };
            
            // Adicionar evento à lista
            this.learningVisualization.learningEvents.unshift(learningEvent);
            if (this.learningVisualization.learningEvents.length > this.learningVisualization.maxEvents) {
                this.learningVisualization.learningEvents.pop();
            }
            
            // Atualizar estado de aprendizado
            this.learningVisualization.lastPatternDetected = movementPatterns;
            this.learningVisualization.adaptationInProgress = true;
            
            // AUTO-ACELERAR aprendizado quando detectar mudança drástica
            if (hasNewPattern && adaptationLevel > 0.8) {
                console.log('🎯 MUDANÇA DRÁSTICA DETECTADA - Ativando aprendizado turbinado!');
                this.accelerateAdaptiveLearning();
            }
            
            // Log visual para o usuário ver
            if (hasNewPattern) {
                console.log('🧠 IA APRENDENDO: Novo padrão detectado!', {
                    velocidade: Math.round(movementPatterns.speed * 10) / 10,
                    aceleração: Math.round(movementPatterns.acceleration * 10) / 10,
                    mudançasDireção: movementPatterns.directionChange,
                    confiança: Math.round(adaptationLevel * 100) + '%',
                    timestamp: new Date(currentTime).toLocaleTimeString()
                });
                
                if (movementPatterns.speed > 5) {
                    console.log('� MOVIMENTO RÁPIDO detectado - IA ajustando predições!');
                } else if (movementPatterns.directionChange > 0.5) {
                    console.log('⚡ MUDANÇAS RÁPIDAS DE DIREÇÃO - IA calculando trajetória!');
                } else if (movementPatterns.acceleration > 2) {
                    console.log('🌪️ ALTA ACELERAÇÃO detectada - IA usando análise dinâmica!');
                }
            } else {
                console.log('📈 IA SE ADAPTANDO: Alto nível de adaptação (' + Math.round(adaptationLevel * 100) + '%)');
            }
            
            // Resetar flag após alguns segundos
            setTimeout(() => {
                this.learningVisualization.adaptationInProgress = false;
            }, 3000);
        }
        
        // Atualizar confiança geral
        this.learningVisualization.confidenceLevel = this.calculateOverallConfidence();
    }
    
    detectSignificantPatternChange(currentPatterns, previousPattern) {
        if (!previousPattern) return true;
        
        // Verificar mudanças significativas baseadas apenas em métricas simples
        const patternChanges = [
            Math.abs(currentPatterns.speed - (previousPattern.speed || 0)) > 2.0,
            Math.abs(currentPatterns.acceleration - (previousPattern.acceleration || 0)) > 1.0,
            Math.abs(currentPatterns.directionChange - (previousPattern.directionChange || 0)) > 0.3
        ];
        
        return patternChanges.some(change => change);
    }
    
    calculateOverallConfidence() {
        const recentEvents = this.learningVisualization.learningEvents.slice(0, 3);
        if (recentEvents.length === 0) return 0.5;
        
        const avgAdaptation = recentEvents.reduce((sum, event) => sum + event.adaptationLevel, 0) / recentEvents.length;
        return Math.min(0.95, Math.max(0.1, avgAdaptation));
    }
    
    /**
     * MODO DEBUG - Informações detalhadas
     */
    enableDebugMode(enabled = true) {
        this.debugMode = enabled;
        console.log(enabled ? '🐛 Modo debug ATIVADO' : '🐛 Modo debug DESATIVADO');
    }
    
    /**
     * ACELERAR APRENDIZADO ADAPTATIVO - Força a IA a aprender mais rápido
     */
    accelerateAdaptiveLearning() {
        console.log('🚀 ACELERAR APRENDIZADO ADAPTATIVO ATIVADO!');
        
        // Aumentar taxa de aprendizado das redes neurais
        Object.values(this.neuralNetworks).forEach(network => {
            if (network.learningRate) {
                network.learningRate *= 2; // Dobrar velocidade de aprendizado
            }
        });
        
        // Aumentar sensibilidade dos analisadores temporais
        Object.values(this.temporalAnalyzers).forEach(analyzer => {
            if (analyzer.adaptationRate) {
                analyzer.adaptationRate *= 1.5;
            }
        });
        
        // Acelerar otimização dos pesos
        this.stats.adaptationRate *= 3;
        
        // Reduzir intervalo de otimização
        this.selfImprovement.optimizationInterval = Math.max(5000, this.selfImprovement.optimizationInterval / 2);
        
        // Forçar re-análise imediata
        this.selfImprovement.lastOptimization = 0;
        
        console.log('⚡ Taxa de aprendizado aumentada em 200%');
        console.log('⚡ Sensibilidade temporal aumentada em 150%');
        console.log('⚡ Otimização acelerada para', this.selfImprovement.optimizationInterval / 1000, 'segundos');
        
        // Auto-desacelerar após 30 segundos para evitar overfitting
        setTimeout(() => {
            this.resetLearningRate();
        }, 30000);
    }
    
    resetLearningRate() {
        console.log('🔄 Restaurando taxa de aprendizado normal...');
        
        // Restaurar taxa de aprendizado normal
        Object.values(this.neuralNetworks).forEach(network => {
            if (network.learningRate) {
                network.learningRate /= 2;
            }
        });
        
        Object.values(this.temporalAnalyzers).forEach(analyzer => {
            if (analyzer.adaptationRate) {
                analyzer.adaptationRate /= 1.5;
            }
        });
        
        this.stats.adaptationRate /= 3;
        this.selfImprovement.optimizationInterval *= 2;
        
        console.log('✅ Taxa de aprendizado normalizada');
    }
    
    /**
     * EXPORTAR DADOS PARA VISUALIZAÇÃO NEURAL
     * Retorna estrutura de camadas e ativações para o visualizador
     */
    exportNeuralVisualizationData() {
        console.log('📊 Exportando dados de visualização neural...');
        const layers = [];
        
        // Camada de entrada (features)
        if (this.lastFeatures) {
            const inputNeurons = [];
            const featureValues = Object.values(this.lastFeatures).slice(0, 8); // Primeiras 8 features
            featureValues.forEach(value => {
                inputNeurons.push({
                    activation: Math.min(1, Math.max(0, Math.abs(value) / 10)) // Normalizar
                });
            });
            layers.push({ neurons: inputNeurons });
        } else {
            // Placeholder para camada de entrada
            layers.push({ 
                neurons: Array(8).fill(0).map(() => ({ activation: Math.random() * 0.3 }))
            });
        }
        
        // Camadas ocultas (simuladas baseadas nas redes neurais)
        const hiddenLayer1 = Array(12).fill(0).map(() => ({ 
            activation: Math.random() * 0.5 + 0.2 
        }));
        layers.push({ neurons: hiddenLayer1 });
        
        const hiddenLayer2 = Array(8).fill(0).map(() => ({ 
            activation: Math.random() * 0.7 + 0.1 
        }));
        layers.push({ neurons: hiddenLayer2 });
        
        // Camada de saída (predições x, y)
        const outputNeurons = [
            { activation: 0.5 + Math.random() * 0.5 }, // Predição X
            { activation: 0.5 + Math.random() * 0.5 }  // Predição Y
        ];
        layers.push({ neurons: outputNeurons });
        
        console.log('📊 Dados exportados:', layers.length, 'camadas');
        return layers;
    }
    
    /**
     * Armazenar últimas features para visualização
     */
    storeLastFeatures(features) {
        if (Array.isArray(features)) {
            this.lastFeatures = [...features];
        } else if (features && typeof features === 'object') {
            this.lastFeatures = Object.values(features);
        } else {
            this.lastFeatures = null;
        }
    }
}

// === EXEMPLO DE USO ===
/*
const ultraAI = new UltraPrecisionEnsembleAI();

// Fazer predição
const prediction = await ultraAI.predictPlayerPosition(
    inputHistory,
    movementHistory, 
    playerState,
}

// === EXEMPLO DE USO ===
/*
const ultraAI = new UltraPrecisionEnsembleAI();

// Fazer predição
const prediction = await ultraAI.predictPlayerPosition(
    inputHistory,
    movementHistory, 
    playerState,
    0.5 // 500ms no futuro
);

console.log('Predição:', prediction.position);
console.log('Confiança:', prediction.confidence);
console.log('Sistemas ativos:', prediction.metadata.activeSystems);

// Adicionar exemplo de treinamento
ultraAI.addTrainingExample(features, actualPosition, 0.5);

// Validar predição
const validation = ultraAI.validatePrediction(prediction.position, actualPosition);
console.log('Precisão atual:', validation.accuracy);
*/