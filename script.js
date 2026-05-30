/* ==============================================
   Magic Trick Calculator — JavaScript Logic
   iOS-style UI + Secret Limit + Setup Mode
   ============================================== */

// ──────────────────────────────────────────────
// Hidden State Variables
// ──────────────────────────────────────────────
let secretLimit = 2555;        // Default secret limit
let isSetupMode = false;       // True when "0+0+0=" has been entered

// ──────────────────────────────────────────────
// Calculator State
// ──────────────────────────────────────────────
let expression = '0';          // Full display string (e.g., "2000+555")
let shouldResetDisplay = false;// Next digit clears the expression
let limitReached = false;      // Expression evaluates to secretLimit exactly
let justEvaluated = false;     // True right after "=" — used to restart cleanly

// ──────────────────────────────────────────────
// DOM References
// ──────────────────────────────────────────────
const displayEl = document.getElementById('display');
const allButtons = document.querySelectorAll('.btn');
const btnClear = document.getElementById('btn-clear');

// ──────────────────────────────────────────────
// AC / C Toggle
// ──────────────────────────────────────────────

function updateClearButton() {
    if (expression !== '0' || isSetupMode) {
        btnClear.textContent = 'C';
    } else {
        btnClear.textContent = 'AC';
    }
}

// ──────────────────────────────────────────────
// Expression Parsing Helpers
// ──────────────────────────────────────────────

function lastOperatorIndex(expr) {
    let idx = -1;
    for (let i = expr.length - 1; i >= 0; i--) {
        if (isOperatorChar(expr[i])) { idx = i; break; }
    }
    return idx;
}

function isOperatorChar(ch) {
    return ch === '+' || ch === '−' || ch === '×' || ch === '÷';
}

function parseExpression(expr) {
    const idx = lastOperatorIndex(expr);
    if (idx === -1) return { leftExpr: '', op: '', rightStr: expr };
    return {
        leftExpr: expr.substring(0, idx),
        op: expr[idx],
        rightStr: expr.substring(idx + 1)
    };
}

/**
 * Evaluate left-to-right (no precedence).
 * Example: "5+3×2" → (5+3)×2 = 16
 */
function evaluateLeftToRight(expr) {
    if (!expr || expr === '') return null;

    const tokens = [];
    let currentNum = '';

    for (let i = 0; i < expr.length; i++) {
        const ch = expr[i];
        if (isOperatorChar(ch)) {
            if (ch === '−' && currentNum === '' && tokens.length === 0) {
                currentNum = '-';
                continue;
            }
            if (currentNum !== '') {
                tokens.push(currentNum);
                currentNum = '';
            }
            tokens.push(ch);
        } else {
            currentNum += ch;
        }
    }
    if (currentNum !== '') tokens.push(currentNum);

    let result = parseFloat(tokens[0]);
    if (isNaN(result)) return null;

    for (let i = 1; i < tokens.length; i += 2) {
        const op = tokens[i];
        const nextNum = parseFloat(tokens[i + 1]);
        if (isNaN(nextNum)) return null;
        switch (op) {
            case '+': result += nextNum; break;
            case '−': result -= nextNum; break;
            case '×': result *= nextNum; break;
            case '÷':
                if (nextNum === 0) return null;
                result /= nextNum;
                break;
        }
    }

    return parseFloat(result.toFixed(10));
}

// ──────────────────────────────────────────────
// Limit Calculation Helpers
// ──────────────────────────────────────────────

function maxAllowedRightOperand(leftExpr, op) {
    if (!op) return secretLimit;
    const leftVal = evaluateLeftToRight(leftExpr);
    if (leftVal === null) return secretLimit;
    switch (op) {
        case '+': return secretLimit - leftVal;
        case '×':
            if (leftVal === 0) return secretLimit;
            return Math.floor(secretLimit / leftVal);
        case '−':
        case '÷':
            return Infinity;
        default: return secretLimit;
    }
}

