# Correções do Comportamento do Phantom

## Problema Identificado
O Phantom estava com comportamento incorreto:
- ❌ Fugia constantemente mesmo quando visível
- ❌ Nunca parava para atacar adequadamente
- ❌ Movimento muito errático e constante

## Correções Implementadas

### 1. **Comportamento Quando Visível** ✅
**Antes:**
```javascript
// Movia-se constantemente em direção ao player
enemy.vx = (dx / distance) * enemy.speed * 0.8;
enemy.vy = (dy / distance) * enemy.speed * 0.8;
```

**Depois:**
```javascript
// Comportamento mais estático e estratégico
enemy.vx *= 0.85; // Para gradualmente
enemy.vy *= 0.85;

// Move apenas quando necessário:
if (distance > 450) {
    // Aproxima-se lentamente se muito longe
} else if (distance < 200) {
    // Afasta-se lentamente se muito perto
}
// Entre 200-450px: fica estático e atira
```

### 2. **Comportamento Durante Invisibilidade** ✅
**Antes:**
```javascript
// Fugia constantemente do player
enemy.vx = awayX * enemy.speed * 0.7;
enemy.vy = awayY * enemy.speed * 0.7;
```

**Depois:**
```javascript
// Movimento mais sutil e ocasional
enemy.vx *= 0.92; // Para gradualmente
enemy.vy *= 0.92;

// Foge apenas se estiver muito perto (< 150px)
if (distance < 150) {
    // Fuga sutil
    enemy.vx += awayX * enemy.speed * 0.4;
}
```

### 3. **Transição Entre Estados** ✅
**Antes:**
```javascript
// Transição abrupta
enemy.isVisible = true;
enemy.invisibilityStartTime = 0;
```

**Depois:**
```javascript
// Transição suave com pausa
enemy.isVisible = true;
enemy.invisibilityStartTime = 0;
enemy.vx = 0; // Para completamente
enemy.vy = 0;
enemy.lastShotTime = now; // Reset cooldown
```

## Novo Comportamento do Phantom

### 🎯 **Estado Visível**
- **Posicionamento**: Fica entre 200-450 pixels do jogador
- **Movimento**: Estático na maior parte do tempo
- **Ajuste**: Aproxima-se se muito longe, afasta-se se muito perto
- **Ataque**: Atira regularmente a cada 2.2 segundos
- **Quando recebe dano**: Fica invisível imediatamente

### 👻 **Estado Invisível**  
- **Duração**: 4 segundos
- **Movimento**: Quase estático, para gradualmente
- **Fuga**: Apenas se jogador estiver muito perto (< 150px)
- **Frequência**: Reposicionamento a cada 1-2 segundos (se necessário)
- **Ataque**: Não ataca durante invisibilidade

### 🔄 **Transição Visível→Invisível**
- **Trigger**: Ao receber qualquer dano
- **Efeito**: Fica invisível instantaneamente e para de atirar

### 🔄 **Transição Invisível→Visível**
- **Trigger**: Após 4 segundos automático
- **Efeito**: Para completamente, reset do cooldown de tiro
- **Visual**: Piscada suave por 1 segundo

## Resultado Final ✅

**Phantom Visível:**
- ✅ Para de se mover constantemente
- ✅ Fica em posição estratégica para atacar
- ✅ Ataca regularmente sem fugir

**Phantom Invisível:**
- ✅ Não foge constantemente
- ✅ Movimento sutil apenas quando necessário
- ✅ Comportamento mais "fantasmagórico"

**Balanceamento:**
- ✅ Mais desafiador quando visível (ataque focado)
- ✅ Menos irritante quando invisível (não foge sempre)
- ✅ Transições suaves entre estados