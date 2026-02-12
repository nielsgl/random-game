// GALAXY DEFENDER - Epic Space Shooter Game

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Game state
        this.state = 'start'; // start, playing, paused, gameover
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.wave = 1;
        this.combo = 1;
        this.comboTimer = 0;
        this.enemiesDestroyed = 0;
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.powerups = [];
        this.stars = [];
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        
        // Wave management
        this.waveTimer = 0;
        this.waveDelay = 180; // frames between waves
        this.enemiesPerWave = 5;
        
        this.init();
    }
    
    init() {
        this.createStarfield();
        this.setupEventListeners();
        this.updateUI();
        
        // Show high score on start screen
        document.getElementById('high-score').textContent = this.highScore;
    }
    
    createStarfield() {
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2,
                speed: Math.random() * 2 + 0.5,
                opacity: Math.random()
            });
        }
    }
    
    setupEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape' && this.state === 'playing') {
                this.pause();
            } else if (e.code === 'Escape' && this.state === 'paused') {
                this.resume();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        this.canvas.addEventListener('mousedown', () => {
            this.mouse.down = true;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
        
        // Buttons
        document.getElementById('start-button').addEventListener('click', () => this.start());
        document.getElementById('restart-button').addEventListener('click', () => this.restart());
        document.getElementById('resume-button').addEventListener('click', () => this.resume());
        
        // Resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    start() {
        document.getElementById('start-screen').classList.add('hidden');
        this.state = 'playing';
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100);
        this.spawnWave();
        this.gameLoop();
    }
    
    restart() {
        document.getElementById('game-over-screen').classList.add('hidden');
        this.score = 0;
        this.wave = 1;
        this.combo = 1;
        this.comboTimer = 0;
        this.enemiesDestroyed = 0;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.powerups = [];
        this.enemiesPerWave = 5;
        this.start();
    }
    
    pause() {
        this.state = 'paused';
        document.getElementById('pause-screen').classList.remove('hidden');
    }
    
    resume() {
        this.state = 'playing';
        document.getElementById('pause-screen').classList.add('hidden');
    }
    
    gameOver() {
        this.state = 'gameover';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-wave').textContent = this.wave;
        document.getElementById('enemies-destroyed').textContent = this.enemiesDestroyed;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }
    
    spawnWave() {
        this.waveTimer = this.waveDelay;
        const isBossWave = this.wave % 5 === 0;
        
        if (isBossWave) {
            // Boss wave
            this.enemies.push(new Boss(this.canvas.width / 2, 50, this.wave));
        } else {
            // Normal wave
            for (let i = 0; i < this.enemiesPerWave; i++) {
                const x = (this.canvas.width / (this.enemiesPerWave + 1)) * (i + 1);
                const type = Math.random() < 0.7 ? 'normal' : 'fast';
                this.enemies.push(new Enemy(x, -50, type));
            }
        }
        
        this.enemiesPerWave += 2;
    }
    
    update() {
        if (this.state !== 'playing') return;
        
        // Update player
        if (this.player) {
            this.player.update(this.keys, this.mouse, this.canvas);
            
            // Player shooting
            if ((this.keys['Space'] || this.mouse.down) && this.player.canShoot()) {
                this.bullets.push(...this.player.shoot());
            }
        }
        
        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update();
            
            // Enemy shooting
            if (enemy.canShoot()) {
                this.bullets.push(...enemy.shoot());
            }
        });
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            return bullet.y > -10 && bullet.y < this.canvas.height + 10 &&
                   bullet.x > -10 && bullet.x < this.canvas.width + 10;
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
        
        // Update powerups
        this.powerups = this.powerups.filter(powerup => {
            powerup.update();
            return powerup.y < this.canvas.height + 50;
        });
        
        // Collision detection
        this.checkCollisions();
        
        // Wave management
        if (this.enemies.length === 0) {
            this.waveTimer--;
            if (this.waveTimer <= 0) {
                this.wave++;
                this.spawnWave();
                this.updateUI();
            }
        }
        
        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
        } else if (this.combo > 1) {
            this.combo = 1;
            this.updateUI();
        }
    }
    
    checkCollisions() {
        // Player bullets vs enemies
        this.bullets.forEach((bullet, bulletIndex) => {
            if (bullet.fromPlayer) {
                this.enemies.forEach((enemy, enemyIndex) => {
                    if (this.checkCircleCollision(bullet, enemy)) {
                        enemy.hit(bullet.damage);
                        this.bullets.splice(bulletIndex, 1);
                        this.createExplosion(bullet.x, bullet.y, 5, '#ffff00');
                        
                        if (enemy.health <= 0) {
                            this.enemiesDestroyed++;
                            this.comboTimer = 120; // 2 seconds
                            this.score += enemy.points * this.combo;
                            this.combo = Math.min(this.combo + 1, 10);
                            this.enemies.splice(enemyIndex, 1);
                            this.createExplosion(enemy.x, enemy.y, 20, '#ff6600');
                            
                            // Chance to drop powerup
                            if (Math.random() < 0.15) {
                                this.powerups.push(new Powerup(enemy.x, enemy.y));
                            }
                            
                            this.updateUI();
                        }
                    }
                });
            }
        });
        
        // Enemy bullets vs player
        if (this.player) {
            this.bullets.forEach((bullet, bulletIndex) => {
                if (!bullet.fromPlayer && this.checkCircleCollision(bullet, this.player)) {
                    this.bullets.splice(bulletIndex, 1);
                    this.player.takeDamage(bullet.damage);
                    this.createExplosion(bullet.x, bullet.y, 8, '#ff0000');
                    this.updateUI();
                    
                    if (this.player.health <= 0) {
                        this.createExplosion(this.player.x, this.player.y, 40, '#ff0000');
                        this.player = null;
                        setTimeout(() => this.gameOver(), 1000);
                    }
                }
            });
            
            // Enemies vs player (collision)
            this.enemies.forEach((enemy, index) => {
                if (this.checkCircleCollision(enemy, this.player)) {
                    this.player.takeDamage(20);
                    this.enemies.splice(index, 1);
                    this.createExplosion(enemy.x, enemy.y, 30, '#ff3300');
                    this.updateUI();
                    
                    if (this.player.health <= 0) {
                        this.createExplosion(this.player.x, this.player.y, 40, '#ff0000');
                        this.player = null;
                        setTimeout(() => this.gameOver(), 1000);
                    }
                }
            });
            
            // Powerups vs player
            this.powerups.forEach((powerup, index) => {
                if (this.checkCircleCollision(powerup, this.player)) {
                    this.player.applyPowerup(powerup.type);
                    this.powerups.splice(index, 1);
                    this.createExplosion(powerup.x, powerup.y, 10, '#00ffff');
                    this.updateUI();
                }
            });
        }
    }
    
    checkCircleCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < obj1.radius + obj2.radius;
    }
    
    createExplosion(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000814';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw starfield
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(Date.now() * 0.001 + star.x) * 0.5 + 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw game objects
        this.particles.forEach(particle => particle.draw(this.ctx));
        this.powerups.forEach(powerup => powerup.draw(this.ctx));
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        if (this.player) this.player.draw(this.ctx);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('combo').textContent = `x${this.combo}`;
        document.getElementById('high-score').textContent = this.highScore;
        
        if (this.player) {
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            const shieldPercent = (this.player.shield / this.player.maxShield) * 100;
            document.getElementById('health-bar').style.width = healthPercent + '%';
            document.getElementById('shield-bar').style.width = shieldPercent + '%';
        }
        
        const comboEl = document.getElementById('combo');
        comboEl.classList.add('active');
        setTimeout(() => comboEl.classList.remove('active'), 300);
    }
    
    gameLoop() {
        if (this.state === 'playing') {
            this.update();
        }
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.speed = 6;
        this.health = 100;
        this.maxHealth = 100;
        this.shield = 0;
        this.maxShield = 100;
        this.shootCooldown = 0;
        this.shootDelay = 10;
        this.multiShot = false;
        this.rapidFire = false;
        this.powerupTimers = {};
    }
    
    update(keys, mouse, canvas) {
        // Movement
        if (keys['KeyW'] || keys['ArrowUp']) this.y -= this.speed;
        if (keys['KeyS'] || keys['ArrowDown']) this.y += this.speed;
        if (keys['KeyA'] || keys['ArrowLeft']) this.x -= this.speed;
        if (keys['KeyD'] || keys['ArrowRight']) this.x += this.speed;
        
        // Boundaries
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        
        // Cooldowns
        if (this.shootCooldown > 0) this.shootCooldown--;
        
        // Powerup timers
        Object.keys(this.powerupTimers).forEach(key => {
            this.powerupTimers[key]--;
            if (this.powerupTimers[key] <= 0) {
                if (key === 'rapidFire') this.rapidFire = false;
                if (key === 'multiShot') this.multiShot = false;
                delete this.powerupTimers[key];
            }
        });
    }
    
    canShoot() {
        return this.shootCooldown === 0;
    }
    
    shoot() {
        const delay = this.rapidFire ? 5 : this.shootDelay;
        this.shootCooldown = delay;
        
        const bullets = [];
        if (this.multiShot) {
            bullets.push(new Bullet(this.x - 15, this.y - 20, 0, -10, true, 15));
            bullets.push(new Bullet(this.x, this.y - 20, 0, -10, true, 15));
            bullets.push(new Bullet(this.x + 15, this.y - 20, 0, -10, true, 15));
        } else {
            bullets.push(new Bullet(this.x, this.y - 20, 0, -10, true, 10));
        }
        return bullets;
    }
    
    takeDamage(amount) {
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                this.health += this.shield;
                this.shield = 0;
            }
        } else {
            this.health -= amount;
        }
        this.health = Math.max(0, this.health);
    }
    
    applyPowerup(type) {
        switch(type) {
            case 'health':
                this.health = Math.min(this.maxHealth, this.health + 30);
                break;
            case 'shield':
                this.shield = this.maxShield;
                break;
            case 'rapidFire':
                this.rapidFire = true;
                this.powerupTimers.rapidFire = 300; // 5 seconds
                break;
            case 'multiShot':
                this.multiShot = true;
                this.powerupTimers.multiShot = 300; // 5 seconds
                break;
        }
    }
    
    draw(ctx) {
        // Ship body
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x - this.radius, this.y + this.radius);
        ctx.lineTo(this.x, this.y + this.radius / 2);
        ctx.lineTo(this.x + this.radius, this.y + this.radius);
        ctx.closePath();
        ctx.fill();
        
        // Engine glow
        ctx.fillStyle = this.rapidFire ? '#ff00ff' : '#ffff00';
        ctx.shadowColor = this.rapidFire ? '#ff00ff' : '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.radius, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}

