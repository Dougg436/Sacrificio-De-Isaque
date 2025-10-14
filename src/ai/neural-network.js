// SISTEMA DE IA EXTREMAMENTE AVANÇADO - REDE NEURAL PROFUNDA
// Implementação completa com backpropagation, dropout, batch normalization, etc.

// Função de ativação ReLU e derivada
function relu(x) {
    return Math.max(0, x);
}

function reluDerivative(x) {
    return x > 0 ? 1 : 0;
}

// Função de ativação Leaky ReLU
function leakyRelu(x, alpha = 0.01) {
    return x > 0 ? x : alpha * x;
}

function leakyReluDerivative(x, alpha = 0.01) {
    return x > 0 ? 1 : alpha;
}

// Função softmax para classificação
function softmax(arr) {
    const max = Math.max(...arr);
    const exp = arr.map(x => Math.exp(x - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(x => x / sum);
}

// Inicialização Xavier/Glorot
function xavierInitialization(fanIn, fanOut) {
    const bound = Math.sqrt(6.0 / (fanIn + fanOut));
    return (Math.random() - 0.5) * 2 * bound;
}

// Inicialização He
function heInitialization(fanIn) {
    return Math.random() * Math.sqrt(2.0 / fanIn) - Math.sqrt(2.0 / fanIn) / 2;
}

// Camada densa (fully connected)
class DenseLayer {
    constructor(inputSize, outputSize, activation = 'relu', dropoutRate = 0.0, useBatchNorm = false) {
        this.inputSize = inputSize;
        this.outputSize = outputSize;
        this.activation = activation;
        this.dropoutRate = dropoutRate;
        this.useBatchNorm = useBatchNorm;
        this.training = true;
        
        // Inicializar pesos com He initialization para ReLU
        this.weights = [];
        for (let i = 0; i < inputSize; i++) {
            this.weights[i] = [];
            for (let j = 0; j < outputSize; j++) {
                this.weights[i][j] = heInitialization(inputSize);
            }
        }
        
        // Bias inicializados com zero
        this.bias = new Array(outputSize).fill(0);
        
        // Para backpropagation
        this.lastInput = null;
        this.lastOutput = null;
        this.lastActivation = null;
        this.dropoutMask = null;
        
        // Para batch normalization
        if (useBatchNorm) {
            this.gamma = new Array(outputSize).fill(1);
            this.beta = new Array(outputSize).fill(0);
            this.runningMean = new Array(outputSize).fill(0);
            this.runningVar = new Array(outputSize).fill(1);
            this.momentum = 0.9;
        }
        
        // Para otimização Adam
        this.mWeights = this.weights.map(row => row.map(() => 0));
        this.vWeights = this.weights.map(row => row.map(() => 0));
        this.mBias = new Array(outputSize).fill(0);
        this.vBias = new Array(outputSize).fill(0);
        this.t = 0; // time step para Adam
    }
    
    forward(input) {
        this.lastInput = [...input];
        
        // Linear transformation: output = input * weights + bias
        const output = [];
        for (let j = 0; j < this.outputSize; j++) {
            let sum = this.bias[j];
            for (let i = 0; i < this.inputSize; i++) {
                sum += input[i] * this.weights[i][j];
            }
            output[j] = sum;
        }
        
        // Batch normalization
        let normalizedOutput = output;
        if (this.useBatchNorm) {
            normalizedOutput = this.batchNormalize(output);
        }
        
        // Aplicar função de ativação
        const activated = this.applyActivation(normalizedOutput);
        this.lastActivation = [...activated];
        
        // Dropout durante treinamento
        let finalOutput = activated;
        if (this.training && this.dropoutRate > 0) {
            this.dropoutMask = [];
            finalOutput = [];
            for (let i = 0; i < activated.length; i++) {
                const keep = Math.random() > this.dropoutRate;
                this.dropoutMask[i] = keep;
                finalOutput[i] = keep ? activated[i] / (1 - this.dropoutRate) : 0;
            }
        }
        
        this.lastOutput = [...finalOutput];
        return finalOutput;
    }
    
    batchNormalize(input) {
        // Batch normalization simplificada para um único exemplo
        const output = [];
        const epsilon = 1e-8;
        
        for (let i = 0; i < input.length; i++) {
            // Normalizar usando running statistics
            const normalized = (input[i] - this.runningMean[i]) / Math.sqrt(this.runningVar[i] + epsilon);
            output[i] = this.gamma[i] * normalized + this.beta[i];
            
            // Atualizar running statistics durante treinamento
            if (this.training) {
                this.runningMean[i] = this.momentum * this.runningMean[i] + (1 - this.momentum) * input[i];
                this.runningVar[i] = this.momentum * this.runningVar[i] + (1 - this.momentum) * Math.pow(input[i] - this.runningMean[i], 2);
            }
        }
        
        return output;
    }
    
    applyActivation(input) {
        const output = [];
        for (let i = 0; i < input.length; i++) {
            switch (this.activation) {
                case 'relu':
                    output[i] = relu(input[i]);
                    break;
                case 'leaky_relu':
                    output[i] = leakyRelu(input[i]);
                    break;
                case 'tanh':
                    output[i] = Math.tanh(input[i]);
                    break;
                case 'sigmoid':
                    output[i] = 1 / (1 + Math.exp(-input[i]));
                    break;
                case 'softmax':
                    return softmax(input);
                case 'linear':
                default:
                    output[i] = input[i];
                    break;
            }
        }
        return output;
    }
    
    backward(gradients, learningRate = 0.001, beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8) {
        if (!this.lastInput || !this.lastOutput || !this.lastActivation) return gradients;
        
        // Aplicar dropout mask nos gradientes
        let outputGradients = [...gradients];
        if (this.training && this.dropoutRate > 0 && this.dropoutMask) {
            for (let i = 0; i < outputGradients.length; i++) {
                outputGradients[i] *= this.dropoutMask[i] ? 1 / (1 - this.dropoutRate) : 0;
            }
        }
        
        // Gradientes da função de ativação
        const activationGradients = [];
        for (let i = 0; i < outputGradients.length; i++) {
            let derivative = 1;
            switch (this.activation) {
                case 'relu':
                    derivative = reluDerivative(this.lastActivation[i]);
                    break;
                case 'leaky_relu':
                    derivative = leakyReluDerivative(this.lastActivation[i]);
                    break;
                case 'tanh':
                    derivative = 1 - this.lastActivation[i] * this.lastActivation[i];
                    break;
                case 'sigmoid':
                    derivative = this.lastActivation[i] * (1 - this.lastActivation[i]);
                    break;
                case 'linear':
                default:
                    derivative = 1;
                    break;
            }
            activationGradients[i] = outputGradients[i] * derivative;
        }
        
        this.t++; // Incrementar time step para Adam
        
        // Calcular gradientes dos pesos e atualizar com Adam
        const inputGradients = new Array(this.inputSize).fill(0);
        
        for (let i = 0; i < this.inputSize; i++) {
            for (let j = 0; j < this.outputSize; j++) {
                const gradient = activationGradients[j] * this.lastInput[i];
                
                // Adam optimizer para pesos
                this.mWeights[i][j] = beta1 * this.mWeights[i][j] + (1 - beta1) * gradient;
                this.vWeights[i][j] = beta2 * this.vWeights[i][j] + (1 - beta2) * gradient * gradient;
                
                const mHat = this.mWeights[i][j] / (1 - Math.pow(beta1, this.t));
                const vHat = this.vWeights[i][j] / (1 - Math.pow(beta2, this.t));
                
                this.weights[i][j] -= learningRate * mHat / (Math.sqrt(vHat) + epsilon);
                
                // Acumular gradientes para a camada anterior
                inputGradients[i] += activationGradients[j] * this.weights[i][j];
            }
        }
        
        // Atualizar bias com Adam
        for (let j = 0; j < this.outputSize; j++) {
            const gradient = activationGradients[j];
            
            this.mBias[j] = beta1 * this.mBias[j] + (1 - beta1) * gradient;
            this.vBias[j] = beta2 * this.vBias[j] + (1 - beta2) * gradient * gradient;
            
            const mHat = this.mBias[j] / (1 - Math.pow(beta1, this.t));
            const vHat = this.vBias[j] / (1 - Math.pow(beta2, this.t));
            
            this.bias[j] -= learningRate * mHat / (Math.sqrt(vHat) + epsilon);
        }
        
        return inputGradients;
    }
    
    setTraining(training) {
        this.training = training;
    }
}

// Rede Neural Profunda com múltiplas camadas
export class DeepNeuralNetwork {
    constructor(architecture, learningRate = 0.001, useBatchNorm = true) {
        this.layers = [];
        this.learningRate = learningRate;
        this.architecture = architecture;
        
        // Construir camadas baseado na arquitetura
        for (let i = 0; i < architecture.length - 1; i++) {
            const layer = architecture[i];
            const nextLayer = architecture[i + 1];
            
            const denseLayer = new DenseLayer(
                layer.size,
                nextLayer.size,
                nextLayer.activation || 'relu',
                nextLayer.dropout || 0.0,
                useBatchNorm && i < architecture.length - 2 // Não usar batch norm na última camada
            );
            
            this.layers.push(denseLayer);
        }
        
        // Estatísticas de treinamento
        this.trainingLoss = [];
        this.validationLoss = [];
        this.epoch = 0;
    }
    
    forward(input) {
        let output = input;
        for (const layer of this.layers) {
            output = layer.forward(output);
        }
        return output;
    }
    
    backward(target) {
        const output = this.forward(this.getLastInput());
        
        // Calcular erro da saída
        const outputError = [];
        for (let i = 0; i < output.length; i++) {
            outputError[i] = target[i] - output[i];
        }
        
        // Backpropagation através das camadas
        let gradients = outputError.map(x => -x); // Negativo porque queremos minimizar o erro
        
        for (let i = this.layers.length - 1; i >= 0; i--) {
            gradients = this.layers[i].backward(gradients, this.learningRate);
        }
        
        // Calcular loss
        const loss = this.calculateLoss(output, target);
        this.trainingLoss.push(loss);
        
        return loss;
    }
    
    calculateLoss(predicted, target) {
        // Mean Squared Error
        let sum = 0;
        for (let i = 0; i < predicted.length; i++) {
            sum += Math.pow(predicted[i] - target[i], 2);
        }
        return sum / predicted.length;
    }
    
    train(inputs, targets, epochs = 100, batchSize = 32, validationData = null) {
        for (let epoch = 0; epoch < epochs; epoch++) {
            this.epoch = epoch;
            
            // Embaralhar dados
            const shuffled = this.shuffleData(inputs, targets);
            
            let epochLoss = 0;
            let batchCount = 0;
            
            // Treinar em batches
            for (let i = 0; i < shuffled.inputs.length; i += batchSize) {
                const batchInputs = shuffled.inputs.slice(i, i + batchSize);
                const batchTargets = shuffled.targets.slice(i, i + batchSize);
                
                let batchLoss = 0;
                
                // Modo treinamento
                this.setTraining(true);
                
                for (let j = 0; j < batchInputs.length; j++) {
                    this.setLastInput(batchInputs[j]);
                    const loss = this.backward(batchTargets[j]);
                    batchLoss += loss;
                }
                
                epochLoss += batchLoss / batchInputs.length;
                batchCount++;
            }
            
            epochLoss /= batchCount;
            
            // Validação
            if (validationData && epoch % 10 === 0) {
                this.setTraining(false);
                const valLoss = this.validate(validationData.inputs, validationData.targets);
                this.validationLoss.push(valLoss);
                
                if (epoch % 50 === 0) {
                    console.log(`Epoch ${epoch}: Training Loss = ${epochLoss.toFixed(6)}, Validation Loss = ${valLoss.toFixed(6)}`);
                }
            }
        }
    }
    
    validate(inputs, targets) {
        let totalLoss = 0;
        
        for (let i = 0; i < inputs.length; i++) {
            const predicted = this.forward(inputs[i]);
            const loss = this.calculateLoss(predicted, targets[i]);
            totalLoss += loss;
        }
        
        return totalLoss / inputs.length;
    }
    
    shuffleData(inputs, targets) {
        const indices = Array.from({length: inputs.length}, (_, i) => i);
        
        // Fisher-Yates shuffle
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        return {
            inputs: indices.map(i => inputs[i]),
            targets: indices.map(i => targets[i])
        };
    }
    
    setTraining(training) {
        for (const layer of this.layers) {
            layer.setTraining(training);
        }
    }
    
    setLastInput(input) {
        this.lastInput = input;
    }
    
    getLastInput() {
        return this.lastInput;
    }
    
    predict(input) {
        this.setTraining(false);
        return this.forward(input);
    }
    
    // Salvar modelo
    serialize() {
        return {
            architecture: this.architecture,
            learningRate: this.learningRate,
            layers: this.layers.map(layer => ({
                weights: layer.weights,
                bias: layer.bias,
                inputSize: layer.inputSize,
                outputSize: layer.outputSize,
                activation: layer.activation,
                dropoutRate: layer.dropoutRate,
                useBatchNorm: layer.useBatchNorm,
                gamma: layer.gamma,
                beta: layer.beta,
                runningMean: layer.runningMean,
                runningVar: layer.runningVar
            })),
            trainingLoss: this.trainingLoss,
            validationLoss: this.validationLoss,
            epoch: this.epoch
        };
    }
    
    // Carregar modelo
    deserialize(data) {
        this.architecture = data.architecture;
        this.learningRate = data.learningRate;
        this.trainingLoss = data.trainingLoss || [];
        this.validationLoss = data.validationLoss || [];
        this.epoch = data.epoch || 0;
        
        this.layers = [];
        for (let i = 0; i < data.layers.length; i++) {
            const layerData = data.layers[i];
            const layer = new DenseLayer(
                layerData.inputSize,
                layerData.outputSize,
                layerData.activation,
                layerData.dropoutRate,
                layerData.useBatchNorm
            );
            
            layer.weights = layerData.weights;
            layer.bias = layerData.bias;
            if (layerData.gamma) layer.gamma = layerData.gamma;
            if (layerData.beta) layer.beta = layerData.beta;
            if (layerData.runningMean) layer.runningMean = layerData.runningMean;
            if (layerData.runningVar) layer.runningVar = layerData.runningVar;
            
            this.layers.push(layer);
        }
    }
}

// Sistema KNN melhorado com múltiplas métricas de distância
export class AdvancedKNN {
    constructor(k = 5, distanceMetric = 'euclidean') {
        this.k = k;
        this.distanceMetric = distanceMetric;
        this.data = [];
        this.featureWeights = null;
    }
    
    addData(features, label, weight = 1.0) {
        this.data.push({ 
            features: [...features], 
            label, 
            weight,
            timestamp: Date.now()
        });
        
        // Manter apenas os dados mais recentes
        if (this.data.length > 2000) {
            this.data.sort((a, b) => b.timestamp - a.timestamp);
            this.data = this.data.slice(0, 1500);
        }
    }
    
    calculateDistance(a, b) {
        switch (this.distanceMetric) {
            case 'euclidean':
                return this.euclideanDistance(a, b);
            case 'manhattan':
                return this.manhattanDistance(a, b);
            case 'cosine':
                return this.cosineDistance(a, b);
            case 'weighted':
                return this.weightedEuclideanDistance(a, b);
            default:
                return this.euclideanDistance(a, b);
        }
    }
    
    euclideanDistance(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            sum += Math.pow(a[i] - b[i], 2);
        }
        return Math.sqrt(sum);
    }
    
    manhattanDistance(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            sum += Math.abs(a[i] - b[i]);
        }
        return sum;
    }
    
    cosineDistance(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        return 1 - (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)));
    }
    
    weightedEuclideanDistance(a, b) {
        if (!this.featureWeights) return this.euclideanDistance(a, b);
        
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            const weight = this.featureWeights[i] || 1;
            sum += weight * Math.pow(a[i] - b[i], 2);
        }
        return Math.sqrt(sum);
    }
    
    predict(features) {
        if (this.data.length === 0) return null;
        
        const distances = this.data.map(point => ({
            distance: this.calculateDistance(features, point.features),
            label: point.label,
            weight: point.weight,
            timestamp: point.timestamp
        }));
        
        distances.sort((a, b) => a.distance - b.distance);
        
        const kNearest = distances.slice(0, Math.min(this.k, distances.length));
        
        // Votação ponderada por distância e peso do exemplo
        const votes = {};
        kNearest.forEach(point => {
            const distanceWeight = 1 / (point.distance + 1e-8);
            const totalWeight = distanceWeight * point.weight;
            votes[point.label] = (votes[point.label] || 0) + totalWeight;
        });
        
        let maxVotes = 0;
        let prediction = null;
        for (const label in votes) {
            if (votes[label] > maxVotes) {
                maxVotes = votes[label];
                prediction = label;
            }
        }
        
        return prediction;
    }
    
    getConfidence(features) {
        if (this.data.length === 0) return 0;
        
        const distances = this.data.map(point => ({
            distance: this.calculateDistance(features, point.features),
            label: point.label,
            weight: point.weight
        }));
        
        distances.sort((a, b) => a.distance - b.distance);
        const kNearest = distances.slice(0, Math.min(this.k, distances.length));
        
        const votes = {};
        kNearest.forEach(point => {
            const distanceWeight = 1 / (point.distance + 1e-8);
            const totalWeight = distanceWeight * point.weight;
            votes[point.label] = (votes[point.label] || 0) + totalWeight;
        });
        
        const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
        const maxVotes = Math.max(...Object.values(votes));
        
        return maxVotes / totalVotes;
    }
    
    setFeatureWeights(weights) {
        this.featureWeights = weights;
    }
}

