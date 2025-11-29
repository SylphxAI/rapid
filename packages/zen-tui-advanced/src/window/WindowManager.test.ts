/**
 * WindowManager Tests
 *
 * Tests for window state management: open, close, focus, minimize, maximize, move, resize, drag.
 */
import { beforeEach, describe, expect, it } from 'bun:test';
import {
  $dragState,
  $focusedWindow,
  $focusedWindowId,
  $nextZIndex,
  $sortedWindows,
  $taskbarItems,
  $windows,
  closeWindow,
  endDrag,
  focusWindow,
  minimizeWindow,
  moveWindow,
  openWindow,
  resizeWindow,
  startDrag,
  toggleMaximize,
  updateDrag,
} from './WindowManager.js';

describe('WindowManager', () => {
  beforeEach(() => {
    // Reset state before each test
    $windows.value = [];
    $focusedWindowId.value = null;
    $nextZIndex.value = 100;
    $dragState.value = null;
  });

  // ==========================================================================
  // Open Window
  // ==========================================================================

  describe('openWindow', () => {
    it('should create a new window with unique id', () => {
      const id = openWindow('terminal');

      expect(id).toMatch(/^window-\d+-[a-z0-9]+$/);
      expect($windows.value).toHaveLength(1);
    });

    it('should set default properties for known apps', () => {
      openWindow('terminal');
      const win = $windows.value[0];

      expect(win.title).toBe('Terminal');
      expect(win.icon).toBe('🖥️');
      expect(win.width).toBe(60);
      expect(win.height).toBe(15);
    });

    it('should set default properties for files app', () => {
      openWindow('files');
      const win = $windows.value[0];

      expect(win.title).toBe('File Manager');
      expect(win.icon).toBe('📁');
    });

    it('should set default properties for calculator app', () => {
      openWindow('calculator');
      const win = $windows.value[0];

      expect(win.title).toBe('Calculator');
      expect(win.icon).toBe('🧮');
    });

    it('should set default properties for unknown apps', () => {
      openWindow('custom-app');
      const win = $windows.value[0];

      expect(win.title).toBe('custom-app');
      expect(win.icon).toBe('📦');
    });

    it('should auto-focus new window', () => {
      const id = openWindow('terminal');

      expect($focusedWindowId.value).toBe(id);
    });

    it('should increment z-index for each window', () => {
      openWindow('terminal');
      openWindow('files');

      expect($windows.value[0].zIndex).toBe(100);
      expect($windows.value[1].zIndex).toBe(101);
    });

    it('should set initial window state', () => {
      openWindow('terminal');
      const win = $windows.value[0];

      expect(win.isMinimized).toBe(false);
      expect(win.isMaximized).toBe(false);
      expect(win.minWidth).toBe(20);
      expect(win.minHeight).toBe(8);
    });

    it('should allow custom config override', () => {
      openWindow('terminal', { title: 'Custom Terminal', width: 100 });
      const win = $windows.value[0];

      expect(win.title).toBe('Custom Terminal');
      expect(win.width).toBe(100);
    });

    it('should return window id', () => {
      const id = openWindow('terminal');

      expect(typeof id).toBe('string');
      expect($windows.value[0].id).toBe(id);
    });
  });

  // ==========================================================================
  // Close Window
  // ==========================================================================

  describe('closeWindow', () => {
    it('should remove window from list', () => {
      const id = openWindow('terminal');
      expect($windows.value).toHaveLength(1);

      closeWindow(id);
      expect($windows.value).toHaveLength(0);
    });

    it('should clear focus if closing focused window', () => {
      const id = openWindow('terminal');
      expect($focusedWindowId.value).toBe(id);

      closeWindow(id);
      expect($focusedWindowId.value).toBeNull();
    });

    it('should focus next top window after closing', () => {
      const id1 = openWindow('terminal');
      const id2 = openWindow('files');

      closeWindow(id2);
      expect($focusedWindowId.value).toBe(id1);
    });

    it('should focus highest z-index window after closing', () => {
      const id1 = openWindow('terminal');
      openWindow('files');
      const id3 = openWindow('calculator');

      closeWindow(id3);
      // id2 (files) has highest z-index among remaining
      expect($focusedWindowId.value).not.toBe(id1);
    });

    it('should not affect other windows', () => {
      openWindow('terminal');
      const id2 = openWindow('files');
      openWindow('calculator');

      closeWindow(id2);

      expect($windows.value).toHaveLength(2);
      expect($windows.value.find((w) => w.id === id2)).toBeUndefined();
    });

    it('should handle closing non-existent window', () => {
      openWindow('terminal');
      closeWindow('non-existent-id');

      expect($windows.value).toHaveLength(1);
    });

    it('should skip minimized windows when focusing next', () => {
      const id1 = openWindow('terminal');
      const id2 = openWindow('files');
      const id3 = openWindow('calculator');

      minimizeWindow(id2);
      closeWindow(id3);

      expect($focusedWindowId.value).toBe(id1);
    });
  });

  // ==========================================================================
  // Focus Window
  // ==========================================================================

  describe('focusWindow', () => {
    it('should update focused window id', () => {
      const id1 = openWindow('terminal');
      const id2 = openWindow('files');

      focusWindow(id1);
      expect($focusedWindowId.value).toBe(id1);
    });

    it('should bring window to front (increase z-index)', () => {
      const id1 = openWindow('terminal');
      openWindow('files');

      const oldZIndex = $windows.value.find((w) => w.id === id1)?.zIndex;
      focusWindow(id1);
      const newZIndex = $windows.value.find((w) => w.id === id1)?.zIndex;

      expect(newZIndex).toBeGreaterThan(oldZIndex!);
    });

    it('should restore minimized window when focusing', () => {
      const id = openWindow('terminal');
      minimizeWindow(id);

      expect($windows.value[0].isMinimized).toBe(true);

      focusWindow(id);
      expect($windows.value[0].isMinimized).toBe(false);
    });

    it('should not crash when focusing non-existent window', () => {
      openWindow('terminal');
      focusWindow('non-existent-id');
      // Should not throw
    });
  });

  // ==========================================================================
  // Minimize Window
  // ==========================================================================

  describe('minimizeWindow', () => {
    it('should set isMinimized to true', () => {
      const id = openWindow('terminal');

      minimizeWindow(id);
      expect($windows.value[0].isMinimized).toBe(true);
    });

    it('should unfocus minimized window', () => {
      const id = openWindow('terminal');

      minimizeWindow(id);
      expect($focusedWindowId.value).toBeNull();
    });

    it('should focus next visible window after minimizing', () => {
      const id1 = openWindow('terminal');
      const id2 = openWindow('files');

      minimizeWindow(id2);
      expect($focusedWindowId.value).toBe(id1);
    });

    it('should focus highest z-index visible window', () => {
      openWindow('terminal');
      const id2 = openWindow('files');
      const id3 = openWindow('calculator');

      focusWindow(id2); // id2 now has highest z-index
      minimizeWindow(id2);

      expect($focusedWindowId.value).toBe(id3);
    });

    it('should not affect other windows', () => {
      const id1 = openWindow('terminal');
      const id2 = openWindow('files');

      minimizeWindow(id1);

      expect($windows.value.find((w) => w.id === id2)?.isMinimized).toBe(false);
    });
  });

  // ==========================================================================
  // Toggle Maximize
  // ==========================================================================

  describe('toggleMaximize', () => {
    it('should maximize window', () => {
      const id = openWindow('terminal');

      toggleMaximize(id);
      expect($windows.value[0].isMaximized).toBe(true);
    });

    it('should set position to top-left when maximized', () => {
      const id = openWindow('terminal');

      toggleMaximize(id);
      expect($windows.value[0].x).toBe(0);
      expect($windows.value[0].y).toBe(1);
    });

    it('should restore window when toggling again', () => {
      const id = openWindow('terminal');

      toggleMaximize(id); // Maximize
      toggleMaximize(id); // Restore

      expect($windows.value[0].isMaximized).toBe(false);
    });

    it('should restore to default position', () => {
      const id = openWindow('terminal');

      toggleMaximize(id);
      toggleMaximize(id);

      expect($windows.value[0].x).toBe(10);
      expect($windows.value[0].y).toBe(2);
    });

    it('should not affect other windows', () => {
      openWindow('terminal');
      const id2 = openWindow('files');

      toggleMaximize(id2);

      expect($windows.value[0].isMaximized).toBe(false);
    });
  });

  // ==========================================================================
  // Move Window
  // ==========================================================================

  describe('moveWindow', () => {
    it('should update window position', () => {
      const id = openWindow('terminal');

      moveWindow(id, 50, 25);

      expect($windows.value[0].x).toBe(50);
      expect($windows.value[0].y).toBe(25);
    });

    it('should not allow negative x', () => {
      const id = openWindow('terminal');

      moveWindow(id, -10, 5);

      expect($windows.value[0].x).toBe(0);
    });

    it('should not allow y less than 1 (for taskbar)', () => {
      const id = openWindow('terminal');

      moveWindow(id, 5, 0);

      expect($windows.value[0].y).toBe(1);
    });

    it('should clear isMaximized flag', () => {
      const id = openWindow('terminal');
      toggleMaximize(id);

      moveWindow(id, 10, 10);

      expect($windows.value[0].isMaximized).toBe(false);
    });

    it('should not affect other windows', () => {
      const id1 = openWindow('terminal');
      openWindow('files');

      const originalX = $windows.value[1].x;
      moveWindow(id1, 100, 100);

      expect($windows.value[1].x).toBe(originalX);
    });
  });

  // ==========================================================================
  // Resize Window
  // ==========================================================================

  describe('resizeWindow', () => {
    it('should update window dimensions', () => {
      const id = openWindow('terminal');

      resizeWindow(id, 80, 30);

      expect($windows.value[0].width).toBe(80);
      expect($windows.value[0].height).toBe(30);
    });

    it('should enforce minimum width', () => {
      const id = openWindow('terminal');

      resizeWindow(id, 5, 30);

      expect($windows.value[0].width).toBe(20); // minWidth
    });

    it('should enforce minimum height', () => {
      const id = openWindow('terminal');

      resizeWindow(id, 50, 2);

      expect($windows.value[0].height).toBe(8); // minHeight
    });

    it('should clear isMaximized flag', () => {
      const id = openWindow('terminal');
      toggleMaximize(id);

      resizeWindow(id, 50, 20);

      expect($windows.value[0].isMaximized).toBe(false);
    });

    it('should not affect other windows', () => {
      const id1 = openWindow('terminal');
      openWindow('files');

      const originalWidth = $windows.value[1].width;
      resizeWindow(id1, 200, 100);

      expect($windows.value[1].width).toBe(originalWidth);
    });
  });

  // ==========================================================================
  // Drag Operations
  // ==========================================================================

  describe('Drag Operations', () => {
    describe('startDrag', () => {
      it('should set drag state for move', () => {
        const id = openWindow('terminal');

        startDrag(id, 50, 50, 'move');

        expect($dragState.value).not.toBeNull();
        expect($dragState.value?.windowId).toBe(id);
        expect($dragState.value?.mode).toBe('move');
      });

      it('should set drag state for resize', () => {
        const id = openWindow('terminal');

        startDrag(id, 50, 50, 'resize');

        expect($dragState.value?.mode).toBe('resize');
      });

      it('should store start positions', () => {
        const id = openWindow('terminal');
        const win = $windows.value[0];

        startDrag(id, 100, 100, 'move');

        expect($dragState.value?.startX).toBe(100);
        expect($dragState.value?.startY).toBe(100);
        expect($dragState.value?.startWindowX).toBe(win.x);
        expect($dragState.value?.startWindowY).toBe(win.y);
      });

      it('should focus the window being dragged', () => {
        const id1 = openWindow('terminal');
        openWindow('files');

        startDrag(id1, 50, 50, 'move');

        expect($focusedWindowId.value).toBe(id1);
      });

      it('should not crash for non-existent window', () => {
        startDrag('non-existent', 50, 50, 'move');
        expect($dragState.value).toBeNull();
      });
    });

    describe('updateDrag', () => {
      it('should move window during move drag', () => {
        const id = openWindow('terminal');
        const originalX = $windows.value[0].x;
        const originalY = $windows.value[0].y;

        startDrag(id, 50, 50, 'move');
        updateDrag(60, 55); // moved 10 right, 5 down

        expect($windows.value[0].x).toBe(originalX + 10);
        expect($windows.value[0].y).toBe(originalY + 5);
      });

      it('should resize window during resize drag', () => {
        const id = openWindow('terminal');
        const originalWidth = $windows.value[0].width;
        const originalHeight = $windows.value[0].height;

        startDrag(id, 50, 50, 'resize');
        updateDrag(60, 55);

        expect($windows.value[0].width).toBe(originalWidth + 10);
        expect($windows.value[0].height).toBe(originalHeight + 5);
      });

      it('should do nothing when no drag active', () => {
        const id = openWindow('terminal');
        const originalX = $windows.value[0].x;

        updateDrag(100, 100);

        expect($windows.value[0].x).toBe(originalX);
      });

      it('should handle negative movement (clamped to min)', () => {
        const id = openWindow('terminal');

        // Set a position where we have room to move left
        moveWindow(id, 50, 20);

        startDrag(id, 100, 100, 'move');
        updateDrag(80, 90); // moved 20 left, 10 up

        expect($windows.value[0].x).toBe(30); // 50 - 20
        expect($windows.value[0].y).toBe(10); // 20 - 10
      });
    });

    describe('endDrag', () => {
      it('should clear drag state', () => {
        const id = openWindow('terminal');
        startDrag(id, 50, 50, 'move');

        expect($dragState.value).not.toBeNull();

        endDrag();
        expect($dragState.value).toBeNull();
      });

      it('should be safe to call multiple times', () => {
        endDrag();
        endDrag();
        endDrag();
        // Should not throw
      });
    });
  });

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  describe('Computed Values', () => {
    describe('$sortedWindows', () => {
      it('should return windows sorted by z-index', () => {
        const id1 = openWindow('terminal');
        const id2 = openWindow('files');
        const id3 = openWindow('calculator');

        focusWindow(id1); // id1 now has highest z-index

        const sorted = $sortedWindows.value;
        expect(sorted[sorted.length - 1].id).toBe(id1);
      });

      it('should return empty array when no windows', () => {
        expect($sortedWindows.value).toEqual([]);
      });
    });

    describe('$focusedWindow', () => {
      it('should return focused window', () => {
        const id = openWindow('terminal');

        expect($focusedWindow.value?.id).toBe(id);
      });

      it('should return null when no focused window', () => {
        expect($focusedWindow.value).toBeNull();
      });

      it('should update when focus changes', () => {
        const id1 = openWindow('terminal');
        openWindow('files');

        focusWindow(id1);
        expect($focusedWindow.value?.id).toBe(id1);
      });
    });

    describe('$taskbarItems', () => {
      it('should return all windows', () => {
        openWindow('terminal');
        openWindow('files');

        expect($taskbarItems.value).toHaveLength(2);
      });

      it('should include minimized status', () => {
        const id = openWindow('terminal');
        minimizeWindow(id);

        expect($taskbarItems.value[0].isMinimized).toBe(true);
      });

      it('should include focused status', () => {
        const id = openWindow('terminal');

        expect($taskbarItems.value[0].isFocused).toBe(true);
      });

      it('should include title and icon', () => {
        openWindow('terminal');

        expect($taskbarItems.value[0].title).toBe('Terminal');
        expect($taskbarItems.value[0].icon).toBe('🖥️');
      });
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle rapid window operations', () => {
      const ids: string[] = [];
      for (let i = 0; i < 10; i++) {
        ids.push(openWindow('terminal'));
      }

      expect($windows.value).toHaveLength(10);

      // Close half
      for (let i = 0; i < 5; i++) {
        closeWindow(ids[i]);
      }

      expect($windows.value).toHaveLength(5);
    });

    it('should handle focus cycling', () => {
      const id1 = openWindow('terminal');
      const id2 = openWindow('files');
      const id3 = openWindow('calculator');

      focusWindow(id1);
      focusWindow(id2);
      focusWindow(id3);
      focusWindow(id1);

      expect($focusedWindowId.value).toBe(id1);
    });

    it('should handle all windows minimized', () => {
      const id1 = openWindow('terminal');
      const id2 = openWindow('files');

      minimizeWindow(id1);
      minimizeWindow(id2);

      expect($focusedWindowId.value).toBeNull();
    });

    it('should handle maximize-minimize-restore sequence', () => {
      const id = openWindow('terminal');

      toggleMaximize(id);
      expect($windows.value[0].isMaximized).toBe(true);

      minimizeWindow(id);
      expect($windows.value[0].isMinimized).toBe(true);

      focusWindow(id);
      expect($windows.value[0].isMinimized).toBe(false);
      // isMaximized should still be true from before
    });

    it('should handle move during maximize', () => {
      const id = openWindow('terminal');
      toggleMaximize(id);

      moveWindow(id, 50, 50);

      // Moving should clear isMaximized
      expect($windows.value[0].isMaximized).toBe(false);
    });

    it('should handle resize during maximize', () => {
      const id = openWindow('terminal');
      toggleMaximize(id);

      resizeWindow(id, 50, 50);

      // Resizing should clear isMaximized
      expect($windows.value[0].isMaximized).toBe(false);
    });
  });
});
