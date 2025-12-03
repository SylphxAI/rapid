/**
 * Terminal App - Fake terminal with some commands
 */

import { Box, For, Text, TextInput, signal } from '@rapid/tui';

export function Terminal() {
  const history = signal<Array<{ cmd: string; output: string }>>([
    { cmd: '', output: 'Welcome to ZenOS Terminal v1.0' },
    { cmd: '', output: 'Type "help" for available commands.' },
  ]);
  const currentInput = signal('');

  const processCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    let output = '';

    switch (trimmed) {
      case 'help':
        output = `Available commands:
  help     - Show this help
  ls       - List files
  pwd      - Print working directory
  whoami   - Display current user
  date     - Show current date/time
  uname    - System information
  clear    - Clear screen
  echo     - Echo text
  neofetch - System info (fancy)`;
        break;

      case 'ls':
        output = 'Desktop  Documents  Downloads  Music  Pictures  Videos';
        break;

      case 'pwd':
        output = '/home/user';
        break;

      case 'whoami':
        output = 'user';
        break;

      case 'date':
        output = new Date().toString();
        break;

      case 'uname':
      case 'uname -a':
        output = 'ZenOS 1.0.0 zen-tui x86_64 GNU/Linux';
        break;

      case 'clear':
        history.value = [];
        currentInput.value = '';
        return;

      case 'neofetch':
        output = `
       ███████╗███████╗███╗   ██╗
       ╚══███╔╝██╔════╝████╗  ██║
         ███╔╝ █████╗  ██╔██╗ ██║
        ███╔╝  ██╔══╝  ██║╚██╗██║
       ███████╗███████╗██║ ╚████║
       ╚══════╝╚══════╝╚═╝  ╚═══╝

  OS: ZenOS 1.0
  Kernel: zen-tui
  Shell: zsh
  Terminal: @rapid/tui
  CPU: Signal Core @ 3.6GHz
  Memory: 16GB / 32GB`;
        break;

      default:
        if (trimmed.startsWith('echo ')) {
          output = trimmed.slice(5);
        } else if (trimmed === '') {
          output = '';
        } else {
          output = `zsh: command not found: ${trimmed}`;
        }
    }

    history.value = [...history.value, { cmd, output }];
    currentInput.value = '';
  };

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Command History */}
      <Box flexDirection="column" flex={1}>
        <For each={history.value}>
          {(entry) => (
            <Box flexDirection="column">
              {entry.cmd && (
                <Text>
                  <Text color="green">user@zen</Text>
                  <Text color="white">:</Text>
                  <Text color="blue">~</Text>
                  <Text color="white">$ {entry.cmd}</Text>
                </Text>
              )}
              {entry.output && (
                <Text color="white" wrap="wrap">
                  {entry.output}
                </Text>
              )}
            </Box>
          )}
        </For>
      </Box>

      {/* Command Input */}
      <Box>
        <Text color="green">user@zen</Text>
        <Text color="white">:</Text>
        <Text color="blue">~</Text>
        <Text color="white">$ </Text>
        <TextInput
          value={currentInput.value}
          onChange={(v) => {
            currentInput.value = v;
          }}
          onSubmit={(v) => processCommand(v)}
          placeholder=""
        />
      </Box>
    </Box>
  );
}
