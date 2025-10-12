/**
 * ============================================================================
 * NEURAL NETWORK VISUALIZER - OVERLAY TRANSPARENTE
 * Visualização em tempo real das camadas da rede neural
 * ============================================================================
 */

class NeuralNetworkVisualizer {
    constructor(options = {}) {
        // Configurações
        this.width = options.width || 300;
        this.height = options.height || 300;
        this.position = options.position || 'top-right'; // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
        this.backgroundColor = options.backgroundColor || 'rgba(0, 0, 0, 0.5)';
        this.padding = options.padding || 20;
        
        // Cores
        this.neuronInactiveColor = 'rgba(50, 100, 200, 0.3)';
        this.neuronActiveColor = 'rgba(100, 200, 255, 1.0)';
        this.connectionInactiveColor = 'rgba(100, 150, 200, 0.1)';
        this.connectionActiveColor = 'rgba(100, 200, 255, 0.8)';
        
        // Estado
        this.layersData = [];
        this.animationId = null;
        this.isVisible = true;
        
        // Criar elementos do DOM
        this.createOverlay();
        
        console.log('🎨 Neural Network Visualizer inicializado');
    }
    
    /**
     * Criar canvas overlay e adicionar ao DOM
     */
    createOverlay() {
        // Criar container
        this.container = document.createElement('div');
        this.container.id = 'neural-visualizer-container';
        this.container.style.cssText = `
            position: fixed;
            ${this.getPositionCSS()}
            width: ${this.width}px;
            height: ${this.height}px;
            background: ${this.backgroundColor};
            border: 2px solid rgba(100, 200, 255, 0.5);
            border-radius: 10px;
            pointer-events: none;
            z-index: 9999;
            box-shadow: 0 0 20px rgba(100, 200, 255, 0.3);
            backdrop-filter: blur(5px);
            display: ${this.isVisible ? 'block' : 'none'};
        `;
        
        // Criar canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.cssText = `
            width: 100%;
            height: 100%;
        `;
        
        this.ctx = this.canvas.getContext('2d');
        
        // Criar título
        this.title = document.createElement('div');
        this.title.textContent = '🧠 NEURAL NETWORK';
        this.title.style.cssText = `
            position: absolute;
            top: 5px;
            left: 10px;
            color: rgba(100, 200, 255, 1.0);
            font-family: monospace;
            font-size: 12px;
            font-weight: bold;
            text-shadow: 0 0 5px rgba(100, 200, 255, 0.5);
            pointer-events: none;
        `;
        
        // Criar subtítulo (Output: X, Y)
        this.subtitle = document.createElement('div');
        this.subtitle.textContent = 'Output: X, Y coords';
        this.subtitle.style.cssText = `
            position: absolute;
            top: 22px;
            left: 10px;
            color: rgba(100, 200, 255, 0.7);
            font-family: monospace;
            font-size: 9px;
            pointer-events: none;
        `;
        
        // Criar info de confiança
        this.confidenceLabel = document.createElement('div');
        this.confidenceLabel.textContent = 'Confiança: --';
        this.confidenceLabel.style.cssText = `
            position: absolute;
            bottom: 5px;
            left: 10px;
            color: rgba(100, 200, 255, 0.8);
            font-family: monospace;
            font-size: 10px;
            pointer-events: none;
        `;
        
        // Montar estrutura
        this.container.appendChild(this.canvas);
        this.container.appendChild(this.title);
        this.container.appendChild(this.subtitle);
        this.container.appendChild(this.confidenceLabel);
        document.body.appendChild(this.container);
        
        // Desenhar estrutura inicial com dados de exemplo
        this.drawInitialNetwork();
    }
    
    /**
     * Desenhar rede neural inicial (exemplo/placeholder)
     */
    drawInitialNetwork() {
        // Criar dados de exemplo para mostrar a estrutura
        const exampleData = [
            { neurons: Array(8).fill(0).map(() => ({ activation: 0.2 + Math.random() * 0.3 })) },
            { neurons: Array(12).fill(0).map(() => ({ activation: 0.3 + Math.random() * 0.4 })) },
            { neurons: Array(8).fill(0).map(() => ({ activation: 0.2 + Math.random() * 0.5 })) },
            { neurons: Array(2).fill(0).map(() => ({ activation: 0.5 + Math.random() * 0.3 })) }
        ];
        
        this.updateOverlay(exampleData, 0.5);
        console.log('🎨 Estrutura inicial da rede neural desenhada');
    }
    
    /**
     * Obter CSS de posicionamento baseado na opção escolhida
     */
    getPositionCSS() {
        const margin = '20px';
        switch(this.position) {
            case 'top-left':
                return `top: ${margin}; left: ${margin};`;
            case 'top-right':
                return `top: ${margin}; right: ${margin};`;
            case 'bottom-left':
                return `bottom: ${margin}; left: ${margin};`;
            case 'bottom-right':
                return `bottom: ${margin}; right: ${margin};`;
            default:
                return `top: ${margin}; right: ${margin};`;
        }
    }
    
    /**
     * Atualizar dados da rede neural
     * @param {Array} layersData - Array de camadas com neurônios e suas ativações
     * Formato esperado:
     * [
     *   { neurons: [ { activation: 0.1 }, { activation: 0.8 }, ... ] },
     *   { neurons: [ { activation: 0.4 }, { activation: 0.6 }, ... ] },
     *   ...
     * ]
     */
    updateOverlay(layersData, confidence = null) {
        if (!layersData || layersData.length === 0) {
            console.warn('⚠️ Neural Visualizer: Nenhum dado recebido');
            return;
        }
        
        console.log('🎨 Neural Visualizer: Atualizando com', layersData.length, 'camadas');
        this.layersData = layersData;
        
        // Atualizar label de confiança
        if (confidence !== null) {
            this.confidenceLabel.textContent = `Confiança: ${Math.round(confidence * 100)}%`;
            this.confidenceLabel.style.color = this.getConfidenceColor(confidence);
        }
        
        // Desenhar imediatamente
        this.draw();
    }
    
    /**
     * Obter cor baseada no nível de confiança
     */
    getConfidenceColor(confidence) {
        if (confidence > 0.8) return 'rgba(100, 255, 100, 1.0)';
        if (confidence > 0.5) return 'rgba(255, 200, 100, 1.0)';
        return 'rgba(255, 100, 100, 1.0)';
    }
    
    /**
     * Desenhar rede neural
     */
    draw() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        if (this.layersData.length === 0) {
            console.warn('⚠️ Neural Visualizer: Sem dados para desenhar');
            return;
        }
        
        console.log('✏️ Neural Visualizer: Desenhando', this.layersData.length, 'camadas');
        
        // Calcular posições dos neurônios
        const layers = this.calculateNeuronPositions();
        
        // Desenhar conexões primeiro (para ficarem atrás)
        this.drawConnections(layers);
        
        // Desenhar neurônios
        this.drawNeurons(layers);
    }
    
    /**
     * Calcular posições de todos os neurônios
     */
    calculateNeuronPositions() {
        const layers = [];
        const numLayers = this.layersData.length;
        const layerSpacing = (this.width - 2 * this.padding) / (numLayers - 1 || 1);
        
        this.layersData.forEach((layerData, layerIndex) => {
            const neurons = [];
            const numNeurons = layerData.neurons.length;
            const neuronSpacing = (this.height - 2 * this.padding) / (numNeurons + 1);
            
            layerData.neurons.forEach((neuronData, neuronIndex) => {
                neurons.push({
                    x: this.padding + layerIndex * layerSpacing,
                    y: this.padding + (neuronIndex + 1) * neuronSpacing,
                    activation: neuronData.activation || 0,
                    radius: 6
                });
            });
            
            layers.push(neurons);
        });
        
        return layers;
    }
    
    /**
     * Desenhar conexões entre neurônios
     */
    drawConnections(layers) {
        for (let i = 0; i < layers.length - 1; i++) {
            const currentLayer = layers[i];
            const nextLayer = layers[i + 1];
            
            currentLayer.forEach(neuron1 => {
                nextLayer.forEach(neuron2 => {
                    // Força da conexão = média das ativações
                    const connectionStrength = (neuron1.activation + neuron2.activation) / 2;
                    
                    // Interpolar cor baseada na força
                    const alpha = 0.1 + connectionStrength * 0.7;
                    const color = `rgba(100, 200, 255, ${alpha})`;
                    
                    // Desenhar linha
                    this.ctx.beginPath();
                    this.ctx.moveTo(neuron1.x, neuron1.y);
                    this.ctx.lineTo(neuron2.x, neuron2.y);
                    this.ctx.strokeStyle = color;
                    this.ctx.lineWidth = 0.5 + connectionStrength * 1.5;
                    this.ctx.stroke();
                });
            });
        }
    }
    
    /**
     * Desenhar neurônios
     */
    drawNeurons(layers) {
        layers.forEach((layer, layerIndex) => {
            const isOutputLayer = (layerIndex === layers.length - 1);
            
            layer.forEach((neuron, neuronIndex) => {
                // Interpolar cor baseada na ativação
                const r = 50 + neuron.activation * 150;
                const g = 100 + neuron.activation * 155;
                const b = 200 + neuron.activation * 55;
                const alpha = 0.3 + neuron.activation * 0.7;
                
                // Desenhar círculo do neurônio
                this.ctx.beginPath();
                this.ctx.arc(neuron.x, neuron.y, neuron.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                this.ctx.fill();
                
                // Contorno brilhante se muito ativo
                if (neuron.activation > 0.7) {
                    this.ctx.strokeStyle = `rgba(100, 255, 255, ${neuron.activation})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // Efeito glow
                    const gradient = this.ctx.createRadialGradient(
                        neuron.x, neuron.y, neuron.radius,
                        neuron.x, neuron.y, neuron.radius * 2
                    );
                    gradient.addColorStop(0, `rgba(100, 255, 255, ${neuron.activation * 0.5})`);
                    gradient.addColorStop(1, 'rgba(100, 255, 255, 0)');
                    
                    this.ctx.beginPath();
                    this.ctx.arc(neuron.x, neuron.y, neuron.radius * 2, 0, Math.PI * 2);
                    this.ctx.fillStyle = gradient;
                    this.ctx.fill();
                }
                
