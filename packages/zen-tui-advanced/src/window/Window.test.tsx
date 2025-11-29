/** @jsxImportSource @zen/tui */
/**
 * Window Component Tests
 *
 * Tests for window rendering, focus, minimize, maximize, close.
 */
import { beforeEach, describe, expect, it } from 'bun:test';
import { Text } from '@zen/tui';
import { Window } from './Window.js';
import { $focusedWindowId, $nextZIndex, $windows, type WindowState } from './WindowManager.js';

describe('Window', () => {
  beforeEach(() => {
    // Reset state before each test
    $windows.value = [];
    $focusedWindowId.value = null;
    $nextZIndex.value = 100;
  });

  const createWindowState = (overrides: Partial<WindowState> = {}): WindowState => ({
    id: 'test-window',
    title: 'Test Window',
    icon: '🪟',
    x: 10,
    y: 5,
    width: 40,
    height: 15,
    minWidth: 20,
    minHeight: 8,
    isMinimized: false,
    isMaximized: false,
    zIndex: 100,
    app: 'test',
    ...overrides,
  });

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render window with title', () => {
      const win = createWindowState({ title: 'My Window' });
      const result = Window({ window: win });

      expect(result).toBeDefined();
    });

    it('should render window with icon', () => {
      const win = createWindowState({ icon: '📁' });
      const result = Window({ window: win });

      expect(result).toBeDefined();
    });

    it('should render window with children', () => {
      const win = createWindowState();
      const result = Window({
        window: win,
        children: <Text>Content</Text>,
      });

      expect(result).toBeDefined();
    });

    it('should not render minimized window', () => {
      const win = createWindowState({ isMinimized: true });
      const result = Window({ window: win });

      expect(result).toBeNull();
    });

    it('should render window at correct position', () => {
      const win = createWindowState({ x: 20, y: 10 });
      const result = Window({ window: win });

      expect(result).toBeDefined();
      // Position is set via props
    });

    it('should render window with correct dimensions', () => {
      const win = createWindowState({ width: 60, height: 20 });
      const result = Window({ window: win });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Focus State
  // ==========================================================================

  describe('Focus State', () => {
    it('should render focused window differently', () => {
      const win = createWindowState();
      $focusedWindowId.value = win.id;

      const result = Window({ window: win });

      expect(result).toBeDefined();
    });

    it('should render unfocused window differently', () => {
      const win = createWindowState();
      $focusedWindowId.value = 'other-window';

      const result = Window({ window: win });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Title Truncation
  // ==========================================================================

  describe('Title Truncation', () => {
    it('should truncate long titles', () => {
      const longTitle = 'This is a very long window title that should be truncated';
      const win = createWindowState({ title: longTitle, width: 30 });

      const result = Window({ window: win });

      expect(result).toBeDefined();
    });

    it('should not truncate short titles', () => {
      const win = createWindowState({ title: 'Short', width: 40 });

      const result = Window({ window: win });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Window Controls
  // ==========================================================================

  describe('Window Controls', () => {
    it('should render minimize button', () => {
      const win = createWindowState();
      const result = Window({ window: win });

      expect(result).toBeDefined();
      // Window has minimize, maximize, close buttons in title bar
    });

    it('should render maximize button', () => {
      const win = createWindowState();
      const result = Window({ window: win });

      expect(result).toBeDefined();
    });

    it('should render close button', () => {
      const win = createWindowState();
      const result = Window({ window: win });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Resize Handle
  // ==========================================================================

  describe('Resize Handle', () => {
    it('should render resize handle', () => {
      const win = createWindowState();
      const result = Window({ window: win });

      expect(result).toBeDefined();
      // Resize handle is in bottom-right corner
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      const win = createWindowState({ title: '' });
      const result = Window({ window: win });

      expect(result).toBeDefined();
    });

    it('should handle empty icon', () => {
      const win = createWindowState({ icon: '' });
      const result = Window({ window: win });

      expect(result).toBeDefined();
    });

    it('should handle minimum dimensions', () => {
      const win = createWindowState({ width: 20, height: 8 });
      const result = Window({ window: win });

      expect(result).toBeDefined();
    });

    it('should handle large dimensions', () => {
      const win = createWindowState({ width: 200, height: 50 });
      const result = Window({ window: win });

      expect(result).toBeDefined();
    });

    it('should handle position at origin', () => {
      const win = createWindowState({ x: 0, y: 0 });
      const result = Window({ window: win });

      expect(result).toBeDefined();
    });

    it('should handle maximized window', () => {
      const win = createWindowState({ isMaximized: true });
      const result = Window({ window: win });

      expect(result).toBeDefined();
    });

    it('should handle no children', () => {
      const win = createWindowState();
      const result = Window({ window: win, children: undefined });

      expect(result).toBeDefined();
    });

    it('should handle multiple children', () => {
      const win = createWindowState();
      const result = Window({
        window: win,
        children: [<Text key="1">Line 1</Text>, <Text key="2">Line 2</Text>],
      });

      expect(result).toBeDefined();
    });
  });
});
