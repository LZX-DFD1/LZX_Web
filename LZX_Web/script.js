
// ==========================================
// 1. CUSTOM CURSOR (Eyeball Effect + Particles)
// ==========================================
const cursor = document.getElementById('cursor');
const pupil = document.getElementById('cursor-pupil');
const follower = document.getElementById('cursor-follower');

let mouseX = 0, mouseY = 0;
let posX = 0, posY = 0;

// Create Canvas for Particle Trail
const cursorCanvas = document.createElement('canvas');
cursorCanvas.style.position = 'fixed';
cursorCanvas.style.top = '0';
cursorCanvas.style.left = '0';
cursorCanvas.style.width = '100%';
cursorCanvas.style.height = '100%';
cursorCanvas.style.pointerEvents = 'none';
cursorCanvas.style.zIndex = '20000'; // Behind cursor, above content
cursorCanvas.style.mixBlendMode = 'difference';
document.body.appendChild(cursorCanvas);

const ctx = cursorCanvas.getContext('2d');
let particles = [];

function resizeCursorCanvas() {
    cursorCanvas.width = window.innerWidth;
    cursorCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCursorCanvas);
resizeCursorCanvas();

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.size *= 0.95;
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (cursor) {
        cursor.style.transform = `translate3d(${mouseX - 16}px, ${mouseY - 16}px, 0)`;
        
        // Eyeball Pupil Logic
        if (pupil) {
            const rect = cursor.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Look at movement direction with inertia
            const velX = (mouseX - posX) * 0.15;
            const velY = (mouseY - posY) * 0.15;
            const limit = 5;
            const clampedX = Math.max(-limit, Math.min(limit, velX));
            const clampedY = Math.max(-limit, Math.min(limit, velY));
            
            pupil.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
        }
    }
    
    // Spawn particles on move
    for(let i=0; i<2; i++) {
        particles.push(new Particle(mouseX, mouseY));
    }
});

function animateCursor() {
    // Smooth position tracking for physics calculations
    posX += (mouseX - posX) / 6;
    posY += (mouseY - posY) / 6;

    // Restore follower trail
    if (follower) {
        follower.style.transform = `translate3d(${posX - 24}px, ${posY - 24}px, 0)`;
    }

    // Clear and Draw Particles
    ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].life <= 0 || particles[i].size < 0.5) {
            particles.splice(i, 1);
            i--;
        }
    }

    requestAnimationFrame(animateCursor);
}
animateCursor();

document.addEventListener('scroll', () => {
    const hero = document.getElementById('hero-title');
    if (!hero) return;
    const max = Math.max(200, window.innerHeight * 0.6);
    const s = Math.min(max, window.scrollY);
    hero.style.opacity = (1 - s / max).toString();
});

// Link Hover Effects
const links = document.querySelectorAll('a, button, .gravity-elem, .project-item');
links.forEach(link => {
    link.addEventListener('mouseenter', () => {
        if (cursor) {
            cursor.classList.add('scale-150');
            cursor.style.borderColor = '#ff3333'; // Accent color
        }
        if (pupil) pupil.classList.add('bg-accent');
        if (follower) follower.classList.add('scale-[1.6]', 'opacity-60');
    });
    link.addEventListener('mouseleave', () => {
        if (cursor) {
            cursor.classList.remove('scale-150');
            cursor.style.borderColor = 'white';
        }
        if (pupil) pupil.classList.remove('bg-accent');
        if (follower) follower.classList.remove('scale-[1.6]', 'opacity-60');
    });
});

// ==========================================
// 2. THREE.JS BACKGROUND (Abstract Fluid)
// ==========================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
const canvasContainer = document.getElementById('canvas-container');
if (canvasContainer) canvasContainer.appendChild(renderer.domElement);

const geometry = new THREE.IcosahedronGeometry(1.5, 64); // Higher detail for fluid
const originalPositions = Float32Array.from(geometry.attributes.position.array);
const material = new THREE.PointsMaterial({
    size: 0.015,
    color: 0x666666,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true
});

