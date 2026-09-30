// =====================================================
// Simple Calculator - vanilla JavaScript (no eval)
// =====================================================

// ---------- 1. Grab the elements we need ----------
const resultEl = document.getElementById("result");         // big number
const expressionEl = document.getElementById("expression"); // small line above it
const keypad = document.getElementById("keypad");

// ---------- 2. Settings ----------
const MAX_DIGITS = 12; // most digits the user can type in one number

// Operators are stored as + - * / and shown with nicer symbols
const SYMBOLS = { "+": "+", "-": "−", "*": "×", "/": "÷" };

// ---------- 3. Calculator state ----------
let current = "0";               // the number on the display (kept as text)
let previous = null;             // the first number of a calculation
let operator = null;             // "+", "-", "*" or "/"
let operatorJustChosen = false;  // true right after pressing an operator
let resetNext = false;           // true after "=", "%" or an error: next digit starts a new number
let isError = false;             // true while an error is shown
let errorMessage = "";           // text for the error
let lastExpression = "";         // e.g. "5 + 3 =" shown after pressing equals

// ---------- 4. Helpers ----------

// Turn a number into text for the display
function formatResult(number) {
  return String(number);
}

// Round to 12 significant digits so 0.1 + 0.2 shows 0.3 (not 0.30000000000000004)
function roundNumber(number) {
  return parseFloat(number.toPrecision(12));
}

// Called at the start of most actions: clears an old error and the old expression
function startInput() {
  if (isError) {
    clearAll();
  }
  lastExpression = "";
}

// Show an error message and reset the calculation
function showError(message) {
  isError = true;
  errorMessage = message;
  current = "Error";
  previous = null;
  operator = null;
  operatorJustChosen = false;
  resetNext = true;
}

// The actual maths. Returns a number, or null if something went wrong.
function compute(a, b, op) {
  let value;

  if (op === "+") {
    value = a + b;
  } else if (op === "-") {
    value = a - b;
  } else if (op === "*") {
    value = a * b;
  } else if (op === "/") {
    if (b === 0) {
      showError("Cannot divide by zero");
      return null;
    }
    value = a / b;
  }

  if (!isFinite(value)) {
    showError("Number is too large");
    return null;
  }

  return roundNumber(value);
}

// ---------- 5. Calculator actions ----------

// A digit button (0-9)
function appendNumber(digit) {
  startInput();

  // Start a fresh number after "=" or after choosing an operator
  if (resetNext || operatorJustChosen) {
    current = digit;
    resetNext = false;
    operatorJustChosen = false;
    return;
  }

  // Limit the length of the number
  if (current.replace(/\D/g, "").length >= MAX_DIGITS) {
    return;
  }

  if (current === "0") {
    current = digit;          // replace the leading zero
  } else if (current === "-0") {
    current = "-" + digit;    // keep the minus sign
  } else {
    current += digit;
  }
}

// The decimal point button
function appendDecimal() {
  startInput();

  if (resetNext || operatorJustChosen) {
    current = "0.";
    resetNext = false;
    operatorJustChosen = false;
    return;
  }

  if (current.includes(".")) {
    return; // only one decimal point per number
  }
  current += ".";
}

// An operator button (+ - * /)
function chooseOperator(op) {
  startInput();

  // Case 1: the user typed only a minus sign so far ("-0")
  if (current === "-0") {
    if (operator !== null && op !== "-") {
      // e.g. "5 × -" then "+": drop the minus sign and change the operator
      operator = op;
      operatorJustChosen = true;
      current = formatResult(previous);
    }
    return;
  }

  // Case 2: minus at the very start means "negative number" (-5)
  if (op === "-" && operator === null && current === "0" && !resetNext) {
    current = "-0";
    return;
  }

  // Case 3: minus right after another operator means a negative number (5 × -3)
  if (op === "-" && operator !== null && operatorJustChosen) {
    current = "-0";
    operatorJustChosen = false;
    return;
  }

  // Case 4: normal operator
  if (operator !== null && !operatorJustChosen) {
    // Continuous calculation: finish the pending one first (5 + 3 × ... => 8 × ...)
    const result = compute(previous, parseFloat(current), operator);
    if (result === null) {
      return;
    }
    previous = result;
  } else if (operator === null) {
    previous = parseFloat(current);
  }
  // (If the user pressed two operators in a row, we just replace the old one.)

  operator = op;
  operatorJustChosen = true;
  resetNext = false;
  current = formatResult(previous);
}

