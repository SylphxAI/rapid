/**
 * Calculator App
 */

import { Box, Text, signal, useInput } from '@rapid/tui';

export function Calculator() {
  const display = signal('0');
  const operation = signal<string | null>(null);
  const previousValue = signal<number | null>(null);
  const waitingForOperand = signal(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand.value) {
      display.value = digit;
      waitingForOperand.value = false;
    } else {
      display.value = display.value === '0' ? digit : display.value + digit;
    }
  };

  const inputDot = () => {
    if (waitingForOperand.value) {
      display.value = '0.';
      waitingForOperand.value = false;
    } else if (!display.value.includes('.')) {
      display.value += '.';
    }
  };

  const clear = () => {
    display.value = '0';
    operation.value = null;
    previousValue.value = null;
    waitingForOperand.value = false;
  };

  const performOperation = (nextOp: string) => {
    const inputValue = Number.parseFloat(display.value);

    if (previousValue.value === null) {
      previousValue.value = inputValue;
    } else if (operation.value) {
      const result = calculate(previousValue.value, inputValue, operation.value);
      display.value = String(result);
      previousValue.value = result;
    }

    waitingForOperand.value = true;
    operation.value = nextOp;
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return b !== 0 ? a / b : 0;
      default:
        return b;
    }
  };

  const equals = () => {
    if (operation.value && previousValue.value !== null) {
      const inputValue = Number.parseFloat(display.value);
      const result = calculate(previousValue.value, inputValue, operation.value);
      display.value = String(result);
      previousValue.value = null;
      operation.value = null;
      waitingForOperand.value = true;
    }
  };

  // Handle keyboard input
  useInput((input, key) => {
    if (/[0-9]/.test(input)) {
      inputDigit(input);
    } else if (input === '.') {
      inputDot();
    } else if (input === '+' || input === '-' || input === '*' || input === '/') {
      performOperation(input);
    } else if (key.return || input === '=') {
      equals();
    } else if (input === 'c' || input === 'C') {
      clear();
    }
  });

  const Button = ({ label, color = 'white', bg = 'gray', onClick }: any) => (
    <Box
      width={5}
      height={1}
      backgroundColor={bg}
      justifyContent="center"
      alignItems="center"
      onClick={onClick}
    >
      <Text color={color} bold>
        {label}
      </Text>
    </Box>
  );

  return (
    <Box flexDirection="column" gap={1}>
      {/* Display */}
      <Box backgroundColor="black" paddingX={1} justifyContent="flex-end">
        <Text color="green" bold>
          {display.value}
        </Text>
      </Box>

      {/* Buttons */}
      <Box flexDirection="column" gap={1}>
        <Box gap={1}>
          <Button label="C" color="white" bg="red" onClick={clear} />
          <Button label="±" onClick={() => {}} />
          <Button label="%" onClick={() => {}} />
          <Button label="÷" color="yellow" onClick={() => performOperation('/')} />
        </Box>
        <Box gap={1}>
          <Button label="7" onClick={() => inputDigit('7')} />
          <Button label="8" onClick={() => inputDigit('8')} />
          <Button label="9" onClick={() => inputDigit('9')} />
          <Button label="×" color="yellow" onClick={() => performOperation('*')} />
        </Box>
        <Box gap={1}>
          <Button label="4" onClick={() => inputDigit('4')} />
          <Button label="5" onClick={() => inputDigit('5')} />
          <Button label="6" onClick={() => inputDigit('6')} />
          <Button label="-" color="yellow" onClick={() => performOperation('-')} />
        </Box>
        <Box gap={1}>
          <Button label="1" onClick={() => inputDigit('1')} />
          <Button label="2" onClick={() => inputDigit('2')} />
          <Button label="3" onClick={() => inputDigit('3')} />
          <Button label="+" color="yellow" onClick={() => performOperation('+')} />
        </Box>
        <Box gap={1}>
          <Box
            width={11}
            height={1}
            backgroundColor="gray"
            justifyContent="center"
            onClick={() => inputDigit('0')}
          >
            <Text color="white" bold>
              0
            </Text>
          </Box>
          <Button label="." onClick={inputDot} />
          <Button label="=" color="white" bg="blue" onClick={equals} />
        </Box>
      </Box>

      <Text color="gray" dimColor>
        Use keyboard: 0-9, +, -, *, /, =, C
      </Text>
    </Box>
  );
}