function clampRightOperand(rightStr, maxVal) {
    if (maxVal === Infinity) return rightStr;
    const num = parseFloat(rightStr);
    if (isNaN(num)) return rightStr;
    if (num <= maxVal) return rightStr;
    if (Number.isInteger(maxVal)) {
        return String(maxVal);
    } else {
        return maxVal.toFixed(10).replace(/\.?0+$/, '');
    }
}

function checkLimitReached() {
    const val = evaluateLeftToRight(expression);
    limitReached = (val !== null && val === secretLimit);
}

function tryAppendDigit(rightStr, digit, leftExpr, op) {
    const tentative = rightStr + digit;
    const maxVal = maxAllowedRightOperand(leftExpr, op);
    const clamped = clampRightOperand(tentative, maxVal);
    if (parseFloat(clamped) === parseFloat(rightStr) && tentative !== clamped) {
        return null;
    }
    return clamped;
}

// ──────────────────────────────────────────────
// Display & Font Scaling
// ──────────────────────────────────────────────

function updateDisplay() {
    displayEl.textContent = expression;
    updateClearButton();

    // Remove all length-based classes
    displayEl.classList.forEach(cls => {
        if (cls.startsWith('len-')) displayEl.classList.remove(cls);
    });

    // Apply appropriate size class based on expression length
    const len = expression.length;
    if (len >= 16)       displayEl.classList.add('len-16p');
    else if (len >= 15)  displayEl.classList.add('len-15');
    else if (len >= 14)  displayEl.classList.add('len-14');
    else if (len >= 13)  displayEl.classList.add('len-13');
    else if (len >= 12)  displayEl.classList.add('len-12');
    else if (len >= 11)  displayEl.classList.add('len-11');
    else if (len >= 10)  displayEl.classList.add('len-10');
    else if (len >= 9)   displayEl.classList.add('len-9');
    else if (len >= 8)   displayEl.classList.add('len-8');
    else if (len >= 7)   displayEl.classList.add('len-7');
    // Default: no class = largest size (5.5rem)
}

// ──────────────────────────────────────────────
// Operator Highlighting
// ──────────────────────────────────────────────

function clearOperatorHighlight() {
    document.querySelectorAll('.btn.op').forEach(btn => {
        btn.classList.remove('active');
    });
}

function highlightOperatorFromExpression() {
    clearOperatorHighlight();
    const idx = lastOperatorIndex(expression);
    if (idx === -1) return;
    const opChar = expression[idx];
    document.querySelectorAll('.btn.op').forEach(btn => {
        if (btn.dataset.value === opChar) {
            btn.classList.add('active');
        }
    });
}

// ──────────────────────────────────────────────
// Reset
// ──────────────────────────────────────────────

function resetCalculator() {
    expression = '0';
    shouldResetDisplay = false;
    limitReached = false;
    justEvaluated = false;
    clearOperatorHighlight();
    updateDisplay();
}

// ──────────────────────────────────────────────
// Input Handlers
// ──────────────────────────────────────────────

function inputDigit(digit) {
    if (limitReached) return;

    // ── SETUP MODE ──
    if (isSetupMode) {
        if (shouldResetDisplay || expression === '0') {
            expression = digit;
            shouldResetDisplay = false;
        } else {
            expression += digit;
        }
        updateDisplay();
        return;
    }

    // ── NORMAL MODE ──
    if (shouldResetDisplay || justEvaluated) {
        expression = digit;
        shouldResetDisplay = false;
        justEvaluated = false;
        clearOperatorHighlight();
        checkLimitReached();
        updateDisplay();
        return;
    }

    if (expression === '0') {
        expression = digit;
        checkLimitReached();
        updateDisplay();
        return;
    }

    const { leftExpr, op, rightStr } = parseExpression(expression);

    if (op) {
        const result = tryAppendDigit(rightStr, digit, leftExpr, op);
        if (result === null) return;
        expression = leftExpr + op + result;
    } else {
        const tentative = expression + digit;
        const clamped = clampRightOperand(tentative, secretLimit);
        if (parseFloat(clamped) === parseFloat(expression) && tentative !== clamped) {
            return;
        }
        expression = clamped;
    }

    checkLimitReached();
    highlightOperatorFromExpression();
    updateDisplay();
}

