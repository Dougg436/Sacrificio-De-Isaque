var canvas = document.getElementById('gameScreen');
var ctx = canvas.getContext('2d');

var playerSize = 50;
var x = (canvas.width - playerSize) / 2;
var y = (canvas.height - playerSize) / 2;
var pSpeed = 4;
var pDamage = 1;

var keys = {};
var mouseX = x, mouseY = y;

var playerImg = new Image();
var bulletImg = new Image();
playerImg.src = "images/player.png"; 
bulletImg.src = "images/laser.png";

var bullets = [];
var powerUps = [];

function drawPlayer() {
    ctx.save();
    ctx.translate(x + playerSize/2, y + playerSize/2);
    var angle = Math.atan2(mouseY - (y + playerSize/2), mouseX - (x + playerSize/2));
    ctx.rotate(angle);
    ctx.drawImage(playerImg, -playerSize/2, -playerSize/2, playerSize, playerSize);
    ctx.restore();
}

function spawnPowerUp(px, py) {
    let effectType = [
        {name: "damage+", effect: () => pDamage += 1, icon: bulletImg}
    ];

    let chosen = effectType[Math.floor(Math.random() * effectType.length)];

    powerUps.push({
        x: px,
        y: py,
        size: 50,
        effectType: chosen,
        img: chosen.icon
    });
}

function update() {
    for (let key in keys) {
        if (keys[key]) {
            switch(key) {
                case 'w': y -= pSpeed; break;
                case 's': y += pSpeed; break;
                case 'a': x -= pSpeed; break;
                case 'd': x += pSpeed; break;
            }
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bullets.forEach((b, i) => {
        b.x += b.vx;
        b.y += b.vy;
        ctx.drawImage(bulletImg, b.x - b.size/2, b.y - b.size/2, b.size, b.size);

        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    });

    powerUps.forEach((p, i) => {
        ctx.drawImage(p.img, p.x - p.size/2, p.y - p.size/2, p.size, p.size);

        let dx = (x + playerSize/2) - p.x;
        let dy = (y + playerSize/2) - p.y;
        let distance = Math.sqrt(dx*dx + dy*dy);

        if(distance < (playerSize/2 + p.size/2)) {
            p.effectType.effect();
            powerUps.splice(i, 1);
        }
    });
    ctx.font = "45px Arial"
    ctx.fillText(pDamage, 10, 50)
    drawPlayer();
    requestAnimationFrame(update);
}

canvas.addEventListener('mousemove', e => {
    let rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
    let angle = Math.atan2(
        mouseY - (y + playerSize/2),
        mouseX - (x + playerSize/2)
    );
    let speed = 10;
    let size = 50;

    bullets.push({
        x: x + playerSize/2,
        y: y + playerSize/2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        damage: pDamage
    });

    let rect = canvas.getBoundingClientRect();
    let mouseClickX = e.clientX - rect.left;
    let mouseClickY = e.clientY - rect.top;
});

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

playerImg.onload = () => update();
