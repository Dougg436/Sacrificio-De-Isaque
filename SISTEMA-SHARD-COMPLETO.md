# 💎 Sistema Shard Completo - Basement 2+

## Visão Geral ✅

Implementei um sistema completo de **Shards** que substitui os **Phantoms** a partir do **Basement 2**. O sistema inclui mecânicas avançadas de barreira de cristais, divisão após morte, e IA tática.

## 📊 Sistema de Andares

### **🏠 Basement 1:**
- **Inimigos**: `fly`, `spider`, `shooter`, `phantom`
- **Limite**: Máximo **2 Phantoms** por sala
- **Comportamento**: Sistema original mantido

### **💎 Basement 2+:**
- **Inimigos**: `fly`, `spider`, `shooter`, `shard`
- **Limite**: Máximo **3 Shards** por sala
- **Comportamento**: **Phantoms completamente desativados**

## ⚔️ Shards vs Phantoms - Comparativo

| Aspecto | 👻 Phantom | 💎 Shard | 💎 Mini Shard |
|---------|------------|----------|---------------|
| **Vida** | 6 HP | 6 HP | 3 HP (50%) |
| **Velocidade** | 2.8 | 2.24 (80%) | 2.688 (120%) |
| **Dano** | 3 | 2 (barreira) | 2 (barreira) |
| **Tamanho** | 38px | 38px | 28px |
| **Limite/Sala** | 2 máximo | 3 máximo | - |
| **Ataque** | Projéteis + contato | Barreira orbital | Barreira orbital |
| **Especial** | Invisibilidade | Divisão em 2 | Não divide |

## 🔮 Mecânicas dos Shards

### **💎 Shard Normal:**

**Aparência:**
- **Corpo**: Esfera azul translúcida (`#87CEEB`) com gradiente cristalino
- **Brilho**: Bordas cristalinas com sombra azul
- **Efeito**: Pulsante quando < 50% HP

**Barreira de Cristais:**
- **Fragmentos**: 4-6 cristais orbitais (média 5)
- **Raio**: 50px de distância do centro
- **Rotação**: Contínua com mudança de direção a cada 4-6s
- **Aceleração**: +50% velocidade quando < 50% HP

**Comportamento (`shard_orbit`):**
- **Distância**: Mantém 120px do jogador (zona de conforto)
- **Movimento**: Flutuação orbital suave
- **Contra-ataque**: Acelera rotação se jogador < 80px
- **Regeneração**: Barreira se regenera em 3 segundos

### **💎 Mini Shard:**

**Aparência:**
- **Corpo**: Esfera azul mais clara (`#B0E0E6`) e menor
- **Barreira**: 2-3 cristais orbitais menores
- **Rastro**: Efeito visual de movimento rápido

**Comportamento (`minishard_aggressive`):**
- **Movimento**: Perseguição direta agressiva
- **Velocidade**: 120% do Shard normal
- **Regeneração**: Barreira se regenera em 2 segundos
- **Rotação**: Muda direção a cada 2-4 segundos

## ⚡ Sistema de Combate

### **🎯 Barreira de Cristais:**

**Mecânica de Defesa/Ataque:**
- **Rotação Contínua**: Cristais orbitam constantemente
- **Dano por Contato**: 2 HP por toque na barreira
- **Proteção**: Projéteis do player destroem a barreira
- **Regeneração**: Barreira se reconstrói automaticamente

**Colisão Inteligente:**
```javascript
// Colisão com barreira (mais comum)
if (distance <= crystalBarrierRadius + 15) {
    takeDamage(2); // Dano da barreira
}

// Colisão direta com corpo (raro)
if (distance <= size/2 + playerSize/2) {
    takeDamage(3); // 50% dano extra
}
```

### **💥 Sistema de Divisão:**

**Quando Shard Morre:**
1. **Divisão**: Automaticamente se divide em **2 Mini Shards**
2. **Posição**: Mini Shards aparecem próximos ao Shard original
3. **Limite**: Só divide se não exceder **3 Shards totais** na sala
4. **Efeito**: Animação de estilhaçamento cristalino

**Controle de Population:**
```javascript
// Verificar limite antes de dividir
const currentShardCount = countLiveShards(enemies);
if (currentShardCount + 2 <= 3) {
    // Permite divisão
    const miniShards = createMiniShardsFromShard(deadShard);
    enemies.push(...miniShards);
} else {
    // Bloqueia divisão
    console.log('Divisão bloqueada - limite atingido');
}
```

## 🧠 Inteligência Artificial

### **🎮 Shard Normal:**
- **Posicionamento**: Mantém distância média ideal (120px)
- **Movimento**: 
  - Muito perto → se afasta
  - Muito longe → se aproxima  
  - Distância boa → movimento orbital
- **Adaptação**: Acelera rotação quando jogador próximo
- **Defensivo**: Não persegue diretamente

### **⚡ Mini Shard:**
- **Posicionamento**: Perseguição agressiva direta
- **Movimento**: Linha reta em direção ao jogador
- **Velocidade**: 120% mais rápido que o normal
- **Ofensivo**: Força esquiva em curta distância