// Preditor de movimento extremamente avançado
export class AdvancedMovementPredictor {
    constructor() {
        // Rede neural profunda para predição de posição
        this.positionNetwork = new DeepNeuralNetwork([
            { size: 50 },  // Input: 50 features
            { size: 128, activation: 'leaky_relu', dropout: 0.2 },
            { size: 256, activation: 'leaky_relu', dropout: 0.3 },
            { size: 128, activation: 'leaky_relu', dropout: 0.2 },
            { size: 64, activation: 'leaky_relu', dropout: 0.1 },
            { size: 2, activation: 'linear' }  // Output: x, y position
        ], 0.001, true);
        
        // Rede neural para predição de velocidade
        this.velocityNetwork = new DeepNeuralNetwork([
            { size: 50 },
            { size: 96, activation: 'leaky_relu', dropout: 0.2 },
            { size: 128, activation: 'leaky_relu', dropout: 0.3 },
            { size: 64, activation: 'leaky_relu', dropout: 0.1 },
            { size: 2, activation: 'tanh' }  // Output: velocity x, y
        ], 0.001, true);
        
        // Rede para classificação de padrões
        this.patternNetwork = new DeepNeuralNetwork([
            { size: 50 },
            { size: 64, activation: 'relu', dropout: 0.3 },
            { size: 32, activation: 'relu', dropout: 0.2 },
            { size: 5, activation: 'softmax' }  // Output: 5 classes de padrão
        ], 0.002, true);
        
        // KNN avançado para análise de similaridade
        this.advancedKNN = new AdvancedKNN(10, 'weighted');
        
        // Histórico de treinamento
        this.trainingData = [];
        this.trainingQueue = [];
        this.lastTrainingTime = 0;
        
        // Estatísticas avançadas
        this.predictionAccuracy = 0;
        this.patternAccuracy = 0;
        this.totalPredictions = 0;
        this.correctPredictions = 0;
        
        // Mapeamento de padrões
        this.patternMap = {
            0: 'random',
            1: 'circular',
            2: 'zigzag',
            3: 'strafe',
            4: 'straight'
        };
        
        this.reversePatternMap = {
            'random': 0,
            'circular': 1,
            'zigzag': 2,
            'strafe': 3,
            'straight': 4
        };
    }
    