function inputDecimal() {
    if (limitReached) return;

    if (isSetupMode) {
        if (shouldResetDisplay || expression === '0') {
            expression = '0.';
            shouldResetDisplay = false;
        } else if (!expression.includes('.')) {
            const idx = lastOperatorIndex(expression);
            const rightPart = idx === -1 ? expression : expression.substring(idx + 1);
            if (!rightPart.includes('.')) expression += '.';
        }
        updateDisplay();
        return;
    }

    if (shouldResetDisplay || justEvaluated) {
        expression = '0.';
        shouldResetDisplay = false;
        justEvaluated = false;
        clearOperatorHighlight();
        updateDisplay();
        return;
    }

    const idx = lastOperatorIndex(expression);
    const rightPart = idx === -1 ? expression : expression.substring(idx + 1);
    if (rightPart.includes('.')) return;

    if (rightPart === '' || rightPart === '-') {
        expression += '0.';
    } else {
        expression += '.';
    }

    updateDisplay();
}

function inputOperator(op) {
    if (limitReached) return;
    if (isSetupMode) return;

    justEvaluated = false;

    const lastChar = expression[expression.length - 1];
    if (isOperatorChar(lastChar)) {
        expression = expression.substring(0, expression.length - 1) + op;
        highlightOperatorFromExpression();
        updateDisplay();
        return;
    }

    if (expression === '0' || expression === '') {
        expression = '0' + op;
        highlightOperatorFromExpression();
        updateDisplay();
        return;
    }

    expression += op;
    shouldResetDisplay = false;
    limitReached = false;
    highlightOperatorFromExpression();
    updateDisplay();
}

function inputEquals() {
    // ── SECRET TRIGGER: "0+0+0" ──
    if (expression === '0+0+0' && !isSetupMode) {
        isSetupMode = true;
        expression = '0';
        shouldResetDisplay = false;
        limitReached = false;
        justEvaluated = false;
        clearOperatorHighlight();
        updateDisplay();
        return;
    }

    // ── SETUP MODE: Save new limit ──
    if (isSetupMode) {
        const newLimit = parseFloat(expression);
        if (!isNaN(newLimit) && newLimit > 0) {
            secretLimit = newLimit;
        }
        isSetupMode = false;
        resetCalculator();
        return;
    }

    // ── NORMAL EQUALS ──
    let evalExpr = expression;
    if (isOperatorChar(evalExpr[evalExpr.length - 1])) {
        evalExpr = evalExpr.substring(0, evalExpr.length - 1);
    }

    let result = evaluateLeftToRight(evalExpr);

    if (result === null) {
        expression = 'Error';
        shouldResetDisplay = true;
        justEvaluated = false;
        limitReached = false;
        clearOperatorHighlight();
        updateDisplay();
        return;
    }

    if (result > secretLimit) {
        result = secretLimit;
    }

    expression = String(result);
    shouldResetDisplay = true;
    justEvaluated = true;
    clearOperatorHighlight();

    if (result === secretLimit) {
        limitReached = true;
    } else {
        limitReached = false;
    }

    updateDisplay();
}

function inputClear() {
    resetCalculator();
}

function inputParenthesis() {
    if (limitReached) return;
    if (isSetupMode) return;

    const idx = lastOperatorIndex(expression);

    if (idx === -1) {
        if (expression === '0' || expression === '') return;
        if (expression.startsWith('-')) {
            expression = expression.substring(1);
        } else {
            expression = '-' + expression;
        }
    } else {
        const leftPart = expression.substring(0, idx + 1);
        let rightPart = expression.substring(idx + 1);
        if (rightPart === '' || rightPart === '0') return;
        if (rightPart.startsWith('-')) {
            rightPart = rightPart.substring(1);
        } else {
            rightPart = '-' + rightPart;
        }
        expression = leftPart + rightPart;
    }

    checkLimitReached();
    updateDisplay();
}

