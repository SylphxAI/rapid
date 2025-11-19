import { Link } from '@zen/router-zen';
import { Icon } from './Icon.tsx';

export function Header() {
  return (
    <header class="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
      <div class="max-w-screen-xl mx-auto px-6">
        <nav class="flex items-center justify-between h-16">
          <Link
            href="/"
            class="flex items-center gap-2 text-xl font-bold text-text hover:text-primary transition-colors"
          >
            <Icon icon="lucide:zap" width="24" height="24" class="text-primary" />
            <span>Zen</span>
          </Link>
          <div class="flex items-center gap-8">
            <Link href="/" class="text-text-muted hover:text-text transition-colors">
              Home
            </Link>
            <Link href="/docs" class="text-text-muted hover:text-text transition-colors">
              Docs
            </Link>
            <Link href="/playground" class="text-text-muted hover:text-text transition-colors">
              Playground
            </Link>
            <a
              href="https://github.com/SylphxAI/zen"
              target="_blank"
              class="text-text-muted hover:text-text transition-colors"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