    // Extrair features extremamente detalhados
    extractAdvancedFeatures(inputHistory, movementHistory, playerState) {
        const features = [];
        
        // === FEATURES DE INPUT (15 features) ===
        const recentInputs = inputHistory.slice(-5);
        for (let i = 0; i < 5; i++) {
            if (i < recentInputs.length) {
                const input = recentInputs[i];
                features.push(
                    input.keys.w ? 1 : 0,
                    input.keys.a ? 1 : 0,
                    input.keys.s ? 1 : 0
                );
            } else {
                features.push(0, 0, 0);
            }
        }
        
        // === FEATURES DE MOVIMENTO (20 features) ===
        const recentMovement = movementHistory.slice(-5);
        for (let i = 0; i < 5; i++) {
            if (i < recentMovement.length) {
                const movement = recentMovement[i];
                features.push(
                    movement.vx / 10,  // Velocidade normalizada
                    movement.vy / 10,
                    movement.ax / 10,  // Aceleração normalizada
                    movement.ay / 10
                );
            } else {
                features.push(0, 0, 0, 0);
            }
        }
        
        // === FEATURES ESTATÍSTICOS (10 features) ===
        if (movementHistory.length >= 10) {
            const recent10 = movementHistory.slice(-10);
            
            // Velocidade média
            const avgVx = recent10.reduce((sum, m) => sum + m.vx, 0) / recent10.length;
            const avgVy = recent10.reduce((sum, m) => sum + m.vy, 0) / recent10.length;
            
            // Variância de velocidade
            const varVx = recent10.reduce((sum, m) => sum + Math.pow(m.vx - avgVx, 2), 0) / recent10.length;
            const varVy = recent10.reduce((sum, m) => sum + Math.pow(m.vy - avgVy, 2), 0) / recent10.length;
            
            // Velocidade angular média
            let avgAngularVel = 0;
            for (let i = 1; i < recent10.length; i++) {
                let angleDiff = recent10[i].direction - recent10[i-1].direction;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                avgAngularVel += angleDiff;
            }
            avgAngularVel /= (recent10.length - 1);
            
            features.push(
                avgVx / 10,
                avgVy / 10,
                Math.sqrt(varVx) / 10,
                Math.sqrt(varVy) / 10,
                avgAngularVel / Math.PI,
                recent10[recent10.length - 1].speed / 10,
                playerState.averageSpeed / 10,
                playerState.directionChanges / 10,
                playerState.patternConfidence,
                playerState.health / 6  // Normalizado pela vida máxima
            );
        } else {
            features.push(...new Array(10).fill(0));
        }
        
        // === FEATURES TEMPORAIS (5 features) ===
        if (inputHistory.length >= 5) {
            const recent5 = inputHistory.slice(-5);
            
            // Duração média de pressionamento de teclas
            const avgDurationW = recent5.filter(r => r.keys.w).reduce((sum, r) => sum + r.keyDurations.w, 0) / Math.max(recent5.filter(r => r.keys.w).length, 1);
            const avgDurationA = recent5.filter(r => r.keys.a).reduce((sum, r) => sum + r.keyDurations.a, 0) / Math.max(recent5.filter(r => r.keys.a).length, 1);
            const avgDurationS = recent5.filter(r => r.keys.s).reduce((sum, r) => sum + r.keyDurations.s, 0) / Math.max(recent5.filter(r => r.keys.s).length, 1);
            const avgDurationD = recent5.filter(r => r.keys.d).reduce((sum, r) => sum + r.keyDurations.d, 0) / Math.max(recent5.filter(r => r.keys.d).length, 1);
            
            // Frequência de cada tecla
            const freqW = recent5.filter(r => r.keys.w).length / recent5.length;
            
            features.push(
                avgDurationW / 1000,  // Normalizar para segundos
                avgDurationA / 1000,
                avgDurationS / 1000,
                avgDurationD / 1000,
                freqW
            );
        } else {
            features.push(...new Array(5).fill(0));
        }
        
        // Padding para chegar a exatamente 50 features
        while (features.length < 50) {
            features.push(0);
        }
        
        return features.slice(0, 50);  // Garantir exatamente 50 features
    }
    
