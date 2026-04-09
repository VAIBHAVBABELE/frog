// ==========================================
// FROG MATH POND - Complete Game Logic
// ==========================================

// ==========================================
// 1. GAME STATE VARIABLES
// ==========================================
let currentScore = 0;
let currentQuestion = 1;
const totalQuestions = 10;
let currentProblem = null;
let userInput = '';
let isNegative = false;
let hintStep = 0;
let soundEnabled = true;
let gameActive = true;
let currentHints = [];

// Range: Starts easy, gets harder
let currentMin = 0;
let currentMax = 10;

// ==========================================
// 2. DOM ELEMENTS
// ==========================================
const scoreDisplay = document.getElementById('score');
const equationArea = document.getElementById('equationArea');
const frog = document.getElementById('frog');
const soundToggle = document.getElementById('soundToggle');
const rulesBtn = document.getElementById('rulesBtn');
const hintBtn = document.getElementById('hintBtn');
const checkBtn = document.getElementById('checkBtn');
const clearBtn = document.getElementById('clearBtn');
const nextBtn = document.getElementById('nextBtn');
const numBtns = document.querySelectorAll('.num-btn');
const opBtns = document.querySelectorAll('.op-btn-keypad');

// Popups
const overlay = document.getElementById('overlay');
const welcomePopup = document.getElementById('welcomePopup');
const rulesPopup = document.getElementById('rulesPopup');
const hintPopup = document.getElementById('hintPopup');
const completePopup = document.getElementById('completePopup');
const hintText = document.getElementById('hintText');
const stepIndicator = document.getElementById('stepIndicator');
const prevHint = document.getElementById('prevHint');
const nextHint = document.getElementById('nextHint');
const finalScore = document.getElementById('finalScore');
const starsDisplay = document.getElementById('starsDisplay');

// ==========================================
// 3. UTILITY FUNCTIONS
// ==========================================
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomOperation() {
    const ops = ['add', 'sub', 'mul'];
    return ops[Math.floor(Math.random() * ops.length)];
}

function calculateResult(num1, num2, op) {
    switch(op) {
        case 'add': return num1 + num2;
        case 'sub': return num1 - num2;
        case 'mul': return num1 * num2;
        default: return 0;
    }
}

function getOperationSymbol(op) {
    const symbols = { 'add': '➕', 'sub': '➖', 'mul': '✖️' };
    return symbols[op] || '?';
}

function formatNumber(num) {
    if (num >= 0) {
        return `+${num}`;
    } else {
        return `${num}`;
    }
}

// ==========================================
// 4. PROGRESSIVE DIFFICULTY
// ==========================================
function updateDifficulty() {
    // As score increases, range expands and includes negatives
    if (currentScore <= 3) {
        currentMin = 0;
        currentMax = 10;
    } else if (currentScore <= 6) {
        currentMin = -5;
        currentMax = 15;
    } else {
        currentMin = -15;
        currentMax = 15;
    }
}

// ==========================================
// 5. PROBLEM GENERATION (2 OPERANDS ONLY)
// ==========================================
function generateProblem() {
    updateDifficulty();
    return generateTwoNumberProblem();
}

function generateTwoNumberProblem() {
    const num1 = getRandomInt(currentMin, currentMax);
    const num2 = getRandomInt(currentMin, currentMax);
    const op = getRandomOperation();
    const result = calculateResult(num1, num2, op);
    
    const missingOptions = ['num1', 'num2', 'op', 'result'];
    const missing = missingOptions[Math.floor(Math.random() * missingOptions.length)];
    
    return {
        type: 'two',
        num1, num2, op, result,
        missing: missing,
        numCount: 2
    };
}

// ==========================================
// 6. DISPLAY FUNCTIONS
// ==========================================
function renderEquation(problem) {
    equationArea.innerHTML = '';
    renderTwoNumberEquation(problem);
}