### **🔄 Rotação Dinâmica:**
- **Mudança de Direção**: A cada 4-6s (Shard) ou 2-4s (Mini)
- **Aceleração**: Automática quando < 50% HP
- **Contra-ataque**: Resposta a proximidade do jogador

## 🎨 Efeitos Visuais

### **✨ Renderização Avançada:**

**Corpo Principal:**
```javascript
// Gradiente 3D cristalino
gradient.addColorStop(0, '#E0F6FF');     // Brilho central
gradient.addColorStop(0.3, enemy.color); // Cor principal
gradient.addColorStop(0.8, '#4169E1');   // Azul royal
gradient.addColorStop(1, '#191970');     // Contorno escuro
```

**Cristais Orbitais:**
- **Individual**: Cada cristal com gradiente próprio
- **Brilho**: Centro branco → azul claro → azul aço
- **Sombra**: 12px de blur branco-azulado
- **Animação**: Rotação suave e contínua

**Efeitos Especiais:**
- **Low HP**: Pulso vermelho ao redor do Shard
- **Mini Shards**: Rastro de movimento cristalino
- **Regeneração**: Partículas se reformando gradualmente
- **Divisão**: Explosão de luz azul (programada)

## 🛠️ Sistema Técnico

### **📁 Arquivos Modificados:**

**`src/entities/enemy.js`:**
- **Novos tipos**: `shard` e `minishard` 
- **Comportamentos**: `shard_orbit` e `minishard_aggressive`
- **Funções**: `countLiveShards()`, `createMiniShardsFromShard()`, `checkBulletBarrierCollision()`
- **Renderização**: Sistema completo de cristais orbitais

**`src/main.js`:**
- **Sistema de andares**: Phantom → Shard no Basement 2+
- **Spawn controlado**: Limite de 3 Shards por sala
- **Divisão automática**: Processamento de Mini Shards
- **Colisão especial**: Barreira vs corpo do Shard
- **Debug visual**: Contador de Shards na tela

### **🔧 Funções Principais:**

```javascript
// Contar Shards vivos
countLiveShards(enemies) → number

// Criar Mini Shards a partir de divisão
createMiniShardsFromShard(deadShard) → [miniShard1, miniShard2]

// Detectar projétil vs barreira
checkBulletBarrierCollision(enemy, bullet) → boolean

// Colisão especial Shard vs Player
checkEnemyCollision(enemy, player) → {type: 'barrier'|'body', enemy}
```

## 🎮 Experiência do Jogador

### **📈 Progressão Natural:**
1. **Basement 1**: Aprende mecânicas com Phantoms
2. **Basement 2**: Encontra Shards com nova mecânica
3. **Combate**: Adapta estratégia para barreira orbital
4. **Divisão**: Lida com multiplicação de inimigos
5. **Mastery**: Domina timing de destruição da barreira

### **⚔️ Estratégias de Combate:**

**Contra Shard Normal:**
- **Manter distância**: Evitar zona da barreira (50px)
- **Timing**: Atacar durante regeneração da barreira
- **Posicionamento**: Aproveitar movimento orbital previsível

**Contra Mini Shards:**
- **Mobilidade**: Usar velocidade para esquivar perseguição
- **Prioridade**: Eliminar rapidamente (baixa HP)
- **Agrupamento**: Evitar ser cercado por múltiplos

### **🔄 Dinâmica de Divisão:**
- **Risk/Reward**: Matar Shard = 2 inimigos mais rápidos
- **Estratégia**: Decidir quando é seguro eliminar Shard
- **Limite**: Sistema previne spam infinito (max 3 total)

## 📊 Balanceamento

### **⚖️ Números Finais:**

| Métrica | Phantom | Shard | Mini Shard |
|---------|---------|-------|------------|
| **HP/Dano ratio** | 6/3 = 2.0 | 6/2 = 3.0 | 3/2 = 1.5 |
| **Velocidade** | 2.8 | 2.24 | 2.688 |
| **Área de ameaça** | Corpo (38px) | Barreira (100px) | Barreira (70px) |
| **Letalidade** | Alta (invisível) | Média (barreira) | Alta (velocidade) |

### **🎯 Design Goals Atingidos:**
- ✅ **Substitui Phantoms** no Basement 2+
- ✅ **Mecânica única** de barreira orbital
- ✅ **Divisão controlada** após morte
- ✅ **IA diferenciada** por tipo
- ✅ **Limit de 3** por sala respeitado
- ✅ **Efeitos visuais** cristalinos impressionantes

## 🎊 Resultado Final

### **Sistema Shard = Evolução Perfeita do Phantom**

**Antes (Basement 1):**
- 👻 Phantoms com invisibilidade
- Mecânica de projéteis + contato
- Limite: 2 por sala

**Depois (Basement 2+):**
- 💎 Shards com barreira orbital
- Mecânica de divisão + regeneração
- Limite: 3 por sala (6+ com divisões)
- IA tática mais sofisticada
- Efeitos visuais superiores

**O sistema oferece uma experiência completamente nova mantendo a essência desafiadora dos Phantoms, mas com mecânicas inovadoras que elevam o gameplay!** ✨💎⚡