    // Adicionar dados de treinamento
    addTrainingData(inputHistory, movementHistory, playerState, futurePosition, futureVelocity, currentPattern) {
        const features = this.extractAdvancedFeatures(inputHistory, movementHistory, playerState);
        
        const trainingExample = {
            features,
            positionTarget: [futurePosition.x / 1000, futurePosition.y / 1000],  // Normalizar
            velocityTarget: [Math.tanh(futureVelocity.x / 10), Math.tanh(futureVelocity.y / 10)],  // Tanh para [-1, 1]
            patternTarget: this.createPatternOneHot(currentPattern),
            timestamp: Date.now()
        };
        
        this.trainingQueue.push(trainingExample);
        
        // Treinar incrementalmente a cada 20 exemplos
        if (this.trainingQueue.length >= 20) {
            this.trainIncremental();
            this.trainingQueue = [];
        }
        
        // Adicionar ao KNN
        this.advancedKNN.addData(features, currentPattern, 1.0);
    }
    
    createPatternOneHot(pattern) {
        const oneHot = [0, 0, 0, 0, 0];
        const index = this.reversePatternMap[pattern] || 0;
        oneHot[index] = 1;
        return oneHot;
    }
    
    // Treinamento incremental das redes neurais
    trainIncremental() {
        if (this.trainingQueue.length < 10) return;
        
        // Preparar dados de treinamento
        const inputs = this.trainingQueue.map(example => example.features);
        const positionTargets = this.trainingQueue.map(example => example.positionTarget);
        const velocityTargets = this.trainingQueue.map(example => example.velocityTarget);
        const patternTargets = this.trainingQueue.map(example => example.patternTarget);
        
        // Treinar redes neurais com poucos epochs para treinamento contínuo
        this.positionNetwork.train(inputs, positionTargets, 5, 8);
        this.velocityNetwork.train(inputs, velocityTargets, 5, 8);
        this.patternNetwork.train(inputs, patternTargets, 3, 8);
        
        console.log(`Rede neural treinada com ${this.trainingQueue.length} exemplos. Época: ${this.positionNetwork.epoch}`);
    }
    
