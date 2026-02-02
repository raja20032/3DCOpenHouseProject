/**
 * Game State Manager for Fruit Ninja CV
 * Handles game states, scoring, lives, and combos
 */

const GAME_STATES = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

class Game {
    constructor() {
        this.state = GAME_STATES.LOADING;
        this.score = 0;
        this.lives = 3;
        this.maxLives = 3;
        this.bestScore = this.loadBestScore();

        // Combo system
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboWindow = 500; // ms window for combos
        this.bestCombo = 0;
        this.fruitsSliced = 0;

        // Score popups
        this.scorePopups = [];

        // Wave tracking
        this.waveTimer = 0;
        this.waveInterval = 10000; // Increase difficulty every 10s

        // UI elements
        this.scoreElement = null;
        this.livesElements = null;
        this.comboTextElement = null;
        this.bestScoreElement = null;
    }

    init() {
        this.scoreElement = document.getElementById('score');
        this.livesElements = document.querySelectorAll('.life');
        this.comboTextElement = document.getElementById('combo-text');
        this.bestScoreElement = document.getElementById('best-score-value');

        this.updateUI();
    }

    setState(newState) {
        this.state = newState;

        // Handle state transitions
        switch (newState) {
            case GAME_STATES.MENU:
                this.showScreen('start-screen');
                this.hideScreen('gameover-screen');
                this.hideScreen('loading-overlay');
                break;
            case GAME_STATES.PLAYING:
                this.hideScreen('start-screen');
                this.hideScreen('gameover-screen');
                this.hideScreen('loading-overlay');
                break;
            case GAME_STATES.GAME_OVER:
                this.showGameOverScreen();
                break;
            case GAME_STATES.LOADING:
                this.showScreen('loading-overlay');
                break;
        }
    }

    showScreen(id) {
        const screen = document.getElementById(id);
        if (screen) screen.classList.remove('hidden');
    }

    hideScreen(id) {
        const screen = document.getElementById(id);
        if (screen) screen.classList.add('hidden');
    }

    start() {
        this.score = 0;
        this.lives = this.maxLives;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.bestCombo = 0;
        this.fruitsSliced = 0;
        this.waveTimer = 0;
        this.scorePopups = [];

        this.updateUI();
        this.setState(GAME_STATES.PLAYING);

        audioManager.play('start');
    }

    update(deltaTime) {
        if (this.state !== GAME_STATES.PLAYING) return;

        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }

        // Update wave timer
        this.waveTimer += deltaTime;
        if (this.waveTimer >= this.waveInterval) {
            this.waveTimer = 0;
            fruitManager.increaseWave();
        }

        // Update score popups
        this.scorePopups = this.scorePopups.filter(popup => {
            popup.life -= deltaTime / 1000;
            return popup.life > 0;
        });
    }

    sliceFruit(fruit, sliceX, sliceY) {
        if (fruit.isSliced) return;

        this.fruitsSliced++;
        this.comboCount++;
        this.comboTimer = this.comboWindow;

        // Calculate score with combo bonus
        let points = fruit.type.points;
        if (this.comboCount >= 2) {
            points = this.comboCount; // Combo multiplier
            this.showComboText(this.comboCount);
            audioManager.play('combo');
        } else {
            audioManager.playSlice();
        }

        this.score += points;
        this.bestCombo = Math.max(this.bestCombo, this.comboCount);

        // Create score popup
        this.addScorePopup(sliceX, sliceY, points);

        // Create particles
        if (fruit.type.name === 'watermelon') {
            particleSystem.createWatermelonSplatter(sliceX, sliceY);
        } else {
            particleSystem.createJuiceSplatter(sliceX, sliceY, fruit.type.innerColor);
        }

        this.updateUI();
    }

    sliceBomb(bombX, bombY) {
        audioManager.play('bomb');
        particleSystem.createExplosion(bombX, bombY);

        // Flash screen
        this.flashScreen();

        // Game over
        setTimeout(() => {
            this.gameOver();
        }, 500);
    }

    missFruit() {
        this.lives--;
        this.updateLivesUI();
        audioManager.play('splat');

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        if (this.state === GAME_STATES.GAME_OVER) return;

        // Check high score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }

        audioManager.play('gameOver');
        this.setState(GAME_STATES.GAME_OVER);
    }

    showGameOverScreen() {
        this.showScreen('gameover-screen');

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('fruits-sliced').textContent = this.fruitsSliced;
        document.getElementById('best-combo').textContent = this.bestCombo;

        const highscoreElement = document.getElementById('new-highscore');
        if (this.score >= this.bestScore && this.score > 0) {
            highscoreElement.classList.remove('hidden');
        } else {
            highscoreElement.classList.add('hidden');
        }
    }

    showComboText(count) {
        const messages = {
            2: '2 FRUIT COMBO!',
            3: '3 FRUIT COMBO!',
            4: 'AMAZING!',
            5: 'BLITZ!',
            6: 'UNSTOPPABLE!'
        };

        const text = messages[Math.min(count, 6)] || `${count}x COMBO!`;

        this.comboTextElement.textContent = text;
        this.comboTextElement.classList.remove('show');
        void this.comboTextElement.offsetWidth; // Trigger reflow
        this.comboTextElement.classList.add('show');
    }

    addScorePopup(x, y, points) {
        this.scorePopups.push({
            x: x,
            y: y,
            points: points,
            life: 1
        });
    }

    drawScorePopups(ctx) {
        ctx.save();
        ctx.font = 'bold 32px Bangers, sans-serif';
        ctx.textAlign = 'center';

        this.scorePopups.forEach(popup => {
            const alpha = popup.life;
            const yOffset = (1 - popup.life) * 60;

            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.fillText(`+${popup.points}`, popup.x, popup.y - yOffset);
        });

        ctx.restore();
    }

    flashScreen() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: white;
            z-index: 1000;
            animation: flashAnim 0.3s ease-out forwards;
        `;
        document.body.appendChild(flash);

        // Add keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes flashAnim {
                from { opacity: 0.8; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            flash.remove();
            style.remove();
        }, 300);
    }

    updateUI() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
        if (this.bestScoreElement) {
            this.bestScoreElement.textContent = this.bestScore;
        }
        this.updateLivesUI();
    }

    updateLivesUI() {
        if (!this.livesElements) return;

        this.livesElements.forEach((el, index) => {
            if (index < this.lives) {
                el.classList.add('active');
                el.classList.remove('lost');
            } else {
                el.classList.remove('active');
                if (index === this.lives) {
                    el.classList.add('lost');
                }
            }
        });
    }

    loadBestScore() {
        try {
            return parseInt(localStorage.getItem('fruitNinjaCVBestScore')) || 0;
        } catch (e) {
            return 0;
        }
    }

    saveBestScore() {
        try {
            localStorage.setItem('fruitNinjaCVBestScore', this.bestScore.toString());
        } catch (e) {
            console.warn('Could not save best score');
        }
    }

    isPlaying() {
        return this.state === GAME_STATES.PLAYING;
    }
}

const game = new Game();
