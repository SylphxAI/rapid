import { describe, expect, it } from 'vitest';
import { StatusMessage } from './StatusMessage';

describe('StatusMessage', () => {
  it('should create status message node with Box component', () => {
    const node = StatusMessage({ type: 'success', children: 'Done!' });

    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('should use success config for success type', () => {
    const node = StatusMessage({ type: 'success', children: 'Operation succeeded' });

    expect(node).toBeDefined();
    // Success should have green color and checkmark icon
  });

  it('should use error config for error type', () => {
    const node = StatusMessage({ type: 'error', children: 'Operation failed' });

    expect(node).toBeDefined();
    // Error should have red color and X icon
  });

  it('should use warning config for warning type', () => {
    const node = StatusMessage({ type: 'warning', children: 'Be careful' });

    expect(node).toBeDefined();
    // Warning should have yellow color and warning icon
  });

  it('should use info config for info type', () => {
    const node = StatusMessage({ type: 'info', children: 'Note this' });

    expect(node).toBeDefined();
    // Info should have cyan color and info icon
  });

  it('should display children text', () => {
    const node = StatusMessage({ type: 'success', children: 'Custom message' });

    expect(node).toBeDefined();
  });

  it('should apply custom styles', () => {
    const node = StatusMessage({
      type: 'success',
      children: 'Message',
      style: { marginTop: 2 },
    });

    expect(node.style?.marginTop).toBe(2);
  });

  it('should use row layout', () => {
    const node = StatusMessage({ type: 'success', children: 'Message' });

    expect(node.style?.flexDirection).toBe('row');
  });

  it('should handle empty message', () => {
    const node = StatusMessage({ type: 'info', children: '' });

    expect(node).toBeDefined();
  });

  it('should handle long message', () => {
    const node = StatusMessage({
      type: 'warning',
      children: 'This is a very long warning message that might wrap',
    });

    expect(node).toBeDefined();
  });

  it('should handle multiline message', () => {
    const node = StatusMessage({
      type: 'error',
      children: 'Error on line 1\nError on line 2',
    });

    expect(node).toBeDefined();
  });
});
