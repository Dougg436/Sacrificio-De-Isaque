# Phantom: Comportamento de Caça Híbrido

## Mudanças Implementadas ✅

### 🎯 **Novo Comportamento: Ataque Híbrido**
O Phantom agora combina **ataques à distância** com **investidas corpo a corpo**:

#### **Estratégia por Distância:**

1. **🏹 Longa Distância (>300px):**
   - Aproxima-se atirando projéteis
   - Velocidade moderada (60% da velocidade base)
   - Atira regularmente enquanto se aproxima

2. **⚔️ Média Distância (80-300px):**
   - **INVESTIDA AGRESSIVA** para contato corpo a corpo
   - Velocidade aumentada (120% da velocidade base)
   - Atira ocasionalmente durante a investida

3. **🥊 Curta Distância (<80px):**
   - Foco total no **ataque corpo a corpo**
   - Movimento errático para dificultar esquiva
   - Raramente atira (prioriza contato físico)

### 💀 **Aumento de Poder:**
- **Velocidade**: 2.5 → **2.8** (mais rápido)
- **Dano**: 2 → **3** (mais letal no corpo a corpo)
- **Comportamento**: `phantom_shoot` → **`phantom_hunt`**

### 👻 **Invisibilidade Estratégica:**
Durante invisibilidade, o Phantom se **reposiciona estrategicamente**:

- **Muito longe (>400px)**: Aproxima-se sutilmente
- **Muito perto (<120px)**: Afasta-se para criar distância de investida  
- **Distância ideal (120-400px)**: Movimento lateral para flanquear

### ⚡ **Aparição Agressiva:**
Quando fica visível novamente:
- **Investida imediata** em direção ao jogador
- Cooldown de tiro reduzido (70% do tempo já "passou")
- Sem pausa - ataque direto

### 🎨 **Novos Efeitos Visuais:**
1. **Durante invisibilidade**: Círculos concêntricos roxos
2. **Durante investida**: Rastro de movimento indicando velocidade e direção
3. **Transições**: Efeitos de piscada e brilho

## Comportamento Final do Phantom

### 🎮 **Ciclo de Combate:**

1. **Aparece** → Investida imediata
2. **Longa distância** → Aproxima atirando  
3. **Média distância** → Investida agressiva
4. **Curta distância** → Ataque corpo a corpo
5. **Recebe dano** → Fica invisível
6. **Invisível** → Reposicionamento estratégico
7. **Volta a aparecer** → Repete ciclo

### ⚔️ **Estratégias de Enfrentamento:**
- **Mantenha distância** para evitar investidas
- **Aproveite a invisibilidade** para reposicionar-se
- **Cuidado com flanqueamentos** durante invisibilidade  
- **Ataque durante transições** (piscada ao aparecer)

### 🔥 **Nível de Ameaça:**
- **Visível**: ⚠️ **ALTO** - Investidas agressivas + projéteis
- **Invisível**: 🛡️ **BAIXO** - Apenas reposicionamento
- **Transição**: ⚡ **CRÍTICO** - Investida surpresa

## Resultado Final ✅

O Phantom agora é um **predador híbrido** que:
- ✅ **Persegue ativamente** o jogador
- ✅ **Combina ataques** à distância e corpo a corpo  
- ✅ **Usa invisibilidade** para reposicionamento estratégico
- ✅ **Apresenta ameaça real** de paralização/contato
- ✅ **Mantém comportamento** interessante e desafiador

**Phantom = Caçador Invisível Híbrido!** 👻⚔️