    // Predição avançada de posição
    predictPosition(inputHistory, movementHistory, playerState, timeHorizon = 1.0) {
        const features = this.extractAdvancedFeatures(inputHistory, movementHistory, playerState);
        
        // Predição da rede neural
        const neuralPrediction = this.positionNetwork.predict(features);
        const velocityPrediction = this.velocityNetwork.predict(features);
        
        // Predição KNN para comparação
        const knnPattern = this.advancedKNN.predict(features);
        const knnConfidence = this.advancedKNN.getConfidence(features);
        
        // Combinar predições baseado na confiança
        const neuralWeight = 0.7;
        const knnWeight = 0.3 * knnConfidence;
        
        // Posição atual normalizada
        const currentX = playerState.x / 1000;
        const currentY = playerState.y / 1000;
        
        // Calcular predição final considerando time horizon
        const predictedVx = velocityPrediction[0] * 10;  // Desnormalizar
        const predictedVy = velocityPrediction[1] * 10;
        
        const finalX = (neuralPrediction[0] * neuralWeight + currentX * (1 - neuralWeight)) * 1000;
        const finalY = (neuralPrediction[1] * neuralWeight + currentY * (1 - neuralWeight)) * 1000;
        
        // Adicionar predição baseada em velocidade
        const velocityBasedX = finalX + predictedVx * timeHorizon * 60;  // 60 FPS
        const velocityBasedY = finalY + predictedVy * timeHorizon * 60;
        
        return {
            x: velocityBasedX,
            y: velocityBasedY,
            confidence: neuralWeight + knnWeight,
            velocity: {
                x: predictedVx,
                y: predictedVy
            },
            knnPattern: knnPattern,
            knnConfidence: knnConfidence
        };
    }
    
