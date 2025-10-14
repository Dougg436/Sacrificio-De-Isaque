// gerenciamento de imagens
export const playerImg = new Image();
export const bulletImg = new Image();
playerImg.src = "assets/sprites/player/player_eye.png";
bulletImg.src = "assets/sprites/particles/laser.png";

// gerenciamento de áudio
export const bossBattleMusic = new Audio();
bossBattleMusic.src = "assets/sounds/boss_battle.mp3";
bossBattleMusic.loop = true; // Loop contínuo durante a batalha
bossBattleMusic.volume = 0.5; // Volume médio (ajustável)

export const dieSound = new Audio();
dieSound.src = "assets/sounds/die.wav";
dieSound.volume = 0.7; // Volume alto para impacto

// Sistema de playlist - músicas de fundo
export const playlist = [];
for (let i = 1; i <= 10; i++) {
	const music = new Audio();
	music.src = `assets/sounds/playlist/${i}.mp3`;
	music.volume = 0.4; // Volume mais baixo para música de fundo
	playlist.push(music);
}
