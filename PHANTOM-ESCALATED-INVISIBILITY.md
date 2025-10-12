# Phantom: Sistema de Invisibilidade Escalonada + Teleporte

## Nova Mecânica Implementada ✅

### 🎯 **Sistema de Dano Escalonado**

O Phantom agora tem um sistema progressivo de reação aos tiros:

#### **📊 Contador de Hits**
- **Propriedade**: `hitCount` (inicia em 0)
- **Rastreamento**: Cada tiro bem-sucedido incrementa o contador
- **Persistência**: Mantém o count durante toda a vida do Phantom

#### **⚡ Escalonamento de Reações:**

1. **🟡 1º e 2º Tiros** (hitCount 1-2):
   - **Invisibilidade Normal**: Translúcido (alpha 0.1)
   - **Duração**: 4 segundos
   - **Comportamento**: Pode ser visto ainda que bem fraco
   - **Status**: `isVisible = false, isCompletelyInvisible = false`

2. **🔴 3º Tiro ou Mais** (hitCount 3+):
   - **Invisibilidade COMPLETA**: Totalmente invisível (alpha 0.0)
   - **Teleporte**: Move-se para posição aleatória próxima ao jogador
   - **Duração**: 4 segundos completamente invisível
   - **Status**: `isVisible = false, isCompletelyInvisible = true`

### 🌀 **Sistema de Teleporte**

#### **Função**: `teleportPhantomNearPlayer()`
```javascript
// Parâmetros:
- phantom: O inimigo Phantom
- player: Referência do jogador

// Características:
- Raio de teleporte: 150px do jogador
- Distância mínima: 80px (não aparece em cima)
- Ângulo: Completamente aleatório (360°)
- Reset de velocidade após teleporte
```

#### **📍 Posicionamento Inteligente:**
- **Distância**: Entre 80px e 150px do jogador
- **Ângulo**: Aleatório para imprevisibilidade
- **Segurança**: Nunca aparece muito perto do jogador
- **Reset**: Velocidade zerada para evitar movimento estranho

### 🎨 **Sistema Visual Aprimorado**

#### **🟡 Estados de Visibilidade:**

1. **😈 Visível Normal** (hitCount 0-2, após cooldown):
   - **Alpha**: 1.0 (totalmente visível)
   - **Efeitos**: Brilho quando recém-aparecido
   - **Cor**: Bola roxa com gradiente 3D

2. **👻 Invisível Translúcido** (hitCount 1-2):
   - **Alpha**: 0.1 (10% de opacidade)
   - **Renderização**: Ainda desenha, mas bem fraco
   - **Feedback**: Jogador ainda consegue ver onde está

3. **💀 COMPLETAMENTE Invisível** (hitCount 3+):
   - **Alpha**: 0.0 (0% de opacidade)
   - **Renderização**: NÃO APARECE NADA na tela
   - **Feedback**: Phantom é totalmente indetectável visualmente

### 🔄 **Ciclo de Combate**

#### **Progressão Normal:**
```
Spawn → Visível → 1º Hit → Invisível Translúcido → 
Aparece → 2º Hit → Invisível Translúcido → Aparece → 
3º Hit → TELEPORTE + Invisibilidade COMPLETA → Aparece em Nova Posição
```

#### **⏱️ Timings:**
- **Invisibilidade**: 4 segundos (qualquer tipo)
- **Cooldown**: Phantom reaparece sempre após a duração
- **Reset**: `isCompletelyInvisible = false` ao reaparecer

### 🎮 **Impacto na Jogabilidade**

#### **🎯 Estratégia para o Jogador:**
1. **Primeiros 2 tiros**: Phantom some mas ainda pode ser visto
2. **3º tiro**: Phantom DESAPARECE completamente e TELEPORTA
3. **Busca**: Jogador deve procurar em um raio de ~150px
4. **Reaparição**: Phantom volta visível após 4 segundos

#### **⚔️ Desafio Progressivo:**
- **Fácil**: Phantom visível normal
- **Médio**: Phantom translúcido mas rastreável  
- **Difícil**: Phantom completamente invisível + teleporte surpresa

### 🛠️ **Implementação Técnica**

#### **Arquivos Modificados:**

1. **`src/entities/enemy.js`:**
   - ✅ Adicionadas propriedades `hitCount` e `isCompletelyInvisible`
   - ✅ Função `damageEnemy()` com lógica escalonada
   - ✅ Função `teleportPhantomNearPlayer()` para teleporte
   - ✅ Sistema de renderização com invisibilidade total
   - ✅ Reset do estado ao reaparecer

2. **`src/main.js`:**
   - ✅ Passagem da referência do jogador para `damageEnemy()`

#### **🔧 Compatibilidade:**
- ✅ **Colisão**: Sistema mantém funcionamento normal
- ✅ **IA**: Comportamento de perseguição inalterado  
- ✅ **Performance**: Sem impacto significativo
- ✅ **Balanço**: Progressão de dificuldade equilibrada

### 🎉 **Resultado Final**

O Phantom agora oferece uma experiência de combate **extremamente dinâmica**:

- **🎯 Previsibilidade Inicial**: Primeiros tiros são mais "normais"
- **👻 Escalada de Tensão**: Cada hit torna o Phantom mais perigoso
- **💀 Clímax Dramático**: 3º hit resulta em teleporte + invisibilidade total
- **🔄 Ciclo Sustentável**: Sistema se repete criando tensão constante

**Antes**: Phantom simples que ficava translúcido  
**Depois**: Sistema complexo de invisibilidade progressiva + teleporte estratégico! ⚡👻