/**
 * TextInput component for TUI
 *
 * Interactive text input with cursor, editing, keyboard navigation,
 * and optional autocomplete suggestions.
 */

import { type MaybeReactive, type Signal, createUniqueId, resolve, signal } from '@rapid/runtime';
import type { TUINode, TUIStyle } from '../core/types.js';
import { useInput } from '../hooks/useInput.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';
import { useFocus } from '../utils/focus.js';

/** Suggestion provider function type */
export type SuggestionProvider = (value: string) => string[] | Promise<string[]>;

export interface TextInputProps {
  /** Current value - supports Signal or MaybeReactive */
  value?: Signal<string> | MaybeReactive<string>;
  /** Placeholder text - supports MaybeReactive */
  placeholder?: MaybeReactive<string>;
  /** Called when value changes */
  onChange?: (value: string) => void;
  /** Called on Enter/submit */
  onSubmit?: (value: string) => void;
  /** Input width - supports MaybeReactive */
  width?: MaybeReactive<number>;
  /** Focus ID for FocusProvider */
  id?: string;
  /** Auto-focus this input on mount */
  autoFocus?: boolean;
  /** Custom styles */
  style?: TUIStyle;
  /** External cursor control */
  cursor?: Signal<number>;
  /** Mask character for passwords */
  mask?: string;
  /** Autocomplete suggestions - array or function returning suggestions */
  suggestions?: string[] | SuggestionProvider;
  /** Maximum suggestions to show (default: 5) */
  maxSuggestions?: number;
  /** Called when suggestion is selected */
  onSuggestionSelect?: (suggestion: string) => void;
  /** Suggestions dropdown position (default: 'below') */
  suggestionsPosition?: 'above' | 'below';
}

export function TextInput(props: TextInputProps): TUINode {
  // Generate unique ID if not provided
  const id = props.id || `input-${createUniqueId()}`;

  // Value management
  const valueSignal =
    typeof props.value === 'object' && 'value' in props.value
      ? props.value
      : signal(typeof props.value === 'string' ? props.value : '');

  // Cursor position (use external if provided, otherwise create internal)
  const cursorPos = props.cursor || signal(valueSignal.value.length);

  // Autocomplete state
  const filteredSuggestions = signal<string[]>([]);
  const selectedSuggestionIndex = signal(-1);
  const showSuggestions = signal(false);
  const maxSuggestions = props.maxSuggestions || 5;

  // Update suggestions when value changes
  const updateSuggestions = async () => {
    if (!props.suggestions) {
      filteredSuggestions.value = [];
      return;
    }

    const value = valueSignal.value;
    let suggestions: string[];

    if (typeof props.suggestions === 'function') {
      const result = props.suggestions(value);
      suggestions = result instanceof Promise ? await result : result;
    } else {
      // Filter static array based on current value
      suggestions = props.suggestions.filter(
        (s) => s.toLowerCase().startsWith(value.toLowerCase()) && s !== value,
      );
    }

    filteredSuggestions.value = suggestions.slice(0, maxSuggestions);
    selectedSuggestionIndex.value = filteredSuggestions.value.length > 0 ? 0 : -1;
    showSuggestions.value = filteredSuggestions.value.length > 0;
  };

  // Select a suggestion
  const selectSuggestion = (suggestion: string) => {
    valueSignal.value = suggestion;
    cursorPos.value = suggestion.length;
    showSuggestions.value = false;
    selectedSuggestionIndex.value = -1;
    props.onChange?.(suggestion);
    props.onSuggestionSelect?.(suggestion);
  };

  // Focus management
  const { isFocused } = useFocus({
    id,
    autoFocus: props.autoFocus,
    onFocus: () => {
      // Reset cursor to end on focus
      cursorPos.value = valueSignal.value.length;
      updateSuggestions();
    },
    onBlur: () => {
      // Hide suggestions when losing focus
      showSuggestions.value = false;
    },
  });

  // Handle keyboard input
  useInput((input, key) => {
    if (!isFocused.value) {
      return;
    }

    // Handle suggestion navigation when suggestions are shown
    if (showSuggestions.value && filteredSuggestions.value.length > 0) {
      // Up arrow - navigate suggestions
      if (key.upArrow) {
        selectedSuggestionIndex.value =
          selectedSuggestionIndex.value <= 0
            ? filteredSuggestions.value.length - 1
            : selectedSuggestionIndex.value - 1;
        return;
      }

      // Down arrow - navigate suggestions
      if (key.downArrow) {
        selectedSuggestionIndex.value =
          (selectedSuggestionIndex.value + 1) % filteredSuggestions.value.length;
        return;
      }

      // Tab or Enter - select current suggestion
      if ((key.tab || key.return) && selectedSuggestionIndex.value >= 0) {
        const selected = filteredSuggestions.value[selectedSuggestionIndex.value];
        if (selected) {
          selectSuggestion(selected);
          return;
        }
      }

      // Escape - hide suggestions
      if (key.escape) {
        showSuggestions.value = false;
        return;
      }
    }

    // Handle Enter for submit (when no suggestions or nothing selected)
    if (key.return && props.onSubmit) {
      props.onSubmit(valueSignal.value);
      return;
    }

    if (handleTextInput(valueSignal, cursorPos, key, input)) {
      props.onChange?.(valueSignal.value);
      // Update suggestions after input change
      updateSuggestions();
    }
  });

  // If width is specified, use it. Otherwise, use flex: 1 to fill available space
  const hasExplicitWidth = props.width !== undefined;
  const getWidth = () => (hasExplicitWidth ? resolve(props.width) : undefined);
  const getPlaceholder = () => resolve(props.placeholder);
  const suggestionsPosition = props.suggestionsPosition || 'below';

  // Render the input text with cursor
  const renderInputText = () => {
    const currentValue = valueSignal.value;
    const placeholder = getPlaceholder();
    const showPlaceholder = currentValue.length === 0 && placeholder;

    if (showPlaceholder) {
      return Text({
        children: placeholder,
        dim: true,
        style: { flexDirection: 'row' },
      });
    }

    // Apply masking if specified
    const maskChar = props.mask;
    const displayValue = maskChar ? maskChar.repeat(currentValue.length) : currentValue;
    const pos = Math.min(cursorPos.value, currentValue.length);

    if (isFocused.value) {
      const before = displayValue.slice(0, pos);
      const cursorChar = pos < displayValue.length ? displayValue[pos] : ' ';
      const after = displayValue.slice(pos + 1);

      return Text({
        style: { flexDirection: 'row' },
        children: [
          before,
          Text({
            children: cursorChar,
            backgroundColor: 'white',
            color: 'black',
          }),
          after,
        ],
      });
    }

    return Text({
      children: displayValue || ' ',
      style: { flexDirection: 'row' },
    });
  };

  // Render suggestions dropdown
  const renderSuggestions = () => {
    if (!showSuggestions.value || filteredSuggestions.value.length === 0) {
      return null;
    }

    const suggestionItems = filteredSuggestions.value.map((suggestion, index) => {
      const isSelected = index === selectedSuggestionIndex.value;
      return Box({
        style: {
          paddingX: 1,
          backgroundColor: isSelected ? 'cyan' : undefined,
        },
        children: Text({
          children: suggestion,
          color: isSelected ? 'black' : undefined,
          bold: isSelected,
        }),
      });
    });

    return Box({
      style: {
        flexDirection: 'column',
        borderStyle: 'single',
        borderColor: 'gray',
        marginTop: 0,
      },
      children: suggestionItems,
    });
  };

  // Input field component
  const inputField = () =>
    Box({
      style: {
        borderStyle: isFocused.value ? 'round' : 'single',
        borderColor: isFocused.value ? 'cyan' : undefined,
        padding: 0,
        paddingX: 1,
        ...props.style,
      },
      children: renderInputText(),
    });

  // Container box with input and suggestions
  // Use alignSelf: 'stretch' to fill horizontal space when no explicit width
  // (flex: 1 would grow vertically in column layouts, which is not desired)
  return Box({
    style: {
      flexDirection: 'column',
      ...(hasExplicitWidth ? { width: () => getWidth() } : { alignSelf: 'stretch' }),
    },
    children: () =>
      suggestionsPosition === 'above'
        ? [renderSuggestions(), inputField()]
        : [inputField(), renderSuggestions()],
  });
}

