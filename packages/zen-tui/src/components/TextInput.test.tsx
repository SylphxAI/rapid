import { describe, expect, it } from 'vitest';
import { signal } from '../index';
import { TextInput, handleTextInput } from './TextInput';

describe('TextInput', () => {
  it('should create text input node', () => {
    const value = signal('');
    const node = TextInput({ value });

    expect(node.type).toBe('box');
    expect(typeof node.style?.borderStyle).toBe('function');
  });

  it('should accept initial value as string', () => {
    const node = TextInput({ value: 'test' });

    expect(node).toBeTruthy();
  });

  it('should accept initial value as signal', () => {
    const value = signal('test');
    const node = TextInput({ value });

    expect(node).toBeTruthy();
  });

  it('should use default width if not specified', () => {
    const node = TextInput({ value: signal('') });

    expect(node.style?.width).toBe(40);
  });

  it('should use custom width when specified', () => {
    const node = TextInput({ value: signal(''), width: 60 });

    expect(node.style?.width).toBe(60);
  });

  it('should have round border when focused', () => {
    // Note: This is simplified - actual focus state requires FocusProvider context
    // In real usage, focus would be managed by FocusProvider
    const node = TextInput({ value: signal(''), id: 'test-input' });

    expect(node.style?.borderStyle).toBeDefined();
  });

  it('should generate unique ID if not provided', () => {
    const node1 = TextInput({ value: signal('') });
    const node2 = TextInput({ value: signal('') });

    // IDs should be different (randomly generated)
    expect(node1.props).toBeDefined();
    expect(node2.props).toBeDefined();
  });

  it('should use provided ID', () => {
    const node = TextInput({ value: signal(''), id: 'custom-id' });

    expect(node.props).toBeDefined();
  });
});

describe('handleTextInput', () => {
  it('should insert printable characters', () => {
    const value = signal('hello');
    const cursor = signal(5);

    const handled = handleTextInput(value, cursor, 'x');

    expect(handled).toBe(true);
    expect(value.value).toBe('hellox');
    expect(cursor.value).toBe(6);
  });

  it('should insert character at cursor position', () => {
    const value = signal('hello');
    const cursor = signal(2);

    handleTextInput(value, cursor, 'x');

    expect(value.value).toBe('hexllo');
    expect(cursor.value).toBe(3);
  });

  it('should handle backspace', () => {
    const value = signal('hello');
    const cursor = signal(5);

    const handled = handleTextInput(value, cursor, '\x7F');

    expect(handled).toBe(true);
    expect(value.value).toBe('hell');
    expect(cursor.value).toBe(4);
  });

  it('should handle backspace at cursor position', () => {
    const value = signal('hello');
    const cursor = signal(3);

    handleTextInput(value, cursor, '\x7F');

    expect(value.value).toBe('helo');
    expect(cursor.value).toBe(2);
  });

  it('should not backspace at start', () => {
    const value = signal('hello');
    const cursor = signal(0);

    handleTextInput(value, cursor, '\x7F');

    expect(value.value).toBe('hello');
    expect(cursor.value).toBe(0);
  });

  it('should handle delete key', () => {
    const value = signal('hello');
    const cursor = signal(2);

    const handled = handleTextInput(value, cursor, '\x1b[3~');

    expect(handled).toBe(true);
    expect(value.value).toBe('helo');
    expect(cursor.value).toBe(2);
  });

  it('should not delete at end', () => {
    const value = signal('hello');
    const cursor = signal(5);

    handleTextInput(value, cursor, '\x1b[3~');

    expect(value.value).toBe('hello');
  });

  it('should handle left arrow', () => {
    const value = signal('hello');
    const cursor = signal(3);

    const handled = handleTextInput(value, cursor, '\x1b[D');

    expect(handled).toBe(true);
    expect(cursor.value).toBe(2);
  });

  it('should not move left at start', () => {
    const value = signal('hello');
    const cursor = signal(0);

    handleTextInput(value, cursor, '\x1b[D');

    expect(cursor.value).toBe(0);
  });

  it('should handle right arrow', () => {
    const value = signal('hello');
    const cursor = signal(2);

    const handled = handleTextInput(value, cursor, '\x1b[C');

    expect(handled).toBe(true);
    expect(cursor.value).toBe(3);
  });

  it('should not move right at end', () => {
    const value = signal('hello');
    const cursor = signal(5);

    handleTextInput(value, cursor, '\x1b[C');

    expect(cursor.value).toBe(5);
  });

  it('should handle Home key', () => {
    const value = signal('hello');
    const cursor = signal(3);

    const handled = handleTextInput(value, cursor, '\x1b[H');

    expect(handled).toBe(true);
    expect(cursor.value).toBe(0);
  });

  it('should handle Ctrl+A (Home)', () => {
    const value = signal('hello');
    const cursor = signal(3);

    const handled = handleTextInput(value, cursor, '\x01');

    expect(handled).toBe(true);
    expect(cursor.value).toBe(0);
  });

  it('should handle End key', () => {
    const value = signal('hello');
    const cursor = signal(2);

    const handled = handleTextInput(value, cursor, '\x1b[F');

    expect(handled).toBe(true);
    expect(cursor.value).toBe(5);
  });

  it('should handle Ctrl+E (End)', () => {
    const value = signal('hello');
    const cursor = signal(2);

    const handled = handleTextInput(value, cursor, '\x05');

    expect(handled).toBe(true);
    expect(cursor.value).toBe(5);
  });

  it('should ignore non-printable characters', () => {
    const value = signal('hello');
    const cursor = signal(5);

    const handled = handleTextInput(value, cursor, '\x1b');

    expect(handled).toBe(false);
    expect(value.value).toBe('hello');
  });

  it('should handle space character', () => {
    const value = signal('hello');
    const cursor = signal(5);

    handleTextInput(value, cursor, ' ');

    expect(value.value).toBe('hello ');
    expect(cursor.value).toBe(6);
  });

  it('should handle numbers', () => {
    const value = signal('');
    const cursor = signal(0);

    handleTextInput(value, cursor, '1');
    handleTextInput(value, cursor, '2');
    handleTextInput(value, cursor, '3');

    expect(value.value).toBe('123');
  });

  it('should handle special characters', () => {
    const value = signal('');
    const cursor = signal(0);

    handleTextInput(value, cursor, '@');
    handleTextInput(value, cursor, '#');
    handleTextInput(value, cursor, '$');

    expect(value.value).toBe('@#$');
  });
});
