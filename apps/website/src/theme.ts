import { effect, signal } from '@zen/signal';

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

// Initialize theme system - call this from a component
export function initTheme() {
  // Apply theme to document
  effect(() => {
    const currentTheme = theme.value;

    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', currentTheme);
  });

  // Listen to system preference changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        theme.value = e.matches ? 'dark' : 'light';
      }
    });
  }
}