    // Classificação avançada de padrões
    classifyPattern(inputHistory, movementHistory, playerState) {
        const features = this.extractAdvancedFeatures(inputHistory, movementHistory, playerState);
        
        // Predição da rede neural
        const neuralPrediction = this.patternNetwork.predict(features);
        const neuralPattern = this.patternMap[neuralPrediction.indexOf(Math.max(...neuralPrediction))];
        const neuralConfidence = Math.max(...neuralPrediction);
        
        // Predição KNN
        const knnPattern = this.advancedKNN.predict(features);
        const knnConfidence = this.advancedKNN.getConfidence(features);
        
        // Combinar predições
        if (neuralConfidence > 0.8) {
            return {
                pattern: neuralPattern,
                confidence: neuralConfidence,
                method: 'neural'
            };
        } else if (knnConfidence > 0.7) {
            return {
                pattern: knnPattern,
                confidence: knnConfidence,
                method: 'knn'
            };
        } else {
            // Votação entre os dois métodos
            const finalPattern = neuralConfidence > knnConfidence ? neuralPattern : knnPattern;
            const finalConfidence = Math.max(neuralConfidence, knnConfidence) * 0.8;
            
            return {
                pattern: finalPattern,
                confidence: finalConfidence,
                method: 'hybrid'
            };
        }
    }
    
