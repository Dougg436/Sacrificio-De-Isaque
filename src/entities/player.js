// entidade player
<<<<<<< Updated upstream
export let player = {
	size: 50,
	x: 0, // será inicializado no main.js
	y: 0,
	speed: 4,
	damage: 1,
	img: null
};

export function drawPlayer(ctx, mouseX, mouseY) {
	ctx.save();
	ctx.translate(player.x + player.size/2, player.y + player.size/2);
	let angle = Math.atan2(mouseY - (player.y + player.size/2), mouseX - (player.x + player.size/2));
	ctx.rotate(angle);
	ctx.drawImage(player.img, -player.size/2, -player.size/2, player.size, player.size);
	ctx.restore();
}
=======
>>>>>>> Stashed changes
