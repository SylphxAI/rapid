import { effect, signal } from '@rapid/signal';
import { onCleanup } from '@rapid/signal';

export type Theme = 'light' | 'dark';

// Get initial theme from localStorage or system preference
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';

  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored) return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const theme = signal<Theme>(getInitialTheme());

export function toggleTheme() {
  const _oldTheme = theme.value;
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
}

// Guard to prevent duplicate initialization
let initialized = false;

// Initialize theme system - call this once at app startup
export function initTheme() {
  // Prevent duplicate initialization
  if (initialized) return;
  initialized = true;

  // Apply theme to document
  const dispose = effect(() => {
    const currentTheme = theme.value;

    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', currentTheme);

    return undefined;
  });

  // Listen to system preference changes
  let mediaQueryHandler: ((e: MediaQueryListEvent) => void) | undefined;
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQueryHandler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        theme.value = e.matches ? 'dark' : 'light';
      }
    };
    mediaQuery.addEventListener('change', mediaQueryHandler);
  }

  // Cleanup when component unmounts
  onCleanup(() => {
    if (dispose) {
      dispose();
    }
    if (mediaQueryHandler && typeof window !== 'undefined') {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .removeEventListener('change', mediaQueryHandler);
    }
  });
}