    // Atualizar estatísticas de precisão
    updateAccuracy(predictedPosition, actualPosition, predictedPattern, actualPattern) {
        this.totalPredictions++;
        
        // Calcular erro de posição
        const positionError = Math.sqrt(
            Math.pow(predictedPosition.x - actualPosition.x, 2) +
            Math.pow(predictedPosition.y - actualPosition.y, 2)
        );
        
        // Considerar predição correta se erro < 50 pixels
        if (positionError < 50) {
            this.correctPredictions++;
        }
        
        // Atualizar precisão
        this.predictionAccuracy = this.correctPredictions / this.totalPredictions;
        
        // Precisão de padrão
        if (predictedPattern === actualPattern) {
            this.patternAccuracy = (this.patternAccuracy * (this.totalPredictions - 1) + 1) / this.totalPredictions;
        } else {
            this.patternAccuracy = (this.patternAccuracy * (this.totalPredictions - 1)) / this.totalPredictions;
        }
    }
    
    // Obter estatísticas da IA
    getStats() {
        return {
            predictionAccuracy: this.predictionAccuracy,
            patternAccuracy: this.patternAccuracy,
            totalPredictions: this.totalPredictions,
            knnDataPoints: this.advancedKNN.data.length,
            trainingEpochs: this.positionNetwork.epoch,
            queueSize: this.trainingQueue.length
        };
    }
    
