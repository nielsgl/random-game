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
        
        this.init();
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
        
        if (!guess || guess < 1 || guess > 100) {
            this.showMessage('Please enter a number between 1 and 100!', 'error');
            return;
        }
        
        this.attempts++;
        this.updateDisplay();
        
        if (guess === this.secretNumber) {
            this.handleWin();
        } else if (guess < this.secretNumber) {
            this.showMessage(`📈 Too low! Try a higher number.`, 'hint');
        } else {
            this.showMessage(`📉 Too high! Try a lower number.`, 'hint');
        }
        
        this.guessInput.value = '';
        this.guessInput.focus();
    }
    
    handleWin() {
        this.gameActive = false;
        this.showMessage(`🎉 Congratulations! You found the number ${this.secretNumber} in ${this.attempts} attempts!`, 'success');
        
        if (!this.bestScore || this.attempts < this.bestScore) {
            this.bestScore = this.attempts;
            localStorage.setItem('bestScore', this.bestScore);
            this.messageDiv.innerHTML += '<br><strong>🏆 New Best Score!</strong>';
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
        
        this.guessButton.disabled = false;
        this.guessInput.disabled = false;
        this.resetButton.style.display = 'none';
        this.guessInput.value = '';
        this.messageDiv.textContent = '';
        this.messageDiv.className = 'message';
        
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
