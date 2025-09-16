// entidade bullet
export function createBullet(x, y, angle, speed, size, damage) {
	return {
		x,
		y,
		vx: Math.cos(angle) * speed,
		vy: Math.sin(angle) * speed,
		size,
		damage
	};
}
