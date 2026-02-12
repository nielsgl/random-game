class NumberGuessingGame {
    constructor() {
        this.secretNumber = 0;
        this.attempts = 0;
        this.bestScore = localStorage.getItem('bestScore') || null;
        this.gameActive = true;
        
        this.guessInput = document.getElementById('guess-input');
        this.guessButton = document.getElementById('guess-button');
        this.resetButton = document.getElementById('reset-button');
        this.messageDiv = document.getElementById('message');
        this.attemptsDisplay = document.getElementById('attempts');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.spaceship = document.getElementById('spaceship');
        this.alien = document.getElementById('alien');
        this.laserBeam = document.getElementById('laser-beam');
        this.explosionsContainer = document.getElementById('explosions-container');
        
        this.initStarfield();
        this.init();
    }
    
    initStarfield() {
        const canvas = document.getElementById('starfield');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const stars = [];
        const numStars = 200;
        
        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2,
                speed: Math.random() * 0.5 + 0.1,
                opacity: Math.random()
            });
        }
        
        function animate() {
            ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();
                
                star.y += star.speed;
                star.opacity = Math.sin(Date.now() * 0.001 + star.x) * 0.5 + 0.5;
                
                if (star.y > canvas.height) {
                    star.y = 0;
                    star.x = Math.random() * canvas.width;
                }
            });
            
            requestAnimationFrame(animate);
        }
        
        animate();
        
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }
    
    init() {
        this.secretNumber = Math.floor(Math.random() * 100) + 1;
        this.attempts = 0;
        this.gameActive = true;
        
        this.updateDisplay();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.guessButton.addEventListener('click', () => this.makeGuess());
        this.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.makeGuess();
            }
        });
        this.resetButton.addEventListener('click', () => this.resetGame());
    }
    
    makeGuess() {
        if (!this.gameActive) return;
        
        const guess = parseInt(this.guessInput.value);
        
        if (isNaN(guess) || guess < 1 || guess > 100) {
            this.showMessage('⚠️ INVALID COORDINATES! Enter 1-100!', 'error');
            this.createExplosion(window.innerWidth / 2, window.innerHeight / 2, '⚠️');
            return;
        }
        
        // Fire laser effect
        this.fireLaser();
        
        this.attempts++;
        this.updateDisplay();
        
        if (guess === this.secretNumber) {
            this.handleWin();
        } else if (guess < this.secretNumber) {
            this.showMessage(`📡 RADAR: Target at HIGHER coordinates! 📈`, 'hint');
            this.alienReact();
            this.createExplosion(window.innerWidth / 2, 200, '💨');
        } else {
            this.showMessage(`📡 RADAR: Target at LOWER coordinates! 📉`, 'hint');
            this.alienReact();
            this.createExplosion(window.innerWidth / 2, 200, '💨');
        }
        
        this.guessInput.value = '';
        this.guessInput.focus();
    }
    
    fireLaser() {
        this.spaceship.classList.add('firing');
        this.laserBeam.classList.add('firing');
        
        setTimeout(() => {
            this.spaceship.classList.remove('firing');
            this.laserBeam.classList.remove('firing');
        }, 300);
    }
    
    alienReact() {
        this.alien.classList.add('hit');
        setTimeout(() => {
            this.alien.classList.remove('hit');
        }, 500);
    }
    
    createExplosion(x, y, emoji) {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.textContent = emoji;
        explosion.style.left = x + 'px';
        explosion.style.top = y + 'px';
        this.explosionsContainer.appendChild(explosion);
        
        setTimeout(() => {
            explosion.remove();
        }, 1000);
    }
    
    createParticles(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            const angle = (Math.PI * 2 * i) / count;
            const velocity = 100 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            
            particle.style.animation = `particleBurst 1s ease-out forwards`;
            particle.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
            
            this.explosionsContainer.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }
    
    handleWin() {
        this.gameActive = false;
        
        // Epic victory effects!
        this.alien.classList.add('destroyed');
        this.createExplosion(window.innerWidth / 2, 150, '💥');
        this.createParticles(window.innerWidth / 2, 150, 30);
        
        setTimeout(() => {
            this.createExplosion(window.innerWidth / 2 - 50, 180, '✨');
            this.createExplosion(window.innerWidth / 2 + 50, 120, '✨');
        }, 200);
        
        setTimeout(() => {
            this.createExplosion(window.innerWidth / 2, 150, '🎉');
        }, 400);
        
        this.showMessage(`💥🎉 VICTORY! Alien destroyed at coordinates ${this.secretNumber}! Shots fired: ${this.attempts} 🎉💥`, 'success');
        
        if (!this.bestScore || this.attempts < this.bestScore) {
            this.bestScore = this.attempts;
            localStorage.setItem('bestScore', this.bestScore);
            const newBestMessage = document.createElement('strong');
            newBestMessage.textContent = '🏆 NEW HIGH SCORE! LEGENDARY COMMANDER! 🏆';
            newBestMessage.style.display = 'block';
            newBestMessage.style.marginTop = '10px';
            newBestMessage.style.animation = 'successPulse 1s ease-in-out infinite';
            this.messageDiv.appendChild(document.createElement('br'));
            this.messageDiv.appendChild(newBestMessage);
        }
        
        this.updateDisplay();
        this.guessButton.disabled = true;
        this.guessInput.disabled = true;
        this.resetButton.style.display = 'block';
    }
    
    resetGame() {
        this.secretNumber = Math.floor(Math.random() * 100) + 1;
        this.attempts = 0;
        this.gameActive = true;
        
        // Reset alien
        this.alien.classList.remove('destroyed');
        this.alien.style.opacity = '1';
        
        this.guessButton.disabled = false;
        this.guessInput.disabled = false;
        this.resetButton.style.display = 'none';
        this.guessInput.value = '';
        this.messageDiv.textContent = '';
        this.messageDiv.className = 'message';
        
        // Victory celebration
        this.createExplosion(window.innerWidth / 2, window.innerHeight / 2, '🚀');
        this.createParticles(window.innerWidth / 2, window.innerHeight / 2, 15);
        
        this.updateDisplay();
        this.guessInput.focus();
    }
    
    showMessage(text, type) {
        this.messageDiv.textContent = text;
        this.messageDiv.className = `message ${type}`;
    }
    
    updateDisplay() {
        this.attemptsDisplay.textContent = this.attempts;
        this.bestScoreDisplay.textContent = this.bestScore || '-';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NumberGuessingGame();
});