                // ADICIONAR LABELS para camada de saída (X e Y)
                if (isOutputLayer && layer.length === 2) {
                    const label = neuronIndex === 0 ? 'X' : 'Y';
                    this.ctx.save();
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    this.ctx.font = 'bold 10px monospace';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(label, neuron.x, neuron.y);
                    this.ctx.restore();
                    
                    // Valor normalizado (0-1) abaixo do neurônio
                    this.ctx.save();
                    this.ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
                    this.ctx.font = '8px monospace';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(neuron.activation.toFixed(2), neuron.x, neuron.y + 15);
                    this.ctx.restore();
                }
            });
        });
    }
    
    /**
     * Mostrar/ocultar visualizador
     */
    toggle() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
        console.log(`🎨 Neural Visualizer: ${this.isVisible ? 'ATIVADO' : 'DESATIVADO'}`);
    }
    
    /**
     * Definir posição
     */
    setPosition(position) {
        this.position = position;
        const positionCSS = this.getPositionCSS();
        const parts = positionCSS.split(';');
        parts.forEach(part => {
            if (part.trim()) {
                const [key, value] = part.split(':').map(s => s.trim());
                this.container.style[key] = value;
            }
        });
    }
    
    /**
     * Destruir visualizador
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        console.log('🎨 Neural Network Visualizer destruído');
    }
}

// Exportar para uso em módulos
export { NeuralNetworkVisualizer };
