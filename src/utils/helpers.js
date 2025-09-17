// funções auxiliares

// --- Desenho simples no canvas para visualização ---
export function drawDungeonCanvas(dungeon, canvasId, cellSize = 64) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) throw new Error('Canvas não encontrado: '+canvasId);
  canvas.width  = dungeon.width * cellSize;
  canvas.height = dungeon.height * cellSize;
  const ctx = canvas.getContext('2d');

  // fundo
  ctx.fillStyle = '#111';
  ctx.fillRect(0,0,canvas.width, canvas.height);

  // desenhar grid / salas
  for (let y=0;y<dungeon.height;y++){
    for (let x=0;x<dungeon.width;x++){
      const cell = dungeon.grid[y][x];
      const px = x * cellSize;
      const py = y * cellSize;
      if (!cell) {
        // vazio
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(px,py,cellSize,cellSize);
        continue;
      }
      // cor conforme tipo
      if (cell.type === 'start') ctx.fillStyle = '#204040';
      else if (cell.type === 'boss') ctx.fillStyle = '#400020';
      else if (cell.type === 'treasure') ctx.fillStyle = '#404020';
      else ctx.fillStyle = '#222';

      // sala
      ctx.fillRect(px+4, py+4, cellSize-8, cellSize-8);

      // portas (retângulos nas bordas)
      ctx.fillStyle = '#999';
      const doorW = Math.floor(cellSize * 0.18);
      const doorH = Math.floor(cellSize * 0.12);
      if (cell.doors.N) ctx.fillRect(px + (cellSize-doorW)/2, py, doorW, doorH);
      if (cell.doors.S) ctx.fillRect(px + (cellSize-doorW)/2, py+cellSize-doorH, doorW, doorH);
      if (cell.doors.E) ctx.fillRect(px+cellSize-doorH, py + (cellSize-doorW)/2, doorH, doorW);
      if (cell.doors.W) ctx.fillRect(px, py + (cellSize-doorW)/2, doorH, doorW);

      // indicador de inimigos / itens (pequenos círculos)
      if (cell.enemies && cell.enemies.length) {
        ctx.fillStyle = '#ff6666';
        ctx.beginPath();
        ctx.arc(px + 12, py + 12, 6, 0, Math.PI*2);
        ctx.fill();
      }
      if (cell.items && cell.items.length) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(px + cellSize-12, py + 12, 6, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  // desenhar grid lines (opcional)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  for (let x=0;x<=dungeon.width;x++){
    ctx.beginPath();
    ctx.moveTo(x*cellSize,0);
    ctx.lineTo(x*cellSize, canvas.height);
    ctx.stroke();
  }
  for (let y=0;y<=dungeon.height;y++){
    ctx.beginPath();
    ctx.moveTo(0,y*cellSize);
    ctx.lineTo(canvas.width, y*cellSize);
    ctx.stroke();
  }
}
