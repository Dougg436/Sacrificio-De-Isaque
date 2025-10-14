// teclado/mouse/gamepad
export const keys = {};

export function setupKeyboard() {
	document.addEventListener('keydown', e => keys[e.key] = true);
	document.addEventListener('keyup', e => keys[e.key] = false);
}

export let mouseX = 0, mouseY = 0;

export function setupMouse(canvas) {
	canvas.addEventListener('mousemove', e => {
		let rect = canvas.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
	});
}
