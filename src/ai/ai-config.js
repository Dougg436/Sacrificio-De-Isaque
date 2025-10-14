/**
 * CONFIGURAÇÃO AVANÇADA DA IA
 * Arquivo para facilitar ajustes da IA sem editar o código principal
 */

export const AI_CONFIG = {
    // === CONFIGURAÇÕES DE APRENDIZADO ===
    learning: {
        enableAdvancedLearning: true,      // Ativa análise comportamental avançada
        autoAcceleration: true,            // Auto-acelera quando detecta mudanças
        debugMode: true,                   // Mostra logs de aprendizado
        sensitivityLevel: 0.7,             // Sensibilidade para detectar mudanças (0-1)
        maxLearningSpeed: 3.0,             // Multiplicador máximo de velocidade de aprendizado
        adaptationThreshold: 0.8           // Threshold para ativar aceleração automática
    },
    
    // === PESOS DE PREDIÇÃO ===
    predictionWeights: {
        behavioral: 0.35,       // Análise comportamental (prioridade máxima)
        ultraDeep: 0.20,        // Neural network principal
        lstm: 0.15,             // Memória temporal
        attention: 0.10,        // Atenção contextual
        transformer: 0.08,      // Transformações complexas
        conv: 0.05,             // Padrões convolucionais
        temporal: 0.03,         // Análise temporal básica
        memory: 0.02,           // Memória episódica
        bayesian: 0.01,         // Inferência estatística
        knn: 0.01              // Vizinhos próximos
    },
    
    // === CONFIGURAÇÕES DE PERFORMANCE ===
    performance: {
        maxHistorySize: 15,               // Quantos movimentos recentes analisar
        optimizationInterval: 30000,      // Intervalo de auto-otimização (ms)
        memoryLimit: 50000,               // Limite de memória episódica
        patternDetectionDepth: 10,        // Profundidade de análise de padrões
        maxKnnData: 10000                 // Limite de dados KNN
    },
    
    // === CONFIGURAÇÕES DE DEBUG ===
    debug: {
        showLearningProgress: true,       // Mostrar progresso de aprendizado
        showPatternDetection: true,       // Mostrar padrões detectados
        showConfidenceLevels: true,       // Mostrar níveis de confiança
        maxDebugEvents: 10,               // Máximo de eventos de debug
        consoleVerbosity: 'high'          // 'low', 'medium', 'high'
    },
    
    // === PADRÕES DE MOVIMENTO ===
    patterns: {
        circularThreshold: 0.3,           // Threshold para detectar movimento circular
        zigzagThreshold: 0.4,             // Threshold para detectar zigzag
        erraticThreshold: 0.6,            // Threshold para movimento errático
        speedChangeThreshold: 0.3,        // Threshold para mudança de velocidade
        directionChangeThreshold: 0.2      // Threshold para mudança de direção
    }
};

/**
 * FUNÇÕES UTILITÁRIAS PARA CONFIGURAÇÃO
 */
export class AIConfigManager {
    static enableTurboLearning() {
        AI_CONFIG.learning.autoAcceleration = true;
        AI_CONFIG.learning.sensitivityLevel = 0.5;
        AI_CONFIG.learning.maxLearningSpeed = 5.0;
        AI_CONFIG.predictionWeights.behavioral = 0.5;
        console.log('🚀 MODO TURBO ATIVADO - IA irá aprender MUITO mais rápido!');
    }
    
    static enableStealthMode() {
        AI_CONFIG.debug.showLearningProgress = false;
        AI_CONFIG.debug.showPatternDetection = false;
        AI_CONFIG.debug.consoleVerbosity = 'low';
        console.log('🔇 MODO SILENCIOSO - IA funcionará sem logs');
    }
    
    static enablePerfectPrediction() {
        AI_CONFIG.predictionWeights.behavioral = 0.6;
        AI_CONFIG.predictionWeights.ultraDeep = 0.25;
        AI_CONFIG.learning.sensitivityLevel = 0.3;
        AI_CONFIG.patterns.circularThreshold = 0.2;
        AI_CONFIG.patterns.zigzagThreshold = 0.2;
        console.log('🎯 MODO PREDIÇÃO PERFEITA - Máxima precisão ativada!');
    }
    
    static resetToDefaults() {
        // Reset todos os valores para o padrão
        Object.assign(AI_CONFIG, {
            learning: {
                enableAdvancedLearning: true,
                autoAcceleration: true,
                debugMode: true,
                sensitivityLevel: 0.7,
                maxLearningSpeed: 3.0,
                adaptationThreshold: 0.8
            }
        });
        console.log('🔄 Configurações restauradas para o padrão');
    }
}

// Ativar modo turbo por padrão para máxima eficiência
AIConfigManager.enableTurboLearning();