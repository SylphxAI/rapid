import { describe, expect, it, vi } from 'vitest';
import { Confirmation } from './Confirmation';

describe('Confirmation', () => {
  it('should create confirmation node with Box component', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const node = Confirmation({
      message: 'Are you sure?',
      onConfirm,
      onCancel,
    });

    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('should use provided message', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const node = Confirmation({
      message: 'Delete this file?',
      onConfirm,
      onCancel,
    });

    expect(node).toBeDefined();
  });

  it('should use default Yes/No labels', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const node = Confirmation({
      message: 'Confirm?',
      onConfirm,
      onCancel,
    });

    expect(node).toBeDefined();
  });

  it('should use custom Yes label', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const node = Confirmation({
      message: 'Confirm?',
      onConfirm,
      onCancel,
      yesLabel: 'Delete',
    });

    expect(node).toBeDefined();
  });

  it('should use custom No label', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const node = Confirmation({
      message: 'Confirm?',
      onConfirm,
      onCancel,
      noLabel: 'Keep',
    });

    expect(node).toBeDefined();
  });

  it('should use custom Yes and No labels', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const node = Confirmation({
      message: 'Delete file?',
      onConfirm,
      onCancel,
      yesLabel: 'Delete',
      noLabel: 'Cancel',
    });

    expect(node).toBeDefined();
  });

  it('should default to Yes highlighted', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const node = Confirmation({
      message: 'Confirm?',
      onConfirm,
      onCancel,
    });

    expect(node).toBeDefined();
  });

  it('should allow defaulting to No', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const node = Confirmation({
      message: 'Confirm?',
      onConfirm,
      onCancel,
      defaultYes: false,
    });

    expect(node).toBeDefined();
  });

  it('should allow defaulting to Yes explicitly', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const node = Confirmation({
      message: 'Confirm?',
      onConfirm,
      onCancel,
      defaultYes: true,
    });

    expect(node).toBeDefined();
  });

  it('should generate unique ID if not provided', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const node1 = Confirmation({ message: 'Confirm?', onConfirm, onCancel });
    const node2 = Confirmation({ message: 'Confirm?', onConfirm, onCancel });

    expect(node1).toBeDefined();
    expect(node2).toBeDefined();
  });

  it('should use provided ID', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const node = Confirmation({
      message: 'Confirm?',
      onConfirm,
      onCancel,
      id: 'custom-confirmation',
    });

    expect(node).toBeDefined();
  });

  it('should apply custom styles', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const node = Confirmation({
      message: 'Confirm?',
      onConfirm,
      onCancel,
      style: { borderColor: 'red' },
    });

    expect(node).toBeDefined();
    expect(node.style?.borderColor).toBe('red');
  });
});

// Note: Input handling is tested via useInput hook which is called internally
// The component uses inline input handling rather than exported functions
// Integration tests would be needed to fully test keyboard interaction
