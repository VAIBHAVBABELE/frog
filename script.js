// ===== Math Pond Game - Complete JavaScript with 10 Fixed Patterns =====

(function() {
    "use strict";
    
    // ===== Configuration =====
    const CONFIG = {
        TOTAL_QUESTIONS: 10,
        MAX_OPERANDS: 3
    };
    
    // ===== 10 Fixed Question Patterns =====
    const QUESTION_PATTERNS = [
        // Pattern 1: pos × pos = blank
        {
            operands: [2, 3],
            blanks: [false, false, false, true]
        },
        // Pattern 2: pos + pos = blank
        {
            operands: [4, 5],
            blanks: [false, false, true, false]
        },
        // Pattern 3: pos , pos = blank , blank
        {
            operands: [3, 6],
            blanks: [false, false, true, true]
        },
        // Pattern 4: blank , blank = mul , add
        {
            operands: [3, 5],
            blanks: [true, true, false, false]
        },
        // Pattern 5: pos , neg = blank , blank
        {
            operands: [4, -2],
            blanks: [false, false, true, true]
        },
        // Pattern 6: blank , blank = neg(mul) , pos(add)
        {
            operands: [4, -3],
            blanks: [true, true, false, false]
        },
        // Pattern 7: pos , neg , neg = blank(pos mul) , blank(neg add)
        {
            operands: [2, -3, -1],
            blanks: [false, false, false, true, true]
        },
        // Pattern 8: blank , blank , blank = neg(mul) , pos(add)
        {
            operands: [2, -3, 4],
            blanks: [true, true, true, false, false]
        },
        // Pattern 9: pos , pos , neg = blank , blank
        {
            operands: [3, 2, -1],
            blanks: [false, false, false, true, true]
        },
        // Pattern 10: blank , blank = pos(add) , neg(mul)
        {
            operands: [5, -2],
            blanks: [true, true, false, false]
        }
    ];
    
    // ===== Sound Manager =====
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
                // Inputs
                frogInput: document.getElementById('frogInput'),
                fishInput: document.getElementById('fishInput'),
                lilypadsContainer: document.getElementById('lilypadsContainer'),
                
                // Progress
                progressDots: document.getElementById('progressDots'),
                
                // Buttons
                doneBtn: document.getElementById('doneBtn'),
                rulesBtn: document.getElementById('rulesBtn'),
                voiceToggle: document.getElementById('voiceToggle'),
                helpBtn: document.getElementById('helpBtn'),
                
                // Modals
                keypadModal: document.getElementById('keypadModal'),
                rulesModal: document.getElementById('rulesModal'),
                helpModal: document.getElementById('helpModal'),
                completionModal: document.getElementById('completionModal'),
                
                // Keypad elements
                keypadDisplay: document.getElementById('keypadDisplay'),
                
                // Message
                messageToast: document.getElementById('messageToast'),
                
                // Final score
                finalScore: document.getElementById('finalScore'),
                performanceMessage: document.getElementById('performanceMessage')
            };
        }
        
        initEventListeners() {
            // Input clicks - only for empty/editable slots
            this.elements.frogInput.addEventListener('click', (e) => {
                if (!e.target.readOnly) {
                    this.openKeypad('frog');
                }
            });
            
            this.elements.fishInput.addEventListener('click', (e) => {
                if (!e.target.readOnly) {
                    this.openKeypad('fish');
                }
            });
            
            // Done button
            this.elements.doneBtn.addEventListener('click', () => this.checkAnswer());
            
            // Header buttons
            this.elements.rulesBtn.addEventListener('click', () => this.showModal('rules'));
            this.elements.helpBtn.addEventListener('click', () => this.showModal('help'));
            this.elements.voiceToggle.addEventListener('click', () => this.toggleVoice());
            
            // Keypad
            document.querySelectorAll('[data-key]').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleKeypadInput(e.target.dataset.key));
            });
            
            document.getElementById('keypadClear').addEventListener('click', () => this.clearKeypad());
            document.getElementById('keypadSubmit').addEventListener('click', () => this.submitKeypadValue());
            document.getElementById('keypadCancel').addEventListener('click', () => this.closeKeypad());
            document.getElementById('closeKeypad').addEventListener('click', () => this.closeKeypad());
            
            // Modal close buttons
            document.getElementById('closeRules').addEventListener('click', () => this.hideModal('rules'));
            document.getElementById('closeHelp').addEventListener('click', () => this.hideModal('help'));
            document.getElementById('gotItBtn').addEventListener('click', () => this.hideModal('rules'));
            document.getElementById('gotHelpBtn').addEventListener('click', () => this.hideModal('help'));
            
            // Play again
            document.getElementById('playAgainBtn').addEventListener('click', () => {
                this.hideModal('completion');
                this.startNewGame();
            });
            
            // Modal overlay clicks
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
            // Get pattern based on question number (cycle through 10 patterns)
            const patternIndex = (this.questionNumber - 1) % QUESTION_PATTERNS.length;
            const pattern = QUESTION_PATTERNS[patternIndex];
            
            const operands = [...pattern.operands];
            const operandCount = operands.length;
            
            // Calculate results
            const add = operands.reduce((a, b) => a + b, 0);
            const mul = operands.reduce((a, b) => a * b, 1);
            
            this.currentQuestion = {
                operands,
                add,
                mul,
                blanks: [...pattern.blanks],
                operandCount
            };
            
            this.userAnswers = {};
            this.autoFillGivenValues();
            this.renderLilyPads();
            this.renderFrogFish();
        }
        
        autoFillGivenValues() {
            const q = this.currentQuestion;
            
            // Operands
            for (let i = 0; i < q.operandCount; i++) {
                if (!q.blanks[i]) {
                    this.userAnswers[`operand_${i}`] = q.operands[i];
                }
            }
            
            // Add result
            if (!q.blanks[q.operandCount]) {
                this.userAnswers['add'] = q.add;
            }
            
            // Mul result
            if (!q.blanks[q.operandCount + 1]) {
                this.userAnswers['mul'] = q.mul;
            }
        }
        
        renderLilyPads() {
            const q = this.currentQuestion;
            let html = '';
            
            for (let i = 0; i < q.operandCount; i++) {
                const isBlank = q.blanks[i];
                const value = this.userAnswers[`operand_${i}`];
                const displayValue = value !== undefined ? value : (isBlank ? '' : q.operands[i]);
                const isReadonly = !isBlank;
                
                html += `
                    <div class="lilypad-card">
                        <img src="assets/images/lilypad.png" alt="Lily Pad" class="card-image">
                        <div class="input-wrapper">
                            <input type="text" 
                                   class="slot-input ${isBlank && value === undefined ? 'empty' : 'filled'}" 
                                   data-type="operand" 
                                   data-index="${i}"
                                   value="${displayValue}"
                                   ${isReadonly ? 'readonly' : ''}
                                   placeholder="${isBlank ? '___' : ''}">
                        </div>
                    </div>
                `;
            }
            
            this.elements.lilypadsContainer.innerHTML = html;
            
            // Attach click handlers ONLY to editable inputs
            document.querySelectorAll('[data-type="operand"]').forEach(input => {
                input.addEventListener('click', (e) => {
                    if (!e.target.readOnly) {
                        const index = e.target.dataset.index;
                        this.openKeypad('operand', index);
                    }
                });
            });
        }
        
        renderFrogFish() {
            const q = this.currentQuestion;
            
            // Frog (Add)
            const addIndex = q.operandCount;
            const isAddBlank = q.blanks[addIndex];
            const addValue = this.userAnswers['add'];
            const addDisplayValue = addValue !== undefined ? addValue : (isAddBlank ? '' : q.add);
            const addReadonly = !isAddBlank;
            
            this.elements.frogInput.value = addDisplayValue;
            this.elements.frogInput.className = `slot-input ${isAddBlank && addValue === undefined ? 'empty' : 'filled'}`;
            this.elements.frogInput.placeholder = isAddBlank ? '___' : '';
            this.elements.frogInput.readOnly = addReadonly;
            
            // Fish (Mul)
            const mulIndex = q.operandCount + 1;
            const isMulBlank = q.blanks[mulIndex];
            const mulValue = this.userAnswers['mul'];
            const mulDisplayValue = mulValue !== undefined ? mulValue : (isMulBlank ? '' : q.mul);
            const mulReadonly = !isMulBlank;
            
            this.elements.fishInput.value = mulDisplayValue;
            this.elements.fishInput.className = `slot-input ${isMulBlank && mulValue === undefined ? 'empty' : 'filled'}`;
            this.elements.fishInput.placeholder = isMulBlank ? '___' : '';
            this.elements.fishInput.readOnly = mulReadonly;
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
                this.renderLilyPads();
            } else if (type === 'frog') {
                this.userAnswers['add'] = value;
                this.renderFrogFish();
            } else if (type === 'fish') {
                this.userAnswers['mul'] = value;
                this.renderFrogFish();
            }
            
            this.closeKeypad();
        }
        
        checkAnswer() {
            if (!this.gameActive || !this.currentQuestion) return;
            
            const q = this.currentQuestion;
            let allCorrect = true;
            let allFilled = true;
            
            // Check operands
            for (let i = 0; i < q.operandCount; i++) {
                if (q.blanks[i]) {
                    const userVal = this.userAnswers[`operand_${i}`];
                    if (userVal === undefined) {
                        allFilled = false;
                    } else if (userVal !== q.operands[i]) {
                        allCorrect = false;
                    }
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
            }, 2000);
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
    
    // Initialize game
    document.addEventListener('DOMContentLoaded', () => {
        new MathPondGame();
    });
    
})();