import './index.css';
import '@iconify/iconify';
import { render } from '@rapid/web';
import { App } from './App';
import { initTheme } from './theme';

// Initialize theme system once at app startup
initTheme();

const root = document.getElementById('app');
if (root) {
  render(() => <App />, root);
}