function inputPercent() {
    if (limitReached) return;
    if (isSetupMode) return;

    const idx = lastOperatorIndex(expression);

    if (idx === -1) {
        const num = parseFloat(expression);
        if (!isNaN(num)) {
            const pct = num / 100;
            expression = parseFloat(pct.toFixed(10)).toString();
            expression = clampRightOperand(expression, secretLimit);
        }
    } else {
        const leftPart = expression.substring(0, idx + 1);
        const rightPart = expression.substring(idx + 1);
        const num = parseFloat(rightPart);
        if (!isNaN(num)) {
            const pct = num / 100;
            let newRight = parseFloat(pct.toFixed(10)).toString();
            const { leftExpr, op } = parseExpression(expression);
            const maxVal = maxAllowedRightOperand(leftExpr, op);
            newRight = clampRightOperand(newRight, maxVal);
            expression = leftPart + newRight;
        }
    }

    checkLimitReached();
    updateDisplay();
}

// ──────────────────────────────────────────────
// Backspace
// ──────────────────────────────────────────────

function handleBackspace() {
    if (limitReached) {
        limitReached = false;
    }

    if (isSetupMode) {
        if (expression.length > 1) {
            expression = expression.slice(0, -1);
        } else {
            expression = '0';
        }
        updateDisplay();
        return;
    }

    if (shouldResetDisplay || justEvaluated) return;

    if (expression.length > 1) {
        expression = expression.slice(0, -1);
    } else {
        expression = '0';
    }

    checkLimitReached();
    highlightOperatorFromExpression();
    updateDisplay();
}

// ──────────────────────────────────────────────
// Vibrate on button press (mobile haptic feedback)
// ──────────────────────────────────────────────

function vibrate() {
    if (navigator.vibrate) {
        navigator.vibrate(8); // 8ms short pulse
    }
}

// ──────────────────────────────────────────────
// Event Binding
// ──────────────────────────────────────────────

allButtons.forEach(button => {
    button.addEventListener('pointerdown', () => {
        vibrate();
    });

    button.addEventListener('click', () => {
        const action = button.dataset.action;
        const value = button.dataset.value;

        switch (action) {
            case 'digit':     inputDigit(value);     break;
            case 'decimal':   inputDecimal();         break;
            case 'operator':  inputOperator(value);   break;
            case 'equals':    inputEquals();           break;
            case 'clear':     inputClear();           break;
            case 'parenthesis': inputParenthesis();    break;
            case 'percent':   inputPercent();          break;
        }
    });
});

// ──────────────────────────────────────────────
// Keyboard Support
// ──────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
    const key = e.key;

    if (/^[0-9.]$/.test(key) ||
        ['+', '-', '*', '/', 'Enter', '=', 'Escape', 'c', 'C', '%', 'Backspace'].includes(key)) {
        e.preventDefault();
    }

    if (/^[0-9]$/.test(key)) {
        inputDigit(key);
    } else if (key === '.') {
        inputDecimal();
    } else if (key === '+') {
        inputOperator('+');
    } else if (key === '-') {
        inputOperator('−');
    } else if (key === '*') {
        inputOperator('×');
    } else if (key === '/') {
        inputOperator('÷');
    } else if (key === 'Enter' || key === '=') {
        inputEquals();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
        inputClear();
    } else if (key === '%') {
        inputPercent();
    } else if (key === 'Backspace') {
        handleBackspace();
    }
});

// ──────────────────────────────────────────────
// Register Service Worker (PWA)
// ──────────────────────────────────────────────
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(() => {
            console.log('[PWA] Service Worker registered');
        }).catch(() => {
            // Silently fail — app works without SW
        });
    });
}

// ──────────────────────────────────────────────
// Initialize
// ──────────────────────────────────────────────
updateDisplay();