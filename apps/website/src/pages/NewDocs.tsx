import { computed, effect, signal } from '@zen/signal';
import { For } from '@zen/zen';
import { Icon } from '../components/Icon';
import apiReferenceMd from '../docs/api-reference.md?raw';
import coreConceptsMd from '../docs/core-concepts.md?raw';
import gettingStartedMd from '../docs/getting-started.md?raw';
import { renderMarkdown } from '../utils/markdown';

interface DocSection {
  id: string;
  title: string;
  icon: string;
  content: string;
}

const sections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'lucide:rocket',
    content: gettingStartedMd,
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    icon: 'lucide:book-open',
    content: coreConceptsMd,
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: 'lucide:code-2',
    content: apiReferenceMd,
  },
];

export function NewDocs() {
  const activeSection = signal('getting-started');
  const renderedContent = signal('');

  const currentSection = computed(() => {
    return sections.find((s) => s.id === activeSection.value) || sections[0];
  });

  // Render markdown when section changes
  effect(() => {
    const section = currentSection.value;

    renderMarkdown(section.content).then((html) => {
      renderedContent.value = html;
    });
  });

  return (
    <div class="min-h-screen bg-bg dark:bg-bg-dark">
      <div class="max-w-screen-2xl mx-auto px-6 py-8">
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-text dark:text-text-dark mb-2">Documentation</h1>
          <p class="text-text-muted dark:text-text-dark-muted">
            Learn how to build reactive UIs with Zen
          </p>
        </div>

        <div class="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside class="col-span-12 lg:col-span-3">
            <nav class="sticky top-20 space-y-2">
              <For each={sections}>
                {(section) => (
                  <button
                    type="button"
                    onClick={() => {
                      activeSection.value = section.id;
                    }}
                    class={
                      activeSection.value === section.id
                        ? 'w-full flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-zen font-medium transition-all'
                        : 'w-full flex items-center gap-3 px-4 py-3 bg-bg-light dark:bg-bg-dark-light hover:bg-bg-lighter dark:hover:bg-bg-dark-lighter text-text dark:text-text-dark border border-border dark:border-border-dark hover:border-primary rounded-zen font-medium transition-all'
                    }
                  >
                    <Icon icon={section.icon} width="20" height="20" />
                    <span>{section.title}</span>
                  </button>
                )}
              </For>
            </nav>
          </aside>

          {/* Main Content */}
          <main class="col-span-12 lg:col-span-9">
            <div class="bg-bg-light dark:bg-bg-dark-light border border-border dark:border-border-dark rounded-zen p-8">
              <article
                class="prose prose-invert max-w-none
                  prose-headings:text-text dark:prose-headings:text-text-dark
                  prose-p:text-text-muted dark:prose-p:text-text-dark-muted
                  prose-strong:text-text dark:prose-strong:text-text-dark
                  prose-code:text-primary prose-code:bg-bg-lighter dark:prose-code:bg-bg-dark-lighter prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-bg dark:prose-pre:bg-bg-dark prose-pre:border prose-pre:border-border dark:prose-pre:border-border-dark
                  prose-a:text-primary hover:prose-a:text-primary-dark
                  prose-li:text-text-muted dark:prose-li:text-text-dark-muted
                  animate-fade-in-up"
                innerHTML={renderedContent.value}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