/**
 * Input handler for TextInput
 * Call this from the app's key handler
 *
 * @param valueSignal - Signal controlling the text value
 * @param cursorPos - Signal controlling cursor position
 * @param key - Parsed Key object from useInput
 * @param input - Raw input string for character input
 * @returns true if the key was handled, false otherwise
 */
export function handleTextInput(
  valueSignal: Signal<string>,
  cursorPos: Signal<number>,
  key: import('../hooks/useInput.js').Key,
  input: string,
): boolean {
  const value = valueSignal.value;
  const pos = cursorPos.value;

  // Character input (printable characters)
  // Use input string for actual typed characters
  if (input.length === 1 && input >= ' ' && input <= '~') {
    // Insert character at cursor
    valueSignal.value = value.slice(0, pos) + input + value.slice(pos);
    cursorPos.value = pos + 1;
    return true;
  }

  // Backspace
  if (key.backspace) {
    if (pos > 0) {
      valueSignal.value = value.slice(0, pos - 1) + value.slice(pos);
      cursorPos.value = pos - 1;
    }
    return true;
  }

  // Delete
  if (key.delete) {
    if (pos < value.length) {
      valueSignal.value = value.slice(0, pos) + value.slice(pos + 1);
    }
    return true;
  }

  // Left arrow
  if (key.leftArrow) {
    if (pos > 0) {
      cursorPos.value = pos - 1;
    }
    return true;
  }

  // Right arrow
  if (key.rightArrow) {
    if (pos < value.length) {
      cursorPos.value = pos + 1;
    }
    return true;
  }

  // Home or Ctrl+A
  if (key.home || (key.ctrl && input === 'a')) {
    cursorPos.value = 0;
    return true;
  }

  // End or Ctrl+E
  if (key.end || (key.ctrl && input === 'e')) {
    cursorPos.value = value.length;
    return true;
  }

  return false;
}
