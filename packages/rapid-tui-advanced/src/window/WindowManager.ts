/**
 * Window Manager - State management for windows
 */

import { batch, computed, signal } from '@rapid/tui';

export interface WindowState {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  app: string; // App component name
}

export interface DesktopIcon {
  id: string;
  name: string;
  icon: string;
  app: string;
  x: number;
  y: number;
}

// Global window state
export const $windows = signal<WindowState[]>([]);
export const $focusedWindowId = signal<string | null>(null);
export const $nextZIndex = signal(100);
export const $dragState = signal<{
  windowId: string;
  startX: number;
  startY: number;
  startWindowX: number;
  startWindowY: number;
  mode: 'move' | 'resize';
} | null>(null);

// Desktop icons
export const $desktopIcons = signal<DesktopIcon[]>([
  { id: 'terminal', name: 'Terminal', icon: '🖥️', app: 'terminal', x: 2, y: 2 },
  { id: 'files', name: 'Files', icon: '📁', app: 'files', x: 2, y: 5 },
  { id: 'calculator', name: 'Calculator', icon: '🧮', app: 'calculator', x: 2, y: 8 },
  { id: 'settings', name: 'Settings', icon: '⚙️', app: 'settings', x: 2, y: 11 },
  { id: 'about', name: 'About', icon: 'ℹ️', app: 'about', x: 2, y: 14 },
  { id: 'notepad', name: 'Notepad', icon: '📝', app: 'notepad', x: 2, y: 17 },
]);

// Computed: sorted windows by z-index
export const $sortedWindows = computed(() => {
  return [...$windows.value].sort((a, b) => a.zIndex - b.zIndex);
});

// Computed: focused window
export const $focusedWindow = computed(() => {
  const id = $focusedWindowId.value;
  return $windows.value.find((w) => w.id === id) || null;
});

// Computed: taskbar items (non-minimized windows)
export const $taskbarItems = computed(() => {
  return $windows.value.map((w) => ({
    id: w.id,
    title: w.title,
    icon: w.icon,
    isMinimized: w.isMinimized,
    isFocused: w.id === $focusedWindowId.value,
  }));
});

// Window manager actions
export function openWindow(app: string, config?: Partial<WindowState>) {
  const id = `window-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const zIndex = $nextZIndex.value;
  $nextZIndex.value++;

  const defaultConfigs: Record<string, Partial<WindowState>> = {
    terminal: { title: 'Terminal', icon: '🖥️', width: 60, height: 15 },
    files: { title: 'File Manager', icon: '📁', width: 50, height: 18 },
    calculator: { title: 'Calculator', icon: '🧮', width: 25, height: 14 },
    settings: { title: 'Settings', icon: '⚙️', width: 45, height: 16 },
    about: { title: 'About ZenOS', icon: 'ℹ️', width: 40, height: 12 },
    notepad: { title: 'Notepad', icon: '📝', width: 50, height: 16 },
  };

  const defaults = defaultConfigs[app] || { title: app, icon: '📦', width: 40, height: 12 };

  // Calculate center position with some randomness
  const offsetX = Math.floor(Math.random() * 10) - 5;
  const offsetY = Math.floor(Math.random() * 5) - 2;

  const newWindow: WindowState = {
    id,
    title: defaults.title || app,
    icon: defaults.icon || '📦',
    x: 15 + offsetX + ($windows.value.length % 5) * 3,
    y: 3 + offsetY + ($windows.value.length % 3) * 2,
    width: defaults.width || 40,
    height: defaults.height || 12,
    minWidth: 20,
    minHeight: 8,
    isMinimized: false,
    isMaximized: false,
    zIndex,
    app,
    ...config,
  };

  batch(() => {
    $windows.value = [...$windows.value, newWindow];
    $focusedWindowId.value = id;
  });

  return id;
}

export function closeWindow(id: string) {
  batch(() => {
    $windows.value = $windows.value.filter((w) => w.id !== id);
    if ($focusedWindowId.value === id) {
      // Focus the next top window
      const remaining = $windows.value.filter((w) => !w.isMinimized);
      if (remaining.length > 0) {
        const topWindow = remaining.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
        $focusedWindowId.value = topWindow.id;
      } else {
        $focusedWindowId.value = null;
      }
    }
  });
}

export function focusWindow(id: string) {
  const window = $windows.value.find((w) => w.id === id);
  if (!window) return;

  batch(() => {
    // Bring to front
    const zIndex = $nextZIndex.value;
    $nextZIndex.value++;

    $windows.value = $windows.value.map((w) =>
      w.id === id ? { ...w, zIndex, isMinimized: false } : w,
    );
    $focusedWindowId.value = id;
  });
}

export function minimizeWindow(id: string) {
  batch(() => {
    $windows.value = $windows.value.map((w) => (w.id === id ? { ...w, isMinimized: true } : w));

    if ($focusedWindowId.value === id) {
      // Focus next window
      const visible = $windows.value.filter((w) => !w.isMinimized && w.id !== id);
      if (visible.length > 0) {
        const topWindow = visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
        $focusedWindowId.value = topWindow.id;
      } else {
        $focusedWindowId.value = null;
      }
    }
  });
}

export function toggleMaximize(id: string) {
  $windows.value = $windows.value.map((w) => {
    if (w.id !== id) return w;

    if (w.isMaximized) {
      // Restore
      return {
        ...w,
        isMaximized: false,
        x: 10,
        y: 2,
        width: 50,
        height: 15,
      };
    }
    // Maximize (leave space for taskbar)
    return {
      ...w,
      isMaximized: true,
      x: 0,
      y: 1,
      width: process.stdout.columns || 80,
      height: (process.stdout.rows || 24) - 3,
    };
  });
}

export function moveWindow(id: string, x: number, y: number) {
  $windows.value = $windows.value.map((w) =>
    w.id === id ? { ...w, x: Math.max(0, x), y: Math.max(1, y), isMaximized: false } : w,
  );
}

export function resizeWindow(id: string, width: number, height: number) {
  $windows.value = $windows.value.map((w) => {
    if (w.id !== id) return w;
    return {
      ...w,
      width: Math.max(w.minWidth, width),
      height: Math.max(w.minHeight, height),
      isMaximized: false,
    };
  });
}

export function startDrag(
  windowId: string,
  mouseX: number,
  mouseY: number,
  mode: 'move' | 'resize',
) {
  const window = $windows.value.find((w) => w.id === windowId);
  if (!window) return;

  focusWindow(windowId);

  $dragState.value = {
    windowId,
    startX: mouseX,
    startY: mouseY,
    startWindowX: window.x,
    startWindowY: window.y,
    mode,
  };
}

export function updateDrag(mouseX: number, mouseY: number) {
  const drag = $dragState.value;
  if (!drag) return;

  const window = $windows.value.find((w) => w.id === drag.windowId);
  if (!window) return;

  const deltaX = mouseX - drag.startX;
  const deltaY = mouseY - drag.startY;

  if (drag.mode === 'move') {
    moveWindow(drag.windowId, drag.startWindowX + deltaX, drag.startWindowY + deltaY);
  } else if (drag.mode === 'resize') {
    resizeWindow(drag.windowId, window.width + deltaX, window.height + deltaY);
  }
}

export function endDrag() {
  $dragState.value = null;
}