class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = type === 'fast' ? 15 : 20;
        this.speed = type === 'fast' ? 2 : 1;
        this.health = type === 'fast' ? 30 : 50;
        this.maxHealth = this.health;
        this.points = type === 'fast' ? 150 : 100;
        this.shootCooldown = 0;
        this.shootDelay = 120;
        this.angle = 0;
    }
    
    update() {
        this.y += this.speed;
        this.angle += 0.02;
        this.x += Math.sin(this.angle) * 2;
        if (this.shootCooldown > 0) this.shootCooldown--;
    }
    
    canShoot() {
        if (this.shootCooldown === 0 && this.y > 50 && Math.random() < 0.02) {
            this.shootCooldown = this.shootDelay;
            return true;
        }
        return false;
    }
    
    shoot() {
        return [new Bullet(this.x, this.y + this.radius, 0, 5, false, 10)];
    }
    
    hit(damage) {
        this.health -= damage;
    }
    
    draw(ctx) {
        const color = this.type === 'fast' ? '#ff00ff' : '#ff3300';
        
        ctx.fillStyle = color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        
        // Alien body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x - 7, this.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 7, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        ctx.shadowBlur = 0;
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2 * healthPercent, 3);
    }
}

class Boss extends Enemy {
    constructor(x, y, wave) {
        super(x, y, 'boss');
        this.radius = 50;
        this.speed = 0.5;
        this.health = 200 + (wave * 50);
        this.maxHealth = this.health;
        this.points = 1000;
        this.shootDelay = 60;
        this.moveDirection = 1;
    }
    