const sphere = new THREE.Points(geometry, material);
scene.add(sphere);

camera.position.z = 3.5;

let targetRotationX = 0;
let targetRotationY = 0;

document.addEventListener('mousemove', (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    targetRotationX = y * 0.2;
    targetRotationY = x * 0.2;
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    sphere.rotation.x += (targetRotationX - sphere.rotation.x) * 0.05;
    sphere.rotation.y += (targetRotationY - sphere.rotation.y) * 0.05;
    sphere.rotation.z = time * 0.02;

    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const ox = originalPositions[i];
        const oy = originalPositions[i + 1];
        const oz = originalPositions[i + 2];

        // Complex wave distortion
        const distortion = Math.sin(time * 0.5 + ox * 3) * 0.1 
                         + Math.cos(time * 0.3 + oy * 3) * 0.1
                         + Math.sin(time * 0.2 + oz * 3) * 0.1;

        const scale = 1 + distortion;
        positions[i] = ox * scale;
        positions[i + 1] = oy * scale;
        positions[i + 2] = oz * scale;
    }
    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// 3. SNAKE GAME (Easter Egg)
// ==========================================
let logoClicks = 0;
const logoTrigger = document.getElementById('logo-trigger');
const snakeOverlay = document.getElementById('game-overlay'); // Fixed ID match
const snakeCanvas = document.getElementById('gameCanvas');
const snakeScoreEl = document.getElementById('score');
const closeSnakeBtn = document.getElementById('close-snake');
let snakeInterval;

if (logoTrigger) {
    logoTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        logoClicks++;
        
        // Ripple Effect
        const ripple = document.createElement('div');
        ripple.className = 'fixed rounded-full pointer-events-none z-[9999]';
        ripple.style.left = e.clientX + 'px';
        ripple.style.top = e.clientY + 'px';
        ripple.style.width = '10px';
        ripple.style.height = '10px';
        ripple.style.background = '#ff00c1';
        ripple.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(ripple);
        
        ripple.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(20)', opacity: 0 }
        ], { duration: 500, easing: 'ease-out' }).onfinish = () => ripple.remove();

        if (logoClicks === 5) {
            openSnakeGame();
            logoClicks = 0;
        }
    });
}

function openSnakeGame() {
    if (!snakeOverlay) return;
    if (!document.getElementById('snake-styles')) {
        const style = document.createElement('style');
        style.id = 'snake-styles';
        style.innerHTML = `
            @keyframes snakeOpen {
                0% { opacity: 0; transform: scale(0.95); }
                100% { opacity: 1; transform: scale(1); }
            }
            .flash-open { animation: snakeOpen 400ms ease-out; }
        `;
        document.head.appendChild(style);
    }
    snakeOverlay.classList.remove('hidden');
    snakeOverlay.classList.add('flex');
    snakeOverlay.classList.add('flash-open');
    setTimeout(() => snakeOverlay.classList.remove('flash-open'), 450);
    playSfx('snakeOpen', true);
    initSnakeGame();
}

if (closeSnakeBtn) {
    closeSnakeBtn.addEventListener('click', () => {
        snakeOverlay.classList.add('hidden');
        snakeOverlay.classList.remove('flex');
        if (snakeInterval) clearInterval(snakeInterval);
    });
}

// Snake Logic
let snake = [], food = {}, dx = 0, dy = 0, score = 0;
const gridSize = 20, tileCount = 20;

function initSnakeGame() {
    snake = [{x: 10, y: 10}];
    food = {x: 15, y: 15};
    dx = 0; dy = 0; score = 0;
    if (snakeScoreEl) snakeScoreEl.innerText = score;
    if (snakeInterval) clearInterval(snakeInterval);
    if (snakeCanvas) {
        const ctx = snakeCanvas.getContext('2d');
        snakeInterval = setInterval(() => drawSnakeGame(ctx), 100);
        window.addEventListener('keydown', changeSnakeDirection);
    }
}

