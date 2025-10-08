# 🎨 NEURAL NETWORK VISUALIZER - Guia de Integração

## 📋 Visão Geral

O **Neural Network Visualizer** é um overlay transparente que mostra em tempo real as camadas da rede neural da IA, incluindo neurônios e suas conexões.

## 🚀 Como Integrar

### 1. Importar o Visualizador no main.js

```javascript
import { NeuralNetworkVisualizer } from './utils/neural-visualizer.js';
```

### 2. Inicializar o Visualizador (após criar a IA)

```javascript
// === A IA MAIS ABSURDA DO MUNDO ===
console.log('🚀 INICIALIZANDO SISTEMA DE IA ULTRA PRECISO...');
const ultraAI = new UltraPrecisionEnsembleAI();

// === INICIALIZAR VISUALIZADOR NEURAL ===
const neuralViz = new NeuralNetworkVisualizer({
    width: 300,              // Largura do overlay
    height: 300,             // Altura do overlay
    position: 'top-right'    // Posição: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
});
```

### 3. Atualizar Visualizador no Loop do Jogo

Adicione dentro da função `update()` ou onde a IA é atualizada:

```javascript
// Depois de fazer predição da IA
if (AI_ENABLED && currentTime - lastAIUpdateTime > AI_UPDATE_INTERVAL) {
    // ... código de predição existente ...
    
    // ATUALIZAR VISUALIZADOR NEURAL
    const neuralData = ultraAI.exportNeuralVisualizationData();
    const confidence = aiStats.accuracy || 0.5;
    neuralViz.updateOverlay(neuralData, confidence);
    
    lastAIUpdateTime = currentTime;
}
```

### 4. Armazenar Features para Visualização

No método `extractFeatures()` ou onde as features são criadas, adicione:

```javascript
function extractFeatures(inputHistory, movementHistory, playerState) {
    const features = {
        // ... features existentes ...
    };
    
    // Armazenar para visualização
    ultraAI.storeLastFeatures(features);
    
    return features;
}
```

## 🎛️ Configurações Disponíveis

```javascript
const neuralViz = new NeuralNetworkVisualizer({
    width: 300,                          // Largura do canvas
    height: 300,                         // Altura do canvas
    position: 'top-right',               // Posição na tela
    backgroundColor: 'rgba(0,0,0,0.5)'   // Cor de fundo
});
```

## 🎮 Controles

### Mostrar/Ocultar Visualizador
```javascript
neuralViz.toggle();
```

### Mudar Posição
```javascript
neuralViz.setPosition('bottom-left');
```

### Destruir Visualizador
```javascript
neuralViz.destroy();
```

## 📊 Formato dos Dados

O visualizador espera dados no seguinte formato:

```javascript
[
    {
        neurons: [
            { activation: 0.1 },  // Valor entre 0 e 1
            { activation: 0.8 },
            { activation: 0.5 }
        ]
    },
    {
        neurons: [
            { activation: 0.4 },
            { activation: 0.6 }
        ]
    }
    // ... mais camadas
]
```

## 🎨 Aparência

### Cores dos Neurônios
- **Desativado**: Azul escuro (activation = 0)
- **Parcialmente Ativo**: Azul médio (activation = 0.5)
- **Altamente Ativo**: Azul claro brilhante (activation = 1.0)
- **Efeito Glow**: Neurônios com activation > 0.7 têm brilho extra

### Conexões
- **Opacidade**: Proporcional à força da ativação
- **Espessura**: Mais grossa quando a ativação é alta
- **Cor**: Azul ciano com transparência

### Confiança
- **Verde**: > 80% de confiança
- **Laranja**: 50-80% de confiança
- **Vermelho**: < 50% de confiança

## ⚡ Performance

O visualizador é otimizado para não interferir no desempenho do jogo:

- ✅ `pointer-events: none` - Não interfere na interação
- ✅ Canvas overlay separado do canvas principal
- ✅ Atualização sincronizada com o loop da IA
- ✅ Desenho eficiente usando Canvas 2D

## 🔧 Exemplo Completo de Integração

```javascript
// === IMPORTS ===
import { UltraPrecisionEnsembleAI } from './ai/ultra-precision-ensemble.js';
import { NeuralNetworkVisualizer } from './utils/neural-visualizer.js';

// === INICIALIZAÇÃO ===
const ultraAI = new UltraPrecisionEnsembleAI();
const neuralViz = new NeuralNetworkVisualizer({ position: 'top-right' });

// === LOOP DO JOGO ===
function update() {
    // ... código existente ...
    
    // Atualizar IA
    if (AI_ENABLED && currentTime - lastAIUpdateTime > AI_UPDATE_INTERVAL) {
        // Fazer predição
        const prediction = await ultraAI.predictPlayerPosition(
            inputHistory,
            movementHistory,
            player,
            0.5
        );
        
        // Atualizar visualizador
        const neuralData = ultraAI.exportNeuralVisualizationData();
        neuralViz.updateOverlay(neuralData, prediction.confidence);
        
        lastAIUpdateTime = currentTime;
    }
    
    // ... resto do código ...
}

// === CONTROLE POR TECLADO (OPCIONAL) ===
document.addEventListener('keydown', (e) => {
    if (e.key === 'n' || e.key === 'N') {
        neuralViz.toggle(); // Pressione 'N' para mostrar/ocultar
    }
});
```

## 🎯 Recursos Visuais

- 🔵 **Neurônios**: Círculos coloridos representando ativação
- 🔗 **Conexões**: Linhas conectando neurônios entre camadas
- ✨ **Efeito Glow**: Neurônios muito ativos brilham
- 📊 **Label de Confiança**: Mostra confiança da IA em tempo real
- 🧠 **Título**: "NEURAL NETWORK" no topo do overlay

## 📝 Notas Importantes

1. O visualizador é **não-bloqueante** e não interfere no jogo
2. Use `pointer-events: none` para garantir que cliques passem através do overlay
3. O overlay é criado automaticamente no DOM quando inicializado
4. Dados são atualizados apenas quando `updateOverlay()` é chamado
5. Destruir o visualizador remove todos os elementos do DOM

## 🐛 Troubleshooting

### Visualizador não aparece
- Verifique se o import está correto
- Confirme que `new NeuralNetworkVisualizer()` foi chamado
- Verifique console para erros

### Performance ruim
- Reduza frequência de `updateOverlay()`
- Use menos neurônios nas camadas
- Considere desativar em dispositivos móveis

### Dados não atualizam
- Certifique-se de chamar `updateOverlay()` regularmente
- Verifique formato dos dados (deve ser array de layers)
- Use `console.log` para debugar dados exportados

---

**Pronto!** 🎉 Agora você tem um visualizador neural completo e funcionando!