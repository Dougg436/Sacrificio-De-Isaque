# Inimigo Phantom - Documentação Técnica

## Resumo
Foi criado um novo tipo de inimigo chamado "phantom" que implementa um sistema de invisibilidade completo conforme especificado.

## Características do Phantom

### Propriedades Base
- **Tamanho**: 38px (maior que outros inimigos)
- **Vida**: 6 HP (mais resistente)
- **Velocidade**: 2.5 (mais rápido)
- **Dano**: 2 (dobro do dano padrão)
- **Cor**: Roxo (#663399)
- **Comportamento**: "phantom_shoot" (específico)

### Sistema de Invisibilidade

#### Estado Visível
- **Aparência**: Totalmente opaco, roxo com borda preta
- **Comportamento**: Move-se cautelosamente em direção ao player (80% da velocidade normal)
- **Ataque**: Atira projéteis a cada 2.2 segundos com 92% de precisão
- **Vulnerabilidade**: Pode receber dano normalmente
- **Colisão**: Pode colidir com o player causando 2 de dano

#### Transição para Invisibilidade
- **Trigger**: Automaticamente quando recebe qualquer dano (se estiver vivo)
- **Efeito Imediato**: 
  - Fica 90% transparente (apenas 10% de opacidade)
  - Para de atacar completamente
  - Inicia comportamento de fuga
  - Torna-se imune a danos e colisões
- **Duração**: 4 segundos (4000ms)

#### Estado Invisível
- **Aparência**: 
  - 90% transparente
  - Efeito de pulso roxo ao redor
  - Texto "INVISÍVEL" acima do inimigo
  - Barra de vida desaparece
- **Comportamento**: 
  - Move-se para longe do player com 70% da velocidade
  - Reposiciona-se periodicamente (a cada 30-60 frames)
  - Não pode atacar
- **Imunidades**: 
  - Imune a todos os danos
  - Não colide com o player
  - Projéteis passam através dele

#### Retorno ao Estado Visível
- **Trigger**: Automático após 4 segundos
- **Efeito Visual**: 
  - Piscada suave nos primeiros 1000ms
  - Efeito de brilho roxo
  - Gradualmente volta à opacidade total
- **Comportamento**: Retorna ao padrão de ataque normal

## Implementação Técnica

### Arquivos Modificados

#### `src/entities/enemy.js`
1. **Novo tipo de inimigo**: Adicionado "phantom" com propriedades específicas
2. **Função `updateEnemy`**: Lógica especial para phantom com estados de visibilidade
3. **Função `damageEnemy`**: Sistema de transição para invisibilidade
4. **Função `checkEnemyCollision`**: Verificação de visibilidade para colisões
5. **Função `drawEnemy`**: Renderização com transparência e efeitos visuais

#### `src/main.js`
1. **Sistema de spawn**: Adicionado "phantom" à lista de tipos possíveis
2. **Colisão de projéteis**: Verificação se dano foi aplicado antes de remover projétil
3. **Save/Load de estado**: Salva e restaura propriedades de invisibilidade do phantom

### Propriedades Específicas do Phantom

```javascript
{
  isVisible: true,              // Estado atual de visibilidade
  invisibilityDuration: 4000,   // 4 segundos invisível
  invisibilityStartTime: 0,     // Timestamp quando ficou invisível
  repositionOnInvisible: true,  // Se reposiciona durante invisibilidade
  repositionTimer: 0,           // Timer para reposicionamento
  originalColor: '#663399'      // Cor original para restauração
}
```

## Como Testar

### Pré-requisitos
1. Servidor web local (pode usar VS Code Live Server, Python http.server, etc.)
2. Navegador moderno com suporte a ES6 modules

### Passos de Teste
1. **Iniciar o jogo**: Abrir `game.html` em servidor local
2. **Encontrar phantom**: Navegar pelas salas até encontrar inimigo roxo
3. **Testar invisibilidade**: 
   - Atirar no phantom quando visível
   - Observar transição para invisibilidade (fica transparente)
   - Tentar atirar novamente - projéteis não causam dano
   - Aguardar 4 segundos para ele ficar visível novamente
4. **Testar comportamento**:
   - Phantom visível ataca e pode ser morto normalmente
   - Phantom invisível foge do player e é imune

### Indicadores Visuais
- **Visível**: Roxo sólido, barra de vida, ataca normalmente
- **Invisível**: 90% transparente, pulso roxo, texto "INVISÍVEL"
- **Transição**: Piscada e brilho suave ao ficar visível

### Controles de Debug
- **Tecla 'I'**: Ativa modo debug da IA (mostra informações extras)
- **Tecla 'P'**: Debug geral (informações de desenvolvimento)

## Balanceamento

### Pontos Fortes do Phantom
- Alta vida (6 HP vs 3-5 dos outros)
- Alto dano (2 vs 1 dos outros)
- Velocidade superior (2.5 vs 1-2 dos outros)
- Imunidade temporária a danos

### Pontos Fracos
- Não ataca durante invisibilidade (4 segundos de vulnerabilidade ofensiva)
- Padrão previsível (sempre fica invisível ao receber dano)
- Movimento de fuga durante invisibilidade pode ser explorado pelo player

### Estratégias Contra Phantom
1. **Hit-and-run**: Causar dano e se afastar durante invisibilidade
2. **Predição**: Antecipar onde ele reaparecerá após invisibilidade
3. **Aproveitar cooldown**: Atacar imediatamente quando fica visível (durante piscada)

## Conclusão

O phantom implementa exatamente o comportamento solicitado:
- ✅ Ataca quando visível com cooldown
- ✅ Fica invisível ao receber dano
- ✅ É imune durante invisibilidade
- ✅ Se reposiciona durante invisibilidade
- ✅ Retorna automaticamente ao estado visível
- ✅ Indicadores visuais claros para o player
- ✅ Sistema de vulnerabilidade implementado corretamente

O inimigo adiciona uma nova camada tática ao jogo, forçando o player a adaptar sua estratégia de combate.