// The percent button
function applyPercent() {
  startInput();

  if (operatorJustChosen) {
    return; // nothing to convert yet
  }

  let value = parseFloat(current);

  if ((operator === "+" || operator === "-") && previous !== null) {
    // 200 + 10%  ->  10% of 200 = 20  ->  200 + 20
    value = (previous * value) / 100;
  } else {
    value = value / 100;
  }

  current = formatResult(roundNumber(value));
  resetNext = true;
}

// The equals button
function calculateResult() {
  if (isError || operator === null || operatorJustChosen) {
    return; // nothing to calculate
  }

  const secondNumber = parseFloat(current);
  const result = compute(previous, secondNumber, operator);
  if (result === null) {
    return;
  }

  lastExpression =
    formatResult(previous) + " " + SYMBOLS[operator] + " " + formatResult(secondNumber) + " =";

  current = formatResult(result);
  previous = null;
  operator = null;
  operatorJustChosen = false;
  resetNext = true; // typing a digit now starts a new calculation
}

// The DEL button
function deleteLast() {
  if (isError) {
    clearAll();
    return;
  }
  if (resetNext || operatorJustChosen) {
    return; // don't delete from a finished result
  }

  current = current.slice(0, -1);
  if (current === "" || current === "-") {
    current = "0";
  }
}

// The AC button
function clearAll() {
  current = "0";
  previous = null;
  operator = null;
  operatorJustChosen = false;
  resetNext = false;
  isError = false;
  errorMessage = "";
  lastExpression = "";
}

// ---------- 6. Update the screen ----------
function updateDisplay() {
  resultEl.textContent = current;

  // Small line above the number
  if (isError) {
    expressionEl.textContent = errorMessage;
  } else if (operator !== null) {
    expressionEl.textContent = formatResult(previous) + " " + SYMBOLS[operator];
  } else {
    expressionEl.textContent = lastExpression;
  }

  // Make long numbers smaller so they fit
  resultEl.classList.toggle("shrink-1", current.length > 9 && current.length <= 13);
  resultEl.classList.toggle("shrink-2", current.length > 13);
  resultEl.classList.toggle("error", isError);
}

// ---------- 7. Mouse / touch: one listener for the whole keypad ----------
keypad.addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const value = button.dataset.value;

  if (action === "number") {
    appendNumber(value);
  } else if (action === "decimal") {
    appendDecimal();
  } else if (action === "operator") {
    chooseOperator(value);
  } else if (action === "percent") {
    applyPercent();
  } else if (action === "equals") {
    calculateResult();
  } else if (action === "delete") {
    deleteLast();
  } else if (action === "clear") {
    clearAll();
  }

  updateDisplay();
});

// ---------- 8. Keyboard support ----------
// Each button has a data-key attribute. When a key is pressed we find the
// matching button and click it, so the keyboard and mouse share the same code.
document.addEventListener("keydown", function (event) {
  // Ignore shortcuts like Ctrl+R or Cmd+C
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  let key = event.key;
  if (key === "=") {
    key = "Enter"; // "=" also calculates
  }

  const buttons = keypad.querySelectorAll("button");
  let matchingButton = null;
  for (const button of buttons) {
    if (button.dataset.key === key) {
      matchingButton = button;
      break;
    }
  }

  if (!matchingButton) {
    return; // not a calculator key
  }

  event.preventDefault(); // stops "/" quick-find and Enter re-clicking a focused button
  matchingButton.click();

  // Brief visual "press" effect
  matchingButton.classList.add("pressed");
  setTimeout(function () {
    matchingButton.classList.remove("pressed");
  }, 120);
});

// Show the starting state
updateDisplay();