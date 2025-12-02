import { Router } from '@zen/router';
import { Show, signal } from '@zen/web';
import { Footer } from './components/Footer.tsx';
import { Header } from './components/Header.tsx';
import { Examples } from './pages/Examples.tsx';
import { Migration } from './pages/Migration.tsx';
import { NewDocs } from './pages/NewDocs.tsx';
import { NewHome } from './pages/NewHome.tsx';
import { Playground } from './pages/Playground.tsx';
import { TestDescriptor } from './pages/TestDescriptor.tsx';

// Track if current page is full-screen (no header/footer)
const isFullScreen = signal(false);

// Update full-screen state based on pathname
const updateFullScreen = () => {
  isFullScreen.value = window.location.pathname === '/playground';
};

// Check path on load and navigation events
if (typeof window !== 'undefined') {
  updateFullScreen();
  window.addEventListener('popstate', updateFullScreen);
  // Also intercept link clicks for SPA navigation
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor?.href?.startsWith(window.location.origin)) {
      // Defer check until after navigation completes
      setTimeout(updateFullScreen, 0);
    }
  });
}

export function App() {
  return (
    <div class="app">
      <Show when={() => !isFullScreen.value}>
        <Header />
      </Show>
      <main>
        <Router
          routes={[
            {
              path: '/',
              component: () => {
                isFullScreen.value = false;
                return <NewHome />;
              },
            },
            {
              path: '/docs',
              component: () => {
                isFullScreen.value = false;
                return <NewDocs />;
              },
            },
            {
              path: '/examples',
              component: () => {
                isFullScreen.value = false;
                return <Examples />;
              },
            },
            {
              path: '/migration',
              component: () => {
                isFullScreen.value = false;
                return <Migration />;
              },
            },
            {
              path: '/playground',
              component: () => {
                isFullScreen.value = true;
                return <Playground />;
              },
            },
            {
              path: '/test-descriptor',
              component: () => {
                isFullScreen.value = false;
                return <TestDescriptor />;
              },
            },
          ]}
          fallback={() => (
            <div class="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
              <h1 class="text-8xl font-bold gradient-text mb-4">404</h1>
              <p class="text-2xl text-text-muted mb-8">Page not found</p>
              <a href="/" class="btn btn-primary text-lg px-8 py-4">
                Go home
              </a>
            </div>
          )}
        />
      </main>
      <Show when={() => !isFullScreen.value}>
        <Footer />
      </Show>
    </div>
  );
}
