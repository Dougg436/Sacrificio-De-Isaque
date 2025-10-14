// teclado/mouse/gamepad
export const keys = {};

// Sistema avançado de captura de inputs para IA
export const inputHistory = [];
export const keyTimestamps = {};
export const keyDurations = {};
export const mouseHistory = [];

let currentFrame = 0;

export function setupKeyboard() {
	document.addEventListener('keydown', e => {
		if (!keys[e.key]) {
			keys[e.key] = true;
			keyTimestamps[e.key] = Date.now();
		}
	});
	
	document.addEventListener('keyup', e => {
		if (keys[e.key]) {
			keys[e.key] = false;
			const duration = Date.now() - (keyTimestamps[e.key] || 0);
			keyDurations[e.key] = duration;
		}
	});
}

export let mouseX = 0, mouseY = 0;

export function setupMouse(canvas) {
	canvas.addEventListener('mousemove', e => {
		let rect = canvas.getBoundingClientRect();
		
		// Calcular escala do canvas (tamanho visual vs tamanho interno)
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		
		// Ajustar coordenadas do mouse considerando a escala
		mouseX = (e.clientX - rect.left) * scaleX;
		mouseY = (e.clientY - rect.top) * scaleY;
		
		// Registrar movimento do mouse no histórico
		mouseHistory.push({
			x: mouseX,
			y: mouseY,
			timestamp: Date.now(),
			frame: currentFrame
		});
		
		// Limitar histórico
		if (mouseHistory.length > 300) {
			mouseHistory.shift();
		}
	});
	
	canvas.addEventListener('click', e => {
		recordInputSnapshot('click');
	});
}

// Capturar snapshot completo dos inputs para treinamento da IA
export function recordInputSnapshot(action = 'movement') {
	const now = Date.now();
	
	// Capturar estado atual das teclas WASD
	const keyState = {
		w: keys['w'] || keys['W'] || false,
		a: keys['a'] || keys['A'] || false,
		s: keys['s'] || keys['S'] || false,
		d: keys['d'] || keys['D'] || false
	};
	
	// Capturar durações de pressionamento
	const keyDurationState = {
		w: keys['w'] || keys['W'] ? now - (keyTimestamps['w'] || keyTimestamps['W'] || now) : (keyDurations['w'] || keyDurations['W'] || 0),
		a: keys['a'] || keys['A'] ? now - (keyTimestamps['a'] || keyTimestamps['A'] || now) : (keyDurations['a'] || keyDurations['A'] || 0),
		s: keys['s'] || keys['S'] ? now - (keyTimestamps['s'] || keyTimestamps['S'] || now) : (keyDurations['s'] || keyDurations['S'] || 0),
		d: keys['d'] || keys['D'] ? now - (keyTimestamps['d'] || keyTimestamps['D'] || now) : (keyDurations['d'] || keyDurations['D'] || 0)
	};
	
	// Calcular velocidade e aceleração do mouse
	let mouseVelocityX = 0, mouseVelocityY = 0;
	let mouseAccelX = 0, mouseAccelY = 0;
	
	if (mouseHistory.length >= 2) {
		const recent = mouseHistory[mouseHistory.length - 1];
		const previous = mouseHistory[mouseHistory.length - 2];
		const timeDiff = Math.max(recent.timestamp - previous.timestamp, 1);
		
		mouseVelocityX = (recent.x - previous.x) / timeDiff * 1000;
		mouseVelocityY = (recent.y - previous.y) / timeDiff * 1000;
		
		if (mouseHistory.length >= 3) {
			const older = mouseHistory[mouseHistory.length - 3];
			const prevTimeDiff = Math.max(previous.timestamp - older.timestamp, 1);
			const prevVelX = (previous.x - older.x) / prevTimeDiff * 1000;
			const prevVelY = (previous.y - older.y) / prevTimeDiff * 1000;
			
			mouseAccelX = (mouseVelocityX - prevVelX) / timeDiff * 1000;
			mouseAccelY = (mouseVelocityY - prevVelY) / timeDiff * 1000;
		}
	}
	
	const inputData = {
		timestamp: now,
		frame: currentFrame,
		action: action,
		keys: {...keyState},
		keyDurations: {...keyDurationState},
		mouse: {
			x: mouseX,
			y: mouseY,
			velocityX: mouseVelocityX,
			velocityY: mouseVelocityY,
			accelerationX: mouseAccelX,
			accelerationY: mouseAccelY
		}
	};
	
	inputHistory.push(inputData);
	
	// Limitar histórico para evitar uso excessivo de memória
	if (inputHistory.length > 1000) {
		inputHistory.shift();
	}
	
	return inputData;
}

// Obter sequência de inputs recentes para análise de padrões
export function getRecentInputSequence(count = 10) {
	return inputHistory.slice(-count);
}

// Analisar padrões de input complexos
export function analyzeInputPatterns() {
	if (inputHistory.length < 20) return null;
	
	const recent = inputHistory.slice(-20);
	
	// Análise de frequência de teclas
	const keyFrequency = {
		w: recent.filter(r => r.keys.w).length / recent.length,
		a: recent.filter(r => r.keys.a).length / recent.length,
		s: recent.filter(r => r.keys.s).length / recent.length,
		d: recent.filter(r => r.keys.d).length / recent.length
	};
	
	// Análise de combinações de teclas
	const combinations = {
		wa: recent.filter(r => r.keys.w && r.keys.a).length / recent.length,
		wd: recent.filter(r => r.keys.w && r.keys.d).length / recent.length,
		sa: recent.filter(r => r.keys.s && r.keys.a).length / recent.length,
		sd: recent.filter(r => r.keys.s && r.keys.d).length / recent.length
	};
	
	// Análise de duração média de pressionamento
	const avgDurations = {
		w: recent.filter(r => r.keys.w).reduce((sum, r) => sum + r.keyDurations.w, 0) / Math.max(recent.filter(r => r.keys.w).length, 1),
		a: recent.filter(r => r.keys.a).reduce((sum, r) => sum + r.keyDurations.a, 0) / Math.max(recent.filter(r => r.keys.a).length, 1),
		s: recent.filter(r => r.keys.s).reduce((sum, r) => sum + r.keyDurations.s, 0) / Math.max(recent.filter(r => r.keys.s).length, 1),
		d: recent.filter(r => r.keys.d).reduce((sum, r) => sum + r.keyDurations.d, 0) / Math.max(recent.filter(r => r.keys.d).length, 1)
	};
	
	// Análise de ritmo (variação temporal)
	const timestamps = recent.map(r => r.timestamp);
	const intervals = [];
	for (let i = 1; i < timestamps.length; i++) {
		intervals.push(timestamps[i] - timestamps[i-1]);
	}
	
	const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
	const intervalVariance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
	
	return {
		keyFrequency,
		combinations,
		avgDurations,
		rhythm: {
			avgInterval,
			variance: intervalVariance,
			consistency: 1 - Math.min(Math.sqrt(intervalVariance) / avgInterval, 1)
		}
	};
}

// Incrementar frame counter
export function updateFrame() {
	currentFrame++;
	recordInputSnapshot();
}
