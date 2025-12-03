import { describe, expect, it, vi } from 'vitest';
import { signal } from '../index';
import { Radio, type RadioOption, handleRadioInput } from './Radio';

const options: RadioOption[] = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
  { label: 'Option 3', value: 'opt3' },
];

describe('Radio', () => {
  it('should create radio node with Box component', () => {
    const node = Radio({ options });

    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('should accept value as string', () => {
    const node = Radio({ options, value: 'opt2' });

    expect(node).toBeDefined();
  });

  it('should accept value as signal', () => {
    const value = signal<string | undefined>('opt1');
    const node = Radio({ options, value });

    expect(node).toBeDefined();
  });

  it('should accept undefined value', () => {
    const node = Radio({ options, value: undefined });

    expect(node).toBeDefined();
  });

  it('should generate unique ID if not provided', () => {
    const node1 = Radio({ options });
    const node2 = Radio({ options });

    expect(node1).toBeDefined();
    expect(node2).toBeDefined();
  });

  it('should use provided ID', () => {
    const node = Radio({ options, id: 'custom-radio' });

    expect(node).toBeDefined();
  });

  it('should accept highlightedIndex signal', () => {
    const highlightedIndex = signal(1);
    const node = Radio({ options, highlightedIndex });

    expect(node).toBeDefined();
  });

  it('should apply custom styles', () => {
    const node = Radio({ options, style: { borderColor: 'green' } });

    expect(node).toBeDefined();
    expect(node.style?.borderColor).toBe('green');
  });
});

describe('handleRadioInput', () => {
  it('should move highlight up with up arrow', () => {
    const highlightedIndex = signal(2);
    const value = signal<string | undefined>(undefined);
    const onChange = vi.fn();

    const handled = handleRadioInput('\x1b[A', highlightedIndex, value, options, onChange);

    expect(handled).toBe(true);
    expect(highlightedIndex.value).toBe(1);
  });

  it('should move highlight up with k key', () => {
    const highlightedIndex = signal(2);
    const value = signal<string | undefined>(undefined);

    handleRadioInput('k', highlightedIndex, value, options);

    expect(highlightedIndex.value).toBe(1);
  });

  it('should not move highlight before first option', () => {
    const highlightedIndex = signal(0);
    const value = signal<string | undefined>(undefined);

    handleRadioInput('\x1b[A', highlightedIndex, value, options);

    expect(highlightedIndex.value).toBe(0);
  });

  it('should move highlight down with down arrow', () => {
    const highlightedIndex = signal(0);
    const value = signal<string | undefined>(undefined);
    const onChange = vi.fn();

    const handled = handleRadioInput('\x1b[B', highlightedIndex, value, options, onChange);

    expect(handled).toBe(true);
    expect(highlightedIndex.value).toBe(1);
  });

  it('should move highlight down with j key', () => {
    const highlightedIndex = signal(0);
    const value = signal<string | undefined>(undefined);

    handleRadioInput('j', highlightedIndex, value, options);

    expect(highlightedIndex.value).toBe(1);
  });

  it('should not move highlight past last option', () => {
    const highlightedIndex = signal(2);
    const value = signal<string | undefined>(undefined);

    handleRadioInput('\x1b[B', highlightedIndex, value, options);

    expect(highlightedIndex.value).toBe(2);
  });

  it('should select option with Enter key', () => {
    const highlightedIndex = signal(1);
    const value = signal<string | undefined>(undefined);
    const onChange = vi.fn();

    const handled = handleRadioInput('\r', highlightedIndex, value, options, onChange);

    expect(handled).toBe(true);
    expect(value.value).toBe('opt2');
    expect(onChange).toHaveBeenCalledWith('opt2');
  });

  it('should select option with Space key', () => {
    const highlightedIndex = signal(0);
    const value = signal<string | undefined>(undefined);
    const onChange = vi.fn();

    const handled = handleRadioInput(' ', highlightedIndex, value, options, onChange);

    expect(handled).toBe(true);
    expect(value.value).toBe('opt1');
    expect(onChange).toHaveBeenCalledWith('opt1');
  });

  it('should change selection to different option', () => {
    const highlightedIndex = signal(2);
    const value = signal<string | undefined>('opt1');
    const onChange = vi.fn();

    handleRadioInput('\r', highlightedIndex, value, options, onChange);

    expect(value.value).toBe('opt3');
    expect(onChange).toHaveBeenCalledWith('opt3');
  });

  it('should work without onChange callback', () => {
    const highlightedIndex = signal(0);
    const value = signal<string | undefined>(undefined);

    expect(() => handleRadioInput('\r', highlightedIndex, value, options)).not.toThrow();
    expect(value.value).toBe('opt1');
  });

  it('should ignore unknown keys', () => {
    const highlightedIndex = signal(1);
    const value = signal<string | undefined>(undefined);
    const onChange = vi.fn();

    const handled = handleRadioInput('x', highlightedIndex, value, options, onChange);

    expect(handled).toBe(false);
    expect(highlightedIndex.value).toBe(1);
    expect(value.value).toBeUndefined();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should handle numeric values', () => {
    const numericOptions: RadioOption<number> = [
      { label: 'One', value: 1 },
      { label: 'Two', value: 2 },
      { label: 'Three', value: 3 },
    ];
    const highlightedIndex = signal(1);
    const value = signal<number | undefined>(undefined);
    const onChange = vi.fn();

    handleRadioInput('\r', highlightedIndex, value, numericOptions, onChange);

    expect(value.value).toBe(2);
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