function drawSnakeGame(ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        if (snakeScoreEl) snakeScoreEl.innerText = score;
        food = {x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount)};
    } else {
        snake.pop();
    }

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || snakeCollision(head)) {
        clearInterval(snakeInterval);
        Swal.fire({
            title: 'GAME OVER',
            text: `SCORE: ${score}`,
            background: '#000',
            color: '#fff',
            confirmButtonColor: '#ff00c1'
        }).then(() => initSnakeGame());
        return;
    }

    ctx.fillStyle = '#ff00c1';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

    ctx.fillStyle = '#fff';
    snake.forEach(part => ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2));
}

function snakeCollision(head) {
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }
    return false;
}

function changeSnakeDirection(e) {
    const key = e.keyCode;
    if (key === 37 && dx !== 1) { dx = -1; dy = 0; }
    if (key === 38 && dy !== 1) { dx = 0; dy = -1; }
    if (key === 39 && dx !== -1) { dx = 1; dy = 0; }
    if (key === 40 && dy !== -1) { dx = 0; dy = 1; }
}

// ==========================================
// 4. HALL OF FAME
// ==========================================
const btnHall = document.getElementById('btn-hall');
const hallOverlay = document.getElementById('hall-overlay');
const closeHall = document.getElementById('close-hall');

if (btnHall && hallOverlay && closeHall) {
    btnHall.addEventListener('click', (e) => {
        e.preventDefault();
        hallOverlay.classList.remove('hidden');
        hallOverlay.classList.add('flex');
        playSfx('openHall', true);
    });
    closeHall.addEventListener('click', () => {
        hallOverlay.classList.add('hidden');
        hallOverlay.classList.remove('flex');
        playSfx('closeHall', true);
    });
    hallOverlay.addEventListener('click', (e) => {
        if (e.target === hallOverlay) {
            hallOverlay.classList.add('hidden');
            hallOverlay.classList.remove('flex');
            playSfx('closeHall');
        }
    });
}

// ==========================================
// 5. GRANDMA RUN (Dino Game)
// ==========================================
const btnDino = document.getElementById('btn-dino');
const dinoOverlay = document.getElementById('dino-game-overlay');
const closeDino = document.getElementById('close-dino');
const dinoPlayer = document.getElementById('dino-player');
const dinoObstacle = document.getElementById('dino-obstacle');
const dinoScoreEl = document.getElementById('dino-score');
const dinoOptions = document.getElementById('dino-options');
const dinoContinue = document.getElementById('dino-continue');
const dinoGrandma = document.getElementById('dino-grandma');

let isJumping = false;
let dinoInterval;
let dinoScore = 0;
let isPaused = false;
let canScore = true;

if (btnDino && dinoOverlay) {
    btnDino.addEventListener('click', (e) => {
        e.preventDefault();
        dinoOverlay.classList.remove('hidden');
        dinoOverlay.classList.add('flex');
        playSfx('openDino', true);
        startDinoGame();
    });
}

if (closeDino) {
    closeDino.addEventListener('click', () => {
        dinoOverlay.classList.add('hidden');
        dinoOverlay.classList.remove('flex');
        stopDinoGame();
    });
}

