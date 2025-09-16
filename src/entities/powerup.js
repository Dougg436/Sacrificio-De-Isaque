// entidade powerup
export function createPowerUp(px, py, icon, effect) {
    return {
        x: px,
        y: py,
        size: 50,
        effect,
        img: icon
    };
}