    // Salvar modelo completo
    saveModel() {
        return {
            positionNetwork: this.positionNetwork.serialize(),
            velocityNetwork: this.velocityNetwork.serialize(),
            patternNetwork: this.patternNetwork.serialize(),
            advancedKNN: {
                k: this.advancedKNN.k,
                distanceMetric: this.advancedKNN.distanceMetric,
                data: this.advancedKNN.data,
                featureWeights: this.advancedKNN.featureWeights
            },
            stats: this.getStats(),
            timestamp: Date.now()
        };
    }
    
    // Carregar modelo
    loadModel(data) {
        this.positionNetwork.deserialize(data.positionNetwork);
        this.velocityNetwork.deserialize(data.velocityNetwork);
        this.patternNetwork.deserialize(data.patternNetwork);
        
        this.advancedKNN = new AdvancedKNN(data.advancedKNN.k, data.advancedKNN.distanceMetric);
        this.advancedKNN.data = data.advancedKNN.data;
        this.advancedKNN.featureWeights = data.advancedKNN.featureWeights;
        
        if (data.stats) {
            this.predictionAccuracy = data.stats.predictionAccuracy;
            this.patternAccuracy = data.stats.patternAccuracy;
            this.totalPredictions = data.stats.totalPredictions;
            this.correctPredictions = Math.round(this.predictionAccuracy * this.totalPredictions);
        }
    }
}

// Sistema legado para compatibilidade
export class NeuralNetwork {
    constructor(inputSize, hiddenSize, outputSize, learningRate = 0.1) {
        // Implementação simplificada para compatibilidade
        this.network = new DeepNeuralNetwork([
            { size: inputSize },
            { size: hiddenSize, activation: 'tanh' },
            { size: outputSize, activation: 'tanh' }
        ], learningRate);
    }
    
    forward(input) {
        return this.network.forward(input);
    }
    
    backward(target) {
        return this.network.backward(target);
    }
    
    train(inputs, targets, epochs = 1000) {
        this.network.train(inputs, targets, epochs, 32);
    }
    
    serialize() {
        return this.network.serialize();
    }
    
    deserialize(data) {
        this.network.deserialize(data);
    }
}

export class KNearestNeighbors {
    constructor(k = 5) {
        this.knn = new AdvancedKNN(k, 'euclidean');
    }
    
    addData(features, label) {
        this.knn.addData(features, label);
    }
    
    predict(features) {
        return this.knn.predict(features);
    }
    
    getConfidence(features) {
        return this.knn.getConfidence(features);
    }
}

export class MovementPredictor {
    constructor() {
        this.predictor = new AdvancedMovementPredictor();
    }
    
    extractFeatures(keyHistory, movementHistory) {
        return this.predictor.extractAdvancedFeatures(keyHistory, movementHistory, {
            x: 400, y: 300, averageSpeed: 3, directionChanges: 0, patternConfidence: 0.5, health: 6
        });
    }
    
    addTrainingData(keyHistory, movementHistory, futurePosition) {
        this.predictor.addTrainingData(
            keyHistory, 
            movementHistory, 
            { x: 400, y: 300, averageSpeed: 3, directionChanges: 0, patternConfidence: 0.5, health: 6 },
            futurePosition,
            { x: 0, y: 0 },
            'random'
        );
    }
    
    predictPosition(keyHistory, movementHistory) {
        const prediction = this.predictor.predictPosition(
            keyHistory, 
            movementHistory, 
            { x: 400, y: 300, averageSpeed: 3, directionChanges: 0, patternConfidence: 0.5, health: 6 }
        );
        return { x: prediction.x, y: prediction.y };
    }
    
    classifyPattern(keyHistory, movementHistory) {
        const result = this.predictor.classifyPattern(
            keyHistory,
            movementHistory,
            { x: 400, y: 300, averageSpeed: 3, directionChanges: 0, patternConfidence: 0.5, health: 6 }
        );
        return result.pattern;
    }
    
    addPatternData(keyHistory, movementHistory, pattern) {
        this.predictor.advancedKNN.addData(
            this.extractFeatures(keyHistory, movementHistory),
            pattern
        );
    }
    
    getPatternConfidence(keyHistory, movementHistory) {
        const features = this.extractFeatures(keyHistory, movementHistory);
        return this.predictor.advancedKNN.getConfidence(features);
    }
}