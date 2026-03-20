const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Game Constants
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const SPEED = 5;
const GROUND_Y = 500;
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Assets
const nyanImg = new Image();
nyanImg.src = 'Nyan_cat_250px_frame.jpg'; // The user's uploaded file

// Game State
let score = 0;
let gameActive = true;
let cameraX = 0;

// Input Handling
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

class Player {
    constructor() {
        this.width = 100;
        this.height = 60;
        this.x = 100;
        this.y = GROUND_Y - this.height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.trail = [];
    }

    update() {
        // Horizontal Movement
        if (keys['ArrowRight'] || keys['KeyD']) this.velocityX = SPEED;
        else if (keys['ArrowLeft'] || keys['KeyA']) this.velocityX = -SPEED;
        else this.velocityX = 0;

        // Jump
        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && !this.isJumping) {
            this.velocityY = JUMP_FORCE;
            this.isJumping = true;
        }

        // Apply Gravity
        this.velocityY += GRAVITY;
        this.y += this.velocityY;
        this.x += this.velocityX;

        // Platform/Ground Collision
        if (this.y + this.height > GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }

        // Prevent going out of bounds left
        if (this.x < 0) this.x = 0;

        // Update Camera
        cameraX = Math.max(0, this.x - CANVAS_WIDTH / 4);

        // Update Rainbow Trail
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > 20) this.trail.pop();

        // Score based on distance
        let currentScore = Math.floor(this.x / 100);
        if (currentScore > score) {
            score = currentScore;
            scoreElement.innerText = score;
        }
    }

    draw() {
        // Draw Rainbow Trail
        const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082'];
        const segmentHeight = this.height / colors.length;

        this.trail.forEach((pos, index) => {
            const alpha = 1 - (index / this.trail.length);
            const offset = Math.sin(Date.now() / 100 + index) * 5; // Wave effect

            colors.forEach((color, i) => {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = color;
                ctx.fillRect(
                    pos.x - cameraX - (index * 5), 
                    pos.y + (i * segmentHeight) + offset, 
                    10, 
                    segmentHeight
                );
            });
        });
        ctx.globalAlpha = 1;

        // Draw Nyan Cat
        if (nyanImg.complete) {
            // Flip image if moving left
            if (this.velocityX < 0) {
                ctx.save();
                ctx.translate(this.x - cameraX + this.width, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(nyanImg, 0, 0, this.width, this.height);
                ctx.restore();
            } else {
                ctx.drawImage(nyanImg, this.x - cameraX, this.y, this.width, this.height);
            }
        } else {
            // Placeholder if image hasn't loaded
            ctx.fillStyle = '#ffc0cb';
            ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
        }
    }
}

class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
        ctx.strokeRect(this.x - cameraX, this.y, this.width, this.height);
    }
}

// Background Stars
const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * CANVAS_WIDTH * 10,
    y: Math.random() * CANVAS_HEIGHT,
    size: Math.random() * 2,
    speed: Math.random() * 0.5 + 0.1
}));

function drawBackground() {
    stars.forEach(star => {
        const parallaxX = (star.x - cameraX * star.speed) % CANVAS_WIDTH;
        ctx.fillStyle = 'white';
        const finalX = parallaxX < 0 ? parallaxX + CANVAS_WIDTH : parallaxX;
        ctx.fillRect(finalX, star.y, star.size, star.size);
    });
}

const player = new Player();
const platforms = [
    new Platform(400, 400, 200, 20),
    new Platform(700, 300, 200, 20),
    new Platform(1100, 250, 300, 20),
    new Platform(1500, 400, 200, 20),
    new Platform(1900, 300, 400, 20),
    new Platform(2500, 200, 200, 20),
    new Platform(2800, 400, 200, 20),
];

// Simple platform generation as you go
function generatePlatforms() {
    const lastPlatform = platforms[platforms.length - 1];
    if (lastPlatform.x - cameraX < CANVAS_WIDTH * 2) {
        const newX = lastPlatform.x + 300 + Math.random() * 200;
        const newY = 200 + Math.random() * 200;
        platforms.push(new Platform(newX, newY, 200 + Math.random() * 200, 20));
    }
}

function checkCollisions() {
    platforms.forEach(p => {
        if (player.x + player.width > p.x && 
            player.x < p.x + p.width && 
            player.y + player.height > p.y && 
            player.y + player.height < p.y + p.height + player.velocityY) {
            
            if (player.velocityY > 0) {
                player.y = p.y - player.height;
                player.velocityY = 0;
                player.isJumping = false;
            }
        }
    });

    // Game Over condition: Fall down
    if (player.y > CANVAS_HEIGHT) {
        gameActive = false;
        gameOverScreen.classList.remove('hidden');
        finalScoreElement.innerText = score;
    }
}

function gameLoop() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawBackground();
    
    player.update();
    checkCollisions();
    generatePlatforms();
    
    platforms.forEach(p => p.draw());
    player.draw();

    requestAnimationFrame(gameLoop);
}

restartBtn.addEventListener('click', () => {
    location.reload();
});

gameLoop();
