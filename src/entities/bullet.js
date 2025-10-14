// entidade bullet
export function createBullet(x, y, angle, speed, size, damage, isEnemy = false, enemyType = null) {
	return {
		x,
		y,
		vx: Math.cos(angle) * speed,
		vy: Math.sin(angle) * speed,
		size,
		damage,
		isEnemy, // se true, é tiro de inimigo
		enemyType // tipo do inimigo que atirou (para imunidades)
	};
}