    update() {
        this.y = Math.min(this.y + this.speed, 100);
        this.x += this.moveDirection * 2;
        
        if (this.x < this.radius || this.x > window.innerWidth - this.radius) {
            this.moveDirection *= -1;
        }
        
        this.angle += 0.05;
        if (this.shootCooldown > 0) this.shootCooldown--;
    }
    
    canShoot() {
        if (this.shootCooldown === 0) {
            this.shootCooldown = this.shootDelay;
            return true;
        }
        return false;
    }
    
    shoot() {
        return [
            new Bullet(this.x - 20, this.y + this.radius, -2, 4, false, 15),
            new Bullet(this.x, this.y + this.radius, 0, 5, false, 15),
            new Bullet(this.x + 20, this.y + this.radius, 2, 4, false, 15)
        ];
    }
    
    draw(ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff0000';
        
        // Boss body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Spikes
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + this.angle;
            const x = this.x + Math.cos(angle) * this.radius;
            const y = this.y + Math.sin(angle) * this.radius;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(this.x + Math.cos(angle) * (this.radius + 15), this.y + Math.sin(angle) * (this.radius + 15));
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#ffff00';
            ctx.stroke();
        }
        
        // Eyes
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x - 15, this.y - 10, 8, 0, Math.PI * 2);
        ctx.arc(this.x + 15, this.y - 10, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        ctx.shadowBlur = 0;
        const barWidth = this.radius * 2;
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 20, barWidth, 8);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 20, barWidth * healthPercent, 8);
        
        // BOSS text
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', this.x, this.y - this.radius - 30);
    }
}

class Bullet {
    constructor(x, y, vx, vy, fromPlayer, damage) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 5;
        this.fromPlayer = fromPlayer;
        this.damage = damage;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.fromPlayer ? '#00ff00' : '#ff0000';
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.fromPlayer ? '#00ff00' : '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 60;
        this.maxLife = 60;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.life--;
    }
    
    draw(ctx) {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}

class Powerup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.speed = 2;
        const types = ['health', 'shield', 'rapidFire', 'multiShot'];
        this.type = types[Math.floor(Math.random() * types.length)];
        this.angle = 0;
    }
    
    update() {
        this.y += this.speed;
        this.angle += 0.1;
    }
    
    draw(ctx) {
        const colors = {
            health: '#ff0000',
            shield: '#00ffff',
            rapidFire: '#ffff00',
            multiShot: '#ff00ff'
        };
        
        const icons = {
            health: '❤️',
            shield: '🛡️',
            rapidFire: '⚡',
            multiShot: '💥'
        };
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = colors[this.type];
        ctx.shadowBlur = 20;
        ctx.shadowColor = colors[this.type];
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icons[this.type], 0, 0);
        
        ctx.restore();
    }
}

// Initialize game
const game = new Game();