function renderTwoNumberEquation(problem) {
    const { num1, num2, op, result, missing } = problem;
    
    // First number
    if (missing === 'num1') {
        equationArea.appendChild(createEmptyCard());
    } else {
        equationArea.appendChild(createNumberCard(num1));
    }
    
    // Operator
    if (missing === 'op') {
        equationArea.appendChild(createEmptyOperator());
    } else {
        equationArea.appendChild(createOperator(getOperationSymbol(op)));
    }
    
    // Second number
    if (missing === 'num2') {
        equationArea.appendChild(createEmptyCard());
    } else {
        equationArea.appendChild(createNumberCard(num2));
    }
    
    // Equals
    equationArea.appendChild(createOperator('=', 'equals'));
    
    // Result
    if (missing === 'result') {
        equationArea.appendChild(createEmptyCard('fish'));
    } else {
        equationArea.appendChild(createResultCard(result));
    }
}

function createNumberCard(value) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
        <img src="assets/images/lilypad.png" alt="Lily Pad">
        <span class="card-value">${formatNumber(value)}</span>
    `;
    return div;
}

function createEmptyCard(type = 'lilypad') {
    const div = document.createElement('div');
    div.className = 'card empty';
    const imgSrc = type === 'fish' ? 'assets/images/fish.png' : 'assets/images/lilypad.png';
    div.innerHTML = `
        <img src="${imgSrc}" alt="Empty">
        <span class="card-value">?</span>
    `;
    return div;
}

function createOperator(symbol, extraClass = '') {
    const div = document.createElement('div');
    div.className = `operator ${extraClass}`;
    div.textContent = symbol;
    return div;
}

function createResultCard(value) {
    const div = document.createElement('div');
    div.className = 'card result';
    div.innerHTML = `
        <img src="assets/images/fish.png" alt="Fish">
        <span class="card-value">${formatNumber(value)}</span>
    `;
    return div;
}

function createEmptyOperator() {
    const div = document.createElement('div');
    div.className = 'operator empty-op';
    div.textContent = '?';
    div.style.background = 'rgba(158, 158, 158, 0.8)';
    div.style.color = '#FFFFFF';
    div.style.textShadow = '2px 2px 0 #666';
    return div;
}

function updateScore() {
    if (scoreDisplay) {
        scoreDisplay.textContent = `${currentScore}/${totalQuestions}`;
    }
}

function showFrogEmotion(emotion) {
    if (!frog) return;
    frog.classList.remove('happy', 'sad');
    if (emotion === 'happy') {
        frog.classList.add('happy');
        showSpeechBubble('Great job! 🎉', 2000);
    } else if (emotion === 'sad') {
        frog.classList.add('sad');
        showSpeechBubble('Try again! You can do it! 💪', 2000);
    }
}

function showSpeechBubble(text, duration = 3000) {
    const existing = document.querySelector('.speech-bubble');
    if (existing) existing.remove();
    
    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    bubble.textContent = text;
    
    const pondContainer = document.querySelector('.pond-container');
    if (pondContainer) {
        pondContainer.appendChild(bubble);
        setTimeout(() => bubble.remove(), duration);
    }
}

// ==========================================
// 7. HINT SYSTEM
// ==========================================
function generateHints(problem) {
    const hints = [];
    const { num1, num2, op, result, missing } = problem;
    
    if (missing === 'num1') {
        hints.push(`We know: ? ${getOperationSymbol(op)} ${formatNumber(num2)} = ${formatNumber(result)}`);
        hints.push(`Work backwards: ${formatNumber(result)} ${op === 'add' ? '➖' : op === 'sub' ? '➕' : '➗'} ${formatNumber(num2)}`);
        hints.push(`Answer: ${formatNumber(num1)}`);
    } else if (missing === 'num2') {
        hints.push(`We know: ${formatNumber(num1)} ${getOperationSymbol(op)} ? = ${formatNumber(result)}`);
        hints.push(`Think: What number ${op === 'add' ? 'added to' : op === 'sub' ? 'subtracted from' : 'multiplied by'} ${formatNumber(num1)} gives ${formatNumber(result)}?`);
        hints.push(`Answer: ${formatNumber(num2)}`);
    } else if (missing === 'op') {
        hints.push(`We know: ${formatNumber(num1)} ? ${formatNumber(num2)} = ${formatNumber(result)}`);
        hints.push(`Try each: + = ${formatNumber(num1+num2)}, - = ${formatNumber(num1-num2)}, × = ${formatNumber(num1*num2)}`);
        hints.push(`The correct operation is: ${getOperationSymbol(op)}`);
    } else {
        hints.push(`Calculate: ${formatNumber(num1)} ${getOperationSymbol(op)} ${formatNumber(num2)}`);
        hints.push(`${formatNumber(num1)} ${getOperationSymbol(op)} ${formatNumber(num2)} = ?`);
        hints.push(`Answer: ${formatNumber(result)}`);
    }
    
    return hints;
}

function showHintStep(step) {
    if (currentHints.length === 0) return;
    
    if (hintText) hintText.textContent = currentHints[step];
    if (stepIndicator) stepIndicator.textContent = `Step ${step + 1}/${currentHints.length}`;
    
    if (prevHint) prevHint.disabled = (step === 0);
    if (nextHint) nextHint.disabled = (step === currentHints.length - 1);
    
    hintStep = step;
}

// ==========================================
// 8. ANSWER VALIDATION
// ==========================================
function checkAnswer() {
    if (!gameActive) return;
    if (!currentProblem) return;
    
    let isCorrect = false;
    const problem = currentProblem;
    
    if (problem.missing === 'op') {
        const selectedOp = document.querySelector('.op-btn-keypad.active')?.dataset.op;
        isCorrect = (selectedOp === problem.op);
    } else {
        let userValue = 0;
        if (userInput !== '') {
            userValue = parseInt(userInput) || 0;
        }
        
        if (isNegative) {
            userValue = -Math.abs(userValue);
        } else {
            userValue = Math.abs(userValue);
        }
        
        const correctValue = getCorrectValue(problem);
        isCorrect = (userValue === correctValue);
    }
    
    if (isCorrect) {
        handleCorrect();
    } else {
        handleIncorrect();
    }
}

function getCorrectValue(problem) {
    switch(problem.missing) {
        case 'num1': return problem.num1;
        case 'num2': return problem.num2;
        case 'result': return problem.result;
        default: return 0;
    }
}

function handleCorrect() {
    playSound('correct');
    showFrogEmotion('happy');
    currentScore++;
    updateScore();
    gameActive = false;
    if (nextBtn) nextBtn.disabled = false;
    
    if (currentQuestion >= totalQuestions) {
        setTimeout(() => showGameComplete(), 1000);
    }
}

function handleIncorrect() {
    playSound('wrong');
    showFrogEmotion('sad');
    
    setTimeout(() => {
        if (confirm('That\'s not correct. Would you like a hint?')) {
            openHintPopup();
        }
    }, 500);
}

// ==========================================
// 9. GAME FLOW
// ==========================================
function loadNextQuestion() {
    if (currentQuestion >= totalQuestions) {
        showGameComplete();
        return;
    }
    
    currentQuestion++;
    currentProblem = generateProblem();
    renderEquation(currentProblem);
    currentHints = generateHints(currentProblem);
    
    resetInput();
    gameActive = true;
    if (nextBtn) nextBtn.disabled = true;
    
    // Show difficulty level in bubble
    let difficultyText = '';
    if (currentScore <= 3) difficultyText = '🌱 Easy Mode';
    else if (currentScore <= 6) difficultyText = '🌿 Medium Mode';
    else difficultyText = '🌸 Hard Mode';
    
    showSpeechBubble(`Q${currentQuestion}/${totalQuestions} - ${difficultyText}`, 2000);
}

function resetInput() {
    userInput = '';
    isNegative = false;
    hintStep = 0;
    document.querySelectorAll('.op-btn-keypad').forEach(btn => btn.classList.remove('active'));
    updateEmptyCardDisplay();
    
    // Reset empty operator display if exists
    const emptyOp = document.querySelector('.operator.empty-op');
    if (emptyOp) {
        emptyOp.textContent = '?';
        emptyOp.style.background = 'rgba(158, 158, 158, 0.8)';
    }
}

function showGameComplete() {
    if (finalScore) finalScore.textContent = currentScore;
    
    let stars = '';
    if (currentScore >= 9) stars = '🌟🌟🌟🌟🌟';
    else if (currentScore >= 7) stars = '🌟🌟🌟🌟';
    else if (currentScore >= 5) stars = '🌟🌟🌟';
    else if (currentScore >= 3) stars = '🌟🌟';
    else stars = '🌟';
    
    if (starsDisplay) starsDisplay.textContent = stars;
    
    playSound('complete');
    showPopup('completePopup');
}

function resetGame() {
    currentScore = 0;
    currentQuestion = 1;
    currentMin = 0;
    currentMax = 10;
    updateScore();
    currentProblem = generateProblem();
    renderEquation(currentProblem);
    currentHints = generateHints(currentProblem);
    resetInput();
    gameActive = true;
    if (nextBtn) nextBtn.disabled = true;
    hideAllPopups();
}

// ==========================================
// 10. POPUP CONTROLS
// ==========================================
function showPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) popup.hidden = false;
    if (overlay) overlay.hidden = false;
}

function hidePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) popup.hidden = true;
    if (overlay) overlay.hidden = true;
}

function hideAllPopups() {
    document.querySelectorAll('.popup').forEach(p => p.hidden = true);
    if (overlay) overlay.hidden = true;
}

function openHintPopup() {
    if (!currentProblem) return;
    
    playSound('hint');
    currentHints = generateHints(currentProblem);
    hintStep = 0;
    showHintStep(0);
    showPopup('hintPopup');
}

// ==========================================
// 11. SOUND SYSTEM (VOICE READY)
// ==========================================
const sounds = {};

function initSounds() {
    // Create audio elements
    sounds.correct = new Audio();
    sounds.wrong = new Audio();
    sounds.hint = new Audio();
    sounds.complete = new Audio();
    
    // Try to load sound files if they exist
    try {
        sounds.correct.src = 'assets/sounds/correct.mp3';
        sounds.wrong.src = 'assets/sounds/wrong.mp3';
        sounds.hint.src = 'assets/sounds/hint.mp3';
        sounds.complete.src = 'assets/sounds/complete.mp3';
    } catch(e) {
        console.log('Sound files not found, using silent mode');
    }
}

function playSound(soundName) {
    if (!soundEnabled) return;
    
    try {
        const sound = sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Sound play prevented'));
        }
    } catch(e) {
        console.log('Sound error:', soundName);
    }
}

// Voice function - can be called to speak text
function speakText(text) {
    if (!soundEnabled) return;
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN'; // Hindi voice
        utterance.rate = 0.9;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
}

// ==========================================
// 12. EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Number buttons
    numBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!gameActive) return;
            if (currentProblem?.missing === 'op') return;
            
            userInput += btn.dataset.num;
            updateEmptyCardDisplay();
        });
    });
    
    // Operation buttons
        // Operation buttons
        // Operation buttons
        // Operation buttons
    opBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!gameActive) return;
            
            const op = btn.dataset.op;
            
            if (currentProblem && currentProblem.missing === 'op') {
                // CASE 1: Operation is missing
                opBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateEmptyOperatorDisplay(op);
            } else {
                // CASE 2: Number is missing - SIGN TOGGLE
                opBtns.forEach(b => b.classList.remove('active'));
                
                // Set negative flag based on operation
                if (op === 'sub') {
                    isNegative = true;
                } else {
                    isNegative = false;
                }
                
                // Update display immediately
                updateEmptyCardDisplay();
            }
        });
    });

    function updateEmptyOperatorDisplay(op) {
    const emptyOp = document.querySelector('.operator.empty-op');
    if (emptyOp) {
        const symbol = getOperationSymbol(op);  // Returns ➕, ➖, or ✖️
        emptyOp.textContent = symbol;
        emptyOp.style.background = '#FF8F00';
        emptyOp.style.color = '#FFFFFF';
        emptyOp.style.textShadow = '2px 2px 0 #E65100';
    }
}
    
    // Check button
    if (checkBtn) checkBtn.addEventListener('click', checkAnswer);
    
    // Clear button
        // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            userInput = '';
            isNegative = false;
            updateEmptyCardDisplay();
            document.querySelectorAll('.op-btn-keypad').forEach(btn => btn.classList.remove('active'));
            
            // Reset empty operator if exists
            const emptyOp = document.querySelector('.operator.empty-op');
            if (emptyOp) {
                emptyOp.textContent = '?';
                emptyOp.style.background = 'rgba(158, 158, 158, 0.8)';
            }
        });
    }
    
    // Hint button
    if (hintBtn) hintBtn.addEventListener('click', openHintPopup);
    
    // Next button
    if (nextBtn) nextBtn.addEventListener('click', loadNextQuestion);
    
    // Sound toggle
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
        });
    }
    
    // Rules button
    if (rulesBtn) {
        rulesBtn.addEventListener('click', () => showPopup('rulesPopup'));
    }
    
    // Popup close buttons
    document.querySelectorAll('.close-popup').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const popup = e.target.closest('.popup');
            if (popup) hidePopup(popup.id);
        });
    });
    
    // Overlay click
    if (overlay) overlay.addEventListener('click', hideAllPopups);
    
    // Hint navigation
    if (prevHint) {
        prevHint.addEventListener('click', () => {
            if (hintStep > 0) showHintStep(hintStep - 1);
        });
    }
    
    if (nextHint) {
        nextHint.addEventListener('click', () => {
            if (hintStep < currentHints.length - 1) showHintStep(hintStep + 1);
        });
    }
    
    // Got it button
    const gotItBtn = document.getElementById('gotItBtn');
    if (gotItBtn) {
        gotItBtn.addEventListener('click', () => hidePopup('rulesPopup'));
    }
    
    // Start game button
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            hidePopup('welcomePopup');
            resetGame();
        });
    }
    
    // Play again button
    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            hidePopup('completePopup');
            resetGame();
        });
    }
    
    // Home button
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            hidePopup('completePopup');
            showPopup('welcomePopup');
        });
    }
}

function updateEmptyCardDisplay() {
    const emptyCard = document.querySelector('.card.empty .card-value');
    if (emptyCard) {
        let displayValue;
        
        // If no input yet
        if (!userInput || userInput === '') {
            // Show only sign symbol
            if (isNegative) {
                displayValue = '➖';  // Show minus symbol
            } else {
                displayValue = '?';
            }
        } else {
            // Has input - show sign with number
            if (isNegative) {
                displayValue = '➖' + userInput;  // Show minus symbol + number
            } else {
                displayValue = '➕' + userInput;  // Show plus symbol + number
            }
        }
        
        emptyCard.textContent = displayValue;
    }
}

// ==========================================
// 13. INITIALIZATION
// ==========================================
function initGame() {
    initSounds();
    setupEventListeners();
    
    currentProblem = generateProblem();
    renderEquation(currentProblem);
    currentHints = generateHints(currentProblem);
    updateScore();
    
    const hasVisited = localStorage.getItem('frogMathPondVisited');
    if (!hasVisited) {
        showPopup('welcomePopup');
        localStorage.setItem('frogMathPondVisited', 'true');
    }
    
    showSpeechBubble('Welcome! Let\'s solve some math! 🐸', 3000);
}

window.addEventListener('DOMContentLoaded', initGame);