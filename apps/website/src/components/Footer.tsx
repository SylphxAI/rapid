export function Footer() {
  return (
    <footer class="bg-bg-light border-t border-border py-16">
      <div class="max-w-screen-xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <h4 class="text-lg font-semibold text-text mb-4">Zen Ecosystem</h4>
            <p class="text-text-muted mb-4">
              Ultra-fast reactive primitives and fine-grained framework
            </p>
            <div class="flex flex-wrap gap-2">
              <span class="px-3 py-1 bg-bg-lighter border border-border rounded-full text-xs text-primary">
                1.75 KB
              </span>
              <span class="px-3 py-1 bg-bg-lighter border border-border rounded-full text-xs text-primary">
                150M+ ops/sec
              </span>
              <span class="px-3 py-1 bg-bg-lighter border border-border rounded-full text-xs text-primary">
                No VDOM
              </span>
            </div>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-text mb-4">Packages</h4>
            <ul class="space-y-2">
              <li>
                <a href="#/docs" class="text-text-muted hover:text-primary transition-colors">
                  @zen/signal
                </a>
              </li>
              <li>
                <a href="#/docs" class="text-text-muted hover:text-primary transition-colors">
                  @zen/zen
                </a>
              </li>
              <li>
                <a href="#/docs" class="text-text-muted hover:text-primary transition-colors">
                  Integrations
                </a>
              </li>
              <li>
                <a href="#/docs" class="text-text-muted hover:text-primary transition-colors">
                  Utilities
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-text mb-4">Resources</h4>
            <ul class="space-y-2">
              <li>
                <a href="#/docs" class="text-text-muted hover:text-primary transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#/examples" class="text-text-muted hover:text-primary transition-colors">
                  Examples
                </a>
              </li>
              <li>
                <a href="#/playground" class="text-text-muted hover:text-primary transition-colors">
                  Playground
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/SylphxAI/zen"
                  class="text-text-muted hover:text-primary transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-text mb-4">Community</h4>
            <ul class="space-y-2">
              <li>
                <a
                  href="https://github.com/SylphxAI/zen/issues"
                  class="text-text-muted hover:text-primary transition-colors"
                >
                  Issues
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/SylphxAI/zen/discussions"
                  class="text-text-muted hover:text-primary transition-colors"
                >
                  Discussions
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/SylphxAI"
                  class="text-text-muted hover:text-primary transition-colors"
                >
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div class="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-text-muted text-sm">
          <p>© 2024 Zen. MIT License.</p>
          <p>Built with @zen/zen framework</p>
        </div>
      </div>
    </footer>
  );
}
