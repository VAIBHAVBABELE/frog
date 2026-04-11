// ===== Math Pond Game - Complete JavaScript with 10 Fixed Patterns =====

(function() {
    "use strict";
    
    // ===== Configuration =====
    const CONFIG = {
        TOTAL_QUESTIONS: 10,
        MAX_OPERANDS: 3
    };
    
    // ===== Track First-Time Patterns =====
    let firstAddSeen = false;
    let firstMulSeen = false;
    let firstBothSeen = false;
    
    // ===== 10 Fixed Question Patterns =====
    const QUESTION_PATTERNS = [
        // Pattern 1: pos × pos = blank (Only Mul blank)
        {
            operands: [2, 3],
            blanks: [false, false, false, true],
            type: 'mul'
        },
        // Pattern 2: pos + pos = blank (Only Add blank)
        {
            operands: [4, 5],
            blanks: [false, false, true, false],
            type: 'add'
        },
        // Pattern 3: pos , pos = blank , blank (Both blank)
        {
            operands: [3, 6],
            blanks: [false, false, true, true],
            type: 'both'
        },
        // Pattern 4: blank , blank = mul , add (Both operands blank)
        {
            operands: [3, 5],
            blanks: [true, true, false, false],
            type: 'operands'
        },
        // Pattern 5: pos , neg = blank , blank (Both blank)
        {
            operands: [4, -2],
            blanks: [false, false, true, true],
            type: 'both'
        },
        // Pattern 6: blank , blank = neg(mul) , pos(add) (Both operands blank)
        {
            operands: [4, -3],
            blanks: [true, true, false, false],
            type: 'operands'
        },
        // Pattern 7: pos , neg , neg = blank , blank (3 operands, both blank)
        {
            operands: [2, -3, -1],
            blanks: [false, false, false, true, true],
            type: 'both'
        },
        // Pattern 8: blank , blank , blank = neg(mul) , pos(add) (3 operands blank)
        {
            operands: [2, -3, 4],
            blanks: [true, true, true, false, false],
            type: 'operands'
        },
        // Pattern 9: pos , pos , neg = blank , blank (3 operands, both blank)
        {
            operands: [3, 2, -1],
            blanks: [false, false, false, true, true],
            type: 'both'
        },
        // Pattern 10: blank , blank = pos(add) , neg(mul) (Both operands blank)
        {
            operands: [5, -2],
            blanks: [true, true, false, false],
            type: 'operands'
        }
    ];
    
    // ===== Sound Manager (Same as before) =====
    class SoundManager {
        constructor() {
            this.audioContext = null;
            this.enabled = true;
            this.initAudio();
        }
        
        initAudio() {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch(e) {
                console.log('Web Audio not supported');
                this.enabled = false;
            }
        }
        
        async playSound(type) {
            if (!this.enabled || !this.audioContext) return;
            
            const ctx = this.audioContext;
            
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }
            
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            switch(type) {
                case 'click':
                    osc.frequency.value = 800;
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                    osc.start();
                    osc.stop(now + 0.08);
                    break;
                    
                case 'correct':
                    osc.frequency.value = 523.25;
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                    osc.start();
                    
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.frequency.value = 659.25;
                    gain2.gain.setValueAtTime(0.12, now + 0.12);
                    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.37);
                    osc2.start(now + 0.12);
                    osc2.stop(now + 0.37);
                    
                    osc.stop(now + 0.25);
                    break;
                    
                case 'wrong':
                    osc.frequency.value = 300;
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                    osc.start();
                    osc.stop(now + 0.35);
                    break;
                    
                case 'complete':
                    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.connect(g);
                        g.connect(ctx.destination);
                        o.frequency.value = freq;
                        g.gain.setValueAtTime(0.08, now + i * 0.1);
                        g.gain.exponentialRampToValueAtTime(0.01, now + 0.4 + i * 0.1);
                        o.start(now + i * 0.1);
                        o.stop(now + 0.4 + i * 0.1);
                    });
                    break;
            }
        }
        
        toggle() {
            this.enabled = !this.enabled;
            return this.enabled;
        }
    }
    
    // ===== Helper: Check if two arrays have same elements (order independent) =====
    function areArraysEqualIgnoreOrder(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        const sorted1 = [...arr1].sort((a, b) => a - b);
        const sorted2 = [...arr2].sort((a, b) => a - b);
        return sorted1.every((val, idx) => val === sorted2[idx]);
    }
    
    // ===== Game Class =====
    class MathPondGame {
        constructor() {
            this.sounds = new SoundManager();
            this.currentQuestion = null;
            this.userAnswers = {};
            this.questionNumber = 1;
            this.score = 0;
            this.gameActive = true;
            this.currentSlot = null;
            this.keypadValue = '';
            
            this.initElements();
            this.initEventListeners();
            this.startNewGame();
        }
        
        initElements() {
            this.elements = {
                crowInput: document.getElementById('crowInput'),
                fishInput: document.getElementById('fishInput'),
                stonesContainer: document.getElementById('stonesContainer'),
                progressDots: document.getElementById('progressDots'),
                doneBtn: document.getElementById('doneBtn'),
                rulesBtn: document.getElementById('rulesBtn'),
                voiceToggle: document.getElementById('voiceToggle'),
                helpBtn: document.getElementById('helpBtn'),
                keypadModal: document.getElementById('keypadModal'),
                rulesModal: document.getElementById('rulesModal'),
                helpModal: document.getElementById('helpModal'),
                completionModal: document.getElementById('completionModal'),
                keypadDisplay: document.getElementById('keypadDisplay'),
                messageToast: document.getElementById('messageToast'),
                finalScore: document.getElementById('finalScore'),
                performanceMessage: document.getElementById('performanceMessage')
            };
        }
        
        initEventListeners() {
            const blockKeyboard = (e) => {
                e.preventDefault();
                return false;
            };
            
            this.elements.crowInput.addEventListener('keydown', blockKeyboard);
            this.elements.crowInput.addEventListener('keyup', blockKeyboard);
            this.elements.crowInput.addEventListener('input', blockKeyboard);
            
            this.elements.fishInput.addEventListener('keydown', blockKeyboard);
            this.elements.fishInput.addEventListener('keyup', blockKeyboard);
            this.elements.fishInput.addEventListener('input', blockKeyboard);
            this.elements.crowInput.addEventListener('click', (e) => {
                if (!e.target.readOnly) {
                    this.openKeypad('crow');
                }
            });
            
            this.elements.fishInput.addEventListener('click', (e) => {
                if (!e.target.readOnly) {
                    this.openKeypad('fish');
                }
            });
            
            this.elements.doneBtn.addEventListener('click', () => this.checkAnswer());
            this.elements.rulesBtn.addEventListener('click', () => this.showModal('rules'));
            this.elements.helpBtn.addEventListener('click', () => this.showModal('help'));
            this.elements.voiceToggle.addEventListener('click', () => this.toggleVoice());
            
            document.querySelectorAll('[data-key]').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleKeypadInput(e.target.dataset.key));
            });
            
            document.getElementById('keypadClear').addEventListener('click', () => this.clearKeypad());
            document.getElementById('keypadSubmit').addEventListener('click', () => this.submitKeypadValue());
            document.getElementById('closeKeypad').addEventListener('click', () => this.closeKeypad());
            
            document.getElementById('closeRules').addEventListener('click', () => this.hideModal('rules'));
            document.getElementById('closeHelp').addEventListener('click', () => this.hideModal('help'));
            document.getElementById('gotItBtn').addEventListener('click', () => this.hideModal('rules'));
            document.getElementById('gotHelpBtn').addEventListener('click', () => this.hideModal('help'));
            
            document.getElementById('playAgainBtn').addEventListener('click', () => {
                this.hideModal('completion');
                firstAddSeen = false;
                firstMulSeen = false;
                firstBothSeen = false;
                this.startNewGame();
            });
            
            this.elements.keypadModal.addEventListener('click', (e) => {
                if (e.target === this.elements.keypadModal) this.closeKeypad();
            });
            
            this.elements.rulesModal.addEventListener('click', (e) => {
                if (e.target === this.elements.rulesModal) this.hideModal('rules');
            });
            
            this.elements.helpModal.addEventListener('click', (e) => {
                if (e.target === this.elements.helpModal) this.hideModal('help');
            });
        }
        
        startNewGame() {
            this.questionNumber = 1;
            this.score = 0;
            this.gameActive = true;
            this.userAnswers = {};
            this.elements.doneBtn.disabled = false;
            this.generateNewQuestion();
            this.updateProgressDots();
            this.showMessage('🐸 Game started! Fill the empty slots!', 'success');
        }
        
        generateNewQuestion() {
            const patternIndex = (this.questionNumber - 1) % QUESTION_PATTERNS.length;
            const pattern = QUESTION_PATTERNS[patternIndex];
            
            const operands = [...pattern.operands];
            const operandCount = operands.length;
            
            const add = operands.reduce((a, b) => a + b, 0);
            const mul = operands.reduce((a, b) => a * b, 1);
            
            this.currentQuestion = {
                operands,
                add,
                mul,
                blanks: [...pattern.blanks],
                operandCount,
                type: pattern.type
            };
            
            this.userAnswers = {};
            this.autoFillGivenValues();
            this.renderstones();
            this.rendercrowFish();
            this.showPatternHint();
        }
        
        showPatternHint() {
            const type = this.currentQuestion.type;
            let hint = '';
            
            if (type === 'add' && !firstAddSeen) {
                firstAddSeen = true;
                hint = '🐸 crow shows ADDITION result! Add the lily pad numbers!';
            } else if (type === 'mul' && !firstMulSeen) {
                firstMulSeen = true;
                hint = '🐟 Fish shows MULTIPLICATION result! Multiply the lily pad numbers!';
            } else if (type === 'both' && !firstBothSeen) {
                firstBothSeen = true;
                hint = '🐸 crow = ADD, 🐟 Fish = MULTIPLY! Fill both results!';
            }
            
            if (hint) {
                this.showMessage(hint, 'success');
            }
        }
        
        autoFillGivenValues() {
            const q = this.currentQuestion;
            
            for (let i = 0; i < q.operandCount; i++) {
                if (!q.blanks[i]) {
                    this.userAnswers[`operand_${i}`] = q.operands[i];
                }
            }
            
            if (!q.blanks[q.operandCount]) {
                this.userAnswers['add'] = q.add;
            }
            
            if (!q.blanks[q.operandCount + 1]) {
                this.userAnswers['mul'] = q.mul;
            }
        }
        
        renderstones() {
            

            const q = this.currentQuestion;
            let html = '';
            
            for (let i = 0; i < q.operandCount; i++) {
                const isBlank = q.blanks[i];
                const value = this.userAnswers[`operand_${i}`];
                const displayValue = value !== undefined ? value : (isBlank ? '' : q.operands[i]);
                const isReadonly = !isBlank;
                
                if (isReadonly) {
                    // Readonly - sirf number image ke upar, koi input box nahi
                    html += `
                        <div class="stone-card">
                            <img src="assets/images/stone.png" alt="Lily Pad" class="card-image">
                            <div class="number-on-image">${displayValue}</div>
                        </div>
                    `;
                } else {
                    // Editable - input box ke saath
                    html += `
                        <div class="stone-card">
                            <img src="assets/images/stone.png" alt="Lily Pad" class="card-image">
                            <div class="input-wrapper">
                                <input type="text" 
                                       class="slot-input ${value === undefined ? 'empty' : 'filled'}" 
                                       data-type="operand" 
                                       data-index="${i}"
                                       value="${displayValue}"
                                       >
                            </div>
                        </div>
                    `;
                }
            }
            
            this.elements.stonesContainer.innerHTML = html;
            
            document.querySelectorAll('[data-type="operand"]').forEach(input => {
                input.addEventListener('click', (e) => {
                    const index = e.target.dataset.index;
                    this.openKeypad('operand', index);
                });
            });
            this.elements.stonesContainer.innerHTML = html;
    
            document.querySelectorAll('[data-type="operand"]').forEach(input => {
                input.addEventListener('click', (e) => {
                    const index = e.target.dataset.index;
                    this.openKeypad('operand', index);
                });
                
                // === ADD THIS BLOCK ===
                const blockKeyboard = (e) => {
                    e.preventDefault();
                    return false;
                };
                input.addEventListener('keydown', blockKeyboard);
                input.addEventListener('keyup', blockKeyboard);
                input.addEventListener('input', blockKeyboard);
                // === END BLOCK ===
            });
        }
        
        rendercrowFish() {
            const q = this.currentQuestion;
            
            // crow (Add)
            const addIndex = q.operandCount;
            const isAddBlank = q.blanks[addIndex];
            const addValue = this.userAnswers['add'];
            const addDisplayValue = addValue !== undefined ? addValue : (isAddBlank ? '' : q.add);
            const addReadonly = !isAddBlank;
            
            if (addReadonly) {
                // Readonly crow - number image ke upar
                this.elements.crowInput.style.display = 'none';
                const crowCard = document.querySelector('.crow-card');
                let numberSpan = crowCard.querySelector('.number-on-image');
                if (!numberSpan) {
                    numberSpan = document.createElement('div');
                    numberSpan.className = 'number-on-image crow-number';
                    crowCard.appendChild(numberSpan);
                }
                numberSpan.textContent = addDisplayValue;
            } else {
                // Editable crow - input box
                this.elements.crowInput.style.display = 'block';
                const crowCard = document.querySelector('.crow-card');
                const numberSpan = crowCard.querySelector('.number-on-image');
                if (numberSpan) numberSpan.remove();
                
                this.elements.crowInput.value = addDisplayValue;
                this.elements.crowInput.className = `slot-input ${addValue === undefined ? 'empty' : 'filled'}`;
                this.elements.crowInput.readOnly = false;
            }
            
            // Fish (Mul)
            const mulIndex = q.operandCount + 1;
            const isMulBlank = q.blanks[mulIndex];
            const mulValue = this.userAnswers['mul'];
            const mulDisplayValue = mulValue !== undefined ? mulValue : (isMulBlank ? '' : q.mul);
            const mulReadonly = !isMulBlank;
            
            if (mulReadonly) {
                this.elements.fishInput.style.display = 'none';
                const fishCard = document.querySelector('.fish-card');
                let numberSpan = fishCard.querySelector('.number-on-image');
                if (!numberSpan) {
                    numberSpan = document.createElement('div');
                    numberSpan.className = 'number-on-image fish-number';
                    fishCard.appendChild(numberSpan);
                }
                numberSpan.textContent = mulDisplayValue;
            } else {
                this.elements.fishInput.style.display = 'block';
                const fishCard = document.querySelector('.fish-card');
                const numberSpan = fishCard.querySelector('.number-on-image');
                if (numberSpan) numberSpan.remove();
                
                this.elements.fishInput.value = mulDisplayValue;
                this.elements.fishInput.className = `slot-input ${mulValue === undefined ? 'empty' : 'filled'}`;
                this.elements.fishInput.readOnly = false;
            }
        }
        
        openKeypad(type, index = null) {
            if (!this.gameActive) return;
            
            this.currentSlot = { type, index };
            this.keypadValue = '';
            this.updateKeypadDisplay();
            this.elements.keypadModal.classList.add('active');
            this.sounds.playSound('click');
        }
        
        closeKeypad() {
            this.elements.keypadModal.classList.remove('active');
            this.currentSlot = null;
            this.keypadValue = '';
        }
        
        handleKeypadInput(key) {
            this.sounds.playSound('click');
            
            if (key === '-') {
                if (this.keypadValue === '' || this.keypadValue === '-') {
                    this.keypadValue = '-';
                } else if (!this.keypadValue.includes('-')) {
                    this.keypadValue = '-' + this.keypadValue;
                }
            } else {
                if (this.keypadValue === '0') {
                    this.keypadValue = key;
                } else {
                    this.keypadValue += key;
                }
            }
            
            if (this.keypadValue.replace('-', '').length > 3) {
                this.keypadValue = this.keypadValue.slice(0, this.keypadValue.startsWith('-') ? 4 : 3);
            }
            
            this.updateKeypadDisplay();
        }
        
        clearKeypad() {
            this.sounds.playSound('click');
            this.keypadValue = '';
            this.updateKeypadDisplay();
        }
        
        updateKeypadDisplay() {
            this.elements.keypadDisplay.textContent = this.keypadValue || '0';
        }
        
        submitKeypadValue() {
            if (!this.currentSlot || this.keypadValue === '' || this.keypadValue === '-') {
                return;
            }
            
            this.sounds.playSound('click');
            
            const value = parseInt(this.keypadValue);
            const { type, index } = this.currentSlot;
            
            if (type === 'operand') {
                this.userAnswers[`operand_${index}`] = value;
                this.renderstones();
            } else if (type === 'crow') {
                this.userAnswers['add'] = value;
                this.rendercrowFish();
            } else if (type === 'fish') {
                this.userAnswers['mul'] = value;
                this.rendercrowFish();
            }
            
            this.closeKeypad();
        }
        
        checkAnswer() {
            if (!this.gameActive || !this.currentQuestion) return;
            
            const q = this.currentQuestion;
            let allCorrect = true;
            let allFilled = true;
            
            // Collect user operands for commutative check
            const userOperands = [];
            for (let i = 0; i < q.operandCount; i++) {
                if (q.blanks[i]) {
                    const userVal = this.userAnswers[`operand_${i}`];
                    if (userVal === undefined) {
                        allFilled = false;
                    } else {
                        userOperands.push(userVal);
                    }
                } else {
                    userOperands.push(q.operands[i]);
                }
            }
            
            // Check add
            if (q.blanks[q.operandCount]) {
                const userAdd = this.userAnswers['add'];
                if (userAdd === undefined) {
                    allFilled = false;
                } else if (userAdd !== q.add) {
                    allCorrect = false;
                }
            }
            
            // Check mul
            if (q.blanks[q.operandCount + 1]) {
                const userMul = this.userAnswers['mul'];
                if (userMul === undefined) {
                    allFilled = false;
                } else if (userMul !== q.mul) {
                    allCorrect = false;
                }
            }
            
            // Commutative check for operands (order independent)
            if (allCorrect && userOperands.length === q.operandCount) {
                if (!areArraysEqualIgnoreOrder(userOperands, q.operands)) {
                    allCorrect = false;
                }
            }
            
            if (!allFilled) {
                this.showMessage('❌ Please fill all empty slots!', 'error');
                this.sounds.playSound('wrong');
                return;
            }
            
            if (allCorrect) {
                this.handleCorrectAnswer();
            } else {
                this.handleWrongAnswer();
            }
        }
        
        handleCorrectAnswer() {
            this.score++;
            this.gameActive = false;
            
            this.elements.doneBtn.disabled = true;
            
            this.showMessage('✅ Correct! Great job!', 'success');
            this.sounds.playSound('correct');
            
            this.highlightAllInputs('correct');
            
            if (this.questionNumber === CONFIG.TOTAL_QUESTIONS) {
                setTimeout(() => this.showCompletionScreen(), 1000);
            } else {
                setTimeout(() => {
                    this.questionNumber++;
                    this.gameActive = true;
                    this.userAnswers = {};
                    this.generateNewQuestion();
                    this.updateProgressDots();
                    this.elements.doneBtn.disabled = false;
                    this.showMessage('🐸 Next question! Fill the empty slots.', 'success');
                }, 1200);
            }
        }
        
        handleWrongAnswer() {
            this.highlightAllInputs('wrong');
            this.showMessage('❌ Not quite right. Try again!', 'error');
            this.sounds.playSound('wrong');
            
            setTimeout(() => {
                this.removeHighlights();
            }, 400);
        }
        
        highlightAllInputs(type) {
            const inputs = document.querySelectorAll('.slot-input');
            inputs.forEach(input => {
                input.classList.add(type === 'correct' ? 'correct-highlight' : 'wrong-highlight');
            });
            
            setTimeout(() => {
                inputs.forEach(input => {
                    input.classList.remove('correct-highlight', 'wrong-highlight');
                });
            }, type === 'correct' ? 800 : 400);
        }
        
        removeHighlights() {
            document.querySelectorAll('.slot-input').forEach(input => {
                input.classList.remove('correct-highlight', 'wrong-highlight');
            });
        }
        
        updateProgressDots() {
            let html = '';
            for (let i = 1; i <= CONFIG.TOTAL_QUESTIONS; i++) {
                let status = 'pending';
                if (i < this.questionNumber) status = 'completed';
                else if (i === this.questionNumber) status = 'current';
                
                html += `<span class="progress-dot ${status}"></span>`;
            }
            this.elements.progressDots.innerHTML = html;
        }
        
        showMessage(text, type) {
            const toast = this.elements.messageToast;
            toast.textContent = text;
            toast.className = `message-toast ${type} show`;
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
        
        showModal(modalName) {
            if (modalName === 'rules') {
                this.elements.rulesModal.classList.add('active');
            } else if (modalName === 'help') {
                this.elements.helpModal.classList.add('active');
            } else if (modalName === 'completion') {
                this.elements.completionModal.classList.add('active');
            }
            this.sounds.playSound('click');
        }
        
        hideModal(modalName) {
            if (modalName === 'rules') {
                this.elements.rulesModal.classList.remove('active');
            } else if (modalName === 'help') {
                this.elements.helpModal.classList.remove('active');
            } else if (modalName === 'completion') {
                this.elements.completionModal.classList.remove('active');
            }
            this.sounds.playSound('click');
        }
        
        toggleVoice() {
            const enabled = this.sounds.toggle();
            this.elements.voiceToggle.textContent = enabled ? '🔊' : '🔇';
            this.elements.voiceToggle.title = enabled ? 'Sound ON' : 'Sound OFF';
            this.showMessage(enabled ? '🔊 Sound ON' : '🔇 Sound OFF', 'success');
        }
        
        showCompletionScreen() {
            this.gameActive = false;
            this.elements.finalScore.textContent = this.score;
            
            let message = '';
            if (this.score === 10) message = '🏆 Perfect Score! Math Champion! 🏆';
            else if (this.score >= 8) message = '🌟 Excellent! Great math skills! 🌟';
            else if (this.score >= 6) message = '👍 Good job! Keep practicing! 👍';
            else message = '💪 Nice try! Practice makes perfect! 💪';
            
            this.elements.performanceMessage.textContent = message;
            this.showModal('completion');
            this.sounds.playSound('complete');
        }
    }
    
    document.addEventListener('DOMContentLoaded', () => {
        new MathPondGame();
    });
    
})();

// Add this to your script.js
function makeKeypadDraggable() {
    const keypad = document.getElementById('keypadContainer');
    if (!keypad) return;
    
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    keypad.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        
        isDragging = true;
        const rect = keypad.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        startX = e.clientX;
        startY = e.clientY;
        
        keypad.style.transform = 'none';
        keypad.style.left = initialX + 'px';
        keypad.style.top = initialY + 'px';
        keypad.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        keypad.style.left = (initialX + dx) + 'px';
        keypad.style.top = (initialY + dy) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        keypad.style.cursor = 'grab';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(makeKeypadDraggable, 100);
});