// geração procedural das salas
// dungeon-gen.js
// Geração procedural simples de masmorra tipo Binding of Isaac
// Usa random walk em grid, seedable RNG e garante conectividade.
// Retorna um objeto {grid, rooms, start, boss, width, height}
import { drawDungeonCanvas } from '../utils/helpers.js';

export function mulberry32(seed) {
  // seed -> RNG function returning [0,1)
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const DIRS = [
  {x: 0, y: -1, name: 'N'},
  {x: 1, y: 0,  name: 'E'},
  {x: 0, y: 1,  name: 'S'},
  {x: -1,y: 0,  name: 'W'}
];

function inBounds(x, y, w, h) {
  return x >= 0 && y >= 0 && x < w && y < h;
}

export function generateDungeon({
  seed = 12345,
  width = 9,
  height = 9,
  targetRooms = 12,
  maxAttempts = 10000
} = {}) {
  const rand = mulberry32(seed);

  // grid inicial: null = vazio, objeto = sala
  const grid = Array.from({length: height}, () => Array.from({length: width}, () => null));

  // começar do centro
  const startX = Math.floor(width / 2);
  const startY = Math.floor(height / 2);

  const makeRoom = (x,y, type='normal') => ({
    x, y,
    type,            // 'start' | 'boss' | 'normal' | 'treasure' | 'shop'
    doors: {N:false,E:false,S:false,W:false},
    id: `${x},${y}`,
    enemies: [],
    items: []
  });

  const rooms = [];
  grid[startY][startX] = makeRoom(startX,startY,'start');
  rooms.push(grid[startY][startX]);

  let attempts = 0;
  while (rooms.length < targetRooms && attempts < maxAttempts) {
    attempts++;
    // pegue uma sala já criada e tente expandir dela
    const src = rooms[Math.floor(rand() * rooms.length)];
    const dir = DIRS[Math.floor(rand() * 4)];
    const nx = src.x + dir.x;
    const ny = src.y + dir.y;
    if (!inBounds(nx,ny,width,height)) continue;
    if (grid[ny][nx] !== null) continue; // já existe sala

    // Chance de pular posições para criar layouts mais esparsos
    const skipChance = 0.3; // 30% chance de tentar posição mais distante
    let finalX = nx, finalY = ny;
    
    if (rand() < skipChance) {
      // Tentar ir mais longe na mesma direção
      const extraX = nx + dir.x;
      const extraY = ny + dir.y;
      if (inBounds(extraX, extraY, width, height) && grid[extraY][extraX] === null) {
        finalX = extraX;
        finalY = extraY;
      }
    }

    // Verificar se não está criando muitas salas adjacentes (anti-blob)
    let adjacentCount = 0;
    for (let d of DIRS) {
      const adjX = finalX + d.x;
      const adjY = finalY + d.y;
      if (inBounds(adjX, adjY, width, height) && grid[adjY][adjX] !== null) {
        adjacentCount++;
      }
    }
    
    // Se já tem muitas salas adjacentes, tentar novamente com chance menor
    if (adjacentCount >= 3 && rand() < 0.7) continue;
    if (adjacentCount >= 2 && rand() < 0.4) continue;

    // criar a sala
    grid[finalY][finalX] = makeRoom(finalX, finalY, 'normal');
    rooms.push(grid[finalY][finalX]);
  }

  // Garante conectividade ligando portas entre salas adjacentes
  for (let r of rooms) {
    for (let d of DIRS) {
      const nx = r.x + d.x;
      const ny = r.y + d.y;
      if (inBounds(nx,ny,width,height) && grid[ny][nx]) {
        // ativa portas em ambos os lados
        if (d.name === 'N') { r.doors.N = true; grid[ny][nx].doors.S = true; }
        if (d.name === 'S') { r.doors.S = true; grid[ny][nx].doors.N = true; }
        if (d.name === 'E') { r.doors.E = true; grid[ny][nx].doors.W = true; }
        if (d.name === 'W') { r.doors.W = true; grid[ny][nx].doors.E = true; }
      }
    }
  }

  // Garantir conectividade completa usando BFS para conectar salas isoladas
  const visited = new Set();
  const connectivityQueue = [rooms[0]];
  visited.add(rooms[0].id);
  
  while (connectivityQueue.length > 0) {
    const current = connectivityQueue.shift();
    
    for (let d of DIRS) {
      const nx = current.x + d.x;
      const ny = current.y + d.y;
      if (inBounds(nx, ny, width, height) && grid[ny][nx] && !visited.has(grid[ny][nx].id)) {
        visited.add(grid[ny][nx].id);
        connectivityQueue.push(grid[ny][nx]);
      }
    }
  }
  
  // Se algumas salas não foram visitadas, conectá-las forçadamente
  const unvisited = rooms.filter(r => !visited.has(r.id));
  for (let unvisitedRoom of unvisited) {
    // Encontrar a sala visitada mais próxima
    let closest = null;
    let minDist = Infinity;
    
    for (let visitedId of visited) {
      const visitedRoom = rooms.find(r => r.id === visitedId);
      const dist = Math.abs(visitedRoom.x - unvisitedRoom.x) + Math.abs(visitedRoom.y - unvisitedRoom.y);
      if (dist < minDist) {
        minDist = dist;
        closest = visitedRoom;
      }
    }
    
    // Criar uma conexão forçada (ponte)
    if (closest) {
      const dx = unvisitedRoom.x - closest.x;
      const dy = unvisitedRoom.y - closest.y;
      
      // Criar salas intermediárias se necessário
      let currentX = closest.x;
      let currentY = closest.y;
      
      while (currentX !== unvisitedRoom.x || currentY !== unvisitedRoom.y) {
        if (currentX !== unvisitedRoom.x) {
          currentX += dx > 0 ? 1 : -1;
        } else if (currentY !== unvisitedRoom.y) {
          currentY += dy > 0 ? 1 : -1;
        }
        
        if (inBounds(currentX, currentY, width, height) && !grid[currentY][currentX]) {
          grid[currentY][currentX] = makeRoom(currentX, currentY, 'normal');
          rooms.push(grid[currentY][currentX]);
        }
      }
      
      // Reconectar portas após criar ponte
      for (let r of rooms) {
        for (let d of DIRS) {
          const nx = r.x + d.x;
          const ny = r.y + d.y;
          if (inBounds(nx,ny,width,height) && grid[ny][nx]) {
            if (d.name === 'N') { r.doors.N = true; grid[ny][nx].doors.S = true; }
            if (d.name === 'S') { r.doors.S = true; grid[ny][nx].doors.N = true; }
            if (d.name === 'E') { r.doors.E = true; grid[ny][nx].doors.W = true; }
            if (d.name === 'W') { r.doors.W = true; grid[ny][nx].doors.E = true; }
          }
        }
      }
      
      visited.add(unvisitedRoom.id);
    }
  }

  // Encontrar a sala do boss: a mais distante da start por BFS
  const start = grid[startY][startX];
  const bfsQueue = [start];
  const dist = {[start.id]: 0};
  const parent = {};
  let furthest = start;
  while (bfsQueue.length) {
    const cur = bfsQueue.shift();
    const curDist = dist[cur.id];
    if (curDist > dist[furthest.id]) furthest = cur;
    for (const d of DIRS) {
      const nx = cur.x + d.x, ny = cur.y + d.y;
      if (!inBounds(nx,ny,width,height)) continue;
      const neigh = grid[ny][nx];
      if (!neigh) continue;
      if (dist[neigh.id] === undefined) {
        dist[neigh.id] = curDist + 1;
        parent[neigh.id] = cur.id;
        bfsQueue.push(neigh);
      }
    }
  }
  // marca boss
  furthest.type = 'boss';

  // opcional: marcar 1-2 salas de tesouro espalhadas
  const candidates = rooms.filter(r => r.type === 'normal');
  const numTreasure = Math.max(0, Math.floor(targetRooms * 0.1)); // ~10%
  for (let i=0;i<numTreasure && candidates.length;i++) {
    const idx = Math.floor(rand() * candidates.length);
    candidates[idx].type = 'treasure';
    candidates.splice(idx,1);
  }

  // opcional: povoar inimigos e itens simples
  for (let r of rooms) {
    if (r.type === 'start') continue;
    // chance de inimigo baseada em tipo
    const enemyChance = r.type === 'treasure' ? 0.25 : (r.type === 'boss' ? 1 : 0.6);
    if (rand() < enemyChance) {
      // simples: definir quantidade e tipo por seed
      const qty = r.type === 'boss' ? 1 : (Math.random() < 0.5 ? 1 : 2);
      for (let i=0;i<qty;i++) r.enemies.push({type: r.type === 'boss' ? 'boss' : 'fly', hp: r.type === 'boss' ? 50 : 5});
    }
    // itens
    if (r.type === 'treasure' && rand() < 0.9) r.items.push({type:'redHeart'});
    if (r.type === 'normal' && rand() < 0.15) r.items.push({type:'damageUp'});
  }

  return {
    grid,
    rooms,
    start,
    boss: furthest,
    width,
    height,
    seed
  };
}
