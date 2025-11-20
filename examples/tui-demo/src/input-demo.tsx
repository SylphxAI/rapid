/**
 * Demo: Interactive Input Components
 *
 * Showcases:
 * - FocusProvider for managing focus across components
 * - TextInput with cursor and editing
 * - SelectInput with dropdown navigation
 * - Checkbox components
 * - Tab/Shift+Tab navigation between inputs
 */

import {
  Box,
  Checkbox,
  FocusProvider,
  Newline,
  SelectInput,
  type SelectOption,
  Text,
  TextInput,
  handleCheckbox,
  handleSelectInput,
  handleTextInput,
  renderToTerminalReactive,
  signal,
  useFocusContext,
} from '@zen/tui';

// Form state
const name = signal('');
const email = signal('');
const role = signal<string>('developer');
const subscribe = signal(false);
const terms = signal(false);

// Select options
const roleOptions: SelectOption<string>[] = [
  { label: 'Developer', value: 'developer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Product Manager', value: 'pm' },
  { label: 'Other', value: 'other' },
];

function Form() {
  const _focusCtx = useFocusContext();

  return (
    <Box style={{ width: 60, borderStyle: 'round', padding: 1 }}>
      {/* Header */}
      <Box style={{ borderStyle: 'single', padding: 1 }}>
        <Text bold color="cyan">
          📝 User Registration Form
        </Text>
      </Box>

      <Newline count={2} />

      {/* Form fields */}
      <Box>
        <Text bold>Name:</Text>
        <Newline />
        <TextInput id="name" value={name} placeholder="Enter your name" width={56} />

        <Newline count={2} />

        <Text bold>Email:</Text>
        <Newline />
        <TextInput id="email" value={email} placeholder="you@example.com" width={56} />

        <Newline count={2} />

        <Text bold>Role:</Text>
        <Newline />
        <SelectInput
          id="role"
          options={roleOptions}
          value={role}
          placeholder="Select your role"
          width={56}
        />

        <Newline count={2} />

        <Checkbox id="subscribe" checked={subscribe} label="Subscribe to newsletter" />

        <Newline />

        <Checkbox id="terms" checked={terms} label="I agree to the terms and conditions" />

        <Newline count={2} />

        {/* Submit hint */}
        <Box style={{ borderStyle: 'single', paddingX: 1 }}>
          <Text dim>
            Press <Text bold>Tab</Text> to navigate • <Text bold>Enter</Text> to submit
          </Text>
        </Box>
      </Box>

      <Newline count={2} />

      {/* Form state display */}
      <Box style={{ borderStyle: 'single', padding: 1 }}>
        <Text bold color="yellow">
          Form Data:
        </Text>
        <Newline />
        <Text dim>
          Name: <Text color="white">{name.value || '(empty)'}</Text>
        </Text>
        <Newline />
        <Text dim>
          Email: <Text color="white">{email.value || '(empty)'}</Text>
        </Text>
        <Newline />
        <Text dim>
          Role: <Text color="white">{role.value}</Text>
        </Text>
        <Newline />
        <Text dim>
          Newsletter:{' '}
          <Text color={subscribe.value ? 'green' : 'red'}>{subscribe.value ? 'Yes' : 'No'}</Text>
        </Text>
        <Newline />
        <Text dim>
          Terms: <Text color={terms.value ? 'green' : 'red'}>{terms.value ? 'Yes' : 'No'}</Text>
        </Text>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <FocusProvider>
      <Form />
    </FocusProvider>
  );
}

// Render with reactive updates
const cleanup = renderToTerminalReactive(App, {
  onKeyPress: (key) => {
    // Tab navigation
    if (key === '\t') {
      // Tab
      const ctx = useFocusContext();
      ctx.focusNext();
      return;
    }

    if (key === '\x1b[Z') {
      // Shift+Tab
      const ctx = useFocusContext();
      ctx.focusPrev();
      return;
    }

    // TODO: Route key events to focused component
    // This requires accessing the focus context and routing to the appropriate handler
    // For now, this is a simplified demo showing the UI structure

    // Enter to submit (placeholder)
    if (key === '\r' || key === '\n') {
      // Could trigger form submission here
      return;
    }
  },
  fps: 30,
});

// Cleanup on Ctrl+C
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