function startDinoGame() {
    dinoScore = 0;
    isPaused = false;
    canScore = true;
    dinoScoreEl.innerText = dinoScore;
    dinoOptions.classList.remove('flex');
    dinoOptions.classList.add('hidden');
    dinoObstacle.style.animation = 'none';
    dinoObstacle.offsetHeight; /* trigger reflow */
    dinoObstacle.style.animation = 'moveObstacle 2s infinite linear';
    
    // Add CSS Animation dynamically if not present
    if (!document.getElementById('dino-styles')) {
        const style = document.createElement('style');
        style.id = 'dino-styles';
        style.innerHTML = `
            @keyframes moveObstacle {
                0% { right: -20px; }
                100% { right: 600px; }
            }
            .animate-jump {
                animation: jump 0.5s ease-out;
            }
            @keyframes jump {
                0% { bottom: 0; }
                30% { bottom: 100px; }
                70% { bottom: 100px; }
                100% { bottom: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    if (dinoInterval) clearInterval(dinoInterval);
    dinoInterval = setInterval(dinoLoop, 10);
    
    document.addEventListener('keydown', dinoJump);
    dinoOverlay.addEventListener('click', dinoJump);
}

function stopDinoGame() {
    clearInterval(dinoInterval);
    dinoObstacle.style.animation = 'none';
    document.removeEventListener('keydown', dinoJump);
    dinoOverlay.removeEventListener('click', dinoJump);
}

function dinoJump(e) {
    if ((e.code === 'Space' || e.type === 'click') && !isJumping && !isPaused) {
        isJumping = true;
        dinoPlayer.classList.add('animate-jump');
        playSfx('jump');
        setTimeout(() => {
            dinoPlayer.classList.remove('animate-jump');
            isJumping = false;
        }, 500);
    }
}

function dinoLoop() {
    if (isPaused) return;

    const playerRect = dinoPlayer.getBoundingClientRect();
    const obstacleRect = dinoObstacle.getBoundingClientRect();

    // Check collision (Reduced hitbox for better playability)
    if (
        playerRect.right - 10 > obstacleRect.left + 10 &&
        playerRect.left + 10 < obstacleRect.right - 10 &&
        playerRect.bottom > obstacleRect.top + 10
    ) {
        // Collision - Reset Score
        dinoScore = 0;
        dinoScoreEl.innerText = dinoScore;
        // Optional: Visual feedback for hit
        dinoPlayer.style.filter = 'brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(5)';
        setTimeout(() => dinoPlayer.style.filter = 'none', 200);
    }

    // Score Logic
    const obstacleRight = parseInt(window.getComputedStyle(dinoObstacle).getPropertyValue('right'));
    
    // Reset score flag when obstacle recycles (is at start)
    if (obstacleRight < 0) {
        canScore = true;
    }

    // Score when obstacle passes player (approx right > 550 for 600px width container)
    if (obstacleRight > 550 && canScore) { 
         dinoScore++;
         dinoScoreEl.innerText = dinoScore;
         canScore = false; // Prevent double counting
         
         if (dinoScore === 10) {
             pauseDinoGame();
         }
    }
}

function pauseDinoGame() {
    isPaused = true;
    dinoObstacle.style.animationPlayState = 'paused';
    dinoOptions.classList.remove('hidden');
    dinoOptions.classList.add('flex');
}

dinoContinue.addEventListener('click', () => {
    isPaused = false;
    dinoObstacle.style.animationPlayState = 'running';
    dinoOptions.classList.add('hidden');
    dinoOptions.classList.remove('flex');
});

dinoGrandma.addEventListener('click', () => {
    window.open('https://www.douyin.com/user/MS4wLjABAAAAhv6UjlOPLaS5od6FRRU2yktv4Z6I2XqZPWan16oOBuB576wHcEFoZgncRzAt-7-X?from_tab_name=main', '_blank');
});


// ==========================================
// 6. GRAVITY MODE (Matter.js)
// ==========================================
const btnGravity = document.getElementById('btn-gravity');
let gravityEnabled = false;
let engine, render, runner;

if (btnGravity) {
    btnGravity.addEventListener('click', (e) => {
        e.preventDefault();
        if (gravityEnabled) return;
        gravityEnabled = true;
        playSfx('gravity', true);
        initGravity();
    });
}

function initGravity() {
    const { Engine, Render, Runner, World, Bodies } = Matter;

    engine = Engine.create();
    const world = engine.world;

    // Create transparent overlay canvas for Matter.js
    const render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio
        }
    });
    
    // Set canvas z-index
    render.canvas.style.position = 'fixed';
    render.canvas.style.top = '0';
    render.canvas.style.left = '0';
    render.canvas.style.pointerEvents = 'none';
    render.canvas.style.zIndex = '-1';

    const bodies = [];
    for (let i = 0; i < 50; i++) {
        const w = Math.random() * 40 + 20;
        const h = Math.random() * 20 + 10;
        const x = Math.random() * window.innerWidth;
        const y = -Math.random() * window.innerHeight;
        const body = Bodies.rectangle(x, y, w, h, {
            restitution: 0.6,
            frictionAir: 0.02,
            render: { fillStyle: '#ffffff10', strokeStyle: '#ffffff30', lineWidth: 1 }
        });
        bodies.push(body);
        World.add(world, body);
    }

    // Add walls
    const ground = Bodies.rectangle(window.innerWidth/2, window.innerHeight + 50, window.innerWidth, 100, { isStatic: true });
    const leftWall = Bodies.rectangle(-50, window.innerHeight/2, 100, window.innerHeight, { isStatic: true });
    const rightWall = Bodies.rectangle(window.innerWidth + 50, window.innerHeight/2, 100, window.innerHeight, { isStatic: true });
    World.add(world, [ground, leftWall, rightWall]);

    Runner.run(engine);
    Render.run(render);
}

// Background Music + SFX
const bgm = document.getElementById('bgm');
let musicInitialized = false;

function initMusic() {
    if (!bgm || musicInitialized) return;
    musicInitialized = true;
    bgm.volume = 0.6;
    bgm.play().catch(() => {});
}
window.addEventListener('load', initMusic);

const keypressSounds = [
    'file:///d:/Users/19344/Downloads/jjjj/mixkit-vacuum-swoosh-transition-1465.wav',
    'file:///d:/Users/19344/Downloads/jjjj/mixkit-melodical-flute-music-notification-2310.wav',
    'file:///d:/Users/19344/Downloads/jjjj/mixkit-epic-orchestra-transition-2290.wav',
    'file:///d:/Users/19344/Downloads/jjjj/mixkit-arcade-retro-game-over-213.wav',
    'file:///d:/Users/19344/Downloads/jjjj/mac-startup-sound(1).mp3',
    'file:///d:/Users/19344/Downloads/jjjj/mac-startup-sound(1).mp3'
];

const SFX = {
    openHall: 'file:///d:/Users/19344/Downloads/jjjj/mixkit-epic-orchestra-transition-2290.wav',
    closeHall: 'file:///d:/Users/19344/Downloads/jjjj/mixkit-vacuum-swoosh-transition-1465.wav',
    openDino: 'file:///d:/Users/19344/Downloads/jjjj/mixkit-arcade-retro-game-over-213.wav',
    jump: 'file:///d:/Users/19344/Downloads/jjjj/mixkit-melodical-flute-music-notification-2310.wav',
    gravity: 'file:///d:/Users/19344/Downloads/jjjj/mixkit-aggressive-beast-roar-13.wav',
    click: 'file:///d:/Users/19344/Downloads/jjjj/mixkit-melodical-flute-music-notification-2310.wav',
    snakeOpen: 'file:///d:/Users/19344/Downloads/jjjj/mac-startup-sound(1).mp3'
};
function playSfx(key, duck = false) {
    if (key === 'click') {
        const randomSrc = keypressSounds[Math.floor(Math.random() * keypressSounds.length)];
        const a = new Audio(randomSrc);
        a.volume = 0.7;
        a.play().catch(()=>{});
        return;
    }
    const src = SFX[key];
    if (!src) return;
    const a = new Audio(src);
    a.volume = 0.7;
    if (duck && bgm && !bgm.paused) {
        bgm.pause();
        a.addEventListener('ended', () => {
            bgm.play().catch(()=>{});
        });
    }
    a.play().catch(()=>{});
}
document.addEventListener('click', (e) => {
    const id = (e.target && e.target.id) || '';
    const special = ['btn-hall', 'close-hall', 'btn-dino', 'close-dino', 'btn-gravity'];
    if (!special.includes(id)) playSfx('click', false);
});
